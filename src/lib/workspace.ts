"use client";

/**
 * Workspace management for team collaboration.
 * Handles workspace CRUD, member management, and role-based access.
 * Data lives in Firestore under workspaces/{wsId}/...
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/config";
import type { WorkspaceDoc, WorkspaceMember, WorkspaceRole } from "@/lib/types";

/* ───────────────────── Collection helpers ───────────────────── */

function userWorkspacesCol(uid: string) {
  return collection(getFirebaseDb(), `user-workspaces/${uid}/workspaces`);
}

function membersCol(wsId: string) {
  return collection(getFirebaseDb(), `workspaces/${wsId}/members`);
}

function wsDoc(wsId: string) {
  return doc(getFirebaseDb(), `workspaces/${wsId}`);
}

/* ───────────────────── Workspace CRUD ───────────────────── */

export async function createWorkspace(name: string): Promise<WorkspaceDoc | null> {
  if (!isFirebaseConfigured()) return null;
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;

  const wsId = crypto.randomUUID();
  const ws: WorkspaceDoc = {
    id: wsId,
    name,
    ownerId: user.uid,
    createdAt: new Date().toISOString(),
  };

  try {
    const batch = writeBatch(getFirebaseDb());

    // Create workspace doc
    batch.set(wsDoc(wsId), { name, ownerId: user.uid, createdAt: ws.createdAt });

    // Add owner as admin member
    batch.set(doc(membersCol(wsId), user.uid), {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? user.email?.split("@")[0] ?? "User",
      photoURL: user.photoURL ?? null,
      role: "admin",
      joinedAt: ws.createdAt,
    });

    // Link workspace to user
    batch.set(doc(userWorkspacesCol(user.uid), wsId), {
      wsId,
      name,
      role: "admin",
      createdAt: ws.createdAt,
    });

    await batch.commit();
    return ws;
  } catch (e) {
    console.error("Failed to create workspace:", e);
    return null;
  }
}

export async function getUserWorkspaces(): Promise<{ wsId: string; name: string; role: WorkspaceRole }[]> {
  if (!isFirebaseConfigured()) return [];
  const user = getFirebaseAuth().currentUser;
  if (!user) return [];

  try {
    const snap = await getDocs(userWorkspacesCol(user.uid));
    return snap.docs.map((d) => {
      const data = d.data();
      return { wsId: data.wsId, name: data.name, role: data.role as WorkspaceRole };
    });
  } catch {
    return [];
  }
}

/* ───────────────────── Member management ───────────────────── */

export async function getMembers(wsId: string): Promise<WorkspaceMember[]> {
  if (!isFirebaseConfigured()) return [];
  try {
    const snap = await getDocs(membersCol(wsId));
    return snap.docs.map((d) => d.data() as WorkspaceMember);
  } catch {
    return [];
  }
}

export async function addMember(wsId: string, email: string, role: WorkspaceRole = "recruiter"): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const caller = getFirebaseAuth().currentUser;
  if (!caller) return false;

  // Verify caller is admin
  const callerMember = await getDoc(doc(membersCol(wsId), caller.uid));
  if (!callerMember.exists() || callerMember.data().role !== "admin") return false;

  try {
    // Look up user by email via a cloud function or direct query
    // For now, store pending invite that activates when user signs up
    const batch = writeBatch(getFirebaseDb());

    // Store as pending member (will be activated on login)
    batch.set(doc(collection(getFirebaseDb(), `workspaces/${wsId}/invites`), email.replace(/[.#$[\]]/g, "_")), {
      email,
      role,
      invitedBy: caller.uid,
      invitedAt: new Date().toISOString(),
      status: "pending",
    });

    await batch.commit();
    return true;
  } catch (e) {
    console.error("Failed to add member:", e);
    return false;
  }
}

export async function acceptInvite(wsId: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const user = getFirebaseAuth().currentUser;
  if (!user || !user.email) return false;

  try {
    const inviteRef = doc(collection(getFirebaseDb(), `workspaces/${wsId}/invites`), user.email.replace(/[.#$[\]]/g, "_"));
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists() || inviteSnap.data().status !== "pending") return false;

    const inviteData = inviteSnap.data();
    const batch = writeBatch(getFirebaseDb());

    // Add as member
    batch.set(doc(membersCol(wsId), user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName ?? user.email.split("@")[0],
      photoURL: user.photoURL ?? null,
      role: inviteData.role,
      joinedAt: new Date().toISOString(),
    });

    // Link to user
    batch.set(doc(userWorkspacesCol(user.uid), wsId), {
      wsId,
      name: (await getDoc(wsDoc(wsId))).data()?.name ?? "Workspace",
      role: inviteData.role,
      createdAt: new Date().toISOString(),
    });

    // Mark invite accepted
    batch.update(inviteRef, { status: "accepted" });

    await batch.commit();
    return true;
  } catch (e) {
    console.error("Failed to accept invite:", e);
    return false;
  }
}

export async function updateMemberRole(wsId: string, memberUid: string, role: WorkspaceRole): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const caller = getFirebaseAuth().currentUser;
  if (!caller) return false;

  const callerMember = await getDoc(doc(membersCol(wsId), caller.uid));
  if (!callerMember.exists() || callerMember.data().role !== "admin") return false;

  try {
    await setDoc(doc(membersCol(wsId), memberUid), { role }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function removeMember(wsId: string, memberUid: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const caller = getFirebaseAuth().currentUser;
  if (!caller) return false;

  const callerMember = await getDoc(doc(membersCol(wsId), caller.uid));
  if (!callerMember.exists() || callerMember.data().role !== "admin") return false;
  if (memberUid === caller.uid) return false; // Can't remove yourself

  try {
    const batch = writeBatch(getFirebaseDb());
    batch.delete(doc(membersCol(wsId), memberUid));
    batch.delete(doc(userWorkspacesCol(memberUid), wsId));
    await batch.commit();
    return true;
  } catch {
    return false;
  }
}

export async function deleteWorkspace(wsId: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  const user = getFirebaseAuth().currentUser;
  if (!user) return false;

  const wsSnap = await getDoc(wsDoc(wsId));
  if (!wsSnap.exists() || wsSnap.data().ownerId !== user.uid) return false;

  try {
    const batch = writeBatch(getFirebaseDb());

    // Delete workspace doc
    batch.delete(wsDoc(wsId));

    // Delete all members
    const membersSnap = await getDocs(membersCol(wsId));
    for (const m of membersSnap.docs) {
      batch.delete(m.ref);
      batch.delete(doc(userWorkspacesCol(m.id), wsId));
    }

    // Delete subcollections (jobs, candidates, activity, invites)
    for (const sub of ["jobs", "candidates", "activity", "invites"]) {
      const subSnap = await getDocs(collection(getFirebaseDb(), `workspaces/${wsId}/${sub}`));
      for (const d of subSnap.docs) batch.delete(d.ref);
    }

    // Remove from owner's workspace list
    batch.delete(doc(userWorkspacesCol(user.uid), wsId));

    await batch.commit();
    return true;
  } catch (e) {
    console.error("Failed to delete workspace:", e);
    return false;
  }
}

export async function checkRole(wsId: string): Promise<WorkspaceRole | null> {
  if (!isFirebaseConfigured()) return null;
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;

  try {
    const memberSnap = await getDoc(doc(membersCol(wsId), user.uid));
    if (!memberSnap.exists()) return null;
    return memberSnap.data().role as WorkspaceRole;
  } catch {
    return null;
  }
}

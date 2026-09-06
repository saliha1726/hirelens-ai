"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import { useUser } from "@/lib/hooks/use-user";
import { getActiveWorkspaceId } from "@/lib/client/store";
import type { WorkspaceRole } from "@/lib/types";

const DEFAULT_ROLE: WorkspaceRole = "admin";

export function useRole(): { role: WorkspaceRole; isAdmin: boolean; isRecruiter: boolean; isViewer: boolean; loading: boolean } {
  const { user, loading: userLoading } = useUser();
  const [role, setRole] = useState<WorkspaceRole>(DEFAULT_ROLE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading || !user) {
      if (!userLoading) setLoading(false);
      return;
    }

    const wsId = getActiveWorkspaceId();
    if (!wsId || wsId === user.uid) {
      setRole("admin");
      setLoading(false);
      return;
    }

    try {
      const db = getFirebaseDb();
      const memberRef = doc(db, "workspaces", wsId, "members", user.uid);

      const unsubscribe = onSnapshot(
        memberRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setRole((data.role as WorkspaceRole) ?? "viewer");
          } else {
            setRole("viewer");
          }
          setLoading(false);
        },
        () => {
          setRole("viewer");
          setLoading(false);
        },
      );

      return () => unsubscribe();
    } catch {
      setRole(DEFAULT_ROLE);
      setLoading(false);
    }
  }, [user, userLoading]);

  return {
    role,
    isAdmin: role === "admin",
    isRecruiter: role === "recruiter",
    isViewer: role === "viewer",
    loading,
  };
}

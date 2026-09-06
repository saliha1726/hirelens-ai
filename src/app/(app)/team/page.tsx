"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Shield, UserCheck, Eye, Crown, Loader2, ArrowLeft } from "lucide-react";
import { useUser } from "@/lib/hooks/use-user";
import {
  createWorkspace,
  getUserWorkspaces,
  getMembers,
  addMember,
  updateMemberRole,
  removeMember,
  deleteWorkspace,
} from "@/lib/workspace";
import { setActiveWorkspace } from "@/lib/client/store";
import type { WorkspaceMember, WorkspaceRole } from "@/lib/types";
import { Card, CardContent, Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<WorkspaceRole, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  admin: { label: "Admin", icon: Crown, color: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  recruiter: { label: "Recruiter", icon: UserCheck, color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  viewer: { label: "Viewer", icon: Eye, color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

export default function TeamSettingsPage() {
  const { user } = useUser();
  const [workspaces, setWorkspaces] = useState<{ wsId: string; name: string; role: WorkspaceRole }[]>([]);
  const [activeWs, setActiveWs] = useState<string | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWsName, setNewWsName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("recruiter");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadWorkspaces() {
    setLoading(true);
    const ws = await getUserWorkspaces();
    setWorkspaces(ws);
    if (ws.length > 0 && !activeWs) {
      setActiveWs(ws[0].wsId);
      await loadMembers(ws[0].wsId);
    }
    setLoading(false);
  }

  async function loadMembers(wsId: string) {
    const m = await getMembers(wsId);
    setMembers(m);
  }

  async function handleCreateWorkspace() {
    if (!newWsName.trim()) return;
    setCreating(true);
    setError("");
    const ws = await createWorkspace(newWsName.trim());
    if (ws) {
      setNewWsName("");
      await loadWorkspaces();
    } else {
      setError("Failed to create workspace");
    }
    setCreating(false);
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !activeWs) return;
    setError("");
    const ok = await addMember(activeWs, inviteEmail.trim(), inviteRole);
    if (ok) {
      // Send invite email
      const ws = workspaces.find((w) => w.wsId === activeWs);
      try {
        await fetch("/api/send-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: inviteEmail.trim(),
            workspaceName: ws?.name ?? "workspace",
            inviterName: user?.displayName ?? user?.email?.split("@")[0] ?? "A team member",
            role: inviteRole,
          }),
        });
      } catch {
        // Email send failed but invite was created
      }
      setInviteEmail("");
      await loadMembers(activeWs);
    } else {
      setError("Failed to invite member. Make sure you are an admin.");
    }
  }

  async function handleRoleChange(memberUid: string, role: WorkspaceRole) {
    if (!activeWs) return;
    await updateMemberRole(activeWs, memberUid, role);
    await loadMembers(activeWs);
  }

  async function handleRemoveMember(memberUid: string) {
    if (!activeWs || !confirm("Remove this member from the workspace?")) return;
    await removeMember(activeWs, memberUid);
    await loadMembers(activeWs);
  }

  async function handleDeleteWorkspace() {
    if (!activeWs || !confirm("Delete this workspace and ALL its data? This cannot be undone.")) return;
    await deleteWorkspace(activeWs);
    setActiveWs(null);
    setMembers([]);
    await loadWorkspaces();
  }

  const myRole = workspaces.find((w) => w.wsId === activeWs)?.role;
  const isAdmin = myRole === "admin";

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Team Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage workspaces, members, and roles.
        </p>
      </div>

      {/* Workspace selector */}
      <Card>
        <CardContent className="pt-5">
          <h2 className="mb-3 text-sm font-semibold">Workspaces</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const uid = user?.uid;
                if (uid) {
                  setActiveWs(uid);
                  setActiveWorkspace(uid);
                  loadMembers(uid);
                }
              }}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                activeWs === user?.uid
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-950/50 dark:text-brand-300"
                  : "border-slate-200 hover:border-brand-300 dark:border-slate-700",
              )}
            >
              Personal
            </button>
            {workspaces.map((ws) => (
              <button
                key={ws.wsId}
                onClick={() => { setActiveWs(ws.wsId); setActiveWorkspace(ws.wsId); loadMembers(ws.wsId); }}
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                  activeWs === ws.wsId
                    ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-950/50 dark:text-brand-300"
                    : "border-slate-200 hover:border-brand-300 dark:border-slate-700",
                )}
              >
                {ws.name}
                <span className="ml-1.5 text-[10px] text-slate-400 capitalize">({ws.role})</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
              placeholder="New workspace name"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
            />
            <Button onClick={handleCreateWorkspace} disabled={creating || !newWsName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
        </CardContent>
      </Card>

      {activeWs && (
        <>
          {/* Members */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Members ({members.length})</h2>
                {isAdmin && <span className="text-[10px] font-medium text-amber-600">Admin</span>}
              </div>

              <div className="mt-4 space-y-2">
                {members.map((m) => {
                  const roleInfo = ROLE_CONFIG[m.role];
                  const RoleIcon = roleInfo.icon;
                  return (
                    <div key={m.uid} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-pink-500 text-sm font-bold text-white">
                        {(m.displayName ?? m.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{m.displayName}</p>
                        <p className="text-xs text-slate-400">{m.email}</p>
                      </div>
                      {isAdmin && m.uid !== user?.uid ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.uid, e.target.value as WorkspaceRole)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                          >
                            <option value="admin">Admin</option>
                            <option value="recruiter">Recruiter</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(m.uid)}
                            className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", roleInfo.color)}>
                          <RoleIcon className="h-3 w-3" /> {roleInfo.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {isAdmin && (
                <div className="mt-4 flex gap-2">
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    placeholder="Email to invite"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                    className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="recruiter">Recruiter</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
                    <Plus className="h-4 w-4 mr-1" /> Invite
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger zone */}
          {isAdmin && (
            <Card className="border-rose-200 dark:border-rose-900">
              <CardContent className="pt-5">
                <h2 className="text-sm font-semibold text-rose-600">Danger Zone</h2>
                <p className="mt-1 text-xs text-slate-500">Permanently delete this workspace and all its data.</p>
                <Button variant="outline" className="mt-3 border-rose-300 text-rose-600 hover:bg-rose-50" onClick={handleDeleteWorkspace}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete workspace
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

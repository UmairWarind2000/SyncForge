// src/components/workspace/WorkspaceSettingsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings, Users, Trash2, UserMinus,
  Loader2, Save, UserPlus, Crown, Shield, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { formatDate } from "@/lib/utils";
import { WORKSPACE_COLORS } from "@/lib/design";

interface Member {
  userId:   string;
  role:     string;
  joinedAt: Date;
  user: {
    id:    string;
    name:  string | null;
    email: string | null;
    image: string | null;
  };
}

interface Workspace {
  id:          string;
  name:        string;
  description: string | null;
  color:       string;
  createdAt:   Date;
  ownerId:     string;
  members:     Member[];
}

interface Props {
  workspace:     Workspace;
  currentUserId: string;
  isOwner:       boolean;
  userRole:      string;
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  OWNER:  <Crown  className="h-3 w-3" />,
  ADMIN:  <Shield className="h-3 w-3" />,
  MEMBER: <Users  className="h-3 w-3" />,
  VIEWER: <Eye    className="h-3 w-3" />,
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  OWNER:  { bg: "#7c6ef720", color: "#7c6ef7" },
  ADMIN:  { bg: "#06b6d420", color: "#06b6d4" },
  MEMBER: { bg: "#22222280", color: "#888888" },
  VIEWER: { bg: "#22222280", color: "#555555" },
};

export function WorkspaceSettingsClient({
  workspace,
  currentUserId,
  isOwner,
  userRole,
}: Props) {
  const router = useRouter();

  // General settings state
  const [name, setName]         = useState(workspace.name);
  const [description, setDesc]  = useState(workspace.description ?? "");
  const [color, setColor]       = useState(workspace.color);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg]   = useState("");

  // Invite state
  const [inviteEmail, setInviteEmail]     = useState("");
  const [isInviting, setIsInviting]       = useState(false);
  const [inviteError, setInviteError]     = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Delete state
  const [showDelete, setShowDelete]         = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState("");
  const [isDeleting, setIsDeleting]         = useState(false);

  // Members state
  const [members, setMembers] = useState(workspace.members);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveMsg("");
    const res  = await fetch(`/api/workspaces/${workspace.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, color }),
    });
    const data = await res.json();
    setIsSaving(false);
    if (data.success) {
      setSaveMsg("Saved successfully");
      router.refresh();
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setIsInviting(true);
    setInviteError("");
    setInviteSuccess("");
    const res  = await fetch(`/api/workspaces/${workspace.id}/members`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json();
    setIsInviting(false);
    if (!data.success) {
      setInviteError(data.error);
    } else {
      setInviteSuccess(`${inviteEmail} added to workspace`);
      setInviteEmail("");
      router.refresh();
    }
  }

  async function handleRemoveMember(userId: string) {
    const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== workspace.name) return;
    setIsDeleting(true);
    const res = await fetch(`/api/workspaces/${workspace.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setIsDeleting(false);
    }
  }

  const sectionStyle = {
    background: "var(--color-surface)",
    border:     "1px solid var(--color-border)",
    borderRadius: "12px",
    padding:    "20px",
    marginBottom: "16px",
  };

  const headingStyle = {
    fontSize:   "13px",
    fontWeight: "600" as const,
    color:      "var(--color-text-primary)",
    marginBottom: "4px",
    display:    "flex",
    alignItems: "center",
    gap:        "8px",
  };

  const subStyle = {
    fontSize: "12px",
    color:    "var(--color-text-muted)",
    marginBottom: "16px",
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Manage {workspace.name}
        </p>
      </div>

      {/* ── General ── */}
      {(isOwner || userRole === "ADMIN") && (
        <div style={sectionStyle}>
          <div style={headingStyle}>
            <Settings className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
            General
          </div>
          <p style={subStyle}>Update workspace name, description, and color.</p>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Workspace name</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ws-desc">Description</Label>
              <Input
                id="ws-desc"
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What is this workspace for?"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label>Accent color</Label>
              <div className="flex gap-2 flex-wrap">
                {WORKSPACE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      background:    c,
                      outline:       color === c ? `2px solid ${c}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save changes
              </Button>
              {saveMsg && (
                <span className="text-xs" style={{ color: "var(--color-success)" }}>
                  {saveMsg}
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── Members ── */}
      <div style={sectionStyle}>
        <div style={headingStyle}>
          <Users className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
          Members
          <span
            className="text-xs px-2 py-0.5 rounded-full font-normal"
            style={{
              background: "var(--color-surface-3)",
              color:      "var(--color-text-muted)",
            }}
          >
            {members.length}
          </span>
        </div>
        <p style={subStyle}>People with access to this workspace.</p>

        {/* Invite form */}
        {(isOwner || userRole === "ADMIN") && (
          <form onSubmit={handleInvite} className="flex gap-2 mb-5">
            <Input
              type="email"
              placeholder="Invite by email address..."
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              disabled={isInviting}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={isInviting || !inviteEmail.trim()}>
              {isInviting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              Invite
            </Button>
          </form>
        )}

        {inviteError && (
          <div
            className="rounded-lg px-3 py-2 text-xs mb-3"
            style={{ background: "var(--color-danger-muted)", color: "var(--color-danger)" }}
          >
            {inviteError}
          </div>
        )}
        {inviteSuccess && (
          <div
            className="rounded-lg px-3 py-2 text-xs mb-3"
            style={{ background: "var(--color-success-muted)", color: "var(--color-success)" }}
          >
            {inviteSuccess}
          </div>
        )}

        {/* Member list */}
        <div className="space-y-2">
          {members.map(({ user, role, joinedAt }) => {
            const roleStyle   = ROLE_COLORS[role] ?? ROLE_COLORS.MEMBER;
            const canRemove   = isOwner && user.id !== currentUserId;
            return (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5"
                style={{ background: "var(--color-surface-2)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar name={user.name} image={user.image} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                      {user.name}
                      {user.id === currentUserId && (
                        <span className="ml-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="hidden sm:flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={roleStyle}
                  >
                    {ROLE_ICONS[role]}
                    {role.toLowerCase()}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <span className="hidden sm:inline">
                      {formatDate(joinedAt)}
                    </span>
                  </span>
                  {canRemove && (
                    <button
                      onClick={() => handleRemoveMember(user.id)}
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: "var(--color-text-muted)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "var(--color-danger-muted)";
                        (e.currentTarget as HTMLElement).style.color = "var(--color-danger)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
                      }}
                      title="Remove member"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Danger zone ── */}
      {isOwner && (
        <div
          style={{
            ...sectionStyle,
            border: "1px solid var(--color-danger)",
            borderOpacity: "0.3",
          }}
        >
          <div style={{ ...headingStyle, color: "var(--color-danger)" }}>
            <Trash2 className="h-4 w-4" />
            Danger zone
          </div>
          <p style={subStyle}>
            Permanently delete this workspace and all its data. This cannot be undone.
          </p>

          {!showDelete ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete workspace
            </Button>
          ) : (
            <div
              className="rounded-lg p-4 space-y-3"
              style={{ background: "var(--color-danger-muted)" }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--color-danger)" }}>
                Type <strong>{workspace.name}</strong> to confirm deletion
              </p>
              <Input
                placeholder={workspace.name}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                style={{
                  background:  "var(--color-surface)",
                  borderColor: "var(--color-danger)",
                }}
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteConfirm !== workspace.name || isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Permanently delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
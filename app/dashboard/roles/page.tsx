"use client";

import { useState } from "react";
import { Shield, Plus, Edit3, Trash2, Users, Key, X, Check } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
}

const defaultPermissions = [
  "library:view", "library:create", "library:edit", "library:delete",
  "borrow:request", "borrow:approve", "borrow:return",
  "users:view", "users:create", "users:edit",
  "courses:view", "courses:create", "courses:enroll",
  "publications:submit", "publications:approve",
  "reports:view",
  "roles:manage",
];

const permissionLabels: Record<string, string> = {
  "library:view": "View Library Resources",
  "library:create": "Create Resources",
  "library:edit": "Edit Resources",
  "library:delete": "Delete Resources",
  "borrow:request": "Request Borrow",
  "borrow:approve": "Approve Borrow",
  "borrow:return": "Process Return",
  "users:view": "View Users",
  "users:create": "Create Users",
  "users:edit": "Edit Users",
  "courses:view": "View Courses",
  "courses:create": "Create Courses",
  "courses:enroll": "Enroll in Courses",
  "publications:submit": "Submit Publications",
  "publications:approve": "Approve Publications",
  "reports:view": "View Reports",
  "roles:manage": "Manage Roles",
};

const initialRoles: Role[] = [
  { id: "1", name: "Admin", description: "Full platform control", userCount: 2, permissions: defaultPermissions },
  { id: "2", name: "Manager", description: "Library, publishing, research, e-learning operations", userCount: 5, permissions: defaultPermissions.filter(p => !p.includes("roles:manage") && !p.includes("users:delete")) },
  { id: "3", name: "Staff", description: "Day-to-day operations: borrow/return, content moderation", userCount: 8, permissions: ["library:view", "library:create", "library:edit", "borrow:approve", "borrow:return", "users:view"] },
  { id: "4", name: "Contributor", description: "Authors and researchers", userCount: 12, permissions: ["library:view", "borrow:request", "courses:view", "courses:enroll", "publications:submit"] },
  { id: "5", name: "Member", description: "Students and readers", userCount: 1240, permissions: ["library:view", "borrow:request", "courses:view", "courses:enroll"] },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "", permissions: [] as string[] });

  const handleEdit = (role: Role) => setEditingRole({ ...role });
  const handleDelete = (id: string) => setRoles(roles.filter((r) => r.id !== id));

  const handleTogglePerm = (role: Role, perm: string) => {
    const updated = role.permissions.includes(perm)
      ? role.permissions.filter((p) => p !== perm)
      : [...role.permissions, perm];
    if (editingRole && editingRole.id === role.id) {
      setEditingRole({ ...editingRole, permissions: updated });
    }
  };

  const handleSave = (role: Role) => {
    setRoles(roles.map((r) => (r.id === role.id ? role : r)));
    setEditingRole(null);
  };

  const handleCreate = () => {
    if (!newRole.name.trim()) return;
    const role: Role = {
      id: String(Date.now()),
      name: newRole.name,
      description: newRole.description,
      userCount: 0,
      permissions: newRole.permissions,
    };
    setRoles([...roles, role]);
    setShowCreate(false);
    setNewRole({ name: "", description: "", permissions: [] });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <Shield size={22} color="var(--gold)" />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Cinzel',serif" }}>ROLE & PERMISSION MANAGEMENT</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Create and manage roles, assign permissions to control access</div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
        >
          <Plus size={14} /> New Role
        </button>
      </div>

      {/* Role Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
        {roles.map((role) => (
          <div key={role.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Shield size={18} color="var(--gold)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{role.name}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{role.description}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-muted)" }}>
                <Users size={12} /> {role.userCount}
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
              {role.permissions.slice(0, 4).map((p) => (
                <span key={p} style={{ fontSize: 8, background: "var(--bg-subtle)", border: "1px solid var(--border-light)", borderRadius: 3, padding: "2px 5px", color: "var(--text-muted)" }}>{permissionLabels[p] || p}</span>
              ))}
              {role.permissions.length > 4 && (
                <span style={{ fontSize: 8, color: "var(--text-muted)" }}>+{role.permissions.length - 4} more</span>
              )}
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button onClick={() => handleEdit(role)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 10, color: "var(--text-secondary)" }}>
                <Edit3 size={12} /> Edit
              </button>
              <button onClick={() => handleDelete(role.id)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 10, color: "var(--red-light)" }}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingRole && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px", width: 500, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Shield size={18} color="var(--gold)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Edit Role: {editingRole.name}</span>
              <button onClick={() => setEditingRole(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={16} /></button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Permissions</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {defaultPermissions.map((perm) => (
                  <label key={perm} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-secondary)", cursor: "pointer", padding: "3px 0" }}>
                    <input
                      type="checkbox"
                      checked={editingRole.permissions.includes(perm)}
                      onChange={() => handleTogglePerm(editingRole, perm)}
                      style={{ accentColor: "var(--gold)" }}
                    />
                    {permissionLabels[perm] || perm}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditingRole(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 5, padding: "6px 14px", cursor: "pointer", fontSize: 11, color: "var(--text-secondary)" }}>Cancel</button>
              <button onClick={() => handleSave(editingRole)} style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 5, padding: "6px 14px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                <Check size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px", width: 450 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Shield size={18} color="var(--gold)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Create New Role</span>
              <button onClick={() => setShowCreate(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={16} /></button>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Role Name</label>
              <input value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} placeholder="e.g. Editor" style={{ width: "100%", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 5, padding: "8px 10px", fontSize: 12, color: "var(--text-primary)", outline: "none" }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Description</label>
              <input value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} placeholder="Brief description of this role" style={{ width: "100%", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 5, padding: "8px 10px", fontSize: 12, color: "var(--text-primary)", outline: "none" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Permissions</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                {defaultPermissions.map((perm) => (
                  <label key={perm} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-secondary)", cursor: "pointer", padding: "3px 0" }}>
                    <input
                      type="checkbox"
                      checked={newRole.permissions.includes(perm)}
                      onChange={() => setNewRole({
                        ...newRole,
                        permissions: newRole.permissions.includes(perm)
                          ? newRole.permissions.filter((p) => p !== perm)
                          : [...newRole.permissions, perm],
                      })}
                      style={{ accentColor: "var(--gold)" }}
                    />
                    {permissionLabels[perm] || perm}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 5, padding: "6px 14px", cursor: "pointer", fontSize: 11, color: "var(--text-secondary)" }}>Cancel</button>
              <button onClick={handleCreate} style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--gold)", color: "#fff", border: "none", borderRadius: 5, padding: "6px 14px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                <Plus size={14} /> Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

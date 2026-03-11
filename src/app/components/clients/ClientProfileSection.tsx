"use client";

import { useState } from "react";
import { Pencil, X, Phone, User } from "lucide-react";
import { ClientProfileEditor } from "./ClientProfileEditor";
import { formatPhoneDisplay } from "@/app/utils/format/formatPhoneNumber";
import { UserWithProfile } from "@/types/user";

export default function ClientProfileSection({
  user,
}: {
  user: UserWithProfile;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const profile = user.profile;
  const role = user.role;
  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "—";

  return (
    <>
      {/* Profile Card */}
      <section className="mx-5 mb-4 bg-white border border-surface2 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface2">
          <div className="flex items-center gap-3">
            <div className="trainer-avatar text-lg">
              {profile?.firstName?.[0] ?? "?"}
            </div>
            <div>
              <p className="font-syne font-bold text-base text-muted">
                {fullName}
              </p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-muted hover:text-secondary-color hover:border-secondary-color/30 transition-colors text-sm font-medium"
          >
            <Pencil size={13} />
          </button>
        </div>

        {/* Info rows */}
        <div className="divide-y divide-surface2">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-xl bg-secondary-color/10 flex items-center justify-center flex-shrink-0">
              <Phone size={14} className="text-secondary-color" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted mb-0.5">
                Phone
              </p>
              {profile?.phone ? (
                <a
                  href={`tel:${profile.phone}`}
                  className="text-sm font-medium text-muted hover:text-secondary-color transition-colors"
                >
                  {formatPhoneDisplay(profile.phone)}
                </a>
              ) : (
                <p className="text-sm text-muted italic">Not provided</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-xl bg-secondary-color/10 flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-secondary-color" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted mb-0.5">
                Role
              </p>
              {role ? (
                <p className="text-sm font-medium text-muted">{role}</p>
              ) : (
                <p className="text-sm text-muted italic">Not provided</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white border border-surface2 rounded-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface2 sticky top-0 bg-white z-10">
              <h3 className="font-syne font-bold text-base text-muted">
                Edit Profile
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-muted hover:text-muted transition-colors"
              >
                <X size={15} />
              </button>
            </div>
            <ClientProfileEditor
              clientId={user.id}
              firstName={profile?.firstName}
              lastName={profile?.lastName}
              email={user.email}
              phone={profile?.phone ?? ""}
              onSave={() => setIsEditing(false)}
              role={role}
            />
          </div>
        </div>
      )}
    </>
  );
}

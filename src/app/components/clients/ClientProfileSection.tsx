"use client";
import { useState } from "react";
import {
  Pencil,
  X,
  Phone,
  Mail,
  Calendar,
  Dumbbell,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import { ClientProfileEditor } from "./ClientProfileEditor";
import { ClientProfilePageUser } from "@/types/client";
import { formatDateFromInputReturnString } from "@/app/utils/format/formatDateFromInput";
import { formatPhoneDisplay } from "@/app/utils/format/formatPhoneNumber";

export default function ClientProfileSection({
  user,
}: {
  user: ClientProfilePageUser;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const profile = user.profile;
  const role = user.role;
  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "—";

  return (
    <>
      {/* Profile Card */}
      <section className="mx-5 mb-4  bg-white border border-surface2 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface2">
          <div className="flex items-center gap-3">
            {/* Avatar */}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-muted hover:text-lime-green hover:border-lime-green/30 transition-colors text-sm font-medium"
          >
            <Pencil size={13} />
          </button>
        </div>

        {/* Info rows */}
        <div className="divide-y divide-surface2">
          {/* Phone */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-xl bg-lime-green/10 flex items-center justify-center flex-shrink-0">
              <Phone size={14} className="text-lime-green" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted mb-0.5">
                Phone
              </p>
              {profile?.phone ? (
                <a
                  href={`tel:${profile.phone}`}
                  className="text-sm font-medium text-muted hover:text-lime-green transition-colors"
                >
                  {formatPhoneDisplay(profile.phone)}
                </a>
              ) : (
                <p className="text-sm text-muted italic">Not provided</p>
              )}
            </div>
          </div>

          {/* DOB */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-xl bg-lime-green/10 flex items-center justify-center flex-shrink-0">
              <Calendar size={14} className="text-lime-green" />
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted mb-0.5">
                Date of Birth
              </p>
              <p className="text-sm font-medium text-muted">
                {profile?.dob
                  ? formatDateFromInputReturnString(profile.dob)
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Experience */}
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-xl bg-lime-green/10 flex items-center justify-center flex-shrink-0">
              <Dumbbell size={14} className="text-lime-green" />
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted mb-0.5">
                Experience
              </p>
              <p className="text-sm font-medium text-muted">
                {profile?.experience || "Not specified"}
              </p>
            </div>
          </div>

          {/* Injuries */}
          {profile?.injuryNotes && (
            <div className="flex items-start gap-3 px-5 py-3.5">
              <div className="w-8 h-8 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle size={14} className="text-danger" />
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-danger/80 mb-0.5">
                  Injuries / Limitations
                </p>
                <p className="text-sm text-muted/80 ">{profile.injuryNotes}</p>
              </div>
            </div>
          )}

          {/* Waiver */}
          {profile?.waiverSignedAt && (
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-8 h-8 rounded-xl bg-mint/10 flex items-center justify-center flex-shrink-0">
                <FileCheck size={14} className="text-mint" />
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted mb-0.5">
                  Waiver {profile.waiverVersion}
                </p>
                <a
                  href="/waiver"
                  target="_blank"
                  className="text-sm font-medium text-mint hover:underline"
                >
                  Signed {new Date(profile.waiverSignedAt).toLocaleDateString()}
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* EDIT MODAL */}
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
              dob={profile?.dob}
              experience={profile?.experience}
              injuryNotes={profile?.injuryNotes}
              phone={profile?.phone}
              email={user.email}
              onSave={() => setIsEditing(false)}
              role={role}
            />
          </div>
        </div>
      )}
    </>
  );
}

"use client";
import { sendWelcomeEmail } from "@/lib/email-templates/welcomeEmail";
import { Mail } from "lucide-react";
import { useTransition } from "react";

export function ResendInviteButton({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => sendWelcomeEmail(email))}
      title="Resend invite email"
      className="w-7 h-7 rounded-lg bg-lime-green/10 border border-lime-green/20 flex items-center justify-center text-lime-green hover:bg-lime-green/20 hover:border-lime-green/40 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Mail size={13} />
    </button>
  );
}
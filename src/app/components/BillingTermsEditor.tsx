"use client";

import { useRouter } from "next/navigation";
import { updateProjectBillingTerms } from "@/app/(team)/projects/actions";
import { useState } from "react";

export default function BillingTermsEditor({
  projectId,
  billingTerms,
}: {
  projectId: string;
  billingTerms: string | null;
}) {
  const router = useRouter();
  const [saveText, setSaveText] = useState("Save");
  
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setSaveText("Saving...");
        await updateProjectBillingTerms(formData);
        router.refresh();
        setSaveText("Saved!");
      }}
      className="flex items-center gap-2 mt-2"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <select
        name="billingTerms"
        defaultValue={billingTerms ?? ""}
        className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 bg-[#F0EEE9] text-[#666] rounded-lg border-none focus:outline-none cursor-pointer"
      >
        <option value="">No terms</option>
        <option value="NET30">Net 30</option>
        <option value="PROGRESS">Progress Billing</option>
        <option value="PREPAID">Prepaid</option>
      </select>
      <button
        type="submit"
        className="text-[10px] text-[#999] hover:text-[#111] transition-colors"
      >
        {saveText}
      </button>
    </form>
  );
}

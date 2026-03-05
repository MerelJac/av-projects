export type Program = {
  id: string;
  name: string;
  notes?: string | null;

  trainerId: string;

  isTemplate?: boolean; // future-proofing (duplication)
  version?: number; // for later versioning

  createdAt?: Date;
};

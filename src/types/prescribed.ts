export type BodyweightPrescribed = {
  kind: "bodyweight";
  sets: number;
  reps: number;
};

export type HybridPrescribed = {
  kind: "hybrid";
  sets: number;
  reps: number;
  weight: number | null;
  duration: number | null;
};

export type StrengthPrescribed = {
  kind: "strength";
  sets: number;
  reps: number;
  weight: number | null;
};

export type TimedPrescribed = {
  kind: "timed";
  duration: number;
};

export type CorePrescribed = {
  kind: "core";
  duration: number | null;
  sets: number | null;
  reps: number | null;
  weight: number | null;
};

export type MobilityPrescribed = {
  kind: "mobility";
  duration: number | null;
  sets: number | null;
  reps: number | null;
  weight: number | null;
};

export type Prescribed =
  | StrengthPrescribed
  | TimedPrescribed
  | BodyweightPrescribed
  | HybridPrescribed
  | CorePrescribed
  | MobilityPrescribed;

export type StrengthPerformed = {
  kind: "strength";
  sets: {
    reps: number;
    weight: number | null;
  }[];
};

export type HybridPerformed = {
  kind: "hybrid";
  sets: {
    reps: number;
    weight: number | null;
    duration: number | null;
  }[];
};

export type BodyweightPerformed = {
  kind: "bodyweight";
  sets: {
    reps: number;
  }[];
};

export type TimedPerformed = {
  kind: "timed";
  duration: number;
};

export type CorePerformed = {
  kind: "core";
  sets: {
    reps: number;
    weight: number | null;
    duration: number;
  }[];
};

export type MobilityPerformed = {
  kind: "mobility";
  sets: {
    reps: number;
    weight: number | null;
    duration: number;
  }[];
};

export type Performed =
  | StrengthPerformed
  | HybridPerformed
  | BodyweightPerformed
  | TimedPerformed
  | CorePerformed
  | MobilityPerformed;

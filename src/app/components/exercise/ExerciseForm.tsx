import { Exercise } from "@prisma/client";

const inputCls = "w-full px-4 py-2.5 bg-white border border-lime-green/30 rounded-xl text-foreground text-sm placeholder:text-muted focus:border-lime-green/60 focus:ring-1 focus:ring-lime-green/30 outline-none transition";
const labelCls = "block text-[10px] font-semibold tracking-widest uppercase text-muted mb-1.5";

type Props = {
  exercise?: Exercise;
  action: (formData: FormData) => Promise<void>;
  title: string;
  submitLabel?: string;
};

export default function ExerciseForm({
  exercise,
  action,
  title,
  submitLabel = "Save Exercise",
}: Props) {
  return (
    <form
      action={action}
      className="bg-white border border-surface2 rounded-2xl p-6 space-y-6 bg-white"
    >
      <h1 className="font-syne font-extrabold text-2xl text-foreground tracking-tight">
        {title}
      </h1>

      <div className="space-y-5">

        <div>
          <label htmlFor="name" className={labelCls}>Exercise Name</label>
          <input
            id="name" name="name"
            placeholder="e.g. Barbell Back Squat"
            defaultValue={exercise?.name ?? ""}
            required autoFocus
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="type" className={labelCls}>Exercise Type</label>
          <select
            id="type" name="type"
            defaultValue={exercise?.type ?? "STRENGTH"}
            className={inputCls}
          >
            <option value="STRENGTH">Strength</option>
            <option value="TIMED">Timed</option>
            <option value="HYBRID">Hybrid</option>
            <option value="BODYWEIGHT">Bodyweight</option>
            <option value="CORE">Core</option>
            <option value="MOBILITY">Mobility</option>
          </select>
        </div>

        <div>
          <label htmlFor="equipment" className={labelCls}>Equipment <span className="normal-case tracking-normal font-normal">(optional)</span></label>
          <input
            id="equipment" name="equipment"
            placeholder="e.g. Barbell, Bench"
            defaultValue={exercise?.equipment ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="muscleGroup" className={labelCls}>Muscle Group <span className="normal-case tracking-normal font-normal">(optional)</span></label>
          <input
            id="muscleGroup" name="muscleGroup"
            placeholder="e.g. Upper Back / Shoulders"
            defaultValue={exercise?.muscleGroup ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="videoUrl" className={labelCls}>Demo Video URL <span className="normal-case tracking-normal font-normal">(optional)</span></label>
          <input
            id="videoUrl" name="videoUrl"
            placeholder="https://youtube.com/watch?v=..."
            defaultValue={exercise?.videoUrl ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="notes" className={labelCls}>Coaching Cues / Notes</label>
          <textarea
            id="notes" name="notes"
            placeholder="e.g. Keep chest up, drive through heels, brace core..."
            defaultValue={exercise?.notes ?? ""}
            rows={4}
            className={`${inputCls} resize-y`}
          />
        </div>

      </div>

      <input type="hidden" name="exerciseId" value={exercise?.id} />

      <button
        type="submit"
        className="w-full py-2.5 bg-lime-green text-black font-syne font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition"
      >
        {submitLabel}
      </button>
    </form>
  );
}
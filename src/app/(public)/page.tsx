import Link from "next/link";

export default function PublicLandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className="max-w-3xl mx-auto px-6 py-28 text-center space-y-8">
          <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-color/10 border border-secondary-color/20 text-secondary-color text-xs font-semibold tracking-widest uppercase">
            For Trainers & Athletes
          </div>
          <p className="animate-fade-up-2 text-lg text-muted max-w-xl mx-auto leading-relaxed">
            AV Projects helps trainers and clients plan workouts, track progress,
            and stay accountable — all in one simple platform.
          </p>
          <div className="animate-fade-up-3 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-secondary-color text-black font-syne font-bold text-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
            >
              Get started →
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl border border-surface2 text-muted text-sm font-medium hover:text-foreground hover:border-secondary-color/30 transition-all duration-150"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-surface border-t border-surface2">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center space-y-3 mb-14 animate-fade-up">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted">
              Everything you need
            </p>
            <h2 className="font-syne font-extrabold text-3xl text-foreground tracking-tight">
              Built for how you actually train
            </h2>
            <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
              Everything a coach needs to run their clients, and everything an athlete needs to stay on track.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="animate-fade-up-1">
              <Feature
                icon="🏋️"
                title="Workout Programming"
                description="Create, assign, and manage structured training programs with ease."
                stat="Unlimited programs"
              />
            </div>
            <div className="animate-fade-up-2">
              <Feature
                icon="📈"
                title="Progress Tracking"
                description="Log workouts, monitor 1RM changes, and visualize gains over time."
                stat="Every set. Every rep."
                highlight
              />
            </div>
            <div className="animate-fade-up-3">
              <Feature
                icon="🤝"
                title="Trainer & Client Tools"
                description="Built for both coaches and athletes, with clear communication and insights."
                stat="Real-time updates"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background border-t border-surface2">
        <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-6 animate-fade-up">
          <h2 className="font-syne font-extrabold text-4xl text-foreground tracking-tight">
            Start training<br />
            <span className="text-secondary-color">smarter today.</span>
          </h2>
          <p className="text-muted">
            Join AV Projects and take control of your training experience.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 rounded-xl bg-secondary-color text-black font-syne font-bold text-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
          >
            Create an account
          </Link>
        </div>
      </section>
    </>
  );
}

function Feature({
  icon, title, description, stat, highlight = false,
}: {
  icon: string; title: string; description: string; stat?: string; highlight?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl p-6 space-y-4 border transition-all duration-300 overflow-hidden h-full hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 ${
      highlight
        ? "bg-secondary-color/5 border-secondary-color/25 hover:border-secondary-color/50"
        : "bg-background border-surface2 hover:border-secondary-color/20"
    }`}>
      {highlight && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary-color to-[#3dffa0]" />
      )}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-secondary-color/10 flex items-center justify-center text-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
        {stat && (
          <span className="text-[10px] font-semibold tracking-widest uppercase text-secondary-color/70 bg-secondary-color/10 px-2.5 py-1 rounded-full">
            {stat}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        <h3 className="font-syne font-bold text-base text-foreground">{title}</h3>
        <p className="text-sm text-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
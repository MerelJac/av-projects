import Link from "next/link";

export default function PublicLandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className="max-w-3xl mx-auto px-6 py-28 text-center space-y-8">
          <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-color/10 border border-secondary-color/20 text-secondary-color text-xs font-semibold tracking-widest uppercase">
            For AV at Call One, Inc.
          </div>
          <p className="animate-fade-up-2 text-lg text-muted max-w-xl mx-auto leading-relaxed">
           Manage Projects better.
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




    </>
  );
}

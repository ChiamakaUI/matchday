"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Target, Zap, DollarSign, Shield } from "lucide-react";
import { useAuth } from "@/hooks";

export default function LandingPage() {
  const { authenticated, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authenticated) router.push("/home");
  }, [authenticated, router]);

  if (authenticated) return null;

  return (
    <div className="min-h-screen bg-surface-base overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gold-400/15 flex items-center justify-center">
            <Trophy className="h-4.5 w-4.5 text-gold-400" />
          </div>
          <span className="text-lg font-display font-bold tracking-tight">
            MatchDay
          </span>
        </div>
        <button
          onClick={login}
          className="px-5 py-2.5 bg-gold-400 text-surface-base text-sm font-display font-bold rounded-xl hover:bg-gold-300 transition-colors"
        >
          Launch App
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center relative">
        {/* Subtle radial glow behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gold-400/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <p className="text-sm font-mono font-medium text-gold-400 tracking-widest uppercase mb-6">
            World Cup 2026
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-[0.95] tracking-tight mb-6">
            Predict the match.
            <br />
            <span className="text-gold-gradient">Win the prize.</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed">
            Make match predictions for every World Cup game. Stake your
            confidence. Compete on live leaderboards. Winners get paid in USDC
            on Solana.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={login}
              className="px-8 py-3.5 bg-gold-400 text-surface-base font-display font-bold rounded-xl text-base hover:bg-gold-300 transition-colors gold-glow"
            >
              Start Predicting
            </button>
            <a
              href="#how-it-works"
              className="px-6 py-3.5 border border-border text-text-secondary font-medium rounded-xl text-sm hover:border-border-strong hover:text-text-primary transition-colors"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Live prediction demo */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <PredictionDemo />
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 pb-24">
        <p className="text-sm font-mono font-medium text-gold-400 tracking-widest uppercase text-center mb-4">
          How it works
        </p>
        <h2 className="text-3xl font-display font-bold text-center mb-12 tracking-tight">
          Four steps to the leaderboard
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Target,
              step: "01",
              title: "Pick a contest",
              desc: "Choose a matchday with World Cup fixtures you want to predict.",
            },
            {
              icon: Zap,
              step: "02",
              title: "Make predictions",
              desc: "Match result, correct score, BTTS, over/under. Set your confidence.",
            },
            {
              icon: Trophy,
              step: "03",
              title: "Watch it live",
              desc: "Scores update in real time. Predictions resolve as goals happen.",
            },
            {
              icon: DollarSign,
              step: "04",
              title: "Get paid",
              desc: "Top predictors split the prize pool. USDC paid directly to your wallet.",
            },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div
              key={step}
              className="rounded-xl border border-border-subtle bg-surface-card p-6 group hover:border-border transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gold-400/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-gold-400" />
                </div>
                <span className="text-xs font-mono text-text-muted">
                  {step}
                </span>
              </div>
              <h3 className="font-display font-bold text-base mb-2">
                {title}
              </h3>
              <p className="text-sm text-text-tertiary leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <p className="text-sm font-mono font-medium text-gold-400 tracking-widest uppercase text-center mb-4">
          Scoring
        </p>
        <h2 className="text-3xl font-display font-bold text-center mb-3 tracking-tight">
          Knowledge meets conviction
        </h2>
        <p className="text-text-secondary text-center mb-10 max-w-lg mx-auto">
          Every prediction earns base points. Add a confidence multiplier to
          risk more for bigger rewards.
        </p>

        <div className="rounded-xl border border-border-subtle bg-surface-card overflow-hidden">
          {[
            {
              type: "Match Result",
              base: 3,
              desc: "Home win, draw, or away win",
            },
            {
              type: "Correct Score",
              base: 5,
              desc: "Predict the exact final score",
            },
            {
              type: "Both Teams Score",
              base: 2,
              desc: "Will both teams find the net?",
            },
            {
              type: "Over/Under 2.5",
              base: 2,
              desc: "Total goals over or under 2.5",
            },
          ].map(({ type, base, desc }, i, arr) => (
            <div
              key={type}
              className={`flex items-center justify-between px-6 py-5 ${i < arr.length - 1 ? "border-b border-border-subtle" : ""}`}
            >
              <div>
                <p className="font-display font-bold text-sm">
                  {type}
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">{desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-text-secondary">
                  {base} pts
                </span>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-display font-bold bg-surface-hover text-text-tertiary">
                    1×
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-display font-bold bg-confidence-double/15 text-confidence-double">
                    2×
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-display font-bold bg-confidence-triple/15 text-confidence-triple">
                    3×
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-text-muted mt-4">
          2× correct = double points, wrong = −1 · 3× correct = triple points,
          wrong = −2
        </p>
      </section>

      {/* Trust bar */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-center gap-8 text-text-muted">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Shield className="h-3.5 w-3.5" />
            USDC on Solana
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-2 text-xs font-mono">
            <Zap className="h-3.5 w-3.5" />
            Powered by TxLINE
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-2 text-xs font-mono">
            <Trophy className="h-3.5 w-3.5" />
            World Cup 2026
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-3xl font-display font-bold mb-4 tracking-tight">
          The match starts soon.
        </h2>
        <p className="text-text-secondary mb-8">
          Every correct prediction is worth USDC. How confident are you?
        </p>
        <button
          onClick={login}
          className="px-10 py-4 bg-gold-400 text-surface-base font-display font-bold rounded-xl text-base hover:bg-gold-300 transition-colors gold-glow"
        >
          Enter MatchDay
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold-400" />
            <span className="text-sm font-display font-bold text-text-tertiary">
              MatchDay
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Built for the Global AI Hackathon 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Animated prediction demo ────────────────────────────────

function PredictionDemo() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card overflow-hidden gold-glow">
      {/* Match header */}
      <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-display font-bold">Brazil</span>
          <span className="font-display font-bold text-lg text-gold-400">
            2 – 1
          </span>
          <span className="font-display font-bold">Norway</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-correct">
          <span className="h-2 w-2 bg-correct rounded-full animate-pulse-dot" />
          Full Time
        </div>
      </div>

      {/* Resolved predictions */}
      <div className="divide-y divide-border-subtle">
        {[
          {
            type: "Result",
            value: "Brazil Win",
            points: "+9",
            confidence: "3×",
            correct: true,
          },
          {
            type: "Score",
            value: "2-1",
            points: "+5",
            confidence: "1×",
            correct: true,
          },
          {
            type: "BTTS",
            value: "Yes",
            points: "+4",
            confidence: "2×",
            correct: true,
          },
          {
            type: "O/U 2.5",
            value: "Over 2.5",
            points: "+2",
            confidence: "1×",
            correct: true,
          },
        ].map(({ type, value, points, confidence, correct }) => (
          <div
            key={type}
            className="px-6 py-3.5 flex items-center justify-between bg-correct-muted"
          >
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-correct/20 flex items-center justify-center">
                <svg
                  className="h-3.5 w-3.5 text-correct"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">{type}</p>
                <p className="text-xs text-text-secondary">
                  {value}
                  {confidence !== "1×" && (
                    <span
                      className={`ml-1.5 font-display font-bold ${confidence === "3×" ? "text-confidence-triple" : "text-confidence-double"}`}
                    >
                      {confidence}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <span className="font-display font-bold text-sm text-correct">
              {points}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between">
        <span className="text-sm text-text-secondary">Total Points</span>
        <span className="font-display font-bold text-lg text-gold-400">
          20 pts
        </span>
      </div>
    </div>
  );
}

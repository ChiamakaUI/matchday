'use client';

import { AuthLayout } from '@/components/layout/auth-layout';
import { useCurrentUser, useUserEntries, useContests } from '@/hooks';
import { formatUsdc, formatPoints, timeUntilDeadline, shortenAddress } from '@/lib/utils';
import Link from 'next/link';
import { Trophy, MessageSquare, Bot, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { data: user } = useCurrentUser();
  const { data: entries } = useUserEntries();
  const { data: contests } = useContests('open');

  const activeEntries = entries?.filter((e) => e.contestStatus === 'locked') ?? [];
  const enteredContestIds = new Set(entries?.map((e) => e.contestId) ?? []);
  const openContests = contests?.filter((c) => !enteredContestIds.has(c.id)) ?? [];

  return (
    <AuthLayout>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold">
          Welcome{user ? `, ${shortenAddress(user.walletAddress)}` : ''}
        </h1>
        <p className="text-text-secondary mt-1">Predict. Compete. Win USDC.</p>
      </div>

      {/* Active Entries */}
      {activeEntries.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-display font-bold mb-3">My Active Entries</h2>
          <div className="space-y-2">
            {activeEntries.map((entry) => (
              <Link
                key={entry.id}
                href={`/entries/${entry.id}`}
                className="flex items-center justify-between bg-surface-card border border-border rounded-xl px-5 py-4 hover:border-border-strong transition-colors"
              >
                <div>
                  <p className="font-medium">{entry.contestName}</p>
                  <p className="text-sm text-text-secondary">
                    {formatPoints(entry.totalPoints)} • Rank #{entry.rank ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gold-400">
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Open Contests */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-bold">Enter a Contest</h2>
          <Link href="/contests" className="text-sm text-gold-400 hover:text-gold-300">
            View all
          </Link>
        </div>

        {openContests.length === 0 ? (
          <div className="bg-surface-card border border-border rounded-xl p-8 text-center">
            <Trophy className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-text-secondary">No open contests right now</p>
          </div>
        ) : (
          <div className="space-y-2">
            {openContests.slice(0, 3).map((contest) => (
              <Link
                key={contest.id}
                href={`/contests/${contest.id}`}
                className="flex items-center justify-between bg-surface-card border border-border rounded-xl px-5 py-4 hover:border-border-strong transition-colors"
              >
                <div>
                  <p className="font-medium">{contest.name}</p>
                  <p className="text-sm text-text-secondary">
                    {formatUsdc(contest.entryFee)} • {timeUntilDeadline(contest.deadline)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-text-tertiary" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Tools */}
      <section>
        <h2 className="text-lg font-display font-bold mb-3">Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/assistant"
            className="bg-surface-card border border-border rounded-xl p-5 hover:border-border-strong transition-colors"
          >
            <MessageSquare className="h-6 w-6 text-gold-400 mb-2" />
            <p className="font-medium">AI Assistant</p>
            <p className="text-sm text-text-secondary mt-1">Get prediction advice from AI</p>
          </Link>
          <Link
            href="/agent"
            className="bg-surface-card border border-border rounded-xl p-5 hover:border-border-strong transition-colors"
          >
            <Bot className="h-6 w-6 text-gold-400 mb-2" />
            <p className="font-medium">AI Agent</p>
            <p className="text-sm text-text-secondary mt-1">Autonomous prediction bot</p>
          </Link>
        </div>
      </section>
    </AuthLayout>
  );
}

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '@/components/layout/auth-layout';
import { useContest, useContestLeaderboard, useUserEntries, useCurrentUser } from '@/hooks';
import {
  formatUsdc,
  formatKickoff,
  formatPoints,
  timeUntilDeadline,
  fixtureStatusLabel,
  isFixtureLive,
  isFixtureFinished,
  isDeadlinePassed,
  shortenAddress,
  cn,
} from '@/lib/utils';
import { ArrowLeft, Users, Clock, Trophy, Loader2 } from 'lucide-react';

export default function ContestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<'fixtures' | 'leaderboard'>('fixtures');
  const { data: contest, isLoading } = useContest(id);
  const { data: leaderboard } = useContestLeaderboard(id);
  const { data: entries } = useUserEntries();
  const { data: currentUser } = useCurrentUser();

  const isEntered = entries?.some((e) => e.contestId === id);

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
        </div>
      </AuthLayout>
    );
  }

  if (!contest) {
    return (
      <AuthLayout>
        <div className="text-center py-20 text-text-secondary">Contest not found</div>
      </AuthLayout>
    );
  }

  const deadlinePassed = isDeadlinePassed(contest.deadline);

  return (
    <AuthLayout>
      <div className="mb-6">
        <Link
          href="/contests"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Contests
        </Link>
        <h1 className="text-2xl font-display font-bold">{contest.name}</h1>

        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-secondary">
          <span className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            {formatUsdc(contest.entryFee)} entry
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {contest.entryCount} entries
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {timeUntilDeadline(contest.deadline)}
          </span>
        </div>

        {/* Enter button */}
        {!isEntered && contest.status === 'open' && !deadlinePassed && (
          <Link
            href={`/contests/${id}/enter`}
            className="inline-block mt-4 px-6 py-2.5 bg-gold-400 text-text-primary font-medium rounded-lg hover:bg-gold-500 transition-colors"
          >
            Enter Contest — {formatUsdc(contest.entryFee)}
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {(['fixtures', 'leaderboard'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === t
                ? 'border-gold-300 text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            )}
          >
            {t === 'fixtures' ? `Fixtures (${contest.fixtures.length})` : 'Leaderboard'}
          </button>
        ))}
      </div>

      {tab === 'fixtures' ? (
        <div className="space-y-2">
          {contest.fixtures.map((f) => {
            const live = isFixtureLive(f.status);
            const finished = isFixtureFinished(f.status);

            return (
              <div
                key={f.id}
                className="bg-surface-card border border-border rounded-xl px-5 py-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-medium min-w-[100px] text-right">
                      {f.homeTeamName}
                    </span>
                    {finished || live ? (
                      <span className="text-lg font-display font-bold min-w-[60px] text-center">
                        {f.homeScore} – {f.awayScore}
                      </span>
                    ) : (
                      <span className="text-xs text-text-tertiary min-w-[60px] text-center">vs</span>
                    )}
                    <span className="font-medium">{f.awayTeamName}</span>
                  </div>
                  <div className="text-right">
                    {live && (
                      <span className="flex items-center gap-1 text-xs text-gold-400">
                        <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        {fixtureStatusLabel(f.status)}
                      </span>
                    )}
                    {finished && (
                      <span className="text-xs text-text-tertiary">{fixtureStatusLabel(f.status)}</span>
                    )}
                    {!live && !finished && (
                      <span className="text-xs text-text-tertiary">{formatKickoff(f.kickoff)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          {!leaderboard?.length ? (
            <div className="text-center py-12">
              <Trophy className="h-8 w-8 text-text-muted mx-auto mb-2" />
              <p className="text-text-secondary">Rankings appear after matches start</p>
            </div>
          ) : (
            <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-tertiary text-left">
                    <th className="px-5 py-3 w-12">#</th>
                    <th className="px-5 py-3">Player</th>
                    <th className="px-5 py-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => {
                    const isMe = currentUser?.walletAddress === entry.walletAddress;
                    return (
                      <tr
                        key={entry.entryId}
                        className={cn(
                          'border-b border-border last:border-0',
                          isMe && 'bg-green-900/10',
                        )}
                      >
                        <td className="px-5 py-3 font-medium">{entry.rank}</td>
                        <td className="px-5 py-3">
                          {entry.displayName ?? shortenAddress(entry.walletAddress)}
                          {isMe && <span className="ml-2 text-xs text-gold-400">(you)</span>}
                        </td>
                        <td className="px-5 py-3 text-right font-display font-bold">
                          {formatPoints(entry.totalPoints)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payout structure */}
      {contest.payoutStructure.length > 0 && (
        <div className="mt-6 bg-surface-card border border-border rounded-xl p-5">
          <h3 className="font-display font-bold mb-3">Prize Pool</h3>
          <div className="space-y-2 text-sm">
            {contest.payoutStructure.map((tier, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-text-secondary">
                  {tier.minRank === tier.maxRank
                    ? `#${tier.minRank}`
                    : `#${tier.minRank}–${tier.maxRank}`}
                </span>
                <span>{tier.pctOfPool}% of pool</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}

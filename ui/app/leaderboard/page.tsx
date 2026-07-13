'use client';

import { useState } from 'react';
import { Trophy, Loader2, ChevronDown } from 'lucide-react';
import { AuthLayout } from '@/components';
import { useContests, useContestLeaderboard, useCurrentUser } from '@/hooks';
import { formatPoints, shortenAddress, cn } from '@/lib';


export default function LeaderboardPage() {
  const { data: contests } = useContests();
  const { data: currentUser } = useCurrentUser();
  const [selectedContestId, setSelectedContestId] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeContestId = selectedContestId || contests?.[0]?.id || '';
  const { data: leaderboard, isLoading } = useContestLeaderboard(activeContestId);
  const selectedContest = contests?.find((c) => c.id === activeContestId);

  return (
    <AuthLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Rankings</h1>

      {/* Contest selector */}
      {contests && contests.length > 0 && (
        <div className="relative mb-6">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full max-w-md bg-surface-card border border-border rounded-lg px-4 py-2.5 text-sm"
          >
            <span>{selectedContest?.name ?? 'Select a contest'}</span>
            <ChevronDown className={cn('h-4 w-4 text-text-tertiary transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full max-w-md bg-surface-card border border-border rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
              {contests.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedContestId(c.id);
                    setDropdownOpen(false);
                  }}
                  className={cn(
                    'block w-full text-left px-4 py-2.5 text-sm hover:bg-surface-hover transition-colors',
                    c.id === activeContestId && 'text-gold-400',
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      ) : !leaderboard?.length ? (
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
    </AuthLayout>
  );
}

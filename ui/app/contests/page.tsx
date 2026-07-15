'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, Users, Clock, Check, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components';
import { useContests, useUserEntries } from '@/hooks';
import { formatUsdc, timeUntilDeadline, cn } from '@/lib';
import type { ContestStatus } from '@/types';

const FILTERS: Array<{ label: string; value: string | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Open', value: 'open' }, 
  { label: 'Live', value: 'locked' },
  { label: 'Settled', value: 'settled' },
];

export default function ContestsPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data: contests, isLoading } = useContests(filter);
  const { data: entries } = useUserEntries();

  const enteredMap = new Map(
    entries?.map((e) => [e.contestId, { id: e.id, isAgentEntry: e.isAgentEntry }]) ?? [],
  );

  return (
    <AuthLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Contests</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => setFilter(value)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === value
                ? 'bg-gold-400 text-text-primary'
                : 'bg-surface-hover text-text-secondary hover:text-text-primary',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      ) : !contests?.length ? (
        <div className="text-center py-12">
          <Trophy className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-text-secondary">No contests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contests.map((contest) => {
            const entryInfo = enteredMap.get(contest.id);
            const isEntered = !!entryInfo;
            const entryId = entryInfo?.id;
            const isAgentEntry = entryInfo?.isAgentEntry;

            return (
              <Link
                key={contest.id}
                href={isEntered ? `/entries/${entryId}` : `/contests/${contest.id}`}
                className="block bg-surface-card border border-border rounded-xl px-5 py-4 hover:border-border-strong transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display font-bold">{contest.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {contest.entryCount} entries
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {timeUntilDeadline(contest.deadline)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {isEntered ? (
                      <span className="inline-flex items-center gap-1 text-sm text-gold-400">
                        <Check className="h-3.5 w-3.5" />
                        {isAgentEntry ? 'Entered by Agent' : 'Entered'} 
                      </span>
                    ) : (
                      <span className="text-sm font-medium">
                        Enter — {formatUsdc(contest.entryFee)}
                      </span>
                    )}
                    <ContestStatusPill status={contest.status} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AuthLayout>
  );
}

function ContestStatusPill({ status }: { status: ContestStatus }) {
  const styles: Record<ContestStatus, string> = {
    open: 'bg-correct/15 text-gold-400',
    locked: 'bg-yellow-900/30 text-yellow-400',
    scoring: 'bg-blue-900/30 text-blue-400',
    settled: 'bg-surface-hover text-text-secondary',
    cancelled: 'bg-red-900/30 text-wrong',
  };

  return (
    <span className={cn('mt-1 inline-block px-2 py-0.5 rounded-full text-xs', styles[status])}>
      {status}
    </span>
  );
}

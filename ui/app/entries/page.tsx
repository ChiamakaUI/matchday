'use client';

import { AuthLayout } from '@/components/layout/auth-layout';
import { useUserEntries } from '@/hooks';
import { formatPoints, formatDeadline, cn } from '@/lib/utils';
import Link from 'next/link';
import { Trophy, Loader2 } from 'lucide-react';
import type { ContestStatus } from '@/types';

export default function EntriesPage() {
  const { data: entries, isLoading } = useUserEntries();

  return (
    <AuthLayout>
      <h1 className="text-2xl font-display font-bold mb-6">My Entries</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        </div>
      ) : !entries?.length ? (
        <div className="text-center py-12">
          <Trophy className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-text-secondary mb-4">No entries yet</p>
          <Link href="/contests" className="text-gold-400 hover:text-green-300 text-sm">
            Browse contests
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/entries/${entry.id}`}
              className="flex items-center justify-between bg-surface-card border border-border rounded-xl px-5 py-4 hover:border-border-strong transition-colors"
            >
              <div>
                <p className="font-medium">{entry.contestName}</p>
                <div className="flex items-center gap-3 mt-1">
                  <ContestStatusPill status={entry.contestStatus!} />
                  {entry.deadline && (
                    <span className="text-xs text-text-tertiary">{formatDeadline(entry.deadline)}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-display font-bold">{formatPoints(entry.totalPoints)}</p>
                {entry.rank && (
                  <p className="text-xs text-text-secondary">#{entry.rank}</p>
                )}
              </div>
            </Link>
          ))}
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
    <span className={cn('px-2 py-0.5 rounded-full text-xs', styles[status])}>
      {status}
    </span>
  );
}

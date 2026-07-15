'use client';

import { Suspense, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, X, Clock, Loader2, Radio } from 'lucide-react';
import { AuthLayout } from '@/components';
import { useEntry, useLiveScores } from '@/hooks';
import {
  formatPoints,
  formatKickoff,
  predictionTypeLabel,
  predictionValueLabel,
  fixtureStatusLabel,
  isFixtureFinished,
  isFixtureLive,
  cn,
} from '@/lib';
import type { Prediction, LiveScoreEvent } from '@/types';

function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: entry, isLoading } = useEntry(id);
  const queryClient = useQueryClient();

  const handleScoreUpdate = useCallback(
    (event: LiveScoreEvent) => {
      if (!entry) return;
      const relevant = entry.predictions.some((p) => p.fixtureId === event.fixtureId);
      if (relevant) {
        queryClient.invalidateQueries({ queryKey: ['entry', id] });
      }
    },
    [entry, id, queryClient],
  );

  const { connected } = useLiveScores(handleScoreUpdate);

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
        </div>
      </AuthLayout>
    );
  }

  if (!entry) {
    return (
      <AuthLayout>
        <div className="text-center py-20 text-text-secondary">Entry not found</div>
      </AuthLayout>
    );
  }

  const fixtureMap = new Map<string, Prediction[]>();
  for (const pred of entry.predictions) {
    const key = pred.fixtureId;
    const group = fixtureMap.get(key) ?? [];
    group.push(pred);
    fixtureMap.set(key, group);
  }

  const correctCount = entry.predictions.filter((p) => p.isCorrect === true).length;
  const wrongCount = entry.predictions.filter((p) => p.isCorrect === false).length;
  const pendingCount = entry.predictions.filter((p) => p.isCorrect === null).length;

  return (
    <AuthLayout>
      <div className="mb-6">
        <Link
          href="/entries"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          My Entries
        </Link>
        <h1 className="text-2xl font-display font-bold tracking-tight">{entry.contestName}</h1>

        <div className="flex items-center gap-3 mt-3">
          <div className="bg-gold-400/15 text-gold-400 px-4 py-1.5 rounded-full text-sm font-display font-bold">
            {formatPoints(entry.totalPoints)}
          </div>
          {entry.rank && (
            <span className="text-text-secondary text-sm">Rank #{entry.rank}</span>
          )}
          {connected && pendingCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-correct">
              <Radio className="h-3 w-3 animate-pulse-dot" />
              Live
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm">
          {correctCount > 0 && (
            <span className="flex items-center gap-1 text-correct">
              <Check className="h-3.5 w-3.5" />
              {correctCount} correct
            </span>
          )}
          {wrongCount > 0 && (
            <span className="flex items-center gap-1 text-wrong">
              <X className="h-3.5 w-3.5" />
              {wrongCount} wrong
            </span>
          )}
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 text-text-tertiary">
              <Clock className="h-3.5 w-3.5" />
              {pendingCount} pending
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {Array.from(fixtureMap.entries()).map(([fixtureId, predictions]) => {
          const first = predictions[0]!;
          const finished = first.fixtureStatus ? isFixtureFinished(first.fixtureStatus) : false;
          const live = first.fixtureStatus ? isFixtureLive(first.fixtureStatus) : false;
          const fixturePoints = predictions.reduce((sum, p) => sum + p.pointsAwarded, 0);

          return (
            <div
              key={fixtureId}
              className={cn(
                'bg-surface-card border rounded-xl overflow-hidden transition-colors',
                live ? 'border-correct/30' : 'border-border',
              )}
            >
              <div className={cn(
                'px-5 py-3 border-b flex items-center justify-between',
                live ? 'border-correct/20 bg-correct/[0.03]' : 'border-border',
              )}>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold">{first.homeTeamName}</span>
                  {(finished || live) && first.homeScore !== null ? (
                    <span className="font-score text-lg text-gold-400 min-w-[50px] text-center">
                      {first.homeScore} – {first.awayScore}
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted min-w-[50px] text-center font-mono">vs</span>
                  )}
                  <span className="font-display font-bold">{first.awayTeamName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(finished || live) && fixturePoints > 0 && (
                    <span className="font-display font-bold text-sm text-correct">
                      +{fixturePoints}
                    </span>
                  )}
                  {live && (
                    <span className="flex items-center gap-1.5 text-xs text-correct">
                      <span className="h-2 w-2 bg-correct rounded-full animate-pulse-dot" />
                      {fixtureStatusLabel(first.fixtureStatus!)}
                    </span>
                  )}
                  {finished && (
                    <span className="text-xs text-text-muted">{fixtureStatusLabel(first.fixtureStatus!)}</span>
                  )}
                  {!live && !finished && first.kickoff && (
                    <span className="text-xs text-text-tertiary">{formatKickoff(first.kickoff)}</span>
                  )}
                </div>
              </div>

              <div className="divide-y divide-border-subtle">
                {predictions.map((pred) => (
                  <PredictionRow key={pred.id} prediction={pred} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-surface-card border border-border rounded-xl p-5">
        <h3 className="font-display font-bold mb-3">Scoring Reference</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-text-secondary">Match Result</div>
          <div className="font-mono">3 pts</div>
          <div className="text-text-secondary">Correct Score</div>
          <div className="font-mono">5 pts</div>
          <div className="text-text-secondary">Both Teams Score</div>
          <div className="font-mono">2 pts</div>
          <div className="text-text-secondary">Over/Under 2.5</div>
          <div className="font-mono">2 pts</div>
        </div>
      </div>
    </AuthLayout>
  );
}

function PredictionRow({ prediction }: { prediction: Prediction }) {
  const resolved = prediction.isCorrect !== null;
  const correct = prediction.isCorrect === true;

  return (
    <div
      className={cn(
        'px-5 py-3 flex items-center justify-between transition-colors',
        resolved && correct && 'bg-correct/[0.06]',
        resolved && !correct && 'bg-wrong/[0.04]',
      )}
    >
      <div className="flex items-center gap-3">
        <PredictionStatusIcon prediction={prediction} />
        <div>
          <p className="text-sm font-medium">{predictionTypeLabel(prediction.predictionType)}</p>
          <p className="text-sm text-text-secondary">
            {predictionValueLabel(prediction.predictionType, prediction.predictedValue)}
            {prediction.confidence > 1 && (
              <span className={cn(
                'ml-1.5 text-xs font-display font-bold',
                prediction.confidence === 3 ? 'text-confidence-triple' : 'text-confidence-double',
              )}>
                {prediction.confidence}×
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="text-right">
        {resolved ? (
          <span className={cn('font-display font-bold text-sm', correct ? 'text-correct' : 'text-wrong')}>
            {correct ? `+${prediction.pointsAwarded}` : prediction.pointsAwarded < 0 ? `${prediction.pointsAwarded}` : '0'} pts
          </span>
        ) : (
          <span className="text-sm text-text-muted font-mono">Pending</span>
        )}
      </div>
    </div>
  );
}

function PredictionStatusIcon({ prediction }: { prediction: Prediction }) {
  if (prediction.isCorrect === null) {
    return (
      <div className="h-6 w-6 rounded-full bg-surface-hover flex items-center justify-center">
        <Clock className="h-3.5 w-3.5 text-text-muted" />
      </div>
    );
  }
  if (prediction.isCorrect) {
    return (
      <div className="h-6 w-6 rounded-full bg-correct/20 flex items-center justify-center">
        <Check className="h-3.5 w-3.5 text-correct" />
      </div>
    );
  }
  return (
    <div className="h-6 w-6 rounded-full bg-wrong/15 flex items-center justify-center">
      <X className="h-3.5 w-3.5 text-wrong" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <EntryDetailPage />
    </Suspense>
  );
}

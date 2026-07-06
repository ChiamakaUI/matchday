// "use client";

// import { Suspense } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { ArrowLeft, Check, Loader2 } from "lucide-react";
// import Link from "next/link";
// import { AuthLayout } from "@/components/layout/auth-layout";
// import { PredictionInputGroup } from "@/components/predictions/prediction-input";
// import {
//   useContest,
//   useUserEntries,
//   useAuth,
//   usePredictionBuilder,
//   useSubmitEntry,
// } from "@/hooks";
// import {
//   formatUsdc,
//   formatKickoff,
//   formatPoints,
//   isDeadlinePassed,
//   signEnterContestTx,
// } from "@/lib";
// import type { PredictionType } from "@/types";

// function EnterContestPage() {
//   const { id } = useParams<{ id: string }>();
//   const router = useRouter();
//   const { walletAddress, solanaWallet } = useAuth();
//   const { data: contest, isLoading } = useContest(id);
//   const { data: myEntries } = useUserEntries();
//   const submitEntry = useSubmitEntry();

//   const fixtures = contest?.fixtures ?? [];
//   const builder = usePredictionBuilder(fixtures);

//   // Check if already entered
//   const existingEntry = myEntries?.find((e) => e.contestId === id);

//   if (isLoading) {
//     return (
//       <AuthLayout>
//         <div className="flex items-center justify-center py-20">
//           <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
//         </div>
//       </AuthLayout>
//     );
//   }

//   if (!contest) {
//     return (
//       <AuthLayout>
//         <div className="text-center py-20 text-text-secondary">Contest not found</div>
//       </AuthLayout>
//     );
//   }

//   if (existingEntry) {
//     return (
//       <AuthLayout>
//         <div className="max-w-lg mx-auto text-center py-20">
//           <Check className="h-12 w-12 text-gold-400 mx-auto mb-4" />
//           <h2 className="text-xl font-display font-bold mb-2">Already entered</h2>
//           <p className="text-text-secondary mb-6">
//             You have an entry in this contest.
//           </p>
//           <Link
//             href={`/entries/${existingEntry.id}`}
//             className="inline-block px-6 py-2 bg-gold-400 rounded-lg hover:bg-gold-500 transition-colors"
//           >
//             View my predictions
//           </Link>
//         </div>
//       </AuthLayout>
//     );
//   }

//   const handleSubmit = async () => {
//     if (!builder.isValid || !solanaWallet || !walletAddress) return;

//     try {
//       const entryTx = await signEnterContestTx(solanaWallet, id);

//       await submitEntry.mutateAsync({
//         contestId: id,
//         predictions: builder.predictions,
//         entryTx,
//       });

//       router.push("/entries");
//     } catch (err) {
//       console.error("Entry submission failed:", err);
//     }
//   };

//   const deadlinePassed = isDeadlinePassed(contest.deadline);

//   return (
//     <AuthLayout>
//       <div className="pb-32">
//         {/* Header */}
//         <div className="mb-6">
//           <Link
//             href={`/contests/${id}`}
//             className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-3"
//           >
//             <ArrowLeft className="h-4 w-4" />
//             Back to contest
//           </Link>
//           <h1 className="text-2xl font-display font-bold">{contest.name}</h1>
//           <p className="text-text-secondary mt-1">
//             {fixtures.length} fixture{fixtures.length !== 1 ? "s" : ""} • Entry
//             fee {formatUsdc(contest.entryFee)}
//           </p>
//         </div>

//         {deadlinePassed && (
//           <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
//             <p className="text-wrong text-sm">
//               The deadline for this contest has passed.
//             </p>
//           </div>
//         )}

//         {/* Fixture prediction cards */}
//         <div className="space-y-4">
//           {fixtures.map((fixture) => (
//             <div
//               key={fixture.id}
//               className="bg-surface-card border border-border rounded-xl overflow-hidden"
//             >
//               {/* Fixture header */}
//               <div className="px-5 py-4 border-b border-border">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-4">
//                     <div className="text-right min-w-[100px]">
//                       <p className="font-display font-display font-bold">{fixture.homeTeamName}</p>
//                     </div>
//                     <div className="text-center">
//                       <span className="text-xs text-text-tertiary uppercase">
//                         vs
//                       </span>
//                     </div>
//                     <div className="min-w-[100px]">
//                       <p className="font-display font-display font-bold">{fixture.awayTeamName}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-xs text-text-tertiary">
//                       {formatKickoff(fixture.kickoff)}
//                     </p>
//                     <p className="text-xs text-text-tertiary">
//                       {fixture.fixtureGroup}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Prediction inputs */}
//               {fixture.status === "NS" ? (
//                 <div className="p-5 space-y-4">
                  
//                   {/* REMOVE LATER<PredictionInputGroup
//                     type="match_result"
//                     value={builder.getPrediction(fixture.id, 'match_result')}
//                     onChange={(val) => builder.setPrediction(fixture.id, 'match_result', val)}
//                     onClear={() => builder.removePrediction(fixture.id, 'match_result')}
//                     homeTeam={fixture.homeTeamName}
//                     awayTeam={fixture.awayTeamName}
//                   /> */}
//                   <PredictionInputGroup
//                     type="match_result"
//                     value={builder.getPrediction(fixture.id, "match_result")}
//                     confidence={builder.getConfidence(
//                       fixture.id,
//                       "match_result",
//                     )}
//                     onChange={(val) =>
//                       builder.setPrediction(fixture.id, "match_result", val)
//                     }
//                     onConfidenceChange={(c) =>
//                       builder.setConfidence(fixture.id, "match_result", c)
//                     }
//                     onClear={() =>
//                       builder.removePrediction(fixture.id, "match_result")
//                     }
//                     homeTeam={fixture.homeTeamName}
//                     awayTeam={fixture.awayTeamName}
//                   />
//                   <PredictionInputGroup
//                     type="correct_score"
//                     value={builder.getPrediction(fixture.id, "correct_score")}
//                     confidence={builder.getConfidence(
//                       fixture.id,
//                       "match_result",
//                     )}
//                     onConfidenceChange={(c) =>
//                       builder.setConfidence(fixture.id, "match_result", c)
//                     }
//                     onChange={(val) =>
//                       builder.setPrediction(fixture.id, "correct_score", val)
//                     }
//                     onClear={() =>
//                       builder.removePrediction(fixture.id, "correct_score")
//                     }
//                   />
//                   <PredictionInputGroup
//                     type="both_teams_score"
//                     value={builder.getPrediction(
//                       fixture.id,
//                       "both_teams_score",
//                     )}
//                     confidence={builder.getConfidence(
//                       fixture.id,
//                       "match_result",
//                     )}
//                     onConfidenceChange={(c) =>
//                       builder.setConfidence(fixture.id, "match_result", c)
//                     }
//                     onChange={(val) =>
//                       builder.setPrediction(fixture.id, "both_teams_score", val)
//                     }
//                     onClear={() =>
//                       builder.removePrediction(fixture.id, "both_teams_score")
//                     }
//                   />
//                   <PredictionInputGroup
//                     type="over_under_2_5"
//                     value={builder.getPrediction(fixture.id, "over_under_2_5")}
//                     confidence={builder.getConfidence(
//                       fixture.id,
//                       "match_result",
//                     )}
//                     onConfidenceChange={(c) =>
//                       builder.setConfidence(fixture.id, "match_result", c)
//                     }
//                     onChange={(val) =>
//                       builder.setPrediction(fixture.id, "over_under_2_5", val)
//                     }
//                     onClear={() =>
//                       builder.removePrediction(fixture.id, "over_under_2_5")
//                     }
//                   />
//                 </div>
//               ) : (
//                 <div className="p-5 text-sm text-text-tertiary">
//                   This match has already started — predictions locked.
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Fixed bottom bar */}
//       <div className="fixed bottom-0 md:bottom-0 left-0 md:left-56 right-0 bg-surface-card border-t border-border px-4 py-3 z-30">
//         <div className="max-w-5xl mx-auto flex items-center justify-between">
//           <div className="flex items-center gap-6">
//             <div>
//               <p className="text-xs text-text-tertiary">Predictions</p>
//               <p className="font-display font-display font-bold">{builder.totalPredictions}</p>
//             </div>
//             <div>
//               <p className="text-xs text-text-tertiary">Potential Points</p>
//               <p className="font-display font-display font-bold text-gold-400">
//                 {formatPoints(builder.potentialPoints)}
//               </p>
//             </div>
//             <div>
//               <p className="text-xs text-text-tertiary">Entry Fee</p>
//               <p className="font-display font-display font-bold">{formatUsdc(contest.entryFee)}</p>
//             </div>
//           </div>

//           <button
//             onClick={handleSubmit}
//             disabled={
//               !builder.isValid || submitEntry.isPending || deadlinePassed
//             }
//             className="px-6 py-2.5 bg-gold-400 text-text-primary font-medium rounded-lg hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
//           >
//             {submitEntry.isPending ? (
//               <>
//                 <Loader2 className="h-4 w-4 animate-spin" />
//                 Submitting...
//               </>
//             ) : (
//               `Submit Entry — ${formatUsdc(contest.entryFee)}`
//             )}
//           </button>
//         </div>
//       </div>
//     </AuthLayout>
//   );
// }

// export default function Page() {
//   return (
//     <Suspense>
//       <EnterContestPage />
//     </Suspense>
//   );
// }

'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/layout/auth-layout';
import { PredictionInputGroup } from '@/components/predictions/prediction-input';
import { useContest, useUserEntries, useAuth, usePredictionBuilder, useSubmitEntry } from '@/hooks';
import { formatUsdc, formatKickoff, formatPoints, isDeadlinePassed } from '@/lib/utils';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';

function EnterContestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { walletAddress, solanaWallet } = useAuth();
  const { data: contest, isLoading } = useContest(id);
  const { data: myEntries } = useUserEntries();
  const submitEntry = useSubmitEntry();

  const fixtures = contest?.fixtures ?? [];
  const builder = usePredictionBuilder(fixtures);

  const existingEntry = myEntries?.find((e) => e.contestId === id);

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
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

  if (existingEntry) {
    return (
      <AuthLayout>
        <div className="max-w-lg mx-auto text-center py-20">
          <Check className="h-12 w-12 text-correct mx-auto mb-4" />
          <h2 className="text-xl font-display font-display font-bold mb-2">Already entered</h2>
          <p className="text-text-secondary mb-6">You have an entry in this contest.</p>
          <Link
            href={`/entries/${existingEntry.id}`}
            className="inline-block px-6 py-2.5 bg-gold-400 text-surface-base font-display font-bold rounded-xl hover:bg-gold-300 transition-colors"
          >
            View my predictions
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async () => {
    if (!builder.isValid || !solanaWallet || !walletAddress) return;

    try {
      // TODO: Replace with real signEnterContestTx
      const entryTx = `simulated_${Date.now()}`;

      await submitEntry.mutateAsync({
        contestId: id,
        predictions: builder.predictions,
        entryTx,
      });

      router.push('/entries');
    } catch (err) {
      console.error('Entry submission failed:', err);
    }
  };

  const deadlinePassed = isDeadlinePassed(contest.deadline);

  return (
    <AuthLayout>
      <div className="pb-32">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/contests/${id}`}
            className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to contest
          </Link>
          <h1 className="text-2xl font-display font-display font-bold tracking-tight">{contest.name}</h1>
          <p className="text-text-secondary mt-1">
            {fixtures.length} fixture{fixtures.length !== 1 ? 's' : ''} • Entry fee{' '}
            <span className="text-gold-400 font-mono font-display font-bold">{formatUsdc(contest.entryFee)}</span>
          </p>
        </div>

        {deadlinePassed && (
          <div className="bg-wrong-muted border border-wrong/20 rounded-xl p-4 mb-6">
            <p className="text-wrong text-sm">The deadline for this contest has passed.</p>
          </div>
        )}

        {/* Fixture prediction cards */}
        <div className="space-y-4">
          {fixtures.map((fixture) => (
            <div key={fixture.id} className="bg-surface-card border border-border rounded-xl overflow-hidden">
              {/* Fixture header */}
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-right min-w-[100px]">
                      <p className="font-display font-display font-display font-bold">{fixture.homeTeamName}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-text-muted uppercase font-mono">vs</span>
                    </div>
                    <div className="min-w-[100px]">
                      <p className="font-display font-display font-display font-bold">{fixture.awayTeamName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-tertiary">{formatKickoff(fixture.kickoff)}</p>
                    <p className="text-xs text-text-muted">{fixture.fixtureGroup}</p>
                  </div>
                </div>
              </div>

              {/* Prediction inputs */}
              {fixture.status === 'NS' ? (
                <div className="p-5 space-y-5">
                  <PredictionInputGroup
                    type="match_result"
                    value={builder.getPrediction(fixture.id, 'match_result')}
                    confidence={builder.getConfidence(fixture.id, 'match_result')}
                    onChange={(val) => builder.setPrediction(fixture.id, 'match_result', val)}
                    onConfidenceChange={(c) => builder.setConfidence(fixture.id, 'match_result', c)}
                    onClear={() => builder.removePrediction(fixture.id, 'match_result')}
                    homeTeam={fixture.homeTeamName}
                    awayTeam={fixture.awayTeamName}
                  />
                  <PredictionInputGroup
                    type="correct_score"
                    value={builder.getPrediction(fixture.id, 'correct_score')}
                    confidence={builder.getConfidence(fixture.id, 'correct_score')}
                    onChange={(val) => builder.setPrediction(fixture.id, 'correct_score', val)}
                    onConfidenceChange={(c) => builder.setConfidence(fixture.id, 'correct_score', c)}
                    onClear={() => builder.removePrediction(fixture.id, 'correct_score')}
                  />
                  <PredictionInputGroup
                    type="both_teams_score"
                    value={builder.getPrediction(fixture.id, 'both_teams_score')}
                    confidence={builder.getConfidence(fixture.id, 'both_teams_score')}
                    onChange={(val) => builder.setPrediction(fixture.id, 'both_teams_score', val)}
                    onConfidenceChange={(c) => builder.setConfidence(fixture.id, 'both_teams_score', c)}
                    onClear={() => builder.removePrediction(fixture.id, 'both_teams_score')}
                  />
                  <PredictionInputGroup
                    type="over_under_2_5"
                    value={builder.getPrediction(fixture.id, 'over_under_2_5')}
                    confidence={builder.getConfidence(fixture.id, 'over_under_2_5')}
                    onChange={(val) => builder.setPrediction(fixture.id, 'over_under_2_5', val)}
                    onConfidenceChange={(c) => builder.setConfidence(fixture.id, 'over_under_2_5', c)}
                    onClear={() => builder.removePrediction(fixture.id, 'over_under_2_5')}
                  />
                </div>
              ) : (
                <div className="p-5 text-sm text-text-muted">
                  This match has already started — predictions locked.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 md:bottom-0 left-0 md:left-56 right-0 bg-surface-card border-t border-border px-4 py-3 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] text-text-muted uppercase font-mono tracking-wider">Predictions</p>
              <p className="font-display font-display font-bold">{builder.totalPredictions}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-mono tracking-wider">Potential</p>
              <p className="font-mono font-display font-bold text-gold-400">{formatPoints(builder.potentialPoints)}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-mono tracking-wider">Entry Fee</p>
              <p className="font-mono font-display font-bold">{formatUsdc(contest.entryFee)}</p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!builder.isValid || submitEntry.isPending || deadlinePassed}
            className="px-6 py-2.5 bg-gold-400 text-surface-base font-display font-bold rounded-xl hover:bg-gold-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitEntry.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              `Submit Entry — ${formatUsdc(contest.entryFee)}`
            )}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function Page() {
  return (
    <Suspense>
      <EnterContestPage />
    </Suspense>
  );
}

// 'use client';

// import { useState } from 'react';
// import { cn } from '@/lib/utils';
// import { PREDICTION_LABELS, PREDICTION_POINTS, type PredictionType } from '@/types';
// import { X } from 'lucide-react';

// interface PredictionInputGroupProps {
//   type: PredictionType;
//   value: string | null;
//   confidence: number;
//   onChange: (value: string) => void;
//   onConfidenceChange: (confidence: number) => void;
//   onClear: () => void;
//   homeTeam?: string;
//   awayTeam?: string;
// }

// export function PredictionInputGroup({
//   type,
//   value,
//   confidence,
//   onChange,
//   onConfidenceChange,
//   onClear,
//   homeTeam,
//   awayTeam,
// }: PredictionInputGroupProps) {
//   const basePoints = PREDICTION_POINTS[type];
//   const displayPoints = value ? basePoints * confidence : basePoints;

//   return (
//     <div className="space-y-2">
//       <div className="flex items-center justify-between">
//         <p className="text-sm font-medium text-gray-300">{PREDICTION_LABELS[type]}</p>
//         <div className="flex items-center gap-2">
//           <span className={cn(
//             'text-xs',
//             value && confidence > 1 ? 'text-gold-400 font-display font-display font-bold' : 'text-text-tertiary',
//           )}>
//             {value ? `${displayPoints} pts` : `${basePoints} pts`}
//           </span>
//           {value && (
//             <button onClick={onClear} className="text-text-tertiary hover:text-gray-300">
//               <X className="h-3.5 w-3.5" />
//             </button>
//           )}
//         </div>
//       </div>

//       {type === 'match_result' && (
//         <MatchResultInput value={value} onChange={onChange} homeTeam={homeTeam} awayTeam={awayTeam} />
//       )}
//       {type === 'correct_score' && (
//         <CorrectScoreInput value={value} onChange={onChange} />
//       )}
//       {type === 'both_teams_score' && (
//         <BinaryInput value={value} onChange={onChange} optionA="yes" optionB="no" labelA="Yes" labelB="No" />
//       )}
//       {type === 'over_under_2_5' && (
//         <BinaryInput value={value} onChange={onChange} optionA="over" optionB="under" labelA="Over 2.5" labelB="Under 2.5" />
//       )}

//       {/* Confidence selector — only show when a value is selected */}
//       {value && (
//         <ConfidenceSelector confidence={confidence} onChange={onConfidenceChange} />
//       )}
//     </div>
//   );
// }

// // ── Confidence selector ─────────────────────────────────────

// function ConfidenceSelector({
//   confidence,
//   onChange,
// }: {
//   confidence: number;
//   onChange: (c: number) => void;
// }) {
//   const options = [
//     { value: 1, label: '1×', desc: 'Safe' },
//     { value: 2, label: '2×', desc: 'Double or −1' },
//     { value: 3, label: '3×', desc: 'Triple or −2' },
//   ];

//   return (
//     <div className="flex items-center gap-2">
//       <span className="text-xs text-text-tertiary mr-1">Confidence:</span>
//       {options.map((opt) => (
//         <button
//           key={opt.value}
//           onClick={() => onChange(opt.value)}
//           className={cn(
//             'px-2.5 py-1 rounded-lg text-xs font-display font-bold transition-colors border',
//             confidence === opt.value
//               ? opt.value === 3
//                 ? 'bg-red-600/20 border-red-600 text-wrong'
//                 : opt.value === 2
//                   ? 'bg-yellow-600/20 border-yellow-600 text-yellow-400'
//                   : 'bg-gray-700 border-gray-600 text-gray-300'
//               : 'bg-surface-hover/50 border-border-strong/50 text-text-tertiary hover:border-gray-600',
//           )}
//           title={opt.desc}
//         >
//           {opt.label}
//         </button>
//       ))}
//     </div>
//   );
// }

// // ── Match Result ────────────────────────────────────────────

// function MatchResultInput({
//   value,
//   onChange,
//   homeTeam = 'Home',
//   awayTeam = 'Away',
// }: {
//   value: string | null;
//   onChange: (v: string) => void;
//   homeTeam?: string;
//   awayTeam?: string;
// }) {
//   const options = [
//     { value: 'home', label: homeTeam },
//     { value: 'draw', label: 'Draw' },
//     { value: 'away', label: awayTeam },
//   ];

//   return (
//     <div className="grid grid-cols-3 gap-2">
//       {options.map((opt) => (
//         <button
//           key={opt.value}
//           onClick={() => onChange(opt.value)}
//           className={cn(
//             'py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
//             value === opt.value
//               ? 'bg-gold-400/20 border-green-600 text-gold-400'
//               : 'bg-surface-hover border-border-strong text-gray-300 hover:border-gray-600',
//           )}
//         >
//           {opt.label}
//         </button>
//       ))}
//     </div>
//   );
// }

// // ── Correct Score ───────────────────────────────────────────

// function CorrectScoreInput({
//   value,
//   onChange,
// }: {
//   value: string | null;
//   onChange: (v: string) => void;
// }) {
//   const [home, away] = value ? value.split('-').map(Number) : [null, null];
//   const [homeGoals, setHomeGoals] = useState<number | null>(home ?? null);
//   const [awayGoals, setAwayGoals] = useState<number | null>(away ?? null);

//   const handleChange = (h: number | null, a: number | null) => {
//     if (h !== null && a !== null && h >= 0 && a >= 0) {
//       onChange(`${h}-${a}`);
//     }
//   };

//   return (
//     <div className="flex items-center gap-3">
//       <input
//         type="number" min={0} max={20}
//         value={homeGoals ?? ''}
//         onChange={(e) => {
//           const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
//           setHomeGoals(v);
//           handleChange(v, awayGoals);
//         }}
//         placeholder="0"
//         className="w-16 py-2 px-3 bg-surface-hover border border-border-strong rounded-lg text-center text-sm focus:border-green-600 focus:outline-none"
//       />
//       <span className="text-text-tertiary text-sm">—</span>
//       <input
//         type="number" min={0} max={20}
//         value={awayGoals ?? ''}
//         onChange={(e) => {
//           const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
//           setAwayGoals(v);
//           handleChange(homeGoals, v);
//         }}
//         placeholder="0"
//         className="w-16 py-2 px-3 bg-surface-hover border border-border-strong rounded-lg text-center text-sm focus:border-green-600 focus:outline-none"
//       />
//       {value && (
//         <span className="text-xs text-gold-400 ml-2">Predicting {value}</span>
//       )}
//     </div>
//   );
// }

// // ── Binary toggle ───────────────────────────────────────────

// function BinaryInput({
//   value, onChange, optionA, optionB, labelA, labelB,
// }: {
//   value: string | null; onChange: (v: string) => void;
//   optionA: string; optionB: string; labelA: string; labelB: string;
// }) {
//   return (
//     <div className="grid grid-cols-2 gap-2">
//       <button
//         onClick={() => onChange(optionA)}
//         className={cn(
//           'py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
//           value === optionA
//             ? 'bg-gold-400/20 border-green-600 text-gold-400'
//             : 'bg-surface-hover border-border-strong text-gray-300 hover:border-gray-600',
//         )}
//       >
//         {labelA}
//       </button>
//       <button
//         onClick={() => onChange(optionB)}
//         className={cn(
//           'py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
//           value === optionB
//             ? 'bg-gold-400/20 border-green-600 text-gold-400'
//             : 'bg-surface-hover border-border-strong text-gray-300 hover:border-gray-600',
//         )}
//       >
//         {labelB}
//       </button>
//     </div>
//   );
// }

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PREDICTION_LABELS, PREDICTION_POINTS, type PredictionType } from '@/types';
import { X } from 'lucide-react';

interface PredictionInputGroupProps {
  type: PredictionType;
  value: string | null;
  confidence: number;
  onChange: (value: string) => void;
  onConfidenceChange: (confidence: number) => void;
  onClear: () => void;
  homeTeam?: string;
  awayTeam?: string;
}

export function PredictionInputGroup({
  type, value, confidence, onChange, onConfidenceChange, onClear, homeTeam, awayTeam,
}: PredictionInputGroupProps) {
  const basePoints = PREDICTION_POINTS[type];
  const displayPoints = value ? basePoints * confidence : basePoints;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-secondary">{PREDICTION_LABELS[type]}</p>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs font-mono',
            value && confidence > 1 ? 'text-gold-400 font-display font-bold' : 'text-text-muted',
          )}>
            {value ? `${displayPoints} pts` : `${basePoints} pts`}
          </span>
          {value && (
            <button onClick={onClear} className="text-text-muted hover:text-text-secondary transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {type === 'match_result' && (
        <MatchResultInput value={value} onChange={onChange} homeTeam={homeTeam} awayTeam={awayTeam} />
      )}
      {type === 'correct_score' && (
        <CorrectScoreInput value={value} onChange={onChange} />
      )}
      {type === 'both_teams_score' && (
        <BinaryInput value={value} onChange={onChange} optionA="yes" optionB="no" labelA="Yes" labelB="No" />
      )}
      {type === 'over_under_2_5' && (
        <BinaryInput value={value} onChange={onChange} optionA="over" optionB="under" labelA="Over 2.5" labelB="Under 2.5" />
      )}

      {value && (
        <ConfidenceSelector confidence={confidence} onChange={onConfidenceChange} />
      )}
    </div>
  );
}

function ConfidenceSelector({ confidence, onChange }: { confidence: number; onChange: (c: number) => void }) {
  const options = [
    { value: 1, label: '1×', color: 'border-border text-text-tertiary bg-surface-hover' },
    { value: 2, label: '2×', color: 'border-confidence-double bg-confidence-double/15 text-confidence-double' },
    { value: 3, label: '3×', color: 'border-confidence-triple bg-confidence-triple/15 text-confidence-triple' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted mr-1 font-mono">Confidence</span>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-2.5 py-1 rounded-lg text-xs font-mono font-display font-bold transition-all border',
            confidence === opt.value
              ? opt.color
              : 'bg-transparent border-border-subtle text-text-muted hover:border-border',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MatchResultInput({
  value, onChange, homeTeam = 'Home', awayTeam = 'Away',
}: { value: string | null; onChange: (v: string) => void; homeTeam?: string; awayTeam?: string }) {
  const options = [
    { value: 'home', label: homeTeam },
    { value: 'draw', label: 'Draw' },
    { value: 'away', label: awayTeam },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'py-2.5 px-3 rounded-xl text-sm font-medium transition-all border',
            value === opt.value
              ? 'bg-gold-400/15 border-gold-400/50 text-gold-400'
              : 'bg-surface-hover border-border text-text-secondary hover:border-border-strong hover:text-text-primary',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CorrectScoreInput({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
  const [home, away] = value ? value.split('-').map(Number) : [null, null];
  const [homeGoals, setHomeGoals] = useState<number | null>(home ?? null);
  const [awayGoals, setAwayGoals] = useState<number | null>(away ?? null);

  const handleChange = (h: number | null, a: number | null) => {
    if (h !== null && a !== null && h >= 0 && a >= 0) onChange(`${h}-${a}`);
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="number" min={0} max={20}
        value={homeGoals ?? ''}
        onChange={(e) => {
          const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
          setHomeGoals(v);
          handleChange(v, awayGoals);
        }}
        placeholder="0"
        className="w-16 py-2.5 px-3 bg-surface-hover border border-border rounded-xl text-center text-sm font-mono focus:border-gold-400/50 focus:outline-none transition-colors"
      />
      <span className="text-text-muted font-mono">—</span>
      <input
        type="number" min={0} max={20}
        value={awayGoals ?? ''}
        onChange={(e) => {
          const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
          setAwayGoals(v);
          handleChange(homeGoals, v);
        }}
        placeholder="0"
        className="w-16 py-2.5 px-3 bg-surface-hover border border-border rounded-xl text-center text-sm font-mono focus:border-gold-400/50 focus:outline-none transition-colors"
      />
      {value && (
        <span className="text-xs text-gold-400 font-mono ml-2">
          {value}
        </span>
      )}
    </div>
  );
}

function BinaryInput({
  value, onChange, optionA, optionB, labelA, labelB,
}: { value: string | null; onChange: (v: string) => void; optionA: string; optionB: string; labelA: string; labelB: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[{ v: optionA, l: labelA }, { v: optionB, l: labelB }].map(({ v, l }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            'py-2.5 px-3 rounded-xl text-sm font-medium transition-all border',
            value === v
              ? 'bg-gold-400/15 border-gold-400/50 text-gold-400'
              : 'bg-surface-hover border-border text-text-secondary hover:border-border-strong hover:text-text-primary',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
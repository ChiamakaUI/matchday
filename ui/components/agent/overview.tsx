'use client';

import { useState, useMemo } from 'react';
import {
  Bot, Shield, Trash2, Plus, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, Loader2, Activity, DollarSign,
  Check,
} from 'lucide-react';
import type { AgentConfig, AgentRule, AgentAction, AgentRuleType } from '@/types';
import { formatUsdc, cn } from "@/lib";

// ─── Display helpers ──────────────────────────────────────────────────────────

const RULE_TYPE_LABELS: Record<string, string> = {
  max_entry_fee: 'Max entry fee',
  min_entries: 'Min entries',
  max_entries: 'Max entries',
  prediction_strategy: 'Strategy',
  confidence_threshold: 'Confidence',
  fixture_group: 'Fixture group',
  risk_level: 'Playing style',
};

function formatRuleValue(type: string, value: Record<string, unknown>): string {
  switch (type) {
    case 'risk_level':
    case 'prediction_strategy':
      return String(value.strategy ?? value.level ?? '');
    case 'confidence_threshold':
      return `Min ${(Number(value.min_confidence ?? 0) * 100).toFixed(0)}%`;
    case 'max_entry_fee':
      return `Max ${formatUsdc(Number(value.max))}`;
    case 'min_entries':
      return `At least ${value.min} entries`;
    case 'max_entries':
      return `At most ${value.max} entries`;
    case 'fixture_group':
      return ((value.groups as string[]) ?? []).join(', ');
    default:
      return JSON.stringify(value);
  }
}

const ACTION_COLORS: Record<string, string> = {
  submit_entry: 'text-gold-400',
  payment_confirmed: 'text-gold-400',
  skipped_contest: 'text-zinc-500',
  payment_failed: 'text-wrong',
  evaluate_contest: 'text-sky-400',
  build_predictions: 'text-amber-400',
  payment_sent: 'text-sky-400',
};

const ACTION_LABELS: Record<string, string> = {
  submit_entry: 'Entered',
  payment_confirmed: 'Payment confirmed',
  payment_sent: 'Payment sent',
  payment_failed: 'Payment failed',
  skipped_contest: 'Skipped',
  evaluate_contest: 'Evaluated',
  build_predictions: 'Built predictions',
};

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AgentOverviewProps {
  config: AgentConfig;
  actions: AgentAction[];
  onToggle: (active: boolean) => Promise<void>;
  onDeposit: (amount: number) => Promise<void>;
  onAddRule: (ruleType: AgentRuleType, ruleValue: Record<string, unknown>) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AgentOverview({
  config,
  actions,
  onToggle,
  onDeposit,
  onAddRule,
  onDeleteRule,
}: AgentOverviewProps) {
  const budget = config.budget!;
  const rules = config.rules ?? [];
  const [toggling, setToggling] = useState(false);

  const remaining = Number(budget.totalDeposited) - Number(budget.totalSpent);

  const weekStart = getWeekStart();
  const contestsThisWeek = useMemo(
    () =>
      actions.filter(
        (a) =>
          a.actionType === 'submit_entry' &&
          a.status === 'success' &&
          new Date(a.createdAt) >= weekStart,
      ).length,
    [actions, weekStart],
  );

  const toggleActive = async () => {
    setToggling(true);
    try {
      await onToggle(!budget.isActive);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className="rounded-2xl border border-border bg-white/[0.02] overflow-hidden">
        <div
          className={cn(
            "h-0.5 w-full",
            budget.isActive
              ? "bg-gradient-to-r from-transparent via-gold-400/60 to-transparent"
              : "bg-white/5",
          )}
        />
        <div className="p-5">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  budget.isActive ? "bg-gold-400/15" : "bg-white/5",
                )}
              >
                <Bot
                  className={cn(
                    "h-5 w-5",
                    budget.isActive ? "text-gold-400" : "text-zinc-600",
                  )}
                />
              </div>
              <div>
                <p className="text-sm font-display font-bold text-text-primary">
                  AI Agent
                </p>
                <p
                  className={cn(
                    "text-xs font-medium",
                    budget.isActive ? "text-gold-400" : "text-zinc-500",
                  )}
                >
                  {budget.isActive ? "Active" : "Paused"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleActive}
              disabled={toggling}
              className="shrink-0"
            >
              {toggling ? (
                <Loader2 className="h-8 w-8 text-zinc-500 animate-spin" />
              ) : budget.isActive ? (
                <ToggleRight className="h-9 w-9 text-gold-400" />
              ) : (
                <ToggleLeft className="h-9 w-9 text-zinc-600" />
              )}
            </button>
          </div>

          {/* Budget stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <BudgetStat
              label="Remaining"
              value={formatUsdc(remaining)}
              accent
            />
            <BudgetStat
              label="Deposited"
              value={formatUsdc(budget.totalDeposited)}
            />
            <BudgetStat label="Spent" value={formatUsdc(budget.totalSpent)} />
            <BudgetStat
              label="Max / Contest"
              value={formatUsdc(budget.maxSpendPerContest)}
            />
          </div>

          {/* Weekly progress */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">This week</span>
              <span
                className={cn(
                  "font-display font-bold",
                  contestsThisWeek >= budget.maxContestsPerWeek
                    ? "text-amber-400"
                    : "text-zinc-300",
                )}
              >
                {contestsThisWeek} / {budget.maxContestsPerWeek} contests
                entered
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  contestsThisWeek >= budget.maxContestsPerWeek
                    ? "bg-amber-500"
                    : "bg-gold-400",
                )}
                style={{
                  width: `${Math.min((contestsThisWeek / budget.maxContestsPerWeek) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Deposit */}
      <DepositSection onDeposit={onDeposit} />

      {/* Rules */}
      <RulesSection
        rules={rules}
        onAddRule={onAddRule}
        onDeleteRule={onDeleteRule}
      />

      {/* Activity */}
      <ActivitySection actions={actions} />
    </div>
  );
}

// ─── Deposit section ──────────────────────────────────────────────────────────

function DepositSection({ onDeposit }: { onDeposit: (amount: number) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(25);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDeposit = async () => {
    setErr(null);
    setLoading(true);
    try {
      await onDeposit(amount);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 2000);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Deposit failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <DollarSign className="h-4 w-4 text-zinc-500" />
          <p className="text-sm font-display font-bold text-text-primary">
            Fund Agent
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border">
          <p className="text-xs text-zinc-500 pt-4">
            Add USDC to your agent vault. The agent draws from this balance to
            pay contest entry fees.
          </p>

          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={cn(
                  "rounded-xl border py-2 text-sm font-display font-bold transition-colors",
                  amount === amt
                    ? "border-gold-400 bg-gold-400/10 text-gold-400"
                    : "border-border bg-white/5 text-zinc-400 hover:border-border hover:text-text-primary",
                )}
              >
                ${amt}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-display font-bold text-sm">
              $
            </span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-xl border border-border bg-white/5 pl-8 pr-16 py-3 text-text-primary font-display font-bold text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-display font-bold text-zinc-500">
              USDC
            </span>
          </div>

          {err && <p className="text-xs text-wrong">{err}</p>}

          <button
            onClick={handleDeposit}
            disabled={loading || success}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gold-400 hover:bg-gold-300 disabled:opacity-60 py-3 text-sm font-display font-bold text-text-primary transition-all"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : success ? (
              <>
                <Check className="h-4 w-4" /> Deposited!
              </>
            ) : (
              `Deposit ${formatUsdc(amount)}`
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Rules section ────────────────────────────────────────────────────────────

const RULE_TYPE_OPTIONS: { value: AgentRuleType; label: string }[] = [
  { value: 'prediction_strategy', label: 'Strategy' },
  { value: 'confidence_threshold', label: 'Confidence threshold' },
  { value: 'fixture_group', label: 'Fixture group' },
  { value: 'risk_level', label: 'Playing style' },
  { value: 'max_entry_fee', label: 'Max entry fee' },
  { value: 'min_entries', label: 'Min entries' },
  { value: 'max_entries', label: 'Max entries' },
];

function RulesSection({
  rules,
  onAddRule,
  onDeleteRule,
}: {
  rules: AgentRule[];
  onAddRule: (ruleType: AgentRuleType, ruleValue: Record<string, unknown>) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [ruleType, setRuleType] = useState<AgentRuleType>('prediction_strategy');
  const [ruleValue, setRuleValue] = useState<Record<string, unknown>>({ strategy: 'balanced' });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleAdd = async () => {
    setErr(null);
    setAdding(true);
    try {
      await onAddRule(ruleType, ruleValue);
      setShowAdd(false);
      setRuleType('prediction_strategy');
      setRuleValue({ strategy: 'balanced' });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to add rule.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    setDeleting(ruleId);
    try {
      await onDeleteRule(ruleId);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white/[0.02] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-zinc-500" />
          <p className="text-sm font-display font-bold text-text-primary">
            Rules
          </p>
          <span className="text-xs font-display font-bold text-zinc-600">
            {rules.length} active
          </span>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-display font-bold text-gold-400 hover:text-gold-300 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add rule
        </button>
      </div>

      {showAdd && (
        <div className="px-5 py-4 border-b border-border space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500">
              Rule type
            </label>
            <select
              value={ruleType}
              onChange={(e) => {
                const t = e.target.value as AgentRuleType;
                setRuleType(t);
                setRuleValue(getDefaultValue(t));
              }}
              className="w-full rounded-xl border border-border bg-white/5 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-gold-400"
            >
              {RULE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-zinc-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <RuleValueInput
            type={ruleType}
            value={ruleValue}
            onChange={setRuleValue}
          />

          {err && <p className="text-xs text-wrong">{err}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="flex-1 rounded-xl bg-gold-400 hover:bg-gold-300 disabled:opacity-60 py-2.5 text-xs font-display font-bold text-text-primary transition-colors"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                "Save rule"
              )}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 rounded-xl border border-border text-xs font-medium text-zinc-400 hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {rules.length === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-6">
          No rules configured — agent uses defaults.
        </p>
      ) : (
        <div className="divide-y divide-white/5">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between px-5 py-3.5 gap-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-display font-bold text-zinc-400 uppercase tracking-widest">
                  {RULE_TYPE_LABELS[rule.ruleType] ?? rule.ruleType}
                </p>
                <p className="text-sm text-text-primary mt-0.5 capitalize">
                  {formatRuleValue(
                    rule.ruleType,
                    rule.ruleValue as Record<string, unknown>,
                  )}
                </p>
              </div>
              <button
                onClick={() => handleDelete(rule.id)}
                disabled={deleting === rule.id}
                className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-wrong hover:bg-red-500/10 transition-colors"
              >
                {deleting === rule.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getDefaultValue(type: AgentRuleType): Record<string, unknown> {
  switch (type) {
    case 'prediction_strategy':
      return { strategy: 'balanced' };
    case 'confidence_threshold':
      return { min_confidence: 0.6 };
    case 'fixture_group':
      return { groups: ['Group Stage'] };
    case 'risk_level':
      return { level: 'moderate' };
    case 'max_entry_fee':
      return { max: 10 };
    case 'min_entries':
      return { min: 5 };
    case 'max_entries':
      return { max: 100 };
    default:
      return {};
  }
}

function RuleValueInput({
  type,
  value,
  onChange,
}: {
  type: AgentRuleType;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  if (type === 'prediction_strategy') {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500">Strategy</label>
        <div className="grid grid-cols-3 gap-2">
          {(["conservative", "balanced", "aggressive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onChange({ strategy: s })}
              className={cn(
                "rounded-xl border py-2.5 text-xs font-display font-bold capitalize transition-colors",
                value.strategy === s
                  ? "border-gold-400 bg-gold-400/10 text-gold-400"
                  : "border-border bg-white/5 text-zinc-400 hover:text-text-primary",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'risk_level') {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500">
          Playing style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["conservative", "moderate", "aggressive"] as const).map(
            (level) => (
              <button
                key={level}
                onClick={() => onChange({ level })}
                className={cn(
                  "rounded-xl border py-2.5 text-xs font-display font-bold capitalize transition-colors",
                  value.level === level
                    ? "border-gold-400 bg-gold-400/10 text-gold-400"
                    : "border-border bg-white/5 text-zinc-400 hover:text-text-primary",
                )}
              >
                {level}
              </button>
            ),
          )}
        </div>
      </div>
    );
  }

  if (type === 'confidence_threshold') {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500">
          Minimum confidence ({(Number(value.min_confidence ?? 0) * 100).toFixed(0)}%)
        </label>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={Number(value.min_confidence ?? 0.6)}
          onChange={(e) => onChange({ min_confidence: parseFloat(e.target.value) })}
          className="w-full accent-gold-400"
        />
      </div>
    );
  }

  if (type === 'fixture_group') {
    const GROUPS = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarter Final', 'Semi Final', 'Final'];
    const selected = (value.groups as string[]) ?? [];
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500">Only enter contests for</label>
        <div className="flex flex-wrap gap-2">
          {GROUPS.map((g) => {
            const on = selected.includes(g);
            return (
              <button
                key={g}
                onClick={() => {
                  const next = on
                    ? selected.filter((s) => s !== g)
                    : [...selected, g];
                  onChange({ groups: next });
                }}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  on
                    ? "border-gold-400 bg-gold-400/10 text-gold-400"
                    : "border-border bg-white/5 text-zinc-400 hover:text-text-primary",
                )}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'max_entry_fee' || type === 'min_entries' || type === 'max_entries') {
    const key = type === 'min_entries' ? 'min' : 'max';
    const label =
      type === 'max_entry_fee'
        ? 'Max entry fee (USDC)'
        : type === 'min_entries'
          ? 'Min entries in contest'
          : 'Max entries in contest';
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500">{label}</label>
        <input
          type="number"
          min={1}
          value={Number(value[key] ?? 0)}
          onChange={(e) => onChange({ [key]: Number(e.target.value) })}
          className="w-full rounded-xl border border-border bg-white/5 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-gold-400"
        />
      </div>
    );
  }

  return null;
}

// ─── Activity section ─────────────────────────────────────────────────────────

function ActivitySection({ actions }: { actions: AgentAction[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <Activity className="h-4 w-4 text-zinc-500" />
        <p className="text-sm font-display font-bold text-text-primary">
          Recent Activity
        </p>
      </div>

      {actions.length === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-8">
          No activity yet — the agent will act before the next contest deadline.
        </p>
      ) : (
        <div className="divide-y divide-white/5">
          {actions.slice(0, 10).map((action) => {
            const color = ACTION_COLORS[action.actionType] ?? "text-zinc-400";
            const label =
              ACTION_LABELS[action.actionType] ??
              action.actionType.replace(/_/g, " ");
            const date = new Date(action.createdAt).toLocaleDateString(
              "en-GB",
              {
                day: "numeric",
                month: "short",
              },
            );
            const isExpanded = expanded === action.id;

            return (
              <button
                key={action.id}
                onClick={() => setExpanded(isExpanded ? null : action.id)}
                className="w-full text-left px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "text-xs font-display font-bold capitalize",
                          color,
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    {isExpanded && action.reasoning && (
                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed italic">
                        &ldquo;{action.reasoning}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {action.amount && (
                      <span className="text-xs font-display font-bold text-text-primary">
                        {formatUsdc(action.amount)}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-700">{date}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Budget stat chip ─────────────────────────────────────────────────────────

function BudgetStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2.5">
      <p className="text-[9px] font-display font-bold text-zinc-600 uppercase tracking-widest">{label}</p>
      <p
        className={cn(
          'text-lg font-black leading-none mt-1',
          accent ? 'text-gold-400' : 'text-text-primary',
        )}
      >
        {value}
      </p>
    </div>
  );
}
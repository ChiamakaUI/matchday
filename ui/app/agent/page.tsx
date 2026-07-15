"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import {
  Zap,
  Shield,
  Target,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import { AuthLayout, AgentOverview } from "@/components";
import { useAgentConfig, useAgentActions, useAuth } from "@/hooks";
import {
  agentApi,
  cn,
  formatUsdc,
  agentVaultPda,
  agentConfigPda,
  getConnection,
  signInitializeAgentTx,
  signDepositTx,
  signActivateAgentTx,
  signDeactivateAgentTx,
} from "@/lib";

import type { AgentRuleType } from "@/types";

const STEPS = [
  { id: 1, label: "Configure" },
  { id: 2, label: "Deposit" },
  { id: 3, label: "Rules" },
  { id: 4, label: "Activate" },
];

export default function AgentPage() {
  const { data: config, isLoading, isError, refetch } = useAgentConfig();
  const { data: actions } = useAgentActions(20);
  const { getToken, solanaWallet } = useAuth();
  const queryClient = useQueryClient();

  const isConfigured = config?.configured === true;

const handleToggle = async (active: boolean) => {
    if (!solanaWallet) return;
    if (active) {
      await signActivateAgentTx(solanaWallet);
    } else {
      await signDeactivateAgentTx(solanaWallet);
    }
    const token = await getToken();
    await agentApi.updateSettings({ isActive: active }, token!);
    await queryClient.invalidateQueries({ queryKey: ["agent"] });
  };

  const handleDeposit = async (amount: number) => {
    if (!solanaWallet) return;
    const tx = await signDepositTx(solanaWallet, amount);
    const token = await getToken();
    await agentApi.updateSettings(
      { totalDeposited: amount, depositTx: tx },
      token!,
    );
    await queryClient.invalidateQueries({ queryKey: ["agent"] });
  };

  const handleAddRule = async (
    ruleType: AgentRuleType,
    ruleValue: Record<string, unknown>,
  ) => {
    const token = await getToken();
    const budgetId = config?.budget?.id;
    if (!budgetId) return;
    await agentApi.addRule({ budgetId, ruleType, ruleValue }, token!);
    await queryClient.invalidateQueries({ queryKey: ["agent"] });
  };

  const handleDeleteRule = async (ruleId: string) => {
    const token = await getToken();
    const budgetId = config?.budget?.id;
    if (!budgetId) return;
    await agentApi.deleteRule(ruleId, budgetId, token!);
    await queryClient.invalidateQueries({ queryKey: ["agent"] });
  };

  return (
    <AuthLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-xl font-display font-bold text-text-primary">
            AI Agent
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Your agent watches open contests, builds predictions, and enters on
            your behalf.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : isConfigured && config ? (
          <AgentOverview
            config={config}
            actions={actions ?? []}
            onToggle={handleToggle}
            onDeposit={handleDeposit}
            onAddRule={handleAddRule}
            onDeleteRule={handleDeleteRule}
          />
        ) : (
          <AgentSetupWizard />
        )}
      </div>
    </AuthLayout>
  );
}

// ─── Setup wizard ─────────────────────────────────────────────────────────────

const DEFAULT_RULES = [
  {
    key: "prediction_strategy",
    icon: Target,
    label: "Balanced strategy",
    description:
      "Agent uses a balanced approach — not too safe, not too risky.",
    value: { strategy: "balanced" },
    defaultOn: true,
  },
  {
    key: "risk_level",
    icon: Shield,
    label: "Moderate playing style",
    description:
      "Balanced prediction selection between safe and aggressive picks.",
    value: { level: "moderate" },
    defaultOn: true,
  },
  {
    key: "min_entries",
    icon: Zap,
    label: "Skip low-entry contests",
    description: "Avoids contests with fewer than 5 entries.",
    value: { min: 5 },
    defaultOn: false,
  },
] as const;

function AgentSetupWizard() {
  const [step, setStep] = useState(1);
  const [maxSpend, setMaxSpend] = useState(5);
  const [maxContests, setMaxContests] = useState(3);
  const [depositAmount, setDepositAmount] = useState(25);
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [selectedRules, setSelectedRules] = useState<Set<string>>(
    new Set(DEFAULT_RULES.filter((r) => r.defaultOn).map((r) => r.key)),
  );
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { walletAddress, solanaWallet, getToken } = useAuth();
  const queryClient = useQueryClient();

  const toggleRule = (key: string) =>
    setSelectedRules((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // Step 1 — configure spending limits
  const handleSetup = async () => {
    if (!solanaWallet || !walletAddress) return;
    setErr(null);
    setLoading(true);
    try {
      const userPubkey = new PublicKey(walletAddress);

      // Check on-chain first — skip tx if PDA already exists
      const connection = getConnection();
      const existingConfig = await connection.getAccountInfo(
        agentConfigPda(userPubkey),
      );

      if (!existingConfig) {
        await signInitializeAgentTx(solanaWallet, maxSpend, maxContests);
      }

      const token = await getToken();
      const vaultPda = agentVaultPda(userPubkey).toBase58();
      const budget = (await agentApi.setup(
        {
          maxSpendPerContest: maxSpend,
          maxContestsPerWeek: maxContests,
          vaultPda,
        },
        token!,
      )) as any;
      setBudgetId(budget?.id ?? null);
      setStep(2);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Setup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — deposit USDC
  const handleDeposit = async () => {
    if (!solanaWallet) return;
    setErr(null);
    setLoading(true);
    try {
      const tx = await signDepositTx(solanaWallet, depositAmount);
      const token = await getToken();
      await agentApi.updateSettings(
        { totalDeposited: depositAmount, depositTx: tx },
        token!,
      );
      setStep(3);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Deposit failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — save rules
  const handleSaveRules = async () => {
    setErr(null);
    setLoading(true);
    try {
      if (budgetId) {
        const token = await getToken();
        const rulesToAdd = DEFAULT_RULES.filter((r) =>
          selectedRules.has(r.key),
        );
        for (const r of rulesToAdd) {
          await agentApi.addRule(
            {
              budgetId,
              ruleType: r.key,
              ruleValue: r.value as Record<string, unknown>,
            },
            token!,
          );
        }
      }
      setStep(4);
    } catch (e: unknown) {
      setErr(
        e instanceof Error ? e.message : "Saving rules failed. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 4 — activate
  const handleActivate = async () => {
    if (!solanaWallet) return;
    setErr(null);
    setLoading(true);
    try {
      await signActivateAgentTx(solanaWallet);
      const token = await getToken();
      await agentApi.updateSettings({ isActive: true }, token!);
      await queryClient.invalidateQueries({ queryKey: ["agent"] });
      window.location.reload();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Activation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <StepIndicator current={step} />

      {step === 1 && (
        <SetupCard
          title="Set your spending limits"
          description="Your agent will never spend more than these amounts. You can change them any time."
        >
          <div className="space-y-5">
            <SliderField
              label="Max spend per contest"
              value={maxSpend}
              min={1}
              max={50}
              step={1}
              format={(v) => formatUsdc(v)}
              onChange={setMaxSpend}
              hint="The most the agent will pay to enter a single contest."
            />
            <SliderField
              label="Max contests per week"
              value={maxContests}
              min={1}
              max={10}
              step={1}
              format={(v) => `${v} contest${v > 1 ? "s" : ""}`}
              onChange={setMaxContests}
              hint="The agent won't enter more than this many contests per week."
            />
            <SummaryBox>
              Maximum weekly exposure:{" "}
              <span className="text-text-primary font-display font-bold">
                {formatUsdc(maxSpend * maxContests)}
              </span>
            </SummaryBox>
            {err && <p className="text-xs text-wrong">{err}</p>}
            <ActionButton onClick={handleSetup} loading={loading}>
              Set up my agent <ChevronRight className="h-4 w-4" />
            </ActionButton>
          </div>
        </SetupCard>
      )}

      {step === 2 && (
        <SetupCard
          title="Fund your agent vault"
          description="Your agent draws from this vault to pay entry fees. You can top it up any time."
        >
          <div className="space-y-5">
            <SliderField
              label="Initial deposit"
              value={depositAmount}
              min={5}
              max={500}
              step={5}
              format={(v) => formatUsdc(v)}
              onChange={setDepositAmount}
              hint={`Covers ${Math.floor(depositAmount / maxSpend)} contest entries at your current limit.`}
            />
            <div className="grid grid-cols-3 gap-2">
              {[25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(amt)}
                  className={cn(
                    "rounded-xl border py-2.5 text-sm font-display font-bold transition-colors",
                    depositAmount === amt
                      ? "border-gold-400 bg-gold-400/10 text-gold-400"
                      : "border-border bg-white/5 text-zinc-400 hover:border-border hover:text-text-primary",
                  )}
                >
                  {formatUsdc(amt)}
                </button>
              ))}
            </div>
            {err && <p className="text-xs text-wrong">{err}</p>}
            <ActionButton onClick={handleDeposit} loading={loading}>
              Deposit {formatUsdc(depositAmount)}{" "}
              <ChevronRight className="h-4 w-4" />
            </ActionButton>
            <button
              onClick={() => setStep(3)}
              className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1"
            >
              Skip for now — I'll deposit later
            </button>
          </div>
        </SetupCard>
      )}

      {step === 3 && (
        <SetupCard
          title="Add rules (optional)"
          description="Choose which defaults your agent should follow. You can edit these from the dashboard."
        >
          <div className="space-y-4">
            <div className="space-y-2">
              {DEFAULT_RULES.map((r) => {
                const on = selectedRules.has(r.key);
                const Icon = r.icon;
                return (
                  <button
                    key={r.key}
                    onClick={() => toggleRule(r.key)}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                      on
                        ? "border-gold-400/40 bg-gold-400/5"
                        : "border-border bg-white/5 hover:border-border",
                    )}
                  >
                    <div
                      className={cn(
                        "h-5 w-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                        on ? "bg-gold-400 border-gold-400" : "border-border",
                      )}
                    >
                      {on && <Check className="h-3 w-3 text-text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          on ? "text-text-primary" : "text-zinc-400",
                        )}
                      >
                        {r.label}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {r.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {err && <p className="text-xs text-wrong">{err}</p>}
            <ActionButton onClick={handleSaveRules} loading={loading}>
              Save and continue <ChevronRight className="h-4 w-4" />
            </ActionButton>
            <button
              onClick={() => setStep(4)}
              className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1"
            >
              Skip — use defaults
            </button>
          </div>
        </SetupCard>
      )}

      {step === 4 && (
        <SetupCard
          title="Ready to activate"
          description="Your agent is configured and funded. Activate it to start entering contests automatically."
        >
          <div className="space-y-5">
            <div className="rounded-xl bg-white/5 divide-y divide-white/5">
              <SummaryRow
                label="Max per contest"
                value={formatUsdc(maxSpend)}
              />
              <SummaryRow
                label="Max per week"
                value={`${maxContests} contest${maxContests > 1 ? "s" : ""}`}
              />
              <SummaryRow
                label="Weekly budget"
                value={formatUsdc(maxSpend * maxContests)}
              />
              <SummaryRow
                label="Vault funded"
                value={formatUsdc(depositAmount)}
                accent
              />
              <SummaryRow
                label="Rules"
                value={`${selectedRules.size} rule${selectedRules.size !== 1 ? "s" : ""} configured`}
              />
            </div>
            {err && <p className="text-xs text-wrong">{err}</p>}
            <ActionButton onClick={handleActivate} loading={loading}>
              <Zap className="h-4 w-4" /> Activate agent
            </ActionButton>
          </div>
        </SetupCard>
      )}
    </div>
  );
}

// ─── Shared wizard components ─────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div
            key={step.id}
            className="flex items-center flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
                  done
                    ? "bg-gold-400 text-text-primary"
                    : active
                      ? "bg-gold-400/20 border border-gold-400/50 text-gold-400"
                      : "bg-white/5 border border-border text-zinc-600",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span
                className={cn(
                  "text-[9px] font-display font-bold uppercase tracking-widest",
                  active
                    ? "text-gold-400"
                    : done
                      ? "text-zinc-400"
                      : "text-zinc-700",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-2 mb-4 transition-colors",
                  done ? "bg-gold-400/50" : "bg-white/8",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SetupCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white/[0.02] overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary">
            {title}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-zinc-300">{label}</label>
        <span className="text-xl font-black text-gold-400">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-gold-400 cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-zinc-700">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

function SummaryBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white/5 px-4 py-3 text-sm text-zinc-400">
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-center px-4 py-3">
      <span className="text-sm text-zinc-400">{label}</span>
      <span
        className={cn(
          "text-sm font-display font-bold",
          accent ? "text-gold-400" : "text-text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ActionButton({
  onClick,
  loading = false,
  children,
}: {
  onClick: () => void;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gold-400 hover:bg-gold-300 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3.5 text-sm font-display font-bold text-text-primary transition-all shadow-lg shadow-gold-400/20"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

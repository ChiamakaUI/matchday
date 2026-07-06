"use client";

import { useState } from "react";
import { LogOut, Copy, CheckCheck, Wallet } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { useAuth, useCurrentUser, useUserEntries } from "@/hooks";
import { shortenAddress, formatUsdc } from "@/lib/utils";


export default function ProfilePage() {
  const { user, authenticated, logout, walletAddress } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const { data: entries } = useUserEntries();
  const [copied, setCopied] = useState(false);

  const displayName = (() => {
    const google = (user as any)?.google?.name;
    if (google) return google;
    const email = (user as any)?.email?.address;
    if (email) return email;
    return "Manager";
  })();

  const initial = displayName[0]?.toUpperCase() ?? "M";

  const totalEntries  = entries?.length ?? 0;
  const settledEntries = entries?.filter((e) => e.contestStatus === "settled") ?? [];
  const bestRank      = settledEntries.reduce((best, e) => (e.rank && (!best || e.rank < best) ? e.rank : best), null as number | null);
  const totalSpent    = entries?.reduce((sum, e) => sum + parseFloat(e.entryFee as string), 0) ?? 0;

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6 max-w-xl">

        {/* Avatar + name */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gold-400/20 border border-gold-400/30 flex items-center justify-center shrink-0">
              <span className="font-display text-3xl font-black text-gold-400">{initial}</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-black uppercase tracking-tight text-text-primary truncate">
                {displayName}
              </h1>
              {walletAddress && (
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-1.5 mt-1 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors group"
                >
                  <Wallet className="h-3 w-3" />
                  {shortenAddress(walletAddress, 6)}
                  {copied
                    ? <CheckCheck className="h-3 w-3 text-gold-400" />
                    : <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  }
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-3">Your Stats</p>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total Entries" value={totalEntries.toString()} />
            <StatCard label="Best Rank" value={bestRank ? `#${bestRank}` : "—"} accent={!!bestRank && bestRank <= 3} />
            <StatCard label="Total Spent" value={formatUsdc(totalSpent)} />
          </div>
        </div>

        {/* Wallet section */}
        {walletAddress && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-3">Wallet</p>
            <div className="rounded-xl bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] text-zinc-600 mb-1">Solana Address</p>
                <p className="text-xs font-mono text-zinc-300 truncate">{walletAddress}</p>
              </div>
              <button
                onClick={copyAddress}
                className="shrink-0 h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-text-primary transition-colors"
              >
                {copied ? <CheckCheck className="h-3.5 w-3.5 text-gold-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-700 mt-3">
              Privy embedded wallet · Solana Devnet
            </p>
          </div>
        )}

        {/* Disconnect */}
        <button
          onClick={logout}
          className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-5 py-3.5 text-sm font-display font-display font-bold text-wrong hover:text-red-300 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Disconnect wallet
        </button>
      </div>
    </AuthLayout>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-center">
      <p className="text-[9px] font-display font-bold text-zinc-600 uppercase tracking-widest">{label}</p>
      <p className={`font-display text-3xl font-black leading-none mt-2 ${accent ? "text-amber-400" : "text-text-primary"}`}>
        {value}
      </p>
    </div>
  );
}
"use client";

import { AuthLayout } from "@/components/layout/auth-layout";
import { ChatWindow } from "@/components/agent/chat-window";

export default function AssistantPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col h-[calc(100dvh-200px)] lg:h-[calc(100dvh-120px)] space-y-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-black  tracking-tight text-text-primary">
            AI Assistant
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Squad advice, player insights, and strategy — just ask.
          </p>
        </div>
        <div className="flex-1 rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:p-6 overflow-hidden min-h-0">
          <ChatWindow />
        </div>
      </div>
    </AuthLayout>
  );
}
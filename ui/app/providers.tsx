

// "use client";

// import { PrivyProvider } from "@privy-io/react-auth";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
// import { useState } from "react";

// const SOLANA_DEVNET_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "";

// const SOLANA_MAINNET_RPC = process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC_URL ?? "";

// const SOLANA_DEVNET_WS_URL = SOLANA_DEVNET_RPC.replace(/^http/, "ws");
// const SOLANA_MAINNET_WS_URL = SOLANA_MAINNET_RPC.replace(/^http/, "ws");

// export function Providers({ children }: { children: React.ReactNode }) {
//   const [queryClient] = useState(
//     () =>
//       new QueryClient({
//         defaultOptions: {
//           queries: {
//             staleTime: 60 * 1000,
//             retry: 1,
//           },
//         },
//       }),
//   );

//   const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

//   if (!appId) {
//     if (typeof window !== "undefined") {
//       console.error(
//         "[Providers] NEXT_PUBLIC_PRIVY_APP_ID is not set. " +
//           "Add it to .env.local and restart the dev server.",
//       );
//     }
//     return <>{children}</>;
//   }

//   return (
//     // <PrivyProvider
//     //   appId={appId}
//     //   config={{
//     //     loginMethods: ["email", "google"],
//     //     appearance: {
//     //       theme: "dark",
//     //       accentColor: "#8b6dff",
//     //       logo: undefined,
//     //       walletChainType: "solana-only",
//     //     },
//     //     embeddedWallets: {
//     //       solana: {
//     //         createOnLogin: "all-users",
//     //       },
//     //     },
//     //     solana: {
//     //       rpcs: {
//     //         "solana:devnet": {
//     //           rpc: createSolanaRpc(SOLANA_DEVNET_RPC),
//     //           rpcSubscriptions:
//     //             createSolanaRpcSubscriptions(SOLANA_DEVNET_WS_URL),
//     //         },
//     //         "solana:mainnet": {
//     //           rpc: createSolanaRpc(SOLANA_MAINNET_RPC),
//     //           rpcSubscriptions: createSolanaRpcSubscriptions(
//     //             SOLANA_MAINNET_WS_URL,
//     //           ),
//     //         },
//     //       },
//     //     },
//     //   }}
//     // >
//     <PrivyProvider
//   appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
//   config={{
//     loginMethods: ["email", "google"],
//     appearance: { theme: "dark" },
//     embeddedWallets: {
//       createOnLogin: "all-users", // was "users-without-wallets" — forces Solana wallet for existing ETH users too
//       noPromptOnSignature: false,
//     },
//     solanaClusters: [
//       {
//         name: "devnet",
//         rpcUrl: process.env.NEXT_PUBLIC_HELIUS_RPC_URL ?? "https://api.devnet.solana.com",
//       },
//     ],
//   }}
// >
//       <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
//     </PrivyProvider>
//   );
// }

"use client";

import { type ReactNode, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

const SOLANA_DEVNET_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "";

const SOLANA_DEVNET_WS = SOLANA_DEVNET_RPC.replace(/^http/, "ws");

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  );

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    if (typeof window !== "undefined") {
      console.error(
        "[Providers] NEXT_PUBLIC_PRIVY_APP_ID is not set. " +
          "Add it to .env.local and restart the dev server."
      );
    }
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "google"],
        appearance: {
          theme: "dark",
          accentColor: "#10b981",
          walletChainType: "solana-only",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "all-users",
          },
        },
        solana: {
          rpcs: {
            "solana:devnet": {
              rpc: createSolanaRpc(SOLANA_DEVNET_RPC),
              rpcSubscriptions: createSolanaRpcSubscriptions(SOLANA_DEVNET_WS),
            },
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PrivyProvider>
  );
}
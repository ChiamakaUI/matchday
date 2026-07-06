import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';

export function useAuth() {
  const { user, authenticated, ready, login, logout, getAccessToken } = usePrivy();
  const { wallets } = useWallets();

  const solanaWallet = wallets[0] ?? null;
  const walletAddress = solanaWallet?.address ?? null;

  return {
    user,
    authenticated,
    ready,
    login,
    logout,
    getToken: getAccessToken,
    walletAddress,
    solanaWallet,
  };
}

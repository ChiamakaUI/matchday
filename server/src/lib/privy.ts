import { PrivyClient } from '@privy-io/server-auth';
import { env } from '../config/index.js';

let _privy: PrivyClient | null = null;

export function getPrivyClient(): PrivyClient {
  if (!_privy) {
    _privy = new PrivyClient(env().PRIVY_APP_ID, env().PRIVY_APP_SECRET);
  }
  return _privy;
}
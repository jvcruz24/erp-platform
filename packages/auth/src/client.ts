import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

export function createClient(options: { baseURL: string }) {
  return createAuthClient({
    baseURL: options.baseURL,
    plugins: [organizationClient()],
  });
}

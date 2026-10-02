/**
 * Bun test preload: loads `.env.local` (database URL for the integration
 * tests) before any module reads `process.env`.
 *
 * Wired through `bunfig.toml` `[test] preload`; the tests themselves are run
 * with `--conditions=react-server` so the `server-only` guard used by
 * `src/db/client.ts` resolves to its no-op build outside Next.js.
 */

import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });

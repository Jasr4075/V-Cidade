import Constants from 'expo-constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'http://localhost:54321';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const LOCAL_SUPABASE_PORT = 54321;

function isLoopbackUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

/**
 * Host the device used to reach the Metro dev server. On a physical device
 * `localhost` means the phone itself, so the local Supabase stack is only
 * reachable through the machine's LAN address.
 */
function getDevServerHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;

  if (!hostUri) return null;

  const host = hostUri.replace(/^[a-z+]+:\/\//i, '').split(':')[0];
  return host || null;
}

/**
 * Resolves the Supabase URL, pointing the local stack at whatever host the
 * device is using for Metro. A non-loopback URL (Supabase Cloud, a LAN host)
 * is always used verbatim.
 */
function resolveSupabaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;

  if (!isLoopbackUrl(configured)) return configured;

  const devHost = getDevServerHost();

  if (!devHost) {
    if (__DEV__) {
      console.warn(
        '[supabase] host do Metro não identificado; usando localhost. Em um celular isso ' +
          'aponta para o próprio aparelho. Defina EXPO_PUBLIC_SUPABASE_URL com o IP da máquina.'
      );
    }
    return configured;
  }

  return `http://${devHost}:${LOCAL_SUPABASE_PORT}`;
}

const supabaseUrl = resolveSupabaseUrl();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (__DEV__) {
  console.log(`[supabase] usando API em ${supabaseUrl}`);
}

export const ANONYMOUS_ID_HEADER = 'x-anonymous-id';

let anonymousId: string | null = null;

/**
 * Keeps the anonymous id in memory so it can be attached to every request.
 * PostgREST forwards it as the `request.headers` GUC, which the RLS policies
 * in supabase/migrations/20240101000200_anonymous_ownership_rls.sql read to
 * decide row ownership without requiring a login.
 */
export function setSupabaseAnonymousId(id: string | null): void {
  anonymousId = id;
}

export function getSupabaseAnonymousId(): string | null {
  return anonymousId;
}

const supabaseFetch: typeof fetch = async (input, init) => {
  const baseHeaders =
    init?.headers ?? (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined);
  const headers = new Headers(baseHeaders);

  if (anonymousId) {
    headers.set(ANONYMOUS_ID_HEADER, anonymousId);
  }

  return fetch(input, { ...init, headers });
};

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: supabaseFetch,
      },
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

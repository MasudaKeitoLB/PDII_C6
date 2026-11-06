import { normalizeName } from './auth';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const legacyAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callRpc<T>(name: string, body: Record<string, string>): Promise<T> {
  const apiKey = publishableKey || legacyAnonKey;
  if (!supabaseUrl || !apiKey) throw new Error('Supabase の接続設定がありません');
  const headers = new Headers({ apikey: apiKey, 'Content-Type': 'application/json' });
  if (!publishableKey) headers.set('Authorization', `Bearer ${apiKey}`);
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('管理者側ログインを確認できません');
  return response.json() as Promise<T>;
}

/** 従業員名かどうかだけを照合。テーブルの一覧はブラウザに返さない。 */
export async function isStaffName(name: string): Promise<boolean> {
  return callRpc<boolean>('is_staff', { p_name: normalizeName(name) });
}

/** 暗証番号の照合もDB関数内で行い、ハッシュやアカウント情報を返さない。 */
export async function authenticateStaff(name: string, pin: string): Promise<boolean> {
  return callRpc<boolean>('authenticate_staff', { p_name: normalizeName(name), p_pin: pin });
}

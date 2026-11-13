import type { AdminAccount } from './types';

// この値は画面表示用。実データのアクセス権はサーバー側で別途検証する。
let verifiedAccount: AdminAccount | null = null;
export function verifiedAdmin(id: string | null): AdminAccount | null {
  return verifiedAccount?.id === id ? verifiedAccount : null;
}
export function clearVerifiedAdmin() { verifiedAccount = null; }

async function rpc(name: string, args: Record<string, string>): Promise<unknown> {
  const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabaseの接続設定がありません。運営者に確認してください。');
  let response: Response;
  try {
    response = await fetch(`${url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error('接続できませんでした。通信環境を確認して、もう一度お試しください。');
  }
  if (!response.ok) throw new Error('認証サービスに接続できません。Supabaseの設定を確認してください。');
  return response.json();
}

export async function isStaffId(id: string): Promise<boolean> {
  const result = await rpc('hoho_staff_exists', { p_name: id.trim() });
  if (typeof result !== 'boolean') throw new Error('認証サービスの応答が正しくありません。');
  return result;
}

export async function authenticateStaff(id: string, password: string): Promise<AdminAccount | null> {
  clearVerifiedAdmin();
  const result = await rpc('hoho_staff_login', { p_name: id.trim(), p_password: password });
  if (result === null) return null;
  if (typeof result !== 'object') throw new Error('認証サービスの応答が正しくありません。');
  const row = result as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.name !== 'string' ||
      typeof row.facilityId !== 'string' || typeof row.organization !== 'string' ||
      (row.role !== 'staff' && row.role !== 'careManager')) {
    throw new Error('認証サービスの応答が正しくありません。');
  }
  verifiedAccount = { id: row.id, name: row.name, role: row.role,
    facilityId: row.facilityId, organization: row.organization, password: '' };
  return verifiedAccount;
}

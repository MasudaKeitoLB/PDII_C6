// 端末への保存。プライベートモードなどで使えないときは メモリに置いて 動き続ける。
//
// このページで書いた値は メモリにも持っておき、読むときは メモリを先に見る。
// （読めるが書けない localStorage では、書いた値が localStorage に残らないため）

/** null は「このページで消した」しるし */
const memory = new Map<string, string | null>();

function readRaw(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // 保存できない環境でも 画面は そのまま使える
  }
}

export function removeKey(key: string): void {
  memory.set(key, null);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 何もしない
  }
}

// 記録を見せる相手（U-08）。本実装では 施設が登録した担当者を サーバーから受け取る。
// 試作では Figma の見本と同じ内容を出す。

export const SHARE_TARGETS = {
  facility: { name: 'てまりフィットネス', role: '施設のスタッフ' },
  careManager: { role: 'ケアマネージャー', name: '佐藤 恵子' },
} as const;

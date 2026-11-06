// デモ用のサンプルの利用者（Figma の管理者画面 AP-02 の12人）。
// 今日の歩数・目標・前週との差・最終受信は Figma と同じにし、それより前の日は 決まった乱数で作る。
// 山田 花子さんの 30日分は、Figma の R-01・R-02 のグラフから読みとった数にしている。

import { addDays, dayKey, lastDays, startOfDay } from './dates';
import { gameAt } from './game';
import type { AppUser, Gender } from './types';

export const SAMPLE_FACILITY_ID = 'temari-01';
export const SAMPLE_CARE_MANAGER_ID = 'cm-sato-0412';
export const OTHER_CARE_MANAGER_ID = 'cm-kimura-0207';

interface SampleSpec {
  id: string;
  name: string;
  kana: string;
  nickname: string;
  birthday: { year: number; month: number; day: number };
  gender: Gender;
  heightCm: number;
  weightKg: number;
  careLevel: string | null;
  goal: number;
  today: number;
  /** 先週の同じ曜日の歩数。null は Figma で「―」（今日の記録が届いていない） */
  lastWeekSameDay: number | null;
  /** 最終受信：何日前の何時何分か */
  received: { daysAgo: number; time: string };
  careManagerId: string | null;
  letter: string;
  level: number;
  points: number;
}

const SPECS: SampleSpec[] = [
  { id: 's-yoshida', name: '吉田 千代', kana: 'よしだ ちよ', nickname: 'ちよ', birthday: { year: 1938, month: 2, day: 11 }, gender: 'female', heightCm: 145, weightKg: 44, careLevel: '要介護1', goal: 2000, today: 0, lastWeekSameDay: null, received: { daysAgo: 3, time: '17:40' }, careManagerId: OTHER_CARE_MANAGER_ID, letter: 'C', level: 4, points: 210 },
  { id: 's-tanaka', name: '田中 幸子', kana: 'たなか さちこ', nickname: 'さちこ', birthday: { year: 1941, month: 6, day: 2 }, gender: 'female', heightCm: 147, weightKg: 46, careLevel: '要介護1', goal: 2500, today: 920, lastWeekSameDay: null, received: { daysAgo: 1, time: '18:05' }, careManagerId: SAMPLE_CARE_MANAGER_ID, letter: 'S', level: 6, points: 380 },
  { id: 's-nakamura', name: '中村 勇', kana: 'なかむら いさむ', nickname: 'いさむ', birthday: { year: 1946, month: 4, day: 20 }, gender: 'male', heightCm: 160, weightKg: 58, careLevel: '要介護2', goal: 2000, today: 1260, lastWeekSameDay: 1180, received: { daysAgo: 0, time: '10:05' }, careManagerId: OTHER_CARE_MANAGER_ID, letter: 'N', level: 5, points: 300 },
  { id: 's-sasaki', name: '佐々木 一郎', kana: 'ささき いちろう', nickname: 'いちろう', birthday: { year: 1944, month: 1, day: 15 }, gender: 'male', heightCm: 162, weightKg: 60, careLevel: '要介護1', goal: 3000, today: 1840, lastWeekSameDay: 2210, received: { daysAgo: 0, time: '9:58' }, careManagerId: SAMPLE_CARE_MANAGER_ID, letter: 'I', level: 7, points: 450 },
  { id: 's-yamaguchi', name: '山口 隆', kana: 'やまぐち たかし', nickname: 'たかし', birthday: { year: 1953, month: 3, day: 8 }, gender: 'male', heightCm: 166, weightKg: 64, careLevel: '要支援2', goal: 4000, today: 2890, lastWeekSameDay: 3020, received: { daysAgo: 0, time: '10:11' }, careManagerId: OTHER_CARE_MANAGER_ID, letter: 'T', level: 9, points: 720 },
  { id: 's-yamada', name: '山田 花子', kana: 'やまだ はなこ', nickname: 'はなこ', birthday: { year: 1947, month: 5, day: 3 }, gender: 'female', heightCm: 152, weightKg: 50, careLevel: '要支援1', goal: 5000, today: 3210, lastWeekSameDay: 2790, received: { daysAgo: 0, time: '10:32' }, careManagerId: SAMPLE_CARE_MANAGER_ID, letter: 'H', level: 12, points: 1280 },
  { id: 's-kobayashi', name: '小林 節子', kana: 'こばやし せつこ', nickname: 'せつこ', birthday: { year: 1950, month: 9, day: 27 }, gender: 'female', heightCm: 150, weightKg: 49, careLevel: '要支援1', goal: 5000, today: 3980, lastWeekSameDay: 4400, received: { daysAgo: 0, time: '10:29' }, careManagerId: OTHER_CARE_MANAGER_ID, letter: 'K', level: 11, points: 990 },
  { id: 's-ito', name: '伊藤 正', kana: 'いとう ただし', nickname: 'ただし', birthday: { year: 1949, month: 7, day: 14 }, gender: 'male', heightCm: 164, weightKg: 62, careLevel: '要支援2', goal: 5000, today: 4130, lastWeekSameDay: 3870, received: { daysAgo: 0, time: '10:22' }, careManagerId: SAMPLE_CARE_MANAGER_ID, letter: 'M', level: 10, points: 860 },
  { id: 's-watanabe', name: '渡辺 京子', kana: 'わたなべ きょうこ', nickname: 'きょうこ', birthday: { year: 1955, month: 5, day: 30 }, gender: 'female', heightCm: 153, weightKg: 52, careLevel: '要支援1', goal: 6000, today: 4470, lastWeekSameDay: 5010, received: { daysAgo: 0, time: '10:37' }, careManagerId: OTHER_CARE_MANAGER_ID, letter: 'W', level: 13, points: 1150 },
  { id: 's-suzuki', name: '鈴木 和子', kana: 'すずき かずこ', nickname: 'かずこ', birthday: { year: 1952, month: 8, day: 9 }, gender: 'female', heightCm: 151, weightKg: 51, careLevel: '要支援2', goal: 6000, today: 5620, lastWeekSameDay: 4980, received: { daysAgo: 0, time: '10:41' }, careManagerId: SAMPLE_CARE_MANAGER_ID, letter: 'Z', level: 14, points: 1340 },
  { id: 's-takahashi', name: '高橋 茂', kana: 'たかはし しげる', nickname: 'しげる', birthday: { year: 1957, month: 2, day: 19 }, gender: 'male', heightCm: 168, weightKg: 66, careLevel: '要支援1', goal: 7000, today: 6890, lastWeekSameDay: 7120, received: { daysAgo: 0, time: '10:15' }, careManagerId: SAMPLE_CARE_MANAGER_ID, letter: 'G', level: 16, points: 1620 },
  { id: 's-kato', name: '加藤 博', kana: 'かとう ひろし', nickname: 'ひろし', birthday: { year: 1958, month: 1, day: 4 }, gender: 'male', heightCm: 170, weightKg: 68, careLevel: null, goal: 7000, today: 7350, lastWeekSameDay: 6810, received: { daysAgo: 0, time: '10:44' }, careManagerId: OTHER_CARE_MANAGER_ID, letter: 'R', level: 17, points: 1800 },
];

/**
 * 山田 花子さんの 30日分（古い日から。最後が今日）。Figma の R-02 の棒の高さから読みとり、
 * 合計を R-02 のまとめ（平均 4,202歩・70.6km・3,908kcal ＝ 合計 126,060歩）に合わせた数。
 * 最後の7日は R-01・AP-03 の数、7日前（先週の同じ曜日・2,790歩）は AP-03「先週の同じ曜日より ＋420歩」に合う数。
 */
const YAMADA_30_DAYS = [
  3350, 2716, 4614, 3247, 1312, 4108, 2838, 5762, 6231, 5683, 4315, 4858, 5712, 1368, 2930, 6061, 5963, 5822, 4516,
  3076, 4516, 3382, 2790, 4820, 5310, 2150, 6020, 5480, 3900, 3210,
];

/** 決まった乱数（毎回同じ数が出る） */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function atTime(day: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
}

/** 今日を基準に サンプルの利用者を作る（日がかわったら 作りなおす） */
export function buildSampleUsers(now: Date): AppUser[] {
  const today = startOfDay(now);
  const days30 = lastDays(today, 30);
  return SPECS.map((spec, index) => {
    const days: Record<string, number> = {};
    if (spec.id === 's-yamada') {
      days30.forEach((d, i) => (days[dayKey(d)] = YAMADA_30_DAYS[i]));
    } else {
      const rand = seeded(hash(spec.id));
      days30.slice(0, -1).forEach((d) => {
        const ratio = 0.45 + rand() * 0.75;
        days[dayKey(d)] = Math.round((spec.goal * ratio) / 10) * 10;
      });
      days[dayKey(today)] = spec.today;
      if (spec.lastWeekSameDay !== null) days[dayKey(addDays(today, -7))] = spec.lastWeekSameDay;
    }
    // 記録が届いていない人は、最後に受け取った日より後の記録を持たない
    const receivedDay = startOfDay(addDays(today, -spec.received.daysAgo));
    if (spec.received.daysAgo > 0) {
      for (const d of days30) if (d > receivedDay && dayKey(d) !== dayKey(today)) delete days[dayKey(d)];
      if (spec.today === 0) delete days[dayKey(today)];
    }
    let received = atTime(receivedDay, spec.received.time);
    // まだその時刻になっていないときは、少し前に受け取ったことにする
    if (received > now) received = new Date(now.getTime() - (index + 1) * 3 * 60_000);

    return {
      id: spec.id,
      name: spec.name,
      kana: spec.kana,
      nickname: spec.nickname,
      birthday: spec.birthday,
      letter: spec.letter,
      gender: spec.gender,
      heightCm: spec.heightCm,
      weightKg: spec.weightKg,
      dailyGoalSteps: spec.goal,
      careLevel: spec.careLevel,
      facilityId: SAMPLE_FACILITY_ID,
      careManagerId: spec.careManagerId,
      shares: {
        facility: { agreed: true, changedAt: new Date(2026, 3, 1).toISOString() },
        careManager: { agreed: true, changedAt: new Date(2026, 3, 1).toISOString() },
      },
      textSize: 'normal',
      days,
      lastSyncAt: received.toISOString(),
      game: gameAt(spec.level, spec.id === 's-yamada' ? 1450 : 1200 + index * 90, spec.points),
      registeredAt: new Date(2026, 3, 1).toISOString(),
      sample: true,
    } satisfies AppUser;
  });
}

/** デモ用：新しく登録した人にも 30日分の記録を入れて、グラフを見られるようにする */
export function sampleHistory(goal: number, seedText: string, now: Date): Record<string, number> {
  const rand = seeded(hash(seedText));
  const days: Record<string, number> = {};
  lastDays(startOfDay(now), 30)
    .slice(0, -1)
    .forEach((d) => {
      days[dayKey(d)] = Math.round((goal * (0.4 + rand() * 0.8)) / 10) * 10;
    });
  return days;
}

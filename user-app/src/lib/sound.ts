// 演出の 音（docs/世界観.md 9章）。音の ファイルは 使わず、Web Audio で 合成する。
// - 場面 → 音の 並び（高さ・長さ・音色・音量）は 純粋な データで 持つ（単体テストで 決まりを 確かめる）
// - 琴：三角波を はじいて すぐ 小さく／鈴：近い 高さの サイン波を 2つ 重ねる／
//   太鼓：低い サイン波の 高さを すばやく 下げる／笛：サイン波を ゆっくり 立ち上げ、少し ゆらす
// - 音階は ヨナ抜き（ド・レ・ミ・ソ・ラ）。どの 音を ならべても にごらない
// - 大きすぎない・高すぎない・急に 鳴らさない（どの 音も 少し かけて 立ち上げる）
// このファイルは 単体テスト（node --test）で そのまま動かすので、React・絵を 入れない。

import { getPreferences } from './preferences.ts';

export type Timbre = 'koto' | 'suzu' | 'taiko' | 'fue';

/** 1つの 音 */
export interface Note {
  /** 鳴りはじめ（その場面の はじめから 何秒） */
  at: number;
  /** 高さ（Hz） */
  freq: number;
  /** 長さ（秒） */
  dur: number;
  timbre: Timbre;
  /** いちばん 大きい ときの 音量（0〜1） */
  gain: number;
}

export type SoundName = 'defeat' | 'levelUp' | 'bossMeet' | 'bossDefeat' | 'areaClear' | 'rare' | 'tap' | 'walkBell' | 'chime';

// ---------- 決まり（テストで 確かめる） ----------

/** 1つの 音の 音量の 上限（全体の 2〜3割） */
export const MAX_NOTE_GAIN = 0.25;
/** 同時に 鳴っている 音の 音量の 合計の 上限 */
export const MAX_TOTAL_GAIN = 0.3;
/** 1つの 音の 長さ（0.1〜1.5秒） */
export const MIN_NOTE_SEC = 0.1;
export const MAX_NOTE_SEC = 1.5;
/** 1つの 場面の 長さの 上限 */
export const MAX_SOUND_SEC = 2.5;
/** 同時に 鳴るのは 2音まで */
export const MAX_VOICES = 2;
/** 高さの 範囲。主な 音は 200〜1,500Hz。太鼓だけ 低くてよいが、低すぎる 音は 使わない */
export const MIN_FREQ = 200;
export const MAX_FREQ = 1500;
export const MIN_TAIKO_FREQ = 90;
/** 太鼓は 鳴りはじめから この 割合まで 高さを 下げる */
export const TAIKO_DROP = 0.75;
/** 鈴の 2つめの 音は 少しだけ 高い（ゆらぎを 出す） */
export const SUZU_DETUNE = 1.006;
/** 音色ごとの 立ち上がり（秒）。急に 鳴らして おどろかせないよう、どれも 少し かける */
export const ATTACK_SEC: Record<Timbre, number> = { koto: 0.012, suzu: 0.015, taiko: 0.02, fue: 0.09 };
/** 立ち上がりの 最小（これより 短いと 「ぷつっ」と 鳴る） */
export const MIN_ATTACK_SEC = 0.01;

// ---------- 音階（ヨナ抜きの 長調） ----------

const C4 = 261.63;
const D4 = 293.66;
const E4 = 329.63;
const G4 = 392.0;
const A4 = 440.0;
const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.26;
const G5 = 783.99;
const A5 = 880.0;
const C6 = 1046.5;

/** ヨナ抜きの 長調で 使う 高さ（テストで 音階の 外の 音が ないことを 確かめる。太鼓は 音階に 入れない） */
export const SCALE: readonly number[] = [C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6];

const n = (at: number, freq: number, dur: number, timbre: Timbre, gain: number): Note => ({ at, freq, dur, timbre, gain });

/** 場面ごとの 音の 並び */
export const SOUNDS: Record<SoundName, readonly Note[]> = {
  // たおす：琴を 2音 上がる（ぽろ ろん）
  defeat: [n(0, G4, 0.35, 'koto', 0.14), n(0.13, C5, 0.6, 'koto', 0.14)],
  // レベルアップ：琴を 3音 上がり、さいごに 鈴
  levelUp: [
    n(0, C5, 0.3, 'koto', 0.13),
    n(0.16, E5, 0.3, 'koto', 0.13),
    n(0.32, G5, 0.34, 'koto', 0.13),
    n(0.5, A5, 0.8, 'suzu', 0.11),
  ],
  // ボスに会う：太鼓を どん・どん（低く やわらかく）、あとに 笛を 1音
  bossMeet: [n(0, 130, 0.4, 'taiko', 0.2), n(0.45, 130, 0.4, 'taiko', 0.18), n(0.95, A4, 0.9, 'fue', 0.1)],
  // ボスを たおす：太鼓 1回の あと、琴が 5音 上がって 鈴で おわる
  bossDefeat: [
    n(0, 130, 0.4, 'taiko', 0.18),
    n(0.45, C5, 0.28, 'koto', 0.12),
    n(0.6, D5, 0.28, 'koto', 0.12),
    n(0.75, E5, 0.28, 'koto', 0.12),
    n(0.9, G5, 0.28, 'koto', 0.12),
    n(1.05, A5, 0.28, 'koto', 0.12),
    n(1.36, C6, 0.8, 'suzu', 0.1),
  ],
  // エリアを こえる：笛の みじかい ふし（4音）
  areaClear: [n(0, E5, 0.36, 'fue', 0.11), n(0.3, G5, 0.36, 'fue', 0.11), n(0.6, A5, 0.36, 'fue', 0.11), n(0.9, G5, 0.7, 'fue', 0.11)],
  // レアに会う：鈴を 3回、少しずつ 高く
  rare: [n(0, E5, 0.4, 'suzu', 0.11), n(0.22, G5, 0.4, 'suzu', 0.11), n(0.44, A5, 0.6, 'suzu', 0.11)],
  // ボタン：ごく小さな 琴の 1音（手ごたえ）
  tap: [n(0, G4, 0.12, 'koto', 0.05)],
  // 歩いている 間：敵を たおした 時の 小さな 鈴 1回
  walkBell: [n(0, A5, 0.5, 'suzu', 0.09)],
  // ホームの 場面：風鈴などを さわった ときの 小さな 鈴（ちりん）
  chime: [n(0, G5, 0.45, 'suzu', 0.07), n(0.16, A5, 0.6, 'suzu', 0.06)],
};

/** その場面の 長さ（秒） */
export function soundLength(name: SoundName): number {
  return Math.max(0, ...SOUNDS[name].map((note) => note.at + note.dur));
}

/** 時刻 t に 鳴っている 音 */
export function notesAt(notes: readonly Note[], t: number): Note[] {
  return notes.filter((note) => note.at <= t && t < note.at + note.dur);
}

/** 成果の 画面で 鳴らす 音を 決める（2つまで。順に 鳴らす） */
export interface ResultSummary {
  /** たおした 敵の 数 */
  defeated: number;
  /** ボス（裏ボスも）を たおした */
  bossDefeated: boolean;
  /** エリアを こえた */
  areaCleared: boolean;
  /** レアに 会えた */
  rare: boolean;
  /** いま ボスと 戦っている 途中 */
  bossAhead: boolean;
}

export function resultSounds(r: ResultSummary): SoundName[] {
  const list: SoundName[] = [];
  if (r.bossDefeated) list.push('bossDefeat');
  else if (r.rare) list.push('rare');
  else if (r.defeated > 0) list.push('defeat');
  if (r.areaCleared) list.push('areaClear');
  else if (r.bossAhead) list.push('bossMeet');
  else if (r.rare && r.bossDefeated) list.push('rare');
  return list.slice(0, 2);
}

// ---------- 鳴らす（ブラウザの中だけ） ----------

type AudioCtor = new () => AudioContext;

let ctx: AudioContext | null = null;
/** ブラウザが 音を 出してよいか（画面を 一度 さわった あと） */
let touched = false;
let armed = false;
/** 同じ 音を すぐ つづけて 鳴らさない（画面の 作りなおしで 2回 呼ばれても 1回に する） */
const lastPlayed = new Map<SoundName, number>();
const REPEAT_GUARD_MS = 150;

function audioCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** 音を 出す 準備。画面を さわった あとでないと 作らない（iPhone・Chrome の 決まり） */
function context(): AudioContext | null {
  if (!touched) return null;
  if (!ctx) {
    const Ctor = audioCtor();
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') {
    try {
      void ctx.resume().catch(() => {});
    } catch {
      // 再開できない 環境でも 何もしない
    }
  }
  return ctx;
}

/** はじめて さわった ときに 音を 出す 準備を する（iPhone では さわった 処理の 中で 作る・再開する 必要が ある） */
function onTouch(): void {
  touched = true;
  if (getPreferences().sound) context();
}

/** 画面を さわったかを 見はじめる（1回だけ。アプリの はじめに 呼ぶ） */
export function armAudio(): void {
  if (armed || typeof document === 'undefined') return;
  armed = true;
  for (const type of ['pointerup', 'touchend', 'click', 'keydown']) {
    document.addEventListener(type, onTouch, { capture: true, passive: true });
  }
}

/** 鳴っている ボタンの 音（場面の 音が 鳴りはじめたら すぐ 消して、3音 以上 重ねない） */
let tapEnv: GainNode | null = null;

function playNote(ac: AudioContext, out: AudioNode, note: Note, start: number): GainNode {
  const attack = ATTACK_SEC[note.timbre];
  const end = start + note.dur;
  const env = ac.createGain();
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(note.gain, start + attack);
  if (note.timbre === 'fue') {
    // 笛：のばしてから やわらかく 消す
    env.gain.setValueAtTime(note.gain, Math.max(start + attack, end - 0.18));
    env.gain.linearRampToValueAtTime(0.0001, end);
  } else {
    env.gain.exponentialRampToValueAtTime(0.0001, end);
  }
  env.connect(out);

  const oscs: OscillatorNode[] = [];
  const osc = (type: OscillatorType, freq: number, level = 1) => {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (level === 1) o.connect(env);
    else {
      const g = ac.createGain();
      g.gain.value = level;
      o.connect(g);
      g.connect(env);
    }
    oscs.push(o);
    return o;
  };

  if (note.timbre === 'koto') osc('triangle', note.freq);
  if (note.timbre === 'suzu') {
    osc('sine', note.freq, 0.5);
    osc('sine', note.freq * SUZU_DETUNE, 0.5);
  }
  if (note.timbre === 'taiko') {
    const o = osc('sine', note.freq);
    o.frequency.exponentialRampToValueAtTime(note.freq * TAIKO_DROP, start + note.dur * 0.6);
  }
  if (note.timbre === 'fue') {
    const o = osc('sine', note.freq);
    // 少しだけ ゆらす（1秒に 5回、高さの 0.5%）
    const lfo = ac.createOscillator();
    const depth = ac.createGain();
    lfo.frequency.value = 5;
    depth.gain.value = note.freq * 0.005;
    lfo.connect(depth);
    depth.connect(o.frequency);
    oscs.push(lfo);
  }
  for (const o of oscs) {
    o.start(start);
    o.stop(end + 0.05);
  }
  return env;
}

/**
 * 場面の 音を 鳴らす。音が「切」・まだ 画面を さわっていない・音を 出せない 環境では 何もしない
 * （例外も 警告も 出さない）。歩いている 間の 鈴は「歩いている 間の 音」が 入の ときだけ。
 */
export function playSound(name: SoundName): void {
  try {
    const prefs = getPreferences();
    if (!prefs.sound) return;
    if (name === 'walkBell' && !prefs.walkSound) return;
    const nowMs = Date.now();
    const last = lastPlayed.get(name);
    if (last !== undefined && nowMs - last < REPEAT_GUARD_MS) return;
    const ac = context();
    if (!ac) return;
    lastPlayed.set(name, nowMs);
    const start = ac.currentTime + 0.02;
    if (name !== 'tap' && tapEnv) {
      // ボタンの 音は 0.01秒ほどで やわらかく 消す
      tapEnv.gain.cancelScheduledValues(ac.currentTime);
      tapEnv.gain.setTargetAtTime(0, ac.currentTime, 0.01);
      tapEnv = null;
    }
    for (const note of SOUNDS[name]) {
      const env = playNote(ac, ac.destination, note, start + note.at);
      if (name === 'tap') tapEnv = env;
    }
  } catch {
    // 音が 出なくても 画面の 文と 絵だけで すべて 分かるので、何もしない
  }
}

/** いくつかの 音を 順に 鳴らす（前の 音が おわってから 少し あけて 次）。もどり値を 呼ぶと 予約を やめる */
export function playSounds(names: readonly SoundName[]): () => void {
  const mine: ReturnType<typeof setTimeout>[] = [];
  let wait = 0;
  names.forEach((name, i) => {
    if (i === 0) playSound(name);
    else {
      mine.push(setTimeout(() => playSound(name), wait * 1000));
    }
    wait += soundLength(name) + 0.15;
  });
  return () => {
    for (const t of mine) clearTimeout(t);
  };
}

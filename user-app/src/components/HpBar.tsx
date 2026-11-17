import { hpColor } from '../lib/battle';
import { formatSteps } from '../lib/health';
import s from './HpBar.module.css';

interface HpBarProps {
  /** のこりの歩数 */
  left: number;
  /** いっぱいの歩数（ふつうの敵は 750、ボスは ボスの歩数） */
  total: number;
  /** normal：緑→金／rare：金（レア）／boss：太くて 長い */
  tone?: 'normal' | 'rare' | 'boss';
  /** 読み上げる ことば（無いときは かざりとして 読み上げない） */
  label?: string;
  /** せまい 所では バーを ちぢめて 入れる（数の 文字は ちぢめない） */
  shrink?: boolean;
  className?: string;
}

/**
 * 敵の HPバー。バーの 横に かならず「あと ○歩」を 出す（色だけで 伝えない）。
 * 色は いっぱいの 緑から 0 に 近づくと 金（赤い「危険」の 色は 使わない）。文字の大きさで バーも 太くなる
 */
export function HpBar({ left, total, tone = 'normal', label, shrink = false, className }: HpBarProps) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, left / total)) : 0;
  return (
    <div
      className={[s.hp, s[tone], shrink && s.shrink, className].filter(Boolean).join(' ')}
      data-hp-left={left}
      data-hp-total={total}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* バーは 見た目だけ（数は 横の 文字と 読み上げで 伝える） */}
      <span className={s.track} aria-hidden="true">
        <span className={s.fill} style={{ width: `${(ratio * 100).toFixed(2)}%`, background: hpColor(ratio, tone === 'rare') }} />
      </span>
      <span className={s.num}>あと {formatSteps(left)}歩</span>
    </div>
  );
}

import hero from '../assets/sprite/hero.svg';
import { HERO_ATTACK, HERO_CHEER } from '../data/heroSprites';
import type { HeroPose } from '../lib/battle';
import s from './Hero.module.css';

/**
 * 主人公（85×110）。立つ・てまりを ぽんと出す・両手を上げる（勝ちのポーズ）の 3つの 絵を 重ねて置き、
 * いまの ポーズの 絵だけを 見せる（切りかえの たびに 絵を 読みなおさない）。
 * てまり・勝ちの コマが まだ無いときは 立った 絵（hero.svg）を使い、勝ちのときは 1回だけ 小さく はねる
 */
export function Hero({ pose, forward = false }: { pose: HeroPose; forward?: boolean }) {
  return (
    <span className={s.hero} data-pose={pose} data-forward={forward || undefined} data-cheer-art={HERO_CHEER ? 'true' : 'false'}>
      <img className={s.stand} src={hero} alt="" />
      <img className={s.attack} src={HERO_ATTACK ?? hero} alt="" />
      <img className={s.cheer} src={HERO_CHEER ?? hero} alt="" />
    </span>
  );
}

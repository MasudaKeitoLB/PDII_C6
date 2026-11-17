import type { ReactNode } from 'react';
import { enemyMotion } from '../data/enemyMotions';
import type { EnemyId } from '../lib/types';
import m from './motion.module.css';

/**
 * 敵を その敵の 動きの型（ふわふわ・ぴょん・ゆらゆら・くるり・ほのか・ぽたぽた）で 動かす 入れもの。
 * active が false の あいだは 止めておく（戦闘で 出てくる 前など）。動きを へらす ときは global.css で 止まる
 */
export function EnemyMotion({ id, active = true, children }: { id: EnemyId; active?: boolean; children: ReactNode }) {
  const motion = enemyMotion(id);
  return (
    <span className={[m.motion, active && m[motion]].filter(Boolean).join(' ')} data-enemy-motion={motion}>
      {/* ほのかに光る 型は、体の うしろに 光の 層を 置いて その opacity だけを 動かす */}
      {motion === 'glow' && <span className={m.glowLight} />}
      {children}
    </span>
  );
}

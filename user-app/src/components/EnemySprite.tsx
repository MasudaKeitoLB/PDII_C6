import { enemySprite, enemySpriteSmall } from '../data/enemySprites';
import type { EnemyId } from '../lib/types';

interface EnemySpriteProps {
  id: EnemyId;
  /** 成果の画面に ならべる 小さい絵 */
  small?: boolean;
  /** 大きさの倍率（ホームのボスを 小さく出すときなど） */
  scale?: number;
}

/**
 * 敵の絵。かざりなので 読み上げない（名前は まわりの文で伝える）。
 * 絵が まだ無い敵は、ファイルを 読みに行かず、エリアの色の 丸い体に 目を2つ描いて出す（404 を出さない）。
 */
export function EnemySprite({ id, small = false, scale = 1 }: EnemySpriteProps) {
  const sprite = small ? enemySpriteSmall(id) : enemySprite(id);
  const width = sprite.width * scale;
  const height = sprite.height * scale;
  if (sprite.src) return <img src={sprite.src} alt="" style={{ width, height }} data-enemy={id} />;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ display: 'block' }}
      data-enemy={id}
      data-placeholder="true"
    >
      {/* 外の ふち（こい背景でも 見えるように 明るく）→ りんかく（墨）→ 体（エリアの色）→ 目（白目と 黒目） */}
      <circle cx="8" cy="8" r="8" fill="#FBF6EA" />
      <circle cx="8" cy="8" r="7.4" fill="#1E1B18" />
      <circle cx="8" cy="8" r="6.4" fill={sprite.color} />
      <rect x="4" y="6" width="3" height="4" fill="#FFFFFF" />
      <rect x="9" y="6" width="3" height="4" fill="#FFFFFF" />
      <rect x="5" y="7" width="2" height="3" fill="#1E1B18" />
      <rect x="10" y="7" width="2" height="3" fill="#1E1B18" />
    </svg>
  );
}

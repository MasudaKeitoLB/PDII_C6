import stepsIcon from '../../assets/icon/steps-small.svg';
import { useAppState } from '../../flow/AppState';
import { WalkScene } from './WalkScene';
import s from './walking.module.css';

/**
 * H-02 歩きスマホ防止（M-11・N-10）
 * 歩いている間は 画面を操作できない。押せるものは置かない。止まると 自動で使えるようになる。
 * 絵の 場所には 昼の道の 場面（WalkScene）を置き、歩いている間だけ 道が 流れて 主人公が 歩く。
 */
export function WalkingLock() {
  const { walk } = useAppState();
  const stopping = walk === 'stopping';
  return (
    <div className={s.lock} role="dialog" aria-modal="true" aria-label="歩きスマホ防止">
      <p className={s.pill}>
        <img src={stepsIcon} alt="" />
        {/* 歩いている ↔ 止まった の 切りかえは 文字を やわらかく 入れかえる（key で 出なおす） */}
        <span key={walk} className={s.swap}>
          {stopping ? '止まりました' : '歩いています'}
        </span>
      </p>
      <WalkScene />
      <p className={s.headline} aria-live="assertive">
        立ち止まってから
        <br />
        操作してください
      </p>
      <p className={s.sub}>
        歩いている間も、歩数は
        <br />
        ちゃんと記録されています
      </p>
      <p className={s.info} aria-live="polite">
        <span key={walk} className={s.swap}>
          {stopping ? 'もうすぐ 使えるようになります' : '止まると、自動で使えるようになります'}
        </span>
      </p>
    </div>
  );
}

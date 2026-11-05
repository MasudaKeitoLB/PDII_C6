import stepsIcon from '../../assets/icon/steps-small.svg';
import walkingPicture from '../../assets/scene/walking.svg';
import { useAppState } from '../../flow/AppState';
import s from './walking.module.css';

/**
 * H-02 歩きスマホ防止（M-11・N-10）
 * 歩いている間は 画面を操作できない。押せるものは置かない。止まると 自動で使えるようになる。
 */
export function WalkingLock() {
  const { walk } = useAppState();
  const stopping = walk === 'stopping';
  return (
    <div className={s.lock} role="dialog" aria-modal="true" aria-label="歩きスマホ防止">
      <p className={s.pill}>
        <img src={stepsIcon} alt="" />
        <span>{stopping ? '止まりました' : '歩いています'}</span>
      </p>
      <img className={s.picture} src={walkingPicture} alt="" />
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
        {stopping ? 'もうすぐ 使えるようになります' : '止まると、自動で使えるようになります'}
      </p>
    </div>
  );
}

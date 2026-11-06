import { useEffect, useState } from 'react';

/** パソコンで開いたとき（確認用のパネルと スマホの枠を ならべる広さ）か */
export function useWideLayout() {
  const query = '(min-width: 720px) and (min-height: 560px)';
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setWide(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return wide;
}

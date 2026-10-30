import { FieldMessage } from '../../components/FieldMessage';

/** どれが合わなかったかは 言わない（なりすまし対策 N-13）。困ったときの相手を書く */
export function LoginFailedMessage({ withLetter }: { withLetter: boolean }) {
  return (
    <FieldMessage>
      {withLetter ? 'お名前・誕生日・文字' : 'お名前・誕生日'}の どれかが 登録とちがうようです。
      <br />
      わからないときは 施設のスタッフに 声をかけてください
    </FieldMessage>
  );
}

import { Button } from '../components/Button';
import { Heading, Lead, Screen } from '../components/Screen';
import { useAppState } from '../flow/AppState';

export function StaffHomePlaceholder() {
  const { navigate, resetLogin, setStaffAuthenticated } = useAppState();
  return (
    <Screen title="管理者画面（仮）" background="kinari" footer={<Button variant="secondary" onClick={() => { setStaffAuthenticated(false); resetLogin(); navigate('start'); }}>ログアウト</Button>}>
      <Heading>スタッフ用の<br />画面です</Heading>
      <Lead>利用者の一覧と測定結果は、次の段階で追加します。</Lead>
    </Screen>
  );
}

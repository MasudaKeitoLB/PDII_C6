import { useEffect, useRef, useState, type FormEvent } from 'react';
import { FieldMessage } from '../../components/FieldMessage';
import pressable from '../../components/pressable.module.css';
import { authenticateStaff } from '../../lib/staffAuth';
import { useAppState } from '../../flow/AppState';
import { setAdminSession } from '../../lib/store';
import type { AdminAccount } from '../../lib/types';
import s from './adminLogin.module.css';

interface AdminLoginFormProps {
  variant: 'phone' | 'pc';
  onSuccess: (account: AdminAccount) => void;
}

/**
 * 管理者ログイン（AM-01・AP-01）：運営者が発行した アカウントIDとパスワードで入る（M-15・N-13）。
 * どちらが合わなかったかは 出さない。パスワードは「表示」で 見て確かめられる。
 */
export function AdminLoginForm({ variant, onSuccess }: AdminLoginFormProps) {
  const { loginDraft, resetLogin, navigate } = useAppState();
  const [accountId, setAccountId] = useState(loginDraft.name);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const prefix = `admin-${variant}`;

  useEffect(() => {
    (loginDraft.name ? passwordRef : idRef).current?.focus({ preventScroll: true });
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending.current) return;
    if (accountId.trim() === '' || password === '') {
      setError('アカウントIDと パスワードを 入れてください');
      (accountId.trim() === '' ? idRef : passwordRef).current?.focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    setError(null);
    setAdminSession(null);
    try {
    const account = await authenticateStaff(accountId, password);
    if (!account) {
      setError('アカウントIDか パスワードが ちがいます');
      passwordRef.current?.select();
      return;
    }
    setAdminSession(account.id);
    resetLogin();
    setPassword('');
    onSuccess(account);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ログインできませんでした');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const onEdit = () => {
    if (error) setError(null);
  };

  return (
    <form className={`${s.form} ${s[variant]}`} onSubmit={submit} noValidate>
      <h1 className={s.title}>{variant === 'pc' ? '管理者ログイン' : 'ログイン'}</h1>
      <p className={s.lead}>施設のスタッフ・ケアマネージャーの方の画面です</p>

      <label className={s.label} htmlFor={`${prefix}-id`}>
        アカウントID
      </label>
      <input
        ref={idRef}
        id={`${prefix}-id`}
        className={s.input}
        type="text"
        value={accountId}
        disabled={busy}
        readOnly={Boolean(loginDraft.name)}
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${prefix}-error` : undefined}
        onChange={(e) => {
          setAccountId(e.target.value);
          onEdit();
        }}
        onKeyDown={(e) => {
          // 改行で 次のパスワードへ（まだ送らない）
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && password === '') {
            e.preventDefault();
            passwordRef.current?.focus();
          }
        }}
      />

      <label className={`${s.label} ${s.labelPassword}`} htmlFor={`${prefix}-password`}>
        パスワード
      </label>
      <div className={s.passwordBox}>
        <input
          ref={passwordRef}
          id={`${prefix}-password`}
          className={`${s.input} ${s.passwordInput}`}
          type={showPassword ? 'text' : 'password'}
          value={password}
          disabled={busy}
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${prefix}-error` : undefined}
          onChange={(e) => {
            setPassword(e.target.value);
            onEdit();
          }}
        />
        <button
          type="button"
          className={s.show}
          aria-pressed={showPassword}
          aria-controls={`${prefix}-password`}
          aria-label={showPassword ? 'パスワードを かくす' : 'パスワードを 表示する'}
          onClick={() => setShowPassword((v) => !v)}
        >
          {showPassword ? 'かくす' : '表示'}
        </button>
      </div>

      {error && (
        <div className={s.error}>
          <FieldMessage id={`${prefix}-error`}>{error}</FieldMessage>
        </div>
      )}

      <button disabled={busy} type="submit" className={`${pressable.pressable} ${pressable.green} ${s.submit}`}>
        {busy ? '確認中…' : 'ログイン'}
      </button>
      <button type="button" disabled={busy} onClick={() => { setAdminSession(null); navigate('login-name'); }}>
        お名前・管理者IDの入力に戻る
      </button>

      <p className={s.note}>
        アカウントは 運営者が発行します。
        <br />
        {variant === 'pc' ? (
          'パスワードを忘れたときは、運営者に連絡してください。'
        ) : (
          <>
            パスワードを忘れたときは、
            <br />
            運営者に連絡してください。
          </>
        )}
      </p>
    </form>
  );
}

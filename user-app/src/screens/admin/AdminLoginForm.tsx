import { useEffect, useRef, useState, type FormEvent } from 'react';
import { FieldMessage } from '../../components/FieldMessage';
import pressable from '../../components/pressable.module.css';
import { checkAdminLogin } from '../../lib/admin';
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
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const prefix = `admin-${variant}`;

  useEffect(() => {
    idRef.current?.focus({ preventScroll: true });
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (accountId.trim() === '' || password === '') {
      setError('アカウントIDと パスワードを 入れてください');
      (accountId.trim() === '' ? idRef : passwordRef).current?.focus();
      return;
    }
    const account = checkAdminLogin(accountId, password);
    if (!account) {
      setError('アカウントIDか パスワードが ちがいます');
      passwordRef.current?.select();
      return;
    }
    setAdminSession(account.id);
    onSuccess(account);
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

      <button type="submit" className={`${pressable.pressable} ${pressable.green} ${s.submit}`}>
        ログイン
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

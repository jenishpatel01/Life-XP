import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '@/lib/store.ts';
import { api, ApiError } from '@/lib/api.ts';
import { sfx } from '@/audio/engine.ts';
import AnimatedBackground from '@/fx/AnimatedBackground.tsx';
import { Button, Field, Logo } from '@/components/ui.tsx';
import { HeroSprite } from '@/components/Sprite.tsx';
import { DEFAULT_APPEARANCE } from '@shared/content.ts';

type Mode = 'register' | 'login' | 'forgot' | 'reset';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}
const STRENGTH = ['TOO WEAK', 'WEAK', 'OKAY', 'GOOD', 'STRONG'];

export default function Auth() {
  const [params, setParams] = useSearchParams();
  const m = params.get('mode');
  const token = params.get('token') ?? '';
  const mode: Mode = m === 'login' ? 'login' : m === 'forgot' ? 'forgot' : m === 'reset' && token ? 'reset' : 'register';
  const isNewPw = mode === 'register' || mode === 'reset';
  const user = useGame((s) => s.user);
  const register = useGame((s) => s.register);
  const login = useGame((s) => s.login);
  const nav = useNavigate();

  const [v, setV] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');
  const [shake, setShake] = useState(0);
  const str = useMemo(() => strength(v.password), [v.password]);

  if (user) return <Navigate to="/app" replace />;

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => { setV((p) => ({ ...p, [k]: e.target.value })); if (errs[k]) setErrs((p) => ({ ...p, [k]: '' })); };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (mode === 'register') {
      if (v.username.trim().length < 3) e.username = 'Username must be at least 3 characters.';
      else if (!/^[A-Za-z0-9_]+$/.test(v.username.trim())) e.username = 'Use letters, numbers and underscores only.';
      else if (v.username.trim().length > 20) e.username = 'Username can be at most 20 characters.';
    }
    if (mode === 'register' && !EMAIL.test(v.email.trim())) e.email = 'Enter a valid email address.';
    if ((mode === 'login' || mode === 'forgot') && !v.email.trim()) e.email = 'Enter your email or username.';
    if (isNewPw) {
      if (v.password.length < 8) e.password = 'Password must be at least 8 characters.';
      if (v.confirmPassword !== v.password) e.confirmPassword = 'Passwords do not match.';
    } else if (mode === 'login' && !v.password) e.password = 'Enter your password.';
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (loading) return;
    setFormErr('');
    const e = validate();
    setErrs(e);
    if (Object.keys(e).length) { setShake((n) => n + 1); sfx.play('error'); return; }
    setLoading(true);
    try {
      if (mode === 'forgot') {
        await api('/auth/forgot', { method: 'POST', body: { identifier: v.email.trim() } });
        setInfo('If that account exists, we sent a reset link to its email. Check your inbox (and spam).');
        return;
      }
      if (mode === 'reset') {
        await api('/auth/reset', { method: 'POST', body: { token, password: v.password, confirmPassword: v.confirmPassword } });
        setV((p) => ({ ...p, password: '', confirmPassword: '' }));
        setParams({ mode: 'login' }, { replace: true });
        setInfo('Password updated. Log in with your email or username and the new password.');
        return;
      }
      if (mode === 'register') await register({ username: v.username.trim(), email: v.email.trim(), password: v.password, confirmPassword: v.confirmPassword });
      else await login({ identifier: v.email.trim(), password: v.password });
      sfx.play('login');
      nav(mode === 'register' ? '/create' : '/app', { replace: true });
    } catch (err) {
      const a = err instanceof ApiError ? err : null;
      if (a?.fields) setErrs(a.fields);
      setFormErr(a ? (a.fields ? 'Please fix the highlighted fields.' : a.message) : 'Something went wrong. Please try again.');
      setShake((n) => n + 1);
      sfx.play('error');
    } finally {
      setLoading(false);
    }
  };

  const switchTo = (m: Mode) => { setErrs({}); setFormErr(''); setInfo(''); setParams({ mode: m }, { replace: true }); };
  const eid = (k: string) => (errs[k] ? { 'aria-invalid': true, 'aria-describedby': `${k}-err` } : {});

  return (
    <div className="auth" data-testid="auth">
      <AnimatedBackground variant="hero" className="auth-bg" />
      <div className="hero-shade" aria-hidden />
      <div className="auth-wrap">
        <div className="auth-side">
          <Logo size="lg" to="/" />
          <HeroSprite appearance={DEFAULT_APPEARANCE} cls="FOCUS" scale={9} className="bob-steps" />
          <p className="pixel auth-quote">“Every hero starts at level 1.”</p>
        </div>
        <form key={shake} className={`auth-card panel ${shake ? 'shake-x' : ''}`} onSubmit={submit} noValidate aria-labelledby="auth-h">
          <div className="auth-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'is-on' : ''} onClick={() => switchTo('register')} data-testid="tab-register">SIGN UP</button>
            <button type="button" role="tab" aria-selected={mode !== 'register'} className={mode !== 'register' ? 'is-on' : ''} onClick={() => switchTo('login')} data-testid="tab-login">LOG IN</button>
          </div>
          <h1 id="auth-h" className="pixel auth-title">
            {mode === 'register' ? 'CREATE YOUR ACCOUNT' : mode === 'forgot' ? 'FORGOT PASSWORD' : mode === 'reset' ? 'CHOOSE A NEW PASSWORD' : 'WELCOME BACK, HERO'}
          </h1>
          {formErr && <div className="form-error" role="alert" data-testid="form-error">{formErr}</div>}
          {info && <div className="form-error" role="status" data-testid="form-info" style={{ borderColor: 'var(--cyan, #19d3ff)', color: 'inherit' }}>{info}</div>}

          {mode === 'register' && (
            <Field label="Username" htmlFor="username" error={errs.username}>
              <input id="username" className={`input ${errs.username ? 'is-error' : ''}`} value={v.username} onChange={set('username')} autoComplete="username" maxLength={20} placeholder="HeroName" {...eid('username')} />
            </Field>
          )}
          {mode !== 'reset' && (
            <Field label={mode === 'register' ? 'Email' : 'Email or username'} htmlFor="email" error={errs.email}>
              <input id="email" type={mode === 'register' ? 'email' : 'text'} className={`input ${errs.email ? 'is-error' : ''}`} value={v.email} onChange={set('email')} autoComplete={mode === 'register' ? 'email' : 'username'} placeholder={mode === 'register' ? 'you@example.com' : 'you@example.com or HeroName'} {...eid('email')} />
            </Field>
          )}
          {mode !== 'forgot' && (
            <Field label={mode === 'reset' ? 'New password' : 'Password'} htmlFor="password" error={errs.password}>
              <div className="input-wrap">
                <input id="password" type={show ? 'text' : 'password'} className={`input ${errs.password ? 'is-error' : ''}`} value={v.password} onChange={set('password')} autoComplete={isNewPw ? 'new-password' : 'current-password'} maxLength={128} {...eid('password')} />
                <button type="button" className="toggle-vis icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} data-silent>{show ? '◉' : '◎'}</button>
              </div>
            </Field>
          )}
          {mode === 'login' && (
            <p className="auth-alt muted small" style={{ textAlign: 'right' }}>
              <button type="button" className="link-more" onClick={() => switchTo('forgot')} data-testid="forgot-link">FORGOT PASSWORD?</button>
            </p>
          )}
          {isNewPw && (
            <>
              <div className="pw-meter" aria-live="polite" data-testid="pw-meter">
                <div className="pw-bars">{[0, 1, 2, 3].map((i) => <i key={i} className={i < str ? `on s${str}` : ''} />)}</div>
                <span className="label">{v.password ? STRENGTH[str] : 'MIN. 8 CHARACTERS'}</span>
              </div>
              <Field label="Confirm password" htmlFor="confirmPassword" error={errs.confirmPassword}>
                <input id="confirmPassword" type={show ? 'text' : 'password'} className={`input ${errs.confirmPassword ? 'is-error' : ''}`} value={v.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" maxLength={128} {...eid('confirmPassword')} />
              </Field>
            </>
          )}
          <Button type="submit" variant={mode === 'register' ? 'gold' : 'primary'} size="lg" block loading={loading} data-testid="auth-submit">
            {mode === 'register' ? 'Create your character' : mode === 'forgot' ? 'Send reset link' : mode === 'reset' ? 'Save new password' : 'Enter the game'}
          </Button>
          <p className="auth-alt muted small">
            {mode === 'register' ? 'Already a hero?' : mode === 'login' ? 'New here?' : 'Remembered it?'}{' '}
            <button type="button" className="link-more" onClick={() => switchTo(mode === 'login' ? 'register' : mode === 'register' ? 'login' : 'login')}>{mode === 'login' ? 'SIGN UP' : 'LOG IN'}</button>
          </p>
        </form>
      </div>
    </div>
  );
}

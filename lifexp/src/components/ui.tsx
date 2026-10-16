import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { useCountUp } from '@/hooks/useGame.ts';

// ───────── Logo ─────────
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 16 16" width={size * 0.56} height={size * 0.56} shapeRendering="crispEdges">
        <path d="M3 1h3v10h8v3H3z" fill="#18d9ff" />
        <path d="M10 2h3v3h-3z" fill="#ffb32e" />
      </svg>
    </span>
  );
}

export function Logo({ size = 'md', to = '/' }: { size?: 'sm' | 'md' | 'lg'; to?: string | null }) {
  const inner = (
    <span className={`logo logo--${size}`}>
      <LogoMark size={size === 'lg' ? 52 : size === 'sm' ? 30 : 40} />
      <span className="logo-word pixel">
        LIFE<span className="logo-slash">//</span><span className="logo-xp">XP</span>
      </span>
    </span>
  );
  return to ? (
    <Link to={to} aria-label="LIFE//XP home" data-silent>
      {inner}
    </Link>
  ) : (
    inner
  );
}

// ───────── Buttons ─────────
type Variant = 'primary' | 'purple' | 'gold' | 'danger' | 'ghost' | 'dark';

interface BtnProps {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  loading?: boolean;
  magnetic?: boolean;
  children: ReactNode;
}

const cls = (v: Variant, s: string, block?: boolean, mag = true, extra = '') =>
  `btn btn--${v} ${s === 'md' ? '' : `btn--${s}`} ${block ? 'btn--block' : ''} ${mag ? 'magnetic' : ''} ${extra}`.replace(/\s+/g, ' ').trim();

export function Button({ variant = 'primary', size = 'md', block, loading, magnetic = true, children, className = '', disabled, ...rest }: BtnProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} disabled={disabled || loading} className={cls(variant, size, block, magnetic, className)} data-fx={variant === 'purple' ? '#bd4eff' : variant === 'gold' ? '#ffb32e' : variant === 'danger' ? '#ff445f' : '#18d9ff'}>
      <span className="btn-face">
        {loading && <span className="spin" aria-hidden />}
        {children}
      </span>
    </button>
  );
}

export function LinkButton({ variant = 'primary', size = 'md', block, magnetic = true, children, className = '', ...rest }: BtnProps & LinkProps) {
  return (
    <Link {...rest} className={cls(variant, size, block, magnetic, className)}>
      <span className="btn-face">{children}</span>
    </Link>
  );
}

// ───────── Difficulty stars ─────────
export function Stars({ n, max = 5 }: { n: number; max?: number }) {
  return (
    <span className="stars" aria-label={`Difficulty ${n} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? 'on' : 'off'} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}

// ───────── XP bar ─────────
export function XPBar({ xpInto, xpNeeded, size = 'md', variant, showText = true, maxed }: { xpInto: number; xpNeeded: number; size?: 'sm' | 'md' | 'lg'; variant?: 'green' | 'rainbow'; showText?: boolean; maxed?: boolean }) {
  const into = useCountUp(xpInto);
  const pct = maxed ? 100 : Math.min(100, (xpInto / Math.max(1, xpNeeded)) * 100);
  return (
    <div>
      <div className={`xpbar ${size !== 'md' ? `xpbar--${size}` : ''} ${variant ? `xpbar--${variant}` : ''}`} role="progressbar" aria-valuemin={0} aria-valuemax={xpNeeded} aria-valuenow={xpInto} aria-label="Experience">
        <div className="xpbar-fill" style={{ width: `${pct}%` }} />
      </div>
      {showText && (
        <div className="xpbar-text">
          <span>
            <span className="cyan">{into.toLocaleString()}</span> / {xpNeeded.toLocaleString()} XP
          </span>
          <span>{maxed ? 'MAX' : `${Math.round(pct)}%`}</span>
        </div>
      )}
    </div>
  );
}

// ───────── Boss HP bar (with trailing "ghost" damage) ─────────
export function BossHealthBar({ hp, maxHp, name, size = 'md', showNumbers = true }: { hp: number; maxHp: number; name?: string; size?: 'sm' | 'md' | 'lg'; showNumbers?: boolean }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  return (
    <div>
      {(name || showNumbers) && (
        <div className="hpbar-row">
          <span className="red">{name ?? 'HP'}</span>
          {showNumbers && (
            <span>
              {hp.toLocaleString()} / {maxHp.toLocaleString()}
            </span>
          )}
        </div>
      )}
      <div className={`hpbar ${size !== 'md' ? `hpbar--${size}` : ''}`} role="progressbar" aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={hp} aria-label="Boss health">
        <div className="hpbar-ghost" style={{ width: `${pct}%` }} />
        <div className="hpbar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ───────── States ─────────
export function Skeleton({ h = 16, w = '100%', className = '' }: { h?: number | string; w?: number | string; className?: string }) {
  return <div className={`skeleton ${className}`} style={{ height: h, width: w }} aria-hidden />;
}

export function EmptyState({ title, body, art, action }: { title: string; body?: string; art?: ReactNode; action?: ReactNode }) {
  return (
    <div className="state-box" role="status">
      {art}
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="state-box" role="alert">
      <h3 className="red">SIGNAL LOST</h3>
      <p>{message ?? 'We could not load this. Check your connection and try again.'}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

// ───────── Modal ─────────
export function Modal({ open, onClose, children, label, wide }: { open: boolean; onClose: () => void; children: ReactNode; label: string; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className={`modal panel ${wide ? 'modal--wide' : ''}`}>
        <button className="modal-x icon-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// ───────── Field ─────────
export function Field({ label, error, children, htmlFor }: { label: string; error?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      <div className="field-error" role={error ? 'alert' : undefined} id={`${htmlFor}-err`}>
        {error}
      </div>
    </div>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGame } from '@/lib/store.ts';
import { usePrefs } from '@/lib/prefs.ts';
import { Icon } from './Sprite.tsx';
import { Logo, XPBar } from './ui.tsx';
import { Modal } from './ui.tsx';

export const NAV = [
  { to: '/app', label: 'HOME', icon: 'home', end: true },
  { to: '/app/quests', label: 'QUESTS', icon: 'scroll' },
  { to: '/app/world', label: 'WORLD', icon: 'map' },
  { to: '/app/bosses', label: 'BOSSES', icon: 'skull' },
  { to: '/app/cards', label: 'CARDS', icon: 'card' },
  { to: '/app/character', label: 'CHARACTER', icon: 'hero' },
  { to: '/app/achievements', label: 'ACHIEVEMENTS', icon: 'trophy' },
  { to: '/app/profile', label: 'PROFILE', icon: 'user' },
  { to: '/app/settings', label: 'SETTINGS', icon: 'gear' },
] as const;

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-logo"><Logo size="sm" to="/app" /></div>
      <nav className="sidebar-nav">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={'end' in n ? n.end : false} className="nav-link" data-testid={`nav-${n.label.toLowerCase()}`} title={n.label}>
            <span className="nav-ico"><Icon id={n.icon} scale={2} /></span>
            <span className="nav-label">{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <SidebarFoot />
    </aside>
  );
}

function SidebarFoot() {
  const logout = useGame((s) => s.logout);
  const nav = useNavigate();
  return (
    <div className="sidebar-foot">
      <button className="nav-link nav-link--logout" onClick={async () => { await logout(); nav('/'); }} data-testid="logout">
        <span className="nav-ico">⏻</span>
        <span className="nav-label">LOG OUT</span>
      </button>
    </div>
  );
}

export function TopHUD() {
  const game = useGame((s) => s.game)!;
  const ch = game.character!;
  const sound = usePrefs((s) => s.sound);
  const music = usePrefs((s) => s.music);
  const save = useGame((s) => s.saveSettings);
  return (
    <header className="hud-top" data-testid="hud">
      <div className="hud-lv" aria-label={`Level ${ch.level}`}>
        <span className="hud-lv-tag">LV</span>
        <span className="hud-lv-num num" data-testid="hud-level">{ch.level}</span>
      </div>
      <div className="hud-xp">
        <div className="hud-name"><span className="pixel">{ch.name}</span><span className="hud-class">{ch.class}</span></div>
        <XPBar xpInto={ch.progress.xpInto} xpNeeded={ch.progress.xpNeeded} size="sm" showText={false} maxed={ch.progress.maxed} />
        <div className="hud-xp-text num" data-testid="hud-xp">{ch.progress.xpInto.toLocaleString()} / {ch.progress.xpNeeded.toLocaleString()} XP</div>
      </div>
      <div className="hud-stats">
        <div className="hud-stat" title="Current streak" data-testid="hud-streak">
          <Icon id="flame" scale={2} /><b className="num">{game.streak.current}</b>
        </div>
        <div className="hud-stat hud-stat--xp" title="XP earned today">
          <Icon id="star" scale={2} /><b className="num">+{game.today.xp}</b>
        </div>
      </div>
      <div className="hud-tools">
        <button className={`icon-btn ${sound ? '' : 'is-off'}`} onClick={() => void save({ sound: !sound })} aria-pressed={sound} aria-label={sound ? 'Mute sound effects' : 'Turn on sound effects'} title="Sound effects" data-testid="toggle-sound">
          {sound ? '♪' : '✕'}
        </button>
        <button className={`icon-btn hud-music ${music ? '' : 'is-off'}`} onClick={() => void save({ music: !music })} aria-pressed={music} aria-label={music ? 'Turn music off' : 'Turn music on'} title="Music" data-testid="toggle-music">
          ♫
        </button>
      </div>
    </header>
  );
}

const MOBILE_PRIMARY = ['/app', '/app/quests', '/app/world', '/app/bosses'];

export function BottomNav() {
  const [more, setMore] = useState(false);
  const nav = useNavigate();
  const primary = NAV.filter((n) => MOBILE_PRIMARY.includes(n.to));
  const rest = NAV.filter((n) => !MOBILE_PRIMARY.includes(n.to));
  const logout = useGame((s) => s.logout);
  return (
    <>
      <nav className="bottom-nav" aria-label="Main navigation">
        {primary.map((n) => (
          <NavLink key={n.to} to={n.to} end={'end' in n ? n.end : false} className="bn-link" data-testid={`bn-${n.label.toLowerCase()}`}>
            <Icon id={n.icon} scale={2} />
            <span>{n.label}</span>
          </NavLink>
        ))}
        <button className="bn-link" onClick={() => setMore(true)} data-testid="bn-more" aria-haspopup="dialog">
          <Icon id="gear" scale={2} />
          <span>MORE</span>
        </button>
      </nav>
      <Modal open={more} onClose={() => setMore(false)} label="More">
        <div className="label" style={{ marginBottom: 14 }}>MENU</div>
        <div className="more-grid">
          {rest.map((n) => (
            <NavLink key={n.to} to={n.to} className="more-item" onClick={() => setMore(false)} data-testid={`more-${n.label.toLowerCase()}`}>
              <Icon id={n.icon} scale={3} />
              <span>{n.label}</span>
            </NavLink>
          ))}
          <button className="more-item" onClick={async () => { setMore(false); await logout(); nav('/'); }} data-testid="more-logout">
            <span className="more-power">⏻</span>
            <span>LOG OUT</span>
          </button>
        </div>
      </Modal>
    </>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@/hooks/useGame.ts';
import { sfx } from '@/audio/engine.ts';

type FsEl = HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> };
type FsVid = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

/**
 * WATCH TRAILER: lazy-loaded poster + silent looping preview. A click/tap starts the full trailer
 * with sound (user gesture). Custom controls: play/pause, mute, fullscreen. Pauses when scrolled
 * away or when the tab is hidden. Mobile gets the 480p file and the small poster.
 */
export default function TrailerSection() {
  const mobile = useMediaQuery('(max-width: 720px)');
  const box = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLVideoElement>(null);
  const main = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'poster' | 'playing'>('poster');
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState(false);
  const [fs, setFs] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el || !('IntersectionObserver' in window)) return setVisible(true);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // pause everything that is off-screen or in a hidden tab
  useEffect(() => {
    const apply = () => {
      const hidden = document.hidden || !visible;
      const p = preview.current;
      if (p) { if (hidden || mode === 'playing') p.pause(); else void p.play().catch(() => undefined); }
      const m = main.current;
      if (m && hidden && !m.paused) m.pause();
    };
    apply();
    document.addEventListener('visibilitychange', apply);
    return () => document.removeEventListener('visibilitychange', apply);
  }, [visible, mode]);

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const play = useCallback(() => {
    sfx.play('click');
    setErr(false);
    setMode('playing');
    requestAnimationFrame(() => {
      const m = main.current;
      if (!m) return;
      m.muted = false;
      setMuted(false);
      void m.play().then(() => setPaused(false)).catch(() => {
        // autoplay-with-sound refused: fall back to muted playback the user can unmute
        m.muted = true;
        setMuted(true);
        void m.play().then(() => setPaused(false)).catch(() => setErr(true));
      });
    });
  }, []);

  const toggle = () => {
    const m = main.current;
    if (!m) return;
    if (m.paused) void m.play(); else m.pause();
  };
  const fullscreen = () => {
    const c = box.current as FsEl | null; const v = main.current as FsVid | null;
    if (document.fullscreenElement) return void document.exitFullscreen();
    if (c?.requestFullscreen) void c.requestFullscreen().catch(() => v?.webkitEnterFullscreen?.());
    else if (c?.webkitRequestFullscreen) void c.webkitRequestFullscreen();
    else v?.webkitEnterFullscreen?.(); // iOS Safari only fullscreens the <video>
  };
  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const m = main.current;
    if (m && m.duration) m.currentTime = (Number(e.target.value) / 1000) * m.duration;
  };
  const poster = mobile ? '/media/poster-sm.jpg' : '/media/poster.jpg';

  return (
    <section id="trailer" className="section trailer" aria-labelledby="trailer-h">
      <div className="section-head">
        <div className="label">THE GAME</div>
        <h2 id="trailer-h" className="section-title h-pixel">WATCH TRAILER</h2>
        <p className="muted">42 seconds. Every day is a level.</p>
      </div>
      <div ref={box} className={`trailer-frame panel ${fs ? 'is-fs' : ''}`} data-testid="trailer">
        {mode === 'poster' ? (
          <>
            <img className="trailer-poster" src={poster} alt="LIFE//XP trailer poster" width={1280} height={720} loading="lazy" decoding="async" />
            {visible && (
              <video ref={preview} className="trailer-preview" muted loop playsInline preload="none" poster={poster} aria-hidden tabIndex={-1} onCanPlay={(e) => e.currentTarget.classList.add('is-ready')}>
                <source src="/media/preview.webm" type="video/webm" />
                <source src="/media/preview.mp4" type="video/mp4" />
              </video>
            )}
            <button className="trailer-play magnetic" onClick={play} aria-label="Play trailer with sound" data-testid="trailer-play">
              <span className="play-ring"><svg viewBox="0 0 16 16" width="34" height="34" shapeRendering="crispEdges" aria-hidden><path d="M4 2h3v2h2v2h2v4H9v2H7v2H4z" fill="currentColor" /></svg></span>
              <span className="play-label pixel">PLAY TRAILER</span>
            </button>
          </>
        ) : (
          <>
            <video
              ref={main}
              key={mobile ? 'sm' : 'lg'}
              className="trailer-video"
              poster={poster}
              playsInline
              preload="auto"
              onClick={toggle}
              onPlay={() => setPaused(false)}
              onPause={() => setPaused(true)}
              onTimeUpdate={(e) => setProgress(e.currentTarget.duration ? (e.currentTarget.currentTime / e.currentTarget.duration) * 1000 : 0)}
              onEnded={() => setPaused(true)}
              data-testid="trailer-video"
            >
              <source src={mobile ? '/media/trailer-480.mp4' : '/media/trailer-720.mp4'} type="video/mp4" />
              <source src={mobile ? '/media/trailer-480.webm' : '/media/trailer-720.webm'} type="video/webm" onError={() => setErr(true)} />
            </video>
            {err && <div className="trailer-err" role="alert">The trailer could not be loaded. <button className="link-more" onClick={() => { setMode('poster'); setErr(false); }}>BACK</button></div>}
            <div className="trailer-controls">
              <button className="icon-btn" onClick={toggle} aria-label={paused ? 'Play' : 'Pause'}>{paused ? '▶' : '❚❚'}</button>
              <input type="range" min={0} max={1000} value={progress} onChange={seek} aria-label="Seek" className="trailer-seek" />
              <button className="icon-btn" onClick={() => { const m = main.current; if (m) { m.muted = !m.muted; setMuted(m.muted); } }} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted}>{muted ? '✕' : '♪'}</button>
              <button className="icon-btn" onClick={fullscreen} aria-label={fs ? 'Exit fullscreen' : 'Fullscreen'}>⛶</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

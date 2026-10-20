import { useEffect, useRef, useState } from 'react';
import { GameFrame, type PlayingContext } from '../components/GameFrame';
import quickBg from '../../assets/quick_response_bg.jpg';

function trialCountForLevel(level: number) { return [10, 12, 14, 16, 18][level - 1] ?? 10; }
function targetSizeForLevel(level: number) { return [90, 80, 70, 60, 50][level - 1] ?? 90; }
function timeoutForLevel(level: number) { return [1800, 1600, 1400, 1200, 1000][level - 1] ?? 1800; }

export function QuickResponse() {
  return (
    <GameFrame
      gameId="quick-response"
      instructions={[
        'A circular target will appear at a random position.',
        'Click it as quickly as you can once it appears.',
        'Clicking before it appears, or missing it, counts as an error.',
      ]}
    >
      {(ctx) => <Session {...ctx} />}
    </GameFrame>
  );
}

function Session({ difficulty, recordTrial, endGame }: PlayingContext) {
  const [sessionDifficulty] = useState(difficulty);
  const total = trialCountForLevel(sessionDifficulty);
  const targetSize = targetSizeForLevel(sessionDifficulty);
  const timeout = timeoutForLevel(sessionDifficulty);

  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhase] = useState<'waiting' | 'target'>('waiting');
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hitAnim, setHitAnim] = useState(false);
  const [missAnim, setMissAnim] = useState(false);
  const [timeoutPct, setTimeoutPct] = useState(0);
  const shownAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = () => {
    if (trialIndex + 1 >= total) { endGame(); return; }
    setTrialIndex((i) => i + 1);
  };

  useEffect(() => {
    resolvedRef.current = false;
    setTimeoutPct(0);
    const delay = 500 + Math.random() * 1000;

    const startTimer = setTimeout(() => {
      setPhase('waiting');
      setPos({ x: 12 + Math.random() * 76, y: 15 + Math.random() * 70 });
      shownAtRef.current = Date.now();
      setPhase('target');
      setTimeoutPct(0);

      // Countdown timer
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        const elapsed = Date.now() - shownAtRef.current;
        setTimeoutPct(Math.min(elapsed / timeout, 1));
      }, 30);

      timerRef.current = setTimeout(() => {
        if (resolvedRef.current) return;
        resolvedRef.current = true;
        if (tickRef.current) clearInterval(tickRef.current);
        setMissAnim(true);
        setTimeout(() => setMissAnim(false), 500);
        recordTrial(false, null);
        advance();
      }, timeout);
    }, delay);
    return () => {
      clearTimeout(startTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trialIndex]);

  const hitTarget = () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    const rt = Date.now() - shownAtRef.current;
    setHitAnim(true);
    setTimeout(() => setHitAnim(false), 500);
    recordTrial(true, rt);
    advance();
  };

  const missClick = () => {
    if (phase !== 'target' || resolvedRef.current) return;
    resolvedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    setMissAnim(true);
    setTimeout(() => setMissAnim(false), 500);
    recordTrial(false, Date.now() - shownAtRef.current);
    advance();
  };

  const progress = trialIndex / total;

  return (
    <div className="qr-arena" style={{ backgroundImage: `url(${quickBg})` }}>
      <div className={`qr-overlay ${hitAnim ? 'qr-hit-flash' : missAnim ? 'qr-miss-flash' : ''}`} />

      {/* Scanning lines */}
      <div className="qr-scan-line" />

      <div className="qr-hud">
        <div className="qr-hud-left">
          <div className="qr-progress-ring" style={{ '--pct': progress } as React.CSSProperties}>
            <svg viewBox="0 0 40 40">
              <circle className="qr-ring-track" cx="20" cy="20" r="16" />
              <circle
                className="qr-ring-fill"
                cx="20" cy="20" r="16"
                strokeDasharray={`${progress * 100.53} 100.53`}
                strokeDashoffset="25.13"
              />
            </svg>
            <span className="qr-trial-num">{trialIndex + 1}</span>
          </div>
          <span className="qr-hud-label">of {total}</span>
        </div>

        {phase === 'target' && (
          <div className="qr-timeout-bar">
            <div className="qr-timeout-fill" style={{ width: `${(1 - timeoutPct) * 100}%` }} />
          </div>
        )}
      </div>

      <div className="qr-game-area" onClick={missClick}>
        {phase === 'target' && (
          <button
            className="qr-target"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: targetSize,
              height: targetSize,
            }}
            onClick={(e) => { e.stopPropagation(); hitTarget(); }}
            aria-label="target"
          >
            <div className="qr-target-ring" />
            <div className="qr-target-ring qr-ring-2" />
            <div className="qr-target-core" />
          </button>
        )}
        {phase === 'waiting' && (
          <div className="qr-waiting">
            <div className="qr-radar" />
            <p className="qr-wait-text">Wait for target...</p>
          </div>
        )}
      </div>
    </div>
  );
}

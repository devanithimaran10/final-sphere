import { useEffect, useMemo, useRef, useState } from 'react';
import { GameFrame, type PlayingContext } from '../components/GameFrame';
import focusBg from '../../assets/focus_finder_bg.jpg';

const LETTERS_EASY = ['A', 'B', 'D', 'E', 'F', 'G', 'H'];
const LETTERS_HARD = ['A', 'B', 'D', 'E', 'F', 'G', 'H', 'K', 'Y', 'V'];

function seqLengthForLevel(level: number) { return [16, 20, 26, 32, 40][level - 1] ?? 16; }
function intervalForLevel(level: number) { return [1100, 950, 800, 650, 520][level - 1] ?? 1100; }

function buildSequence(level: number): string[] {
  const pool = level >= 4 ? LETTERS_HARD : LETTERS_EASY;
  const len = seqLengthForLevel(level);
  return Array.from({ length: len }, () => (Math.random() < 0.28 ? 'X' : pool[Math.floor(Math.random() * pool.length)]));
}

export function FocusFinder() {
  return (
    <GameFrame
      gameId="focus-finder"
      instructions={[
        'Letters will appear one at a time.',
        'Click "Tap" (or press Space) whenever you see the letter X.',
        'Do nothing for every other letter.',
      ]}
    >
      {(ctx) => <Round {...ctx} />}
    </GameFrame>
  );
}

function Round({ difficulty, recordTrial, endGame }: PlayingContext) {
  const [roundDifficulty] = useState(difficulty);
  const sequence = useMemo(() => buildSequence(roundDifficulty), [roundDifficulty]);
  const interval = intervalForLevel(roundDifficulty);
  const [index, setIndex] = useState(-1);
  const [flash, setFlash] = useState<'tap' | 'miss' | null>(null);
  const [enterAnim, setEnterAnim] = useState(false);
  const tappedRef = useRef(false);
  const shownAtRef = useRef(0);

  useEffect(() => {
    if (index === -1) { const t = setTimeout(() => setIndex(0), 900); return () => clearTimeout(t); }
    if (index >= sequence.length) { endGame(); return; }
    tappedRef.current = false;
    shownAtRef.current = Date.now();
    const isX = sequence[index] === 'X';
    setEnterAnim(true);
    setTimeout(() => setEnterAnim(false), 300);

    const t = setTimeout(() => {
      const tapped = tappedRef.current;
      const correct = isX ? tapped : !tapped;
      if (isX && !tapped) setFlash('miss');
      setTimeout(() => setFlash(null), 300);
      recordTrial(correct, isX && tapped ? Date.now() - shownAtRef.current : null);
      setIndex((i) => i + 1);
    }, interval);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const tap = () => {
    if (tappedRef.current || index < 0 || index >= sequence.length) return;
    tappedRef.current = true;
    setFlash('tap');
    setTimeout(() => setFlash(null), 200);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === ' ') { e.preventDefault(); tap(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const current = index >= 0 && index < sequence.length ? sequence[index] : null;
  const isX = current === 'X';
  const progress = index >= 0 ? Math.min(index / sequence.length, 1) : 0;

  return (
    <div className="ff-arena" style={{ backgroundImage: `url(${focusBg})` }}>
      <div className={`ff-overlay ${flash === 'tap' ? 'ff-overlay-tap' : flash === 'miss' ? 'ff-overlay-miss' : ''}`} />

      {/* Ambient particles */}
      <div className="ff-particles">
        {Array.from({ length: 16 }, (_, k) => (
          <div key={k} className="ff-particle" style={{ '--i': k } as React.CSSProperties} />
        ))}
      </div>

      <div className="ff-center">
        <div className="ff-progress-bar">
          <div className="ff-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        <div className={`ff-letter-stage ${isX ? 'ff-letter-x' : ''} ${enterAnim ? 'ff-enter' : ''}`}>
          {isX && <div className="ff-lightning" />}
          <span className="ff-letter">{current ?? '·'}</span>
          {isX && <div className="ff-x-rings"><div /><div /><div /></div>}
        </div>

        <button
          className={`ff-tap-btn ${flash === 'tap' ? 'ff-tap-pressed' : ''}`}
          onClick={tap}
        >
          <span className="ff-tap-icon">⚡</span>
          <span>TAP  (X)</span>
        </button>

        <p className="ff-counter">
          {index >= 0 ? `${Math.min(index + 1, sequence.length)} / ${sequence.length}` : 'Get ready...'}
        </p>
      </div>
    </div>
  );
}

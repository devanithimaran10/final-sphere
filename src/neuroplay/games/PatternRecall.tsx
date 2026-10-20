import { useEffect, useMemo, useRef, useState } from 'react';
import { GameFrame, type PlayingContext } from '../components/GameFrame';
import patternBg from '../../assets/pattern_recall_bg.jpg';

const GRID_SIZE = 16;
const ROUNDS = 6;

function cellsForLevel(level: number) {
  return [3, 5, 6, 8, 10][level - 1] ?? 3;
}

function pickCells(n: number): Set<number> {
  const pool = Array.from({ length: GRID_SIZE }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return new Set(pool.slice(0, n));
}

function sameSet(a: Set<number>, b: Set<number>) {
  return a.size === b.size && [...a].every((v) => b.has(v));
}

export function PatternRecall() {
  return (
    <GameFrame
      gameId="pattern-recall"
      instructions={[
        `A 4×4 grid will briefly highlight some cells (${ROUNDS} rounds total).`,
        'Memorise the highlighted cells, then click the same cells once they hide.',
        'Click "Submit" when you are done selecting.',
      ]}
    >
      {(ctx) => <RoundManager {...ctx} />}
    </GameFrame>
  );
}

function RoundManager({ difficulty, recordTrial, endGame }: PlayingContext) {
  const [roundIndex, setRoundIndex] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const targetCells = useMemo(() => pickCells(cellsForLevel(difficulty)), [roundIndex]);
  const showTime = Math.max(600, 1800 - difficulty * 150);

  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const hiddenAtRef = useRef(0);
  const [flashResult, setFlashResult] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPhase('input');
      hiddenAtRef.current = Date.now();
    }, showTime);
    return () => window.clearTimeout(t);
  }, [roundIndex, showTime]);

  const toggle = (i: number) => {
    if (phase !== 'input') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const submit = () => {
    const correct = sameSet(selected, targetCells);
    setFlashResult(correct ? 'correct' : 'wrong');
    setTimeout(() => {
      setFlashResult(null);
      recordTrial(correct, Date.now() - hiddenAtRef.current);
      setPhase('show');
      setSelected(new Set());
      if (roundIndex + 1 >= ROUNDS) { endGame(); return; }
      setRoundIndex((r) => r + 1);
    }, 700);
  };

  return (
    <div className="pr-arena" style={{ backgroundImage: `url(${patternBg})` }}>
      <div className="pr-overlay" />
      <div className="pr-center">
        <div className="pr-header">
          <span className="pr-round-label">Round {roundIndex + 1} / {ROUNDS}</span>
          <span className="pr-phase-badge">{phase === 'show' ? '● MEMORISE' : '● RECALL'}</span>
        </div>

        <div className={`pr-grid-wrapper ${flashResult === 'correct' ? 'pr-flash-correct' : flashResult === 'wrong' ? 'pr-flash-wrong' : ''}`}>
          <div className="pr-grid-3d">
            {Array.from({ length: GRID_SIZE }, (_, i) => {
              const lit = phase === 'show' && targetCells.has(i);
              const chosen = phase === 'input' && selected.has(i);
              return (
                <button
                  key={i}
                  className={`pr-cell ${lit ? 'pr-cell-lit' : ''} ${chosen ? 'pr-cell-chosen' : ''}`}
                  disabled={phase !== 'input'}
                  onClick={() => toggle(i)}
                  aria-label={`cell ${i}`}
                >
                  {lit && <div className="pr-cell-pulse" />}
                  {chosen && <div className="pr-cell-check">✓</div>}
                </button>
              );
            })}
          </div>
        </div>

        {phase === 'input' && (
          <button className="pr-submit-btn" onClick={submit}>
            <span>Submit Pattern</span>
          </button>
        )}
        {phase === 'show' && <p className="pr-memorise-hint">🧠 Memorise the glowing cells...</p>}
      </div>
    </div>
  );
}

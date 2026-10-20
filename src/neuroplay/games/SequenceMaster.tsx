import { useEffect, useRef, useState } from 'react';
import { GameFrame, type PlayingContext } from '../components/GameFrame';
import seqBg from '../../assets/sequence_master_bg.jpg';

const ROUNDS = 6;

function spanForLevel(level: number) { return [3, 4, 5, 6, 7][level - 1] ?? 3; }
function modeForLevel(level: number): 'forward' | 'backward' { return level <= 3 ? 'forward' : 'backward'; }
function generateSeq(n: number) { return Array.from({ length: n }, () => Math.floor(Math.random() * 9) + 1); }

export function SequenceMaster() {
  return (
    <GameFrame
      gameId="sequence-master"
      instructions={[
        'A sequence of numbers will appear one at a time.',
        'At lower levels, reproduce it in the same order.',
        'At higher levels, reproduce it in reverse order.',
      ]}
    >
      {(ctx) => <RoundManager {...ctx} />}
    </GameFrame>
  );
}

function RoundManager({ difficulty, recordTrial, endGame }: PlayingContext) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [showIndex, setShowIndex] = useState(0);
  const [input, setInput] = useState<number[]>([]);
  const inputStartRef = useRef(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const createRoundState = (level: number) => {
    const span = spanForLevel(level);
    const mode = modeForLevel(level);
    const sequence = generateSeq(span);
    return { sequence, expected: mode === 'backward' ? [...sequence].reverse() : sequence, mode };
  };

  const [roundState, setRoundState] = useState(() => createRoundState(difficulty));

  const beginRound = (nextDifficulty = difficulty) => {
    const nextRound = createRoundState(nextDifficulty);
    setRoundState(nextRound);
    setPhase('show');
    setShowIndex(0);
    setInput([]);
    inputStartRef.current = 0;
  };

  useEffect(() => {
    if (phase !== 'show') return;
    if (showIndex >= roundState.sequence.length) {
      const t = window.setTimeout(() => {
        setPhase('input');
        inputStartRef.current = Date.now();
      }, 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setShowIndex((i) => i + 1), 800);
    return () => window.clearTimeout(t);
  }, [phase, roundState.sequence.length, showIndex]);

  const pushDigit = (d: number) => {
    const next = [...input, d];
    setInput(next);
    if (next.length === roundState.expected.length) {
      const correct = next.every((v, i) => v === roundState.expected[i]);
      setLastCorrect(correct);
      // eslint-disable-next-line react-hooks/purity
      recordTrial(correct, Date.now() - inputStartRef.current);
      setTimeout(() => {
        setLastCorrect(null);
        if (roundIndex + 1 >= ROUNDS) { endGame(); return; }
        setRoundIndex((r) => r + 1);
        beginRound(difficulty);
      }, 700);
    }
  };

  if (phase === 'show') {
    const i = Math.min(showIndex, roundState.sequence.length - 1);
    const num = roundState.sequence[i];
    return (
      <div className="sq-arena" style={{ backgroundImage: `url(${seqBg})` }}>
        <div className="sq-overlay" />
        <div className="sq-center">
          <div className="sq-header">
            <span className="sq-label">Round {roundIndex + 1} / {ROUNDS}</span>
            <span className="sq-label">Number {Math.min(showIndex + 1, roundState.sequence.length)} / {roundState.sequence.length}</span>
          </div>
          <div className="sq-number-display sq-float">
            <div className="sq-number-ring" />
            <span className="sq-number">{num}</span>
          </div>
          {/* Progress dots */}
          <div className="sq-dots">
            {roundState.sequence.map((_, idx) => (
              <div key={idx} className={`sq-dot ${idx < showIndex ? 'sq-dot-done' : idx === showIndex ? 'sq-dot-active' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sq-arena" style={{ backgroundImage: `url(${seqBg})` }}>
      <div className="sq-overlay" />
      <div className="sq-center">
        <p className="sq-mode-label">
          {roundState.mode === 'backward' ? '🔄 Enter in REVERSE order' : '➡️ Enter in same order'}
        </p>

        {/* Input display */}
        <div className={`sq-input-row ${lastCorrect === true ? 'sq-flash-correct' : lastCorrect === false ? 'sq-flash-wrong' : ''}`}>
          {roundState.expected.map((_, i) => (
            <div key={i} className={`sq-input-slot ${input[i] !== undefined ? 'sq-slot-filled' : ''}`}>
              {input[i] ?? ''}
            </div>
          ))}
        </div>

        {/* Numpad */}
        <div className="sq-numpad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              className="sq-num-btn"
              onClick={() => pushDigit(d)}
              disabled={lastCorrect !== null}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

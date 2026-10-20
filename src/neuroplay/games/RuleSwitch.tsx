import { useMemo, useRef, useState } from 'react';
import { GameFrame, type PlayingContext } from '../components/GameFrame';
import ruleBg from '../../assets/rule_switch_bg.jpg';

const ALL_COLORS = ['red', 'blue', 'green', 'yellow'];
const SWITCH_EVERY = 6;

const COLOR_HEX: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#fbbf24',
};
const SHAPES = ['▲', '●', '■', '◆'];

function trialCountForLevel(level: number) { return [12, 16, 20, 24, 28][level - 1] ?? 12; }
function colorPoolForLevel(level: number) { return ALL_COLORS.slice(0, [2, 2, 3, 3, 4][level - 1] ?? 2); }

export function RuleSwitch() {
  return (
    <GameFrame
      gameId="rule-switch"
      instructions={[
        'A rule at the top tells you which colour to match, e.g. "Click objects that are RED".',
        'For each shape, choose "Match" if it fits the current rule, or "No Match" if it does not.',
        'The rule will change without warning after several rounds — watch for it.',
      ]}
    >
      {(ctx) => <Session {...ctx} />}
    </GameFrame>
  );
}

function Session({ difficulty, recordTrial, endGame }: PlayingContext) {
  const [sessionDifficulty] = useState(difficulty);
  const totalTrials = trialCountForLevel(sessionDifficulty);
  const colorPool = useMemo(() => colorPoolForLevel(sessionDifficulty), [sessionDifficulty]);

  const [trialIndex, setTrialIndex] = useState(0);
  const [rule, setRule] = useState(() => colorPool[0]);
  const [shapeColor, setShapeColor] = useState(() => colorPool[Math.floor(Math.random() * colorPool.length)] ?? colorPool[0]);
  const [shapeIdx] = useState(() => Math.floor(Math.random() * SHAPES.length));
  const [justSwitched, setJustSwitched] = useState(false);
  const [switchAnim, setSwitchAnim] = useState(false);
  const shownAtRef = useRef(Date.now());
  const [flashResult, setFlashResult] = useState<'match' | 'no-match' | null>(null);

  const answer = (saidMatch: boolean) => {
    const correct = saidMatch === (shapeColor === rule);
    setFlashResult(correct ? 'match' : 'no-match');

    const nextIndex = trialIndex + 1;
    const nextIsSwitch = nextIndex > 0 && nextIndex % SWITCH_EVERY === 0;

    recordTrial(correct, Date.now() - shownAtRef.current);
    shownAtRef.current = Date.now();

    setTimeout(() => {
      setFlashResult(null);
      if (nextIndex >= totalTrials) { endGame(); return; }

      let nextRule = rule;
      if (nextIsSwitch) {
        const next = colorPool.filter((c) => c !== rule);
        nextRule = next[Math.floor(Math.random() * next.length)] ?? rule;
        setSwitchAnim(true);
        setTimeout(() => setSwitchAnim(false), 800);
      }
      setRule(nextRule);
      setShapeColor(colorPool[Math.floor(Math.random() * colorPool.length)] ?? colorPool[0]);
      setJustSwitched(nextIsSwitch);
      setTrialIndex(nextIndex);
    }, 500);
  };

  const nextSwitchIn = SWITCH_EVERY - (trialIndex % SWITCH_EVERY);
  const progress = trialIndex / totalTrials;

  return (
    <div className="rs-arena" style={{ backgroundImage: `url(${ruleBg})` }}>
      <div className="rs-overlay" />
      <div className="rs-center">
        {/* Rule banner */}
        <div className={`rs-rule-banner ${justSwitched ? 'rs-rule-switched' : ''} ${switchAnim ? 'rs-switch-anim' : ''}`}>
          {justSwitched && <span className="rs-switch-badge">RULE CHANGED!</span>}
          <span className="rs-rule-prefix">Match objects that are</span>
          <span className="rs-rule-color" style={{ color: COLOR_HEX[rule], textShadow: `0 0 20px ${COLOR_HEX[rule]}` }}>
            {rule.toUpperCase()}
          </span>
        </div>

        {/* Progress */}
        <div className="rs-progress">
          <div className="rs-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="rs-meta">
          <span>Trial {trialIndex + 1} / {totalTrials}</span>
          <span>Switch in {nextSwitchIn}</span>
        </div>

        {/* Shape */}
        <div className={`rs-shape-container ${flashResult === 'match' ? 'rs-correct' : flashResult === 'no-match' ? 'rs-wrong' : ''}`}>
          <div
            className="rs-shape rs-float"
            style={{
              color: COLOR_HEX[shapeColor] ?? shapeColor,
              textShadow: `0 0 40px ${COLOR_HEX[shapeColor] ?? shapeColor}, 0 0 80px ${COLOR_HEX[shapeColor] ?? shapeColor}`,
            }}
          >
            {SHAPES[shapeIdx]}
          </div>
        </div>

        {/* Buttons */}
        <div className="rs-btn-row">
          <button
            className="rs-btn rs-btn-match"
            onClick={() => answer(true)}
            disabled={flashResult !== null}
          >
            <span className="rs-btn-icon">✓</span> MATCH
          </button>
          <button
            className="rs-btn rs-btn-nomatch"
            onClick={() => answer(false)}
            disabled={flashResult !== null}
          >
            <span className="rs-btn-icon">✕</span> NO MATCH
          </button>
        </div>
      </div>
    </div>
  );
}

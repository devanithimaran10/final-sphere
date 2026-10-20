import { useEffect, useMemo, useRef, useState } from 'react';
import { GameFrame, type PlayingContext } from '../components/GameFrame';
import sceneBg from '../../assets/scene_memory_bg.jpg';
import { OBJECT_IMAGES } from './gameImages';

const OBJECT_POOL = ['cup', 'book', 'plant', 'clock', 'lamp', 'glasses', 'vase', 'candle', 'key', 'phone'];
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'white'];
const COLOR_HEX: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e',
  yellow: '#fbbf24', purple: '#a855f7', white: '#f1f5f9',
};

function objectCountForLevel(level: number) {
  return [4, 5, 6, 7, 8][level - 1] ?? 4;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SceneObject { name: string; color: string }
interface Question { text: string; options: string[]; answer: string }

function buildScene(count: number): SceneObject[] {
  return shuffle(OBJECT_POOL).slice(0, count).map((name) => ({
    name, color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
}

function buildQuestions(scene: SceneObject[]): Question[] {
  const qs: Question[] = [];
  scene.slice(0, 2).forEach((o) => {
    const distractors = shuffle(COLORS.filter((c) => c !== o.color)).slice(0, 2);
    qs.push({ text: `What colour was the ${o.name}?`, options: shuffle([o.color, ...distractors]), answer: o.color });
  });
  const absentPool = OBJECT_POOL.filter((n) => !scene.some((o) => o.name === n));
  const presentTarget = scene[Math.floor(Math.random() * scene.length)];
  qs.push({ text: `Was there a ${presentTarget.name} in the scene?`, options: ['Yes', 'No'], answer: 'Yes' });
  if (absentPool.length > 0) {
    const absentTarget = absentPool[Math.floor(Math.random() * absentPool.length)];
    qs.push({ text: `Was there a ${absentTarget} in the scene?`, options: ['Yes', 'No'], answer: 'No' });
  }
  if (scene.length >= 3) {
    const i = 1 + Math.floor(Math.random() * (scene.length - 2));
    const neighbor = scene[i - 1];
    const distractors = shuffle(scene.map((o) => o.name).filter((n) => n !== neighbor.name && n !== scene[i].name)).slice(0, 2);
    qs.push({ text: `Which object was directly beside the ${scene[i].name}?`, options: shuffle([neighbor.name, ...distractors]), answer: neighbor.name });
  }
  return shuffle(qs);
}

/* Extract the object name mentioned in a question text */
function extractObjectFromQuestion(text: string): string | null {
  const match = text.match(/the (\w+)\?$/);
  if (match) return match[1];
  const match2 = text.match(/a (\w+) in/);
  if (match2) return match2[1];
  return null;
}

export function SceneMemory() {
  return (
    <GameFrame
      gameId="scene-memory"
      instructions={[
        'Study a scene containing several objects with images for a short time.',
        'Then answer a few questions about the details of the scene.',
        'This tests memory for context, not just recognition.',
      ]}
    >
      {(ctx) => <Round {...ctx} />}
    </GameFrame>
  );
}

function Round({ difficulty, recordTrial, endGame }: PlayingContext) {
  const [roundDifficulty] = useState(difficulty);
  const count = objectCountForLevel(roundDifficulty);
  const scene = useMemo(() => buildScene(count), [count]);
  const questions = useMemo(() => buildQuestions(scene), [scene]);
  const viewTime = Math.max(2500, 5500 - roundDifficulty * 500);
  const delayTime = 500 + roundDifficulty * 300;
  const [phase, setPhase] = useState<'view' | 'delay' | 'test'>('view');
  const [qIndex, setQIndex] = useState(0);
  const questionStartRef = useRef(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(Math.round(viewTime / 1000));

  useEffect(() => {
    if (phase === 'view') {
      const t = setTimeout(() => setPhase('delay'), viewTime);
      const tick = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
      return () => { clearTimeout(t); clearInterval(tick); };
    }
    if (phase === 'delay') {
      const t = setTimeout(() => { setPhase('test'); questionStartRef.current = Date.now(); }, delayTime);
      return () => clearTimeout(t);
    }
  }, [phase, viewTime, delayTime]);

  const answer = (choice: string) => {
    setSelected(choice);
    setTimeout(() => {
      setSelected(null);
      recordTrial(choice === questions[qIndex].answer, Date.now() - questionStartRef.current);
      if (qIndex + 1 >= questions.length) { endGame(); return; }
      setQIndex((i) => i + 1);
      questionStartRef.current = Date.now();
    }, 500);
  };

  if (phase === 'view') {
    return (
      <div className="sm-arena" style={{ backgroundImage: `url(${sceneBg})` }}>
        <div className="sm-overlay" />
        <div className="sm-center">
          <div className="sm-header">
            <span className="sm-badge">MEMORISE THE SCENE</span>
            <span className="sm-timer">{timeLeft}s</span>
          </div>
          <div className="sm-scene-grid">
            {scene.map((o, idx) => {
              const objImg = OBJECT_IMAGES[o.name];
              return (
                <div
                  key={o.name}
                  className="sm-object-card sm-float sm-card-enhanced"
                  style={{ '--delay': `${idx * 0.1}s`, animationDelay: `${idx * 0.12}s` } as React.CSSProperties}
                >
                  <div className="sm-object-swatch" style={{ background: COLOR_HEX[o.color] ?? o.color }} />
                  {objImg ? (
                    <div className="sm-object-img-wrap">
                      <img
                        src={objImg}
                        alt={o.name}
                        className="sm-object-img sm-img-pop"
                        draggable={false}
                      />
                      <div className="sm-img-glow" style={{ background: `radial-gradient(circle, ${COLOR_HEX[o.color]}33, transparent 70%)` }} />
                    </div>
                  ) : (
                    <div className="sm-object-emoji">?</div>
                  )}
                  <div className="sm-object-name">{o.name}</div>
                  <div className="sm-object-color" style={{ color: COLOR_HEX[o.color] ?? o.color }}>{o.color}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'delay') {
    return (
      <div className="sm-arena" style={{ backgroundImage: `url(${sceneBg})` }}>
        <div className="sm-overlay" />
        <div className="sm-center">
          <div className="sm-delay-card">
            <div className="sm-delay-ring" />
            <p className="sm-delay-text">Get ready...</p>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[qIndex];
  const questionObj = extractObjectFromQuestion(q.text);
  const questionObjImg = questionObj ? OBJECT_IMAGES[questionObj] : null;

  return (
    <div className="sm-arena" style={{ backgroundImage: `url(${sceneBg})` }}>
      <div className="sm-overlay" />
      <div className="sm-center">
        <p className="sm-q-counter">Question {qIndex + 1} of {questions.length}</p>
        <div className="sm-question-card">
          {questionObjImg && (
            <div className="sm-question-img-wrap">
              <img
                src={questionObjImg}
                alt={questionObj ?? ''}
                className="sm-question-img sm-img-pop"
                draggable={false}
              />
            </div>
          )}
          <p className="sm-question-text">{q.text}</p>
          <div className="sm-options">
            {q.options.map((opt) => {
              const optImg = OBJECT_IMAGES[opt];
              return (
                <button
                  key={opt}
                  className={`sm-option ${selected === opt ? (opt === q.answer ? 'sm-option-correct' : 'sm-option-wrong') : ''}`}
                  onClick={() => answer(opt)}
                  disabled={selected !== null}
                >
                  {optImg && <img src={optImg} alt={opt} className="sm-opt-img" draggable={false} />}
                  {COLOR_HEX[opt] && <span className="sm-opt-swatch" style={{ background: COLOR_HEX[opt] }} />}
                  <span className="capitalize">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

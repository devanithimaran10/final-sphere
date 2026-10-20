import { useEffect, useMemo, useRef, useState } from 'react';
import { GameFrame, type PlayingContext } from '../components/GameFrame';
import wordBg from '../../assets/word_recall_bg.jpg';
import { WORD_IMAGES } from './gameImages';

const WORD_BANK = [
  'APPLE', 'RIVER', 'CHAIR', 'GARDEN', 'CLOCK', 'BRIDGE', 'CANDLE', 'FOREST', 'MIRROR', 'PENCIL',
  'BASKET', 'WINDOW', 'PILLOW', 'BOTTLE', 'KITCHEN', 'ISLAND', 'VALLEY', 'BUTTON', 'BLANKET', 'WHISTLE',
  'ORANGE', 'TURTLE', 'SILVER', 'PLANET', 'CASTLE', 'HARBOR', 'MEADOW', 'TUNNEL', 'CRAYON', 'ANCHOR',
];

function wordCountForLevel(level: number) {
  return [5, 6, 8, 10, 12][level - 1] ?? 5;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function WordRecall() {
  return (
    <GameFrame
      gameId="word-recall"
      instructions={[
        'You will see a short list of words with pictures to study.',
        'After the list disappears, words will appear one at a time.',
        'Click "Seen" if it was in the list, or "Not Seen" if it was not.',
      ]}
    >
      {(ctx) => <Round key={0} {...ctx} />}
    </GameFrame>
  );
}

function Round({ difficulty, recordTrial, endGame }: PlayingContext) {
  const [roundDifficulty] = useState(difficulty);
  const count = wordCountForLevel(roundDifficulty);
  const [phase, setPhase] = useState<'study' | 'test'>('study');
  const [studyIndex, setStudyIndex] = useState(0);
  const [testIndex, setTestIndex] = useState(0);
  const questionStartRef = useRef(0);
  const [answer3d, setAnswer3d] = useState<'correct' | 'wrong' | null>(null);
  const [particleKey, setParticleKey] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  const targets = useMemo(() => shuffle(WORD_BANK).slice(0, count), [count]);
  const testWords = useMemo(() => {
    const distractors = shuffle(WORD_BANK.filter((w) => !targets.includes(w))).slice(0, count);
    return shuffle([
      ...targets.map((w) => ({ word: w, isTarget: true })),
      ...distractors.map((w) => ({ word: w, isTarget: false })),
    ]);
  }, [targets, count]);

  const studyTime = Math.max(700, 1500 - roundDifficulty * 120);

  useEffect(() => {
    if (phase !== 'study') return;
    const t = setTimeout(() => {
      if (studyIndex + 1 >= targets.length) {
        setPhase('test');
        questionStartRef.current = Date.now();
      } else {
        setStudyIndex((i) => i + 1);
        setImgLoaded(false);
      }
    }, studyTime);
    return () => clearTimeout(t);
  }, [phase, studyIndex, targets.length, studyTime]);

  const answer = (saidSeen: boolean) => {
    const q = testWords[testIndex];
    const correct = saidSeen === q.isTarget;
    setAnswer3d(correct ? 'correct' : 'wrong');
    setParticleKey(k => k + 1);
    setTimeout(() => setAnswer3d(null), 600);
    recordTrial(correct, Date.now() - questionStartRef.current);
    if (testIndex + 1 >= testWords.length) { endGame(); return; }
    setTestIndex((i) => i + 1);
    setImgLoaded(false);
    questionStartRef.current = Date.now();
  };

  if (phase === 'study') {
    const i = Math.min(studyIndex, targets.length - 1);
    const wordImg = WORD_IMAGES[targets[i]];
    return (
      <div className="wr-arena" style={{ backgroundImage: `url(${wordBg})` }}>
        <div className="wr-overlay" />
        <div className="wr-particles">
          {Array.from({ length: 12 }, (_, k) => (
            <div key={k} className="wr-particle" style={{ '--i': k } as React.CSSProperties} />
          ))}
        </div>
        <div className="wr-center">
          <div className="wr-progress-row">
            {targets.map((_, idx) => (
              <div key={idx} className={`wr-dot ${idx < studyIndex ? 'wr-dot-done' : idx === studyIndex ? 'wr-dot-active' : ''}`} />
            ))}
          </div>
          <p className="wr-hint">Study word {Math.min(studyIndex + 1, targets.length)} of {targets.length}</p>
          <div className="wr-word-card wr-float wr-card-with-image">
            <div className="wr-word-glow" />
            {wordImg && (
              <div className={`wr-word-image-wrap ${imgLoaded ? 'wr-img-visible' : ''}`}>
                <img
                  src={wordImg}
                  alt={targets[i]}
                  className="wr-word-image wr-img-bounce"
                  onLoad={() => setImgLoaded(true)}
                  draggable={false}
                />
                <div className="wr-img-ring" />
              </div>
            )}
            <span className="wr-word-text">{targets[i]}</span>
          </div>
        </div>
      </div>
    );
  }

  const q = testWords[testIndex];
  const wordImg = WORD_IMAGES[q.word];
  return (
    <div className="wr-arena" style={{ backgroundImage: `url(${wordBg})` }}>
      <div className="wr-overlay" />
      <div className="wr-particles">
        {Array.from({ length: 12 }, (_, k) => (
          <div key={`${particleKey}-${k}`} className="wr-particle" style={{ '--i': k } as React.CSSProperties} />
        ))}
      </div>
      <div className="wr-center">
        <p className="wr-hint">Word {testIndex + 1} of {testWords.length}</p>
        <div className={`wr-word-card wr-float wr-card-with-image ${answer3d === 'correct' ? 'wr-correct-flash' : answer3d === 'wrong' ? 'wr-wrong-flash' : ''}`}>
          <div className="wr-word-glow" />
          {wordImg && (
            <div className={`wr-word-image-wrap ${imgLoaded ? 'wr-img-visible' : ''}`}>
              <img
                src={wordImg}
                alt={q.word}
                className="wr-word-image wr-img-bounce"
                onLoad={() => setImgLoaded(true)}
                draggable={false}
              />
              <div className="wr-img-ring" />
            </div>
          )}
          <span className="wr-word-text">{q.word}</span>
        </div>
        <p className="wr-question">Was this word in the list?</p>
        <div className="wr-btn-row">
          <button className="wr-btn wr-btn-yes" onClick={() => answer(true)}>
            <span className="wr-btn-icon">✓</span> SEEN
          </button>
          <button className="wr-btn wr-btn-no" onClick={() => answer(false)}>
            <span className="wr-btn-icon">✕</span> NOT SEEN
          </button>
        </div>
      </div>
    </div>
  );
}

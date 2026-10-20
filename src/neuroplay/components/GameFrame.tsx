import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DifficultyLevel, GameId, TrialResult } from '../types';
import { DOMAIN_LABEL, GAME_META } from '../types';
import { useNeuroPlayStore } from '../store/useNeuroPlayStore';
import { updateDifficulty } from '../engine/adaptiveEngine';
import { calculateAccuracy, calculateSessionScore, mean } from '../engine/scoringEngine';
import { estimateFatigue, fatigueBand, restRecommendation } from '../engine/fatigueEngine';
import { generateGameRecommendation } from '../engine/recommendationEngine';

import { Panoramic3DStage } from './Panoramic3DStage';

export interface PlayingContext {
  difficulty: DifficultyLevel;
  trialCount: number;
  recordTrial: (correct: boolean, reactionTimeMs?: number | null) => void;
  endGame: () => void;
}

type Phase = 'intro' | 'countdown' | 'playing' | 'results';

export function GameFrame({ gameId, instructions, children }: {
  gameId: GameId;
  instructions: string[];
  children: (ctx: PlayingContext) => ReactNode;
}) {
  const meta = GAME_META[gameId];
  const startingDifficulty = useNeuroPlayStore((s) => s.difficultyByGame[gameId]);
  const addGameSession = useNeuroPlayStore((s) => s.addGameSession);
  const closeGame = useNeuroPlayStore((s) => s.closeGame);
  const navigate = useNeuroPlayStore((s) => s.navigate);
  const inTrainingSession = useNeuroPlayStore((s) => s.trainingQueue !== null);
  const advanceTrainingSession = useNeuroPlayStore((s) => s.advanceTrainingSession);
  // Select the stable `sessions` array reference and derive the filtered
  // list in a memo — computing a fresh array inside the selector itself
  // would make useSyncExternalStore see a "changed" snapshot on every
  // read and re-render forever.
  const sessions = useNeuroPlayStore((s) => s.sessions);
  const priorScores = useMemo(
    () => sessions.filter((x) => x.domain === meta.domain).slice(0, 5).map((x) => x.score),
    [sessions, meta.domain],
  );

  const [phase, setPhase] = useState<Phase>('intro');
  const [countdown, setCountdown] = useState(3);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(startingDifficulty);
  const [fatigueLevel, setFatigueLevel] = useState(0);
  const [trialCount, setTrialCount] = useState(0);
  const trialsRef = useRef<TrialResult[]>([]);
  const sessionStartRef = useRef(0);
  const difficultyStartRef = useRef<DifficultyLevel>(startingDifficulty);
  const [, forceRender] = useState(0);
  const [result, setResult] = useState<{
    accuracy: number; avgReactionMs: number | null; score: number;
    fatigueLevel: number; mistakes: number; recommendation: string;
  } | null>(null);

  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdown <= 0) {
      const transition = window.setTimeout(() => {
        trialsRef.current = [];
        sessionStartRef.current = Date.now();
        difficultyStartRef.current = difficulty;
        setFatigueLevel(0);
        setTrialCount(0);
        setPhase('playing');
      }, 0);
      return () => window.clearTimeout(transition);
    }

    const t = window.setTimeout(() => setCountdown((c) => c - 1), 700);
    return () => window.clearTimeout(t);
  }, [phase, countdown, difficulty]);

  const start = () => {
    setCountdown(3);
    setPhase('countdown');
    trialsRef.current = [];
    setFatigueLevel(0);
    setTrialCount(0);
  };

  const recordTrial: PlayingContext['recordTrial'] = (correct, reactionTimeMs = null) => {
    // eslint-disable-next-line react-hooks/purity
    const nextTrials = [...trialsRef.current, { correct, reactionTimeMs, difficulty, timestamp: Date.now() }];
    trialsRef.current = nextTrials;
    setTrialCount(nextTrials.length);

    const nextFatigue = estimateFatigue(nextTrials, sessionStartRef.current);
    const nextDifficulty = updateDifficulty(nextTrials, difficulty, nextFatigue);
    setFatigueLevel(nextFatigue);
    if (nextDifficulty !== difficulty) setDifficulty(nextDifficulty);
    forceRender((n) => n + 1);
  };

  const endGame = () => {
    const trials = trialsRef.current;
    const accuracy = calculateAccuracy(trials);
    const times = trials.map((t) => t.reactionTimeMs).filter((t): t is number => t !== null);
    const avgReactionMs = times.length ? Math.round(mean(times)) : null;
    const score = calculateSessionScore(trials, difficulty);
    const mistakes = trials.filter((t) => !t.correct).length;

    const session = {
      // eslint-disable-next-line react-hooks/purity
      id: Math.random().toString(36).slice(2, 11),
      gameId, domain: meta.domain, date: new Date().toISOString(),
      trials, accuracy, avgReactionMs,
      difficultyStart: difficultyStartRef.current, difficultyEnd: difficulty,
      score, fatigueLevel,
    };
    addGameSession(session);

    const rest = restRecommendation(fatigueLevel);
    const recommendation = rest ?? generateGameRecommendation(session, priorScores);
    setResult({ accuracy, avgReactionMs, score, fatigueLevel, mistakes, recommendation });
    setPhase('results');
  };

  const playAgain = () => {
    setDifficulty(startingDifficulty);
    setPhase('intro');
    setResult(null);
    setCountdown(3);
    setTrialCount(0);
    trialsRef.current = [];
  };
  const backToDashboard = () => { closeGame(); navigate('dashboard'); };

  return (
    <Panoramic3DStage
      gameId={gameId}
      difficulty={difficulty}
      trialCount={trialCount}
      fatigueLevel={fatigueLevel}
      phase={phase}
      onExit={backToDashboard}
      onEndEarly={phase === 'playing' ? endGame : undefined}
    >
      {phase === 'intro' && (
        <div className="np-card max-w-xl w-full p-8 md:p-10 text-center mx-auto shadow-2xl backdrop-blur-2xl border border-white/15 bg-slate-950/85">
          <p className="text-sm uppercase tracking-widest text-teal-400 font-semibold mb-2">Training Focus · {DOMAIN_LABEL[meta.domain]}</p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-50 mb-4 font-orbitron">{meta.description}</h2>
          <ul className="text-left space-y-2 mb-8 text-slate-300 text-base md:text-lg">
            {instructions.map((line, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-teal-400 mt-1">•</span><span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-center gap-2 mb-6 text-sm text-slate-400 font-mono">
            <span>Starting difficulty:</span>
            <DifficultyDots level={startingDifficulty} />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-6 font-mono">
            Drag screen to look 360° around the arena. Difficulty adapts gradually to your speed & accuracy.
          </p>
          <button className="np-btn-primary w-full max-w-xs mx-auto py-3 text-lg font-bold font-orbitron shadow-xl tracking-wider" onClick={start}>
            Enter 3D Arena
          </button>
        </div>
      )}

      {phase === 'countdown' && (
        <div className="np-card max-w-sm w-full p-14 text-center mx-auto shadow-2xl backdrop-blur-2xl border border-teal-500/40 bg-slate-950/85">
          <span className="text-8xl font-black text-teal-400 font-orbitron block animate-pulse">
            {countdown > 0 ? countdown : 'GO!'}
          </span>
          <p className="text-xs uppercase tracking-widest text-slate-400 mt-4 font-mono">Entering 360° Space</p>
        </div>
      )}

      {phase === 'playing' && (
        <div className="w-full">
          {/* eslint-disable-next-line react-hooks/refs */}
          {children({ difficulty, trialCount, recordTrial, endGame })}
        </div>
      )}

      {phase === 'results' && result && (
        <div className="np-card max-w-xl w-full p-8 md:p-10 mx-auto shadow-2xl backdrop-blur-2xl border border-white/15 bg-slate-950/85">
          <p className="text-sm uppercase tracking-widest text-teal-400 font-semibold mb-1 font-mono">Session Complete</p>
          <h2 className="text-2xl font-bold text-slate-50 mb-6 font-orbitron">{meta.name}</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatBlock label="Score" value={result.score} />
            <StatBlock label="Accuracy" value={`${result.accuracy}%`} />
            {result.avgReactionMs !== null && <StatBlock label="Avg Reaction" value={`${result.avgReactionMs} ms`} />}
            <StatBlock label="Difficulty" value={`Level ${difficulty}`} />
            <StatBlock label="Mistakes" value={result.mistakes} />
            <StatBlock label="Fatigue" value={fatigueBand(result.fatigueLevel)} />
          </div>

          <div className="np-callout mb-8">{result.recommendation}</div>
          <p className="text-xs text-slate-500 text-center mb-6 font-mono">
            This result is a training indicator for {DOMAIN_LABEL[meta.domain].toLowerCase()}, not a clinical assessment.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            {inTrainingSession ? (
              <button className="np-btn-primary" onClick={advanceTrainingSession}>Continue</button>
            ) : (
              <>
                <button className="np-btn-primary" onClick={playAgain}>Play Again</button>
                <button className="np-btn-secondary" onClick={backToDashboard}>Back to Dashboard</button>
              </>
            )}
          </div>
        </div>
      )}
    </Panoramic3DStage>
  );
}

export function DifficultyDots({ level }: { level: DifficultyLevel }) {
  return (
    <span className="inline-flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: i <= level ? '#2dd4bf' : 'rgba(148,163,184,0.25)' }}
        />
      ))}
    </span>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="np-stat">
      <p className="np-stat-label">{label}</p>
      <p className="np-stat-value">{value}</p>
    </div>
  );
}

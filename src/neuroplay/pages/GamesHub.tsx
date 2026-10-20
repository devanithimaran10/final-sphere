import { useNeuroPlayStore } from '../store/useNeuroPlayStore';
import { GAME_META, DOMAIN_LABEL, type GameId } from '../types';
import { DifficultyDots } from '../components/GameFrame';
import { GAME_360_CONFIG } from '../components/Panoramic3DStage';
import { Compass, Sparkles, Download } from 'lucide-react';

const GAME_IDS = Object.keys(GAME_META) as GameId[];

export function GamesHub() {
  const openGame = useNeuroPlayStore((s) => s.openGame);
  const difficultyByGame = useNeuroPlayStore((s) => s.difficultyByGame);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold mb-2">
            <Compass size={14} className="animate-spin" style={{ animationDuration: '10s' }} />
            <span>360° IMMERSIVE 3D FULLSCREEN</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-50 tracking-tight font-orbitron">
            Cognitive Training Games
          </h1>
          <p className="text-slate-400 text-base md:text-lg mt-1 max-w-2xl">
            Fully 3D panoramic arenas with 360-degree look-around, adaptive speed, and patient-tailored visual feedback.
          </p>
        </div>

        <a
          href="/sphere-trainer/sphere-trainer-360-3d-fullscreen.zip"
          download="sphere-trainer-360-3d-fullscreen.zip"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 hover:shadow-[0_0_20px_rgba(0,212,255,0.25)] transition-all active:scale-95 whitespace-nowrap self-start md:self-end"
          title="Download complete project as offline ZIP"
        >
          <Download size={15} className="text-cyan-400" />
          <span>Download Project ZIP (6.5 MB)</span>
        </a>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-8 text-xs">
        <div className="np-mini-card border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
          <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <Sparkles size={13} /> 360° Panoramic View
          </p>
          <p className="text-slate-400 mt-1">Look around in complete 360 degrees or enable smooth auto-orbit.</p>
        </div>
        <div className="np-mini-card border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
          <p className="font-semibold text-indigo-300">Adaptive pacing</p>
          <p className="text-slate-400 mt-1">Difficulty changes gradually using accuracy, speed, and fatigue signals.</p>
        </div>
        <div className="np-mini-card border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
          <p className="font-semibold text-emerald-300">Patient Accessible</p>
          <p className="text-slate-400 mt-1">High-contrast tactile targets, audio cues, and fullscreen borderless view.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {GAME_IDS.map((id) => {
          const meta = GAME_META[id];
          const cfg = GAME_360_CONFIG[id];
          return (
            <button
              key={id}
              className="group relative flex flex-col text-left rounded-2xl overflow-hidden border border-white/10 bg-slate-900/80 hover:border-cyan-500/50 hover:shadow-[0_0_35px_rgba(0,212,255,0.25)] transition-all duration-300 transform hover:-translate-y-1.5 focus:outline-none"
              onClick={() => openGame(id)}
            >
              {/* Picture Banner with 360 badge */}
              <div className="relative w-full h-44 overflow-hidden bg-slate-950">
                <img
                  src={cfg?.bg}
                  alt={meta.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-85 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* 360 Degree Pill */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-white/15 text-[11px] font-mono font-bold text-cyan-300 backdrop-blur-md">
                  <Compass size={12} className="text-cyan-400" />
                  <span>360° 3D</span>
                </div>

                {/* Domain Pill */}
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-[10px] uppercase font-bold text-teal-400 backdrop-blur-sm">
                  {DOMAIN_LABEL[meta.domain]}
                </div>

                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                    <span>Level</span> <DifficultyDots level={difficultyByGame[id]} />
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-50 mb-1 group-hover:text-cyan-300 transition-colors font-orbitron">
                    {meta.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {meta.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                  <span className="font-mono">Launch Fullscreen 3D</span>
                  <span className="text-base transition-transform group-hover:translate-x-1">➔</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

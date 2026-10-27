import React, { useState, useEffect } from 'react';
import {
  Clock,
  Tv,
  Gamepad2,
  AlertTriangle,
  CheckCircle2,
  StopCircle,
  PlusCircle,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Session } from '../types/index';
import { fetchActiveSessions, stopSession, extendSession } from '../services/api';
import { Language, translations } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface SessionsOverviewProps {
  lang: Language;
  onSelectSession: (sessionId: string) => void;
  onGoToKiosk: () => void;
}

export const SessionsOverview: React.FC<SessionsOverviewProps> = ({
  lang,
  onSelectSession,
  onGoToKiosk,
}) => {
  const t = translations[lang];
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmingSessionId, setConfirmingSessionId] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetchActiveSessions();
      if (res.success) {
        setSessions(res.sessions);
      }
    } catch (e) {
      console.error('Error fetching sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  const executeStop = async (sessionId: string) => {
    soundManager.playClickSound();
    setIsStopping(true);
    try {
      await stopSession(sessionId, 'Operator Stop');
      soundManager.playTimeExpiredSound();
      setConfirmingSessionId(null);
      await loadSessions();
    } catch (e) {
      console.error('Failed to stop session:', e);
    } finally {
      setIsStopping(false);
    }
  };

  const handleExtend = async (sessionId: string, secs: number) => {
    soundManager.playClickSound();
    await extendSession(sessionId, secs, `Added ${Math.round(secs / 60)} mins`);
    await loadSessions();
  };

  const formatRemaining = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">{t.activeSessions}</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
              {sessions.length} Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'sw'
              ? 'Fuatilia muda halisi wa wachezaji wote kwenye consoles za PlayStation 4.'
              : 'Real-time countdown and access enforcement for all gaming sessions.'}
          </p>
        </div>

        <button
          onClick={() => {
            soundManager.playClickSound();
            onGoToKiosk();
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>{lang === 'sw' ? '+ Anzisha Mchezo Mpya' : '+ Start New Game'}</span>
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
            <Tv className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'sw' ? 'Hakuna Session Inayoendelea Sasa' : 'No Active Sessions Right Now'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {lang === 'sw'
                ? 'Consoles zote za PS4 zipo wazi (Available). Unaweza kuanzisha mchezo mpya kupitia ukurasa wa wateja.'
                : 'All PS4 consoles are free and standby. Start a new session from the games catalogue.'}
            </p>
          </div>
          <button
            onClick={onGoToKiosk}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
          >
            {lang === 'sw' ? 'Fungua Orodha ya Michezo' : 'Open Games Catalogue'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sessions.map((s) => {
            const isWarning = s.remainingSeconds <= 120 && s.remainingSeconds > 0;
            const progress = s.duration_purchased
              ? Math.min(100, Math.max(0, ((s.duration_purchased - s.remainingSeconds) / s.duration_purchased) * 100))
              : 50;

            return (
              <div
                key={s.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4 relative overflow-hidden"
              >
                {/* Top Station Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-600 text-white">
                      {s.stationCode || 'PS4'}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {s.consoleName}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isWarning
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    <span>{isWarning ? 'Mwisho Karibu' : 'Playing'}</span>
                  </span>
                </div>

                {/* Game Title */}
                <div>
                  <h3 className="text-xl font-black text-white">{s.gameName || 'PS4 Game'}</h3>
                  <p className="text-xs text-slate-400">
                    Session ID: <span className="font-mono text-slate-300">{s.id.slice(0, 10)}...</span>
                  </p>
                </div>

                {/* Countdown Display & Progress Bar */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                      {t.remainingTime}:
                    </span>
                    <span
                      className={`font-mono text-3xl font-black tracking-tight ${
                        isWarning ? 'text-amber-400 animate-pulse' : 'text-white'
                      }`}
                    >
                      {formatRemaining(s.remainingSeconds)}
                    </span>
                  </div>
                  {/* Progress track */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        isWarning ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Quick actions: Open, +5m, Stop */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => onSelectSession(s.id)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>{lang === 'sw' ? 'Fungua Screen' : 'Open Screen'}</span>
                  </button>

                  <button
                    onClick={() => handleExtend(s.id, 300)}
                    className="py-2 px-3 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+5m</span>
                  </button>

                  {confirmingSessionId === s.id ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in">
                      <button
                        disabled={isStopping}
                        onClick={() => executeStop(s.id)}
                        className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/30 transition-all flex items-center gap-1"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                        <span>{lang === 'sw' ? 'Thibitisha' : 'Confirm Stop'}</span>
                      </button>
                      <button
                        disabled={isStopping}
                        onClick={() => setConfirmingSessionId(null)}
                        className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        soundManager.playClickSound();
                        setConfirmingSessionId(s.id);
                      }}
                      className="py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                      <span>{t.emergencyStop}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

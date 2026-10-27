import React, { useState, useEffect } from 'react';
import {
  Clock,
  Tv,
  Gamepad2,
  AlertTriangle,
  CheckCircle2,
  StopCircle,
  PlusCircle,
  ShieldCheck,
  Volume2,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { Session } from '../types/index';
import { fetchSession, stopSession, extendSession } from '../services/api';
import { Language, translations } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { ExtendPaymentModal } from './ExtendPaymentModal';

interface ActiveSessionViewProps {
  sessionId: string;
  lang: Language;
  onClose: () => void;
  onSessionUpdated?: () => void;
}

export const ActiveSessionView: React.FC<ActiveSessionViewProps> = ({
  sessionId,
  lang,
  onClose,
  onSessionUpdated,
}) => {
  const t = translations[lang];

  const [sessionData, setSessionData] = useState<any>(null);
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [totalPurchasedSec, setTotalPurchasedSec] = useState<number>(300);
  const [hasWarned2Min, setHasWarned2Min] = useState(false);
  const [hasAlertedEnd, setHasAlertedEnd] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isConfirmingStop, setIsConfirmingStop] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    loadSession();
    // Poll server every 1 second for exact server time synchronization
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const res = await fetchSession(sessionId);
      if (res.success && res.session) {
        setSessionData(res);
        setRemainingSec(res.remainingSeconds);
        setTotalPurchasedSec(res.session.duration_purchased || 300);

        if (res.session.status === 'completed' && !hasAlertedEnd) {
          setHasAlertedEnd(true);
          soundManager.playTimeExpiredSound();
        }
      }
    } catch (e) {
      console.error('Error fetching session:', e);
    }
  };

  const tick = async () => {
    try {
      const res = await fetchSession(sessionId);
      if (res.success && res.session) {
        setSessionData(res);
        const rem = res.remainingSeconds;
        setRemainingSec(rem);
        setTotalPurchasedSec(res.session.duration_purchased || 300);

        // 2-minute audio warning
        if (rem <= 120 && rem > 0 && !hasWarned2Min) {
          setHasWarned2Min(true);
          soundManager.playWarningSound();
        }

        // Expiry audio buzzer
        if (rem === 0 && res.session.status === 'completed' && !hasAlertedEnd) {
          setHasAlertedEnd(true);
          soundManager.playTimeExpiredSound();
        }
      }
    } catch (e) {
      // ignore transient poll error
    }
  };

  const executeStop = async () => {
    soundManager.playClickSound();
    setIsStopping(true);
    try {
      await stopSession(sessionId, 'User / Operator initiated stop');
      setRemainingSec(0);
      setHasAlertedEnd(true);
      soundManager.playTimeExpiredSound();
      setIsConfirmingStop(false);
      await loadSession();
      if (onSessionUpdated) onSessionUpdated();
    } catch (e) {
      console.error('Error stopping session:', e);
    } finally {
      setIsStopping(false);
    }
  };

  const handleExtend = async (seconds: number) => {
    soundManager.playClickSound();
    setIsExtending(true);
    try {
      await extendSession(sessionId, seconds, `Added ${Math.round(seconds / 60)} minutes`);
      await loadSession();
      setHasWarned2Min(false);
      setHasAlertedEnd(false);
      if (onSessionUpdated) onSessionUpdated();
    } catch (e) {
      console.error('Error extending session:', e);
    } finally {
      setIsExtending(false);
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h.toString().padStart(2, '0')}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, ((totalPurchasedSec - remainingSec) / totalPurchasedSec) * 100)
  );

  const isCompleted = sessionData?.session?.status === 'completed' || remainingSec <= 0;
  const isWarning = remainingSec <= 120 && remainingSec > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner & Return */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            soundManager.playClickSound();
            onClose();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{lang === 'sw' ? 'Rudi Kwenye Orodha' : 'Back to Games'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono text-emerald-400 font-bold uppercase">
            Live Server Synchronized
          </span>
        </div>
      </div>

      {/* Main Countdown & Control Console Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-8">
        {/* Glow ambient */}
        <div
          className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            isCompleted
              ? 'bg-rose-600/10'
              : isWarning
              ? 'bg-amber-600/15'
              : 'bg-blue-600/10'
          }`}
        ></div>

        {/* Station and Game Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
              {sessionData?.details?.gameImage ? (
                <img
                  src={sessionData.details.gameImage}
                  alt="Game cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gamepad2 className="w-8 h-8 text-blue-400" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-blue-600 text-white">
                  {sessionData?.details?.stationCode || 'PS4'}
                </span>
                <span className="text-xs text-slate-400">
                  {sessionData?.details?.consoleName}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-0.5">
                {sessionData?.details?.gameName || 'PlayStation 4 Game'}
              </h2>
              <p className="text-xs text-slate-400">
                {sessionData?.details?.packageName} • Order Ref:{' '}
                <span className="font-mono text-blue-400 font-semibold">
                  {sessionData?.details?.orderRef}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300">
                  Locked Package: <strong>{sessionData?.session?.allowed_package_name || 'com.rockstargames.gtav'}</strong>
                </span>
                {sessionData?.session?.mismatch_violations ? (
                  <span className="text-[11px] font-bold text-amber-400">
                    ⚠️ {sessionData.session.mismatch_violations} Violations
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Access Control Status Pill */}
          <div className="flex flex-col sm:items-end">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                isCompleted
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>
                {isCompleted ? t.relayDisconnected : t.relayConnected}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Hardware Relay Adapter: Active
            </p>
          </div>
        </div>

        {/* Center Timer Display with Progress Ring */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* SVG Circular Progress */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                className="stroke-slate-800 fill-none"
                strokeWidth="10"
              />
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                className={`fill-none transition-all duration-1000 ${
                  isCompleted
                    ? 'stroke-rose-500'
                    : isWarning
                    ? 'stroke-amber-400'
                    : 'stroke-cyan-400'
                }`}
                strokeWidth="10"
                strokeDasharray="276"
                strokeDashoffset={276 - (276 * (100 - progressPercent)) / 100}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                {isCompleted ? t.sessionFinished : t.remainingTime}
              </span>
              <span
                className={`font-mono font-black tracking-tight ${
                  isCompleted
                    ? 'text-4xl sm:text-5xl text-rose-500'
                    : isWarning
                    ? 'text-5xl sm:text-6xl text-amber-400 animate-pulse'
                    : 'text-5xl sm:text-6xl text-white'
                }`}
              >
                {formatTime(remainingSec)}
              </span>

              <span
                className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${
                  isCompleted
                    ? 'bg-rose-500/20 text-rose-300'
                    : isWarning
                    ? 'bg-amber-500/20 text-amber-300 animate-bounce'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {isCompleted
                  ? lang === 'sw'
                    ? 'Muda Umekwisha / Screen Cut'
                    : 'Time Expired / Access Cut'
                  : isWarning
                  ? lang === 'sw'
                    ? '⚠️ Zimebaki Dakika 2!'
                    : '⚠️ 2 Minutes Remaining!'
                  : lang === 'sw'
                  ? 'Inacheza (Playing)'
                  : 'Session Active'}
              </span>
            </div>
          </div>

          {/* Warning Banner when time <= 2 mins */}
          {isWarning && (
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/80 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  {lang === 'sw'
                    ? '⚠️ Zimebaki chini ya dk 2! Lipia nyongeza sasa console isizimwe.'
                    : '⚠️ Under 2 mins remaining! Pay extension now to keep playing.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundManager.playClickSound();
                  setIsExtendModalOpen(true);
                }}
                className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{lang === 'sw' ? 'Lipia Nyongeza Sasa' : 'Pay Extension Now'}</span>
              </button>
            </div>
          )}

          {/* Time Expired Notice */}
          {isCompleted && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-500 text-rose-300 text-xs flex items-center gap-2">
              <StopCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                {lang === 'sw'
                  ? 'Session imekamilika. HDMI display imefungwa kiotomatiki kwa usahihi.'
                  : 'Session completed. Console access cut automatically by backend supervisor.'}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls: Extend Time & Emergency Stop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          {/* Quick Extensions with Payment Required */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.extendTime}:</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                {lang === 'sw' ? 'Inalipiwa' : 'Paid'}
              </span>
            </div>
            <div className="flex gap-2">
              {[
                { mins: 10, price: '1,000' },
                { mins: 20, price: '2,000' },
                { mins: 30, price: '3,000' },
              ].map((opt) => (
                <button
                  key={opt.mins}
                  disabled={isCompleted}
                  onClick={() => {
                    soundManager.playClickSound();
                    setIsExtendModalOpen(true);
                  }}
                  className="flex-1 py-2 px-1 rounded-xl bg-slate-900 hover:bg-indigo-950/60 border border-slate-700 hover:border-indigo-500 text-xs font-bold text-indigo-300 transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-40"
                >
                  <span className="flex items-center gap-0.5">
                    <PlusCircle className="w-3 h-3 text-indigo-400" />
                    +{opt.mins}m
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {opt.price}/=
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stop / Finish button */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-300">
                {lang === 'sw' ? 'Sitisha Mapema' : 'End Early'}
              </p>
              <p className="text-[11px] text-slate-500">
                {lang === 'sw' ? 'Funga display na toa station' : 'Revoke access and free station'}
              </p>
            </div>
            <button
              disabled={isCompleted || isStopping}
              onClick={() => {
                soundManager.playClickSound();
                setIsConfirmingStop(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <StopCircle className="w-4 h-4" />
              <span>{t.emergencyStop}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Stop Session */}
      {isConfirmingStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-950/60 rounded-2xl border border-rose-800 text-rose-400">
                <StopCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {lang === 'sw' ? 'Thibitisha Kusitisha Session' : 'Confirm Early Session Stop'}
                </h3>
                <p className="text-xs text-slate-400">
                  {sessionData?.details?.stationCode || 'Station'} • {sessionData?.details?.gameName || 'Game'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              {lang === 'sw'
                ? 'Je, una uhakika unataka kusimamisha session hii kabla ya muda kwisha? Display / HDMI / App itafungwa na kituo kitawekwa wazi kwa mchezaji mwingine.'
                : 'Are you sure you want to stop this gaming session early? Station display or app will be immediately locked and returned to standby.'}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isStopping}
                onClick={() => setIsConfirmingStop(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                {lang === 'sw' ? 'Ghairi (Endelea)' : 'Cancel (Keep Playing)'}
              </button>

              <button
                type="button"
                disabled={isStopping}
                onClick={executeStop}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <StopCircle className="w-4 h-4" />
                <span>
                  {isStopping
                    ? lang === 'sw' ? 'Inasitisha...' : 'Stopping...'
                    : lang === 'sw' ? 'Ndiyo, Sitisha Sasa' : 'Yes, Stop Now'}
                </span>
              </button>
            </div>
          </div>
      {/* Extend Time Payment Modal */}
      <ExtendPaymentModal
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        sessionId={sessionId}
        stationCode={sessionData?.details?.stationCode}
        gameName={sessionData?.details?.gameName}
        lang={lang}
        onExtended={async () => {
          await loadSession();
          setHasWarned2Min(false);
          setHasAlertedEnd(false);
          if (onSessionUpdated) onSessionUpdated();
        }}
      />
    </div>
  );
};

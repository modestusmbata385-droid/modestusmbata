import React, { useState, useEffect } from 'react';
import {
  Tv,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  AlertTriangle,
  Lock,
  Cpu,
  Power,
  Terminal,
  Smartphone,
  ExternalLink,
  Code,
  FileCode,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { ConsoleStation, Session } from '../types/index';
import {
  fetchConsoles,
  fetchActiveSessions,
  simulateAppSwitch,
  sendAndroidTvHeartbeat,
} from '../services/api';
import { Language, translations } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface AndroidTvSimulatorProps {
  lang: Language;
  onOpenDocs: () => void;
}

export const AndroidTvSimulator: React.FC<AndroidTvSimulatorProps> = ({ lang, onOpenDocs }) => {
  const t = translations[lang];

  const [consoles, setConsoles] = useState<ConsoleStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<ConsoleStation | null>(null);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [lastActionLog, setLastActionLog] = useState<{
    blocked: boolean;
    attempted: string;
    allowed: string | null;
    message: string;
    timestamp: string;
    strike: number;
    smartPlugTriggered?: boolean;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadStations();
    const interval = setInterval(loadStations, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadStations = async () => {
    try {
      const res = await fetchConsoles();
      if (res.success) {
        // Filter Android TV stations
        const atvList = res.consoles.filter(
          (c) => c.access_adapter === 'ANDROID_TV_KIOSK_MONITOR' || c.console_type.includes('Android') || c.console_type.includes('Shield')
        );
        setConsoles(atvList);
        if (!selectedStation && atvList.length > 0) {
          setSelectedStation(atvList[0]);
        } else if (selectedStation) {
          const fresh = atvList.find((c) => c.id === selectedStation.id);
          if (fresh) setSelectedStation(fresh);
        }
      }

      const sessionsRes = await fetchActiveSessions();
      if (sessionsRes.success) {
        if (selectedStation?.current_session_id) {
          const found = sessionsRes.sessions.find((s) => s.id === selectedStation.current_session_id);
          setActiveSession(found || null);
        } else {
          setActiveSession(null);
        }
      }
    } catch (e) {
      console.error('Error loading ATV data:', e);
    }
  };

  const handleSimulateAppSwitch = async (attemptedPackage: string) => {
    if (!selectedStation) return;
    soundManager.playClickSound();
    setIsSimulating(true);

    try {
      const res = await simulateAppSwitch(selectedStation.id, attemptedPackage);
      if (res.blocked) {
        soundManager.playTimeExpiredSound();
      } else {
        soundManager.playStartSound();
      }

      setLastActionLog({
        blocked: res.blocked,
        attempted: attemptedPackage,
        allowed: res.allowedPackage,
        message: res.actionTaken,
        timestamp: new Date().toLocaleTimeString(),
        strike: res.mismatchCount,
        smartPlugTriggered: res.smartPlugTriggered,
      });

      await loadStations();
    } catch (e: any) {
      console.error('App switch simulation error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  const isSessionActive = selectedStation?.status === 'occupied' && selectedStation.current_session_id;
  const allowedPkg = selectedStation?.allowed_package_name;
  const currentApp = selectedStation?.current_foreground_app || 'com.playstation.kiosk';
  const smartPlugOn = selectedStation?.smart_plug_state !== 'OFF';

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Android TV Kiosk + Game-Specific Monitoring Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {lang === 'sw' ? 'Android TV Game-Specific Control' : 'Android TV Game-Lock & Kiosk Control'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {lang === 'sw'
                ? 'Mteja anapochagua game (mfano GTA), Android TV inaruhusu package hiyo tu. Akijaribu kufungua game au app nyingine, UsageStatsManager inaitambua mara moja na kuilazimisha kufungwa (Force-stop / return to Kiosk).'
                : 'Zero-breach enforcement: Station only permits the purchased Android package ID. Any attempt to launch an unapproved app is instantly detected and killed by the Kiosk service.'}
            </p>
          </div>

          <button
            onClick={() => {
              soundManager.playClickSound();
              onOpenDocs();
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <FileCode className="w-4 h-4 text-cyan-300" />
            <span>{lang === 'sw' ? 'Angalia Kotlin Code & Setup' : 'Android App Source & Setup'}</span>
          </button>
        </div>
      </div>

      {/* Station Selector Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {lang === 'sw' ? 'Chagua Kituo cha Android TV:' : 'Select Android TV Station:'}
        </span>
        {consoles.map((c) => {
          const isSelected = selectedStation?.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => {
                soundManager.playClickSound();
                setSelectedStation(c);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/60 text-white ring-2 ring-indigo-500/40 shadow-md'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-blue-400" />
              <span>{c.station_code} ({c.console_type})</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  c.status === 'occupied' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              ></span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Android TV Box Simulation Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Simulated Android TV Television Display (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 font-mono text-indigo-400 font-bold">
                  {selectedStation?.station_code || 'ATV'}
                </span>
                <span className="text-slate-300 font-bold">{selectedStation?.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-slate-500">Smart Plug:</span>
                <span className={`font-bold ${smartPlugOn ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
                  {smartPlugOn ? 'ON (Power Active)' : 'OFF (CUT)'}
                </span>
              </div>
            </div>

            {/* Simulated Television Screen Bezel */}
            <div className="relative rounded-2xl bg-black p-3.5 border-4 border-slate-800 shadow-inner overflow-hidden">
              {/* Screen Top Status Bar */}
              <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-slate-400 border-b border-slate-900 mb-2 font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>KIOSK LAUNCHER • DEVICE OWNER ACTIVE</span>
                </span>
                <span className="text-slate-400">1080p 60Hz</span>
              </div>

              {/* TV Screen Content */}
              <div
                className={`aspect-video rounded-xl overflow-hidden relative flex flex-col items-center justify-center p-6 text-center transition-all duration-300 ${
                  !smartPlugOn
                    ? 'bg-black text-rose-500'
                    : isSessionActive
                    ? 'bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-white'
                    : 'bg-gradient-to-b from-slate-950 to-slate-900 text-slate-400'
                }`}
              >
                {!smartPlugOn ? (
                  /* Power Cut State */
                  <div className="space-y-3">
                    <Power className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
                    <h3 className="text-lg font-black text-white">POWER CUT (SMART PLUG OFF)</h3>
                    <p className="text-xs text-rose-400 max-w-sm">
                      Kituo kimezima umeme baada ya maonyo ya ukiukwaji wa mchezo (3 strikes). Operator anahitajika kuweka upya.
                    </p>
                  </div>
                ) : isSessionActive ? (
                  /* Active Session Running Game */
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black">
                      <Zap className="w-4 h-4 text-yellow-300" />
                      <span>GAME AUTHORIZED & RUNNING</span>
                    </div>

                    <div>
                      <h2 className="text-2xl font-black text-white tracking-wide">
                        {activeSession?.gameName || 'Approved Game Session'}
                      </h2>
                      <p className="text-xs text-indigo-300 font-mono mt-1">
                        Package: <span className="text-white font-bold">{allowedPkg}</span>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 inline-block">
                      <span>Current Foreground: </span>
                      <span className="text-emerald-400 font-bold">{currentApp}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Game Monitor service inaendelea kukagua Foreground Package kila 1s.
                    </p>
                  </div>
                ) : (
                  /* Idle / Standby Kiosk Launcher Screen */
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-700 mx-auto flex items-center justify-center text-indigo-400 shadow-lg">
                      <Tv className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-white">
                      {lang === 'sw' ? 'Station Ipo Wazi (Kiosk Standby)' : 'Station Idle (Kiosk Standby)'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      {lang === 'sw'
                        ? 'Tafadhali chagua mchezo na ufanye malipo kwenye Kiosk. Game ikilipiwa itafunguka moja kwa moja hapa.'
                        : 'Custom launcher is locked to home screen. Pay at Kiosk to start session and launch authorized game.'}
                    </p>
                  </div>
                )}

                {/* Warning Flash Overlay if violation just occurred */}
                {lastActionLog && lastActionLog.blocked && (
                  <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95">
                    <ShieldAlert className="w-14 h-14 text-rose-500 mb-2 animate-bounce" />
                    <h4 className="text-lg font-black text-white">
                      ⚠️ ACCESS VIOLATION DETECTED!
                    </h4>
                    <p className="text-xs text-rose-300 font-mono mt-1">
                      Attempted App: <span className="text-white font-bold">{lastActionLog.attempted}</span>
                    </p>
                    <p className="text-xs text-amber-300 font-mono mt-0.5">
                      Only Allowed: <span className="text-white font-bold">{lastActionLog.allowed || 'None'}</span>
                    </p>
                    <div className="mt-3 px-3 py-1.5 rounded-lg bg-rose-900/60 border border-rose-700 text-xs font-bold text-white">
                      {lastActionLog.message}
                    </div>
                    <button
                      onClick={() => setLastActionLog(null)}
                      className="mt-4 px-4 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-800"
                    >
                      Dismiss Alert
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Status pills row */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Kiosk Monitor</span>
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Active (1000ms)</span>
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Device Owner</span>
                <span className="text-indigo-400 font-mono font-bold">LOCKED_TASK</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Strikes / Mismatches</span>
                <span
                  className={`font-mono font-bold ${
                    (selectedStation?.mismatch_count || 0) > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {selectedStation?.mismatch_count || 0} / 3 Strikes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive App Switch Attack & Compliance Test Suite (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                Interactive Test Suite
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">
                {lang === 'sw' ? 'Jaribu Udhibiti wa Game (Simulation)' : 'Test App-Switching & Enforcement'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'sw'
                  ? 'Bofya vitufe hapa chini kuiga mchezaji akijaribu kufungua game halali au game isiyoruhusiwa kwenye Android TV Box:'
                  : 'Simulate gamer interactions on the Android TV remote to test real-time Kiosk interception:'}
              </p>
            </div>

            {/* Test Action Buttons */}
            <div className="space-y-2.5">
              {/* Button 1: Allowed Game */}
              <button
                disabled={isSimulating || !isSessionActive}
                onClick={() => handleSimulateAppSwitch(allowedPkg || 'com.rockstargames.gtav')}
                className="w-full p-3 rounded-xl border border-emerald-500/50 bg-emerald-950/30 hover:bg-emerald-900/40 text-left transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Fungua Game Iliyoruhusiwa (Authorized)</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {allowedPkg || 'com.rockstargames.gtav'}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300">
                  ALLOW
                </span>
              </button>

              {/* Button 2: Attempt EA SPORTS FC / FIFA */}
              <button
                disabled={isSimulating}
                onClick={() => handleSimulateAppSwitch('com.ea.gp.fifamobile')}
                className="w-full p-3 rounded-xl border border-rose-500/40 bg-rose-950/20 hover:bg-rose-900/40 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Jaribu Kufungua Game Tofauti (FIFA/FC 25)</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    com.ea.gp.fifamobile
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-900/80 text-rose-300">
                  BLOCK
                </span>
              </button>

              {/* Button 3: Attempt YouTube */}
              <button
                disabled={isSimulating}
                onClick={() => handleSimulateAppSwitch('com.google.android.youtube.tv')}
                className="w-full p-3 rounded-xl border border-rose-500/40 bg-rose-950/20 hover:bg-rose-900/40 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Jaribu Kufungua YouTube / Browser</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    com.google.android.youtube.tv
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-900/80 text-rose-300">
                  BLOCK
                </span>
              </button>

              {/* Button 4: Attempt System Settings */}
              <button
                disabled={isSimulating}
                onClick={() => handleSimulateAppSwitch('com.android.settings')}
                className="w-full p-3 rounded-xl border border-rose-500/40 bg-rose-950/20 hover:bg-rose-900/40 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Jaribu Kufungua Android Settings</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    com.android.settings
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-900/80 text-rose-300">
                  BLOCK
                </span>
              </button>
            </div>

            {/* Smart Plug Power Reset (if cut) */}
            {!smartPlugOn && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 space-y-2">
                <p className="text-xs text-amber-300 font-bold">
                  {lang === 'sw' ? 'Smart Plug Imekatwa (3 Violations)' : 'Smart Plug Tripped (3 Violations)'}
                </p>
                <button
                  onClick={async () => {
                    soundManager.playClickSound();
                    await sendAndroidTvHeartbeat({
                      stationCode: selectedStation?.station_code || 'ATV-01',
                      smartPlugStatus: 'ON',
                    });
                    await loadStations();
                  }}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                >
                  Washa Tena Smart Plug (Operator Override)
                </button>
              </div>
            )}

            {/* Architecture Explanation Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
              <span className="font-bold text-slate-200 block uppercase text-[10px] tracking-wider">
                {lang === 'sw' ? 'Jinsi Mfumo Unavyofanya Kazi:' : 'How the Engine Works:'}
              </span>
              <ul className="space-y-1.5 text-[11px] list-disc list-inside">
                <li>
                  <strong className="text-slate-300">Backend API:</strong> Inatuma amri yenye <code>allowed_package</code> baada ya malipo.
                </li>
                <li>
                  <strong className="text-slate-300">Android Foreground Service:</strong> Inatumia <code>UsageStatsManager</code> kuangalia app iliyo mbele kila sekunde.
                </li>
                <li>
                  <strong className="text-slate-300">Zero-Escape Kiosk:</strong> App tofauti ikigunduliwa, inalazimishwa kufungwa papo hapo na kurudi kwenye launcher.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

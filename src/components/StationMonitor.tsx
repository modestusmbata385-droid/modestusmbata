import React, { useState, useEffect } from 'react';
import {
  Tv,
  Cpu,
  Power,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Wifi,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { ConsoleStation, AccessEvent } from '../types/index';
import {
  fetchConsoles,
  fetchAccessEvents,
  executeHardwareAction,
} from '../services/api';
import { Language, translations } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface StationMonitorProps {
  lang: Language;
}

export const StationMonitor: React.FC<StationMonitorProps> = ({ lang }) => {
  const t = translations[lang];

  const [consoles, setConsoles] = useState<ConsoleStation[]>([]);
  const [events, setEvents] = useState<AccessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [consolesRes, eventsRes] = await Promise.all([
        fetchConsoles(),
        fetchAccessEvents(),
      ]);
      if (consolesRes.success) setConsoles(consolesRes.consoles);
      if (eventsRes.success) setEvents(eventsRes.events.slice(0, 15));
    } catch (e) {
      console.error('Error fetching hardware data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleHardwareCommand = async (
    consoleId: string,
    action: 'CONNECT_RELAY' | 'DISCONNECT_RELAY' | 'PING' | 'REBOOT_STATION'
  ) => {
    soundManager.playClickSound();
    setExecutingId(consoleId);
    setActionFeedback(null);
    try {
      const res = await executeHardwareAction(consoleId, action);
      if (res.success) {
        setActionFeedback(`[${res.result.stationCode}] ${res.result.message}`);
        await loadData();
      }
    } catch (e: any) {
      setActionFeedback(`Error: ${e.message}`);
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{t.stations}</h1>
              <p className="text-xs text-slate-400">
                {lang === 'sw'
                  ? 'Usimamizi wa kiufundi wa consoles, HDMI relays na vituo vya kuchezea PS4.'
                  : 'Hardware diagnostics and access enforcement adapters for PS4 stations.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Relay Daemon: ONLINE</span>
          </div>
          <button
            onClick={() => {
              soundManager.playClickSound();
              loadData();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-600 text-blue-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-mono">{actionFeedback}</span>
        </div>
      )}

      {/* PS4 Stations Grid with Interactive TV screen simulation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {consoles.map((c) => {
          const isConnected = c.relay_state === 'CONNECTED';
          const isOccupied = c.status === 'occupied';

          return (
            <div
              key={c.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4"
            >
              {/* Station title & IP */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center font-black text-blue-400 text-xs">
                    {c.station_code}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{c.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      IP: {c.ip_address} • {c.console_type}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isOccupied
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isOccupied ? t.occupied : t.available}
                </span>
              </div>

              {/* Simulated TV Screen on Station */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 overflow-hidden shadow-inner">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-500 border-b border-slate-800/80 mb-2">
                  <span className="flex items-center gap-1">
                    <Tv className="w-3 h-3 text-slate-400" />
                    <span>TV Display Feed ({c.station_code})</span>
                  </span>
                  <span className="font-mono">
                    {isConnected ? '1080p 60Hz HDR • 135W' : 'STANDBY • 0.8W'}
                  </span>
                </div>

                {/* Simulated Screen Content */}
                <div
                  className={`aspect-video rounded-lg flex flex-col items-center justify-center p-4 transition-all duration-300 ${
                    isConnected
                      ? 'bg-gradient-to-tr from-blue-950 via-indigo-900 to-slate-900 text-white'
                      : 'bg-black text-slate-500'
                  }`}
                >
                  {isConnected ? (
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase">
                        <Zap className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                        <span>HDMI SIGNAL ACTIVE</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">
                        PlayStation 4 Video Output Active
                      </p>
                      <p className="text-[11px] text-blue-300 font-mono">
                        Session: {c.current_session_id?.slice(0, 12) || 'IN_PROGRESS'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-1.5 opacity-80">
                      <ShieldAlert className="w-8 h-8 mx-auto text-slate-600" />
                      <p className="text-xs font-mono tracking-widest text-slate-400">
                        HDMI DISPLAY CUT (OFF)
                      </p>
                      <p className="text-[10px] text-slate-600">
                        Lipa kwa M-Pesa au Vocha kuwasha console
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hardware Adapter Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Control Adapter
                  </span>
                  <span className="font-mono text-slate-300 font-bold truncate block">
                    {c.access_adapter}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Relay Switch Status
                  </span>
                  <span
                    className={`font-bold text-xs ${
                      isConnected ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {isConnected ? '✓ CLOSED (ON)' : '✕ OPEN (OFF)'}
                  </span>
                </div>
              </div>

              {/* Hardware Actions */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                <button
                  disabled={executingId === c.id}
                  onClick={() =>
                    handleHardwareCommand(
                      c.id,
                      isConnected ? 'DISCONNECT_RELAY' : 'CONNECT_RELAY'
                    )
                  }
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isConnected
                      ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300'
                      : 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isConnected ? t.cutHdmi : t.restoreHdmi}</span>
                </button>

                <button
                  disabled={executingId === c.id}
                  onClick={() => handleHardwareCommand(c.id, 'PING')}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Wifi className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t.pingConsole}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Access Control Event Log Feed */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">
              {lang === 'sw'
                ? 'Matukio ya Access Control & Hardware (Audit Feed)'
                : 'Hardware Access Events & Audit Feed'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {events.length} logged events
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs max-h-72 overflow-y-auto pr-1">
          {events.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No access events recorded yet.</p>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        ev.result === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {ev.event_type}
                    </span>
                    <span className="text-slate-400 text-[11px]">{ev.details}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                  {new Date(ev.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

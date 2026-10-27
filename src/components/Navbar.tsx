import React from 'react';
import {
  Gamepad2,
  Clock,
  Cpu,
  BarChart3,
  Globe,
  Volume2,
  VolumeX,
  UserCheck,
  LogIn,
  LogOut,
  Radio,
} from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface NavbarProps {
  currentView: 'kiosk' | 'sessions' | 'stations' | 'androidTv' | 'admin';
  setCurrentView: (view: 'kiosk' | 'sessions' | 'stations' | 'androidTv' | 'admin') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  currentUser: { username: string; role: string; name: string } | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  activeSessionsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  lang,
  setLang,
  currentUser,
  onOpenLogin,
  onLogout,
  activeSessionsCount,
}) => {
  const t = translations[lang];
  const [isMuted, setIsMuted] = React.useState(soundManager.getMuted());

  const toggleSound = () => {
    const nextState = !isMuted;
    soundManager.setMuted(nextState);
    setIsMuted(nextState);
    if (!nextState) {
      soundManager.playClickSound();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => {
              soundManager.playClickSound();
              setCurrentView('kiosk');
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-blue-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-200">
                  PLAYSTATION
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-blue-950/80 text-blue-400 border border-blue-800/80 rounded">
                  PS4 LOUNGE
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Gaming Management System</span>
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                soundManager.playClickSound();
                setCurrentView('kiosk');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'kiosk'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>{t.kiosk}</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClickSound();
                setCurrentView('sessions');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all relative ${
                currentView === 'sessions'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{t.activeSessions}</span>
              {activeSessionsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs font-bold bg-amber-500 text-slate-950 rounded-full animate-bounce">
                  {activeSessionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                soundManager.playClickSound();
                setCurrentView('stations');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'stations'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>{t.stations}</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClickSound();
                setCurrentView('androidTv');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'androidTv'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>{t.androidTv}</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClickSound();
                if (currentUser) {
                  setCurrentView('admin');
                } else {
                  onOpenLogin();
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t.admin}</span>
            </button>
          </nav>

          {/* Right controls: Language, Sound, Auth */}
          <div className="flex items-center space-x-2.5">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Language Toggle (Swahili / English) */}
            <button
              onClick={() => {
                soundManager.playClickSound();
                setLang(lang === 'sw' ? 'en' : 'sw');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === 'sw' ? '🇹🇿 SWA' : '🇬🇧 ENG'}</span>
            </button>

            {/* User Profile / Login */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-slate-200">{currentUser.name}</p>
                  <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">{currentUser.role}</p>
                </div>
                <button
                  onClick={() => {
                    soundManager.playClickSound();
                    onLogout();
                  }}
                  title="Logout"
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-950/40 hover:border-rose-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  soundManager.playClickSound();
                  onOpenLogin();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.login}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden py-2.5 border-t border-slate-800/80 gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setCurrentView('kiosk')}
            className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap ${
              currentView === 'kiosk' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {t.kiosk}
          </button>
          <button
            onClick={() => setCurrentView('sessions')}
            className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap flex items-center gap-1 ${
              currentView === 'sessions' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {t.activeSessions}
            {activeSessionsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>
          <button
            onClick={() => setCurrentView('stations')}
            className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap ${
              currentView === 'stations' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {t.stations}
          </button>
          <button
            onClick={() => setCurrentView('androidTv')}
            className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap ${
              currentView === 'androidTv' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {t.androidTv}
          </button>
          <button
            onClick={() => {
              if (currentUser) {
                setCurrentView('admin');
              } else {
                onOpenLogin();
              }
            }}
            className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap ${
              currentView === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {t.admin}
          </button>
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Clock,
  Sparkles,
  Tv,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Game, Package, ConsoleStation, Session } from '../types/index';
import { fetchGames, fetchGameDetails, fetchConsoles } from '../services/api';
import { Language, translations } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { PaymentModal } from './PaymentModal';

interface CustomerKioskProps {
  lang: Language;
  onSessionStarted: (sessionId: string) => void;
}

export const CustomerKiosk: React.FC<CustomerKioskProps> = ({ lang, onSessionStarted }) => {
  const t = translations[lang];

  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [consoles, setConsoles] = useState<ConsoleStation[]>([]);
  const [selectedConsole, setSelectedConsole] = useState<ConsoleStation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'voucher'>('mobile_money');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load games and consoles
  useEffect(() => {
    loadInitialData();
    const interval = setInterval(refreshConsoles, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [gamesRes, consolesRes] = await Promise.all([fetchGames(), fetchConsoles()]);
      if (gamesRes.success && gamesRes.games.length > 0) {
        setGames(gamesRes.games);
        // Default select first game
        selectGameItem(gamesRes.games[0]);
      }
      if (consolesRes.success) {
        setConsoles(consolesRes.consoles);
        // Default select first available console
        const firstAvailable = consolesRes.consoles.find((c) => c.status === 'available');
        if (firstAvailable) setSelectedConsole(firstAvailable);
      }
    } catch (e) {
      console.error('Error loading kiosk data:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshConsoles = async () => {
    try {
      const consolesRes = await fetchConsoles();
      if (consolesRes.success) {
        setConsoles(consolesRes.consoles);
        // If current selected console became occupied, pick another
        setSelectedConsole((prev) => {
          if (!prev) return consolesRes.consoles.find((c) => c.status === 'available') || null;
          const updated = consolesRes.consoles.find((c) => c.id === prev.id);
          return updated || prev;
        });
      }
    } catch (e) {
      // silent background refresh
    }
  };

  const selectGameItem = async (game: Game) => {
    soundManager.playClickSound();
    setSelectedGame(game);
    try {
      const details = await fetchGameDetails(game.id);
      if (details.success) {
        setPackages(details.packages);
        if (details.packages.length > 0) {
          setSelectedPackage(details.packages[0]);
        } else {
          setSelectedPackage(null);
        }
      }
    } catch (e) {
      console.error('Error fetching game packages:', e);
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedGame || !selectedPackage || !selectedConsole) {
      return;
    }
    soundManager.playClickSound();
    setIsPaymentModalOpen(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    return `${mins} ${t.minutes}`;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-blue-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>PS4 Gaming Lounge & Kiosk Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {lang === 'sw' ? 'Karibu PlayStation Lounge' : 'Welcome to PlayStation Lounge'}
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
              {lang === 'sw'
                ? 'Chagua game unalotaka kucheza, chagua kifurushi cha muda, lipa kwa M-Pesa, Tigo Pesa, au Vocha ya PIN, na console itafunguka papo hapo.'
                : 'Select your game, pick your time package, pay instantly with Mobile Money or Voucher PIN, and your PS4 station unlocks automatically.'}
            </p>
          </div>

          {/* Quick Step Indicators */}
          <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px]">1</span>
              <span className="text-slate-300 font-medium">{lang === 'sw' ? 'Game' : 'Game'}</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px]">2</span>
              <span className="text-slate-300 font-medium">{lang === 'sw' ? 'Kifurushi' : 'Package'}</span>
            </div>
            <span className="text-slate-600">→</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px]">3</span>
              <span className="text-slate-300 font-medium">{lang === 'sw' ? 'Lipa & Cheza' : 'Unlock'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Game Selection & Checkout Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Game Catalogue & Package Selector (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Game Catalogue */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-500/30">
                  <Gamepad2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>1. {t.selectGame}</span>
                    <span className="text-xs font-normal text-slate-400">({games.length} available)</span>
                  </h2>
                  <p className="text-xs text-slate-400">{t.selectGameDesc}</p>
                </div>
              </div>
            </div>

            {/* Game Cards Carousel / Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {games.map((game) => {
                const isSelected = selectedGame?.id === game.id;
                return (
                  <div
                    key={game.id}
                    onClick={() => selectGameItem(game)}
                    className={`group relative overflow-hidden rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-950/30 shadow-lg shadow-blue-500/20'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {/* Game Cover Image */}
                    <div className="aspect-video w-full overflow-hidden bg-slate-800 relative">
                      <img
                        src={game.image_url}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur text-blue-300 border border-slate-700">
                        {game.genre}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 p-1 bg-blue-500 text-white rounded-full shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    {/* Title */}
                    <div className="p-3">
                      <h3 className="font-bold text-sm text-white truncate group-hover:text-blue-300 transition-colors">
                        {game.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {game.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Game-Specific Packages */}
          {selectedGame && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
                    <Clock className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>2. {t.selectPackage}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium">
                        {selectedGame.name}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      {lang === 'sw'
                        ? 'Bei na muda zilizopangwa na admin kwa mchezo huu:'
                        : 'Server-verified durations and rates for this game:'}
                    </p>
                  </div>
                </div>
              </div>

              {packages.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-sm">
                  {lang === 'sw' ? 'Hakuna vifurushi kwa sasa.' : 'No packages available for this game.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {packages.map((pkg) => {
                    const isSelected = selectedPackage?.id === pkg.id;
                    const mins = Math.round(pkg.duration_seconds / 60);
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => {
                          soundManager.playClickSound();
                          setSelectedPackage(pkg);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20'
                            : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">{pkg.name}</h4>
                            {mins >= 30 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                                BEST VALUE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{mins} {t.minutes} ({pkg.duration_seconds} {t.seconds})</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
                            {t.currency} {pkg.price_tzs.toLocaleString()}
                          </span>
                          <p className="text-[10px] text-slate-500">Tanzanian Shilling</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Console / Station Selection */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-600/20 rounded-xl border border-cyan-500/30">
                  <Tv className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">3. {t.selectStation}</h2>
                  <p className="text-xs text-slate-400">
                    {lang === 'sw'
                      ? 'Chagua PlayStation 4 station iliyo wazi:'
                      : 'Choose an active, free PlayStation 4 station:'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {consoles.map((c) => {
                const isSelected = selectedConsole?.id === c.id;
                const isOccupied = c.status === 'occupied';
                const isMaintenance = c.status === 'maintenance';

                return (
                  <button
                    key={c.id}
                    disabled={isOccupied || isMaintenance}
                    onClick={() => {
                      soundManager.playClickSound();
                      setSelectedConsole(c);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all relative ${
                      isOccupied
                        ? 'border-rose-900/60 bg-rose-950/20 opacity-70 cursor-not-allowed'
                        : isMaintenance
                        ? 'border-amber-900/60 bg-amber-950/20 opacity-70 cursor-not-allowed'
                        : isSelected
                        ? 'border-cyan-500 bg-cyan-950/40 ring-2 ring-cyan-500/50 shadow-md shadow-cyan-500/20'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-sm text-white tracking-wide">{c.station_code}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isOccupied
                            ? 'bg-rose-500 animate-pulse'
                            : isMaintenance
                            ? 'bg-amber-500'
                            : 'bg-emerald-500 shadow-sm shadow-emerald-500'
                        }`}
                      ></span>
                    </div>
                    <p className="text-xs font-semibold text-slate-300 truncate">{c.name}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {c.access_adapter === 'ANDROID_TV_KIOSK_MONITOR' ? '🤖 Android TV (Game-Locked)' : c.console_type}
                    </p>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-wider">
                      {isOccupied ? (
                        <span className="text-rose-400">{t.occupied}</span>
                      ) : isMaintenance ? (
                        <span className="text-amber-400">{t.maintenance}</span>
                      ) : (
                        <span className="text-emerald-400">✓ {t.available}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Order Checkout & Instant Payment Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400">
                  {lang === 'sw' ? 'Muhtasari wa Ununuzi' : 'Order Checkout'}
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {selectedGame ? selectedGame.name : 'Select Game'}
                </h3>
              </div>

              {/* Order breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">{t.duration}:</span>
                  <span className="font-bold text-white">
                    {selectedPackage ? formatDuration(selectedPackage.duration_seconds) : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Station / Console:</span>
                  <span className="font-bold text-cyan-300">
                    {selectedConsole ? selectedConsole.station_code : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">{lang === 'sw' ? 'Njia ya Uthibitisho' : 'Control Adapter'}:</span>
                  <span className="text-xs font-mono text-slate-400">
                    {selectedConsole?.access_adapter === 'ANDROID_TV_KIOSK_MONITOR' ? 'Android TV Kiosk' : selectedConsole?.access_adapter || 'HDMI Relay'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Locked Package:</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold truncate max-w-[170px]" title={selectedGame?.package_name}>
                    {selectedGame?.package_name || 'com.rockstargames.gtav'}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-baseline justify-between">
                  <span className="text-base font-bold text-slate-200">{lang === 'sw' ? 'Kiasi cha Kulipa' : 'Total Amount'}:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
                      {t.currency} {selectedPackage ? selectedPackage.price_tzs.toLocaleString() : '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  {t.paymentMethod}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      soundManager.playClickSound();
                      setPaymentMethod('mobile_money');
                    }}
                    className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === 'mobile_money'
                        ? 'border-blue-500 bg-blue-950/60 text-blue-300 shadow-md shadow-blue-500/20'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Mobile Money</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playClickSound();
                      setPaymentMethod('voucher');
                    }}
                    className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === 'voucher'
                        ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300 shadow-md shadow-indigo-500/20'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Ticket className="w-4 h-4 text-indigo-400" />
                    <span>Vocha (PIN)</span>
                  </button>
                </div>
              </div>

              {/* Security & Access enforcement badge */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  {lang === 'sw'
                    ? 'Mfumo unathibitisha malipo kwanza kabla ya kuwasha HDMI na kuanza timer ya PS4.'
                    : 'Zero-trust access: Station relay only activates once payment or PIN hash is confirmed on server.'}
                </p>
              </div>

              {/* Checkout CTA */}
              <button
                disabled={!selectedGame || !selectedPackage || !selectedConsole || selectedConsole.status !== 'available'}
                onClick={handleProceedToPayment}
                className="w-full py-4 rounded-xl font-black text-white text-base bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-xl shadow-blue-600/30 transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5 text-yellow-300" />
                <span>
                  {paymentMethod === 'mobile_money'
                    ? lang === 'sw'
                      ? 'Lipa kwa Simu & Cheza'
                      : 'Pay via Mobile Money'
                    : lang === 'sw'
                    ? 'Weka PIN ya Vocha'
                    : 'Redeem Voucher PIN'}
                </span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedGame && selectedPackage && selectedConsole && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          game={selectedGame}
          packageData={selectedPackage}
          consoleStation={selectedConsole}
          initialMethod={paymentMethod}
          lang={lang}
          onSessionCreated={(session) => {
            setIsPaymentModalOpen(false);
            onSessionStarted(session.id);
          }}
        />
      )}
    </div>
  );
};

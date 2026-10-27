import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Gamepad2,
  Ticket,
  CreditCard,
  History,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  Sparkles,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Tv,
  Printer,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  Game,
  Package,
  ConsoleStation,
  Voucher,
  Payment,
  Session,
  AuditLog,
  DashboardMetrics,
} from '../types/index';
import {
  fetchDashboardData,
  fetchGames,
  fetchGameDetails,
  createGame,
  updateGame,
  createPackage,
  updatePackage,
  fetchVouchers,
  generateVoucherBatch,
  fetchPayments,
  fetchSessionsList,
  fetchAuditLogs,
} from '../services/api';
import { Language, translations } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface AdminDashboardProps {
  lang: Language;
  currentUser: { username: string; role: string; name: string };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, currentUser }) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'vouchers' | 'payments' | 'sessions' | 'audit'>('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameGenre, setNewGameGenre] = useState('');
  const [newGamePackageName, setNewGamePackageName] = useState('');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [newGameImg, setNewGameImg] = useState('');

  const [addingPackageGameId, setAddingPackageGameId] = useState<string | null>(null);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgMinutes, setNewPkgMinutes] = useState(15);
  const [newPkgPrice, setNewPkgPrice] = useState(2500);

  // Voucher batch generator
  const [batchCount, setBatchCount] = useState(5);
  const [batchGameId, setBatchGameId] = useState<string>('all');
  const [batchDurationMins, setBatchDurationMins] = useState(15);
  const [batchValueTzs, setBatchValueTzs] = useState(2500);
  const [batchPrefix, setBatchPrefix] = useState('VCH');
  const [voucherSearch, setVoucherSearch] = useState('');
  const [voucherFilter, setVoucherFilter] = useState<'all' | 'unused' | 'redeemed'>('all');

  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, gamesRes, vouchersRes, paymentsRes, sessionsRes, logsRes] = await Promise.all([
        fetchDashboardData(),
        fetchGames(true),
        fetchVouchers(),
        fetchPayments(),
        fetchSessionsList(),
        fetchAuditLogs(),
      ]);

      if (dashRes.success) setMetrics(dashRes.metrics);
      if (gamesRes.success) setGames(gamesRes.games);
      if (vouchersRes.success) setVouchers(vouchersRes.vouchers);
      if (paymentsRes.success) setPayments(paymentsRes.payments);
      if (sessionsRes.success) setSessions(sessionsRes.sessions);
      if (logsRes.success) setAuditLogs(logsRes.logs);
    } catch (e) {
      console.error('Error loading admin dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;
    soundManager.playClickSound();

    await createGame({
      name: newGameName.trim(),
      genre: newGameGenre.trim() || 'Action',
      package_name: newGamePackageName.trim() || 'com.rockstargames.gtav',
      description: newGameDesc.trim() || 'PlayStation 4 Title',
      image_url: newGameImg.trim() || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    });

    setIsAddingGame(false);
    setNewGameName('');
    setNewGamePackageName('');
    setNewGameDesc('');
    setNewGameGenre('');
    setNewGameImg('');
    await loadDashboard();
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingPackageGameId || !newPkgName.trim()) return;
    soundManager.playClickSound();

    await createPackage(addingPackageGameId, {
      name: newPkgName.trim(),
      duration_seconds: newPkgMinutes * 60,
      price_tzs: Number(newPkgPrice),
    });

    setAddingPackageGameId(null);
    setNewPkgName('');
    await loadDashboard();
  };

  const handleGenerateVouchers = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClickSound();

    await generateVoucherBatch({
      count: batchCount,
      gameId: batchGameId === 'all' ? null : batchGameId,
      packageId: null,
      durationSeconds: batchDurationMins * 60,
      valueTzs: Number(batchValueTzs),
      prefix: batchPrefix.trim().toUpperCase() || 'VCH',
      expiryDays: 30,
    });

    await loadDashboard();
    setActiveTab('vouchers');
  };

  const copyToClipboard = (pin: string) => {
    soundManager.playClickSound();
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  // Filter vouchers
  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch = v.pin_display.toLowerCase().includes(voucherSearch.toLowerCase());
    const matchesStatus = voucherFilter === 'all' ? true : v.status === voucherFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">{t.admin}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800">
              {currentUser.role === 'admin' ? t.adminRole : t.operatorRole}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'sw'
              ? 'Ripoti za mapato, usimamizi wa vifurushi vya games, vocha na miamala.'
              : 'Revenue reports, game packaging, voucher issuance, and financial audit logs.'}
          </p>
        </div>

        <button
          onClick={() => {
            soundManager.playClickSound();
            loadDashboard();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t.totalRevenue}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
            {t.currency} {metrics ? metrics.totalRevenue.toLocaleString() : '0'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Simu & Vocha zilizolipwa</p>
        </div>

        {/* Today's Revenue */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t.todayRevenue}</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {t.currency} {metrics ? metrics.revenueToday.toLocaleString() : '0'}
          </p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1">Miamala ya leo</p>
        </div>

        {/* Sessions Count */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t.activeSessionsCount}</span>
            <Gamepad2 className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {metrics ? metrics.activeSessions : 0}
            <span className="text-sm font-normal text-slate-400 ml-2">
              / {metrics ? metrics.totalConsoles : 4} stations
            </span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics?.completedSessions || 0} {t.completedSessionsCount}
          </p>
        </div>

        {/* Vouchers Stats */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t.vouchersStats}</span>
            <Ticket className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-400">
            {metrics ? metrics.vouchersUnused : 0}
            <span className="text-xs font-normal text-slate-400 ml-2">Unused</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics?.vouchersRedeemed || 0} zimeshatumika
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-2 text-xs font-bold">
        {[
          { id: 'overview', label: t.reportsTab, icon: BarChart3 },
          { id: 'games', label: t.gamesTab, icon: Gamepad2 },
          { id: 'vouchers', label: t.vouchersTab, icon: Ticket },
          { id: 'payments', label: t.paymentsTab, icon: CreditCard },
          { id: 'sessions', label: 'Sessions Log', icon: History },
          { id: 'audit', label: t.auditTab, icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playClickSound();
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: OVERVIEW & REVENUE CHARTS --- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Game */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base flex items-center justify-between">
                <span>{lang === 'sw' ? 'Mapato kwa Kila Mchezo (By Game)' : 'Revenue by Game'}</span>
                <span className="text-xs text-slate-500 font-mono">TSh Breakdown</span>
              </h3>

              {metrics?.revenueByGame && metrics.revenueByGame.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {metrics.revenueByGame.map((g) => {
                    const percent = metrics.totalRevenue > 0 ? Math.round((g.amount / metrics.totalRevenue) * 100) : 0;
                    return (
                      <div key={g.gameName} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-white">{g.gameName}</span>
                          <span className="text-emerald-400 font-mono">
                            {t.currency} {g.amount.toLocaleString()} ({g.count} plays)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Hakuna michezo iliyochezwa bado. Kiosk itajaza hapa baada ya session kuanza.
                </p>
              )}
            </div>

            {/* Revenue by Payment Method */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base flex items-center justify-between">
                <span>{lang === 'sw' ? 'Mapato kwa Njia ya Malipo' : 'Revenue by Payment Method'}</span>
                <span className="text-xs text-slate-500 font-mono">Mobile vs Voucher</span>
              </h3>

              {metrics?.revenueByPaymentMethod && metrics.revenueByPaymentMethod.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {metrics.revenueByPaymentMethod.map((m) => {
                    const percent = metrics.totalRevenue > 0 ? Math.round((m.amount / metrics.totalRevenue) * 100) : 0;
                    return (
                      <div key={m.method} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-white uppercase font-mono">{m.method}</span>
                          <span className="text-cyan-400 font-mono">
                            {t.currency} {m.amount.toLocaleString()} ({m.count} txns)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Hakuna malipo bado.
                </p>
              )}
            </div>
          </div>

          {/* 7 Days Revenue Trend */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base">
              {lang === 'sw' ? 'Mwenendo wa Mapato ya Siku 7 Zilizopita' : '7-Day Revenue Trend'}
            </h3>
            <div className="grid grid-cols-7 gap-2 pt-4 items-end h-40">
              {metrics?.revenueByPeriod.map((p) => {
                const max = Math.max(...metrics.revenueByPeriod.map((x) => x.amount), 5000);
                const heightPct = Math.max(12, Math.round((p.amount / max) * 100));
                return (
                  <div key={p.date} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {p.amount > 0 ? `${Math.round(p.amount / 1000)}k` : '0'}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-blue-600 hover:bg-blue-500 transition-all"
                      style={{ height: `${heightPct}%` }}
                    ></div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: GAMES & GAME-SPECIFIC PACKAGES --- */}
      {activeTab === 'games' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">
              {lang === 'sw' ? 'Orodha ya Michezo na Vifurushi' : 'Games & Pricing Packages'}
            </h3>
            <button
              onClick={() => {
                soundManager.playClickSound();
                setIsAddingGame(!isAddingGame);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNewGame}</span>
            </button>
          </div>

          {/* Add Game Form */}
          {isAddingGame && (
            <form onSubmit={handleCreateGame} className="bg-slate-900 border border-blue-500/40 p-5 rounded-2xl space-y-4">
              <h4 className="font-bold text-sm text-blue-300">Ongeza Mchezo Mpya (Add New Game)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Jina la Game</label>
                  <input
                    type="text"
                    required
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    placeholder="e.g. Spider-Man 2"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Genre</label>
                  <input
                    type="text"
                    value={newGameGenre}
                    onChange={(e) => setNewGameGenre(e.target.value)}
                    placeholder="Action / Adventure"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">
                    Android Package Name (APK ID kwa ajili ya Kiosk Monitor):
                  </label>
                  <input
                    type="text"
                    value={newGamePackageName}
                    onChange={(e) => setNewGamePackageName(e.target.value)}
                    placeholder="mfano: com.rockstargames.gtav"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">Maelezo (Description)</label>
                  <input
                    type="text"
                    value={newGameDesc}
                    onChange={(e) => setNewGameDesc(e.target.value)}
                    placeholder="Maelezo mafupi ya mchezo..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">Picha URL (Image URL)</label>
                  <input
                    type="url"
                    value={newGameImg}
                    onChange={(e) => setNewGameImg(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddingGame(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  Hifadhi Game
                </button>
              </div>
            </form>
          )}

          {/* Add Package Modal inline */}
          {addingPackageGameId && (
            <form onSubmit={handleCreatePackage} className="bg-slate-900 border border-indigo-500/50 p-5 rounded-2xl space-y-4">
              <h4 className="font-bold text-sm text-indigo-300">
                {t.addNewPackage} kwa ajili ya: {games.find((g) => g.id === addingPackageGameId)?.name}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Jina la Kifurushi (e.g. 15 Mins Match)</label>
                  <input
                    type="text"
                    required
                    value={newPkgName}
                    onChange={(e) => setNewPkgName(e.target.value)}
                    placeholder="15 Mins Extra Match"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Muda (Dakika)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPkgMinutes}
                    onChange={(e) => setNewPkgMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Bei (TSh)</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={newPkgPrice}
                    onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setAddingPackageGameId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Hifadhi Package
                </button>
              </div>
            </form>
          )}

          {/* Games list with packages */}
          <div className="space-y-4">
            {games.map((game) => (
              <div key={game.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={game.image_url}
                      alt={game.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="font-bold text-white text-base">{game.name}</h4>
                      <p className="text-xs text-slate-400">
                        {game.genre} • ID: <span className="font-mono">{game.id}</span>
                      </p>
                      <p className="text-[11px] text-cyan-400 font-mono mt-0.5">
                        Android PKG: <span className="font-bold text-white">{game.package_name || 'com.rockstargames.gtav'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        soundManager.playClickSound();
                        setAddingPackageGameId(game.id);
                        setNewPkgName('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.addNewPackage}</span>
                    </button>
                  </div>
                </div>

                {/* Packages list for this game */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Vifurushi vya mchezo huu (Game Packages):
                  </span>
                  <PackagesList gameId={game.id} lang={lang} onRefresh={loadDashboard} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: VOUCHERS HUB --- */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          {/* Voucher Batch Generator Card */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">{t.generateBatch}</h3>
              </div>
              <span className="text-xs text-slate-400">Toleo la Vocha Zenye PIN</span>
            </div>

            <form onSubmit={handleGenerateVouchers} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Idadi (Count)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Mchezo (Game)</label>
                <select
                  value={batchGameId}
                  onChange={(e) => setBatchGameId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="all">Michezo Yote (Universal)</option>
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Muda (Dakika)</label>
                <input
                  type="number"
                  min="5"
                  value={batchDurationMins}
                  onChange={(e) => setBatchDurationMins(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Thamani (TSh)</label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={batchValueTzs}
                  onChange={(e) => setBatchValueTzs(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Prefix</label>
                <input
                  type="text"
                  value={batchPrefix}
                  onChange={(e) => setBatchPrefix(e.target.value)}
                  placeholder="VIP"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono uppercase"
                />
              </div>

              <div className="sm:col-span-5 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Tengeneza Vocha {batchCount} Sasa</span>
                </button>
              </div>
            </form>
          </div>

          {/* Vouchers Search & Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={voucherSearch}
                  onChange={(e) => setVoucherSearch(e.target.value)}
                  placeholder="Tafuta PIN (e.g. GTA-5MIN)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-white text-xs"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>

              <div className="flex gap-2">
                {(['all', 'unused', 'redeemed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setVoucherFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      voucherFilter === st
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5 px-3">PIN Code</th>
                    <th className="py-2.5 px-3">Mchezo (Game)</th>
                    <th className="py-2.5 px-3">Muda</th>
                    <th className="py-2.5 px-3">Bei (TSh)</th>
                    <th className="py-2.5 px-3">Hali (Status)</th>
                    <th className="py-2.5 px-3">Tarehe</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredVouchers.map((v) => {
                    const game = games.find((g) => g.id === v.game_id);
                    return (
                      <tr key={v.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                          <span>{v.pin_display}</span>
                          <button
                            onClick={() => copyToClipboard(v.pin_display)}
                            className="p-1 hover:text-blue-400 text-slate-500 transition-colors"
                            title="Copy PIN"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {copiedPin === v.pin_display && (
                            <span className="text-[10px] text-emerald-400 font-sans font-bold">Copied!</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-sans">
                          {game ? game.name : 'Universal (Any Game)'}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {v.duration_seconds ? `${Math.round(v.duration_seconds / 60)} min` : '—'}
                        </td>
                        <td className="py-3 px-3 text-emerald-400">
                          {v.value_tzs ? `TSh ${v.value_tzs.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              v.status === 'unused'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : v.status === 'redeemed'
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-rose-950 text-rose-400'
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {new Date(v.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          <button
                            onClick={() => copyToClipboard(v.pin_display)}
                            className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                          >
                            Copy PIN
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: PAYMENTS AUDIT --- */}
      {activeTab === 'payments' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base">
              {lang === 'sw' ? 'Miamala ya Malipo (Payments & Transactions)' : 'Payments Log'}
            </h3>
            <span className="text-xs text-slate-500 font-mono">{payments.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="py-2.5 px-3">Provider Ref</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Kiasi (TSh)</th>
                  <th className="py-2.5 px-3">Hali (Status)</th>
                  <th className="py-2.5 px-3">Idempotency Key</th>
                  <th className="py-2.5 px-3">Muda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-white">{p.provider_reference}</td>
                    <td className="py-3 px-3 uppercase text-blue-400 font-bold">{p.provider}</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      TSh {p.amount_tzs.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'paid'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 truncate max-w-[150px]">{p.idempotency_key}</td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 5: SESSIONS HISTORY --- */}
      {activeTab === 'sessions' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base">Sessions History & Logs</h3>
            <span className="text-xs text-slate-500 font-mono">{sessions.length} sessions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Mchezo</th>
                  <th className="py-2.5 px-3">Station</th>
                  <th className="py-2.5 px-3">Muda</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Kuanza</th>
                  <th className="py-2.5 px-3">Mwisho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sessions.map((s) => {
                  const game = games.find((g) => g.id === s.game_id);
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-white">{s.id.slice(0, 12)}</td>
                      <td className="py-3 px-3 text-slate-300 font-sans">{game ? game.name : s.game_id}</td>
                      <td className="py-3 px-3 text-blue-400 font-bold">{s.console_id}</td>
                      <td className="py-3 px-3 text-slate-300">
                        {Math.round(s.duration_purchased / 60)} mins
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.status === 'active'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {s.started_at ? new Date(s.started_at).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {s.ends_at ? new Date(s.ends_at).toLocaleTimeString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 6: AUDIT TRAIL --- */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base">Administrative Audit Trail</h3>
            <span className="text-xs text-slate-500 font-mono">{auditLogs.length} events</span>
          </div>

          <div className="space-y-2 font-mono text-xs max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {log.action}
                    </span>
                    <span className="text-slate-300">{log.entity_type}: {log.entity_id}</span>
                  </div>
                  <pre className="text-[11px] text-slate-400 overflow-x-auto">
                    {JSON.stringify(log.metadata)}
                  </pre>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for listing game packages
const PackagesList: React.FC<{ gameId: string; lang: Language; onRefresh: () => void }> = ({
  gameId,
  lang,
  onRefresh,
}) => {
  const [packages, setPackages] = useState<Package[]>([]);

  useEffect(() => {
    fetchGameDetails(gameId).then((res) => {
      if (res.success) setPackages(res.packages);
    });
  }, [gameId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
        >
          <div>
            <p className="font-bold text-white">{pkg.name}</p>
            <p className="text-[11px] text-slate-400">{Math.round(pkg.duration_seconds / 60)} dakika</p>
          </div>
          <span className="font-mono font-bold text-emerald-400">
            TSh {pkg.price_tzs.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

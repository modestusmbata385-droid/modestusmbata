import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CustomerKiosk } from './components/CustomerKiosk';
import { ActiveSessionView } from './components/ActiveSessionView';
import { SessionsOverview } from './components/SessionsOverview';
import { StationMonitor } from './components/StationMonitor';
import { AndroidTvSimulator } from './components/AndroidTvSimulator';
import { AndroidAppDocsModal } from './components/AndroidAppDocsModal';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginModal } from './components/LoginModal';
import { fetchActiveSessions } from './services/api';
import { Language } from './utils/translations';

export default function App() {
  const [currentView, setCurrentView] = useState<'kiosk' | 'sessions' | 'stations' | 'androidTv' | 'admin'>('kiosk');
  const [lang, setLang] = useState<Language>('sw');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string; name: string } | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  // Poll active sessions count for live navbar badge
  useEffect(() => {
    updateSessionsCount();
    const timer = setInterval(updateSessionsCount, 2500);
    return () => clearInterval(timer);
  }, []);

  const updateSessionsCount = async () => {
    try {
      const res = await fetchActiveSessions();
      if (res.success) {
        setActiveSessionsCount(res.sessions.length);
      }
    } catch (e) {
      // quiet poll
    }
  };

  const handleSessionStarted = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setCurrentView('sessions');
    updateSessionsCount();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          if (view !== 'sessions') {
            setActiveSessionId(null);
          }
          setCurrentView(view);
        }}
        lang={lang}
        setLang={setLang}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          if (currentView === 'admin') setCurrentView('kiosk');
        }}
        activeSessionsCount={activeSessionsCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* KIOSK VIEW */}
        {currentView === 'kiosk' && (
          <CustomerKiosk
            lang={lang}
            onSessionStarted={handleSessionStarted}
          />
        )}

        {/* SESSIONS VIEW */}
        {currentView === 'sessions' && (
          activeSessionId ? (
            <ActiveSessionView
              sessionId={activeSessionId}
              lang={lang}
              onClose={() => setActiveSessionId(null)}
              onSessionUpdated={updateSessionsCount}
            />
          ) : (
            <SessionsOverview
              lang={lang}
              onSelectSession={(id) => setActiveSessionId(id)}
              onGoToKiosk={() => setCurrentView('kiosk')}
            />
          )
        )}

        {/* STATIONS & ACCESS CONTROL HARDWARE MONITOR */}
        {currentView === 'stations' && (
          <StationMonitor lang={lang} />
        )}

        {/* ANDROID TV KIOSK & GAME-SPECIFIC MONITOR SIMULATOR */}
        {currentView === 'androidTv' && (
          <AndroidTvSimulator
            lang={lang}
            onOpenDocs={() => setIsDocsModalOpen(true)}
          />
        )}

        {/* ADMIN DASHBOARD */}
        {currentView === 'admin' && (
          currentUser ? (
            <AdminDashboard lang={lang} currentUser={currentUser} />
          ) : (
            <div className="text-center py-20 space-y-4">
              <p className="text-slate-400 text-sm">
                {lang === 'sw'
                  ? 'Tafadhali ingia kwa akaunti ya Admin au Operator ili kuona ripoti na usimamizi.'
                  : 'Please log in with an Administrator or Operator account to view this panel.'}
              </p>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs shadow-md transition-all"
              >
                {lang === 'sw' ? 'Ingia Sasa' : 'Login Now'}
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 PlayStation Gaming Management System • Tanzanian Shilling (TSh)</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Express API & Hardware Relay Daemon Active</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Staff Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentView('admin');
        }}
      />

      {/* Android TV Kotlin App Source & Setup Modal */}
      <AndroidAppDocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}

import {
  Game,
  Package,
  ConsoleStation,
  Order,
  Payment,
  Voucher,
  Session,
  AccessEvent,
  AuditLog,
  DashboardMetrics,
} from '../types/index';

const API_BASE = '/api/v1';

export async function fetchHealth() {
  const res = await fetch('/api/health');
  return res.json();
}

export async function fetchServerTime(): Promise<{ serverTime: string; timestamp: number }> {
  const res = await fetch(`${API_BASE}/time`);
  return res.json();
}

export async function fetchGames(includeInactive = false): Promise<{ success: boolean; games: Game[] }> {
  const res = await fetch(`${API_BASE}/games?includeInactive=${includeInactive}`);
  return res.json();
}

export async function fetchGameDetails(gameId: string): Promise<{ success: boolean; game: Game; packages: Package[] }> {
  const res = await fetch(`${API_BASE}/games/${gameId}`);
  return res.json();
}

export async function fetchConsoles(): Promise<{ success: boolean; consoles: ConsoleStation[] }> {
  const res = await fetch(`${API_BASE}/consoles`);
  return res.json();
}

export async function createOrder(data: {
  gameId: string;
  packageId: string;
  consoleId: string;
  paymentMethod: 'mobile_money' | 'voucher';
  customerPhone?: string;
}): Promise<{ success: boolean; order?: Order; error?: string }> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function initiateMobilePayment(data: {
  orderReference: string;
  phone: string;
  provider: string;
}): Promise<{
  success: boolean;
  message?: string;
  payment?: Payment;
  order?: Order;
  ussdPromptSimulated?: string;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/payments/mobile-money/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function confirmMobilePaymentSimulated(data: {
  paymentId: string;
  providerRef?: string;
}): Promise<{
  success: boolean;
  message?: string;
  payment?: Payment;
  order?: Order;
  session?: Session;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/payments/simulate-push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function redeemVoucher(data: {
  pin: string;
  gameId: string;
  packageId: string;
  consoleId: string;
  customerPhone?: string;
}): Promise<{
  success: boolean;
  message?: string;
  order?: Order;
  session?: Session;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/vouchers/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function validateVoucher(params: {
  pin: string;
  gameId?: string;
  packageId?: string;
}): Promise<{
  success: boolean;
  valid?: boolean;
  voucher?: any;
  error?: string;
}> {
  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${API_BASE}/vouchers/validate?${query}`);
  return res.json();
}

export async function fetchSession(sessionId: string): Promise<{
  success: boolean;
  session?: Session;
  remainingSeconds: number;
  serverTime: string;
  details?: {
    gameName?: string;
    gameImage?: string;
    packageName?: string;
    consoleName?: string;
    stationCode?: string;
    relayState?: string;
    orderRef?: string;
  };
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
  return res.json();
}

export async function fetchActiveSessions(): Promise<{
  success: boolean;
  sessions: (Session & { gameName?: string; stationCode?: string; remainingSeconds: number })[];
}> {
  const res = await fetch(`${API_BASE}/sessions/active`);
  return res.json();
}

export async function stopSession(sessionId: string, reason?: string) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

export async function payAndExtendSession(params: {
  sessionId: string;
  additionalSeconds: number;
  amountTzs: number;
  paymentMethod: 'mobile_money' | 'voucher' | 'cash';
  provider?: string;
  customerPhone?: string;
  voucherPin?: string;
  operatorPin?: string;
}): Promise<{
  success: boolean;
  message?: string;
  session?: Session;
  payment?: any;
  order?: any;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/sessions/${params.sessionId}/pay-extend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function extendSession(
  sessionId: string,
  additionalSeconds: number,
  reason?: string,
  operatorPin?: string
) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/extend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ additionalSeconds, reason, operatorPin }),
  });
  return res.json();
}

export async function loginAdmin(username: string, password: string) {
  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function fetchDashboardData(): Promise<{
  success: boolean;
  metrics: DashboardMetrics;
  consoles: ConsoleStation[];
  activeSessions: Session[];
  recentPayments: Payment[];
}> {
  const res = await fetch(`${API_BASE}/admin/dashboard`);
  return res.json();
}

export async function createGame(gameData: Partial<Game>) {
  const res = await fetch(`${API_BASE}/admin/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gameData),
  });
  return res.json();
}

export async function updateGame(gameId: string, updates: Partial<Game>) {
  const res = await fetch(`${API_BASE}/admin/games/${gameId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function createPackage(gameId: string, pkgData: Partial<Package>) {
  const res = await fetch(`${API_BASE}/admin/games/${gameId}/packages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pkgData),
  });
  return res.json();
}

export async function updatePackage(packageId: string, updates: Partial<Package>) {
  const res = await fetch(`${API_BASE}/admin/packages/${packageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function fetchVouchers(): Promise<{ success: boolean; vouchers: Voucher[] }> {
  const res = await fetch(`${API_BASE}/admin/vouchers`);
  return res.json();
}

export async function generateVoucherBatch(data: {
  count: number;
  gameId: string | null;
  packageId: string | null;
  valueTzs: number;
  durationSeconds: number;
  prefix?: string;
  expiryDays?: number;
}) {
  const res = await fetch(`${API_BASE}/admin/vouchers/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchPayments(): Promise<{ success: boolean; payments: Payment[] }> {
  const res = await fetch(`${API_BASE}/admin/payments`);
  return res.json();
}

export async function fetchSessionsList(): Promise<{ success: boolean; sessions: Session[] }> {
  const res = await fetch(`${API_BASE}/admin/sessions`);
  return res.json();
}

export async function fetchAuditLogs(): Promise<{ success: boolean; logs: AuditLog[] }> {
  const res = await fetch(`${API_BASE}/admin/audit-logs`);
  return res.json();
}

export async function fetchAccessEvents(consoleId?: string): Promise<{ success: boolean; events: AccessEvent[] }> {
  const url = consoleId ? `${API_BASE}/access-events?consoleId=${consoleId}` : `${API_BASE}/access-events`;
  const res = await fetch(url);
  return res.json();
}

export async function executeHardwareAction(consoleId: string, action: string) {
  const res = await fetch(`${API_BASE}/hardware/adapter/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consoleId, action }),
  });
  return res.json();
}

// --- Android TV Specific API Client ---
export async function sendAndroidTvHeartbeat(data: {
  stationCode: string;
  currentForegroundPackage?: string;
  ipAddress?: string;
  smartPlugStatus?: 'ON' | 'OFF';
}) {
  const res = await fetch(`${API_BASE}/android-tv/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchAndroidTvActiveSession(stationCode: string) {
  const res = await fetch(`${API_BASE}/android-tv/station/${stationCode}/active-session`);
  return res.json();
}

export async function reportAndroidTvViolation(data: {
  stationCode: string;
  attemptedPackage: string;
  reason?: string;
}) {
  const res = await fetch(`${API_BASE}/android-tv/violation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function simulateAppSwitch(consoleId: string, attemptedPackage: string) {
  const res = await fetch(`${API_BASE}/android-tv/simulate-app-switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consoleId, attemptedPackage }),
  });
  return res.json();
}

export async function completeAndroidTvSession(stationCode: string, sessionId: string) {
  const res = await fetch(`${API_BASE}/android-tv/session-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stationCode, sessionId }),
  });
  return res.json();
}


import express, { Request, Response } from 'express';
import { db } from './db';
import { AccessControlManager } from './accessControl';

const router = express.Router();

// --- 13.3 Health Endpoint ---
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'playstation-gaming-manager-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Server time for accurate sync
router.get('/v1/time', (_req: Request, res: Response) => {
  res.json({
    serverTime: new Date().toISOString(),
    timestamp: Date.now(),
  });
});

// --- 10.1 Public Games ---
router.get('/v1/games', (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const games = db.getGames(includeInactive);
  res.json({ success: true, count: games.length, games });
});

router.get('/v1/games/:gameId', (req: Request, res: Response) => {
  const game = db.getGameById(req.params.gameId);
  if (!game) {
    return res.status(404).json({ success: false, error: 'Mchezo haujapatikana (Game not found)' });
  }
  const packages = db.getPackages(game.id);
  res.json({ success: true, game, packages });
});

router.get('/v1/games/:gameId/packages', (req: Request, res: Response) => {
  const game = db.getGameById(req.params.gameId);
  if (!game) {
    return res.status(404).json({ success: false, error: 'Mchezo haujapatikana' });
  }
  const packages = db.getPackages(game.id);
  res.json({ success: true, gameId: game.id, packages });
});

// --- Consoles & Availability ---
router.get('/v1/consoles', (_req: Request, res: Response) => {
  const consoles = db.getConsoles();
  res.json({ success: true, count: consoles.length, consoles });
});

router.get('/v1/consoles/:consoleId/availability', (req: Request, res: Response) => {
  const consoleObj = db.getConsoleById(req.params.consoleId);
  if (!consoleObj) {
    return res.status(404).json({ success: false, error: 'Console haijapatikana' });
  }
  let currentSession = null;
  if (consoleObj.current_session_id) {
    currentSession = db.getSessionById(consoleObj.current_session_id);
  }
  res.json({
    success: true,
    console: consoleObj,
    isAvailable: consoleObj.status === 'available',
    currentSession,
  });
});

// --- 10.2 Orders ---
router.post('/v1/orders', (req: Request, res: Response) => {
  const { gameId, packageId, consoleId, paymentMethod, customerPhone } = req.body;

  if (!gameId || !packageId || !consoleId || !paymentMethod) {
    return res.status(400).json({
      success: false,
      error: 'Tafadhali jaza gameId, packageId, consoleId na paymentMethod kikamilifu.',
    });
  }

  const result = db.createOrder({
    gameId,
    packageId,
    consoleId,
    paymentMethod,
    customerPhone,
  });

  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully. Snapshot prices locked.',
    order: result.order,
  });
});

router.get('/v1/orders/:orderReference', (req: Request, res: Response) => {
  const order = db.getOrder(req.params.orderReference);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order haijapatikana.' });
  }

  const game = db.getGameById(order.game_id);
  const pkg = db.getPackageById(order.package_id);
  const consoleObj = db.getConsoleById(order.console_id);
  const payment = db.getPayments().find((p) => p.order_id === order.id);
  const session = db.getSessions().find((s) => s.order_id === order.id);

  res.json({
    success: true,
    order,
    details: {
      gameName: game?.name,
      packageName: pkg?.name,
      consoleName: consoleObj?.name,
      stationCode: consoleObj?.station_code,
    },
    payment,
    session,
  });
});

// --- 10.3 Payments: Mobile Money ---
router.post('/v1/payments/mobile-money/initiate', (req: Request, res: Response) => {
  const { orderReference, phone, provider, idempotencyKey } = req.body;

  const order = db.getOrder(orderReference);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order haijapatikana.' });
  }

  if (order.status === 'paid') {
    const existingSession = db.getSessions().find((s) => s.order_id === order.id);
    return res.json({
      success: true,
      message: 'Order hii tayari imeshalipiwa (Already paid).',
      order,
      session: existingSession,
    });
  }

  const mobileProvider = (provider || 'mpesa').toLowerCase();
  const payment = db.createPayment({
    orderId: order.id,
    provider: mobileProvider as any,
    amountTzs: order.price_tzs,
    idempotencyKey,
  });

  // Provide instructions for simulated or real mobile money USSD prompt
  const providerNames: Record<string, string> = {
    mpesa: 'M-Pesa (Vodacom)',
    tigopesa: 'Tigo Pesa (Mixx/Yas)',
    airtel: 'Airtel Money',
    halopesa: 'HaloPesa',
  };

  res.json({
    success: true,
    message: `Ombi la malipo ya TSh ${order.price_tzs.toLocaleString()} limetumwa kwa ${providerNames[mobileProvider] || mobileProvider} kwenda namba ${phone || 'simu yako'}.`,
    payment,
    order,
    ussdPromptSimulated: `Ombi la TSh ${order.price_tzs.toLocaleString()} kutoka PLAYSTATION GAMING STATION. Ingiza PIN yako ya ${providerNames[mobileProvider] || 'simu'} kuthibitisha.`,
  });
});

// Simulated provider webhook callback or user instant test trigger
router.post('/v1/payments/webhook/:provider', (req: Request, res: Response) => {
  const { provider } = req.params;
  const { paymentReference, status, transactionId } = req.body;

  if (!paymentReference) {
    return res.status(400).json({ success: false, error: 'paymentReference is required in webhook body.' });
  }

  if (status === 'FAILED' || status === 'CANCELLED') {
    return res.json({ success: false, message: 'Payment marked failed.' });
  }

  const result = db.markPaymentPaid(paymentReference, transactionId || `${provider.toUpperCase()}-TXN-${Date.now().toString().slice(-6)}`);
  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.json({
    success: true,
    message: `Payment confirmed via ${provider} webhook. Session activated!`,
    payment: result.payment,
    order: result.order,
    session: result.session,
  });
});

router.get('/v1/payments/:paymentReference/status', (req: Request, res: Response) => {
  const payments = db.getPayments();
  const payment = payments.find(
    (p) => p.provider_reference === req.params.paymentReference || p.id === req.params.paymentReference
  );

  if (!payment) {
    return res.status(404).json({ success: false, error: 'Payment record not found.' });
  }

  const order = db.getOrder(payment.order_id);
  const session = order ? db.getSessions().find((s) => s.order_id === order.id) : undefined;

  res.json({
    success: true,
    payment,
    order,
    session,
  });
});

// Quick simulate mobile payment completion for kiosk or test users
router.post('/v1/payments/simulate-push', (req: Request, res: Response) => {
  const { paymentId, providerRef } = req.body;
  const result = db.markPaymentPaid(paymentId, providerRef);
  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json({
    success: true,
    message: 'Mobile Money USSD PIN entered. Payment verified!',
    ...result,
  });
});

// --- 10.4 Vouchers ---
router.post('/v1/vouchers/redeem', (req: Request, res: Response) => {
  const { pin, gameId, packageId, consoleId, customerPhone } = req.body;

  if (!pin || !gameId || !packageId || !consoleId) {
    return res.status(400).json({
      success: false,
      error: 'Tafadhali ingiza PIN ya vocha, game, package na console.',
    });
  }

  const result = db.redeemVoucher({
    pin,
    gameId,
    packageId,
    consoleId,
    customerPhone,
  });

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.json({
    success: true,
    message: 'Vocha imehakikiwa na kukubaliwa! Session ya PlayStation imeanza.',
    order: result.order,
    session: result.session,
  });
});

router.get('/v1/vouchers/validate', (req: Request, res: Response) => {
  const pin = (req.query.pin as string)?.trim().toUpperCase();
  const gameId = req.query.gameId as string;
  const packageId = req.query.packageId as string;

  if (!pin) {
    return res.status(400).json({ success: false, error: 'PIN ya vocha inahitajika.' });
  }

  const vouchers = db.getVouchers();
  const found = vouchers.find(
    (v) => v.pin_display.toUpperCase() === pin
  );

  if (!found) {
    return res.status(404).json({ success: false, error: 'PIN ya vocha haipo.' });
  }

  if (found.status === 'redeemed') {
    return res.status(400).json({ success: false, error: 'Vocha hii imekwisha tumika tayari.' });
  }

  if (found.status === 'expired' || (found.expires_at && new Date(found.expires_at) < new Date())) {
    return res.status(400).json({ success: false, error: 'Muda wa matumizi ya vocha hii umekwisha.' });
  }

  if (found.status === 'disabled') {
    return res.status(400).json({ success: false, error: 'Vocha hii imezimwa.' });
  }

  if (gameId && found.game_id && found.game_id !== gameId) {
    const game = db.getGameById(found.game_id);
    return res.status(400).json({
      success: false,
      error: `Vocha hii inatumika kwa ajili ya mchezo wa "${game?.name || 'mwingine'}" tu.`,
    });
  }

  if (packageId && found.package_id && found.package_id !== packageId) {
    return res.status(400).json({
      success: false,
      error: `Vocha hii inatumika kwa package maalum tu.`,
    });
  }

  res.json({
    success: true,
    valid: true,
    voucher: {
      id: found.id,
      pinDisplay: found.pin_display,
      gameId: found.game_id,
      packageId: found.package_id,
      durationMinutes: found.duration_seconds ? Math.round(found.duration_seconds / 60) : null,
      valueTzs: found.value_tzs,
      expiresAt: found.expires_at,
    },
  });
});

// --- 10.5 Sessions ---
router.get('/v1/sessions/active', (_req: Request, res: Response) => {
  const activeSessions = db.getSessions().filter((s) => s.status === 'active');
  const enriched = activeSessions.map((s) => {
    const game = db.getGameById(s.game_id);
    const consoleObj = db.getConsoleById(s.console_id);
    const remainingMs = s.ends_at ? new Date(s.ends_at).getTime() - Date.now() : 0;
    return {
      ...s,
      gameName: game?.name,
      stationCode: consoleObj?.station_code,
      consoleName: consoleObj?.name,
      remainingSeconds: Math.max(0, Math.floor(remainingMs / 1000)),
    };
  });
  res.json({ success: true, count: enriched.length, sessions: enriched });
});

router.get('/v1/sessions/:sessionId', (req: Request, res: Response) => {
  const session = db.getSessionById(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session haijapatikana.' });
  }

  const game = db.getGameById(session.game_id);
  const pkg = db.getPackageById(session.package_id);
  const consoleObj = db.getConsoleById(session.console_id);
  const order = db.getOrder(session.order_id);

  // Calculate live server remaining seconds
  let remainingSeconds = 0;
  if (session.status === 'active' && session.ends_at) {
    const remainingMs = new Date(session.ends_at).getTime() - Date.now();
    remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  }

  res.json({
    success: true,
    session,
    remainingSeconds,
    serverTime: new Date().toISOString(),
    details: {
      gameName: game?.name,
      gameImage: game?.image_url,
      packageName: pkg?.name,
      consoleName: consoleObj?.name,
      stationCode: consoleObj?.station_code,
      relayState: consoleObj?.relay_state,
      orderRef: order?.order_reference,
    },
  });
});

router.post('/v1/sessions/:sessionId/stop', (req: Request, res: Response) => {
  const { reason } = req.body;
  const session = db.stopSession(req.params.sessionId, reason || 'Operator manual stop');
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session haijapatikana au tayari imeshafungwa.' });
  }
  res.json({ success: true, message: 'Session imesimamishwa. PS4 relay imekatwa.', session });
});

router.post('/v1/sessions/:sessionId/pay-extend', (req: Request, res: Response) => {
  const {
    additionalSeconds,
    amountTzs,
    paymentMethod,
    provider,
    customerPhone,
    voucherPin,
    operatorPin,
  } = req.body;

  const seconds = Number(additionalSeconds);
  if (!seconds || seconds <= 0) {
    return res.status(400).json({ success: false, error: 'Muda wa kuongeza unahitajika.' });
  }

  const result = db.payAndExtendSession({
    sessionId: req.params.sessionId,
    additionalSeconds: seconds,
    amountTzs: Number(amountTzs) || 1000,
    paymentMethod: paymentMethod || 'mobile_money',
    provider: provider || 'mpesa',
    customerPhone,
    voucherPin,
    operatorPin,
  });

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.json({
    success: true,
    message: `Malipo ya TSh ${(result.payment?.amount_tzs || amountTzs).toLocaleString()} yamethibitishwa! Muda umeongezwa kwa dakika ${Math.round(seconds / 60)}.`,
    session: result.session,
    payment: result.payment,
    order: result.order,
  });
});

router.post('/v1/sessions/:sessionId/extend', (req: Request, res: Response) => {
  const { additionalSeconds, reason, operatorPin, adminToken } = req.body;
  const seconds = Number(additionalSeconds);
  if (!seconds || seconds <= 0) {
    return res.status(400).json({ success: false, error: 'Muda halali wa kuongeza unahitajika.' });
  }

  // Enforce business rule: extensions require payment or operator authorization
  const isAuthorized = operatorPin === '1234' || operatorPin === 'admin' || operatorPin === 'operator' || adminToken;
  if (!isAuthorized) {
    return res.status(402).json({
      success: false,
      error: 'Kuongeza muda bila malipo hakuruhusiwi. Mteja lazima alipie (Mobile Money / Vocha) au mhudumu aweke PIN.',
      requiresPayment: true,
    });
  }

  const session = db.extendSession(req.params.sessionId, seconds, reason || 'Operator manual complimentary credit');
  if (!session) {
    return res.status(400).json({ success: false, error: 'Session haijapatikana au haipo active.' });
  }
  res.json({
    success: true,
    message: `Muda umeongezwa kwa dakika ${Math.round(seconds / 60)} kwa idhini ya mhudumu.`,
    session,
  });
});

// --- 10.6 Admin APIs ---
router.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  // Demo / standard administrator & operator credentials
  if (
    (username === 'admin' && (password === 'admin123' || password === 'admin' || password === 'ps4admin')) ||
    (username === 'operator' && (password === 'operator123' || password === 'operator'))
  ) {
    const role = username === 'admin' ? 'admin' : 'operator';
    db.recordAuditLog({
      userId: `u-${role}-1`,
      action: 'LOGIN_SUCCESS',
      entityType: 'AUTH',
      entityId: username,
      metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
    });
    return res.json({
      success: true,
      token: `token-ps4-${Date.now()}-${role}`,
      user: {
        id: `u-${role}-1`,
        name: role === 'admin' ? 'System Administrator' : 'Station Operator',
        username,
        role,
      },
    });
  }

  db.recordAuditLog({
    userId: 'anonymous',
    action: 'LOGIN_FAILED',
    entityType: 'AUTH',
    entityId: username || 'unknown',
    metadata: { ip: req.ip },
  });

  res.status(401).json({ success: false, error: 'Jina la mtumiaji au nenosiri si sahihi (Invalid credentials).' });
});

router.get('/v1/admin/dashboard', (_req: Request, res: Response) => {
  const metrics = db.getDashboardMetrics();
  const consoles = db.getConsoles();
  const activeSessions = db.getSessions().filter((s) => s.status === 'active');
  const recentPayments = db.getPayments().slice(-8).reverse();

  res.json({
    success: true,
    metrics,
    consoles,
    activeSessions,
    recentPayments,
  });
});

// Games Admin CRUD
router.post('/v1/admin/games', (req: Request, res: Response) => {
  const { name, slug, description, image_url, genre, package_name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Jina la game linahitajika.' });
  }
  const game = db.createGame({
    name,
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    description: description || '',
    image_url: image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    genre: genre || 'General',
    package_name: package_name || 'com.rockstargames.gtav',
    is_active: true,
  });

  db.recordAuditLog({
    userId: 'admin',
    action: 'CREATE_GAME',
    entityType: 'GAME',
    entityId: game.id,
    metadata: { name: game.name },
  });

  res.status(201).json({ success: true, game });
});

router.patch('/v1/admin/games/:gameId', (req: Request, res: Response) => {
  const updated = db.updateGame(req.params.gameId, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Game haijapatikana.' });
  }

  db.recordAuditLog({
    userId: 'admin',
    action: 'UPDATE_GAME',
    entityType: 'GAME',
    entityId: updated.id,
    metadata: req.body,
  });

  res.json({ success: true, game: updated });
});

// Packages Admin CRUD
router.post('/v1/admin/games/:gameId/packages', (req: Request, res: Response) => {
  const { name, duration_seconds, price_tzs } = req.body;
  if (!name || !duration_seconds || !price_tzs) {
    return res.status(400).json({ success: false, error: 'Package name, duration_seconds na price_tzs zinahitajika.' });
  }
  const pkg = db.createPackage({
    game_id: req.params.gameId,
    name,
    duration_seconds: Number(duration_seconds),
    price_tzs: Number(price_tzs),
    is_active: true,
  });

  db.recordAuditLog({
    userId: 'admin',
    action: 'CREATE_PACKAGE',
    entityType: 'PACKAGE',
    entityId: pkg.id,
    metadata: { name: pkg.name, price_tzs: pkg.price_tzs, duration: pkg.duration_seconds },
  });

  res.status(201).json({ success: true, package: pkg });
});

router.patch('/v1/admin/packages/:packageId', (req: Request, res: Response) => {
  const updated = db.updatePackage(req.params.packageId, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Package haijapatikana.' });
  }

  db.recordAuditLog({
    userId: 'admin',
    action: 'UPDATE_PACKAGE',
    entityType: 'PACKAGE',
    entityId: updated.id,
    metadata: req.body,
  });

  res.json({ success: true, package: updated });
});

// Consoles Admin Management
router.post('/v1/admin/consoles', (req: Request, res: Response) => {
  const { name, console_type, station_code, access_adapter, ip_address } = req.body;
  if (!name || !station_code) {
    return res.status(400).json({ success: false, error: 'Name and station_code are required.' });
  }
  const consoleObj = db.createConsole({
    name,
    console_type: console_type || 'PS4 Pro',
    station_code,
    status: 'available',
    access_adapter: access_adapter || 'HDMI_RELAY_SHELLY',
    relay_state: 'DISCONNECTED',
    ip_address: ip_address || `192.168.1.${Math.floor(100 + Math.random() * 50)}`,
    last_seen_at: new Date().toISOString(),
  });

  db.recordAuditLog({
    userId: 'admin',
    action: 'CREATE_CONSOLE',
    entityType: 'CONSOLE',
    entityId: consoleObj.id,
    metadata: { station_code: consoleObj.station_code },
  });

  res.status(201).json({ success: true, console: consoleObj });
});

router.patch('/v1/admin/consoles/:consoleId', (req: Request, res: Response) => {
  const updated = db.updateConsole(req.params.consoleId, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Console haijapatikana.' });
  }
  res.json({ success: true, console: updated });
});

// Vouchers Admin
router.get('/v1/admin/vouchers', (_req: Request, res: Response) => {
  const vouchers = db.getVouchers();
  res.json({ success: true, count: vouchers.length, vouchers });
});

router.post('/v1/admin/vouchers/batches', (req: Request, res: Response) => {
  const { count, gameId, packageId, valueTzs, durationSeconds, prefix, expiryDays } = req.body;

  const countNum = Math.min(Math.max(1, Number(count) || 5), 100);
  const vouchers = db.generateVoucherBatch({
    count: countNum,
    gameId: gameId || null,
    packageId: packageId || null,
    valueTzs: Number(valueTzs) || 1000,
    durationSeconds: Number(durationSeconds) || 600,
    prefix: prefix || 'VCH',
    expiryDays: expiryDays ? Number(expiryDays) : 30,
  });

  db.recordAuditLog({
    userId: 'admin',
    action: 'GENERATE_VOUCHER_BATCH',
    entityType: 'VOUCHER',
    entityId: vouchers[0]?.batch_id || 'BATCH',
    metadata: { count: countNum, prefix, valueTzs },
  });

  res.status(201).json({
    success: true,
    message: `${countNum} vocha zimetengenezwa kikamilifu.`,
    batchId: vouchers[0]?.batch_id,
    vouchers,
  });
});

// Payments & Sessions Admin
router.get('/v1/admin/payments', (_req: Request, res: Response) => {
  const payments = db.getPayments();
  res.json({ success: true, count: payments.length, payments });
});

router.get('/v1/admin/sessions', (_req: Request, res: Response) => {
  const sessions = db.getSessions();
  res.json({ success: true, count: sessions.length, sessions });
});

router.get('/v1/admin/reports/revenue', (_req: Request, res: Response) => {
  const metrics = db.getDashboardMetrics();
  res.json({
    success: true,
    revenueToday: metrics.revenueToday,
    totalRevenue: metrics.totalRevenue,
    byGame: metrics.revenueByGame,
    byPaymentMethod: metrics.revenueByPaymentMethod,
    byPeriod: metrics.revenueByPeriod,
  });
});

router.get('/v1/admin/audit-logs', (_req: Request, res: Response) => {
  const logs = db.getAuditLogs();
  res.json({ success: true, count: logs.length, logs });
});

router.get('/v1/access-events', (req: Request, res: Response) => {
  const consoleId = req.query.consoleId as string;
  const events = db.getAccessEvents(consoleId);
  res.json({ success: true, count: events.length, events });
});

// Hardware Action / Simulator
router.post('/v1/hardware/adapter/action', async (req: Request, res: Response) => {
  const { consoleId, action } = req.body;
  if (!consoleId || !action) {
    return res.status(400).json({ success: false, error: 'consoleId and action are required.' });
  }

  try {
    const result = await AccessControlManager.testStationAdapter(consoleId, action);
    res.json({ success: true, result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// --- Android TV Box Endpoints ---
router.post('/v1/android-tv/heartbeat', (req: Request, res: Response) => {
  const { stationCode, currentForegroundPackage, ipAddress, smartPlugStatus } = req.body;
  if (!stationCode) {
    return res.status(400).json({ success: false, error: 'stationCode is required.' });
  }

  const result = db.handleAndroidTvHeartbeat({
    stationCode,
    currentForegroundPackage,
    ipAddress,
    smartPlugStatus,
  });

  if (!result.success) {
    return res.status(404).json({ success: false, error: 'Android TV station not found.' });
  }

  const activeSessionPayload = result.activeSession
    ? {
        action: 'start_session',
        session_id: result.activeSession.id,
        allowed_package: result.allowedPackage,
        duration_seconds: result.activeSession.duration_purchased,
        ends_at: result.activeSession.ends_at,
      }
    : null;

  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    stationCode: result.station?.station_code,
    activeSession: activeSessionPayload,
    enforceAction: result.enforceAction,
    allowedPackage: result.allowedPackage,
    currentForegroundApp: result.station?.current_foreground_app,
  });
});

router.get('/v1/android-tv/station/:stationCode/active-session', (req: Request, res: Response) => {
  const station = db.getConsoleById(req.params.stationCode);
  if (!station) {
    return res.status(404).json({ success: false, error: 'Station not found.' });
  }

  let session = null;
  if (station.current_session_id) {
    session = db.getSessionById(station.current_session_id);
  }

  res.json({
    success: true,
    stationCode: station.station_code,
    allowedPackage: station.allowed_package_name,
    currentForegroundApp: station.current_foreground_app,
    session: session
      ? {
          action: 'start_session',
          session_id: session.id,
          allowed_package: station.allowed_package_name,
          duration_seconds: session.duration_purchased,
          ends_at: session.ends_at,
          status: session.status,
        }
      : null,
  });
});

router.post('/v1/android-tv/violation', (req: Request, res: Response) => {
  const { stationCode, attemptedPackage, reason } = req.body;
  if (!stationCode || !attemptedPackage) {
    return res.status(400).json({ success: false, error: 'stationCode and attemptedPackage are required.' });
  }

  const result = db.handleGameMismatchViolation({
    stationCode,
    attemptedPackage,
    reason,
  });

  res.json({
    success: true,
    ...result,
  });
});

router.post('/v1/android-tv/simulate-app-switch', (req: Request, res: Response) => {
  const { consoleId, attemptedPackage } = req.body;
  if (!consoleId || !attemptedPackage) {
    return res.status(400).json({ success: false, error: 'consoleId and attemptedPackage are required.' });
  }

  try {
    const result = db.simulateAppSwitch(consoleId, attemptedPackage);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/v1/android-tv/session-complete', (req: Request, res: Response) => {
  const { stationCode, sessionId } = req.body;
  if (sessionId) {
    db.stopSession(sessionId, 'Android TV Box local timer reported completion');
  }
  res.json({ success: true, message: 'Session completed and station returned to Kiosk.' });
});

export default router;

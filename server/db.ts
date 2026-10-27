import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  User,
  Game,
  Package,
  ConsoleStation,
  Order,
  Payment,
  Voucher,
  VoucherRedemption,
  Session,
  AccessEvent,
  AuditLog,
  DashboardMetrics,
  PaymentStatus,
  SessionStatus,
} from '../src/types/index';

export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin.trim().toUpperCase()).digest('hex');
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db_store.json');

interface DatabaseStore {
  users: User[];
  games: Game[];
  packages: Package[];
  consoles: ConsoleStation[];
  orders: Order[];
  payments: Payment[];
  vouchers: Voucher[];
  voucher_redemptions: VoucherRedemption[];
  sessions: Session[];
  access_events: AccessEvent[];
  audit_logs: AuditLog[];
}

function getInitialData(): DatabaseStore {
  const now = new Date().toISOString();

  const initialGames: Game[] = [
    {
      id: 'g-1',
      name: 'Grand Theft Auto V',
      slug: 'gta-v',
      description: 'Open world action-adventure game by Rockstar Games set in Los Santos and Blaine County.',
      image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      genre: 'Action / Open World',
      package_name: 'com.rockstargames.gtav',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'g-2',
      name: 'EA SPORTS FC 25',
      slug: 'ea-fc-25',
      description: 'The premier football gaming simulation with 5v5 Rush, redesigned tactics with FC IQ, and official club rosters.',
      image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
      genre: 'Sports / Football',
      package_name: 'com.ea.gp.fifamobile',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'g-3',
      name: 'Tekken 8',
      slug: 'tekken-8',
      description: 'Next-gen fighting game featuring aggressive new battle system with Heat mechanics and 32 characters.',
      image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      genre: 'Fighting',
      package_name: 'com.bandainamco.tekken8',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'g-4',
      name: 'Mortal Kombat 1',
      slug: 'mortal-kombat-1',
      description: 'Reborn Mortal Kombat Universe crafted by Fire God Liu Kang, introducing Kameo fighters and bone-crushing Fatalities.',
      image_url: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80',
      genre: 'Fighting / Action',
      package_name: 'com.wb.goog.mk1',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'g-5',
      name: 'Gran Turismo 7',
      slug: 'gran-turismo-7',
      description: 'The Real Driving Simulator featuring authentic automotive physics, legendary circuits, and deep tuning.',
      image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      genre: 'Racing / Simulation',
      package_name: 'com.playstation.gt7.remote',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'g-6',
      name: 'God of War Ragnarök',
      slug: 'god-of-war-ragnarok',
      description: 'Kratos and Atreus embark on a mythic journey for answers before the prophesied battle that ends the Nine Realms.',
      image_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
      genre: 'Action / Adventure',
      package_name: 'com.playstation.gow.stream',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];

  const initialPackages: Package[] = [
    // GTA V packages
    { id: 'pkg-1', game_id: 'g-1', name: '5 Mins Quick Match', duration_seconds: 300, price_tzs: 1000, is_active: true, created_at: now, updated_at: now },
    { id: 'pkg-2', game_id: 'g-1', name: '10 Mins Standard Run', duration_seconds: 600, price_tzs: 2000, is_active: true, created_at: now, updated_at: now },
    { id: 'pkg-3', game_id: 'g-1', name: '30 Mins Heist Session', duration_seconds: 1800, price_tzs: 5000, is_active: true, created_at: now, updated_at: now },
    { id: 'pkg-4', game_id: 'g-1', name: '60 Mins Extended Drive', duration_seconds: 3600, price_tzs: 9000, is_active: true, created_at: now, updated_at: now },

    // EA FC 25 packages
    { id: 'pkg-5', game_id: 'g-2', name: '5 Mins Half Match', duration_seconds: 300, price_tzs: 1000, is_active: true, created_at: now, updated_at: now },
    { id: 'pkg-6', game_id: 'g-2', name: '15 Mins Full Match + Extra Time', duration_seconds: 900, price_tzs: 2500, is_active: true, created_at: now, updated_at: now },
    { id: 'pkg-7', game_id: 'g-2', name: '30 Mins Derby Tournament', duration_seconds: 1800, price_tzs: 4500, is_active: true, created_at: now, updated_at: now },
    { id: 'pkg-8', game_id: 'g-2', name: '60 Mins Champion Pass', duration_seconds: 3600, price_tzs: 8500, is_active: true, created_at: now, updated_at: now },

    // Tekken 8 packages
    { id: 'pkg-9', game_id: 'g-3', name: '10 Mins Best of 5', duration_seconds: 600, price_tzs: 1500, is_active: true, created_at: now, updated_at: now },
    { id: 'pkg-10', game_id: 'g-3', name: '20 Mins Versus Clash', duration_seconds: 1200, price_tzs: 3000, is_active: true, created_at: now, updated_at: now },
    { id: 'pkg-11', game_id: 'g-3', name: '45 Mins Dojo Practice', duration_seconds: 2700, price_tzs: 6000, is_active: true, created_at: now, updated_at: now },

    // Mortal Kombat 1 packages
    { id: 'pkg-12', game_id: 'g-4', name: '10 Mins Kombat', duration_seconds: 600, price_tzs: 1500, is_active: true, created_at: now, updated_at: now },
    { id: 'pkg-13', game_id: 'g-4', name: '30 Mins Tower Challenge', duration_seconds: 1800, price_tzs: 4000, is_active: true, created_at: now, updated_at: now },

    // Gran Turismo 7
    { id: 'pkg-14', game_id: 'g-5', name: '15 Mins Hot Lap', duration_seconds: 900, price_tzs: 2500, is_active: true, created_at: now, updated_at: now },
    { id: 'pkg-15', game_id: 'g-5', name: '30 Mins Grand Prix', duration_seconds: 1800, price_tzs: 4500, is_active: true, created_at: now, updated_at: now },

    // God of War
    { id: 'pkg-16', game_id: 'g-6', name: '30 Mins Realm Quest', duration_seconds: 1800, price_tzs: 5000, is_active: true, created_at: now, updated_at: now },
  ];

  const initialConsoles: ConsoleStation[] = [
    {
      id: 'c-1',
      name: 'Station 1 (PS4 Pro 4K HDR)',
      console_type: 'PS4 Pro',
      station_code: 'PS4-01',
      status: 'available',
      access_adapter: 'HDMI_RELAY_SHELLY',
      relay_state: 'DISCONNECTED',
      ip_address: '192.168.1.101',
      last_seen_at: now,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'c-2',
      name: 'Station 2 (PS4 Slim Esports)',
      console_type: 'PS4 Slim',
      station_code: 'PS4-02',
      status: 'available',
      access_adapter: 'HDMI_RELAY_SHELLY',
      relay_state: 'DISCONNECTED',
      ip_address: '192.168.1.102',
      last_seen_at: now,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'c-3',
      name: 'Station 3 (Android TV Box - Xiaomi Mi Box 4K)',
      console_type: 'Android TV Box',
      station_code: 'ATV-01',
      status: 'available',
      access_adapter: 'ANDROID_TV_KIOSK_MONITOR',
      relay_state: 'DISCONNECTED',
      smart_plug_state: 'ON',
      ip_address: '192.168.1.103',
      current_foreground_app: 'com.playstation.kiosk',
      allowed_package_name: null,
      mismatch_count: 0,
      last_seen_at: now,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'c-4',
      name: 'Station 4 (Nvidia Shield TV Pro - Kiosk Locked)',
      console_type: 'Nvidia Shield TV',
      station_code: 'ATV-02',
      status: 'available',
      access_adapter: 'ANDROID_TV_KIOSK_MONITOR',
      relay_state: 'DISCONNECTED',
      smart_plug_state: 'ON',
      ip_address: '192.168.1.104',
      current_foreground_app: 'com.playstation.kiosk',
      allowed_package_name: null,
      mismatch_count: 0,
      last_seen_at: now,
      created_at: now,
      updated_at: now,
    },
  ];

  // Seed sample vouchers ready for testing immediately
  const initialVouchers: Voucher[] = [
    {
      id: 'v-101',
      pin_display: 'GTA-5MIN-7788',
      pin_hash: hashPin('GTA-5MIN-7788'),
      game_id: 'g-1',
      package_id: 'pkg-1',
      value_tzs: 1000,
      duration_seconds: 300,
      status: 'unused',
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: now,
      batch_id: 'BATCH-PROMO-2026',
    },
    {
      id: 'v-102',
      pin_display: 'FIFA-15M-3321',
      pin_hash: hashPin('FIFA-15M-3321'),
      game_id: 'g-2',
      package_id: 'pkg-6',
      value_tzs: 2500,
      duration_seconds: 900,
      status: 'unused',
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: now,
      batch_id: 'BATCH-PROMO-2026',
    },
    {
      id: 'v-103',
      pin_display: 'TK8-10M-9912',
      pin_hash: hashPin('TK8-10M-9912'),
      game_id: 'g-3',
      package_id: 'pkg-9',
      value_tzs: 1500,
      duration_seconds: 600,
      status: 'unused',
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: now,
      batch_id: 'BATCH-PROMO-2026',
    },
    {
      id: 'v-104',
      pin_display: 'ALL-30M-5000',
      pin_hash: hashPin('ALL-30M-5000'),
      game_id: null, // Any game voucher
      package_id: null,
      value_tzs: 5000,
      duration_seconds: 1800,
      status: 'unused',
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: now,
      batch_id: 'BATCH-VIP-2026',
    },
  ];

  const initialUsers: User[] = [
    {
      id: 'u-admin-1',
      name: 'System Admin',
      username: 'admin',
      role: 'admin',
      is_active: true,
      created_at: now,
    },
    {
      id: 'u-op-1',
      name: 'Station Operator (Kiosk Desk)',
      username: 'operator',
      role: 'operator',
      is_active: true,
      created_at: now,
    },
  ];

  return {
    users: initialUsers,
    games: initialGames,
    packages: initialPackages,
    consoles: initialConsoles,
    orders: [],
    payments: [],
    vouchers: initialVouchers,
    voucher_redemptions: [],
    sessions: [],
    access_events: [
      {
        id: 'ae-init-1',
        session_id: null,
        console_id: 'c-1',
        event_type: 'SYSTEM_BOOT',
        result: 'SUCCESS',
        details: 'Station 1 access control adapter initialized and synced.',
        created_at: now,
      },
    ],
    audit_logs: [
      {
        id: 'al-init-1',
        user_id: 'u-admin-1',
        action: 'SYSTEM_INIT',
        entity_type: 'SYSTEM',
        entity_id: 'SYS-1',
        metadata: { message: 'PlayStation Gaming Management System bootstrapped with 6 games and 4 consoles.' },
        created_at: now,
      },
    ],
  };
}

class Database {
  private data: DatabaseStore;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseStore {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const loaded: DatabaseStore = JSON.parse(raw);
        const defaults = getInitialData();

        // Migrate games: ensure package_name exists
        for (const g of loaded.games) {
          if (!g.package_name) {
            const match = defaults.games.find((dg) => dg.id === g.id || dg.slug === g.slug);
            g.package_name = match?.package_name || 'com.rockstargames.gtav';
          }
        }

        // Migrate consoles: ensure Station 3 and 4 are Android TV Box
        for (const c of loaded.consoles) {
          if (c.id === 'c-3') {
            c.name = 'Station 3 (Android TV Box - Xiaomi Mi Box 4K)';
            c.console_type = 'Android TV Box';
            c.station_code = 'ATV-01';
            c.access_adapter = 'ANDROID_TV_KIOSK_MONITOR';
            c.smart_plug_state = 'ON';
            if (!c.current_foreground_app) c.current_foreground_app = 'com.playstation.kiosk';
          } else if (c.id === 'c-4') {
            c.name = 'Station 4 (Nvidia Shield TV Pro - Kiosk Locked)';
            c.console_type = 'Nvidia Shield TV';
            c.station_code = 'ATV-02';
            c.access_adapter = 'ANDROID_TV_KIOSK_MONITOR';
            c.smart_plug_state = 'ON';
            if (!c.current_foreground_app) c.current_foreground_app = 'com.playstation.kiosk';
          }
        }

        this.persist(loaded);
        return loaded;
      }
    } catch (e) {
      console.warn('Could not read existing data store, initializing fresh defaults', e);
    }
    const initial = getInitialData();
    this.persist(initial);
    return initial;
  }

  private persist(dataToSave?: DatabaseStore) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write db_store to disk:', e);
    }
  }

  public save() {
    this.persist();
  }

  // --- Games ---
  public getGames(includeInactive = false): Game[] {
    if (includeInactive) return this.data.games;
    return this.data.games.filter((g) => g.is_active);
  }

  public getGameById(id: string): Game | undefined {
    return this.data.games.find((g) => g.id === id || g.slug === id);
  }

  public createGame(gameData: Omit<Game, 'id' | 'created_at' | 'updated_at'>): Game {
    const now = new Date().toISOString();
    const newGame: Game = {
      id: `g-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...gameData,
      created_at: now,
      updated_at: now,
    };
    this.data.games.push(newGame);
    this.save();
    return newGame;
  }

  public updateGame(id: string, updates: Partial<Game>): Game | undefined {
    const game = this.data.games.find((g) => g.id === id);
    if (!game) return undefined;
    Object.assign(game, updates, { updated_at: new Date().toISOString() });
    this.save();
    return game;
  }

  // --- Packages ---
  public getPackages(gameId?: string, includeInactive = false): Package[] {
    let pkgs = this.data.packages;
    if (gameId) pkgs = pkgs.filter((p) => p.game_id === gameId);
    if (!includeInactive) pkgs = pkgs.filter((p) => p.is_active);
    return pkgs;
  }

  public getPackageById(id: string): Package | undefined {
    return this.data.packages.find((p) => p.id === id);
  }

  public createPackage(pkgData: Omit<Package, 'id' | 'created_at' | 'updated_at'>): Package {
    const now = new Date().toISOString();
    const newPkg: Package = {
      id: `pkg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...pkgData,
      created_at: now,
      updated_at: now,
    };
    this.data.packages.push(newPkg);
    this.save();
    return newPkg;
  }

  public updatePackage(id: string, updates: Partial<Package>): Package | undefined {
    const pkg = this.data.packages.find((p) => p.id === id);
    if (!pkg) return undefined;
    Object.assign(pkg, updates, { updated_at: new Date().toISOString() });
    this.save();
    return pkg;
  }

  // --- Consoles ---
  public getConsoles(): ConsoleStation[] {
    return this.data.consoles;
  }

  public getConsoleById(id: string): ConsoleStation | undefined {
    return this.data.consoles.find((c) => c.id === id || c.station_code === id);
  }

  public updateConsole(id: string, updates: Partial<ConsoleStation>): ConsoleStation | undefined {
    const consoleObj = this.data.consoles.find((c) => c.id === id || c.station_code === id);
    if (!consoleObj) return undefined;
    Object.assign(consoleObj, updates, { updated_at: new Date().toISOString() });
    this.save();
    return consoleObj;
  }

  public createConsole(data: Omit<ConsoleStation, 'id' | 'created_at' | 'updated_at'>): ConsoleStation {
    const now = new Date().toISOString();
    const newConsole: ConsoleStation = {
      id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...data,
      created_at: now,
      updated_at: now,
    };
    this.data.consoles.push(newConsole);
    this.save();
    return newConsole;
  }

  // --- Orders ---
  public createOrder(params: {
    gameId: string;
    packageId: string;
    consoleId: string;
    paymentMethod: 'mobile_money' | 'voucher';
    customerPhone?: string;
  }): { order: Order; error?: string } {
    const game = this.getGameById(params.gameId);
    if (!game || !game.is_active) {
      return { order: null as any, error: 'Mchezo haupatikani au umezimwa (Game is inactive or not found).' };
    }

    const pkg = this.getPackageById(params.packageId);
    if (!pkg || !pkg.is_active || pkg.game_id !== game.id) {
      return { order: null as any, error: 'Package haipo au hailingani na mchezo uliochaguliwa.' };
    }

    const consoleObj = this.getConsoleById(params.consoleId);
    if (!consoleObj) {
      return { order: null as any, error: 'Console/Station haipatikani.' };
    }

    if (consoleObj.status === 'occupied') {
      return { order: null as any, error: 'Station hii kwa sasa inatumiwa na mteja mwingine. Chagua station iliyo wazi.' };
    }

    const orderRef = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 899 + 100)}`;
    const now = new Date().toISOString();

    const order: Order = {
      id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order_reference: orderRef,
      game_id: game.id,
      package_id: pkg.id,
      console_id: consoleObj.id,
      allowed_package_name: game.package_name || 'com.rockstargames.gtav',
      price_tzs: pkg.price_tzs, // Server snapshot price
      duration_seconds: pkg.duration_seconds, // Server snapshot duration
      payment_method: params.paymentMethod,
      status: 'pending',
      customer_phone: params.customerPhone,
      created_at: now,
      paid_at: null,
    };

    this.data.orders.push(order);
    this.save();
    return { order };
  }

  public getOrder(referenceOrId: string): Order | undefined {
    return this.data.orders.find((o) => o.order_reference === referenceOrId || o.id === referenceOrId);
  }

  public getOrders(): Order[] {
    return this.data.orders;
  }

  // --- Payments ---
  public createPayment(params: {
    orderId: string;
    provider: 'mpesa' | 'tigopesa' | 'airtel' | 'halopesa' | 'voucher';
    amountTzs: number;
    idempotencyKey?: string;
  }): Payment {
    const now = new Date().toISOString();
    const idKey = params.idempotencyKey || `IDEM-${Date.now()}-${Math.random()}`;

    // Check existing by idempotency
    const existing = this.data.payments.find((p) => p.idempotency_key === idKey);
    if (existing) return existing;

    const providerRef = `${params.provider.toUpperCase()}-TZ-${Math.floor(Math.random() * 899999 + 100000)}`;
    const payment: Payment = {
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order_id: params.orderId,
      provider: params.provider,
      provider_reference: providerRef,
      amount_tzs: params.amountTzs,
      currency: 'TSh',
      status: 'pending',
      idempotency_key: idKey,
      verified_at: null,
      created_at: now,
      updated_at: now,
    };

    this.data.payments.push(payment);
    this.save();
    return payment;
  }

  public markPaymentPaid(
    paymentId: string,
    providerRef?: string
  ): { payment?: Payment; order?: Order; session?: Session; error?: string } {
    const payment = this.data.payments.find((p) => p.id === paymentId || p.provider_reference === paymentId);
    if (!payment) return { error: 'Malipo hayajapatikana.' };

    if (payment.status === 'paid') {
      // Idempotency: already paid, find existing session
      const existingSession = this.data.sessions.find((s) => s.order_id === payment.order_id);
      const existingOrder = this.data.orders.find((o) => o.id === payment.order_id);
      return { payment, order: existingOrder, session: existingSession };
    }

    const order = this.data.orders.find((o) => o.id === payment.order_id);
    if (!order) return { error: 'Order husika haijapatikana.' };

    const now = new Date().toISOString();
    payment.status = 'paid';
    if (providerRef) payment.provider_reference = providerRef;
    payment.verified_at = now;
    payment.updated_at = now;

    order.status = 'paid';
    order.paid_at = now;

    // Create gaming session linked to this verified payment
    const sessionRes = this.createSessionForOrder(order);
    this.save();

    return { payment, order, session: sessionRes.session };
  }

  public getPayments(): Payment[] {
    return this.data.payments;
  }

  // --- Vouchers ---
  public getVouchers(): Voucher[] {
    return this.data.vouchers;
  }

  public generateVoucherBatch(params: {
    count: number;
    gameId: string | null;
    packageId: string | null;
    valueTzs: number;
    durationSeconds: number;
    prefix?: string;
    expiryDays?: number;
    batchId?: string;
  }): Voucher[] {
    const now = new Date().toISOString();
    const expiry = params.expiryDays
      ? new Date(Date.now() + params.expiryDays * 86400000).toISOString()
      : null;
    const batch = params.batchId || `BATCH-${Date.now().toString().slice(-6)}`;
    const prefix = params.prefix ? params.prefix.toUpperCase() : 'VCH';

    const generated: Voucher[] = [];

    for (let i = 0; i < params.count; i++) {
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const alphaPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const pinCode = `${prefix}-${randomPart}-${alphaPart}`;
      const hashed = hashPin(pinCode);

      const voucher: Voucher = {
        id: `v-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
        pin_display: pinCode,
        pin_hash: hashed,
        game_id: params.gameId,
        package_id: params.packageId,
        value_tzs: params.valueTzs,
        duration_seconds: params.durationSeconds,
        status: 'unused',
        expires_at: expiry,
        created_at: now,
        batch_id: batch,
      };

      this.data.vouchers.push(voucher);
      generated.push(voucher);
    }

    this.save();
    return generated;
  }

  public redeemVoucher(params: {
    pin: string;
    gameId: string;
    packageId: string;
    consoleId: string;
    customerPhone?: string;
  }): { success: boolean; session?: Session; order?: Order; error?: string } {
    const rawPin = params.pin.trim().toUpperCase();
    const hashed = hashPin(rawPin);

    // Find voucher by hash or display code
    const voucher = this.data.vouchers.find(
      (v) => v.pin_hash === hashed || v.pin_display.toUpperCase() === rawPin
    );

    if (!voucher) {
      return { success: false, error: 'PIN ya vocha siyo sahihi. Tafadhali hakiki na ujaribu tena.' };
    }

    if (voucher.status === 'redeemed') {
      return { success: false, error: 'Vocha hii imekwisha tumika tayari (Voucher has already been redeemed).' };
    }

    if (voucher.status === 'disabled') {
      return { success: false, error: 'Vocha hii imezimwa na msimamizi.' };
    }

    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      voucher.status = 'expired';
      this.save();
      return { success: false, error: 'Muda wa matumizi ya vocha hii umekwisha (Voucher has expired).' };
    }

    // Check game restriction
    if (voucher.game_id && voucher.game_id !== params.gameId) {
      const allowedGame = this.getGameById(voucher.game_id);
      return {
        success: false,
        error: `Vocha hii inatumika kwa ajili ya mchezo wa "${allowedGame?.name || 'mwingine'}" tu.`,
      };
    }

    // Check package restriction
    if (voucher.package_id && voucher.package_id !== params.packageId) {
      const allowedPkg = this.getPackageById(voucher.package_id);
      return {
        success: false,
        error: `Vocha hii inatumika kwa kifurushi cha "${allowedPkg?.name || 'maalumu'}" pekee.`,
      };
    }

    // Check station availability
    const consoleObj = this.getConsoleById(params.consoleId);
    if (!consoleObj) {
      return { success: false, error: 'Console uliyochagua haipatikani.' };
    }

    if (consoleObj.status === 'occupied') {
      return {
        success: false,
        error: 'Station hii tayari inachezwa na mteja mwingine. Chagua station iliyo wazi au subiri imalize.',
      };
    }

    const pkg = this.getPackageById(params.packageId);
    if (!pkg) {
      return { success: false, error: 'Package haijapatikana.' };
    }

    // Atomic redemption transaction
    const now = new Date().toISOString();
    voucher.status = 'redeemed';

    // Create paid order
    const orderRef = `ORD-VCH-${Date.now().toString().slice(-6)}`;
    const targetGame = this.getGameById(params.gameId);
    const order: Order = {
      id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order_reference: orderRef,
      game_id: params.gameId,
      package_id: params.packageId,
      console_id: params.consoleId,
      allowed_package_name: targetGame?.package_name || 'com.rockstargames.gtav',
      price_tzs: pkg.price_tzs,
      duration_seconds: voucher.duration_seconds || pkg.duration_seconds,
      payment_method: 'voucher',
      status: 'paid',
      customer_phone: params.customerPhone,
      created_at: now,
      paid_at: now,
    };
    this.data.orders.push(order);

    // Create payment record
    const payment: Payment = {
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order_id: order.id,
      provider: 'voucher',
      provider_reference: `VCH-PIN-${voucher.pin_display.slice(-4)}`,
      amount_tzs: order.price_tzs,
      currency: 'TSh',
      status: 'paid',
      idempotency_key: `IDEM-VCH-${voucher.id}`,
      verified_at: now,
      created_at: now,
      updated_at: now,
    };
    this.data.payments.push(payment);

    // Create session
    const sessionRes = this.createSessionForOrder(order);

    // Record voucher redemption
    const redemption: VoucherRedemption = {
      id: `vr-${Date.now()}`,
      voucher_id: voucher.id,
      order_id: order.id,
      session_id: sessionRes.session.id,
      redeemed_at: now,
    };
    this.data.voucher_redemptions.push(redemption);

    this.save();
    return { success: true, order, session: sessionRes.session };
  }

  // --- Sessions & Timers ---
  public createSessionForOrder(order: Order): { session: Session } {
    const now = new Date();
    const durationSec = order.duration_seconds;
    const endsAt = new Date(now.getTime() + durationSec * 1000).toISOString();

    const game = this.getGameById(order.game_id);
    const allowedPkg = order.allowed_package_name || game?.package_name || 'com.rockstargames.gtav';

    const session: Session = {
      id: `ses-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order_id: order.id,
      console_id: order.console_id,
      game_id: order.game_id,
      package_id: order.package_id,
      allowed_package_name: allowedPkg,
      customer_phone: order.customer_phone,
      status: 'active',
      started_at: now.toISOString(),
      ends_at: endsAt,
      ended_at: null,
      access_status: 'ACCESS_GRANTED',
      duration_purchased: durationSec,
      mismatch_violations: 0,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    this.data.sessions.push(session);

    // Update console status & relay / Android TV
    const consoleObj = this.getConsoleById(order.console_id);
    if (consoleObj) {
      consoleObj.status = 'occupied';
      consoleObj.current_session_id = session.id;
      consoleObj.allowed_package_name = allowedPkg;
      consoleObj.current_foreground_app = allowedPkg; // Station immediately starts allowed game
      consoleObj.mismatch_count = 0;
      consoleObj.relay_state = 'CONNECTED';
      consoleObj.smart_plug_state = 'ON';
      consoleObj.updated_at = now.toISOString();
    }

    // Access event
    const isAtv = consoleObj?.access_adapter === 'ANDROID_TV_KIOSK_MONITOR';
    this.recordAccessEvent({
      sessionId: session.id,
      consoleId: order.console_id,
      eventType: isAtv ? 'ATV_SESSION_AUTHORIZED' : 'STATION_UNLOCKED_SESSION_STARTED',
      result: 'SUCCESS',
      details: isAtv
        ? `[Android TV Kiosk] Session locked to package "${allowedPkg}" on ${consoleObj?.station_code}. Timer started (${Math.round(durationSec / 60)}m). Smart plug ON.`
        : `PS4 Access granted for ${Math.round(durationSec / 60)} minutes via Order ${order.order_reference}. Relay CONNECTED.`,
    });

    this.save();
    return { session };
  }

  public getSessionById(sessionId: string): Session | undefined {
    return this.data.sessions.find((s) => s.id === sessionId);
  }

  public getSessions(): Session[] {
    return this.data.sessions;
  }

  public stopSession(sessionId: string, reason = 'Operator / Manual stop'): Session | undefined {
    const session = this.getSessionById(sessionId);
    if (!session) return undefined;

    const now = new Date().toISOString();
    session.status = 'completed';
    session.ended_at = now;
    session.access_status = 'ACCESS_REVOKED';
    session.updated_at = now;

    const consoleObj = this.getConsoleById(session.console_id);
    if (consoleObj) {
      consoleObj.status = 'available';
      consoleObj.current_session_id = null;
      consoleObj.allowed_package_name = null;
      consoleObj.current_foreground_app = 'com.playstation.kiosk';
      consoleObj.mismatch_count = 0;
      consoleObj.relay_state = 'DISCONNECTED';
      consoleObj.updated_at = now;
    }

    this.recordAccessEvent({
      sessionId: session.id,
      consoleId: session.console_id,
      eventType: 'SESSION_TERMINATED',
      result: 'SUCCESS',
      details: `Session stopped: ${reason}. Console access revoked and display/app locked to kiosk.`,
    });

    this.save();
    return session;
  }

  public extendSession(sessionId: string, additionalSeconds: number, reason = 'Operator extension'): Session | undefined {
    const session = this.getSessionById(sessionId);
    if (!session || session.status !== 'active') return undefined;

    const currentEnd = session.ends_at ? new Date(session.ends_at).getTime() : Date.now();
    const newEnd = new Date(Math.max(Date.now(), currentEnd) + additionalSeconds * 1000).toISOString();

    session.ends_at = newEnd;
    session.duration_purchased += additionalSeconds;
    session.updated_at = new Date().toISOString();

    this.recordAccessEvent({
      sessionId: session.id,
      consoleId: session.console_id,
      eventType: 'SESSION_EXTENDED',
      result: 'SUCCESS',
      details: `Extended by ${Math.round(additionalSeconds / 60)} minutes. New expiry: ${newEnd}. Reason: ${reason}`,
    });

    this.save();
    return session;
  }

  public payAndExtendSession(params: {
    sessionId: string;
    additionalSeconds: number;
    amountTzs: number;
    paymentMethod: 'mobile_money' | 'voucher' | 'cash';
    provider: 'mpesa' | 'tigopesa' | 'airtel' | 'halopesa' | 'voucher' | 'cash';
    customerPhone?: string;
    voucherPin?: string;
    operatorPin?: string;
  }): { success: boolean; session?: Session; payment?: Payment; order?: Order; error?: string } {
    const session = this.getSessionById(params.sessionId);
    if (!session || session.status !== 'active') {
      return { success: false, error: 'Session haijapatikana au haipo active.' };
    }

    const now = new Date().toISOString();
    let durationToAdd = params.additionalSeconds;
    let priceTzs = params.amountTzs;
    let paymentRef = `${params.provider.toUpperCase()}-EXT-${Math.floor(Math.random() * 899999 + 100000)}`;

    // If payment via Voucher
    if (params.paymentMethod === 'voucher') {
      if (!params.voucherPin) {
        return { success: false, error: 'Tafadhali weka PIN ya vocha.' };
      }
      const rawPin = params.voucherPin.trim().toUpperCase();
      const voucher = this.data.vouchers.find(
        (v) => v.pin_display.toUpperCase() === rawPin || v.pin_hash === hashPin(rawPin)
      );
      if (!voucher) {
        return { success: false, error: 'Vocha haijapatikana. Hakiki namba za PIN.' };
      }
      if (voucher.status === 'redeemed') {
        return { success: false, error: 'Vocha hii imekwisha tumika tayari.' };
      }
      if (voucher.status === 'expired' || (voucher.expires_at && new Date(voucher.expires_at) < new Date())) {
        return { success: false, error: 'Muda wa vocha hii umekwisha.' };
      }
      if (voucher.status === 'disabled') {
        return { success: false, error: 'Vocha hii imezimwa na msimamizi.' };
      }

      voucher.status = 'redeemed';
      if (voucher.duration_seconds && voucher.duration_seconds > 0) {
        durationToAdd = voucher.duration_seconds;
      }
      priceTzs = voucher.value_tzs || priceTzs;
      paymentRef = `VCH-EXT-${voucher.pin_display.slice(-4)}`;

      // Record voucher redemption
      this.data.voucher_redemptions.push({
        id: `vr-ext-${Date.now()}`,
        voucher_id: voucher.id,
        order_id: `ord-ext-${Date.now()}`,
        session_id: session.id,
        redeemed_at: now,
      });
    } else if (params.paymentMethod === 'cash') {
      if (params.operatorPin && params.operatorPin !== '1234' && params.operatorPin !== 'admin' && params.operatorPin !== 'operator') {
        return { success: false, error: 'PIN ya mhudumu (Operator PIN) si sahihi.' };
      }
      paymentRef = `CASH-REC-${Math.floor(Math.random() * 89999 + 10000)}`;
    }

    // Create an extension order
    const orderRef = `ORD-EXT-${Date.now().toString().slice(-6)}`;
    const order: Order = {
      id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order_reference: orderRef,
      game_id: session.game_id,
      package_id: session.package_id || 'pkg-extension',
      console_id: session.console_id,
      allowed_package_name: session.allowed_package_name,
      price_tzs: priceTzs,
      duration_seconds: durationToAdd,
      payment_method: params.paymentMethod === 'cash' ? ('mobile_money' as any) : params.paymentMethod,
      status: 'paid',
      customer_phone: params.customerPhone,
      created_at: now,
      paid_at: now,
    };
    this.data.orders.push(order);

    // Create payment record
    const payment: Payment = {
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order_id: order.id,
      provider: params.provider as any,
      provider_reference: paymentRef,
      amount_tzs: priceTzs,
      currency: 'TSh',
      status: 'paid',
      idempotency_key: `IDEM-EXT-${Date.now()}-${Math.random()}`,
      verified_at: now,
      created_at: now,
      updated_at: now,
    };
    this.data.payments.push(payment);

    // Extend session time
    const updatedSession = this.extendSession(
      session.id,
      durationToAdd,
      `Nyongeza ya muda ${Math.round(durationToAdd / 60)}m - Malipo TSh ${priceTzs.toLocaleString()} (${params.provider.toUpperCase()} Ref: ${paymentRef})`
    );

    this.save();
    return {
      success: true,
      session: updatedSession,
      payment,
      order,
    };
  }

  // --- Access Events & Audit Logs ---
  public recordAccessEvent(params: {
    sessionId: string | null;
    consoleId: string;
    eventType: string;
    result: 'SUCCESS' | 'FAILED';
    details: string;
  }): AccessEvent {
    const event: AccessEvent = {
      id: `ae-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      session_id: params.sessionId,
      console_id: params.consoleId,
      event_type: params.eventType,
      result: params.result,
      details: params.details,
      created_at: new Date().toISOString(),
    };
    this.data.access_events.unshift(event);
    if (this.data.access_events.length > 500) {
      this.data.access_events = this.data.access_events.slice(0, 500);
    }
    this.save();
    return event;
  }

  public getAccessEvents(consoleId?: string): AccessEvent[] {
    if (consoleId) {
      return this.data.access_events.filter((e) => e.console_id === consoleId);
    }
    return this.data.access_events;
  }

  public recordAuditLog(params: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: Record<string, any>;
  }): AuditLog {
    const log: AuditLog = {
      id: `al-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      metadata: params.metadata,
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(log);
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 500);
    }
    this.save();
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.audit_logs;
  }

  // --- Metrics and Reports ---
  public getDashboardMetrics(): DashboardMetrics {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const paidPayments = this.data.payments.filter((p) => p.status === 'paid');
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount_tzs, 0);

    const revenueToday = paidPayments
      .filter((p) => new Date(p.created_at).getTime() >= startOfToday)
      .reduce((sum, p) => sum + p.amount_tzs, 0);

    const completedSessions = this.data.sessions.filter((s) => s.status === 'completed').length;
    const activeSessions = this.data.sessions.filter((s) => s.status === 'active').length;
    const pendingPayments = this.data.payments.filter((p) => p.status === 'pending').length;
    const failedPayments = this.data.payments.filter((p) => p.status === 'failed').length;

    const availableConsoles = this.data.consoles.filter((c) => c.status === 'available').length;
    const totalConsoles = this.data.consoles.length;

    const vouchersUnused = this.data.vouchers.filter((v) => v.status === 'unused').length;
    const vouchersRedeemed = this.data.vouchers.filter((v) => v.status === 'redeemed').length;

    // Revenue by game
    const gameMap: Record<string, { amount: number; count: number }> = {};
    for (const session of this.data.sessions) {
      const order = this.data.orders.find((o) => o.id === session.order_id);
      if (order && order.status === 'paid') {
        const game = this.data.games.find((g) => g.id === session.game_id);
        const name = game ? game.name : 'Unknown Game';
        if (!gameMap[name]) gameMap[name] = { amount: 0, count: 0 };
        gameMap[name].amount += order.price_tzs;
        gameMap[name].count += 1;
      }
    }
    const revenueByGame = Object.entries(gameMap).map(([gameName, v]) => ({
      gameName,
      amount: v.amount,
      count: v.count,
    }));

    // Revenue by payment method
    const methodMap: Record<string, { amount: number; count: number }> = {};
    for (const p of paidPayments) {
      const key = p.provider.toUpperCase();
      if (!methodMap[key]) methodMap[key] = { amount: 0, count: 0 };
      methodMap[key].amount += p.amount_tzs;
      methodMap[key].count += 1;
    }
    const revenueByPaymentMethod = Object.entries(methodMap).map(([method, v]) => ({
      method,
      amount: v.amount,
      count: v.count,
    }));

    // Revenue by last 7 days
    const dailyMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }
    for (const p of paidPayments) {
      const key = p.created_at.split('T')[0];
      if (dailyMap[key] !== undefined) {
        dailyMap[key] += p.amount_tzs;
      }
    }
    const revenueByPeriod = Object.entries(dailyMap).map(([date, amount]) => ({
      date,
      amount,
    }));

    return {
      totalRevenue,
      revenueToday,
      completedSessions,
      activeSessions,
      pendingPayments,
      failedPayments,
      availableConsoles,
      totalConsoles,
      vouchersUnused,
      vouchersRedeemed,
      revenueByGame,
      revenueByPaymentMethod,
      revenueByPeriod,
    };
  }

  // --- Background Worker Tick ---
  public checkAndExpireSessions(): Session[] {
    const now = Date.now();
    const expiredSessions: Session[] = [];

    for (const session of this.data.sessions) {
      if (session.status === 'active' && session.ends_at) {
        const endTime = new Date(session.ends_at).getTime();
        if (now >= endTime) {
          // Time expired! Mark session completed and revoke console access
          session.status = 'completed';
          session.ended_at = new Date(now).toISOString();
          session.access_status = 'ACCESS_REVOKED';
          session.updated_at = new Date(now).toISOString();

          const consoleObj = this.getConsoleById(session.console_id);
          if (consoleObj) {
            consoleObj.status = 'available';
            consoleObj.current_session_id = null;
            consoleObj.allowed_package_name = null;
            consoleObj.current_foreground_app = 'com.playstation.kiosk';
            consoleObj.mismatch_count = 0;
            consoleObj.relay_state = 'DISCONNECTED';
            consoleObj.updated_at = new Date(now).toISOString();
          }

          const isAtv = consoleObj?.access_adapter === 'ANDROID_TV_KIOSK_MONITOR';
          this.recordAccessEvent({
            sessionId: session.id,
            consoleId: session.console_id,
            eventType: isAtv ? 'ATV_SESSION_EXPIRED_RETURN_LAUNCHER' : 'SESSION_EXPIRED_HDMI_CUT',
            result: 'SUCCESS',
            details: isAtv
              ? `[Android TV Kiosk] Time expired for ${consoleObj?.station_code}. Forced close of game and returned to kiosk launcher.`
              : `Time finished! Access control cut HDMI/power relay for console ${consoleObj?.station_code || session.console_id}. Station returned to available.`,
          });

          expiredSessions.push(session);
        }
      }
    }

    if (expiredSessions.length > 0) {
      this.save();
    }

    return expiredSessions;
  }

  // --- Android TV Specific Control Methods ---
  public handleAndroidTvHeartbeat(params: {
    stationCode: string;
    currentForegroundPackage?: string;
    ipAddress?: string;
    smartPlugStatus?: 'ON' | 'OFF';
  }): {
    success: boolean;
    station?: ConsoleStation;
    activeSession?: Session;
    enforceAction?: 'NONE' | 'KILL_UNAUTHORIZED' | 'LOCK_KIOSK';
    allowedPackage?: string | null;
  } {
    const station = this.data.consoles.find(
      (c) => c.station_code === params.stationCode || c.id === params.stationCode
    );
    if (!station) {
      return { success: false };
    }

    const now = new Date().toISOString();
    station.last_seen_at = now;
    if (params.ipAddress) station.ip_address = params.ipAddress;
    if (params.smartPlugStatus) station.smart_plug_state = params.smartPlugStatus;
    if (params.currentForegroundPackage) {
      station.current_foreground_app = params.currentForegroundPackage;
    }

    let activeSession: Session | undefined;
    if (station.current_session_id) {
      activeSession = this.getSessionById(station.current_session_id);
    }

    let enforceAction: 'NONE' | 'KILL_UNAUTHORIZED' | 'LOCK_KIOSK' = 'NONE';

    // If there is an active session and a foreground package reported
    if (activeSession && activeSession.status === 'active' && station.allowed_package_name) {
      const allowed = station.allowed_package_name;
      const current = params.currentForegroundPackage;

      // Allow Kiosk launcher itself, settings (if in dev), or the exact allowed game
      const isAllowed =
        !current ||
        current === allowed ||
        current === 'com.playstation.kiosk' ||
        current.includes('launcher');

      if (!isAllowed) {
        enforceAction = 'KILL_UNAUTHORIZED';
        station.mismatch_count = (station.mismatch_count || 0) + 1;
        this.recordAccessEvent({
          sessionId: activeSession.id,
          consoleId: station.id,
          eventType: 'GAME_MISMATCH_DETECTED',
          result: 'FAILED',
          details: `⚠️ UNAUTHORIZED APP LAUNCH BLOCKED: Player tried running "${current}". Only "${allowed}" is allowed. Android TV Kiosk returned to launcher.`,
        });
      }
    } else if (!activeSession && params.currentForegroundPackage && params.currentForegroundPackage !== 'com.playstation.kiosk') {
      // No active session paid, but user somehow launched an app! Force lock to kiosk
      enforceAction = 'LOCK_KIOSK';
      station.current_foreground_app = 'com.playstation.kiosk';
    }

    this.save();
    return {
      success: true,
      station,
      activeSession,
      enforceAction,
      allowedPackage: station.allowed_package_name || null,
    };
  }

  public handleGameMismatchViolation(params: {
    stationCode: string;
    attemptedPackage: string;
    reason?: string;
  }): {
    blocked: boolean;
    stationCode: string;
    allowedPackage: string | null;
    attemptedPackage: string;
    mismatchCount: number;
    smartPlugTriggered: boolean;
    actionTaken: string;
  } {
    const station = this.data.consoles.find(
      (c) => c.station_code === params.stationCode || c.id === params.stationCode
    );

    const stationCode = station ? station.station_code : params.stationCode;
    const allowed = station ? station.allowed_package_name : null;
    let smartPlugTriggered = false;

    if (station) {
      station.mismatch_count = (station.mismatch_count || 0) + 1;
      station.current_foreground_app = 'com.playstation.kiosk'; // Forced back to Kiosk

      // If user repeated violation 3 times, trigger Smart Plug power backup cut!
      if (station.mismatch_count >= 3) {
        station.smart_plug_state = 'OFF';
        smartPlugTriggered = true;
      }

      this.recordAccessEvent({
        sessionId: station.current_session_id || null,
        consoleId: station.id,
        eventType: 'GAME_MISMATCH_SECURITY_ACTION',
        result: 'SUCCESS',
        details: `[Android TV Box ${stationCode}] Force-killed "${params.attemptedPackage}". Returned to Kiosk. Strike #${station.mismatch_count}${
          smartPlugTriggered ? ' — SMART PLUG POWER CUT TRIGGERED AS BACKUP!' : ''
        }`,
      });

      this.save();
    }

    return {
      blocked: true,
      stationCode,
      allowedPackage: allowed || null,
      attemptedPackage: params.attemptedPackage,
      mismatchCount: station?.mismatch_count || 1,
      smartPlugTriggered,
      actionTaken: smartPlugTriggered
        ? 'App force-closed + Smart Plug power cut after 3 strikes.'
        : 'App force-closed + Foreground returned to Kiosk Launcher.',
    };
  }

  public simulateAppSwitch(consoleId: string, attemptedPackage: string) {
    const station = this.getConsoleById(consoleId);
    if (!station) throw new Error('Console station not found');

    const allowed = station.allowed_package_name;
    const isMismatch = allowed && attemptedPackage !== allowed && attemptedPackage !== 'com.playstation.kiosk';

    if (isMismatch) {
      station.current_foreground_app = 'com.playstation.kiosk';
      return this.handleGameMismatchViolation({
        stationCode: station.station_code,
        attemptedPackage,
        reason: 'Simulated user launch of unauthorized game on Android TV Box',
      });
    }

    station.current_foreground_app = attemptedPackage;
    this.recordAccessEvent({
      sessionId: station.current_session_id || null,
      consoleId: station.id,
      eventType: 'APP_LAUNCH_AUTHORIZED',
      result: 'SUCCESS',
      details: `[Android TV] Verified allowed game "${attemptedPackage}" running on ${station.station_code}.`,
    });
    this.save();

    return {
      blocked: false,
      stationCode: station.station_code,
      allowedPackage: allowed || null,
      attemptedPackage,
      mismatchCount: station.mismatch_count || 0,
      smartPlugTriggered: false,
      actionTaken: 'App allowed to run in foreground.',
    };
  }
}

export const db = new Database();

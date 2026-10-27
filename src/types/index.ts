export type UserRole = 'admin' | 'operator';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  genre: string;
  package_name: string; // e.g. com.rockstargames.gtav (Android package ID)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  game_id: string;
  name: string;
  duration_seconds: number;
  price_tzs: number;
  allowed_package_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ConsoleStatus = 'available' | 'occupied' | 'starting' | 'maintenance';
export type AccessAdapterType =
  | 'ANDROID_TV_KIOSK_MONITOR'
  | 'HDMI_RELAY_SHELLY'
  | 'SMART_PLUG_SONOFF'
  | 'NETWORK_UDP_CONTROLLER'
  | 'VIRTUAL_SIMULATOR';

export interface ConsoleStation {
  id: string;
  name: string;
  console_type: 'Android TV Box' | 'Nvidia Shield TV' | 'PS4 Pro' | 'PS4 Slim' | 'PS4 Standard';
  station_code: string;
  status: ConsoleStatus;
  access_adapter: AccessAdapterType;
  relay_state: 'CONNECTED' | 'DISCONNECTED';
  ip_address: string;
  current_session_id?: string | null;
  allowed_package_name?: string | null;
  current_foreground_app?: string | null;
  mismatch_count?: number;
  smart_plug_state?: 'ON' | 'OFF';
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'mobile_money' | 'voucher';

export interface Order {
  id: string;
  order_reference: string;
  game_id: string;
  package_id: string;
  console_id: string;
  allowed_package_name?: string;
  price_tzs: number;
  duration_seconds: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  customer_phone?: string;
  created_at: string;
  paid_at?: string | null;
}

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type MobileProvider = 'mpesa' | 'tigopesa' | 'airtel' | 'halopesa' | 'voucher';

export interface Payment {
  id: string;
  order_id: string;
  provider: MobileProvider;
  provider_reference: string;
  amount_tzs: number;
  currency: string;
  status: PaymentStatus;
  idempotency_key: string;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type VoucherStatus = 'unused' | 'reserved' | 'redeemed' | 'expired' | 'disabled';

export interface Voucher {
  id: string;
  pin_display: string;
  pin_hash: string;
  game_id: string | null; // null if universal
  package_id: string | null;
  value_tzs: number | null;
  duration_seconds: number | null;
  status: VoucherStatus;
  expires_at: string | null;
  created_at: string;
  batch_id?: string;
}

export interface VoucherRedemption {
  id: string;
  voucher_id: string;
  order_id: string;
  session_id: string;
  redeemed_at: string;
}

export type SessionStatus =
  | 'pending_payment'
  | 'ready'
  | 'starting'
  | 'active'
  | 'paused'
  | 'ending'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'recovery_required';

export interface Session {
  id: string;
  order_id: string;
  console_id: string;
  game_id: string;
  package_id: string;
  allowed_package_name?: string;
  customer_phone?: string;
  status: SessionStatus;
  started_at: string | null;
  ends_at: string | null;
  ended_at: string | null;
  access_status: 'ACCESS_GRANTED' | 'ACCESS_REVOKED' | 'STANDBY';
  duration_purchased: number; // in seconds
  mismatch_violations?: number;
  created_at: string;
  updated_at: string;
}

export interface AccessEvent {
  id: string;
  session_id: string | null;
  console_id: string;
  event_type: string;
  result: 'SUCCESS' | 'FAILED';
  details: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  revenueToday: number;
  completedSessions: number;
  activeSessions: number;
  pendingPayments: number;
  failedPayments: number;
  availableConsoles: number;
  totalConsoles: number;
  vouchersUnused: number;
  vouchersRedeemed: number;
  revenueByGame: { gameName: string; amount: number; count: number }[];
  revenueByPaymentMethod: { method: string; amount: number; count: number }[];
  revenueByPeriod: { date: string; amount: number }[];
}

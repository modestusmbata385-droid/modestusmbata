import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Send,
  Sparkles,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Game, Package, ConsoleStation, Session, MobileProvider } from '../types/index';
import {
  createOrder,
  initiateMobilePayment,
  confirmMobilePaymentSimulated,
  redeemVoucher,
} from '../services/api';
import { Language, translations } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  packageData: Package;
  consoleStation: ConsoleStation;
  initialMethod: 'mobile_money' | 'voucher';
  lang: Language;
  onSessionCreated: (session: Session) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  game,
  packageData,
  consoleStation,
  initialMethod,
  lang,
  onSessionCreated,
}) => {
  const t = translations[lang];

  const [method, setMethod] = useState<'mobile_money' | 'voucher'>(initialMethod);
  const [provider, setProvider] = useState<MobileProvider>('mpesa');
  const [phone, setPhone] = useState('0754123456');
  const [voucherPin, setVoucherPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // USSD Push prompt simulation state
  const [ussdPrompt, setUssdPrompt] = useState<{
    paymentId: string;
    message: string;
    amount: number;
    phone: string;
  } | null>(null);

  if (!isOpen) return null;

  // Auto-detect mobile provider from Tanzanian prefix
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const cleaned = val.replace(/\s+/g, '');
    if (cleaned.startsWith('074') || cleaned.startsWith('075') || cleaned.startsWith('076')) {
      setProvider('mpesa');
    } else if (cleaned.startsWith('071') || cleaned.startsWith('065') || cleaned.startsWith('067')) {
      setProvider('tigopesa');
    } else if (cleaned.startsWith('078') || cleaned.startsWith('068') || cleaned.startsWith('069')) {
      setProvider('airtel');
    } else if (cleaned.startsWith('062')) {
      setProvider('halopesa');
    }
  };

  const handleMobileMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    soundManager.playClickSound();

    try {
      // 1. Create order
      const orderRes = await createOrder({
        gameId: game.id,
        packageId: packageData.id,
        consoleId: consoleStation.id,
        paymentMethod: 'mobile_money',
        customerPhone: phone,
      });

      if (!orderRes.success || !orderRes.order) {
        setErrorMsg(orderRes.error || 'Imeshindikana kuunda order.');
        setIsSubmitting(false);
        return;
      }

      // 2. Initiate mobile money
      const payRes = await initiateMobilePayment({
        orderReference: orderRes.order.order_reference,
        phone,
        provider,
      });

      if (!payRes.success || !payRes.payment) {
        setErrorMsg(payRes.error || 'Malipo hayakuweza kuanzishwa.');
        setIsSubmitting(false);
        return;
      }

      // Open interactive simulated USSD prompt
      setUssdPrompt({
        paymentId: payRes.payment.id,
        message: payRes.ussdPromptSimulated || `Kiasi: TSh ${packageData.price_tzs.toLocaleString()}`,
        amount: packageData.price_tzs,
        phone,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya mtandao.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete USSD push with simulated PIN entry
  const handleConfirmUssd = async () => {
    if (!ussdPrompt) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    soundManager.playClickSound();

    try {
      const confirmRes = await confirmMobilePaymentSimulated({
        paymentId: ussdPrompt.paymentId,
      });

      if (confirmRes.success && confirmRes.session) {
        soundManager.playStartSound();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore if canvas blocked
        }
        onSessionCreated(confirmRes.session);
      } else {
        setErrorMsg(confirmRes.error || 'Malipo hayakuthibitishwa.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu wakati wa kuthibitisha malipo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherPin.trim()) {
      setErrorMsg(lang === 'sw' ? 'Tafadhali ingiza PIN ya vocha.' : 'Please enter voucher PIN.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    soundManager.playClickSound();

    try {
      const res = await redeemVoucher({
        pin: voucherPin.trim(),
        gameId: game.id,
        packageId: packageData.id,
        consoleId: consoleStation.id,
      });

      if (res.success && res.session) {
        soundManager.playStartSound();
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch (e) {}
        onSessionCreated(res.session);
      } else {
        setErrorMsg(res.error || 'Vocha siyo sahihi au imekwisha tumika.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya uthibitishaji wa vocha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              {lang === 'sw' ? 'Malipo Salama' : 'Secure Payment'}
            </span>
            <h3 className="text-xl font-black text-white">
              {t.payAndPlay}
            </h3>
          </div>
          <button
            onClick={() => {
              soundManager.playClickSound();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Quick Pill */}
        <div className="my-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-white">{game.name}</p>
            <p className="text-slate-400">
              {packageData.name} ({Math.round(packageData.duration_seconds / 60)} {t.minutes}) • {consoleStation.station_code}
            </p>
          </div>
          <div className="text-right">
            <span className="text-base font-black text-emerald-400">
              {t.currency} {packageData.price_tzs.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Tabs: Mobile Money vs Voucher */}
        {!ussdPrompt && (
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-5">
            <button
              onClick={() => {
                soundManager.playClickSound();
                setMethod('mobile_money');
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                method === 'mobile_money'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Mobile Money</span>
            </button>
            <button
              onClick={() => {
                soundManager.playClickSound();
                setMethod('voucher');
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                method === 'voucher'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Vocha ya PIN</span>
            </button>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* USSD Prompt Simulation Modal overlay inside payment modal */}
        {ussdPrompt ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/50 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <Smartphone className="w-4 h-4 animate-bounce" />
                <span>Simulated Mobile Money USSD Push Prompt</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 space-y-2">
                <p className="text-slate-300">
                  {provider.toUpperCase()} PUSH NOTIFICATION:
                </p>
                <p className="text-white font-bold">
                  PLAYSTATION GAMING LOUNGE
                </p>
                <p className="text-amber-300">
                  Kiasi: TSh {ussdPrompt.amount.toLocaleString()}
                </p>
                <p className="text-slate-400">
                  Simu: {ussdPrompt.phone}
                </p>
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>PIN ya Usalama imeingizwa (Simulated Secure PIN)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setUssdPrompt(null)}
                className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Ghairi / Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmUssd}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Thibitisha Malipo & Cheza</span>
              </button>
            </div>
          </div>
        ) : method === 'mobile_money' ? (
          /* Mobile Money Form */
          <form onSubmit={handleMobileMoneySubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Chagua Mtandao wa Simu (Mobile Network):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'mpesa', name: 'M-Pesa', color: 'border-red-600/50 hover:bg-red-950/20 text-red-400' },
                  { id: 'tigopesa', name: 'Tigo Pesa', color: 'border-blue-600/50 hover:bg-blue-950/20 text-blue-400' },
                  { id: 'airtel', name: 'Airtel', color: 'border-amber-600/50 hover:bg-amber-950/20 text-amber-400' },
                  { id: 'halopesa', name: 'HaloPesa', color: 'border-orange-600/50 hover:bg-orange-950/20 text-orange-400' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      soundManager.playClickSound();
                      setProvider(item.id as MobileProvider);
                    }}
                    className={`py-2 px-1 rounded-xl border text-[11px] font-bold text-center transition-all ${
                      provider === item.id
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-md ring-1 ring-emerald-500'
                        : `border-slate-800 bg-slate-950/60 text-slate-400 ${item.color}`
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                {t.enterPhone} (Vodacom, Tigo, Airtel, Halotel):
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="0754 123 456 au +255 7..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-3 text-xs text-slate-500 uppercase font-bold">
                  TZ (+255)
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-sm font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.verifying}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{lang === 'sw' ? 'Tuma Ombi la Malipo (USSD)' : 'Initiate Mobile Payment'}</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Voucher PIN Form */
          <form onSubmit={handleVoucherSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                {t.enterVoucherPin}:
              </label>
              <input
                type="text"
                required
                value={voucherPin}
                onChange={(e) => setVoucherPin(e.target.value.toUpperCase())}
                placeholder="mfano: GTA-5MIN-7788"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono uppercase tracking-wider text-center text-base focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Test Voucher Buttons */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <p className="text-[11px] font-bold text-slate-400">{t.testVouchers}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'GTA 5-Min PIN', pin: 'GTA-5MIN-7788' },
                  { label: 'FIFA 15-Min PIN', pin: 'FIFA-15M-3321' },
                  { label: 'Tekken 10-Min PIN', pin: 'TK8-10M-9912' },
                  { label: 'Universal 30-Min PIN', pin: 'ALL-30M-5000' },
                ].map((item) => (
                  <button
                    key={item.pin}
                    type="button"
                    onClick={() => {
                      soundManager.playClickSound();
                      setVoucherPin(item.pin);
                    }}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-indigo-950/60 border border-slate-700 text-[10px] font-mono text-indigo-300 text-left transition-colors truncate"
                  >
                    • {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-black shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'sw' ? 'Inakagua PIN...' : 'Verifying PIN...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.redeemVoucherBtn}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

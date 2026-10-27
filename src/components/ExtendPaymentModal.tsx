import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Send,
  Lock,
  Sparkles,
  Banknote,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MobileProvider } from '../types/index';
import { payAndExtendSession, validateVoucher } from '../services/api';
import { Language } from '../utils/translations';
import { soundManager } from '../utils/audio';

interface ExtendOption {
  mins: number;
  secs: number;
  priceTzs: number;
  label: string;
  popular?: boolean;
}

const EXTEND_OPTIONS: ExtendOption[] = [
  { mins: 10, secs: 600, priceTzs: 1000, label: '10 Mins' },
  { mins: 20, secs: 1200, priceTzs: 2000, label: '20 Mins', popular: true },
  { mins: 30, secs: 1800, priceTzs: 3000, label: '30 Mins' },
  { mins: 60, secs: 3600, priceTzs: 5000, label: '60 Mins' },
];

interface ExtendPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  stationCode?: string;
  gameName?: string;
  lang: Language;
  onExtended: () => void;
}

export const ExtendPaymentModal: React.FC<ExtendPaymentModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  stationCode,
  gameName,
  lang,
  onExtended,
}) => {
  const [selectedOption, setSelectedOption] = useState<ExtendOption>(EXTEND_OPTIONS[1]);
  const [method, setMethod] = useState<'mobile_money' | 'voucher' | 'cash'>('mobile_money');
  const [provider, setProvider] = useState<MobileProvider>('mpesa');
  const [phone, setPhone] = useState('0754123456');
  const [voucherPin, setVoucherPin] = useState('');
  const [operatorPin, setOperatorPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // USSD Push simulation
  const [ussdPrompt, setUssdPrompt] = useState<{
    amount: number;
    phone: string;
    seconds: number;
  } | null>(null);

  if (!isOpen) return null;

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

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    soundManager.playClickSound();

    if (!phone || phone.trim().length < 9) {
      setErrorMsg(
        lang === 'sw'
          ? 'Tafadhali weka namba sahihi ya simu ya malipo.'
          : 'Please enter a valid phone number.'
      );
      return;
    }

    // Trigger USSD Push Simulator dialog
    setUssdPrompt({
      amount: selectedOption.priceTzs,
      phone: phone.trim(),
      seconds: selectedOption.secs,
    });
  };

  const handleConfirmUSSD = async () => {
    if (!ussdPrompt) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    soundManager.playClickSound();

    try {
      const res = await payAndExtendSession({
        sessionId,
        additionalSeconds: ussdPrompt.seconds,
        amountTzs: ussdPrompt.amount,
        paymentMethod: 'mobile_money',
        provider,
        customerPhone: ussdPrompt.phone,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Malipo hayakukamilika. Tafadhali jaribu tena.');
        setIsSubmitting(false);
        return;
      }

      // Success
      soundManager.playSuccessSound();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }

      setUssdPrompt(null);
      setIsSubmitting(false);
      onExtended();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya mtandao wakati wa kuthibitisha malipo.');
      setIsSubmitting(false);
    }
  };

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherPin.trim()) {
      setErrorMsg(lang === 'sw' ? 'Weka namba ya PIN ya vocha.' : 'Enter voucher PIN.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    soundManager.playClickSound();

    try {
      // Validate voucher first
      const valRes = await validateVoucher({ pin: voucherPin.trim() });
      if (!valRes.success || !valRes.valid) {
        setErrorMsg(valRes.error || 'Vocha hii si sahihi au imekwisha tumika.');
        setIsSubmitting(false);
        return;
      }

      const res = await payAndExtendSession({
        sessionId,
        additionalSeconds: selectedOption.secs,
        amountTzs: selectedOption.priceTzs,
        paymentMethod: 'voucher',
        provider: 'voucher',
        voucherPin: voucherPin.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Imeshindikana kutumia vocha kwa nyongeza hii.');
        setIsSubmitting(false);
        return;
      }

      soundManager.playSuccessSound();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }

      setIsSubmitting(false);
      onExtended();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya mfumo wa vocha.');
      setIsSubmitting(false);
    }
  };

  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorPin.trim()) {
      setErrorMsg(lang === 'sw' ? 'Weka PIN ya mhudumu (Operator PIN).' : 'Enter operator PIN.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    soundManager.playClickSound();

    try {
      const res = await payAndExtendSession({
        sessionId,
        additionalSeconds: selectedOption.secs,
        amountTzs: selectedOption.priceTzs,
        paymentMethod: 'cash',
        provider: 'cash',
        operatorPin: operatorPin.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'PIN ya mhudumu si sahihi.');
        setIsSubmitting(false);
        return;
      }

      soundManager.playSuccessSound();
      setIsSubmitting(false);
      onExtended();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu ya kuthibitisha malipo ya taslimu.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>{lang === 'sw' ? 'Ongeza Muda wa Mchezo' : 'Extend Game Session'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                  {lang === 'sw' ? 'Inahitaji Malipo' : 'Payment Required'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {stationCode || 'Station'} • {gameName || 'PlayStation'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClickSound();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Policy Banner */}
          <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              {lang === 'sw'
                ? 'Sheria ya Kituo: Kuongeza dakika lazima kuambatane na malipo kamili (M-Pesa / Tigo Pesa / Vocha / Fedha Taslimu) ili kuzuia matumizi yasiyoruhusiwa.'
                : 'Station Rule: Session extensions require verified payment (Mobile Money, Voucher, or Cash) before extra minutes are credited.'}
            </span>
          </div>

          {/* 1. Step: Choose Extension Tier */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {lang === 'sw' ? '1. Chagua Muda wa Nyongeza' : '1. Select Extension Duration'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXTEND_OPTIONS.map((opt) => {
                const isSelected = selectedOption.mins === opt.mins;
                return (
                  <button
                    key={opt.mins}
                    type="button"
                    onClick={() => {
                      soundManager.playClickSound();
                      setSelectedOption(opt);
                    }}
                    className={`relative p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {opt.popular && (
                      <span className="absolute -top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-[9px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded-full shadow">
                        POPULAR
                      </span>
                    )}
                    <span className="text-sm font-black text-white">+{opt.label}</span>
                    <span className="text-xs font-mono font-bold text-indigo-400 mt-1">
                      TSh {opt.priceTzs.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Step: Choose Payment Method */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              {lang === 'sw' ? '2. Njia ya Malipo' : '2. Payment Method'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClickSound();
                  setMethod('mobile_money');
                }}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  method === 'mobile_money'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Mobile Money</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClickSound();
                  setMethod('voucher');
                }}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  method === 'voucher'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <Ticket className="w-4 h-4 text-purple-400" />
                <span>{lang === 'sw' ? 'Vocha PIN' : 'Voucher PIN'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playClickSound();
                  setMethod('cash');
                }}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  method === 'cash'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <Banknote className="w-4 h-4 text-amber-400" />
                <span>{lang === 'sw' ? 'Taslimu (Cash)' : 'Cash / Counter'}</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Content based on chosen method */}
          {method === 'mobile_money' && (
            <form onSubmit={handleMobileSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                  {lang === 'sw' ? 'Namba ya Simu (M-Pesa / Tigo / Airtel)' : 'Mobile Money Phone Number'}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="0754XXXXXX au 0713XXXXXX"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="absolute right-3 top-3 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-300">
                    {provider.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Provider Selection chips */}
              <div className="flex gap-2">
                {[
                  { id: 'mpesa', name: 'M-Pesa', color: 'text-red-400' },
                  { id: 'tigopesa', name: 'Tigo Pesa', color: 'text-blue-400' },
                  { id: 'airtel', name: 'Airtel Money', color: 'text-rose-400' },
                  { id: 'halopesa', name: 'HaloPesa', color: 'text-orange-400' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      soundManager.playClickSound();
                      setProvider(p.id as MobileProvider);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                      provider === p.id
                        ? 'border-indigo-500 bg-indigo-950/40 text-white'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>
                  {lang === 'sw'
                    ? `Lipa TSh ${selectedOption.priceTzs.toLocaleString()} (${selectedOption.label})`
                    : `Pay TSh ${selectedOption.priceTzs.toLocaleString()} (${selectedOption.label})`}
                </span>
              </button>
            </form>
          )}

          {method === 'voucher' && (
            <form onSubmit={handleVoucherSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                  {lang === 'sw' ? 'Weka Namba ya PIN ya Vocha' : 'Enter Voucher PIN'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={voucherPin}
                    onChange={(e) => setVoucherPin(e.target.value.toUpperCase())}
                    placeholder="VCH-1234-ABCD"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase tracking-wider text-sm placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                  <Ticket className="absolute right-3 top-3.5 w-4 h-4 text-purple-400" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {lang === 'sw'
                    ? 'Nunua vocha ya dakika kutoka kwa mhudumu wa kituo.'
                    : 'Buy extension vouchers from station counter cashier.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {isSubmitting
                    ? lang === 'sw' ? 'Inahakiki...' : 'Verifying...'
                    : lang === 'sw' ? 'Hakiki & Ongeza Dakika' : 'Verify & Add Minutes'}
                </span>
              </button>
            </form>
          )}

          {method === 'cash' && (
            <form onSubmit={handleCashSubmit} className="space-y-4">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                <p className="font-bold text-amber-400 mb-1">
                  {lang === 'sw' ? 'Malipo ya Taslimu Kaunta:' : 'Over-the-Counter Cash:'}
                </p>
                <p>
                  {lang === 'sw'
                    ? `Mteja amelipa TSh ${selectedOption.priceTzs.toLocaleString()} mkononi kwa ajili ya dakika ${selectedOption.mins}. Mhudumu aweke PIN kuthibitisha.`
                    : `Customer paid TSh ${selectedOption.priceTzs.toLocaleString()} cash for ${selectedOption.mins} mins. Enter operator PIN to activate.`}
                </p>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                  {lang === 'sw' ? 'PIN ya Mhudumu (Operator PIN)' : 'Operator PIN'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={operatorPin}
                    onChange={(e) => setOperatorPin(e.target.value)}
                    placeholder="Weka PIN ya mhudumu (Default: 1234)"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <Lock className="absolute right-3 top-3.5 w-4 h-4 text-amber-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>
                  {isSubmitting
                    ? lang === 'sw' ? 'Inathibitisha...' : 'Authorizing...'
                    : lang === 'sw' ? 'Thibitisha Pokeo la Fedha & Ongeza' : 'Confirm Cash Received & Extend'}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>
            {lang === 'sw' ? 'Muda uliochaguliwa:' : 'Selected Duration:'}{' '}
            <strong className="text-white">+{selectedOption.label}</strong>
          </span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            TSh {selectedOption.priceTzs.toLocaleString()}
          </span>
        </div>

        {/* USSD Push Simulation Dialog */}
        {ussdPrompt && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl text-center">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center border border-emerald-500/30">
                <Smartphone className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">
                  {lang === 'sw' ? 'Ombi la Malipo Limerushwa Simuni' : 'USSD Push Sent to Mobile'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'sw'
                    ? `Tafadhali ingiza PIN ya ${provider.toUpperCase()} kwenye simu ${ussdPrompt.phone} kuthibitisha malipo ya TSh ${ussdPrompt.amount.toLocaleString()}.`
                    : `Please enter your ${provider.toUpperCase()} PIN on mobile ${ussdPrompt.phone} to authorize TSh ${ussdPrompt.amount.toLocaleString()}.`}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300">
                <div>Kiasi: TSh {ussdPrompt.amount.toLocaleString()}</div>
                <div>Nyongeza: +{Math.round(ussdPrompt.seconds / 60)} Dakika</div>
                <div>Mtandao: {provider.toUpperCase()}</div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setUssdPrompt(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmUSSD}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{lang === 'sw' ? 'Weka PIN / Thibitisha' : 'Confirm PIN Paid'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

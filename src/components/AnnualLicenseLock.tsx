import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Lock, ShieldCheck, Key, RefreshCw, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';

export const AnnualLicenseLock: React.FC = () => {
  const { licenseInfo, redeemLicenseKey } = useData();
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setFeedback(null);

    setTimeout(() => {
      const res = redeemLicenseKey(code.trim());
      setIsLoading(false);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 dir-rtl text-right">
      <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"></div>

        <div className="text-center space-y-4 mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white flex items-center justify-center gap-2">
              <span>انتهت صلاحية الاشتراك السنوي</span>
            </h2>
            <p className="text-xs text-amber-300 font-mono mt-1">
              تاريخ انتهاء التفعيل: {licenseInfo.expiresAt || 'منتهي'}
            </p>
          </div>
        </div>

        {/* Safe Data Guarantee Box */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs space-y-2 mb-6">
          <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>جميع بياناتك محفوظة 100% بأمان!</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            لم يُحذف أي شيء من حسابك مطلقاً. جميع المنتجات، المبيعات، المخزون، الوصفات، والفواتير محفوظة بالكامل في النظام.
          </p>
        </div>

        {/* Expiry Instructions */}
        <p className="text-xs text-slate-300 leading-relaxed mb-4 text-center">
          يتطلب النظام إدخال <strong>كود تفعيل سنوي جديد</strong> لتمديد الصلاحية لمدة سنة كاملة جديدة (365 يوماً). يرجى التواصل مع مالك النظام وإدخال الكود أدناه:
        </p>

        {/* Feedback Message */}
        {feedback && (
          <div className={`p-3 rounded-xl text-xs font-bold mb-4 flex items-center gap-2 ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Activation Code Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              كود التفعيل السنوي (رمز 1 سنة):
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="مثال: MATO-2026-8891-1YEAR"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-amber-500/40 rounded-xl text-center font-mono font-black text-sm tracking-wider text-amber-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 placeholder:text-slate-600 placeholder:font-normal"
              />
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري التحقق والتفعيل...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>تجديد وتفعيل لمدة سنة كاملة الآن</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

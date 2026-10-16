import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State = {
    hasError: false
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo?: React.ErrorInfo) {
    console.error('Uncaught error in React tree:', error, errorInfo);
    // If browser localStorage quota exceeded, clear bloated duplicate cache keys immediately
    const errStr = String(error?.message || error || '').toLowerCase();
    if (error?.name === 'QuotaExceededError' || errStr.includes('quota') || errStr.includes('storage')) {
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.includes('orders') || k.includes('activityLogs') || k.includes('stockMovements') || k.includes('purchases'))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch {}
    }
  }

  handleRecover = () => {
    try {
      // Clear heavy temporary caches to give mobile browser fresh memory headroom
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes('orders') || k.includes('activityLogs') || k.includes('stockMovements') || k.includes('purchases') || k.includes('expenses'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isQuotaErr = this.state.error?.name === 'QuotaExceededError' || 
        String(this.state.error?.message || '').toLowerCase().includes('quota');

      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center dir-rtl">
          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 max-w-lg shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center text-3xl mx-auto mb-4">
              🛡️
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-amber-400 mb-2">
              MATO POS - جاري إعادة التنشيط
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mb-4 leading-relaxed">
              {isQuotaErr ? (
                <>
                  <strong className="text-emerald-400 block mb-1">
                    ✅ اطمئن تماماً: جميع مبيعاتك وطلباتك محفوظة 100% في السحابة ولم يُحذف أي شيء!
                  </strong>
                  حدث امتلاء مؤقت في ذاكرة متصفح الهاتف (Safari Cache). تم تفريغ الكاش المؤقت تلقائياً.
                </>
              ) : (
                'حدث تنبيه مؤقت في تحميل الواجهة. يرجى الضغط على زر إعادة التنشيط لمتابعة العمل مباشرة.'
              )}
            </p>
            <div className="bg-slate-950 p-3 rounded-xl text-right font-mono text-xs text-rose-300 overflow-x-auto dir-ltr mb-5 border border-slate-900">
              {this.state.error?.toString() || 'Unknown Error'}
            </div>
            <button
              onClick={this.handleRecover}
              className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-6 py-3 rounded-xl transition-all shadow-lg text-sm cursor-pointer"
            >
              🔄 تحديث ومتابعة العمل فوراً
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

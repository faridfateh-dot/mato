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
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center dir-rtl">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-lg shadow-xl">
            <h1 className="text-2xl font-bold text-amber-400 mb-3">MATO POS - جاري إعادة التحميل</h1>
            <p className="text-slate-300 text-sm mb-6">
              حدث خطأ مؤقت في تحميل الواجهة. يرجى الضغط على زر إعادة التحميل لمتابعة العمل.
            </p>
            <div className="bg-slate-950 p-3 rounded text-right font-mono text-xs text-rose-300 overflow-x-auto dir-ltr mb-6">
              {this.state.error?.toString() || 'Unknown Error'}
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg text-sm"
            >
              تحديث الصفحة وإعادة التشغيل
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

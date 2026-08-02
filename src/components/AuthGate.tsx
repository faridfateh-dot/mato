import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { verifyActivationCodeInFirestore } from '../lib/firebase';
import {
  Store,
  Mail,
  Phone,
  Lock,
  User as UserIcon,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Send,
  RefreshCw,
  Zap,
  Check,
  KeyRound,
  Key
} from 'lucide-react';


interface AuthGateProps {
  onClose?: () => void;
  isModalMode?: boolean;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onClose, isModalMode = false }) => {
  const { registerNewTenant, loginUser, users } = useData();

  const [mode, setMode] = useState<'login' | 'register' | 'code_activation'>('login');

  // Annual Activation Code State for Subscribers
  const [annualCodeInput, setAnnualCodeInput] = useState('');
  const [codeVerificationLoading, setCodeVerificationLoading] = useState(false);
  const [codeVerificationResult, setCodeVerificationResult] = useState<{
    success?: boolean;
    message?: string;
    restaurantName?: string;
    expiresAt?: string;
  } | null>(null);

  // Login Form State

  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration Form State
  const [regMethod, setRegMethod] = useState<'email' | 'phone'>('email');
  const [regContact, setRegContact] = useState('');
  const [regRestaurantName, setRegRestaurantName] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  // Verification Step State
  const [verificationStep, setVerificationStep] = useState<'contact' | 'code' | 'details'>('contact');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [userEnteredCode, setUserEnteredCode] = useState<string>('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Send Verification Link / Code
  const handleSendVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regContact.trim()) return;

    setIsSendingCode(true);
    setTimeout(() => {
      // Generate a random 6-digit code for simulation
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setIsSendingCode(false);
      setVerificationStep('code');
    }, 600);
  };

  // Verify Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (userEnteredCode.trim() === generatedCode || userEnteredCode.trim() === '123456') {
      setVerificationSuccess(true);
      setCodeError(null);
      setTimeout(() => {
        setVerificationStep('details');
      }, 500);
    } else {
      setCodeError('رمز التفعيل غير صحيح، حاول مرة أخرى أو اضغط تفعيل تلقائي');
    }
  };

  // Auto verify shortcut
  const handleAutoVerifyLink = () => {
    setUserEnteredCode(generatedCode);
    setVerificationSuccess(true);
    setCodeError(null);
    setTimeout(() => {
      setVerificationStep('details');
    }, 400);
  };

  // Finalize Registration
  const handleFinalizeRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regRestaurantName.trim() || !regOwnerName.trim()) return;

    registerNewTenant(
      regRestaurantName.trim(),
      regOwnerName.trim(),
      regContact.trim(),
      regMethod,
      regPassword || '123456'
    );

    if (onClose) onClose();
  };

  // Handle Subscriber Activation Code Verification via Firebase Cloud Firestore
  const handleVerifySubscriberCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annualCodeInput.trim()) return;

    setCodeVerificationLoading(true);
    setCodeVerificationResult(null);

    const result = await verifyActivationCodeInFirestore(annualCodeInput.trim());

    setCodeVerificationLoading(false);
    if (result.valid) {
      setCodeVerificationResult({
        success: true,
        message: result.message,
        restaurantName: result.restaurant?.name,
        expiresAt: result.restaurant?.subscriptionExpiry
      });

      // Auto provision clean workspace for subscriber
      setTimeout(() => {
        registerNewTenant(
          result.restaurant?.name || 'مطعم المشترك المفعّل',
          result.restaurant?.ownerName || 'مدير المطعم (المشترك)',
          result.restaurant?.phone || 'subscriber@mato.sy',
          'email',
          '123456'
        );
        if (onClose) onClose();
      }, 1200);
    } else {

      setCodeVerificationResult({
        success: false,
        message: result.message
      });
    }
  };

  // Handle Login Submit

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailOrPhone.trim()) return;

    const success = loginUser(loginEmailOrPhone.trim());
    if (success) {
      if (onClose) onClose();
    } else {
      setLoginError('لم يتم العثور على الحساب، يرجى التأكد من البيانات أو إنشاء حساب جديد.');
    }
  };

  const content = (
    <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 dir-rtl">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 text-center relative">
        {isModalMode && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        )}
        
        <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 mx-auto flex items-center justify-center font-black text-3xl shadow-xl shadow-amber-400/20 mb-3">
          M
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <span>منظومة MATO POS & SaaS</span>
          <span className="text-xs bg-amber-400/20 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
            V4.5 Offline
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          نظام إدارة الكاشير والمطاعم الذكي — العمل دون إنترنت، حسابات مستقلة معزولة، ومزامنة فورية
        </p>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 max-w-md mx-auto mt-5">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'login'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'register'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            حساب جديد
          </button>
          <button
            onClick={() => setMode('code_activation')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'code_activation'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>كود التفعيل السنوي</span>
          </button>
        </div>
      </div>

      {/* Body Area */}
      <div className="p-6 space-y-5">

        {/* ================= MODE: ANNUAL ACTIVATION CODE (SUBSCRIBER GATE) ================= */}
        {mode === 'code_activation' && (
          <form onSubmit={handleVerifySubscriberCode} className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-200 text-xs space-y-1">
              <div className="font-black text-amber-400 flex items-center gap-1.5 text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>شاشة دخول المشتركين عبر كود التفعيل السنوي السحابي</span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                أدخل كود التفعيل السنوي الخاص بمطعمك للتحقق المباشر من قاعدة بيانات Firebase السحابية وفتح برنامج الكاشير
              </p>
            </div>

            {codeVerificationResult && (
              <div className={`p-4 rounded-2xl border text-xs font-bold ${
                codeVerificationResult.success
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}>
                {codeVerificationResult.success ? (
                  <div className="space-y-1 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-black text-sm text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{codeVerificationResult.message}</span>
                    </div>
                    {codeVerificationResult.restaurantName && (
                      <div className="text-xs text-emerald-200">
                        المطعم: <strong>{codeVerificationResult.restaurantName}</strong>
                      </div>
                    )}
                    {codeVerificationResult.expiresAt && (
                      <div className="text-[11px] text-emerald-300/80 dir-ltr">
                        صلاحية الاشتراك حتى: {new Date(codeVerificationResult.expiresAt).toLocaleDateString('ar-SY')}
                      </div>
                    )}
                    <div className="text-[10px] text-emerald-400/80 pt-1 animate-pulse">
                      جاري فتح منظومة الكاشير المعزولة لمطعمك... 🚀
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{codeVerificationResult.message}</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كود التفعيل السنوي الخاص بالمطعم
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: MATO-2026-8812"
                  value={annualCodeInput}
                  onChange={e => setAnnualCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-amber-400 font-mono font-black text-sm text-center tracking-wider focus:outline-none focus:border-amber-400 uppercase"
                />
                <Key className="w-4 h-4 text-amber-400 absolute left-3 top-3.5" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                الكود يُمنح للمطعم بعد سداد الاشتراك السنوي عبر مدير المنصة الأدمن
              </p>
            </div>

            <button
              type="submit"
              disabled={codeVerificationLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-400/20 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {codeVerificationLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>جاري التحقق من قاعدة بيانات Firebase السحابية...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>التحقق من الكود السحابي وفتح البرنامج</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-800">
              💡 ليس لديك كود تفعيل بعد؟ يمكنك تفعيل كود تجريبي مثل <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">MATO-2026-DEMO</code> أو إنشاء حساب جديد.
            </div>
          </form>
        )}

        {/* ================= MODE: LOGIN ================= */}

        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-bold">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                البريد الإلكتروني أو رقم الهاتف
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: owner@mato.sy أو +963991234567"
                  value={loginEmailOrPhone}
                  onChange={e => setLoginEmailOrPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>تسجيل الدخول وفتح النظام</span>
            </button>

          </form>
        )}

        {/* ================= MODE: REGISTER NEW ACCOUNT ================= */}
        {mode === 'register' && (
          <div className="space-y-4">
            
            {/* Step 1: Verification method selection & Contact input */}
            {verificationStep === 'contact' && (
              <form onSubmit={handleSendVerification} className="space-y-4">
                
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>إنشاء حساب مطعم مستقل ونظيف (Fresh & Isolated):</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    عند تسجيل حساب جديد، يتم إنشاء قاعدة بيانات فارغة ومستقلة خصيصاً لمطعمك، مع إرسال رابط وتأكيد التفعيل إلى بريدك أو هاتفك.
                  </p>
                </div>

                {/* Method selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    طريقة استلام رابط ورمز التفعيل:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegMethod('email')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        regMethod === 'email'
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      <span>عبر البريد الإلكتروني</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegMethod('phone')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        regMethod === 'phone'
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      <span>عبر رقم الهاتف (SMS / WhatsApp)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {regMethod === 'email' ? 'أدخل البريد الإلكتروني الخاص بك *' : 'أدخل رقم الهاتف للتحقق *'}
                  </label>
                  <div className="relative">
                    <input
                      type={regMethod === 'email' ? 'email' : 'tel'}
                      required
                      placeholder={regMethod === 'email' ? 'manager@myrestaurant.com' : '+963 991 234 567'}
                      value={regContact}
                      onChange={e => setRegContact(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                    {regMethod === 'email' ? (
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    ) : (
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSendingCode}
                  className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingCode ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال رابط التفعيل...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال رابط وتأكيد التفعيل الآن</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Verification Code / Link Click Screen */}
            {verificationStep === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                
                <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                    <span>رمز التفعيل الفوري (دون الحاجة لانتظار SMS)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    يعمل النظام محلياً ومباشرة. رمز التفعيل الخاص بحسابك <strong>({regContact})</strong> يظهر أمامك الآن على الشاشة: <span className="font-mono text-base font-black text-amber-400 px-2 py-0.5 rounded bg-slate-900 border border-amber-400/40 select-all">{generatedCode}</span>
                  </p>
                </div>

                {codeError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold text-center">
                    {codeError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    أدخل رمز التفعيل المكون من 6 أرقام:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder={generatedCode}
                      value={userEnteredCode}
                      onChange={e => setUserEnteredCode(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/80 border border-amber-400/60 rounded-xl text-center font-mono font-black text-lg tracking-widest text-amber-300 focus:outline-none"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-4" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>تأكيد الرمز</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoVerifyLink}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>تأكيد رابط التفعيل تلقائياً</span>
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setVerificationStep('contact')}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    تغيير البريد / رقم الهاتف
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Account & Restaurant Details */}
            {verificationStep === 'details' && (
              <form onSubmit={handleFinalizeRegistration} className="space-y-4">
                
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم تفعيل الوسيلة ({regContact}) بنجاح! أكمل بيانات مطعمك:</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اسم المطعم / المنشأة الجديدة *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="مثال: مطعم الياسمين الشامي"
                      value={regRestaurantName}
                      onChange={e => setRegRestaurantName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اسم المدير / صاحب الحساب *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحمد الحسين"
                      value={regOwnerName}
                      onChange={e => setRegOwnerName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    كلمة المرور للحساب *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-[11px] text-slate-400 leading-relaxed">
                  🛡️ **تنبيه الاستقلالية:** سيتم إنشاء مطعمك مع مساحة عمل فارغة ونظيفة بالكامل مفصولة عن أي حسابات تانية.
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تأكيد وإنشاء المطعم المستقل الآن</span>
                </button>
              </form>
            )}

          </div>
        )}

      </div>

      {/* Footer Disclaimer */}
      <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-400" />
        <span>نظام محمي بترخيص MATO SaaS — يدعم أجهزة التابلت والكاشير والويب دون إنترنت</span>
      </div>

    </div>
  );

  if (isModalMode) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {content}
    </div>
  );
};

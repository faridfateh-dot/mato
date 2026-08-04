import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { verifyActivationCodeInFirestore, PLATFORM_OWNER_CONTACT } from '../lib/firebase';
import { UserRole, SaaSPlanType } from '../types';
import {
  Store,
  Mail,
  Phone,
  Lock,
  User as UserIcon,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Send,
  RefreshCw,
  Zap,
  Check,
  KeyRound,
  AlertTriangle,
  Building2,
  MessageCircle,
  Key,
  MapPin,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthGateProps {
  onClose?: () => void;
  isModalMode?: boolean;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onClose, isModalMode = false }) => {
  const {
    registerNewTenant,
    requestUserRegistration,
    requestRestaurantSubscription,
    loginUser,
    users,
    branches,
    currentRestaurant,
    requireOwnerApproval,
    ownerContact
  } = useData();

  const [activeTab, setActiveTab] = useState<'login' | 'register_restaurant' | 'register_staff' | 'activate_code'>('login');

  // Login State
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginStatusNotice, setLoginStatusNotice] = useState<{
    type: 'pending' | 'inactive' | 'error' | 'success';
    message: string;
  } | null>(null);

  // Restaurant Registration Form State (Fast 1-Step)
  const [restName, setRestName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [restPhone, setRestPhone] = useState('');
  const [restEmail, setRestEmail] = useState('');
  const [restCity, setRestCity] = useState('دمشق');
  const [restPlanType, setRestPlanType] = useState<SaaSPlanType>('professional');
  const [restPassword, setRestPassword] = useState('');
  const [restNotes, setRestNotes] = useState('');
  const [isSubmittingRest, setIsSubmittingRest] = useState(false);
  const [restSubmittedSuccess, setRestSubmittedSuccess] = useState<{
    requestId: string;
    restaurantName: string;
    ownerName: string;
    phone: string;
  } | null>(null);

  // Staff Registration Form State (Fast 1-Step)
  const [staffFullName, setStaffFullName] = useState('');
  const [staffContact, setStaffContact] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('Cashier');
  const [staffBranchId, setStaffBranchId] = useState<string>(branches[0]?.id || 'br_main');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [staffSubmittedSuccess, setStaffSubmittedSuccess] = useState<{
    name: string;
    contact: string;
    role: string;
    restaurant: string;
  } | null>(null);

  // Annual Code Activation State
  const [annualCodeInput, setAnnualCodeInput] = useState('');
  const [codeVerificationLoading, setCodeVerificationLoading] = useState(false);
  const [codeVerificationResult, setCodeVerificationResult] = useState<{
    success?: boolean;
    message?: string;
    restaurantName?: string;
    expiresAt?: string;
  } | null>(null);

  // Quick Login Submit Handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStatusNotice(null);
    if (!loginEmailOrPhone.trim()) return;

    const result = loginUser(loginEmailOrPhone.trim(), loginPassword.trim());
    if (result.success) {
      if (onClose) onClose();
    } else {
      if (result.status === 'pending_approval') {
        setLoginStatusNotice({
          type: 'pending',
          message: 'الحساب قيد المراجعة والموافقة: تم استلام طلبك بنجاح وهو بانتظار اعتماد وموافقة مالك المطعم لتفعيل الصلاحيات.'
        });
      } else if (result.status === 'inactive') {
        setLoginStatusNotice({
          type: 'inactive',
          message: 'تم إيقاف هذا الحساب من قبل إدارة المطعم. يرجى التواصل مع المدير.'
        });
      } else if (result.status === 'wrong_password') {
        setLoginStatusNotice({
          type: 'error',
          message: result.message || 'كلمة المرور غير صحيحة! يرجى إدخال كلمة المرور الصحيحة للحساب.'
        });
      } else {
        setLoginStatusNotice({
          type: 'error',
          message: result.message || 'لم يتم العثور على الحساب، يرجى التأكد من البيانات أو تقديم طلب تسجيل جديد.'
        });
      }
    }
  };

  // 1-Step Restaurant Registration Handler
  const handleRegisterRestaurantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restName.trim() || !ownerName.trim() || !restPhone.trim()) return;

    setIsSubmittingRest(true);

    try {
      const res = requestRestaurantSubscription({
        restaurantName: restName.trim(),
        ownerName: ownerName.trim(),
        phone: restPhone.trim(),
        email: restEmail.trim(),
        city: restCity,
        branchesCount: 1,
        planType: restPlanType,
        notes: restNotes.trim() ? `${restNotes.trim()} | كلمة المرور المقترحة: ${restPassword || '123456'}` : `كلمة المرور المقترحة: ${restPassword || '123456'}`
      });

      setRestSubmittedSuccess({
        requestId: res.requestId,
        restaurantName: restName.trim(),
        ownerName: ownerName.trim(),
        phone: restPhone.trim()
      });
    } catch (err) {
      console.error('Restaurant registration error:', err);
    } finally {
      setIsSubmittingRest(false);
    }
  };

  // 1-Step Staff Registration Handler
  const handleRegisterStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFullName.trim() || !staffContact.trim()) return;

    setIsSubmittingStaff(true);

    try {
      const result = requestUserRegistration({
        name: staffFullName.trim(),
        emailOrPhone: staffContact.trim(),
        role: staffRole,
        branchId: staffBranchId || branches[0]?.id || 'br_main',
        notes: staffNotes.trim(),
        password: staffPassword.trim() || '123456'
      });

      if (result.isPending) {
        setStaffSubmittedSuccess({
          name: staffFullName.trim(),
          contact: staffContact.trim(),
          role: staffRole,
          restaurant: currentRestaurant.name
        });
      } else {
        if (onClose) onClose();
      }
    } catch (err) {
      console.error('Staff registration error:', err);
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // Annual Code Activation Handler
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
          'phone',
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

  // Generate WhatsApp Notification Link to Farid
  const getWhatsAppNotifyUrl = (rest: { name: string; owner: string; phone: string; reqId: string }) => {
    const text = `مرحباً أستاذ فريد 👋\nتم إرسال طلب تسجيل وترخيص مطعم جديد لمنظومة MATO POS:\n🍽️ اسم المطعم: ${rest.name}\n👤 صاحب المطعم: ${rest.owner}\n📱 رقم الهاتف: ${rest.phone}\n🆔 رقم الطلب: ${rest.reqId}\n\nيرجى اعتماد الحساب وإصدار كود التفعيل السنوي. شكراً لك!`;
    const cleanNum = (ownerContact?.whatsappNumber || '963991234567').replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
  };

  const content = (
    <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 dir-rtl">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 text-center relative">
        {isModalMode && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-slate-400 hover:text-white text-lg font-bold px-2.5 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
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
            V4.5
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          نظام الكاشير وإدارة المطاعم المتكامل — تسجيل سريع وسلس مع المزامنة السحابية الفورية
        </p>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 max-w-md mx-auto mt-5">
          <button
            onClick={() => {
              setActiveTab('login');
              setLoginStatusNotice(null);
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
              activeTab === 'login'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            تسجيل الدخول
          </button>

          <button
            onClick={() => {
              setActiveTab('register_restaurant');
              setRestSubmittedSuccess(null);
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
              activeTab === 'register_restaurant'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🍽️ تسجيل مطعم جديد
          </button>

          <button
            onClick={() => {
              setActiveTab('register_staff');
              setStaffSubmittedSuccess(null);
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
              activeTab === 'register_staff'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            👤 انضمام موظف
          </button>
        </div>
      </div>

      {/* Body Area */}
      <div className="p-6 space-y-5">

        {/* ================= TAB 1: LOGIN ================= */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {loginStatusNotice && (
              <div
                className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed space-y-1.5 ${
                  loginStatusNotice.type === 'pending'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : loginStatusNotice.type === 'inactive'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300 text-center'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-black">
                  {loginStatusNotice.type === 'pending' && <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />}
                  {loginStatusNotice.type === 'inactive' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
                  <span>{loginStatusNotice.type === 'pending' ? 'الحساب بانتظار موافقة المالك' : 'تنبيه تسجيل الدخول'}</span>
                </div>
                <p className="text-[11px] font-normal text-slate-300 pr-7">
                  {loginStatusNotice.message}
                </p>
                {loginStatusNotice.type === 'pending' && (
                  <div className="pt-2">
                    <a
                      href={`https://wa.me/${(ownerContact?.whatsappNumber || '963991234567').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً أستاذ فريد، قمت بتقديم طلب تسجيل لحسابي وهو بانتظار الاعتماد. يرجى تفعيل الحساب.')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>تواصل مع فريد عبر واتساب لتسريع الموافقة</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                البريد الإلكتروني أو رقم الهاتف المسجل
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: owner@mato.sy أو 0991234567"
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
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-slate-400 hover:text-white absolute left-3 top-3.5 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>حساب تجريبي سريع: <code className="text-amber-300 font-mono">owner@mato.sy / admin</code></span>
              <button
                type="button"
                onClick={() => setActiveTab('activate_code')}
                className="text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Key className="w-3.5 h-3.5" />
                <span>تفعيل كود ترخيص</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>تسجيل الدخول الآمن</span>
            </button>

            {/* Quick help button */}
            <div className="pt-2 text-center">
              <a
                href={`https://wa.me/${(ownerContact?.whatsappNumber || '963991234567').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً أستاذ فريد، أحتاج مساعدة في تسجيل الدخول لمنظومة MATO POS.')}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-400 hover:text-emerald-400 transition-all inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>تحتاج مساعدة؟ تواصل مع الدعم الفني عبر واتساب</span>
              </a>
            </div>

          </form>
        )}

        {/* ================= TAB 2: REGISTER NEW RESTAURANT (FAST 1-STEP) ================= */}
        {activeTab === 'register_restaurant' && (
          <div>
            {!restSubmittedSuccess ? (
              <form onSubmit={handleRegisterRestaurantSubmit} className="space-y-3.5">
                
                <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs space-y-1">
                  <div className="font-black text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>تسجيل وترخيص مطعم جديد — خطوة واحدة سهلة وسريعة:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    املأ البيانات البسيطة أدناه وسيتم إنشاء سجل مطعمك فوراً وإرساله للاعتماد وإصدار كود التفعيل السنوي.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      اسم المطعم / المنشأة *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="مثال: مطعم دمشق القديمة"
                        value={restName}
                        onChange={e => setRestName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      اسم صاحب المطعم / المدير *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="مثال: محمد الأحمد"
                        value={ownerName}
                        onChange={e => setOwnerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      رقم الهاتف / الواتساب للتواصل واستلام الكود *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="مثال: 0991234567 أو +963991234567"
                        value={restPhone}
                        onChange={e => setRestPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      المدينة / المحافظة
                    </label>
                    <div className="relative">
                      <select
                        value={restCity}
                        onChange={e => setRestCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="دمشق">دمشق</option>
                        <option value="ريف دمشق">ريف دمشق</option>
                        <option value="حلب">حلب</option>
                        <option value="حمص">حمص</option>
                        <option value="اللاذقية">اللاذقية</option>
                        <option value="طرطوس">طرطوس</option>
                        <option value="حماة">حماة</option>
                        <option value="أخرى">محافظة أخرى</option>
                      </select>
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      نوع الباقة المطلوبة
                    </label>
                    <select
                      value={restPlanType}
                      onChange={e => setRestPlanType(e.target.value as SaaSPlanType)}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="professional">الباقة الاحترافية (Professional) — الأكثر طلباً</option>
                      <option value="starter">الباقة المبتدئة (Starter) — فرع واحد</option>
                      <option value="enterprise">باقة المؤسسات (Enterprise) — فروع متعددة</option>
                    </select>
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
                        value={restPassword}
                        onChange={e => setRestPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: نرغب بتجربة النظام لمدة 14 يوم أولاً..."
                    value={restNotes}
                    onChange={e => setRestNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingRest}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs transition-all shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
                >
                  {isSubmittingRest ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال طلب التسجيل...</span>
                    </>
                  ) : (
                    <>
                      <RocketIcon />
                      <span>🚀 إرسال طلب تسجيل المطعم والتفعيل الفوري</span>
                    </>
                  )}
                </button>

              </form>
            ) : (
              /* Success confirmation with direct WhatsApp notification to Farid */
              <div className="space-y-4 py-2 text-center">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">
                    تم إرسال طلب تسجيل المطعم بنجاح!
                  </h3>
                  <p className="text-xs text-emerald-300 font-bold">
                    تم حفظ طلبك سحابياً وهو جاهز للاعتماد الفوري وإصدار كود التفعيل
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-right text-xs space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">اسم المطعم:</span>
                    <span className="font-bold text-white">{restSubmittedSuccess.restaurantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">صاحب المطعم:</span>
                    <span className="font-bold text-white">{restSubmittedSuccess.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم الهاتف:</span>
                    <span className="font-mono text-amber-300">{restSubmittedSuccess.phone}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700/60 pt-2 text-[11px]">
                    <span className="text-slate-400">رقم المرجع:</span>
                    <span className="font-mono text-slate-400">{restSubmittedSuccess.requestId}</span>
                  </div>
                </div>

                {/* Direct 1-tap WhatsApp Action Button */}
                <div className="space-y-2 pt-2">
                  <a
                    href={getWhatsAppNotifyUrl({
                      name: restSubmittedSuccess.restaurantName,
                      owner: restSubmittedSuccess.ownerName,
                      phone: restSubmittedSuccess.phone,
                      reqId: restSubmittedSuccess.requestId
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>📲 إرسال إشعار مباشر لفريد على واتساب لتسريع التفعيل</span>
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        // Quick demo provision
                        registerNewTenant(
                          restSubmittedSuccess.restaurantName,
                          restSubmittedSuccess.ownerName,
                          restSubmittedSuccess.phone,
                          'phone',
                          restPassword || '123456'
                        );
                        if (onClose) onClose();
                      }}
                      className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>بدء التجربة الفورية (Demo)</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('login');
                        setLoginEmailOrPhone(restSubmittedSuccess.phone);
                        setLoginPassword(restPassword);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
                    >
                      العودة لشاشة الدخول
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: REGISTER STAFF (FAST 1-STEP) ================= */}
        {activeTab === 'register_staff' && (
          <div>
            {!staffSubmittedSuccess ? (
              <form onSubmit={handleRegisterStaffSubmit} className="space-y-3.5">
                
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4" />
                    <span>طلب انضمام موظف / كاشير لمطعم ({currentRestaurant.name}):</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    سيتم إرسال طلبك فوراً للوحة تحكم مالك المطعم لاعتماده وتحديد الصلاحيات.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الاسم الكامل للموظف *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="مثال: يوسف الشامي"
                      value={staffFullName}
                      onChange={e => setStaffFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      رقم الهاتف أو البريد *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="0991234567 أو user@mail.com"
                        value={staffContact}
                        onChange={e => setStaffContact(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      الوظيفة المطلوبة
                    </label>
                    <select
                      value={staffRole}
                      onChange={e => setStaffRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Cashier">كاشير مبيعات (Cashier)</option>
                      <option value="Manager">مدير صالة (Manager)</option>
                      <option value="Inventory Manager">أمين مستودع ومخزون</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      الفرع المطلوب
                    </label>
                    <select
                      value={staffBranchId}
                      onChange={e => setStaffBranchId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
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
                        value={staffPassword}
                        onChange={e => setStaffPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ملاحظة للمالك / سبب طلب الانضمام (اختياري)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: تم تعييني في فرع الشام..."
                    value={staffNotes}
                    onChange={e => setStaffNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingStaff}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isSubmittingStaff ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الطلب...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال طلب الانضمام للموافقة</span>
                    </>
                  )}
                </button>

              </form>
            ) : (
              <div className="space-y-4 py-2 text-center">
                <div className="w-16 h-16 rounded-3xl bg-amber-400/20 border border-amber-400/40 text-amber-400 mx-auto flex items-center justify-center animate-bounce">
                  <Clock className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">
                    تم إرسال طلب انضمام الموظف بنجاح!
                  </h3>
                  <p className="text-xs text-amber-300 font-bold">
                    حسابك بانتظار موافقة واعتماد مالك المطعم ({staffSubmittedSuccess.restaurant})
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-right text-xs space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الاسم:</span>
                    <span className="font-bold text-white">{staffSubmittedSuccess.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">وسيلة الاتصال:</span>
                    <span className="font-mono text-amber-300">{staffSubmittedSuccess.contact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الدور المطلوب:</span>
                    <span className="font-bold text-emerald-400">{staffSubmittedSuccess.role}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const result = loginUser(staffSubmittedSuccess.contact, staffPassword);
                    if (result.success && onClose) {
                      onClose();
                    } else if (result.status === 'pending_approval') {
                      alert('طلبك ما يزال قيد المراجعة وبانتظار اعتماد مالك المطعم.');
                    } else {
                      alert(result.message);
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>التحقق من حالة الموافقة والتفعيل الآن</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: ACTIVATE ANNUAL KEY ================= */}
        {activeTab === 'activate_code' && (
          <form onSubmit={handleVerifySubscriberCode} className="space-y-4">
            
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="font-bold text-xs text-amber-400 flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span>تفعيل ترخيص المشتركين السحابي (كود سنوي):</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                إذا قمت بالاشتراك واستلمت كود التفعيل السنوي من الأستاذ فريد، أدخل الكود هنا لتفعيل نسختك فوراً.
              </p>
            </div>

            {codeVerificationResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold ${
                  codeVerificationResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                }`}
              >
                <div>{codeVerificationResult.message}</div>
                {codeVerificationResult.restaurantName && (
                  <div className="mt-1 text-[11px] text-emerald-400">
                    المطعم: {codeVerificationResult.restaurantName} | الصلاحية حتى: {codeVerificationResult.expiresAt ? new Date(codeVerificationResult.expiresAt).toLocaleDateString('ar-SY') : ''}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كود التفعيل السنوي (مثال: MATO-2026-XXXX)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="MATO-2026-XXXX"
                  value={annualCodeInput}
                  onChange={e => setAnnualCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-amber-400/50 rounded-xl text-amber-300 font-mono font-black text-center tracking-widest text-base focus:outline-none focus:border-amber-400"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={codeVerificationLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {codeVerificationLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق من الكود سحابياً...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>تأكيد وتفعيل الترخيص الآن</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                العودة لتسجيل الدخول
              </button>
            </div>

          </form>
        )}

      </div>

      {/* Footer Support Info */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
        <Building2 className="w-3.5 h-3.5 text-slate-400" />
        <span>منظومة MATO POS السحابية & الأوفلاين — تطوير وإشراف م. فريد الفاتح</span>
      </div>

    </div>
  );

  if (isModalMode) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
      {content}
    </div>
  );
};

// Simple rocket icon helper
const RocketIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  ShieldCheck,
  Key,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Copy,
  Plus,
  Printer,
  Download,
  Upload,
  Zap,
  Award,
  DollarSign,
  Users,
  Store,
  FileText,
  Clock,
  AlertTriangle,
  RefreshCw,
  Check,
  Globe,
  Sliders,
  HelpCircle,
  ShoppingBag,
  Share2,
  X
} from 'lucide-react';
import { SaaSPlanType, SoftwareLicense, LicenseKeyInfo, CommercialProposal } from '../types';

export const SoftwareSalesView: React.FC = () => {
  const {
    currentRestaurant,
    branches,
    users,
    products,
    ingredients,
    suppliers,
    recipes,
    orders,
    expenses,
    licenseInfo,
    licenseKeys,
    redeemLicenseKey,
    generateLicenseKey,
    updateRestaurantBranding,
    exportSystemBackup,
    importSystemBackup,
    currentUser,
    systemRegistrations,
    deleteRegistrationRecord,
    firestoreRestaurants,
    generateAnnualActivationCode
  } = useData();


  const [activeTab, setActiveTab] = useState<'license' | 'generator' | 'plans' | 'proposal' | 'backup' | 'registrations'>('registrations');

  // Key Activation Input
  const [inputKey, setInputKey] = useState('');
  const [activationFeedback, setActivationFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New License Key Modal / Form
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({
    clientName: '',
    salesRep: currentUser.name || 'قسم المبيعات',
    planType: 'professional' as SaaSPlanType,
    durationDays: 365,
  });
  const [createdKeySuccess, setCreatedKeySuccess] = useState<string | null>(null);

  // Proposal State
  const [proposal, setProposal] = useState<CommercialProposal>({
    proposalNumber: `PROP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    clientName: 'مطعم بيت الشاورما والمشويات',
    clientPhone: '+963 991 234 567',
    restaurantType: 'مطعم ووجبات سريعة',
    selectedPlan: 'professional',
    extraBranchesCount: 2,
    customDiscountPercent: 10,
    notes: 'شامل التركيب مجاناً، تدريب الكادر على نظام POS والمخزون، والدعم الفني 24/7 لمدة سنة كاملة.',
    validUntilDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    salesRepName: currentUser.name || 'مدير المبيعات والتراخيص'
  });

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // White-label branding form
  const [brandingForm, setBrandingForm] = useState({
    name: currentRestaurant.name,
    currency: currentRestaurant.currency,
    taxNumber: currentRestaurant.taxNumber || '1029384756',
    address: currentRestaurant.address || 'دمشق - السبع بحرات',
    phone: currentRestaurant.phone || '+963 11 222 3344'
  });
  const [brandingSaved, setBrandingSaved] = useState(false);

  // Backup file input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Copy Key Helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Redeem Key Action
  const handleRedeemKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    const res = redeemLicenseKey(inputKey.trim());
    if (res.success) {
      setActivationFeedback({ type: 'success', message: res.message });
      setInputKey('');
    } else {
      setActivationFeedback({ type: 'error', message: res.message });
    }
  };

  // Create Key Action
  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyForm.clientName.trim()) return;

    const generatedKey = generateLicenseKey({
      planType: newKeyForm.planType,
      durationDays: Number(newKeyForm.durationDays),
      clientName: newKeyForm.clientName,
      salesRep: newKeyForm.salesRep
    });

    setCreatedKeySuccess(generatedKey);
  };

  // Calculate Proposal Price
  const getPlanBasePrice = (plan: SaaSPlanType) => {
    if (plan === 'starter') return 1200;
    if (plan === 'professional') return 2400;
    return 4500;
  };

  const calculateProposalTotal = () => {
    const base = getPlanBasePrice(proposal.selectedPlan);
    const extraBranchesCost = (proposal.extraBranchesCount || 0) * 350;
    const subtotal = base + extraBranchesCost;
    const discount = subtotal * ((proposal.customDiscountPercent || 0) / 100);
    return Math.max(0, subtotal - discount);
  };

  // Save White Label Branding
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestaurantBranding({
      name: brandingForm.name,
      currency: brandingForm.currency,
      taxNumber: brandingForm.taxNumber,
      address: brandingForm.address,
      phone: brandingForm.phone
    });
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 2500);
  };

  // Export JSON Backup
  const handleDownloadBackup = () => {
    const jsonStr = exportSystemBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MATO_SaaS_Backup_${currentRestaurant.name}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = importSystemBackup(content);
        if (success) {
          setBackupStatus({ type: 'success', message: 'تم استيراد واسترجاع بيانات النظام بنجاح! تم تحديث كافة الجداول.' });
        } else {
          setBackupStatus({ type: 'error', message: 'ملف التنسيق غير صالح أو متضرر.' });
        }
      } catch (err) {
        setBackupStatus({ type: 'error', message: 'فشل في قراءة ملف النسخة الاحتياطية.' });
      }
    };
    reader.readAsText(file);
  };

  // Days remaining calculation
  const getDaysRemaining = () => {
    const expire = new Date(licenseInfo.expiresAt).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((expire - now) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top SaaS Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مركز المبيعات وإدارة التراخيص والتسويق التجاري</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>نظام بيع وترخيص برنامج MATO SaaS</span>
              <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">v4.5 Enterprise</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              إدارة تفعيل الاشتراكات، مفاتيح الترخيص للمطاعم، حاسبة باقات الأسعار، طباعة عروض الأسعار الرسمية، واستخراج وتنسيق النسخ الاحتياطية للعملاء الجدد.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/60 text-center">
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">العميل الحالي</span>
              <span className="font-extrabold text-amber-400 text-xs truncate block">{licenseInfo.clientName}</span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/60 text-center">
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">الباقة المفعّلة</span>
              <span className="font-extrabold text-emerald-400 text-xs">{licenseInfo.planNameAr}</span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/60 text-center col-span-2 sm:col-span-1">
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">صلاحية الاشتراك</span>
              <span className="font-extrabold text-amber-300 text-xs">{getDaysRemaining()} يوم متبقي</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'registrations'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-black'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>سجل التسجيلات والمستخدمين الجدد ({systemRegistrations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('license')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'license'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>حالة الترخيص وتفعيل المفتاح</span>
          </button>

          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>توليد مفاتيح الترخيص للعملاء</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>الباقات والأسعار التجارية</span>
          </button>

          <button
            onClick={() => setActiveTab('proposal')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'proposal'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>مولّد عرض السعر للعميل</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>تصدير واستيراد بيانات العملاء</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: CURRENT LICENSE & KEY REDEMPTION ==================== */}
      {activeTab === 'license' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active License Details Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-slate-900">تفاصيل الترخيص والاشتراك الحالي</h2>
                  <p className="text-slate-500 text-xs">بيانات العقد والصلاحيات المتاحة بالنظام</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs flex items-center gap-1.5 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>الترخيص نشط ومفعل</span>
              </span>
            </div>

            {/* License Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block mb-0.5">اسم العميل / المطعم:</span>
                <span className="font-bold text-slate-900 text-sm">{licenseInfo.clientName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-0.5">مفتاح التفعيل الحالي:</span>
                <span className="font-mono font-bold text-amber-700 text-xs bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                  {licenseInfo.licenseKey}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-0.5">تاريخ التفعيل:</span>
                <span className="font-bold text-slate-800">{licenseInfo.activatedAt}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-0.5">تاريخ الانتهاء التجديد:</span>
                <span className="font-bold text-rose-700">{licenseInfo.expiresAt}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-0.5">حد الفروع المسموحة:</span>
                <span className="font-bold text-slate-900">{licenseInfo.maxBranches} فروع</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-0.5">حد حسابات المستخدمين:</span>
                <span className="font-bold text-slate-900">{licenseInfo.maxUsers} مستخدمين</span>
              </div>
            </div>

            {/* Included Capabilities */}
            <div>
              <h3 className="font-bold text-slate-800 text-xs mb-3">الميزات والموديل التشغيلي المتوفر بحسابك:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">نظام الكاشير المتقدم (POS)</span>
                    <span className="text-[11px] text-slate-500">طاولات، سفري، توصيل، وطباعة الفواتير</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle2 className={`w-4 h-4 ${licenseInfo.isAiFeaturesEnabled ? 'text-emerald-600' : 'text-slate-300'} shrink-0`} />
                  <div>
                    <span className="font-bold text-slate-800 block">مساعد MATO AI الذكي</span>
                    <span className="text-[11px] text-slate-500">مساعد إداري بالصوت والنص والاستجابة التلقائية</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle2 className={`w-4 h-4 ${licenseInfo.isInvoiceScannerEnabled ? 'text-emerald-600' : 'text-slate-300'} shrink-0`} />
                  <div>
                    <span className="font-bold text-slate-800 block">ماسح الفواتير بالرؤية الذكية</span>
                    <span className="text-[11px] text-slate-500">قراءة صور الفواتير الورقية وتحديث المواد تلقائياً</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle2 className={`w-4 h-4 ${licenseInfo.isMultiBranchEnabled ? 'text-emerald-600' : 'text-slate-300'} shrink-0`} />
                  <div>
                    <span className="font-bold text-slate-800 block">إدارة الفروع المتعددة</span>
                    <span className="text-[11px] text-slate-500">ربط مخازن ومبيعات الفروع بسلاسة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Activation Form Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col justify-between space-y-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black mb-4">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="font-extrabold text-base mb-1">تفعيل مفتاح ترخيص جديد 🔑</h2>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                هل حصلت على كود ترخيص أو تجديد من قسم المبيعات؟ أدخل المفتاح هنا لتمديد اشتراكك أو ترقية الباقة فوراً.
              </p>

              <form onSubmit={handleRedeemKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">أدخل مفتاح التفعيل:</label>
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="MATO-PRO-XXXX-XXXX"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 font-mono text-sm tracking-wider uppercase focus:ring-2 focus:ring-amber-400 outline-hidden"
                  />
                </div>

                {activationFeedback && (
                  <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    activationFeedback.type === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {activationFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{activationFeedback.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-400/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>تفعيل مفتاح الترخيص الآن</span>
                </button>
              </form>
            </div>

            {/* Quick Preset Test Keys */}
            <div className="pt-4 border-t border-slate-800 text-xs">
              <span className="block text-[11px] text-slate-400 font-bold mb-2">مفاتيح تجريبية سريعة للتجربة:</span>
              <div className="space-y-1.5">
                {licenseKeys.slice(0, 2).map(k => (
                  <button
                    key={k.id}
                    onClick={() => setInputKey(k.key)}
                    className="w-full text-right p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 font-mono text-[11px] text-amber-300 flex items-center justify-between transition-colors"
                  >
                    <span>{k.key}</span>
                    <span className="text-[10px] text-slate-400 font-sans">{k.planNameAr}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==================== TAB 2: LICENSE KEYS GENERATOR FOR SALES ==================== */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>إدارة ومولد مفاتيح تراخيص العملاء (للمبيعات)</span>
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">قم بإنشاء وتوزيع مفاتيح التفعيل للعملاء والمطاعم الجديدة</p>
            </div>

            <button
              onClick={() => setShowKeyModal(true)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-md shadow-amber-400/20 transition-all flex items-center gap-2 text-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء مفتاح ترخيص جديد للعميل</span>
            </button>
          </div>

          {/* Keys Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
              <span>قائمة مفاتيح التفعيل المولدّة بالنظام ({licenseKeys.length} مفتاح)</span>
              <span className="text-slate-400 text-[11px]">جاهزة للإرسال عبر واتساب أو البريد</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">مفتاح الترخيص (Key)</th>
                    <th className="p-3.5">اسم العميل / المطعم</th>
                    <th className="p-3.5">الباقة</th>
                    <th className="p-3.5">المدة</th>
                    <th className="p-3.5">مسؤول المبيعات</th>
                    <th className="p-3.5">حالة المفتاح</th>
                    <th className="p-3.5 text-center">نسخ الكود</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {licenseKeys.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-amber-700 text-xs">
                        {k.key}
                      </td>
                      <td className="p-3.5 font-bold">{k.clientName}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                          {k.planNameAr}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold">{k.durationDays === 36500 ? 'مدى الحياة (دائم)' : `${k.durationDays} يوم`}</td>
                      <td className="p-3.5 text-slate-600">{k.salesRep}</td>
                      <td className="p-3.5">
                        {k.isRedeemed ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            مستعمل بواسطة {k.redeemedBy || 'العميل'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ متاح للتفعيل
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleCopy(k.key, k.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-lg font-bold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKeyId === k.id ? 'تم النسخ!' : 'نسخ'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>إنشاء مفتاح ترخيص جديد للعميل</span>
              </h3>
              <button onClick={() => { setShowKeyModal(false); setCreatedKeySuccess(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdKeySuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">تم إنشاء المفتاح بنجاح! 🎉</h4>
                  <p className="text-slate-500 text-xs mt-1">يمكنك نسخ الكود وإرساله للعميل للتفعيل المباشر</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl font-mono font-black text-amber-800 text-sm tracking-wider">
                  {createdKeySuccess}
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => handleCopy(createdKeySuccess, 'new_created')}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ المفتاح</span>
                  </button>
                  <button
                    onClick={() => { setCreatedKeySuccess(null); setShowKeyModal(false); }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم مطعم / شركة العميل:</label>
                  <input
                    type="text"
                    required
                    value={newKeyForm.clientName}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, clientName: e.target.value })}
                    placeholder="مثال: مطعم بيت البيتزا والبرغر"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع باقة الاشتراك:</label>
                  <select
                    value={newKeyForm.planType}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, planType: e.target.value as SaaSPlanType })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 outline-hidden"
                  >
                    <option value="starter">الباقة الأساسية (Starter)</option>
                    <option value="professional">الباقة الاحترافية الشاملة (Professional)</option>
                    <option value="enterprise">باقة المؤسسات - مدى الحياة (Enterprise Lifetime)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">مدة الاشتراك (بالأيام):</label>
                  <select
                    value={newKeyForm.durationDays}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, durationDays: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 outline-hidden"
                  >
                    <option value={30}>30 يوم (تجريبي / شهري)</option>
                    <option value={90}>90 يوم (3 أشهر)</option>
                    <option value={365}>365 يوم (سنة كاملة)</option>
                    <option value={36500}>دائم (مدى الحياة - Lifetime)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم مسؤول المبيعات:</label>
                  <input
                    type="text"
                    value={newKeyForm.salesRep}
                    onChange={(e) => setNewKeyForm({ ...newKeyForm, salesRep: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 outline-hidden"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-md"
                  >
                    توليد مفتاح جديد 🚀
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: PRICING PLANS ==================== */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xl font-black text-slate-900">باقات وأسعار اشتراكات برنامج MATO SaaS</h2>
            <p className="text-slate-500 text-xs">
              باقات مرنة تناسب كافة أحجام المطاعم والكافيهات مع إمكانية الترقية والدعم الفني المباشر
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Starter Plan */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">للكافيهات والمطاعم الناشئة</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">الباقة الأساسية</h3>
                <div className="my-4">
                  <span className="text-3xl font-black text-slate-900">$1,200</span>
                  <span className="text-xs text-slate-500"> / سنوياً</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>نظام الكاشير السريع (POS)</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>إدارة المنيو والوجبات</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>فرع واحد + حتي 3 مستخدمين</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>تقارير المبيعات اليومية</span></li>
                  <li className="flex items-center gap-2 text-slate-400"><X className="w-4 h-4 shrink-0" /> <span>بدون مساعد الذكاء الاصطناعي</span></li>
                </ul>
              </div>

              <button
                onClick={() => { setProposal({ ...proposal, selectedPlan: 'starter' }); setActiveTab('proposal'); }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                إنشاء عرض سعر لهذه الباقة
              </button>
            </div>

            {/* Professional Plan (Popular) */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border-2 border-amber-400 flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3.5 right-6 bg-amber-400 text-slate-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                الأكثر مبيعاً ⭐
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">للمطاعم المتوسطة والكبيرة</span>
                <h3 className="text-xl font-black text-white mt-1">الباقة الاحترافية الشاملة</h3>
                <div className="my-4">
                  <span className="text-3xl font-black text-amber-400">$2,400</span>
                  <span className="text-xs text-slate-400"> / سنوياً</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> <span>جميع ميزات الباقة الأساسية</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> <span>مساعد MATO AI الذكي بالصوت والنص</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> <span>ماسح الفواتير بالرؤية الذكية بالذكاء الاصطناعي</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> <span>جرد المخزون وحساب الهدر والتكلفة التلقائي</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> <span>حتى 5 فروع + مستخدمين غير محدودين</span></li>
                </ul>
              </div>

              <button
                onClick={() => { setProposal({ ...proposal, selectedPlan: 'professional' }); setActiveTab('proposal'); }}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer text-center shadow-md shadow-amber-400/20"
              >
                إنشاء عرض سعر لهذه الباقة
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">للمجموعات والسلاسل الضخمة</span>
                <h3 className="text-xl font-black text-slate-900 mt-1">باقة المؤسسات - مدى الحياة</h3>
                <div className="my-4">
                  <span className="text-3xl font-black text-slate-900">$4,500</span>
                  <span className="text-xs text-slate-500"> / دفعة واحدة (Lifetime)</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>ترخيص دائم مدى الحياة (No annual fee)</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>فروع ومستخدمين غير محدودين</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>سيرفر خاص وشعار وهوية مخصصة للعميل</span></li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> <span>تحديثات ونسخ احتياطي تلقائي مدى الحياة</span></li>
                </ul>
              </div>

              <button
                onClick={() => { setProposal({ ...proposal, selectedPlan: 'enterprise' }); setActiveTab('proposal'); }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                إنشاء عرض سعر لهذه الباقة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================== TAB 4: COMMERCIAL PROPOSAL GENERATOR ==================== */}
      {activeTab === 'proposal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Proposal Editor Controls */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>إعداد بيانات عرض السعر الرسمي للعميل</span>
            </h2>

            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم المطعم / العميل:</label>
              <input
                type="text"
                value={proposal.clientName}
                onChange={(e) => setProposal({ ...proposal, clientName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">هاتف العميل:</label>
                <input
                  type="text"
                  value={proposal.clientPhone}
                  onChange={(e) => setProposal({ ...proposal, clientPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع المنشأة:</label>
                <input
                  type="text"
                  value={proposal.restaurantType}
                  onChange={(e) => setProposal({ ...proposal, restaurantType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الباقة المختارة:</label>
              <select
                value={proposal.selectedPlan}
                onChange={(e) => setProposal({ ...proposal, selectedPlan: e.target.value as SaaSPlanType })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
              >
                <option value="starter">الباقة الأساسية ($1,200/سنوياً)</option>
                <option value="professional">الباقة الاحترافية الشاملة ($2,400/سنوياً)</option>
                <option value="enterprise">باقة المؤسسات - مدى الحياة ($4,500/دفعة واحدة)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">فروع إضافية ($350/فرع):</label>
                <input
                  type="number"
                  min="0"
                  value={proposal.extraBranchesCount}
                  onChange={(e) => setProposal({ ...proposal, extraBranchesCount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">نسبة خصم المبيعات (%):</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={proposal.customDiscountPercent}
                  onChange={(e) => setProposal({ ...proposal, customDiscountPercent: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ملاحظات وخدمات إضافية:</label>
              <textarea
                rows={3}
                value={proposal.notes}
                onChange={(e) => setProposal({ ...proposal, notes: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold outline-hidden"
              />
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة عرض السعر الرسمي للعميل 🖨️</span>
            </button>
          </div>

          {/* Official Quotation Document Preview */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 border-2 border-slate-800 shadow-xl space-y-6 text-right print:p-0 print:border-none">
            
            {/* Proposal Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base">
                    M
                  </div>
                  <span className="font-black text-xl text-slate-900 tracking-tight">MATO SaaS Solutions</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">حلول إدارة وتطوير أنظمة المطاعم والكافيهات الذكية</p>
              </div>

              <div className="text-left text-xs">
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {proposal.proposalNumber}
                </span>
                <span className="block text-slate-400 text-[10px] mt-1">التاريخ: {new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <h3 className="font-black text-slate-900 text-base">عرض سعر رسمي لتشغيل واستضافة البرنامج (Commercial Proposal)</h3>
            </div>

            {/* Client Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">المقدم إلى السيد / الشركة:</span>
                <span className="font-black text-slate-900">{proposal.clientName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">نوع نشاط المنشأة:</span>
                <span className="font-bold text-slate-800">{proposal.restaurantType}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">رقم هاتف للتواصل:</span>
                <span className="font-mono font-bold text-slate-800">{proposal.clientPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">صلاحية عرض السعر لغاية:</span>
                <span className="font-bold text-rose-700">{proposal.validUntilDate}</span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <table className="w-full text-right text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-3">البيان والخدمة</th>
                  <th className="p-3 text-center">الكمية</th>
                  <th className="p-3 text-left">السعر الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                <tr>
                  <td className="p-3 font-bold">
                    {proposal.selectedPlan === 'starter' ? 'الباقة الأساسية' : proposal.selectedPlan === 'professional' ? 'الباقة الاحترافية الشاملة مع AI' : 'باقة المؤسسات الترخيص الدائم'}
                  </td>
                  <td className="p-3 text-center">1 اشتراك</td>
                  <td className="p-3 text-left font-bold">${getPlanBasePrice(proposal.selectedPlan)}</td>
                </tr>
                {proposal.extraBranchesCount > 0 && (
                  <tr>
                    <td className="p-3">ربط وتشغيل فروع إضافية ($350/فرع)</td>
                    <td className="p-3 text-center">{proposal.extraBranchesCount} فروع</td>
                    <td className="p-3 text-left font-bold">${proposal.extraBranchesCount * 350}</td>
                  </tr>
                )}
                {proposal.customDiscountPercent > 0 && (
                  <tr className="bg-emerald-50 text-emerald-800">
                    <td className="p-3 font-bold">خصم خاص مبيعات ({proposal.customDiscountPercent}%)</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-left font-bold">
                      -${((getPlanBasePrice(proposal.selectedPlan) + proposal.extraBranchesCount * 350) * (proposal.customDiscountPercent / 100)).toFixed(0)}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-900 text-amber-400 font-black text-sm">
                  <td className="p-3">المبلغ الصافي النهائي المطلوب:</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-left text-base">${calculateProposalTotal().toLocaleString()} USD</td>
                </tr>
              </tbody>
            </table>

            {/* Notes & Guarantees */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
              <span className="font-extrabold text-amber-900 block">شروط وضمانات العقد:</span>
              <p className="text-slate-700 text-[11px] leading-relaxed">{proposal.notes}</p>
            </div>

            {/* Signatures Footer */}
            <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600 font-bold">
              <div>
                <span>توقيع وختم قسم المبيعات:</span>
                <span className="block font-black text-slate-900 mt-2">{proposal.salesRepName}</span>
              </div>
              <div className="text-left">
                <span>توقيع العميل بالموافقة:</span>
                <span className="block text-slate-300 mt-2">........................................</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==================== TAB 5: BACKUP & DATA EXPORT/IMPORT ==================== */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Export Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Download className="w-6 h-6" />
            </div>

            <div>
              <h2 className="font-extrabold text-slate-900 text-base">تصدير قاعدة بيانات المطعم بالكامل 📦</h2>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                قم بتصدير جميع بيانات الوجبات، المخزون، الوصفات، الموردين، والمبيعات بملف JSON واحد لإنشاء نسخة احتياطية للعميل أو تسليمه النظام.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-700"><span>عدد الوجبات بالمنيو:</span><span className="font-bold">{products.length} وجبة</span></div>
              <div className="flex justify-between text-slate-700"><span>عدد المواد بالمخزون:</span><span className="font-bold">{ingredients.length} مادة</span></div>
              <div className="flex justify-between text-slate-700"><span>عدد الموردين المسجلين:</span><span className="font-bold">{suppliers.length} موردين</span></div>
              <div className="flex justify-between text-slate-700"><span>عدد المبيعات والمصاريف:</span><span className="font-bold">{orders.length + expenses.length} سجلاً</span></div>
            </div>

            <button
              onClick={handleDownloadBackup}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>تحميل ملف النسخة الاحتياطية (.JSON)</span>
            </button>
          </div>

          {/* Import Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <h2 className="font-extrabold text-slate-900 text-base">استيراد نسخة بيانات مطعم عميل 📥</h2>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                رفع واستعادة ملف JSON لتعبئة النظام ببيانات مطعم جديد فوراً عند التسليم للعميل.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".json"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <span className="block font-bold text-slate-800 text-xs">اضغط هنا لاختيار ملف البيانات (JSON)</span>
              <span className="block text-[11px] text-slate-400">يدعم كافة النسخ الاحتياطية المصدرة من MATO POS</span>
            </div>

            {backupStatus && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                backupStatus.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {backupStatus.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{backupStatus.message}</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 6: SYSTEM REGISTRATIONS & CLOUD PLATFORM ADMIN DASHBOARD */}
      {activeTab === 'registrations' && (
        <div className="space-y-6">
          
          {/* Cloud Database Integration Status Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="font-black text-sm text-emerald-400">قاعدة البيانات السحابية Firebase (Firestore) متصلة ومزكاة</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>لوحة تحكم الأدمن (مدير المنصة) — إدارة الاشتراكات وأكواد التفعيل</span>
              </h2>
              <p className="text-xs text-slate-300">
                يتم مزامنة المطاعم وأكواد التفعيل وتواريخ الانتهاء لحظياً عبر قاعدة بيانات Firebase سحابية
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-800/90 border border-slate-700 px-4 py-2.5 rounded-2xl text-right">
                <div className="text-[10px] text-slate-400">إجمالي المطاعم بالمنصة</div>
                <div className="text-lg font-black text-amber-400">
                  {Math.max(systemRegistrations.length, firestoreRestaurants.length, 1)} مطاعم
                </div>
              </div>
            </div>
          </div>

          {/* MAIN TABLE: REGISTERED RESTAURANTS & ANNUAL ACTIVATION CODES */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-500" />
                  <span>جدول المطاعم المسجلة، أرقام هواتفها، وتواريخ انتهاء اشتراكها السنوي</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  يمكنك توليد 'كود تفعيل سنوي' جديد لكل مطعم بنقرة واحدة لتمديد اشتراكه وتغيير حالته فورياً إلى (فعّال)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-700 font-bold">
                    <th className="p-3">اسم المطعم / المنشأة</th>
                    <th className="p-3">المالك / مدير المطعم</th>
                    <th className="p-3">رقم الهاتف / البريد</th>
                    <th className="p-3">تاريخ انتهاء الاشتراك السنوي</th>
                    <th className="p-3">حالة الاشتراك</th>
                    <th className="p-3">كود التفعيل السنوي الحالي</th>
                    <th className="p-3 text-center">إجراءات الأدمن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Render Firestore Restaurants or fallback to SystemRegistrations */}
                  {(firestoreRestaurants.length > 0
                    ? firestoreRestaurants
                    : systemRegistrations.map(sr => ({
                        id: sr.tenantId || sr.id,
                        name: sr.restaurantName,
                        ownerName: sr.ownerName,
                        phone: sr.emailOrPhone,
                        email: sr.emailOrPhone,
                        status: (sr.status === 'active' ? 'active' : 'expired') as 'active' | 'expired' | 'pending',
                        activationCode: `MATO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                        subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                        registeredAt: sr.registeredAt
                      }))
                  ).map((rest) => {
                    const expiryDate = new Date(rest.subscriptionExpiry);
                    const isExpired = expiryDate < new Date() || rest.status === 'expired';

                    return (
                      <tr key={rest.id} className="hover:bg-amber-50/40 transition-all">
                        <td className="p-3 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-xs">
                              🏢
                            </div>
                            <div>
                              <div className="font-black text-slate-900">{rest.name}</div>
                              <div className="text-[10px] text-slate-400">معرّف: {rest.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 font-bold text-slate-800">
                          {rest.ownerName}
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-700 dir-ltr text-right">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                            {rest.phone || rest.email || 'غير محدد'}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="font-mono font-bold text-xs text-slate-800">
                            {expiryDate.toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ينتهي في {expiryDate.toLocaleDateString('en-GB')}
                          </div>
                        </td>

                        <td className="p-3">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-full font-black text-[11px]">
                              <X className="w-3.5 h-3.5" />
                              <span>منتهي الاشتراك</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full font-black text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>فعّال (نشط)</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <span className="inline-flex items-center gap-1.5 bg-slate-900 text-amber-400 border border-amber-400/40 px-3 py-1 rounded-xl font-mono font-black text-xs select-all shadow-xs">
                            <Key className="w-3.5 h-3.5" />
                            <span>{rest.activationCode || 'لم يولد كود بعد'}</span>
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={async () => {
                              const res = await generateAnnualActivationCode(rest.id, rest.name);
                              alert(`تمت العملية بنجاح! 🎉\n\nتم توليد كود تفعيل سنوي جديد للمطعم (${rest.name}):\nالكود: ${res.code}\nتاريخ الانتهاء الجديد: ${new Date(res.newExpiry).toLocaleDateString('ar-SY')}\nتم تعديل حالة الاشتراك سحابياً فورياً إلى (فعّال).`);
                            }}
                            className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-400/20 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>توليد كود تفعيل سنوي جديد وتعديل الحالة لـ (فعّال)</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

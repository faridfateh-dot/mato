/**
 * WhatsApp & Code Sharing Utility for MATO POS Systems
 * Provides seamless 1-click clipboard copying and customized WhatsApp sharing
 * for Restaurant Owners, Managers, Cashiers, and Staff.
 */

// Helper to sanitize phone numbers for WhatsApp wa.me links
export function formatWhatsAppPhoneNumber(phone?: string): string {
  if (!phone) return '';
  
  // Remove spaces, dashes, brackets, plus signs
  let clean = phone.replace(/[^0-9]/g, '');
  
  // Strip leading 00
  if (clean.startsWith('00')) {
    clean = clean.substring(2);
  }
  
  // If Syrian local mobile starting with 09 (e.g. 0991234567 -> 963991234567)
  if (clean.startsWith('09') && clean.length === 10) {
    clean = `963${clean.substring(1)}`;
  } else if (clean.startsWith('9') && clean.length === 9) {
    clean = `963${clean}`;
  }
  
  return clean;
}

// Generate direct WhatsApp link (with phone or general picker)
export function getWhatsAppShareUrl(phone?: string, message: string = ''): string {
  const cleanNumber = formatWhatsAppPhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  
  if (cleanNumber && cleanNumber.length >= 7) {
    return `https://wa.me/${cleanNumber}?text=${encodedText}`;
  }
  
  // Universal WhatsApp share link allowing the user to pick any contact or group
  return `https://wa.me/?text=${encodedText}`;
}

// Open WhatsApp in a new tab safely
export function openWhatsAppLink(phone?: string, message: string = ''): void {
  const url = getWhatsAppShareUrl(phone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

// Clipboard copy with fallback and boolean return
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Navigator clipboard failed, using fallback:', err);
  }

  // Fallback for older browsers or iframes without clipboard permissions
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}

// Read text from clipboard with safety
export async function readFromClipboard(): Promise<string | null> {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      return text ? text.trim() : null;
    }
  } catch (err) {
    console.warn('Navigator clipboard readText failed:', err);
  }
  return null;
}

// Intelligent extractor for activation codes from full text or copied WhatsApp messages
export function extractActivationCodeFromText(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // If already a clean code (no line breaks and reasonable length)
  if (!trimmed.includes('\n') && trimmed.length < 50) {
    return trimmed;
  }

  // Match MATO-XXXX-XXXX or MATO-2026-XXXX or similar patterns
  const matoMatch = trimmed.match(/MATO-[A-Z0-9_-]+/i);
  if (matoMatch) return matoMatch[0].toUpperCase();

  // Match backticked code `CODE`
  const backtickMatch = trimmed.match(/`([A-Za-z0-9_-]+)`/);
  if (backtickMatch) return backtickMatch[1].toUpperCase();

  // Match lines containing "كود التفعيل" or "الكود"
  const lines = trimmed.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('كود') || line.includes('الكود') || line.includes('الترخيص')) {
      // check if the next line is the code
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim().replace(/[`*_\s]/g, '');
        if (nextLine.length >= 4 && nextLine.length <= 40) {
          return nextLine.toUpperCase();
        }
      }
      // or in the same line
      const cleanInLine = line.replace(/.*[:：]\s*/, '').replace(/[`*_\s]/g, '');
      if (cleanInLine.length >= 4 && cleanInLine.length <= 40) {
        return cleanInLine.toUpperCase();
      }
    }
  }

  return trimmed;
}

// ================= MESSAGE TEMPLATES =================

// 1. Message for Restaurant Owner with Annual Activation Code
export function buildRestaurantActivationMessage(params: {
  restaurantName: string;
  ownerName?: string;
  code: string;
  expiryDate?: string;
  planName?: string;
  appUrl?: string;
}): string {
  const { restaurantName, ownerName, code, expiryDate, planName, appUrl } = params;
  const currentAppUrl = appUrl || window.location.origin || 'https://mato-pos.com';
  const expiryFormatted = expiryDate 
    ? new Date(expiryDate).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'سنة كاملة من تاريخ التفعيل';

  return `*مرحباً أستاذ ${ownerName || 'صاحب المطعم'} المحترم* 👋
تهانينا! تم تفعيل واعتماد ترخيص مطعمكم (*${restaurantName}*) في نظام *MATO POS* السحابي بنجاح 🍽️✨

━━━━━━━━━━━━━━━━━━━━
🔑 *كود التفعيل السنوي الخاص بكم:*
\`${code}\`
━━━━━━━━━━━━━━━━━━━━

📋 *تفاصيل الاشتراك والترخيص:*
• المنشأة: *${restaurantName}*
• نوع الباقة: *${planName || 'الباقة الاحترافية الشاملة'}*
• صلاحية الترخيص: *حتى ${expiryFormatted}*

📲 *رابط الدخول لمنظومة المطعم:*
${currentAppUrl}

💡 *طريقة الاستخدام:*
يمكنك فتح الرابط أعلاه، اختيار "تفعيل كود سنوي"، ثم لصق الكود لبدء العمل فوراً مع حفظ كامل بياناتك.

_منظومة MATO POS - تطوير وإشراف م. فريد الفاتح_`;
}

// 2. Message for Restaurant Employee / Staff with Login Credentials & Code
export function buildStaffCredentialsMessage(params: {
  staffName: string;
  restaurantName: string;
  emailOrPhone: string;
  role: string;
  branchName?: string;
  password?: string;
  pinCode?: string;
  appUrl?: string;
}): string {
  const { staffName, restaurantName, emailOrPhone, role, branchName, password, pinCode, appUrl } = params;
  const currentAppUrl = appUrl || window.location.origin || 'https://mato-pos.com';

  const roleArabicMap: Record<string, string> = {
    'Owner': 'المالك / المدير العام (Owner)',
    'Manager': 'مدير الصالة والفرع (Manager)',
    'Cashier': 'كاشير مبيعات ونقاط البيع (Cashier)',
    'Inventory Manager': 'أمين المستودع والمخزون (Inventory)'
  };
  const roleDisplay = roleArabicMap[role] || role;

  return `*مرحباً بك ${staffName} في فريق عمل (${restaurantName})* 🍽️👋
تم اعتماد وتفعيل حسابك الرسمي في نظام الكاشير والمبيعات *MATO POS* بنجاح!

━━━━━━━━━━━━━━━━━━━━
👤 *اسم المستخدم / المعرف:*
\`${emailOrPhone}\`

🔑 *كلمة المرور / كود الدخول:*
\`${password || pinCode || '123456'}\`
━━━━━━━━━━━━━━━━━━━━

🏢 *الفرع المخصص:* ${branchName || 'الفرع الرئيسي'}
👔 *الدور والصلاحيات:* ${roleDisplay}

📲 *رابط تسجيل الدخول للنظام:*
${currentAppUrl}

💡 *تعليمات:*
يرجى فتح الرابط، إدخال رقم الهاتف/البريد وكلمة المرور أعلاه لبدء ورديتك. حافظ على سرية كود الدخول الخاص بك.`;
}

// 3. Message for Quick Staff Approval Notification
export function buildStaffApprovalNotificationMessage(params: {
  staffName: string;
  restaurantName: string;
  role: string;
  branchName?: string;
  emailOrPhone: string;
  password?: string;
}): string {
  const { staffName, restaurantName, role, branchName, emailOrPhone, password } = params;
  return `*أهلاً ${staffName}* 👏
تمت الموافقة على طلب انضمامك إلى مطعم *${restaurantName}* بصفة (*${role}*) ${branchName ? `بفرع (${branchName})` : ''}.

كود وكلمة مرور الدخول الخاصة بك: \`${password || 'admin'}\`
معرف الحساب: \`${emailOrPhone}\`

يمكنك الآن الدخول للنظام ومباشرة عملك فوراً!`;
}

// 4. Message for Subscription Request Notification to Platform Owner (Farid)
export function buildSubscriptionRequestNotification(params: {
  restaurantName: string;
  ownerName: string;
  phone: string;
  requestId: string;
  city?: string;
  planType?: string;
  branchesCount?: number;
}): string {
  const { restaurantName, ownerName, phone, requestId, city, planType, branchesCount } = params;
  const planArabic = planType === 'enterprise' ? 'باقة المؤسسات والشركات' : planType === 'starter' ? 'الباقة الأساسية' : 'الباقة الاحترافية';

  return `*مرحباً أستاذ فريد 👋*
تم إرسال طلب تسجيل وترخيص مطعم جديد لمنظومة *MATO POS*:

━━━━━━━━━━━━━━━━━━━━
🍽️ *اسم المطعم:* ${restaurantName}
👤 *صاحب المطعم:* ${ownerName}
📱 *رقم الهاتف:* ${phone}
🏙️ *المدينة / الفرع:* ${city || 'دمشق'} (${branchesCount || 1} فروع)
📦 *الباقة المختارة:* ${planArabic}
🆔 *رقم مرجع الطلب:* \`${requestId}\`
━━━━━━━━━━━━━━━━━━━━

يرجى مراجعة الطلب في لوحة المبيعات وإصدار كود التفعيل السنوي. شكراً لك!`;
}

// 5. General message builder helper
export function buildGeneralWhatsAppMessage(title: string, body: string): string {
  return `*${title}*\n\n${body}\n\n_منظومة MATO POS - تطوير وإشراف م. فريد الفاتح_`;
}


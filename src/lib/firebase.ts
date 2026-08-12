import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely
let app: any = null;
let dbInstance: any = null;

try {
  if (firebaseConfig && (firebaseConfig as any).apiKey) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
  }
} catch (err) {
  console.warn('Firebase initialization skipped or warning:', err);
}

export const db = dbInstance;

export interface FirestoreRestaurantRecord {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  status: 'active' | 'expired' | 'pending' | 'pending_approval' | 'rejected';
  activationCode: string;
  subscriptionExpiry: string; // ISO date string
  registeredAt: string;
  planType?: string;
}

export interface FirestoreActivationCode {
  id: string;
  code: string;
  restaurantId: string;
  restaurantName: string;
  status: 'active' | 'redeemed' | 'expired';
  expiresAt: string;
  generatedAt: string;
}

// Generate a readable random annual code e.g. MATO-2026-9842
export function generateAnnualCodeString(): string {
  const currentYear = new Date().getFullYear();
  const randomSegment = Math.floor(1000 + Math.random() * 9000).toString();
  const charSegment = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
  return `MATO-${currentYear}-${charSegment}${randomSegment}`;
}

// Save or Update Restaurant in Firestore
export async function saveRestaurantToFirestore(record: FirestoreRestaurantRecord): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'restaurants', record.id);
    await setDoc(docRef, record, { merge: true });
  } catch (err) {
    console.warn('Firestore saveRestaurant error:', err);
  }
}

// Fetch All Restaurants from Firestore
export async function fetchRestaurantsFromFirestore(): Promise<FirestoreRestaurantRecord[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, 'restaurants');
    const snapshot = await getDocs(colRef);
    const records: FirestoreRestaurantRecord[] = [];
    snapshot.forEach((d) => {
      records.push({ id: d.id, ...(d.data() as Omit<FirestoreRestaurantRecord, 'id'>) });
    });
    return records;
  } catch (err) {
    console.warn('Firestore fetchRestaurants error:', err);
    return [];
  }
}

// Generate New Annual Activation Code for a restaurant & update its status to 'active'
export async function generateAnnualCodeForRestaurant(
  restaurantId: string,
  restaurantName: string
): Promise<{ code: string; newExpiry: string }> {
  const newCode = generateAnnualCodeString();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const newExpiryISO = oneYearFromNow.toISOString();

  if (!db) return { code: newCode, newExpiry: newExpiryISO };

  try {
    // 1. Save activation code doc
    const codeDocId = `code_${Date.now()}`;
    const codeRef = doc(db, 'activation_codes', codeDocId);
    await setDoc(codeRef, {
      id: codeDocId,
      code: newCode,
      restaurantId,
      restaurantName,
      status: 'active',
      expiresAt: newExpiryISO,
      generatedAt: new Date().toISOString()
    });

    // 2. Update restaurant doc status to active & new expiry
    const restRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(restRef, {
      activationCode: newCode,
      status: 'active',
      subscriptionExpiry: newExpiryISO
    });
  } catch (err) {
    console.warn('Firestore generateAnnualCode error:', err);
  }

  return { code: newCode, newExpiry: newExpiryISO };
}

// Verify Code entered by Subscriber
export async function verifyActivationCodeInFirestore(code: string): Promise<{
  valid: boolean;
  restaurant?: FirestoreRestaurantRecord;
  message: string;
}> {
  const cleanCode = code.trim().toUpperCase();
  if (!db) {
    return {
      valid: false,
      message: 'الخدمة السحابية غير متوفرة حالياً.'
    };
  }

  try {
    // Search in restaurants collection first for matching activationCode
    const restCol = collection(db, 'restaurants');
    const qRest = query(restCol, where('activationCode', '==', cleanCode));
    const restSnap = await getDocs(qRest);

    if (!restSnap.empty) {
      const docData = restSnap.docs[0].data() as FirestoreRestaurantRecord;
      const docId = restSnap.docs[0].id;

      // Check expiry date
      const expiryDate = new Date(docData.subscriptionExpiry);
      if (expiryDate < new Date()) {
        return {
          valid: false,
          restaurant: { ...docData, id: docId },
          message: 'كود التفعيل هذا انتهت صلاحيته السنوية. يرجى التواصل مع إدارة المنصة للتجديد.'
        };
      }

      return {
        valid: true,
        restaurant: { ...docData, id: docId, status: 'active' },
        message: 'تم التحقق من كود التفعيل السنوي بنجاح وتنشيط الاشتراك السحابي!'
      };
    }

    // Search in activation_codes collection
    const codesCol = collection(db, 'activation_codes');
    const qCodes = query(codesCol, where('code', '==', cleanCode));
    const codeSnap = await getDocs(qCodes);

    if (!codeSnap.empty) {
      const codeData = codeSnap.docs[0].data() as FirestoreActivationCode;
      
      // Fetch associated restaurant
      const restRef = doc(db, 'restaurants', codeData.restaurantId);
      const rSnap = await getDoc(restRef);

      if (rSnap.exists()) {
        const rData = rSnap.data() as FirestoreRestaurantRecord;
        return {
          valid: true,
          restaurant: { ...rData, id: rSnap.id, activationCode: cleanCode, status: 'active' },
          message: 'تم التحقق من كود التفعيل السنوي بنجاح!'
        };
      }
    }
  } catch (err) {
    console.warn('Firestore verifyCode error:', err);
  }

  return {
    valid: false,
    message: 'كود التفعيل غير صحيح أو غير موجود في قاعدة البيانات السحابية.'
  };
}

export interface PlatformOwnerContact {
  name: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  company: string;
}

export const DEFAULT_PLATFORM_OWNER_CONTACT: PlatformOwnerContact = {
  name: 'فريد الفاتح (مالك منصة MATO POS)',
  phone: '+963 991 234 567',
  whatsappNumber: '963991234567',
  email: 'farid.fateh@hotmail.com',
  company: 'MATO POS Systems & SaaS'
};

export let PLATFORM_OWNER_CONTACT: PlatformOwnerContact = { ...DEFAULT_PLATFORM_OWNER_CONTACT };

// Get active platform owner contact
export function getPlatformOwnerContact(): PlatformOwnerContact {
  try {
    const saved = localStorage.getItem('mato_platform_owner_contact');
    if (saved) {
      const parsed = JSON.parse(saved);
      PLATFORM_OWNER_CONTACT = { ...DEFAULT_PLATFORM_OWNER_CONTACT, ...parsed };
      return PLATFORM_OWNER_CONTACT;
    }
  } catch (err) {
    console.warn('Error reading owner contact from localStorage:', err);
  }
  return PLATFORM_OWNER_CONTACT;
}

// Save Platform Owner Contact to LocalStorage & Firestore
export async function savePlatformOwnerContactToFirestore(contact: PlatformOwnerContact): Promise<void> {
  const cleanWhatsApp = contact.whatsappNumber.replace(/[^0-9]/g, '');
  const toSave: PlatformOwnerContact = {
    ...contact,
    whatsappNumber: cleanWhatsApp || contact.whatsappNumber
  };
  PLATFORM_OWNER_CONTACT = toSave;
  try {
    localStorage.setItem('mato_platform_owner_contact', JSON.stringify(toSave));
    if (db) {
      const docRef = doc(db, 'system_settings', 'owner_contact');
      await setDoc(docRef, toSave, { merge: true });
    }
  } catch (err) {
    console.warn('savePlatformOwnerContactToFirestore error:', err);
  }
}

// Subscribe to Owner Contact in realtime
export function subscribePlatformOwnerContact(callback: (contact: PlatformOwnerContact) => void) {
  callback(getPlatformOwnerContact());
  if (!db) return () => {};
  try {
    const docRef = doc(db, 'system_settings', 'owner_contact');
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as PlatformOwnerContact;
        const merged: PlatformOwnerContact = { ...DEFAULT_PLATFORM_OWNER_CONTACT, ...data };
        PLATFORM_OWNER_CONTACT = merged;
        localStorage.setItem('mato_platform_owner_contact', JSON.stringify(merged));
        callback(merged);
      }
    }, (err) => {
      console.warn('Realtime owner contact subscription warning:', err);
    });
  } catch (err) {
    console.warn('subscribePlatformOwnerContact error:', err);
    return () => {};
  }
}

// Generate WhatsApp Contact Link with custom pre-filled message
export function getOwnerWhatsAppLink(customMessage: string, customWhatsAppNumber?: string): string {
  const currentContact = getPlatformOwnerContact();
  const rawNum = customWhatsAppNumber || currentContact.whatsappNumber || '963991234567';
  const cleanNum = rawNum.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(customMessage);
  return `https://wa.me/${cleanNum}?text=${encoded}`;
}

// Approve Restaurant & Issue Activation Code in Firestore
export async function approveRestaurantInFirestore(
  restaurantId: string,
  activationCode: string,
  newExpiryDate: string
): Promise<boolean> {
  if (!db) return true;
  try {
    const docRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(docRef, {
      status: 'active',
      activationCode,
      subscriptionExpiry: newExpiryDate
    });

    // Also record in activation_codes collection
    const codeRef = doc(db, 'activation_codes', activationCode);
    await setDoc(codeRef, {
      code: activationCode,
      restaurantId,
      expiresAt: newExpiryDate,
      issuedAt: new Date().toISOString()
    });

    return true;
  } catch (err) {
    console.warn('Firestore approveRestaurant error:', err);
    return false;
  }
}

// Generate WhatsApp Link for Client
export function getClientWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

// Delete / Reject Restaurant from Firestore
export async function deleteRestaurantFromFirestore(restaurantId: string): Promise<boolean> {
  if (!db) return true;
  try {
    const docRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(docRef, { status: 'rejected' });
    return true;
  } catch (err) {
    console.warn('Firestore deleteRestaurant error:', err);
    return false;
  }
}

// Permanently Delete Restaurant & its activation codes from Firestore
export async function permanentlyDeleteRestaurantFromFirestore(restaurantId: string): Promise<boolean> {
  if (!db) return true;
  try {
    const docRef = doc(db, 'restaurants', restaurantId);
    await deleteDoc(docRef);

    // Also delete any activation codes associated with this restaurant
    const codesCol = collection(db, 'activation_codes');
    const qCodes = query(codesCol, where('restaurantId', '==', restaurantId));
    const codeSnap = await getDocs(qCodes);
    const deletePromises: Promise<void>[] = [];
    codeSnap.forEach((d) => {
      deletePromises.push(deleteDoc(d.ref));
    });
    await Promise.all(deletePromises);

    return true;
  } catch (err) {
    console.warn('Firestore permanentlyDeleteRestaurant error:', err);
    return false;
  }
}

// Staff / User Registration Request Interface
export interface FirestoreStaffRequest {
  id: string;
  name: string;
  emailOrPhone: string;
  role: string;
  restaurantId: string;
  restaurantName: string;
  branchId?: string;
  status: 'pending' | 'approved' | 'rejected';
  password?: string;
  notes?: string;
  requestedAt: string;
}

// Save Staff Request to Firestore
export async function saveStaffRequestToFirestore(request: FirestoreStaffRequest): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'staff_requests', request.id);
    await setDoc(docRef, request, { merge: true });
  } catch (err) {
    console.warn('Firestore saveStaffRequest error:', err);
  }
}

// Subscribe to Staff Requests in Realtime
export function subscribeStaffRequestsRealtime(
  callback: (records: FirestoreStaffRequest[]) => void
) {
  if (!db) return () => {};
  try {
    const colRef = collection(db, 'staff_requests');
    return onSnapshot(colRef, (snapshot) => {
      const records: FirestoreStaffRequest[] = [];
      snapshot.forEach((d) => {
        records.push({ id: d.id, ...(d.data() as Omit<FirestoreStaffRequest, 'id'>) });
      });
      callback(records);
    });
  } catch (err) {
    console.warn('Realtime staff subscription error:', err);
    return () => {};
  }
}

// Update Staff Request Status in Firestore
export async function updateStaffRequestStatusInFirestore(
  requestId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'staff_requests', requestId);
    await updateDoc(docRef, { status });
  } catch (err) {
    console.warn('Firestore updateStaffRequestStatus error:', err);
  }
}

// Delete Staff Request from Firestore
export async function deleteStaffRequestFromFirestore(requestId: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'staff_requests', requestId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteStaffRequest error:', err);
  }
}

// Listen to Restaurants Realtime updates from Firestore
export function subscribeRestaurantsRealtime(
  callback: (records: FirestoreRestaurantRecord[]) => void
) {
  if (!db) return () => {};
  try {
    const colRef = collection(db, 'restaurants');
    return onSnapshot(colRef, (snapshot) => {
      const records: FirestoreRestaurantRecord[] = [];
      snapshot.forEach((d) => {
        records.push({ id: d.id, ...(d.data() as Omit<FirestoreRestaurantRecord, 'id'>) });
      });
      callback(records);
    });
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
}

// Full Multi-Device Restaurant Cloud Persistence Structure
export interface RestaurantCloudData {
  restaurantId: string;
  restaurant?: any;
  branches?: any[];
  categories?: any[];
  rawMaterialCategories?: any[];
  products?: any[];
  ingredients?: any[];
  recipes?: any[];
  suppliers?: any[];
  purchases?: any[];
  stockMovements?: any[];
  orders?: any[];
  expenses?: any[];
  activityLogs?: any[];
  users?: any[];
  updatedAt?: string;
  updatedBy?: string;
}

// Clean undefined values so Firestore doesn't reject document writes
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = sanitizeForFirestore(val);
      }
    }
    return cleaned;
  }
  return obj;
}

// Save Full Restaurant Data to Firestore Cloud for Cross-Device Sync
export async function saveRestaurantAppDataToFirestore(
  restaurantId: string,
  data: Partial<RestaurantCloudData>
): Promise<void> {
  if (!db || !restaurantId) return;
  try {
    const docRef = doc(db, 'restaurant_data', restaurantId);
    const sanitizedData = sanitizeForFirestore({
      ...data,
      restaurantId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (err) {
    console.warn('Firestore saveRestaurantAppData error:', err);
  }
}

// Fetch Restaurant Cloud Data
export async function fetchRestaurantAppDataFromFirestore(
  restaurantId: string
): Promise<RestaurantCloudData | null> {
  if (!db || !restaurantId) return null;
  try {
    const docRef = doc(db, 'restaurant_data', restaurantId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as RestaurantCloudData;
    }
    return null;
  } catch (err) {
    console.warn('Firestore fetchRestaurantAppData error:', err);
    return null;
  }
}

// Real-Time Subscribe to Restaurant Cloud Data
export function subscribeRestaurantAppDataRealtime(
  restaurantId: string,
  callback: (data: RestaurantCloudData | null) => void
): () => void {
  if (!db || !restaurantId) {
    callback(null);
    return () => {};
  }
  try {
    const docRef = doc(db, 'restaurant_data', restaurantId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as RestaurantCloudData);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn('Realtime restaurant_data subscription error:', err);
      }
    );
  } catch (err) {
    console.warn('subscribeRestaurantAppDataRealtime error:', err);
    return () => {};
  }
}


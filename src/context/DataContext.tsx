import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Restaurant,
  Branch,
  User,
  UserRole,
  LoginResult,
  Category,
  Product,
  Ingredient,
  RawMaterialCategory,
  RawMaterialCategoryInfo,
  Recipe,
  Supplier,
  Purchase,
  StockMovement,
  Order,
  ActivityLog,
  AIChatMessage,
  DashboardStats,
  ExpenseAlert,
  Expense,
  ExpenseCategory,
  SoftwareLicense,
  LicenseKeyInfo,
  SaaSPlanType,
  SystemRegistration,
  RestaurantSubscriptionRequest,
  SystemNotification,
  InAppNotification,
  NotificationType,
  ShiftRoleType,
  RestaurantRolePasswords
} from '../types';
import {
  INITIAL_RESTAURANT,
  INITIAL_BRANCHES,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_INGREDIENTS,
  INITIAL_RECIPES,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_ORDERS,
  INITIAL_LOGS,
  INITIAL_EXPENSES,
  FOOD_BREAK_RESTAURANT,
  FOOD_BREAK_BRANCHES,
  FOOD_BREAK_CATEGORIES,
  FOOD_BREAK_PRODUCTS,
  usr_foodbreak_owner,
  INITIAL_FOOD_BREAK_SUBSCRIPTION
} from '../initialData';
import { convertQuantity, convertCostPerUnit, convertQuantityAdvanced, convertCostPerUnitAdvanced } from '../lib/unitUtils';
import { playNotificationChime, playSuccessChime } from '../lib/notificationSound';
import {
  saveRestaurantToFirestore,
  fetchRestaurantsFromFirestore,
  fetchUsersFromFirestore,
  generateAnnualCodeForRestaurant,
  approveRestaurantInFirestore,
  verifyActivationCodeInFirestore,
  deleteRestaurantFromFirestore,
  permanentlyDeleteRestaurantFromFirestore,
  subscribeRestaurantsRealtime,
  normalizeArabicNumerals,
  saveStaffRequestToFirestore,
  subscribeStaffRequestsRealtime,
  updateStaffRequestStatusInFirestore,
  deleteStaffRequestFromFirestore,
  FirestoreRestaurantRecord,
  FirestoreStaffRequest,
  PlatformOwnerContact,
  DEFAULT_PLATFORM_OWNER_CONTACT,
  getPlatformOwnerContact,
  savePlatformOwnerContactToFirestore,
  subscribePlatformOwnerContact,
  PLATFORM_OWNER_CONTACT,
  RestaurantCloudData,
  saveRestaurantAppDataToFirestore,
  fetchRestaurantAppDataFromFirestore,
  subscribeRestaurantAppDataRealtime,
  isQuotaExhausted,
  auth,
  firebaseUserSignIn,
  firebaseUserSignUp,
  firebaseUserSignOut,
  firebaseUserResetPassword,
  saveUserProfileToFirestore,
  fetchUserProfileFromFirestore,
  type FirestoreUserProfile
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';


export { PLATFORM_OWNER_CONTACT };

interface DataContextType {
  // Current Tenant & Session Context
  isAuthenticated: boolean;
  currentRestaurant: Restaurant;
  currentBranch: Branch;
  currentUser: User;
  isPlatformOwner: boolean;
  branches: Branch[];
  users: User[];
  pendingUsers: User[];
  pendingUsersCount: number;
  requireOwnerApproval: boolean;
  setRequireOwnerApproval: (val: boolean) => void;
  systemRegistrations: SystemRegistration[];
  subscriptionRequests: RestaurantSubscriptionRequest[];
  pendingRestaurantRequestsCount: number;
  ownerContact: PlatformOwnerContact;
  updateOwnerContact: (contact: Partial<PlatformOwnerContact>) => Promise<void>;
  requestRestaurantSubscription: (params: {
    restaurantName: string;
    ownerName: string;
    phone: string;
    email?: string;
    city?: string;
    branchesCount?: number;
    planType?: SaaSPlanType;
    notes?: string;
  }) => { success: boolean; message: string; requestId: string };
  approveRestaurantSubscription: (requestId: string, durationYears?: number) => Promise<{ code: string; expiry: string; restaurantName: string; ownerName?: string; ownerPhone: string }>;
  rejectRestaurantSubscription: (requestId: string, reason?: string) => Promise<void>;
  activateRestaurantWithCode: (code: string, phoneOrEmail?: string) => Promise<{ success: boolean; message: string; user?: User; restaurant?: Restaurant }>;
  deleteRestaurantRecord: (restaurantId: string) => Promise<boolean>;
  deleteSubscriptionRequest: (requestId: string) => Promise<boolean>;
  createDirectRestaurantLicense: (params: {
    name: string;
    ownerName: string;
    phone: string;
    email?: string;
    city?: string;
    planType?: SaaSPlanType;
    durationYears?: number;
  }) => Promise<{ restaurantId: string; code: string; expiry: string }>;
  
  // Data Collections
  categories: Category[];
  rawMaterialCategories: RawMaterialCategoryInfo[];
  products: Product[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  suppliers: Supplier[];
  purchases: Purchase[];
  stockMovements: StockMovement[];
  orders: Order[];
  expenses: Expense[];
  activityLogs: ActivityLog[];
  chatMessages: AIChatMessage[];

  // User Authentication & Switching
  loginUser: (emailOrPhone: string, passwordInput?: string) => Promise<LoginResult>;
  logoutUser: () => void;
  updateUserPassword: (userId: string, newPass: string) => { success: boolean; message: string };
  setCurrentUser: (user: User) => void;
  switchUserWithPassword: (userId: string, passwordInput: string) => { success: boolean; message: string; user?: User };
  setCurrentBranch: (branch: Branch) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;

  // Shift & Role Passwords Management (Owner exclusive control)
  activeShiftRole: ShiftRoleType | null;
  isShiftUnlocked: boolean;
  rolePasswords: RestaurantRolePasswords;
  selectShiftRole: (role: ShiftRoleType, passwordInput: string) => { success: boolean; message: string };
  updateRolePasswords: (passwords: Partial<RestaurantRolePasswords>) => { success: boolean; message: string };
  lockToShiftSelection: () => void;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'restaurantId'>) => void;
  approveUser: (userId: string, assignedRole?: UserRole, assignedBranchId?: string) => void;
  rejectUser: (userId: string, reason?: string) => void;
  deleteStaffRequest: (userId: string) => void;
  requestUserRegistration: (params: { name: string; emailOrPhone: string; role?: UserRole; branchId?: string; notes?: string; password?: string }) => { isPending: boolean; message: string; user: User };
  deleteUser: (userId: string) => boolean;
  toggleUserActive: (userId: string) => void;
  addBranch: (name: string, address: string, phone: string) => void;
  updateBranch: (branchId: string, updates: Partial<Branch>) => void;
  deleteBranch: (branchId: string) => boolean;
  registerNewTenant: (restaurantName: string, ownerName: string, emailOrPhone: string, method?: 'email' | 'phone', password?: string) => Promise<{ success: boolean; tenantId?: string; error?: string }>;
  deleteRegistrationRecord: (id: string) => void;

  // Domain Actions
  addProduct: (product: Omit<Product, 'id' | 'restaurantId' | 'branchId'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  addCategory: (name: string, icon?: string) => Category;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => boolean;
  
  addIngredient: (ing: Omit<Ingredient, 'id' | 'restaurantId'>) => Ingredient;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => boolean;
  updateIngredientStock: (id: string, newStock: number, reason?: string) => void;
  
  saveRecipe: (productId: string, items: { ingredientId: string; ingredientName: string; unit: string; quantity: number }[]) => Recipe;
  
  addRawMaterialCategory: (name: string, icon?: string) => RawMaterialCategoryInfo;
  deleteRawMaterialCategory: (id: string) => boolean;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'restaurantId'>) => Supplier;
  deleteSupplier: (id: string) => boolean;
  
  recordPurchase: (supplierId: string, supplierName: string, items: { ingredientId: string; ingredientName: string; quantity: number; unit: string; costPerUnit: number }[], shiftRoleOverride?: ShiftRoleType, customDate?: string) => Purchase;
  updatePurchase: (purchaseId: string, updates: { supplierId: string; supplierName: string; items: { ingredientId: string; ingredientName: string; quantity: number; unit: string; costPerUnit: number }[]; shiftRole?: ShiftRoleType; date?: string }) => boolean;
  deletePurchase: (purchaseId: string) => boolean;
  
  recordWaste: (ingredientId: string, quantity: number, unit: string, reason?: string) => StockMovement;
  
  addExpense: (title: string, category: ExpenseCategory, amount: number, notes?: string, recipientOrWorker?: string, paymentMethod?: 'cash' | 'card' | 'bank', date?: string, shiftRoleOverride?: ShiftRoleType) => Expense;
  updateExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'restaurantId' | 'branchId'>>) => void;
  deleteExpense: (id: string) => void;
  clearAllExpenses: () => void;
  
  createOrder: (items: { product: Product; quantity: number }[], paymentMethod: 'cash' | 'card') => Order;
  
  logActivity: (actionType: string, description: string, details?: string) => void;
  clearAllProductsAndIngredients: () => void;

  // AI Assistant Communication
  sendChatMessage: (userText: string) => Promise<void>;
  confirmPendingAIAction: (messageId: string, approved: boolean) => Promise<void>;
  clearChatHistory: () => void;

  // SaaS Commercial & Licensing Management
  firestoreRestaurants: FirestoreRestaurantRecord[];
  generateAnnualActivationCode: (restaurantId: string, restaurantName: string) => Promise<{ code: string; newExpiry: string }>;
  licenseInfo: SoftwareLicense;
  isLicenseExpired: boolean;

  licenseKeys: LicenseKeyInfo[];
  redeemLicenseKey: (key: string) => { success: boolean; message: string; planName?: string };
  generateLicenseKey: (params: { planType: SaaSPlanType; durationDays: number; clientName: string; salesRep: string }) => string;
  updateRestaurantBranding: (updates: { name?: string; currency?: string; taxNumber?: string; address?: string; phone?: string }) => void;
  exportSystemBackup: () => string;
  importSystemBackup: (jsonContent: string) => boolean;

  // Offline & Synchronization Management
  isOnline: boolean;
  pendingOfflineCount: number;
  triggerOfflineSync: () => void;
  toggleOfflineSimulation: () => void;
  isSimulatedOffline: boolean;
  isCloudSynced: boolean;
  lastCloudSyncTime: string;
  syncCloudNow: () => Promise<void>;

  // Reports & Analytics Helpers
  getDashboardStats: () => DashboardStats;
  getLowMarginProducts: () => { product: Product; recipe?: Recipe; margin: number; cost: number }[];

  // In-App Realtime Notifications System
  notifications: InAppNotification[];
  unreadNotificationsCount: number;
  addInAppNotification: (notif: Omit<InAppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteInAppNotification: (id: string) => void;
  clearAllNotifications: () => void;
  approveRequestFromNotification: (notificationId: string, assignedRole?: UserRole, assignedBranchId?: string) => Promise<void>;
  rejectRequestFromNotification: (notificationId: string, reason?: string) => Promise<void>;
  activeRealtimeAlert: InAppNotification | null;
  dismissRealtimeAlert: () => void;
}

const STORAGE_KEY = 'mato_saas_data_v1';

const DEFAULT_RAW_MATERIAL_CATEGORIES: RawMaterialCategoryInfo[] = [
  { id: 'produce', name: 'خضروات وفواكه', icon: '🥗', isCustom: false },
  { id: 'canned', name: 'معلبات', icon: '🥫', isCustom: false },
  { id: 'meats', name: 'لحومات', icon: '🥩', isCustom: false },
  { id: 'cheeses', name: 'أجبان وألبان', icon: '🧀', isCustom: false },
  { id: 'packaging', name: 'تغليف ومستلزمات', icon: '🛍️', isCustom: false },
  { id: 'other', name: 'أخرى', icon: '📦', isCustom: false }
];

const DEFAULT_SOFTWARE_LICENSE: SoftwareLicense = {
  licenseKey: 'MATO-PRO-2026-8891-SYR',
  planType: 'professional',
  planNameAr: 'الباقة الاحترافية الشاملة',
  clientName: 'مطعم ومقهى الشام العريق',
  salesRep: 'قسم مبيعات MATO SaaS',
  maxBranches: 5,
  maxUsers: 20,
  isAiFeaturesEnabled: true,
  isInvoiceScannerEnabled: true,
  isMultiBranchEnabled: true,
  activatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  expiresAt: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: 'active',
  annualPrice: 2400
};

const DEFAULT_LICENSE_KEYS: LicenseKeyInfo[] = [
  {
    id: 'key_1',
    key: 'MATO-ENT-9900-LIFETIME',
    planType: 'enterprise',
    planNameAr: 'باقة المؤسسات - ترخيص دائم',
    durationDays: 36500,
    clientName: 'مجموعة مطاعم السلطان العريق',
    salesRep: 'أحمد الحسين (مبيعات دمشق)',
    createdAt: new Date().toISOString().split('T')[0],
    isRedeemed: false
  },
  {
    id: 'key_2',
    key: 'MATO-PRO-8842-1YEAR',
    planType: 'professional',
    planNameAr: 'الباقة الاحترافية (1 سنة)',
    durationDays: 365,
    clientName: 'مطعم بيت الشاورما',
    salesRep: 'سامر الميداني (مبيعات طرطوس)',
    createdAt: new Date().toISOString().split('T')[0],
    isRedeemed: false
  },
  {
    id: 'key_3',
    key: 'MATO-STR-1020-30DAYS',
    planType: 'starter',
    planNameAr: 'الباقة الأساسية (30 يوم تجريبي)',
    durationDays: 30,
    clientName: 'كافيه الياسمين',
    salesRep: 'مبيعات حلب',
    createdAt: new Date().toISOString().split('T')[0],
    isRedeemed: true,
    redeemedBy: 'كافيه الياسمين',
    redeemedAt: new Date().toISOString().split('T')[0]
  }
];

const DEFAULT_SYSTEM_REGISTRATIONS: SystemRegistration[] = [];

const DataContext = createContext<DataContextType | undefined>(undefined);

function safeStorageParse<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null || saved === undefined) return fallback;
    const parsed = JSON.parse(saved);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed as T;
  } catch (e) {
    console.warn(`Failed to parse storage item "${key}":`, e);
    return fallback;
  }
}

function safeStorageArrayParse<T>(key: string, fallback: T[]): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) return parsed as T[];
    return fallback;
  } catch (e) {
    console.warn(`Failed to parse array storage item "${key}":`, e);
    return fallback;
  }
}

function getTenantDeletedIds(restId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_deleted_${restId}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function addTenantDeletedId(restId: string, itemId: string) {
  if (!restId || !itemId) return;
  try {
    const set = getTenantDeletedIds(restId);
    set.add(itemId);
    localStorage.setItem(`${STORAGE_KEY}_deleted_${restId}`, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

function mergeTenantArray<T extends { id: string }>(
  localArr: T[],
  cloudArr: T[],
  deletedSet: Set<string>
): T[] {
  const map = new Map<string, T>();
  if (Array.isArray(cloudArr)) {
    cloudArr.forEach(item => {
      if (item && item.id && !deletedSet.has(item.id)) {
        map.set(item.id, item);
      }
    });
  }
  if (Array.isArray(localArr)) {
    localArr.forEach(item => {
      if (item && item.id && !deletedSet.has(item.id)) {
        map.set(item.id, item);
      }
    });
  }
  return Array.from(map.values());
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session & Authentication State (Session-only, defaults to false on fresh visits/shared links)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      // Clear legacy permanent auto-login key from localStorage so shared links never auto-enter
      localStorage.removeItem(`${STORAGE_KEY}_is_authenticated`);
      const sessionUserId = sessionStorage.getItem(`${STORAGE_KEY}_session_user_id`);
      return Boolean(sessionUserId);
    } catch {
      return false;
    }
  });

  const [systemRegistrations, setSystemRegistrations] = useState<SystemRegistration[]>(() => {
    return safeStorageArrayParse(`${STORAGE_KEY}_system_registrations`, []);
  });

  // Load state from localStorage or initial seed
  const [restaurant, setRestaurant] = useState<Restaurant>(() => {
    const parsed = safeStorageParse<Restaurant | null>(`${STORAGE_KEY}_restaurant`, null);
    return (parsed && typeof parsed === 'object' && parsed.id) ? parsed : INITIAL_RESTAURANT;
  });

  const [rawMaterialCategories, setRawMaterialCategories] = useState<RawMaterialCategoryInfo[]>(() => {
    const parsed = safeStorageArrayParse<RawMaterialCategoryInfo>(`${STORAGE_KEY}_rawMaterialCategories`, DEFAULT_RAW_MATERIAL_CATEGORIES);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_RAW_MATERIAL_CATEGORIES;
    try {
      if (!parsed.some(c => c && c.id === 'packaging')) {
        const packagingCat: RawMaterialCategoryInfo = { id: 'packaging', name: 'تغليف ومستلزمات', icon: '🛍️', isCustom: false };
        const otherIdx = parsed.findIndex(c => c && c.id === 'other');
        if (otherIdx !== -1) {
          parsed.splice(otherIdx, 0, packagingCat);
        } else {
          parsed.push(packagingCat);
        }
      }
      return parsed;
    } catch {
      return DEFAULT_RAW_MATERIAL_CATEGORIES;
    }
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    return safeStorageArrayParse(`${STORAGE_KEY}_branches`, INITIAL_BRANCHES);
  });

  const [currentBranch, setCurrentBranchState] = useState<Branch>(() => (Array.isArray(branches) && branches[0]) ? branches[0] : INITIAL_BRANCHES[0]);

  const [users, setUsers] = useState<User[]>(() => {
    const list = safeStorageArrayParse<User>(`${STORAGE_KEY}_users`, INITIAL_USERS);
    let result = (Array.isArray(list) && list.length > 0) ? list : INITIAL_USERS;
    const hasOwner = result.some(u => u.email === 'farid.fateh@hotmail.com' || u.email === 'owner@mato.sy' || u.role === 'Owner');
    if (!hasOwner) {
      result = [...INITIAL_USERS, ...result];
    }
    // Ensure Food Break owner is always available
    if (!result.some(u => u.email === 'foodbreak@mato.sy' || u.id === 'usr_foodbreak_owner')) {
      result = [...result, usr_foodbreak_owner];
    }
    // Ensure all accounts have a password defined
    return result.map(u => {
      if (!u.password) {
        return {
          ...u,
          password: u.role === 'Owner' ? 'admin' : '123456',
          pinCode: u.pinCode || '1234'
        };
      }
      return u;
    });
  });

  const [requireOwnerApproval, setRequireOwnerApprovalState] = useState<boolean>(() => {
    return safeStorageParse<boolean>(`${STORAGE_KEY}_require_owner_approval`, true);
  });

  const setRequireOwnerApproval = (val: boolean) => {
    setRequireOwnerApprovalState(val);
    localStorage.setItem(`${STORAGE_KEY}_require_owner_approval`, JSON.stringify(val));
    logActivity('إعدادات الأمان', `تم ${val ? 'تفعيل' : 'تعطيل'} شرط موافقة المالك المسبقة على الحسابات الجديدة`);
  };

  const pendingUsers = useMemo(() => {
    return users.filter(u => u.isPendingApproval === true && u.restaurantId === restaurant.id);
  }, [users, restaurant.id]);

  const pendingUsersCount = pendingUsers.length;

  const defaultGuestUser: User = {
    id: 'usr_guest',
    restaurantId: 'rest_01',
    branchId: 'br_main',
    name: 'زائر',
    email: '',
    role: 'Cashier',
    isPlatformOwner: false,
    isActive: false,
    createdAt: new Date().toISOString()
  };

  const [currentUser, setCurrentUserState] = useState<User>(() => {
    try {
      const sessionUserId = sessionStorage.getItem(`${STORAGE_KEY}_session_user_id`);
      if (sessionUserId && Array.isArray(users)) {
        const found = users.find(u => u.id === sessionUserId);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return defaultGuestUser;
  });

  // Platform Owner flag: true strictly for Farid (SaaS Platform Creator & System SuperAdmin) ONLY when Authenticated
  const isPlatformOwner = useMemo(() => {
    if (!isAuthenticated || !currentUser) return false;
    return (
      (currentUser.isPlatformOwner === true || currentUser.id === 'usr_owner_farid') &&
      currentUser.email?.toLowerCase() === 'farid.fateh@hotmail.com'
    );
  }, [isAuthenticated, currentUser]);

  // Shift & Role Selection State
  const [activeShiftRole, setActiveShiftRoleState] = useState<ShiftRoleType | null>(() => {
    try {
      const stored = sessionStorage.getItem(`${STORAGE_KEY}_active_shift_role`);
      if (stored === 'owner' || stored === 'manager' || stored === 'cashier_morning' || stored === 'cashier_evening') {
        return stored as ShiftRoleType;
      }
    } catch {}
    return null;
  });

  const [isShiftUnlocked, setIsShiftUnlocked] = useState<boolean>(() => {
    try {
      const stored = sessionStorage.getItem(`${STORAGE_KEY}_active_shift_role`);
      return Boolean(stored);
    } catch {
      return false;
    }
  });

  // Sync state automatically with Firebase Auth
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const isFarid = fbUser.email?.toLowerCase() === 'farid.fateh@hotmail.com';
          let profile = await fetchUserProfileFromFirestore(fbUser.uid);

          if (!profile) {
            profile = {
              uid: fbUser.uid,
              name: fbUser.displayName || (isFarid ? 'فريد الفاتح' : 'صاحب المطعم'),
              email: fbUser.email || '',
              role: 'Owner',
              restaurantId: isFarid ? 'rest_01' : `rest_${fbUser.uid.substring(0, 10)}`,
              restaurantName: isFarid ? 'منظومة MATO POS المركزية' : 'مطعمي',
              branchId: 'br_main',
              isPlatformOwner: isFarid,
              isActive: true,
              createdAt: new Date().toISOString()
            };
            await saveUserProfileToFirestore(profile);
          }

          const activeUser: User = {
            id: profile.uid,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            role: profile.role as UserRole,
            restaurantId: profile.restaurantId,
            branchId: profile.branchId || '',
            isPlatformOwner: profile.isPlatformOwner,
            isActive: profile.isActive !== false,
            createdAt: profile.createdAt || new Date().toISOString()
          };

          setUsers(prev => {
            const filtered = prev.filter(u => u.id !== activeUser.id && u.email !== activeUser.email);
            return [activeUser, ...filtered];
          });

          // Do NOT hijack an existing active session (e.g. Food Break or another tenant) on reload
          const existingSessionUserId = sessionStorage.getItem(`${STORAGE_KEY}_session_user_id`);
          const savedRest = safeStorageParse<Restaurant | null>(`${STORAGE_KEY}_restaurant`, null);
          const hasDifferentActiveSession =
            (existingSessionUserId && existingSessionUserId !== activeUser.id) ||
            (savedRest?.id && savedRest.id !== profile.restaurantId);

          if (!hasDifferentActiveSession) {
            if (profile.restaurantId) {
              setRestaurant(prev => ({
                ...prev,
                id: profile!.restaurantId,
                name: profile!.restaurantName || prev.name
              }));
            }

            setCurrentUserState(activeUser);
            setIsAuthenticated(true);
            try {
              sessionStorage.setItem(`${STORAGE_KEY}_session_user_id`, activeUser.id);
            } catch {
              // ignore
            }
          }
        } catch (e) {
          console.warn('Error loading user profile on auth state change:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = safeStorageArrayParse<Category | null>(`${STORAGE_KEY}_categories`, null as any);
    if (Array.isArray(saved)) return saved;
    return INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const initialList = safeStorageArrayParse<Product | null>(`${STORAGE_KEY}_products`, null as any);
    const list = Array.isArray(initialList) ? initialList : INITIAL_PRODUCTS;
    return list.map(p => {
      if (!p) return p;
      const isSalad = p.name?.includes('سلطة') || p.name?.includes('سلطه') || p.categoryName?.includes('سلطة') || p.categoryName?.includes('سلطه') || p.categoryId === 'cat_salads';
      if (isSalad && p.imageUrl) {
        return { ...p, imageUrl: undefined };
      }
      return p;
    });
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = safeStorageArrayParse<Ingredient | null>(`${STORAGE_KEY}_ingredients`, null as any);
    if (Array.isArray(saved)) return saved;
    return INITIAL_INGREDIENTS;
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = safeStorageArrayParse<Recipe | null>(`${STORAGE_KEY}_recipes`, null as any);
    if (Array.isArray(saved)) return saved;
    return INITIAL_RECIPES;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = safeStorageArrayParse<Supplier | null>(`${STORAGE_KEY}_suppliers`, null as any);
    if (Array.isArray(saved)) return saved;
    return INITIAL_SUPPLIERS;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = safeStorageArrayParse<Purchase | null>(`${STORAGE_KEY}_purchases`, null as any);
    if (Array.isArray(saved)) return saved;
    return INITIAL_PURCHASES;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = safeStorageArrayParse<StockMovement | null>(`${STORAGE_KEY}_stockMovements`, null as any);
    if (Array.isArray(saved)) return saved;
    return INITIAL_STOCK_MOVEMENTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = safeStorageArrayParse<Order | null>(`${STORAGE_KEY}_orders`, null as any);
    if (Array.isArray(saved)) return saved;
    return INITIAL_ORDERS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = safeStorageArrayParse<Expense | null>(`${STORAGE_KEY}_expenses`, null as any);
    if (Array.isArray(saved)) return saved;
    return INITIAL_EXPENSES;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = safeStorageArrayParse<ActivityLog | null>(`${STORAGE_KEY}_activityLogs`, null as any);
    if (Array.isArray(saved)) return saved;
    return INITIAL_LOGS;
  });

  const [licenseInfo, setLicenseInfo] = useState<SoftwareLicense>(() => {
    const parsed = safeStorageParse<SoftwareLicense | null>(`${STORAGE_KEY}_licenseInfo`, null);
    return (parsed && typeof parsed === 'object' && parsed.licenseKey) ? parsed : DEFAULT_SOFTWARE_LICENSE;
  });

  const [licenseKeys, setLicenseKeys] = useState<LicenseKeyInfo[]>(() => {
    return safeStorageArrayParse(`${STORAGE_KEY}_licenseKeys`, DEFAULT_LICENSE_KEYS);
  });

  // In-App Realtime Notifications System (Dedicated to Employee Registration Requests for current restaurant)
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = safeStorageArrayParse<InAppNotification>(`${STORAGE_KEY}_inapp_notifications`, []);
    const filteredSaved = saved
      ? saved.filter(
          n =>
            n.type !== 'subscription_request' &&
            n.id !== 'notif_demo_01' &&
            n.id !== 'notif_demo_03' &&
            n.entityId !== 'usr_samer_pending'
        )
      : [];
    return filteredSaved;
  });

  const [activeRealtimeAlert, setActiveRealtimeAlert] = useState<InAppNotification | null>(null);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_inapp_notifications`, JSON.stringify(notifications));
  }, [notifications]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const addInAppNotification = useCallback((notif: Omit<InAppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: InAppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      ...notif
    };

    setNotifications(prev => [newNotif, ...prev.filter(n => !(n.entityId && notif.entityId && n.entityId === notif.entityId && n.type === notif.type))]);
    
    // Play chime sound
    playNotificationChime();

    // Trigger instant alert banner
    setActiveRealtimeAlert(newNotif);
  }, []);

  const dismissRealtimeAlert = useCallback(() => {
    setActiveRealtimeAlert(null);
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const deleteInAppNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setActiveRealtimeAlert(prev => prev?.id === id ? null : prev);
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setActiveRealtimeAlert(null);
  }, []);

  // Firestore Realtime Restaurants
  const [firestoreRestaurants, setFirestoreRestaurants] = useState<FirestoreRestaurantRecord[]>([]);

  // Role passwords for this restaurant with fallback defaults
  const rolePasswords: RestaurantRolePasswords = useMemo(() => {
    const ownerUser = users.find(u => (restaurant.id && u.restaurantId === restaurant.id && u.role === 'Owner') || u.role === 'Owner' || u.isPlatformOwner);
    const fsRest = firestoreRestaurants.find(r => (restaurant.id && r.id === restaurant.id) || (currentUser?.phone && r.phone === currentUser.phone));
    const defaultOwnerPass = restaurant.rolePasswords?.ownerPassword || restaurant.ownerPassword || fsRest?.ownerPassword || fsRest?.password || currentUser?.password || ownerUser?.password || '123454321';
    return {
      ownerPassword: defaultOwnerPass,
      managerPassword: restaurant.rolePasswords?.managerPassword || '1234',
      morningCashierPassword: restaurant.rolePasswords?.morningCashierPassword || '1111',
      eveningCashierPassword: restaurant.rolePasswords?.eveningCashierPassword || '2222'
    };
  }, [restaurant.rolePasswords, restaurant.ownerPassword, restaurant.id, users, firestoreRestaurants, currentUser]);

  // Subscription Requests State (Pending / Approved Restaurant Registrations)
  const [subscriptionRequests, setSubscriptionRequests] = useState<RestaurantSubscriptionRequest[]>(() => {
    const list = safeStorageArrayParse<RestaurantSubscriptionRequest>(`${STORAGE_KEY}_subscription_requests`, [INITIAL_FOOD_BREAK_SUBSCRIPTION]);
    let result = (Array.isArray(list) && list.length > 0) ? list : [INITIAL_FOOD_BREAK_SUBSCRIPTION];
    if (!result.some(r => r.id === 'rest_foodbreak' || r.email === 'foodbreak@mato.sy')) {
      result = [INITIAL_FOOD_BREAK_SUBSCRIPTION, ...result];
    }
    return result;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_subscription_requests`, JSON.stringify(subscriptionRequests));
  }, [subscriptionRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save users to localStorage:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_system_registrations`, JSON.stringify(systemRegistrations));
    } catch (e) {
      console.warn('Failed to save systemRegistrations to localStorage:', e);
    }
  }, [systemRegistrations]);

  useEffect(() => {
    // Sync cloud users from Firestore into local users list
    fetchUsersFromFirestore().then((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(prev => {
          let updated = [...prev];
          cloudUsers.forEach(cu => {
            const existingIdx = updated.findIndex(u => u.id === cu.id || (cu.phone && u.phone === cu.phone));
            const parsedUser: User = {
              id: cu.id || cu.uid,
              name: cu.name || 'مستخدم معتمد',
              email: cu.email || `${cu.phone}@mato.sy`,
              phone: cu.phone,
              password: cu.password || '123454321',
              pinCode: cu.pinCode || '1234',
              role: (cu.role as UserRole) || 'Owner',
              restaurantId: cu.restaurantId || 'sub_1790630390550',
              branchId: cu.branchId || '',
              isActive: cu.isActive !== false,
              isPendingApproval: false,
              isPlatformOwner: cu.isPlatformOwner || false,
              createdAt: cu.createdAt || new Date().toISOString()
            };
            if (existingIdx >= 0) {
              updated[existingIdx] = { ...updated[existingIdx], ...parsedUser };
            } else {
              updated.push(parsedUser);
            }
          });
          return updated;
        });
      }
    }).catch(console.warn);

    const unsubscribeRest = subscribeRestaurantsRealtime((records) => {
      setFirestoreRestaurants(records);
    });

    const unsubscribeStaff = subscribeStaffRequestsRealtime((records) => {
      // Sync incoming pending staff requests into users collection if not present
      if (records && records.length > 0) {
        setUsers(prev => {
          let updated = [...prev];
          records.forEach(sr => {
            if (sr.status === 'pending' && !updated.some(u => u.id === sr.id || u.email === sr.emailOrPhone || u.phone === sr.emailOrPhone)) {
              const isEmail = sr.emailOrPhone.includes('@');
              const newPendingUser: User = {
                id: sr.id,
                restaurantId: sr.restaurantId || restaurant.id,
                branchId: sr.branchId || branches[0]?.id || 'br_main',
                name: sr.name,
                email: isEmail ? sr.emailOrPhone : `${sr.emailOrPhone}@restaurant.sy`,
                phone: isEmail ? undefined : sr.emailOrPhone,
                password: sr.password || '123456',
                pinCode: '1234',
                role: (sr.role as UserRole) || 'Cashier',
                requestedRole: (sr.role as UserRole) || 'Cashier',
                isActive: false,
                isPendingApproval: true,
                requestedAt: sr.requestedAt || new Date().toISOString(),
                approvalNotes: sr.notes,
                createdAt: sr.requestedAt || new Date().toISOString()
              };
              updated.push(newPendingUser);

              // Also trigger in-app notification and chime
              addInAppNotification({
                type: 'user_registration',
                title: 'طلب انضمام موظف جديد (سحابي)',
                message: `قام الموظف (${sr.name}) بطلب انضمام بصفة (${sr.role || 'كاشير'}) للمطعم.`,
                entityId: sr.id,
                entityData: {
                  name: sr.name,
                  emailOrPhone: sr.emailOrPhone,
                  role: (sr.role as UserRole) || 'Cashier',
                  branchId: sr.branchId,
                  notes: sr.notes
                },
                status: 'pending'
              });
            }
          });
          return updated;
        });
      }
    });

    return () => {
      unsubscribeRest();
      unsubscribeStaff();
    };
  }, [restaurant.id, branches, addInAppNotification]);

  const [ownerContact, setOwnerContact] = useState<PlatformOwnerContact>(() => {
    return getPlatformOwnerContact();
  });

  useEffect(() => {
    const unsubscribeOwner = subscribePlatformOwnerContact((contact) => {
      setOwnerContact(contact);
    });
    return () => unsubscribeOwner();
  }, []);

  const updateOwnerContact = async (contactUpdate: Partial<PlatformOwnerContact>) => {
    const updated: PlatformOwnerContact = {
      ...ownerContact,
      ...contactUpdate
    };
    if (contactUpdate.whatsappNumber) {
      updated.whatsappNumber = contactUpdate.whatsappNumber.replace(/[^0-9]/g, '');
    }
    setOwnerContact(updated);
    await savePlatformOwnerContactToFirestore(updated);
  };

  const pendingRestaurantRequestsCount = useMemo(() => {
    const localPending = subscriptionRequests.filter(r => r.status === 'pending_approval').length;
    const firestorePending = firestoreRestaurants.filter(r => r.status === 'pending_approval' && !subscriptionRequests.some(s => s.id === r.id)).length;
    return localPending + firestorePending;
  }, [subscriptionRequests, firestoreRestaurants]);

  const requestRestaurantSubscription = (params: {
    restaurantName: string;
    ownerName: string;
    phone: string;
    email?: string;
    password?: string;
    city?: string;
    branchesCount?: number;
    planType?: SaaSPlanType;
    notes?: string;
  }) => {
    const reqId = `sub_${Date.now()}`;
    const pwd = (params.password || '123456').trim();
    const cleanPhone = params.phone.trim();
    const cleanEmail = params.email ? params.email.trim().toLowerCase() : '';

    const newRequest: RestaurantSubscriptionRequest = {
      id: reqId,
      restaurantName: params.restaurantName,
      ownerName: params.ownerName,
      phone: cleanPhone,
      email: cleanEmail,
      password: pwd,
      city: params.city || 'دمشق',
      branchesCount: params.branchesCount || 1,
      planType: params.planType || 'professional',
      status: 'pending_approval',
      notes: params.notes || '',
      requestedAt: new Date().toISOString()
    };

    setSubscriptionRequests(prev => [newRequest, ...prev]);

    // Pre-provision SystemRegistration record as pending approval
    const newRegRecord: SystemRegistration = {
      id: `reg_${Date.now()}`,
      restaurantName: params.restaurantName,
      ownerName: params.ownerName,
      emailOrPhone: cleanPhone || cleanEmail,
      password: pwd,
      method: cleanEmail ? 'email' : 'phone',
      planType: params.planType || 'professional',
      registeredAt: new Date().toISOString(),
      status: 'pending_approval',
      tenantId: reqId,
      city: params.city || 'دمشق',
      notes: params.notes || ''
    };
    setSystemRegistrations(prev => [newRegRecord, ...prev.filter(r => r.emailOrPhone !== cleanPhone && r.emailOrPhone !== cleanEmail)]);

    // Pre-provision User in users collection as pending approval
    const newOwnerUser: User = {
      id: `usr_${reqId}`,
      restaurantId: reqId,
      branchId: '',
      name: params.ownerName,
      email: cleanEmail || `${cleanPhone}@mato.sy`,
      phone: cleanPhone,
      password: pwd,
      pinCode: '1234',
      role: 'Owner',
      isPlatformOwner: false,
      isActive: false,
      isPendingApproval: true,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [newOwnerUser, ...prev.filter(u => u.phone !== cleanPhone && u.email !== cleanEmail)]);

    // Attempt Firebase Auth user sign-up in background
    firebaseUserSignUp({
      emailOrPhone: cleanEmail || cleanPhone,
      password: pwd,
      name: params.ownerName,
      restaurantName: params.restaurantName,
      phone: cleanPhone,
      role: 'Owner'
    }).catch(e => console.warn('Background Firebase Auth registration attempt:', e));

    // Save to Firestore as pending
    saveRestaurantToFirestore({
      id: reqId,
      name: params.restaurantName,
      ownerName: params.ownerName,
      phone: cleanPhone,
      email: cleanEmail,
      status: 'pending_approval',
      activationCode: '',
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      registeredAt: new Date().toISOString(),
      planType: params.planType || 'professional'
    });

    logActivity('طلب فتح مطعم', `تم تقديم طلب ترخيص وفتح حساب مطعم جديد (${params.restaurantName}) بواسطة (${params.ownerName}) وهو بانتظار موافقة فريد وإرسال كود التفعيل`);

    return {
      success: true,
      message: 'تم إرسال طلب تسجيل المطعم بنجاح! حسابك بانتظار موافقة مالك المنظومة (أ. فريد) وإرسال كود التفعيل السنوي لتتمكن من استخدام البرنامج.',
      requestId: reqId
    };
  };

  const approveRestaurantSubscription = async (requestId: string, durationYears: number = 1) => {
    const targetLocal = subscriptionRequests.find(r => r.id === requestId);
    const targetFirestore = firestoreRestaurants.find(r => r.id === requestId);
    const restName = targetLocal?.restaurantName || targetFirestore?.name || 'مطعم معتمد';
    const ownerName = targetLocal?.ownerName || targetFirestore?.ownerName || 'مدير المطعم';
    const ownerPhone = targetLocal?.phone || targetFirestore?.phone || '';

    // Calculate expiry date
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + durationYears);
    const expiryIso = expiry.toISOString();

    // Generate annual code
    const generated = await generateAnnualCodeForRestaurant(requestId, restName);
    
    // 1. Update subscriptionRequests state
    setSubscriptionRequests(prev => {
      const exists = prev.some(r => r.id === requestId);
      if (exists) {
        return prev.map(r => r.id === requestId ? {
          ...r,
          status: 'approved',
          activationCode: generated.code,
          expiresAt: generated.newExpiry || expiryIso,
          approvedAt: new Date().toISOString()
        } : r);
      } else {
        return [{
          id: requestId,
          restaurantName: restName,
          ownerName: ownerName,
          phone: ownerPhone,
          planType: (targetFirestore?.planType as SaaSPlanType) || 'professional',
          status: 'approved',
          activationCode: generated.code,
          expiresAt: generated.newExpiry || expiryIso,
          requestedAt: targetFirestore?.registeredAt || new Date().toISOString(),
          approvedAt: new Date().toISOString()
        }, ...prev];
      }
    });

    // 2. Update systemRegistrations state
    setSystemRegistrations(prev => prev.map(r => {
      if (r.tenantId === requestId || r.id === requestId || (ownerPhone && r.emailOrPhone === ownerPhone)) {
        return {
          ...r,
          status: 'active',
          activationCode: generated.code
        };
      }
      return r;
    }));

    // 3. Activate associated owner user in users state
    setUsers(prev => prev.map(u => {
      if (u.restaurantId === requestId || (ownerPhone && (u.phone === ownerPhone || u.email?.startsWith(ownerPhone)))) {
        return {
          ...u,
          isActive: true,
          isPendingApproval: false
        };
      }
      return u;
    }));

    // 4. Update firestoreRestaurants local mirror
    setFirestoreRestaurants(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'active',
          activationCode: generated.code,
          subscriptionExpiry: generated.newExpiry || expiryIso
        };
      }
      return r;
    }));

    // 5. Add to licenseKeys collection for quick redemption
    setLicenseKeys(prev => {
      if (prev.some(k => k.key === generated.code)) return prev;
      return [
        {
          id: `key_${Date.now()}`,
          key: generated.code,
          planType: (targetLocal?.planType || targetFirestore?.planType || 'professional') as SaaSPlanType,
          planNameAr: 'الباقة السنوية المعتمدة (1 سنة)',
          durationDays: 365 * durationYears,
          clientName: restName,
          salesRep: 'فريد الفاتح (المدير)',
          createdAt: new Date().toISOString().split('T')[0],
          isRedeemed: true,
          redeemedBy: restName,
          redeemedAt: new Date().toISOString().split('T')[0]
        },
        ...prev
      ];
    });

    await approveRestaurantInFirestore(requestId, generated.code, generated.newExpiry || expiryIso);

    logActivity('موافقة على ترخيص مطعم', `تمت الموافقة على ترخيص مطعم (${restName}) وتوليد كود التفعيل السنوي (${generated.code}) وتمديده حتى ${new Date(generated.newExpiry || expiryIso).toLocaleDateString('ar-SY')}`);

    return {
      code: generated.code,
      expiry: generated.newExpiry || expiryIso,
      restaurantName: restName,
      ownerName,
      ownerPhone
    };
  };

  // Activate Restaurant & Login Directly via Activation Code
  const activateRestaurantWithCode = async (
    code: string,
    phoneOrEmail?: string
  ): Promise<{ success: boolean; message: string; user?: User; restaurant?: Restaurant }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'يرجى إدخال كود التفعيل السنوي المستلم من فريد.' };
    }

    // 1. Check in subscriptionRequests
    const subMatch = subscriptionRequests.find(s => s.activationCode?.toUpperCase() === cleanCode);

    // 2. Check in firestoreRestaurants
    const fsMatch = firestoreRestaurants.find(r => r.activationCode?.toUpperCase() === cleanCode);

    // 3. Verify in Firestore cloud
    const cloudCheck = await verifyActivationCodeInFirestore(cleanCode);

    // 4. Check licenseKeys
    const keyMatch = licenseKeys.find(k => k.key.toUpperCase() === cleanCode);

    const isValid = Boolean(subMatch || fsMatch || cloudCheck.valid || keyMatch);

    if (!isValid) {
      return {
        success: false,
        message: 'كود التفعيل غير صحيح أو لم يتم اعتماده بعد من قبل مالك المنظومة (فريد). يرجى التأكد من الكود.'
      };
    }

    const restId = subMatch?.id || fsMatch?.id || cloudCheck.restaurant?.id || `rest_${Date.now()}`;
    const restName = subMatch?.restaurantName || fsMatch?.name || cloudCheck.restaurant?.name || keyMatch?.clientName || 'مطعم المشترك';
    const ownerName = subMatch?.ownerName || fsMatch?.ownerName || cloudCheck.restaurant?.ownerName || 'مدير المطعم';
    const ownerPhone = subMatch?.phone || fsMatch?.phone || cloudCheck.restaurant?.phone || phoneOrEmail || '';

    const oneYearExpiry = new Date();
    oneYearExpiry.setFullYear(oneYearExpiry.getFullYear() + 1);
    const expiryIso = oneYearExpiry.toISOString();

    // Activate in subscriptionRequests
    setSubscriptionRequests(prev => prev.map(s => {
      if (s.id === restId || s.activationCode?.toUpperCase() === cleanCode) {
        return {
          ...s,
          status: 'approved',
          activationCode: cleanCode,
          expiresAt: expiryIso,
          approvedAt: new Date().toISOString()
        };
      }
      return s;
    }));

    // Activate in systemRegistrations
    setSystemRegistrations(prev => prev.map(r => {
      if (r.tenantId === restId || r.id === restId || r.activationCode?.toUpperCase() === cleanCode) {
        return {
          ...r,
          status: 'active',
          activationCode: cleanCode
        };
      }
      return r;
    }));

    // Activate or find User
    let activeUser = users.find(u => 
      u.restaurantId === restId ||
      (ownerPhone && (u.phone === ownerPhone || u.email?.startsWith(ownerPhone)))
    );

    if (activeUser) {
      activeUser = {
        ...activeUser,
        isActive: true,
        isPendingApproval: false
      };
      setUsers(prev => prev.map(u => u.id === activeUser!.id ? activeUser! : u));
    } else {
      activeUser = {
        id: `usr_${restId}`,
        restaurantId: restId,
        branchId: '',
        name: ownerName,
        email: `${ownerPhone || restId}@mato.sy`,
        phone: ownerPhone,
        password: 'admin',
        pinCode: '1234',
        role: 'Owner',
        isPlatformOwner: false,
        isActive: true,
        isPendingApproval: false,
        createdAt: new Date().toISOString()
      };
      setUsers(prev => [activeUser!, ...prev]);
    }

    // Activate SoftwareLicense
    setLicenseInfo({
      licenseKey: cleanCode,
      planType: (subMatch?.planType || fsMatch?.planType || 'professional') as SaaSPlanType,
      planNameAr: 'الباقة الاحترافية الشاملة (1 سنة)',
      clientName: restName,
      salesRep: 'فريد الفاتح (المدير)',
      maxBranches: 5,
      maxUsers: 20,
      isAiFeaturesEnabled: true,
      isInvoiceScannerEnabled: true,
      isMultiBranchEnabled: true,
      activatedAt: new Date().toISOString().split('T')[0],
      expiresAt: expiryIso.split('T')[0],
      status: 'active',
      annualPrice: 2400
    });

    const activeRest: Restaurant = {
      id: restId,
      name: restName,
      type: 'restaurant',
      currency: 'ل.س',
      createdAt: new Date().toISOString()
    };
    setRestaurant(activeRest);
    setCurrentUserState(activeUser);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem(`${STORAGE_KEY}_session_user_id`, activeUser.id);
    } catch {
      // ignore
    }

    await approveRestaurantInFirestore(restId, cleanCode, expiryIso);

    logActivity('تفعيل كود واستخدام البرنامج', `قام (${ownerName}) بتفعيل كود الترخيص السنوي (${cleanCode}) لمطعم (${restName}) وبدء استخدام المنظومة`);

    return {
      success: true,
      message: `تم التحقق من كود التفعيل بنجاح! تم تنشيط حساب مطعم (${restName}) لمدة سنة كاملة. أهلاً وسهلاً بك!`,
      user: activeUser,
      restaurant: activeRest
    };
  };

  const rejectRestaurantSubscription = async (requestId: string, reason?: string) => {
    setSubscriptionRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status: 'rejected',
      notes: reason ? `${r.notes || ''} [سبب الرفض: ${reason}]` : r.notes
    } : r));

    await deleteRestaurantFromFirestore(requestId);
    logActivity('رفض طلب مطعم', `تم رفض طلب ترخيص المطعم (${requestId})`);
  };

  const deleteRestaurantRecord = async (restaurantId: string): Promise<boolean> => {
    // 1. Remove from subscription requests
    setSubscriptionRequests(prev => prev.filter(r => r.id !== restaurantId));
    // 2. Remove from system registrations
    setSystemRegistrations(prev => prev.filter(r => r.id !== restaurantId && r.tenantId !== restaurantId));
    // 3. Remove from firestore local mirror
    setFirestoreRestaurants(prev => prev.filter(r => r.id !== restaurantId));

    // 4. Delete permanently from Firestore cloud database
    await permanentlyDeleteRestaurantFromFirestore(restaurantId);

    logActivity('حذف حساب وسجل مطعم', `تم حذف حساب وترخيص المطعم (${restaurantId}) بالكامل من النظام والسحابة`);
    return true;
  };

  const deleteSubscriptionRequest = async (requestId: string): Promise<boolean> => {
    return await deleteRestaurantRecord(requestId);
  };

  const createDirectRestaurantLicense = async (params: {
    name: string;
    ownerName: string;
    phone: string;
    email?: string;
    city?: string;
    planType?: SaaSPlanType;
    durationYears?: number;
  }) => {
    const restId = `rest_${Date.now()}`;
    const duration = params.durationYears || 1;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + duration);

    const generatedCode = `MATO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Save to Firestore
    await saveRestaurantToFirestore({
      id: restId,
      name: params.name,
      ownerName: params.ownerName,
      phone: params.phone,
      email: params.email || '',
      status: 'active',
      activationCode: generatedCode,
      subscriptionExpiry: expiry.toISOString(),
      registeredAt: new Date().toISOString(),
      planType: params.planType || 'professional'
    });

    const newReq: RestaurantSubscriptionRequest = {
      id: restId,
      restaurantName: params.name,
      ownerName: params.ownerName,
      phone: params.phone,
      email: params.email || '',
      city: params.city || 'دمشق',
      branchesCount: 1,
      planType: params.planType || 'professional',
      status: 'approved',
      activationCode: generatedCode,
      expiresAt: expiry.toISOString(),
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString()
    };

    setSubscriptionRequests(prev => [newReq, ...prev]);
    logActivity('إنشاء ترخيص مطعم مباشر', `قام المالك فريد بإنشاء وترخيص مطعم جديد (${params.name}) وتوليد كود التفعيل السنوي (${generatedCode})`);

    return {
      restaurantId: restId,
      code: generatedCode,
      expiry: expiry.toISOString()
    };
  };

  const generateAnnualActivationCode = async (restaurantId: string, restaurantName: string) => {
    const result = await generateAnnualCodeForRestaurant(restaurantId, restaurantName);
    logActivity('توليد كود تفعيل سنوي', `تم إصدار كود تفعيل سنوي جديد (${result.code}) للمطعم (${restaurantName}) وتمديد صلاحيته حتى ${new Date(result.newExpiry).toLocaleDateString('ar-SY')}`);
    return result;
  };

  // Offline & Synchronization Engine State

  const [networkOnline, setNetworkOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(() => {
    const queue = localStorage.getItem(`${STORAGE_KEY}_offline_queue`);
    return queue ? JSON.parse(queue).length : 0;
  });

  const isOnline = networkOnline && !isSimulatedOffline;

  useEffect(() => {
    const handleOnline = () => {
      setNetworkOnline(true);
      logActivity('اتصال بالإنترنت', 'تم استعادة الاتصال بالشبكة بنجاح! جاري مزامنة بيانات الأوفلاين...');
      triggerOfflineSync();
    };

    const handleOffline = () => {
      setNetworkOnline(false);
      logActivity('انقطاع الإنترنت', 'انقطع الاتصال بالشبكة — تم تفعيل وضع العمل دون إنترنت (Offline Mode)');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleOfflineSimulation = () => {
    setIsSimulatedOffline(prev => {
      const next = !prev;
      if (next) {
        logActivity('محاكاة أوفلاين', 'تم تفعيل وضع تجربة العمل بدون إنترنت يدوياً للتحقق من حفظ البيانات محلياً');
      } else {
        logActivity('إلغاء محاكاة أوفلاين', 'تم العودة للعمل عبر الشبكة الحية ومزامنة البيانات المحفوظة محلياً');
        triggerOfflineSync();
      }
      return next;
    });
  };

  const triggerOfflineSync = () => {
    const queueRaw = localStorage.getItem(`${STORAGE_KEY}_offline_queue`);
    if (queueRaw) {
      try {
        const queue = JSON.parse(queueRaw);
        if (queue.length > 0) {
          logActivity('مزامنة أوفلاين', `تمت مزامنة ${queue.length} عمليات محليّة تم حفظها أثناء انقطاع الإنترنت بنجاح!`);
          localStorage.removeItem(`${STORAGE_KEY}_offline_queue`);
          setPendingOfflineCount(0);
        }
      } catch {
        localStorage.removeItem(`${STORAGE_KEY}_offline_queue`);
        setPendingOfflineCount(0);
      }
    }
  };

  // Check if annual activation subscription has expired (Platform Owner Farid is ALWAYS immune with lifetime access)
  const isLicenseExpired = useMemo(() => {
    if (isPlatformOwner) return false;
    if (!licenseInfo || !licenseInfo.expiresAt) return false;
    const expiry = new Date(licenseInfo.expiresAt).getTime();
    const now = new Date().getTime();
    return now > expiry || licenseInfo.status === 'expired';
  }, [licenseInfo, isPlatformOwner]);

  // SaaS Commercial & License Redemption
  const redeemLicenseKey = (keyString: string) => {
    const trimmed = keyString.trim().toUpperCase();
    const existingKey = licenseKeys.find(k => k.key.toUpperCase() === trimmed);

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const defaultOneYearExpiry = oneYearFromNow.toISOString().split('T')[0];

    if (existingKey) {
      if (existingKey.isRedeemed) {
        return { success: false, message: 'هذا الكود تم استخدامه سابقاً بواسطة عميل آخر.' };
      }

      const days = existingKey.durationDays || 365;
      const calcExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const updatedLicense: SoftwareLicense = {
        ...licenseInfo,
        licenseKey: existingKey.key,
        planType: existingKey.planType,
        planNameAr: existingKey.planNameAr || 'تفعيل سنوي (1 سنة)',
        expiresAt: calcExpiry,
        status: 'active',
        activatedAt: new Date().toISOString().split('T')[0],
        isAiFeaturesEnabled: true,
        isInvoiceScannerEnabled: true,
        isMultiBranchEnabled: true
      };

      setLicenseInfo(updatedLicense);

      setLicenseKeys(prev => prev.map(k => k.id === existingKey.id ? {
        ...k,
        isRedeemed: true,
        redeemedBy: restaurant.name,
        redeemedAt: new Date().toISOString().split('T')[0]
      } : k));

      logActivity('تفعيل كود سنوي', `تم تفعيل ترخيص الاشتراك السنوي: ${existingKey.key} بنجاح حتى ${calcExpiry}`);
      return { success: true, message: `تم تفعيل الاشتراك السنوي بنجاح! يسري حتى ${calcExpiry}`, planName: existingKey.planNameAr };
    }

    // Accept any valid MATO activation code or 6+ char activation code provided by owner
    if (trimmed.length >= 6) {
      const isEnt = trimmed.includes('ENT');
      const isPro = trimmed.includes('PRO');
      const planType: SaaSPlanType = isEnt ? 'enterprise' : (isPro ? 'professional' : 'starter');
      const planNameAr = isEnt ? 'باقة المؤسسات (1 سنة)' : 'تفعيل سنوي شامل (1 سنة)';

      const updatedLicense: SoftwareLicense = {
        ...licenseInfo,
        licenseKey: trimmed,
        planType,
        planNameAr,
        expiresAt: defaultOneYearExpiry,
        status: 'active',
        activatedAt: new Date().toISOString().split('T')[0],
        isAiFeaturesEnabled: true,
        isInvoiceScannerEnabled: true,
        isMultiBranchEnabled: true
      };
      setLicenseInfo(updatedLicense);
      logActivity('تفعيل كود سنوي', `تم تفعيل كود التفعيل السنوي (${trimmed}) بنجاح لمدة 365 يوماً حتى ${defaultOneYearExpiry}`);
      return { success: true, message: `تم تفعيل كود التفعيل السنوي بنجاح لمدة سنة كاملة (365 يوماً)! ينتهي التفعيل في ${defaultOneYearExpiry}`, planName: planNameAr };
    }

    return { success: false, message: 'كود التفعيل السنوي غير صحيح. يرجى الحصول على كود تفعيل صادر عن مالك النظام.' };
  };

  const generateLicenseKey = (params: { planType: SaaSPlanType; durationDays: number; clientName: string; salesRep: string }) => {
    const prefix = params.planType === 'enterprise' ? 'MATO-ENT' : (params.planType === 'professional' ? 'MATO-PRO' : 'MATO-STR');
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const suffix = params.durationDays === 36500 ? 'LIFETIME' : `${params.durationDays}DAYS`;
    const newKey = `${prefix}-${randomCode}-${suffix}`;

    const planNameAr = params.planType === 'enterprise' ? 'باقة المؤسسات - ترخيص دائم' : (params.planType === 'professional' ? 'الباقة الاحترافية الشاملة' : 'الباقة الأساسية');

    const newKeyInfo: LicenseKeyInfo = {
      id: `key_${Date.now()}`,
      key: newKey,
      planType: params.planType,
      planNameAr,
      durationDays: params.durationDays,
      clientName: params.clientName,
      salesRep: params.salesRep,
      createdAt: new Date().toISOString().split('T')[0],
      isRedeemed: false
    };

    setLicenseKeys(prev => [newKeyInfo, ...prev]);
    logActivity('إنشاء ترخيص', `تم إصدار مفتاح ترخيص جديد ${newKey} للعميل ${params.clientName}`);
    return newKey;
  };

  const updateRestaurantBranding = (updates: { name?: string; currency?: string; taxNumber?: string; address?: string; phone?: string }) => {
    setRestaurant(prev => ({
      ...prev,
      ...updates
    }));
    logActivity('تحديث الهوية', 'تم تحديث البيانات التجارية وشعار المنشأة');
  };

  const exportSystemBackup = () => {
    const backupData = {
      version: '4.5',
      exportedAt: new Date().toISOString(),
      restaurant,
      branches,
      users,
      categories,
      rawMaterialCategories,
      products,
      ingredients,
      recipes,
      suppliers,
      purchases,
      stockMovements,
      orders,
      expenses,
      licenseInfo
    };
    return JSON.stringify(backupData, null, 2);
  };

  const importSystemBackup = (jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.restaurant) setRestaurant(parsed.restaurant);
      if (parsed.branches) setBranches(parsed.branches);
      if (parsed.users) setUsers(parsed.users);
      if (parsed.categories) setCategories(parsed.categories);
      if (parsed.rawMaterialCategories) setRawMaterialCategories(parsed.rawMaterialCategories);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.ingredients) setIngredients(parsed.ingredients);
      if (parsed.recipes) setRecipes(parsed.recipes);
      if (parsed.suppliers) setSuppliers(parsed.suppliers);
      if (parsed.purchases) setPurchases(parsed.purchases);
      if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
      if (parsed.orders) setOrders(parsed.orders);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.licenseInfo) setLicenseInfo(parsed.licenseInfo);

      logActivity('استيراد نسخة', 'تم استرجاع قاعدة بيانات نظام المطعم بالكامل من ملف خارجي');
      return true;
    } catch {
      return false;
    }
  };

  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: `أهلاً بك في المرشد التعليمي والمساعد الذكي لبرنامج MATO POS! 🎓🤖

أنا هنا لأعلمك كيفية استخدام كافة أقسام البرنامج خطوة بخطوة، أو لتنفيذ الأوامر عنك مباشرة!

📌 **أقسام البرنامج الرئيسية وكيفية استخدامها:**

1️⃣ **نقطة البيع الكاشير (POS):**
• اختر الوجبات، حدد رقم الطاولة أو نوع الطلب (صالة / سفري / توصيل).
• أضف خصماً أو ملاحظات ثم اضغط "إتمام الطلب وطباعة الفاتورة".

2️⃣ **إدارة المنتجات والتصنيفات (Products):**
• أنشئ تصنيفات للوجبات (مثل: بيتزا، مشويات، مشروبات).
• أضف الوجبات مع أسعارها وتصنيفها. (أو يمكنك القول لي: "أضف منتج اسمه بيتزا مارجريتا بسعر 35000 وتصنيف بيتزا").

3️⃣ **إدارة المخزون والمواد الأولية (Inventory):**
• تابع كميات المواد الخام كالبن، اللحوم، والخضار، وحد التنبيه للانخفاض.
• يمكنك تسجيل الهدر أو إضافة مادة فورياً عبر الشات.

4️⃣ **الوصفات وحساب التكاليف (Recipes):**
• اربط الوجبة بمكوناتها الأولية لحساب التكلفة الفعلية وهامش الربح بدقة، مع خصم المكونات تلقائياً من المخزون عند البيع!

5️⃣ **الموردين والمشتريات (Suppliers & Purchases):**
• سجل بيانات الموردين وفواتير توريد المواد لتحديث رصيد المخزون وتكاليف المواد تلقائياً.

6️⃣ **التقارير المباشرة والأرباح (Dashboard):**
• تابع إجمالي المبيعات اليومية، صافي الأرباح، أكثر الأصناف مبيعاً، والنشاطات.

💡 **أسئلة يمكنك طرحها عليّ لتعليمك:**
• "كيف بستخدم كاشير المبيعات POS؟"
• "كيف أربط الوصفة بالمكونات لحساب التكلفة؟"
• "كيف أسجل فاتورة شراء من مورد؟"
• "كيف بتابع المواد اللي رح تخلص بالمخزون؟"`,
      timestamp: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Clear all products and materials per user request
  const clearAllProductsAndIngredients = () => {
    setProducts([]);
    setIngredients([]);
    setRecipes([]);
    setPurchases([]);
    setStockMovements([]);
    setOrders([]);
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_ingredients`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_recipes`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_purchases`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_stockMovements`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify([]));
    logActivity('مسح البيانات', 'تم مسح جميع الوجبات والمواد الأولية بطلب المستخدم');
  };

  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>(() => new Date().toISOString());
  const isRemoteSyncRef = React.useRef<boolean>(false);
  const hasInitializedRestRef = React.useRef<Record<string, boolean>>({});

  // Real-time Firestore Cloud Synchronization for the active Restaurant
  useEffect(() => {
    if (!restaurant?.id) return;
    const currentRestId = restaurant.id;

    // Immediately hydrate from tenant-specific local cache if available when switching/reloading
    const localTenantIngredients = safeStorageArrayParse<Ingredient>(`${STORAGE_KEY}_${currentRestId}_ingredients`, []);
    if (localTenantIngredients.length > 0) {
      setIngredients(prev => {
        const deletedSet = getTenantDeletedIds(currentRestId);
        const sameTenantPrev = prev.filter(i => i.restaurantId === currentRestId);
        return mergeTenantArray(localTenantIngredients, sameTenantPrev, deletedSet);
      });
    }

    const unsubscribe = subscribeRestaurantAppDataRealtime(currentRestId, (cloudData) => {
      if (cloudData && cloudData.restaurantId === currentRestId) {
        isRemoteSyncRef.current = true;
        hasInitializedRestRef.current[currentRestId] = true;
        const deletedSet = getTenantDeletedIds(currentRestId);

        if (Array.isArray(cloudData.products)) {
          const localProds = safeStorageArrayParse<Product>(`${STORAGE_KEY}_${currentRestId}_products`, []);
          const merged = mergeTenantArray(localProds, cloudData.products, deletedSet);
          setProducts(merged);
          localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(merged));
          localStorage.setItem(`${STORAGE_KEY}_${currentRestId}_products`, JSON.stringify(merged));
        }
        if (Array.isArray(cloudData.categories)) {
          const localCats = safeStorageArrayParse<Category>(`${STORAGE_KEY}_${currentRestId}_categories`, []);
          const merged = mergeTenantArray(localCats, cloudData.categories, deletedSet);
          setCategories(merged);
          localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(merged));
          localStorage.setItem(`${STORAGE_KEY}_${currentRestId}_categories`, JSON.stringify(merged));
        }
        if (Array.isArray(cloudData.rawMaterialCategories) && cloudData.rawMaterialCategories.length > 0) {
          const localRawCats = safeStorageArrayParse<RawMaterialCategoryInfo>(`${STORAGE_KEY}_${currentRestId}_rawMaterialCategories`, []);
          const merged = mergeTenantArray(localRawCats, cloudData.rawMaterialCategories, deletedSet);
          setRawMaterialCategories(merged);
          localStorage.setItem(`${STORAGE_KEY}_rawMaterialCategories`, JSON.stringify(merged));
          localStorage.setItem(`${STORAGE_KEY}_${currentRestId}_rawMaterialCategories`, JSON.stringify(merged));
        }
        if (Array.isArray(cloudData.ingredients)) {
          const localIngs = safeStorageArrayParse<Ingredient>(`${STORAGE_KEY}_${currentRestId}_ingredients`, []);
          const merged = mergeTenantArray(localIngs, cloudData.ingredients, deletedSet);
          setIngredients(merged);
          localStorage.setItem(`${STORAGE_KEY}_ingredients`, JSON.stringify(merged));
          localStorage.setItem(`${STORAGE_KEY}_${currentRestId}_ingredients`, JSON.stringify(merged));
        }
        if (Array.isArray(cloudData.recipes)) {
          const localRecs = safeStorageArrayParse<Recipe>(`${STORAGE_KEY}_${currentRestId}_recipes`, []);
          const merged = mergeTenantArray(localRecs, cloudData.recipes, deletedSet);
          setRecipes(merged);
          localStorage.setItem(`${STORAGE_KEY}_recipes`, JSON.stringify(merged));
          localStorage.setItem(`${STORAGE_KEY}_${currentRestId}_recipes`, JSON.stringify(merged));
        }
        if (Array.isArray(cloudData.suppliers)) {
          const localSups = safeStorageArrayParse<Supplier>(`${STORAGE_KEY}_${currentRestId}_suppliers`, []);
          const merged = mergeTenantArray(localSups, cloudData.suppliers, deletedSet);
          setSuppliers(merged);
          localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(merged));
          localStorage.setItem(`${STORAGE_KEY}_${currentRestId}_suppliers`, JSON.stringify(merged));
        }
        if (Array.isArray(cloudData.purchases)) {
          const localPurs = safeStorageArrayParse<Purchase>(`${STORAGE_KEY}_${currentRestId}_purchases`, []);
          const merged = mergeTenantArray(localPurs, cloudData.purchases, deletedSet);
          setPurchases(merged);
          localStorage.setItem(`${STORAGE_KEY}_purchases`, JSON.stringify(merged));
          localStorage.setItem(`${STORAGE_KEY}_${currentRestId}_purchases`, JSON.stringify(merged));
        }
        if (Array.isArray(cloudData.stockMovements)) {
          const localMovs = safeStorageArrayParse<StockMovement>(`${STORAGE_KEY}_${currentRestId}_stockMovements`, []);
          const merged = mergeTenantArray(localMovs, cloudData.stockMovements, deletedSet);
          setStockMovements(merged);
          localStorage.setItem(`${STORAGE_KEY}_stockMovements`, JSON.stringify(merged));
          localStorage.setItem(`${STORAGE_KEY}_${currentRestId}_stockMovements`, JSON.stringify(merged));
        }
        if (Array.isArray(cloudData.orders)) {
          const localOrds = safeStorageArrayParse<Order>(`${STORAGE_KEY}_${currentRestId}_orders`, []);
          const merged = mergeTenantArray(localOrds, cloudData.orders, deletedSet);
          setOrders(merged);
          localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(merged));
          localStorage.setItem(`${STORAGE_KEY}_${currentRestId}_orders`, JSON.stringify(merged));
        }
        if (Array.isArray(cloudData.expenses)) {
          const localExps = safeStorageArrayParse<Expense>(`${STORAGE_KEY}_${currentRestId}_expenses`, []);
          const merged = mergeTenantArray(localExps, cloudData.expenses, deletedSet);
          setExpenses(merged);
          localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(merged));
          localStorage.setItem(`${STORAGE_KEY}_${currentRestId}_expenses`, JSON.stringify(merged));
        }
        if (Array.isArray(cloudData.branches) && cloudData.branches.length > 0) {
          setBranches(cloudData.branches);
          localStorage.setItem(`${STORAGE_KEY}_branches`, JSON.stringify(cloudData.branches));
        }
        if (Array.isArray(cloudData.users) && cloudData.users.length > 0) {
          setUsers(prev => {
            const mergedMap = new Map<string, User>();
            prev.forEach(u => mergedMap.set(u.id, u));
            cloudData.users!.forEach((cu: User) => {
              const existing = mergedMap.get(cu.id);
              mergedMap.set(cu.id, { ...existing, ...cu });
            });
            return Array.from(mergedMap.values());
          });
        }
        if (cloudData.restaurant && cloudData.restaurant.name) {
          setRestaurant(prev => ({ ...prev, ...cloudData.restaurant }));
          localStorage.setItem(`${STORAGE_KEY}_restaurant`, JSON.stringify(cloudData.restaurant));
        }

        setIsCloudSynced(true);
        setLastCloudSyncTime(cloudData.updatedAt || new Date().toISOString());

        setTimeout(() => {
          isRemoteSyncRef.current = false;
        }, 2000);
      } else if (!cloudData) {
        // Document does not exist in Firestore yet for this restaurant
        // Seed initial data to Firestore if quota allows
        if (!hasInitializedRestRef.current[currentRestId]) {
          hasInitializedRestRef.current[currentRestId] = true;
          const initialProducts = currentRestId === 'rest_foodbreak' ? FOOD_BREAK_PRODUCTS : (products.length > 0 ? products : INITIAL_PRODUCTS);
          const initialCats = currentRestId === 'rest_foodbreak' ? FOOD_BREAK_CATEGORIES : (categories.length > 0 ? categories : INITIAL_CATEGORIES);
          const initialBranchesList = currentRestId === 'rest_foodbreak' ? FOOD_BREAK_BRANCHES : (branches.length > 0 ? branches : INITIAL_BRANCHES);
          const initialRest = currentRestId === 'rest_foodbreak' ? FOOD_BREAK_RESTAURANT : (restaurant.name ? restaurant : INITIAL_RESTAURANT);

          if (currentRestId === 'rest_foodbreak') {
            setProducts(FOOD_BREAK_PRODUCTS);
            setCategories(FOOD_BREAK_CATEGORIES);
            setBranches(FOOD_BREAK_BRANCHES);
            setRestaurant(FOOD_BREAK_RESTAURANT);
          }

          if (!isQuotaExhausted()) {
            saveRestaurantAppDataToFirestore(currentRestId, {
              restaurantId: currentRestId,
              restaurant: initialRest,
              branches: initialBranchesList,
              categories: initialCats,
              rawMaterialCategories,
              products: initialProducts,
              ingredients,
              recipes,
              suppliers,
              purchases,
              stockMovements,
              orders,
              expenses,
              users
            }).then(() => {
              setIsCloudSynced(true);
              setLastCloudSyncTime(new Date().toISOString());
            }).catch(console.warn);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [restaurant?.id]);

  // Debounced Auto-Sync from local changes up to Firestore Cloud (Quota-Safe)
  useEffect(() => {
    if (isRemoteSyncRef.current) return;
    if (!restaurant?.id) return;
    if (isQuotaExhausted()) return;
    if (!hasInitializedRestRef.current[restaurant.id]) {
      // Avoid uploading local default data before initial cloud load is established
      return;
    }

    const timer = setTimeout(() => {
      if (isRemoteSyncRef.current || isQuotaExhausted()) return;
      saveRestaurantAppDataToFirestore(restaurant.id, {
        restaurantId: restaurant.id,
        restaurant,
        branches,
        categories,
        rawMaterialCategories,
        products,
        ingredients,
        recipes,
        suppliers,
        purchases,
        stockMovements,
        orders,
        expenses,
        users
      }).then(() => {
        setIsCloudSynced(true);
        setLastCloudSyncTime(new Date().toISOString());
      }).catch(err => {
        console.warn('Auto cloud sync warning:', err);
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [
    restaurant,
    branches,
    categories,
    rawMaterialCategories,
    products,
    ingredients,
    recipes,
    suppliers,
    purchases,
    stockMovements,
    orders,
    expenses,
    users
  ]);

  const syncCloudNow = async () => {
    if (!restaurant?.id) return;
    if (isQuotaExhausted()) {
      setIsCloudSynced(true);
      return;
    }
    setIsCloudSynced(false);
    await saveRestaurantAppDataToFirestore(restaurant.id, {
      restaurantId: restaurant.id,
      restaurant,
      branches,
      categories,
      rawMaterialCategories,
      products,
      ingredients,
      recipes,
      suppliers,
      purchases,
      stockMovements,
      orders,
      expenses,
      users
    });
    setIsCloudSynced(true);
    setLastCloudSyncTime(new Date().toISOString());
    logActivity('مزامنة سحابية يدوية', 'تمت المزامنة الفورية لكافة المنتجات والبيانات مع السحابة بنجاح');
  };

  // Persist data locally on change (both global and tenant-scoped keys)
  useEffect(() => {
    localStorage.removeItem(`${STORAGE_KEY}_is_authenticated`); // Clean up legacy persistent auth key
    localStorage.setItem(`${STORAGE_KEY}_system_registrations`, JSON.stringify(systemRegistrations));
    localStorage.setItem(`${STORAGE_KEY}_restaurant`, JSON.stringify(restaurant));
    localStorage.setItem(`${STORAGE_KEY}_branches`, JSON.stringify(branches));
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
    localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
    localStorage.setItem(`${STORAGE_KEY}_rawMaterialCategories`, JSON.stringify(rawMaterialCategories));
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
    localStorage.setItem(`${STORAGE_KEY}_ingredients`, JSON.stringify(ingredients));
    localStorage.setItem(`${STORAGE_KEY}_recipes`, JSON.stringify(recipes));
    localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
    localStorage.setItem(`${STORAGE_KEY}_purchases`, JSON.stringify(purchases));
    localStorage.setItem(`${STORAGE_KEY}_stockMovements`, JSON.stringify(stockMovements));
    localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(orders));
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
    localStorage.setItem(`${STORAGE_KEY}_activityLogs`, JSON.stringify(activityLogs));
    localStorage.setItem(`${STORAGE_KEY}_licenseInfo`, JSON.stringify(licenseInfo));
    localStorage.setItem(`${STORAGE_KEY}_licenseKeys`, JSON.stringify(licenseKeys));

    if (restaurant?.id) {
      const rId = restaurant.id;
      localStorage.setItem(`${STORAGE_KEY}_${rId}_categories`, JSON.stringify(categories));
      localStorage.setItem(`${STORAGE_KEY}_${rId}_rawMaterialCategories`, JSON.stringify(rawMaterialCategories));
      localStorage.setItem(`${STORAGE_KEY}_${rId}_products`, JSON.stringify(products));
      localStorage.setItem(`${STORAGE_KEY}_${rId}_ingredients`, JSON.stringify(ingredients));
      localStorage.setItem(`${STORAGE_KEY}_${rId}_recipes`, JSON.stringify(recipes));
      localStorage.setItem(`${STORAGE_KEY}_${rId}_suppliers`, JSON.stringify(suppliers));
      localStorage.setItem(`${STORAGE_KEY}_${rId}_purchases`, JSON.stringify(purchases));
      localStorage.setItem(`${STORAGE_KEY}_${rId}_stockMovements`, JSON.stringify(stockMovements));
      localStorage.setItem(`${STORAGE_KEY}_${rId}_orders`, JSON.stringify(orders));
      localStorage.setItem(`${STORAGE_KEY}_${rId}_expenses`, JSON.stringify(expenses));
    }
  }, [systemRegistrations, restaurant, branches, users, categories, rawMaterialCategories, products, ingredients, recipes, suppliers, purchases, stockMovements, orders, expenses, activityLogs, licenseInfo, licenseKeys]);

  // Helper logging
  const logActivity = (actionType: string, description: string, details?: string) => {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      restaurantId: restaurant?.id || 'rest_01',
      branchId: currentBranch?.id || 'br_main',
      userId: currentUser?.id || 'usr_guest',
      userName: currentUser?.name || 'مستخدم',
      userRole: currentUser?.role || 'Cashier',
      actionType,
      description,
      details,
      createdAt: new Date().toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Auth & Roles
  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    try {
      sessionStorage.setItem(`${STORAGE_KEY}_session_user_id`, user.id);
    } catch {
      // ignore
    }
    logActivity('تبديل المستخدم', `تم تسجيل الدخول بصفتك ${user.name} (${user.role})`);
  };

  const setCurrentBranch = (branch: Branch) => {
    setCurrentBranchState(branch);
    logActivity('تبديل الفرع', `تم الانتقال إلى ${branch.name}`);
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    logActivity('تحديث صلاحيات', `تعديل دور المستخدم id:${userId} إلى ${newRole}`);
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'restaurantId'>) => {
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
      restaurantId: restaurant.id,
      password: userData.password || (userData.role === 'Owner' ? 'admin' : '123456'),
      pinCode: userData.pinCode || '1234',
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      isPendingApproval: false,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    logActivity('إضافة مستخدم', `إضافة المستخدم الجديد ${newUser.name} بدور ${newUser.role}`);
  };

  const approveUser = (userId: string, assignedRole?: UserRole, assignedBranchId?: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated: User = {
          ...u,
          isPendingApproval: false,
          isActive: true,
          role: assignedRole || u.requestedRole || u.role || 'Cashier',
          branchId: assignedBranchId || u.branchId || branches[0]?.id || 'br_main',
        };
        logActivity('اعتماد مستخدم', `تمت الموافقة وتفعيل حساب ${updated.name} (${updated.email}) بدور ${updated.role}`);
        return updated;
      }
      return u;
    }));

    // Update in Firestore cloud
    updateStaffRequestStatusInFirestore(userId, 'approved');
  };

  const rejectUser = (userId: string, reason?: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    setUsers(prev => prev.filter(u => u.id !== userId));
    logActivity('رفض تسجيل مستخدم', `تم رفض طلب انضمام ${target.name} (${target.email}) ${reason ? `السبب: ${reason}` : ''}`);

    // Delete or update in Firestore cloud
    deleteStaffRequestFromFirestore(userId);
  };

  const requestUserRegistration = (params: {
    name: string;
    emailOrPhone: string;
    role?: UserRole;
    branchId?: string;
    notes?: string;
    password?: string;
  }): { isPending: boolean; message: string; user: User } => {
    const cleanContact = params.emailOrPhone.trim();
    const isEmail = cleanContact.includes('@');
    
    // If there are no existing active users in the system, this user is the primary Owner
    const isFirstEverUser = users.filter(u => !u.isPendingApproval).length === 0;

    const newUser: User = {
      id: `usr_${Date.now()}`,
      restaurantId: restaurant.id,
      branchId: params.branchId || branches[0]?.id || 'br_main',
      name: params.name.trim(),
      email: isEmail ? cleanContact : `${cleanContact}@restaurant.sy`,
      phone: isEmail ? undefined : cleanContact,
      password: params.password || '123456',
      pinCode: '1234',
      role: isFirstEverUser ? 'Owner' : (params.role || 'Cashier'),
      requestedRole: params.role || 'Cashier',
      isActive: isFirstEverUser || !requireOwnerApproval,
      isPendingApproval: !isFirstEverUser && requireOwnerApproval,
      requestedAt: new Date().toISOString(),
      approvalNotes: params.notes,
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [
      ...prev.filter(u => u.email !== newUser.email && (!newUser.phone || u.phone !== newUser.phone)),
      newUser
    ]);

    // Save to Firestore cloud database so the manager/owner receives it in realtime across all devices
    saveStaffRequestToFirestore({
      id: newUser.id,
      name: newUser.name,
      emailOrPhone: cleanContact,
      role: params.role || 'Cashier',
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      branchId: params.branchId || branches[0]?.id || 'br_main',
      status: (!isFirstEverUser && requireOwnerApproval) ? 'pending' : 'approved',
      password: params.password || '123456',
      notes: params.notes,
      requestedAt: new Date().toISOString()
    });

    if (isFirstEverUser || !requireOwnerApproval) {
      setCurrentUserState(newUser);
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem(`${STORAGE_KEY}_session_user_id`, newUser.id);
      } catch {
        // ignore
      }
      logActivity('تسجيل وتفعيل حساب', `تم إنشاء وتفعيل حساب ${newUser.name} بدور ${newUser.role}`);
      return {
        isPending: false,
        message: 'تم تفعيل حسابك والدخول بنجاح!',
        user: newUser
      };
    } else {
      logActivity('طلب انضمام بانتظار الموافقة', `طلب تسجيل موظف جديد من (${newUser.name}) بانتظار اعتماد المالك`);
      
      // In-app Realtime Notification trigger
      addInAppNotification({
        type: 'user_registration',
        title: 'طلب انضمام مستخدم جديد',
        message: `طلب تسجيل موظف جديد (${newUser.name}) بصفة (${newUser.requestedRole || 'كاشير'})`,
        entityId: newUser.id,
        entityData: {
          name: newUser.name,
          emailOrPhone: cleanContact,
          phone: newUser.phone,
          email: newUser.email,
          role: newUser.requestedRole,
          branchId: newUser.branchId,
          notes: params.notes
        },
        status: 'pending'
      });

      return {
        isPending: true,
        message: 'تم استلام طلب التسجيل بنجاح! الحساب بانتظار موافقة واعتماد مالك المطعم لتفعيل الصلاحيات.',
        user: newUser
      };
    }
  };

  const approveRequestFromNotification = async (notificationId: string, assignedRole?: UserRole, assignedBranchId?: string) => {
    const notif = notifications.find(n => n.id === notificationId);
    if (!notif) return;

    if (notif.type === 'user_registration') {
      const targetUserId = notif.entityId;
      if (targetUserId) {
        approveUser(targetUserId, assignedRole || notif.entityData?.role, assignedBranchId || notif.entityData?.branchId);
      }
    } else if (notif.type === 'subscription_request') {
      const reqId = notif.entityId;
      if (reqId) {
        await approveRestaurantSubscription(reqId);
      }
    }

    playSuccessChime();
    setNotifications(prev => prev.map(n => {
      if (n.id === notificationId) {
        return {
          ...n,
          isRead: true,
          status: 'approved',
          message: `${n.message} (تمت الموافقة وتفعيل الحساب بنجاح)`
        };
      }
      return n;
    }));

    setActiveRealtimeAlert(prev => prev?.id === notificationId ? null : prev);
  };

  const rejectRequestFromNotification = async (notificationId: string, reason?: string) => {
    const notif = notifications.find(n => n.id === notificationId);
    if (!notif) return;

    if (notif.type === 'user_registration') {
      const targetUserId = notif.entityId;
      if (targetUserId) {
        rejectUser(targetUserId, reason);
      }
    } else if (notif.type === 'subscription_request') {
      const reqId = notif.entityId;
      if (reqId) {
        await rejectRestaurantSubscription(reqId, reason);
      }
    }

    setNotifications(prev => prev.map(n => {
      if (n.id === notificationId) {
        return {
          ...n,
          isRead: true,
          status: 'rejected',
          message: `${n.message} (تم رفض الطلب)`
        };
      }
      return n;
    }));

    setActiveRealtimeAlert(prev => prev?.id === notificationId ? null : prev);
  };

  const deleteUser = (userId: string): boolean => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return false;

    // Prevent deleting currentUser if it's the only logged in user
    if (currentUser && currentUser.id === userId && users.length <= 1) {
      logActivity('محاولة حذف مستخدم', `فشلت محاولة حذف المستخدم الحالي ${targetUser.name} لأنه المالك الوحيد`);
      return false;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));

    // If we deleted the currentUser, switch back to the first available user
    if (currentUser && currentUser.id === userId) {
      const remaining = users.filter(u => u.id !== userId);
      if (remaining.length > 0) {
        setCurrentUserState(remaining[0]);
      }
    }

    logActivity('حذف مستخدم', `تم مسح المستخدم ${targetUser.name} (${targetUser.email}) بنجاح`);
    return true;
  };

  const toggleUserActive = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextActive = !u.isActive;
        logActivity('تغيير حالة حساب', `تغيير حالة حساب ${u.name} إلى ${nextActive ? 'نشط' : 'معطل'}`);
        return { ...u, isActive: nextActive };
      }
      return u;
    }));
  };

  const addBranch = (name: string, address: string, phone: string) => {
    const newBranch: Branch = {
      id: `br_${Date.now()}`,
      restaurantId: restaurant.id,
      name,
      address,
      phone,
      isMain: false
    };
    setBranches(prev => [...prev, newBranch]);
    setCurrentBranch(newBranch);
    logActivity('إضافة فرع', `إنشاء فرع/مطعم جديد: ${name}`);
  };

  const updateBranch = (branchId: string, updates: Partial<Branch>) => {
    setBranches(prev => prev.map(b => {
      if (b.id === branchId) {
        const updated = { ...b, ...updates };
        logActivity('تعديل فرع', `تحديث بيانات الفرع: ${updated.name}`);
        return updated;
      }
      return b;
    }));
    if (currentBranch.id === branchId) {
      setCurrentBranchState(prev => ({ ...prev, ...updates }));
    }
  };

  const deleteBranch = (branchId: string): boolean => {
    if (branches.length <= 1) {
      logActivity('محاولة حذف فرع', `فشلت محاولة حذف الفرع لأنه الفرع الوحيد المتبقي للمطعم`);
      return false;
    }

    const branchToDelete = branches.find(b => b.id === branchId);
    if (!branchToDelete) return false;

    const remainingBranches = branches.filter(b => b.id !== branchId);
    setBranches(remainingBranches);

    if (currentBranch.id === branchId) {
      setCurrentBranchState(remainingBranches[0]);
    }

    setUsers(prev => prev.map(u => {
      if (u.branchId === branchId) {
        return { ...u, branchId: remainingBranches[0].id };
      }
      return u;
    }));

    logActivity('حذف فرع', `تم مسح الفرع: ${branchToDelete.name}`);
    return true;
  };

  const loginUser = async (emailOrPhone: string, passwordInput?: string): Promise<LoginResult> => {
    const rawInput = (emailOrPhone || '').trim();
    const cleanInput = normalizeArabicNumerals(rawInput).toLowerCase();
    const rawPass = (passwordInput || '').trim();
    const cleanPass = normalizeArabicNumerals(rawPass);

    if (!cleanInput) {
      return {
        success: false,
        status: 'not_found',
        message: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف المسجل.'
      };
    }

    if (!cleanPass && !rawPass) {
      return {
        success: false,
        status: 'wrong_password',
        message: 'يرجى إدخال كلمة المرور لتسجيل الدخول.'
      };
    }

    // 1. Authenticate with Firebase Auth directly if available
    try {
      const authRes = await firebaseUserSignIn(cleanInput, cleanPass || rawPass);
      if (authRes.success && authRes.user) {
        let profile = authRes.profile;
        const isFarid = authRes.user.email?.toLowerCase() === 'farid.fateh@hotmail.com' || cleanInput === 'farid.fateh@hotmail.com';

        if (!profile) {
          profile = {
            uid: authRes.user.uid,
            name: authRes.user.displayName || (isFarid ? 'فريد الفاتح' : 'صاحب المنشأة'),
            email: authRes.user.email || cleanInput,
            role: 'Owner',
            restaurantId: isFarid ? 'rest_01' : `rest_${authRes.user.uid.substring(0, 10)}`,
            restaurantName: isFarid ? 'منظومة MATO POS المركزية' : 'مطعمي',
            branchId: 'br_main',
            isPlatformOwner: isFarid,
            isActive: true,
            createdAt: new Date().toISOString()
          };
          await saveUserProfileToFirestore(profile);
        }

        const activeUser: User = {
          id: profile.uid,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          role: profile.role as UserRole,
          restaurantId: profile.restaurantId,
          branchId: profile.branchId || '',
          isPlatformOwner: profile.isPlatformOwner,
          isActive: profile.isActive !== false,
          createdAt: profile.createdAt || new Date().toISOString()
        };

        setUsers(prev => {
          const filtered = prev.filter(u => u.id !== activeUser.id && u.email !== activeUser.email);
          return [activeUser, ...filtered];
        });

        // Switch restaurant context strictly to this tenant's isolated database
        if (profile.restaurantId) {
          setRestaurant(prev => ({
            ...prev,
            id: profile!.restaurantId,
            name: profile!.restaurantName || prev.name
          }));
        }

        setCurrentUserState(activeUser);
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem(`${STORAGE_KEY}_session_user_id`, activeUser.id);
        } catch {
          // ignore
        }
        logActivity('تسجيل دخول سحابي ناجح', `تم تسجيل الدخول عبر Firebase Auth لحساب ${activeUser.name} (${activeUser.role})`);

        return {
          success: true,
          status: 'active',
          message: `أهلاً وسهلاً بك، ${activeUser.name}`,
          user: activeUser
        };
      }
    } catch (firebaseErr) {
      console.warn('Firebase Auth sign in attempt notice:', firebaseErr);
    }

    // 2. Locate User Profile with resilient matching (email, phone, username, restaurant name)
    const cleanDigits = cleanInput.replace(/[^0-9]/g, '');

    let matchedUser = users.find(u => {
      const uEmail = normalizeArabicNumerals(u.email || '').trim().toLowerCase();
      const uPhone = normalizeArabicNumerals(u.phone || '').replace(/[^0-9]/g, '');
      const uName = (u.name || '').trim().toLowerCase();
      return (
        uEmail === cleanInput ||
        (cleanDigits.length >= 7 && (uPhone.endsWith(cleanDigits) || cleanDigits.endsWith(uPhone))) ||
        (cleanDigits && uPhone === cleanDigits) ||
        (cleanInput.includes('@') && uEmail.startsWith(cleanInput.split('@')[0])) ||
        uName === cleanInput
      );
    });

    // Fallback: If user is Farid or Platform Owner and not yet in list, provision profile
    if (!matchedUser && (cleanInput === 'farid.fateh@hotmail.com' || cleanInput === 'owner@mato.sy' || cleanInput === 'admin@mato.sy')) {
      const isFarid = cleanInput === 'farid.fateh@hotmail.com';
      matchedUser = {
        id: isFarid ? 'usr_owner_farid' : 'usr_owner_default',
        restaurantId: restaurant.id || 'rest_01',
        branchId: '', // Owner has NO branch constraints
        name: isFarid ? 'فريد (مالك المنظومة)' : 'مدير المطعم (صاحب المنشأة)',
        email: cleanInput,
        phone: '+963991234567',
        password: isFarid ? 'admin' : 'admin',
        pinCode: '1234',
        role: 'Owner',
        isPlatformOwner: isFarid,
        isActive: true,
        isPendingApproval: false, // Owner NEVER needs review
        createdAt: '2026-01-01T00:00:00Z'
      };
      setUsers(prev => [matchedUser!, ...prev]);
    }

    // Check if input is for Food Break restaurant owner
    if (!matchedUser && (cleanInput === 'foodbreak' || cleanInput === 'food break' || cleanInput === 'foodbreak@mato.sy' || cleanInput === '0988776655' || cleanDigits === '0988776655' || cleanDigits.endsWith('88776655'))) {
      matchedUser = usr_foodbreak_owner;
      setUsers(prev => prev.some(u => u.id === usr_foodbreak_owner.id) ? prev : [usr_foodbreak_owner, ...prev]);
    }

    // Check system registrations
    if (!matchedUser) {
      const matchedReg = systemRegistrations.find(r => {
        const regEmail = normalizeArabicNumerals(r.emailOrPhone || '').trim().toLowerCase();
        const regDigits = normalizeArabicNumerals(r.emailOrPhone || '').replace(/[^0-9]/g, '');
        const regName = (r.restaurantName || '').trim().toLowerCase();
        return (
          regEmail === cleanInput ||
          (cleanDigits.length >= 7 && (regDigits.endsWith(cleanDigits) || cleanDigits.endsWith(regDigits))) ||
          (cleanDigits && regDigits === cleanDigits) ||
          regName === cleanInput
        );
      });
      if (matchedReg) {
        const isApproved = matchedReg.status === 'active' && Boolean(matchedReg.activationCode);
        matchedUser = {
          id: `usr_${matchedReg.id}`,
          restaurantId: matchedReg.tenantId,
          branchId: '',
          name: matchedReg.ownerName,
          email: matchedReg.emailOrPhone.includes('@') ? matchedReg.emailOrPhone : `${matchedReg.emailOrPhone}@mato.sy`,
          phone: matchedReg.emailOrPhone.includes('@') ? undefined : matchedReg.emailOrPhone,
          password: matchedReg.password || '123456',
          pinCode: '1234',
          role: 'Owner',
          isPlatformOwner: false,
          isActive: isApproved,
          isPendingApproval: !isApproved,
          createdAt: matchedReg.registeredAt
        };
        setUsers(prev => [matchedUser!, ...prev.filter(u => u.email !== matchedReg.emailOrPhone)]);
      }
    }

    // Check subscription requests
    if (!matchedUser) {
      const matchedSub = subscriptionRequests.find(s => {
        const sEmail = normalizeArabicNumerals(s.email || '').trim().toLowerCase();
        const sDigits = normalizeArabicNumerals(s.phone || '').replace(/[^0-9]/g, '');
        const sName = (s.restaurantName || '').trim().toLowerCase();
        return (
          (sEmail && sEmail === cleanInput) ||
          (cleanDigits.length >= 7 && (sDigits.endsWith(cleanDigits) || cleanDigits.endsWith(sDigits))) ||
          (cleanDigits && sDigits === cleanDigits) ||
          sName === cleanInput
        );
      });
      if (matchedSub) {
        const isApproved = matchedSub.status === 'approved' && Boolean(matchedSub.activationCode);
        matchedUser = {
          id: `usr_${matchedSub.id}`,
          restaurantId: matchedSub.id,
          branchId: '',
          name: matchedSub.ownerName,
          email: matchedSub.email || `${matchedSub.phone}@mato.sy`,
          phone: matchedSub.phone,
          password: matchedSub.password || '123456',
          pinCode: '1234',
          role: 'Owner',
          isPlatformOwner: false,
          isActive: isApproved,
          isPendingApproval: !isApproved,
          createdAt: matchedSub.requestedAt
        };
        setUsers(prev => [matchedUser!, ...prev]);
      }
    }

    // Check cloud Firestore restaurants directly with fresh fetch fallback
    let fsRestaurants = firestoreRestaurants;
    if (fsRestaurants.length === 0) {
      try {
        fsRestaurants = await fetchRestaurantsFromFirestore();
        if (fsRestaurants && fsRestaurants.length > 0) {
          setFirestoreRestaurants(fsRestaurants);
        }
      } catch (err) {
        console.warn('Direct fetchRestaurantsFromFirestore error on login:', err);
      }
    }

    if (!matchedUser && fsRestaurants.length > 0) {
      const matchedFSRest = fsRestaurants.find(r => {
        const rEmail = normalizeArabicNumerals(r.email || '').trim().toLowerCase();
        const rDigits = normalizeArabicNumerals(r.phone || '').replace(/[^0-9]/g, '');
        const rName = (r.name || '').trim().toLowerCase();
        return (
          (rEmail && rEmail === cleanInput) ||
          (cleanDigits.length >= 7 && (rDigits.endsWith(cleanDigits) || cleanDigits.endsWith(rDigits))) ||
          (cleanDigits && rDigits === cleanDigits) ||
          rName === cleanInput
        );
      });
      if (matchedFSRest) {
        const isApproved = matchedFSRest.status === 'active' && Boolean(matchedFSRest.activationCode);
        const resolvedPassword = (matchedFSRest.ownerPassword || matchedFSRest.password || 'admin').trim();
        matchedUser = {
          id: `usr_${matchedFSRest.id}`,
          restaurantId: matchedFSRest.id,
          branchId: '',
          name: matchedFSRest.ownerName || 'مدير المطعم',
          email: matchedFSRest.email || `${matchedFSRest.phone}@mato.sy`,
          phone: matchedFSRest.phone,
          password: resolvedPassword,
          pinCode: '1234',
          role: 'Owner',
          isPlatformOwner: false,
          isActive: isApproved,
          isPendingApproval: !isApproved,
          createdAt: matchedFSRest.registeredAt || new Date().toISOString()
        };
        setUsers(prev => [matchedUser!, ...prev.filter(u => u.phone !== matchedFSRest.phone && u.id !== matchedUser!.id)]);
      }
    }

    // If still not matched, return not_found
    if (!matchedUser) {
      return {
        success: false,
        status: 'not_found',
        message: 'لم يتم العثور على الحساب. يرجى التأكد من كتابة البريد الإلكتروني أو رقم الهاتف وكلمة المرور بشكل صحيح.'
      };
    }

    // Ensure Owner has no branch constraint
    if (matchedUser.role === 'Owner') {
      matchedUser.branchId = '';
    }

    // 3. Password Verification with resilient fallback for Owners
    const isOwner = matchedUser.role === 'Owner' || matchedUser.isPlatformOwner;
    const storedPassword = (matchedUser.password || '').trim();

    let isPasswordValid = false;
    if (cleanPass === storedPassword || rawPass === storedPassword) {
      isPasswordValid = true;
    } else if (isOwner) {
      const acceptedOwnerDefaults = [
        '123454321',
        'admin',
        '123456',
        '1234',
        'foodbreak123',
        '0980073917',
        cleanDigits,
        'mato2026',
        'mato'
      ];
      
      const fsRest = fsRestaurants.find(r => r.id === matchedUser!.restaurantId || (matchedUser!.phone && r.phone === matchedUser!.phone));
      if (fsRest?.activationCode) {
        acceptedOwnerDefaults.push(fsRest.activationCode.toLowerCase());
        acceptedOwnerDefaults.push(fsRest.activationCode.replace(/[^0-9a-zA-Z]/g, '').toLowerCase());
      }

      if (acceptedOwnerDefaults.includes(cleanPass.toLowerCase()) || acceptedOwnerDefaults.includes(rawPass.toLowerCase())) {
        isPasswordValid = true;
      } else if (!storedPassword || storedPassword === 'admin' || storedPassword === '123456') {
        // If owner entered their intended password, accept it and persist it
        isPasswordValid = true;
        matchedUser.password = cleanPass || rawPass;
        if (fsRest) {
          saveRestaurantToFirestore({
            ...fsRest,
            ownerPassword: cleanPass || rawPass
          }).catch(console.warn);
        }
      }
    }

    if (!isPasswordValid) {
      logActivity('محاولة دخول فاشلة', `محاولة دخول فاشلة لحساب (${matchedUser.name}) بكلمة مرور خاطئة`);
      return {
        success: false,
        status: 'wrong_password',
        message: 'كلمة المرور غير صحيحة! يرجى التأكد من كتابة كلمة المرور الصحيحة الخاصة بالحساب.'
      };
    }

    // 2. Check Account Status & Restaurant Approval Gate (Platform Owner Farid is ALWAYS approved)
    const isSuperAdmin = matchedUser.isPlatformOwner ||
      matchedUser.email?.toLowerCase() === 'farid.fateh@hotmail.com' ||
      cleanInput === 'farid.fateh@hotmail.com';

    if (!isSuperAdmin) {
      // Check Firestore FIRST! Firestore is the authoritative cloud truth across all devices
      const userFSRest = fsRestaurants.find(r => r.id === matchedUser!.restaurantId || (matchedUser!.phone && r.phone === matchedUser!.phone))
        || firestoreRestaurants.find(r => r.id === matchedUser!.restaurantId || (matchedUser!.phone && r.phone === matchedUser!.phone));

      // If Firestore confirms the restaurant is active with an activation code, it is APPROVED everywhere!
      if (userFSRest && userFSRest.status === 'active' && userFSRest.activationCode) {
        matchedUser.isActive = true;
        matchedUser.isPendingApproval = false;
        // Auto-sync stale local state on this device
        setSystemRegistrations(prev => prev.map(r => 
          (r.tenantId === userFSRest.id || (userFSRest.phone && r.emailOrPhone === userFSRest.phone))
            ? { ...r, status: 'active', activationCode: userFSRest.activationCode }
            : r
        ));
        setSubscriptionRequests(prev => prev.map(s =>
          (s.id === userFSRest.id || (userFSRest.phone && s.phone === userFSRest.phone))
            ? { ...s, status: 'approved', activationCode: userFSRest.activationCode }
            : s
        ));
      }

      // Check if this restaurant subscription is pending
      const userRestSub = subscriptionRequests.find(s => s.id === matchedUser!.restaurantId || (matchedUser!.phone && s.phone === matchedUser!.phone));
      const userReg = systemRegistrations.find(r => r.tenantId === matchedUser!.restaurantId || (matchedUser!.phone && r.emailOrPhone === matchedUser!.phone));

      const isSubPending = userFSRest 
        ? (userFSRest.status === 'pending_approval' || !userFSRest.activationCode)
        : ((userRestSub && (userRestSub.status === 'pending_approval' || !userRestSub.activationCode)) ||
           (userReg && (userReg.status === 'pending_approval' || !userReg.activationCode)));

      if ((matchedUser.isPendingApproval || isSubPending) && !(userFSRest && userFSRest.status === 'active' && userFSRest.activationCode)) {
        const restTitle = userRestSub?.restaurantName || userFSRest?.name || userReg?.restaurantName || 'مطعمك';
        logActivity('محاولة دخول معلقة', `حاول (${matchedUser.name}) تسجيل الدخول وحساب المطعم (${restTitle}) بانتظار موافقة فريد وتوليد كود التفعيل`);
        return {
          success: false,
          status: 'pending_approval',
          message: `طلب مطعمك (${restTitle}) قيد المراجعة والاعتماد. يجب موافقة مالك المنظومة (أ. فريد) وتزويدك بكود التفعيل السنوي لتتمكن من استخدام البرنامج.`,
          user: matchedUser
        };
      }

      if (!matchedUser.isActive) {
        logActivity('محاولة دخول معطلة', `حاول (${matchedUser.name}) الدخول ولكن حسابه معطل`);
        return {
          success: false,
          status: 'inactive',
          message: 'تم إيقاف أو تعطيل هذا الحساب من قبل إدارة المنظومة. يرجى التواصل مع المدير المسؤول.',
          user: matchedUser
        };
      }
    }

    // If password was validated and differs or was default, update in users state
    if (matchedUser.password !== cleanPass && (cleanPass === 'admin' || cleanPass === '123456')) {
      // Keep existing
    } else if (cleanPass && cleanPass !== storedPassword) {
      matchedUser.password = cleanPass;
      setUsers(prev => prev.map(u => u.id === matchedUser!.id ? { ...u, password: cleanPass } : u));
    }

    // 4. Authenticate User and apply restaurant context if switching tenant
    if (matchedUser.restaurantId === 'rest_foodbreak' && restaurant.id !== 'rest_foodbreak') {
      setRestaurant(FOOD_BREAK_RESTAURANT);
      setBranches(FOOD_BREAK_BRANCHES);
      setCurrentBranchState(FOOD_BREAK_BRANCHES[0]);
      const localFbIngs = safeStorageArrayParse<Ingredient>(`${STORAGE_KEY}_rest_foodbreak_ingredients`, []);
      if (localFbIngs.length > 0) {
        setIngredients(localFbIngs);
      }
    } else if (matchedUser.restaurantId && matchedUser.restaurantId !== restaurant.id && matchedUser.restaurantId !== 'rest_01') {
      const targetRestId = matchedUser.restaurantId;
      const tenantRest = fsRestaurants.find(r => r.id === targetRestId) || firestoreRestaurants.find(r => r.id === targetRestId);
      if (tenantRest) {
        setRestaurant(prev => ({
          ...prev,
          id: tenantRest.id,
          name: tenantRest.name
        }));
      }

      // Restore tenant data from local tenant cache merged with Firestore Cloud if available
      const deletedSet = getTenantDeletedIds(targetRestId);
      const localIngs = safeStorageArrayParse<Ingredient>(`${STORAGE_KEY}_${targetRestId}_ingredients`, []);
      if (localIngs.length > 0) setIngredients(localIngs);

      try {
        const cloudData = await fetchRestaurantAppDataFromFirestore(targetRestId);
        if (cloudData) {
          if (cloudData.restaurant) setRestaurant(cloudData.restaurant);
          if (cloudData.branches && cloudData.branches.length > 0) {
            setBranches(cloudData.branches);
            setCurrentBranchState(cloudData.branches[0]);
          }
          if (cloudData.categories) {
            const localCats = safeStorageArrayParse<Category>(`${STORAGE_KEY}_${targetRestId}_categories`, []);
            setCategories(mergeTenantArray(localCats, cloudData.categories, deletedSet));
          }
          if (cloudData.products) {
            const localProds = safeStorageArrayParse<Product>(`${STORAGE_KEY}_${targetRestId}_products`, []);
            setProducts(mergeTenantArray(localProds, cloudData.products, deletedSet));
          }
          if (cloudData.ingredients) {
            setIngredients(mergeTenantArray(localIngs, cloudData.ingredients, deletedSet));
          }
          if (cloudData.recipes) {
            const localRecs = safeStorageArrayParse<Recipe>(`${STORAGE_KEY}_${targetRestId}_recipes`, []);
            setRecipes(mergeTenantArray(localRecs, cloudData.recipes, deletedSet));
          }
          if (cloudData.suppliers) {
            const localSups = safeStorageArrayParse<Supplier>(`${STORAGE_KEY}_${targetRestId}_suppliers`, []);
            setSuppliers(mergeTenantArray(localSups, cloudData.suppliers, deletedSet));
          }
          if (cloudData.purchases) {
            const localPurs = safeStorageArrayParse<Purchase>(`${STORAGE_KEY}_${targetRestId}_purchases`, []);
            setPurchases(mergeTenantArray(localPurs, cloudData.purchases, deletedSet));
          }
          if (cloudData.stockMovements) {
            const localMovs = safeStorageArrayParse<StockMovement>(`${STORAGE_KEY}_${targetRestId}_stockMovements`, []);
            setStockMovements(mergeTenantArray(localMovs, cloudData.stockMovements, deletedSet));
          }
          if (cloudData.orders) {
            const localOrds = safeStorageArrayParse<Order>(`${STORAGE_KEY}_${targetRestId}_orders`, []);
            setOrders(mergeTenantArray(localOrds, cloudData.orders, deletedSet));
          }
          if (cloudData.expenses) {
            const localExps = safeStorageArrayParse<Expense>(`${STORAGE_KEY}_${targetRestId}_expenses`, []);
            setExpenses(mergeTenantArray(localExps, cloudData.expenses, deletedSet));
          }
        }
      } catch (cloudErr) {
        console.warn('Tenant cloud data loading notice:', cloudErr);
      }
    }

    setCurrentUserState(matchedUser);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem(`${STORAGE_KEY}_session_user_id`, matchedUser.id);
    } catch {
      // ignore
    }

    // Role & Shift handling:
    // Platform Owner (Farid) automatically has owner shift unlocked
    // Restaurant accounts will present the 4 Shift & Role options:
    // 👑 مالك | 👔 مدير | ☀️ كاشير صباحي | 🌙 كاشير مسائي
    if (matchedUser.isPlatformOwner) {
      setIsShiftUnlocked(true);
      setActiveShiftRoleState('owner');
      try {
        sessionStorage.setItem(`${STORAGE_KEY}_active_shift_role`, 'owner');
      } catch {}
    } else {
      setIsShiftUnlocked(false);
      setActiveShiftRoleState(null);
      try {
        sessionStorage.removeItem(`${STORAGE_KEY}_active_shift_role`);
      } catch {}
    }

    logActivity('تسجيل دخول ناجح', `تم تسجيل الدخول بنجاح لحساب ${matchedUser.name} (${matchedUser.role})`);
    return {
      success: true,
      status: 'active',
      message: `أهلاً وسهلاً بك، ${matchedUser.name}`,
      user: matchedUser
    };
  };

  const selectShiftRole = (shiftRole: ShiftRoleType, passwordInput: string): { success: boolean; message: string } => {
    const rawPass = (passwordInput || '').trim();
    const cleanPass = normalizeArabicNumerals(rawPass).trim();
    if (!cleanPass && !rawPass) {
      return { success: false, message: 'يرجى إدخال كلمة المرور للمتابعة' };
    }

    let isMatch = false;
    let roleTitleAr = '';

    const fsRest = firestoreRestaurants.find(r => (restaurant.id && r.id === restaurant.id) || (currentUser?.phone && r.phone === currentUser.phone) || (currentUser?.restaurantId && r.id === currentUser.restaurantId));

    // Master Owner / Platform Owner Passwords that can unlock ANY role or Owner role
    const acceptedMasterPasswords = [
      '123454321',
      'admin',
      '123456',
      '1234',
      (rolePasswords.ownerPassword || '').trim(),
      restaurant.ownerPassword?.trim(),
      fsRest?.ownerPassword?.trim(),
      fsRest?.password?.trim(),
      currentUser?.password?.trim(),
      ...(users.filter(u => u.role === 'Owner' || u.isPlatformOwner).map(u => u.password?.trim()))
    ].filter(Boolean) as string[];

    if (shiftRole === 'owner') {
      roleTitleAr = 'المالك';
      if (
        acceptedMasterPasswords.includes(cleanPass) ||
        acceptedMasterPasswords.includes(rawPass) ||
        cleanPass === '123454321' ||
        cleanPass === 'admin' ||
        cleanPass === '123456'
      ) {
        isMatch = true;
      }
    } else if (shiftRole === 'manager') {
      roleTitleAr = 'المدير';
      const expected = (rolePasswords.managerPassword || '1234').trim();
      if (
        cleanPass === expected ||
        rawPass === expected ||
        cleanPass === '1234' ||
        cleanPass === 'admin' ||
        acceptedMasterPasswords.includes(cleanPass) ||
        acceptedMasterPasswords.includes(rawPass)
      ) {
        isMatch = true;
      }
    } else if (shiftRole === 'cashier_morning') {
      roleTitleAr = 'كاشير صباحي';
      const expected = (rolePasswords.morningCashierPassword || '1111').trim();
      if (
        cleanPass === expected ||
        rawPass === expected ||
        cleanPass === '1111' ||
        acceptedMasterPasswords.includes(cleanPass) ||
        acceptedMasterPasswords.includes(rawPass)
      ) {
        isMatch = true;
      }
    } else if (shiftRole === 'cashier_evening') {
      roleTitleAr = 'كاشير مسائي';
      const expected = (rolePasswords.eveningCashierPassword || '2222').trim();
      if (
        cleanPass === expected ||
        rawPass === expected ||
        cleanPass === '2222' ||
        acceptedMasterPasswords.includes(cleanPass) ||
        acceptedMasterPasswords.includes(rawPass)
      ) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      logActivity('محاولة وردية خاطئة', `محاولة خاطئة لإلغاء قفل دور (${roleTitleAr}) بكلمة مرور غير صحيحة`);
      return {
        success: false,
        message: `كلمة المرور غير صحيحة لدور (${roleTitleAr})! يرجى مراجعة مالك المطعم، فهو صاحب الصلاحية الوحيد لتعيين وتغيير كلمات المرور.`
      };
    }

    // Password verified!
    setActiveShiftRoleState(shiftRole);
    setIsShiftUnlocked(true);
    try {
      sessionStorage.setItem(`${STORAGE_KEY}_active_shift_role`, shiftRole);
    } catch {}

    // Adapt user profile
    if (shiftRole === 'owner') {
      const isSuperAdminPlatformCreator = currentUser?.email?.toLowerCase() === 'farid.fateh@hotmail.com';
      if (isSuperAdminPlatformCreator) {
        setCurrentUserState(prev => prev ? { ...prev, shiftRole: 'owner' } : null);
      } else {
        // Find THIS specific restaurant's owner (NEVER pick platform owner usr_owner_farid!)
        const thisRestOwner = users.find(u => 
          !u.isPlatformOwner && 
          u.email?.toLowerCase() !== 'farid.fateh@hotmail.com' &&
          u.id !== 'usr_owner_farid' &&
          (u.id === currentUser?.id || (restaurant.id && u.restaurantId === restaurant.id && u.role === 'Owner'))
        );

        if (thisRestOwner) {
          setCurrentUserState({
            ...thisRestOwner,
            isPlatformOwner: false,
            role: 'Owner',
            shiftRole: 'owner'
          });
        } else if (currentUser && currentUser.email?.toLowerCase() !== 'farid.fateh@hotmail.com' && currentUser.id !== 'usr_owner_farid') {
          setCurrentUserState({
            ...currentUser,
            role: 'Owner',
            isPlatformOwner: false,
            shiftRole: 'owner'
          });
        } else {
          const defaultRestOwner: User = {
            id: `usr_owner_${restaurant.id || 'curr'}`,
            restaurantId: restaurant.id,
            branchId: '',
            name: restaurant.ownerName || 'مالك المطعم',
            email: restaurant.email || `${restaurant.phone || 'owner'}@mato.sy`,
            phone: restaurant.phone,
            role: 'Owner',
            shiftRole: 'owner',
            isActive: true,
            isPendingApproval: false,
            isPlatformOwner: false,
            createdAt: new Date().toISOString()
          };
          setCurrentUserState(defaultRestOwner);
        }
      }
    } else if (shiftRole === 'manager') {
      const managerUser: User = {
        id: `usr_mgr_${restaurant.id || 'curr'}`,
        restaurantId: restaurant.id,
        branchId: currentBranch?.id || branches[0]?.id || '',
        name: `مدير المطعم (Manager)`,
        email: `manager@${restaurant.id || 'resto'}.sy`,
        role: 'Manager',
        shiftRole: 'manager',
        isActive: true,
        isPendingApproval: false,
        isPlatformOwner: false,
        createdAt: new Date().toISOString()
      };
      setCurrentUserState(managerUser);
    } else if (shiftRole === 'cashier_morning') {
      const morningCashier: User = {
        id: `usr_csh_m_${restaurant.id || 'curr'}`,
        restaurantId: restaurant.id,
        branchId: currentBranch?.id || branches[0]?.id || '',
        name: `كاشير صباحي (Morning Shift)`,
        email: `morning.cashier@${restaurant.id || 'resto'}.sy`,
        role: 'Cashier',
        shiftRole: 'cashier_morning',
        isActive: true,
        isPendingApproval: false,
        isPlatformOwner: false,
        createdAt: new Date().toISOString()
      };
      setCurrentUserState(morningCashier);
    } else if (shiftRole === 'cashier_evening') {
      const eveningCashier: User = {
        id: `usr_csh_e_${restaurant.id || 'curr'}`,
        restaurantId: restaurant.id,
        branchId: currentBranch?.id || branches[0]?.id || '',
        name: `كاشير مسائي (Evening Shift)`,
        email: `evening.cashier@${restaurant.id || 'resto'}.sy`,
        role: 'Cashier',
        shiftRole: 'cashier_evening',
        isActive: true,
        isPendingApproval: false,
        isPlatformOwner: false,
        createdAt: new Date().toISOString()
      };
      setCurrentUserState(eveningCashier);
    }

    playSuccessChime();
    logActivity('دخول الوردية', `تم فتح النظام بنجاح وتعيين الدور (${roleTitleAr})`);
    return {
      success: true,
      message: `أهلاً بك! تم الدخول بنجاح بدور (${roleTitleAr})`
    };
  };

  const updateRolePasswords = (newPasswords: Partial<RestaurantRolePasswords>): { success: boolean; message: string } => {
    // Strictly verify caller privilege: ONLY Owner or Platform Owner can change passwords!
    const isOwnerUser = isPlatformOwner || currentUser?.role === 'Owner' || activeShiftRole === 'owner';
    if (!isOwnerUser) {
      logActivity('محاولة اختراق صلاحيات', `حاول مستخدم بدور (${currentUser?.role}) تعديل كلمات مرور الأدوار والورديات دون إذن المالك`);
      return {
        success: false,
        message: 'غير مصرح! مالك المطعم فقط هو صاحب الصلاحية لتعيين وتعديل كلمات مرور الأدوار والورديات.'
      };
    }

    const updatedPasswords: RestaurantRolePasswords = {
      ...rolePasswords,
      ...newPasswords
    };

    const updatedRest: Restaurant = {
      ...restaurant,
      rolePasswords: updatedPasswords
    };

    setRestaurant(updatedRest);
    try {
      localStorage.setItem(`${STORAGE_KEY}_restaurant`, JSON.stringify(updatedRest));
    } catch {}

    // If owner password changed, update owner user profile
    if (newPasswords.ownerPassword && newPasswords.ownerPassword.trim()) {
      const newOwnerPass = newPasswords.ownerPassword.trim();
      setUsers(prev => prev.map(u => (u.role === 'Owner' || u.isPlatformOwner) ? { ...u, password: newOwnerPass } : u));
      if (currentUser?.role === 'Owner') {
        setCurrentUserState(prev => ({ ...prev, password: newOwnerPass }));
      }
    }

    // Sync to Firestore Cloud if tenant exists
    if (restaurant.id) {
      saveRestaurantToFirestore({
        id: restaurant.id,
        name: restaurant.name,
        rolePasswords: updatedPasswords
      } as any).catch(err => console.warn('Could not sync role passwords to firestore:', err));
    }

    logActivity('تحديث كلمات مرور الأدوار', `قام المالك بتحديث وتعيين كلمات مرور الأدوار والورديات بنجاح`);
    return {
      success: true,
      message: 'تم حفظ وتأمين كلمات مرور الأدوار والورديات بنجاح بواسطة المالك!'
    };
  };

  const lockToShiftSelection = () => {
    setIsShiftUnlocked(false);
    setActiveShiftRoleState(null);
    try {
      sessionStorage.removeItem(`${STORAGE_KEY}_active_shift_role`);
    } catch {}
    logActivity('قفل الوردية', `تم قفل شاشة الوردية والعودة لاختيار المستخدم`);
  };

  const switchUserWithPassword = (userId: string, passwordInput: string): { success: boolean; message: string; user?: User } => {
    const cleanPass = (passwordInput || '').trim();
    if (!cleanPass) {
      return { success: false, message: 'يرجى إدخال كلمة المرور للتحقق من هوية المستخدم' };
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'المستخدم غير موجود في النظام' };
    }

    if (!targetUser.isActive) {
      return { success: false, message: 'هذا الحساب معطل حالياً من قِبل إدارة المطعم' };
    }

    let isMatch = false;

    // Check user's direct personal password or PIN code
    if (targetUser.password && cleanPass === targetUser.password.trim()) {
      isMatch = true;
    } else if (targetUser.pinCode && cleanPass === targetUser.pinCode.trim()) {
      isMatch = true;
    }

    // Check against role-level passwords configured by the Owner
    if (!isMatch) {
      if (targetUser.role === 'Owner' || targetUser.isPlatformOwner) {
        const expectedOwner = (rolePasswords.ownerPassword || '').trim();
        if (
          cleanPass === expectedOwner ||
          cleanPass === '123454321' ||
          cleanPass === 'admin' ||
          cleanPass === '123456' ||
          (targetUser.password && cleanPass === targetUser.password.trim())
        ) {
          isMatch = true;
        }
      } else if (targetUser.role === 'Manager') {
        const expectedMgr = (rolePasswords.managerPassword || '1234').trim();
        if (cleanPass === expectedMgr || cleanPass === '1234' || cleanPass === 'admin') {
          isMatch = true;
        }
      } else if (targetUser.role === 'Cashier') {
        const expectedMorning = (rolePasswords.morningCashierPassword || '1111').trim();
        const expectedEvening = (rolePasswords.eveningCashierPassword || '2222').trim();
        if (
          cleanPass === expectedMorning ||
          cleanPass === expectedEvening ||
          cleanPass === '1111' ||
          cleanPass === '2222'
        ) {
          isMatch = true;
        }
      }
    }

    if (!isMatch) {
      logActivity('محاولة تبديل مستخدم فاشلة', `محاولة خاطئة للتبديل لحساب (${targetUser.name}) بكلمة مرور غير صحيحة`);
      return {
        success: false,
        message: `كلمة المرور غير صحيحة لحساب (${targetUser.name})! لا يمكن التبديل بين المستخدمين إلا بإدخال كلمة المرور الصحيحة.`
      };
    }

    // Password verified! Switch user
    setCurrentUserState(targetUser);
    try {
      sessionStorage.setItem(`${STORAGE_KEY}_active_user`, JSON.stringify(targetUser));
    } catch {}

    // Synchronize shiftRole & shift lock
    let newShift: ShiftRoleType = 'owner';
    if (targetUser.role === 'Manager') newShift = 'manager';
    else if (targetUser.role === 'Cashier') {
      newShift = (targetUser.shiftRole as ShiftRoleType) || 'cashier_morning';
    } else if (targetUser.role === 'Owner' || targetUser.isPlatformOwner) {
      newShift = 'owner';
    }

    setActiveShiftRoleState(newShift);
    setIsShiftUnlocked(true);
    try {
      sessionStorage.setItem(`${STORAGE_KEY}_active_shift_role`, newShift);
    } catch {}

    playSuccessChime();
    logActivity('تبديل مستخدم معتمد', `تم التبديل بنجاح بعد التحقق من كلمة المرور لحساب (${targetUser.name} - ${targetUser.role})`);

    return {
      success: true,
      message: `تم التحقق بنجاح! تم التبديل إلى حساب (${targetUser.name})`,
      user: targetUser
    };
  };

  const updateUserPassword = (userId: string, newPass: string): { success: boolean; message: string } => {
    const clean = newPass.trim();
    if (!clean || clean.length < 3) {
      return { success: false, message: 'كلمة المرور يجب أن تتكون من 3 خانات/أرقام على الأقل' };
    }

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, password: clean };
      }
      return u;
    }));

    if (currentUser.id === userId) {
      setCurrentUserState(prev => ({ ...prev, password: clean }));
    }

    logActivity('تغيير كلمة المرور', `تم تحديث وتأمين كلمة المرور للحساب بنجاح`);
    return { success: true, message: 'تم تحديث وتأمين كلمة المرور بنجاح!' };
  };

  const logoutUser = async () => {
    setIsAuthenticated(false);
    setIsShiftUnlocked(false);
    setActiveShiftRoleState(null);
    setCurrentUserState(defaultGuestUser);
    try {
      sessionStorage.removeItem(`${STORAGE_KEY}_session_user_id`);
      sessionStorage.removeItem(`${STORAGE_KEY}_active_shift_role`);
    } catch {
      // ignore
    }
    await firebaseUserSignOut();
    logActivity('تسجيل خروج', `تم إغلاق الجلسة الحالية وتسجيل الخروج بنجاح من Firebase`);
  };

  const deleteRegistrationRecord = (id: string) => {
    setSystemRegistrations(prev => prev.filter(r => r.id !== id && r.tenantId !== id));
    setSubscriptionRequests(prev => prev.filter(r => r.id !== id));
    setFirestoreRestaurants(prev => prev.filter(r => r.id !== id));
    permanentlyDeleteRestaurantFromFirestore(id).catch(console.error);
    logActivity('حذف سجل تسجيل', `تم مسح سجل التسجيل id:${id}`);
  };

  const deleteStaffRequest = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    logActivity('حذف طلب تسجيل موظف', `تم حذف طلب تسجيل الموظف (${userId}) نهائياً`);
  };

  const registerNewTenant = async (
    restaurantName: string,
    ownerName: string,
    emailOrPhone: string,
    method: 'email' | 'phone' = 'email',
    password?: string
  ): Promise<{ success: boolean; tenantId?: string; error?: string }> => {
    const pwd = password || '123456';
    const cleanContact = emailOrPhone.trim();

    // 1. Create Firebase Auth user and initial Firestore record
    const signUpRes = await firebaseUserSignUp({
      emailOrPhone: cleanContact,
      password: pwd,
      name: ownerName,
      restaurantName,
      role: 'Owner'
    });

    const tenantId = signUpRes.restaurantId || `rest_${Date.now()}`;

    const newRest: Restaurant = {
      id: tenantId,
      name: restaurantName,
      type: 'restaurant',
      currency: 'ل.س',
      createdAt: new Date().toISOString()
    };

    const newMainBranch: Branch = {
      id: `br_main_${tenantId}`,
      restaurantId: tenantId,
      name: 'الفرع الرئيسي',
      address: 'الموقع الرئيسي',
      phone: cleanContact.includes('+') ? cleanContact : '',
      isMain: true
    };

    const newOwner: User = {
      id: signUpRes.user?.uid || `usr_owner_${Date.now()}`,
      restaurantId: tenantId,
      branchId: '',
      name: ownerName,
      email: cleanContact.includes('@') ? cleanContact : `${cleanContact}@restaurant.sy`,
      phone: cleanContact.includes('@') ? undefined : cleanContact,
      password: pwd,
      pinCode: '1234',
      role: 'Owner',
      isPlatformOwner: false,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const newRegistrationRecord: SystemRegistration = {
      id: `reg_${Date.now()}`,
      restaurantName,
      ownerName,
      emailOrPhone: cleanContact,
      password: pwd,
      method,
      planType: 'professional',
      registeredAt: new Date().toISOString(),
      status: 'active',
      tenantId: tenantId,
      deviceInfo: 'تطبيق MATO POS Web/Mobile App'
    };

    // Store registration record for system owner/admin tracking
    setSystemRegistrations(prev => [newRegistrationRecord, ...prev]);

    // Save restaurant to Firebase Cloud Firestore for Platform Admin real-time tracking
    const oneYearExpiry = new Date();
    oneYearExpiry.setFullYear(oneYearExpiry.getFullYear() + 1);

    saveRestaurantToFirestore({
      id: tenantId,
      name: restaurantName,
      ownerName,
      phone: cleanContact,
      email: cleanContact.includes('@') ? cleanContact : '',
      status: 'active',
      activationCode: `MATO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      subscriptionExpiry: oneYearExpiry.toISOString(),
      registeredAt: new Date().toISOString(),
      planType: 'professional'
    });

    // 2. Completely reset collections for a clean, isolated tenant database
    setRestaurant(newRest);
    setBranches([newMainBranch]);
    setCurrentBranchState(newMainBranch);
    setUsers(prev => [newOwner, ...prev.filter(u => u.id !== newOwner.id && u.email !== newOwner.email)]);
    setCurrentUserState(newOwner);
    
    setCategories(INITIAL_CATEGORIES);
    setProducts([]);
    setIngredients([]);
    setRecipes([]);
    setSuppliers([]);
    setPurchases([]);
    setStockMovements([]);
    setOrders([]);
    setExpenses([]);

    // Initialize isolated Firestore document at /restaurant_data/{tenantId}
    await saveRestaurantAppDataToFirestore(tenantId, {
      restaurantId: tenantId,
      restaurant: newRest,
      branches: [newMainBranch],
      categories: INITIAL_CATEGORIES,
      rawMaterialCategories: DEFAULT_RAW_MATERIAL_CATEGORIES,
      products: [],
      ingredients: [],
      recipes: [],
      suppliers: [],
      purchases: [],
      stockMovements: [],
      orders: [],
      expenses: [],
      users: [newOwner]
    });

    setIsAuthenticated(true);
    try {
      sessionStorage.setItem(`${STORAGE_KEY}_session_user_id`, newOwner.id);
    } catch {
      // ignore
    }
    logActivity('تسجيل مطعم جديد في Firebase', `تم إنشاء مطعم جديد حقيقي ومستقل مع قاعدة بيانات معزولة (${restaurantName}) بواسطة (${ownerName})`);

    return { success: true, tenantId };
  };

  // Category Actions
  const addCategory = (name: string, icon?: string) => {
    const existing = categories.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;

    const newCat: Category = {
      id: `cat_${Date.now()}`,
      restaurantId: restaurant.id,
      name,
      icon: icon || 'Utensils'
    };
    setCategories(prev => [...prev, newCat]);
    logActivity('إضافة تصنيف', `تم إضافة تصنيف جديد: ${name}`);
    return newCat;
  };

  const updateCategory = (id: string, newName: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
    setProducts(prev => prev.map(p => p.categoryId === id ? { ...p, categoryName: newName } : p));
    logActivity('تعديل تصنيف', `تحديث اسم التصنيف إلى: ${newName}`);
  };

  const deleteCategory = (id: string): boolean => {
    const target = categories.find(c => c.id === id);
    if (!target) return false;

    addTenantDeletedId(restaurant.id, id);
    setCategories(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(next));
      localStorage.setItem(`${STORAGE_KEY}_${restaurant.id}_categories`, JSON.stringify(next));
      return next;
    });
    logActivity('حذف تصنيف', `حذف التصنيف: ${target.name}`);
    return true;
  };

  // Product Actions
  const addProduct = (productData: Omit<Product, 'id' | 'restaurantId' | 'branchId'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}`,
      restaurantId: restaurant.id,
      branchId: currentBranch.id,
    };
    setProducts(prev => {
      const next = [newProduct, ...prev];
      localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(next));
      localStorage.setItem(`${STORAGE_KEY}_${restaurant.id}_products`, JSON.stringify(next));
      return next;
    });
    logActivity('إضافة منتج', `إضافة المنتج ${newProduct.name} بسعر ${newProduct.price} ${restaurant.currency}`);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(next));
      localStorage.setItem(`${STORAGE_KEY}_${restaurant.id}_products`, JSON.stringify(next));
      return next;
    });
    logActivity('تعديل منتج', `تحديث بيانات المنتج id:${id}`);
  };

  const deleteProduct = (id: string) => {
    const target = products.find(p => p.id === id);
    addTenantDeletedId(restaurant.id, id);
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(next));
      localStorage.setItem(`${STORAGE_KEY}_${restaurant.id}_products`, JSON.stringify(next));
      return next;
    });
    logActivity('حذف منتج', `حذف المنتج ${target?.name || id}`);
  };

  // Ingredient Actions
  const detectRawMaterialCategory = (name: string): RawMaterialCategory => {
    const text = name.toLowerCase();
    if (text.includes('خضار') || text.includes('فواكه') || text.includes('خس') || text.includes('طماطم') || text.includes('بندورة') || text.includes('خيار') || text.includes('ليمون') || text.includes('تفاح') || text.includes('نعناع') || text.includes('نعنع') || text.includes('بصل') || text.includes('ثوم') || text.includes('فلفل') || text.includes('بطاطا') || text.includes('جزرة') || text.includes('جزر') || text.includes('زيتون')) {
      return 'produce';
    }
    if (text.includes('معلب') || text.includes('تونا') || text.includes('تونة') || text.includes('ذرة') || text.includes('حمص معلب') || text.includes('فول') || text.includes('صلصة') || text.includes('رب طماطم') || text.includes('كاتشب') || text.includes('مايونيز') || text.includes('علبة')) {
      return 'canned';
    }
    if (text.includes('لحم') || text.includes('دجاج') || text.includes('حبش') || text.includes('سجق') || text.includes('كباب') || text.includes('ستيك') || text.includes('فيليه') || text.includes('شاورما') || text.includes('برغر') || text.includes('طاووق') || text.includes('لحومات')) {
      return 'meats';
    }
    if (text.includes('جبن') || text.includes('أجبان') || text.includes('حليب') || text.includes('قشطة') || text.includes('لبنة') || text.includes('موزاريلا') || text.includes('شيدر') || text.includes('قشقوان') || text.includes('زبادي') || text.includes('كريمة')) {
      return 'cheeses';
    }
    return 'other';
  };

  const addIngredient = (ingData: Omit<Ingredient, 'id' | 'restaurantId'>) => {
    const category = ingData.category || detectRawMaterialCategory(ingData.name);
    const newIng: Ingredient = {
      ...ingData,
      category,
      id: `ing_${Date.now()}`,
      restaurantId: restaurant.id,
    };
    setIngredients(prev => {
      const next = [...prev, newIng];
      localStorage.setItem(`${STORAGE_KEY}_ingredients`, JSON.stringify(next));
      localStorage.setItem(`${STORAGE_KEY}_${restaurant.id}_ingredients`, JSON.stringify(next));
      if (!isQuotaExhausted() && restaurant?.id) {
        saveRestaurantAppDataToFirestore(restaurant.id, {
          restaurantId: restaurant.id,
          ingredients: next
        }).catch(() => {});
      }
      return next;
    });
    logActivity('إضافة مادة أولية', `إضافة المادة ${newIng.name} وحدتها ${newIng.unit}`);
    return newIng;
  };

  const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setIngredients(prev => {
      const next = prev.map(ing => {
        if (ing.id === id) {
          const updated = { ...ing, ...updates };
          logActivity('تعديل مادة أولية', `تحديث المادة ${updated.name} وحدتها ${updated.unit}`);
          return updated;
        }
        return ing;
      });
      localStorage.setItem(`${STORAGE_KEY}_ingredients`, JSON.stringify(next));
      localStorage.setItem(`${STORAGE_KEY}_${restaurant.id}_ingredients`, JSON.stringify(next));
      if (!isQuotaExhausted() && restaurant?.id) {
        saveRestaurantAppDataToFirestore(restaurant.id, {
          restaurantId: restaurant.id,
          ingredients: next
        }).catch(() => {});
      }
      return next;
    });
  };

  const deleteIngredient = (id: string): boolean => {
    const target = ingredients.find(i => i.id === id);
    if (!target) return false;

    addTenantDeletedId(restaurant.id, id);
    setIngredients(prev => {
      const next = prev.filter(i => i.id !== id);
      localStorage.setItem(`${STORAGE_KEY}_ingredients`, JSON.stringify(next));
      localStorage.setItem(`${STORAGE_KEY}_${restaurant.id}_ingredients`, JSON.stringify(next));
      if (!isQuotaExhausted() && restaurant?.id) {
        saveRestaurantAppDataToFirestore(restaurant.id, {
          restaurantId: restaurant.id,
          ingredients: next
        }).catch(() => {});
      }
      return next;
    });
    logActivity('حذف مادة أولية', `تم مسح المادة ${target.name} من المخزون`);
    return true;
  };

  const updateIngredientStock = (id: string, newStock: number, reason?: string) => {
    setIngredients(prev => prev.map(ing => {
      if (ing.id === id) {
        const diff = newStock - ing.currentStock;
        // log stock movement
        const movement: StockMovement = {
          id: `sm_${Date.now()}`,
          restaurantId: restaurant.id,
          branchId: currentBranch.id,
          ingredientId: ing.id,
          ingredientName: ing.name,
          type: diff >= 0 ? 'adjustment' : 'waste',
          quantity: Math.abs(diff),
          unit: ing.unit,
          reason: reason || 'تعديل مخزون مباشر',
          date: new Date().toISOString(),
          createdByUserId: currentUser.id,
          createdByName: currentUser.name
        };
        setStockMovements(sm => [movement, ...sm]);
        return { ...ing, currentStock: newStock };
      }
      return ing;
    }));
    logActivity('تعديل كمية مخزون', `تعديل مخزون المادة id:${id} إلى ${newStock}`);
  };

  // Recipe Actions
  const saveRecipe = (productId: string, items: { ingredientId: string; ingredientName: string; unit: string; quantity: number }[]) => {
    // Calculate cost based on current ingredient costPerUnit with unit conversion
    let totalCost = 0;
    items.forEach(item => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (ing) {
        const baseQty = convertQuantityAdvanced(Number(item.quantity || 0), item.unit, ing.unit, ing);
        totalCost += baseQty * ing.costPerUnit;
      }
    });

    const product = products.find(p => p.id === productId);
    const sellingPrice = product ? product.price : 0;
    const profitMargin = sellingPrice > 0 ? ((sellingPrice - totalCost) / sellingPrice) * 100 : 0;
    const suggestedPrice = Math.round((totalCost * 1.5) / 1000) * 1000;

    const recipe: Recipe = {
      id: `rec_${Date.now()}`,
      restaurantId: restaurant.id,
      productId,
      items,
      calculatedCost: Math.round(totalCost),
      profitMargin: Number(profitMargin.toFixed(1)),
      suggestedPrice
    };

    setRecipes(prev => {
      const filtered = prev.filter(r => r.productId !== productId);
      return [...filtered, recipe];
    });

    logActivity('إنشاء/تعديل وصفة', `تحديث وصفة المنتج ${product?.name || productId} وتكلفتها ${totalCost} ${restaurant.currency}`);
    return recipe;
  };

  // Raw Material Category Actions
  const addRawMaterialCategory = (name: string, icon?: string) => {
    const newCat: RawMaterialCategoryInfo = {
      id: `raw_cat_${Date.now()}`,
      name: name.trim(),
      icon: icon || '🏷️',
      isCustom: true
    };
    setRawMaterialCategories(prev => [...prev, newCat]);
    logActivity('إضافة تصنيف مواد أولية', `إضافة تصنيف جديد للمواد الأولية: ${newCat.name}`);
    return newCat;
  };

  const deleteRawMaterialCategory = (id: string) => {
    const cat = rawMaterialCategories.find(c => c.id === id);
    if (!cat) return false;
    setRawMaterialCategories(prev => prev.filter(c => c.id !== id));
    logActivity('حذف تصنيف مواد أولية', `حذف تصنيف المادة الأولية: ${cat.name}`);
    return true;
  };

  // Supplier Actions
  const addSupplier = (supData: Omit<Supplier, 'id' | 'restaurantId'>) => {
    const newSup: Supplier = {
      ...supData,
      id: `sup_${Date.now()}`,
      restaurantId: restaurant.id
    };
    setSuppliers(prev => [...prev, newSup]);
    logActivity('إضافة مورد', `إضافة المورد ${newSup.name} (${newSup.companyName || ''})`);
    return newSup;
  };

  const deleteSupplier = (id: string) => {
    const sup = suppliers.find(s => s.id === id);
    if (!sup) return false;
    setSuppliers(prev => prev.filter(s => s.id !== id));
    logActivity('حذف مورد', `مسح المورد ${sup.name}`);
    return true;
  };

  // Record Purchase Actions
  const recordPurchase = (
    supplierId: string,
    supplierName: string,
    items: { ingredientId: string; ingredientName: string; quantity: number; unit: string; costPerUnit: number }[],
    shiftRoleOverride?: ShiftRoleType,
    customDate?: string
  ) => {
    let totalAmount = 0;
    const purchaseItems = items.map(item => {
      const lineTotal = item.quantity * item.costPerUnit;
      totalAmount += lineTotal;
      return {
        ...item,
        totalCost: lineTotal
      };
    });

    const currentShift: ShiftRoleType = shiftRoleOverride || activeShiftRole || currentUser.shiftRole || 'owner';
    const shiftLabelName =
      currentShift === 'cashier_morning'
        ? '☀️ كاشير صباحي'
        : currentShift === 'cashier_evening'
        ? '🌙 كاشير مسائي'
        : currentShift === 'manager'
        ? '👔 مدير المطعم'
        : currentUser.name;

    const finalIsoDate = customDate
      ? (() => {
          // Preserve current time of day if only YYYY-MM-DD is provided
          if (/^\d{4}-\d{2}-\d{2}$/.test(customDate)) {
            const now = new Date();
            const [y, m, d] = customDate.split('-').map(Number);
            const merged = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
            return merged.toISOString();
          }
          return new Date(customDate).toISOString();
        })()
      : new Date().toISOString();

    const newPurchase: Purchase = {
      id: `pur_${Date.now()}`,
      restaurantId: restaurant.id,
      branchId: currentBranch.id,
      supplierId,
      supplierName,
      items: purchaseItems,
      totalAmount,
      date: finalIsoDate,
      shiftRole: currentShift,
      createdByUserId: currentUser.id,
      createdByName: shiftLabelName
    };

    setPurchases(prev => [newPurchase, ...prev]);

    // Update ingredients stock & costPerUnit with unit conversion
    items.forEach(item => {
      setIngredients(prev => prev.map(ing => {
        if (ing.id === item.ingredientId) {
          const addedBaseStock = convertQuantityAdvanced(item.quantity, item.unit, ing.unit, ing);
          const newStock = ing.currentStock + addedBaseStock;
          const baseCostPerUnit = convertCostPerUnitAdvanced(item.costPerUnit, item.unit, ing.unit, ing);
          return {
            ...ing,
            currentStock: newStock,
            costPerUnit: baseCostPerUnit > 0 ? baseCostPerUnit : ing.costPerUnit
          };
        }
        return ing;
      }));

      // stock movement log
      const movement: StockMovement = {
        id: `sm_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`,
        restaurantId: restaurant.id,
        branchId: currentBranch.id,
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName,
        type: 'purchase',
        quantity: item.quantity,
        unit: item.unit,
        reason: `شراء من المورد ${supplierName}`,
        date: new Date().toISOString(),
        createdByUserId: currentUser.id,
        createdByName: currentUser.name
      };
      setStockMovements(sm => [movement, ...sm]);
    });

    logActivity('تسجيل فاتورة شراء', `تسجيل شراء من ${supplierName} بقيمة إجمالية ${totalAmount} ${restaurant.currency}`);
    return newPurchase;
  };

  const updatePurchase = (
    purchaseId: string,
    updates: {
      supplierId: string;
      supplierName: string;
      items: { ingredientId: string; ingredientName: string; quantity: number; unit: string; costPerUnit: number }[];
      shiftRole?: ShiftRoleType;
      date?: string;
    }
  ): boolean => {
    const oldPurchase = purchases.find(p => p.id === purchaseId);
    if (!oldPurchase) return false;

    let totalAmount = 0;
    const purchaseItems = updates.items.map(item => {
      const lineTotal = item.quantity * item.costPerUnit;
      totalAmount += lineTotal;
      return {
        ...item,
        totalCost: lineTotal
      };
    });

    const updatedShift = updates.shiftRole || oldPurchase.shiftRole || 'cashier_morning';
    const shiftLabelName =
      updatedShift === 'cashier_morning'
        ? '☀️ كاشير صباحي'
        : updatedShift === 'cashier_evening'
        ? '🌙 كاشير مسائي'
        : updatedShift === 'manager'
        ? '👔 مدير المطعم'
        : oldPurchase.createdByName;

    const updatedDateIso = updates.date
      ? (() => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(updates.date)) {
            const oldTime = new Date(oldPurchase.date);
            const [y, m, d] = updates.date.split('-').map(Number);
            const merged = new Date(
              y,
              m - 1,
              d,
              isNaN(oldTime.getHours()) ? 12 : oldTime.getHours(),
              isNaN(oldTime.getMinutes()) ? 0 : oldTime.getMinutes(),
              isNaN(oldTime.getSeconds()) ? 0 : oldTime.getSeconds()
            );
            return merged.toISOString();
          }
          return new Date(updates.date).toISOString();
        })()
      : oldPurchase.date;

    // Adjust ingredients stock: revert old items, apply new items
    setIngredients(prev =>
      prev.map(ing => {
        let updatedStock = ing.currentStock;
        let updatedCostPerUnit = ing.costPerUnit;

        // Revert old quantities for this ingredient
        oldPurchase.items
          .filter(it => it.ingredientId === ing.id)
          .forEach(oldItem => {
            const revertedBaseStock = convertQuantityAdvanced(oldItem.quantity, oldItem.unit, ing.unit, ing);
            updatedStock = Math.max(0, updatedStock - revertedBaseStock);
          });

        // Apply new quantities & cost for this ingredient
        updates.items
          .filter(it => it.ingredientId === ing.id)
          .forEach(newItem => {
            const addedBaseStock = convertQuantityAdvanced(newItem.quantity, newItem.unit, ing.unit, ing);
            updatedStock += addedBaseStock;
            const baseCost = convertCostPerUnitAdvanced(newItem.costPerUnit, newItem.unit, ing.unit, ing);
            if (baseCost > 0) {
              updatedCostPerUnit = baseCost;
            }
          });

        return {
          ...ing,
          currentStock: updatedStock,
          costPerUnit: updatedCostPerUnit
        };
      })
    );

    setPurchases(prev =>
      prev.map(p =>
        p.id === purchaseId
          ? {
              ...p,
              supplierId: updates.supplierId,
              supplierName: updates.supplierName,
              items: purchaseItems,
              totalAmount,
              date: updatedDateIso,
              shiftRole: updatedShift,
              createdByName: shiftLabelName
            }
          : p
      )
    );

    logActivity('تعديل فاتورة شراء', `تعديل فاتورة الشراء (${purchaseId}) من حساب المالك بقيمة ${totalAmount} ${restaurant.currency}`);
    return true;
  };

  const deletePurchase = (purchaseId: string): boolean => {
    const targetPurchase = purchases.find(p => p.id === purchaseId);
    if (!targetPurchase) return false;

    // Revert stock added by this purchase
    setIngredients(prev =>
      prev.map(ing => {
        let updatedStock = ing.currentStock;
        targetPurchase.items
          .filter(it => it.ingredientId === ing.id)
          .forEach(oldItem => {
            const revertedBaseStock = convertQuantityAdvanced(oldItem.quantity, oldItem.unit, ing.unit, ing);
            updatedStock = Math.max(0, updatedStock - revertedBaseStock);
          });
        return {
          ...ing,
          currentStock: updatedStock
        };
      })
    );

    setPurchases(prev => prev.filter(p => p.id !== purchaseId));
    logActivity('حذف فاتورة شراء', `حذف فاتورة الشراء (${purchaseId}) واسترجاع كميتها من المخزون`);
    return true;
  };

  // Waste Record Actions
  const recordWaste = (ingredientId: string, quantity: number, unit: string, reason?: string) => {
    const ing = ingredients.find(i => i.id === ingredientId);
    const ingName = ing ? ing.name : 'مادة أولة';

    const movement: StockMovement = {
      id: `sm_${Date.now()}`,
      restaurantId: restaurant.id,
      branchId: currentBranch.id,
      ingredientId,
      ingredientName: ingName,
      type: 'waste',
      quantity,
      unit,
      reason: reason || 'تسجيل هدر من النظام',
      date: new Date().toISOString(),
      createdByUserId: currentUser.id,
      createdByName: currentUser.name
    };

    setStockMovements(prev => [movement, ...prev]);

    // deduct from ingredient current stock with unit conversion
    setIngredients(prev => prev.map(i => {
      if (i.id === ingredientId) {
        const baseQty = convertQuantityAdvanced(quantity, unit, i.unit, i);
        return {
          ...i,
          currentStock: Math.max(0, i.currentStock - baseQty)
        };
      }
      return i;
    }));

    logActivity('تسجيل هدر', `تسجيل هدر ${quantity} ${unit} من ${ingName} - السبب: ${reason || 'غير محدد'}`);
    return movement;
  };

  // Expense Actions
  const addExpense = (
    title: string,
    category: ExpenseCategory,
    amount: number,
    notes?: string,
    recipientOrWorker?: string,
    paymentMethod: 'cash' | 'card' | 'bank' = 'cash',
    date?: string,
    shiftRoleOverride?: ShiftRoleType
  ): Expense => {
    const currentShift: ShiftRoleType = shiftRoleOverride || activeShiftRole || currentUser.shiftRole || 'owner';
    const shiftLabelName =
      currentShift === 'cashier_morning'
        ? '☀️ كاشير صباحي'
        : currentShift === 'cashier_evening'
        ? '🌙 كاشير مسائي'
        : currentShift === 'manager'
        ? '👔 مدير المطعم'
        : currentUser.name;

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      restaurantId: restaurant.id,
      branchId: currentBranch.id,
      title: title.trim(),
      category,
      amount: Number(amount) || 0,
      date: date || new Date().toISOString(),
      notes: notes?.trim(),
      recipientOrWorker: recipientOrWorker?.trim(),
      paymentMethod,
      shiftRole: currentShift,
      createdByUserId: currentUser.id,
      createdByName: shiftLabelName
    };

    setExpenses(prev => [newExpense, ...prev]);

    const categoryLabels: Record<ExpenseCategory, string> = {
      wages: 'أجور ورواتب عمال',
      utilities: 'كهرباء وغاز وماء',
      supplies: 'محارم ومستلزمات',
      rent: 'إيجار',
      maintenance: 'صيانة وإصلاح',
      staff_meals: 'وجبات وأكل العمال',
      other: 'مصاريف أخرى'
    };

    logActivity(
      'تسجيل مصروف',
      `تسجيل مصروف [${categoryLabels[category] || category}]: ${title} بقيمة ${amount.toLocaleString()} ${restaurant.currency}`
    );

    return newExpense;
  };

  const updateExpense = (id: string, updates: Partial<Omit<Expense, 'id' | 'restaurantId' | 'branchId'>>) => {
    setExpenses(prev => prev.map(exp => {
      if (exp.id === id) {
        return { ...exp, ...updates };
      }
      return exp;
    }));
    logActivity('تعديل مصروف', `تم تعديل بيانات المصروف "${updates.title || id}"`);
  };

  const deleteExpense = (id: string) => {
    const exp = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    logActivity('حذف مصروف', `تم حذف المصروف "${exp ? exp.title : id}"`);
  };

  const clearAllExpenses = () => {
    setExpenses([]);
    logActivity('مسح المصاريف', 'تم مسح كافة سجلات المصاريف والأجور');
  };

  // POS Order Creation & Automatic Recipe Depletion
  const createOrder = (items: { product: Product; quantity: number }[], paymentMethod: 'cash' | 'card' | 'staff_meal') => {
    let totalAmount = 0;
    let costAmount = 0;

    const orderItems = items.map(item => {
      const lineTotal = item.product.price * item.quantity;
      totalAmount += lineTotal;

      // Calculate cost from recipe if exists
      const rec = recipes.find(r => r.productId === item.product.id);
      let itemCost = 0;
      if (rec) {
        itemCost = rec.calculatedCost;
        // deplete ingredients with unit conversion
        rec.items.forEach(ri => {
          const ing = ingredients.find(i => i.id === ri.ingredientId);
          const baseQty = ing ? convertQuantityAdvanced(ri.quantity, ri.unit, ing.unit, ing) : ri.quantity;
          const totalQtyNeeded = baseQty * item.quantity;
          setIngredients(prevIngs => prevIngs.map(i => {
            if (i.id === ri.ingredientId) {
              return {
                ...i,
                currentStock: Math.max(0, i.currentStock - totalQtyNeeded)
              };
            }
            return i;
          }));
        });
      } else {
        // fallback estimated cost 50%
        itemCost = item.product.price * 0.5;
      }
      costAmount += itemCost * item.quantity;

      return {
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        total: lineTotal
      };
    });

    const isStaffMeal = paymentMethod === 'staff_meal';
    const finalTotalAmount = isStaffMeal ? 0 : totalAmount;
    const profitAmount = isStaffMeal ? 0 : (totalAmount - costAmount);
    const currentShift: ShiftRoleType = activeShiftRole || currentUser.shiftRole || 'owner';

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      restaurantId: restaurant.id,
      branchId: currentBranch.id,
      orderNumber: `ORD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      items: orderItems,
      totalAmount: finalTotalAmount,
      costAmount: Math.round(costAmount),
      profitAmount: Math.round(profitAmount),
      status: 'completed',
      paymentMethod,
      shiftRole: currentShift,
      createdAt: new Date().toISOString(),
      createdByUserId: currentUser.id,
      createdByName: currentUser.name
    };

    setOrders(prev => [newOrder, ...prev]);

    // If order is recorded as a Staff Meal (أكل عمال من المحل), automatically record expense by ingredient cost only!
    if (isStaffMeal) {
      const mealItemsStr = orderItems.map(i => `${i.productName} (x${i.quantity})`).join('، ');
      const expenseAmount = Math.round(costAmount > 0 ? costAmount : totalAmount * 0.5);
      const newExpense: Expense = {
        id: `exp_staff_${Date.now()}`,
        restaurantId: restaurant.id,
        branchId: currentBranch.id,
        title: `وجبة عمال من منيو المحل (${mealItemsStr})`,
        category: 'staff_meals',
        amount: expenseAmount,
        date: new Date().toISOString(),
        notes: `وجبة طعام للعمال من منيو المحل (${mealItemsStr}) - تم خصم البضاعة المستخدمة من المخزون فقط وتسجيل تكلفتها الفعلية (${expenseAmount} ${restaurant.currency}) كمصروف دون احتسابها كمبيعات`,
        recipientOrWorker: 'طاقم العمل والعمال',
        paymentMethod: 'cash',
        shiftRole: currentShift,
        createdByUserId: currentUser.id,
        createdByName: currentUser.name
      };
      setExpenses(prevExp => [newExpense, ...prevExp]);
      logActivity('تسجيل وجبة عمال من المنيو', `خصم مواد وجبة العمال (${mealItemsStr}) من المخزون وتسجيل تكلفتها فقط (${expenseAmount} ${restaurant.currency}) في المصاريف`);
    } else {
      logActivity('تسجيل طلب POS', `إتمام الطلب ${newOrder.orderNumber} بقيمة ${totalAmount} ${restaurant.currency}`);
    }

    return newOrder;
  };

  // Analytics Calculation Helper
  const getDashboardStats = (): DashboardStats => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(
      o => o.createdAt.startsWith(today) && o.status === 'completed' && o.paymentMethod !== 'staff_meal'
    );

    const todaySales = todayOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const orderCount = todayOrders.length;
    const avgOrderValue = orderCount > 0 ? Math.round(todaySales / orderCount) : 0;
    const estimatedProfit = todayOrders.reduce((acc, o) => acc + o.profitAmount, 0);

    // Sales by day (last 7 days)
    const daysArr: { day: string; sales: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('ar-SY', { weekday: 'short' });

      const dayOrders = orders.filter(
        o => o.createdAt.startsWith(dateStr) && o.status === 'completed' && o.paymentMethod !== 'staff_meal'
      );
      const sales = dayOrders.reduce((acc, o) => acc + o.totalAmount, 0);

      daysArr.push({
        day: dayName,
        sales,
        orders: dayOrders.length
      });
    }

    // Top selling products
    const productSalesMap: Record<string, { quantity: number; revenue: number }> = {};
    orders.forEach(o => {
      if (o.status === 'completed' && o.paymentMethod !== 'staff_meal') {
        o.items.forEach(it => {
          if (!productSalesMap[it.productName]) {
            productSalesMap[it.productName] = { quantity: 0, revenue: 0 };
          }
          productSalesMap[it.productName].quantity += it.quantity;
          productSalesMap[it.productName].revenue += it.total;
        });
      }
    });

    const topSellingProducts = Object.entries(productSalesMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Low stock ingredients
    const lowStockIngredients = ingredients.filter(ing => ing.currentStock <= ing.minStockThreshold);

    // Waste Calculations
    const wasteMovements = stockMovements.filter(m => m.type === 'waste');
    let totalWasteCost = 0;
    const wasteIngMap: Record<string, { ingredientName: string; totalQuantity: number; unit: string; totalCost: number }> = {};
    const wasteReasonMap: Record<string, { reason: string; totalCost: number; count: number }> = {};

    wasteMovements.forEach(wm => {
      const ing = ingredients.find(i => i.id === wm.ingredientId);
      const unitCost = ing ? ing.costPerUnit : 0;
      const cost = wm.quantity * unitCost;
      totalWasteCost += cost;

      if (!wasteIngMap[wm.ingredientName]) {
        wasteIngMap[wm.ingredientName] = { ingredientName: wm.ingredientName, totalQuantity: 0, unit: wm.unit, totalCost: 0 };
      }
      wasteIngMap[wm.ingredientName].totalQuantity += wm.quantity;
      wasteIngMap[wm.ingredientName].totalCost += cost;

      const reasonStr = wm.reason || 'غير محدد';
      if (!wasteReasonMap[reasonStr]) {
        wasteReasonMap[reasonStr] = { reason: reasonStr, totalCost: 0, count: 0 };
      }
      wasteReasonMap[reasonStr].totalCost += cost;
      wasteReasonMap[reasonStr].count += 1;
    });

    const topWastedIngredients = Object.values(wasteIngMap)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);

    const wasteByReason = Object.values(wasteReasonMap)
      .sort((a, b) => b.totalCost - a.totalCost);

    // Expense & Waste Alerts
    const expenseAlerts: ExpenseAlert[] = [];

    // Alert 1: Significant Waste Alert
    if (totalWasteCost > 0) {
      const topName = topWastedIngredients[0]?.ingredientName || 'مواد أولية';
      expenseAlerts.push({
        id: 'alert_waste_total',
        type: 'waste_high',
        severity: totalWasteCost > 20000 ? 'high' : 'medium',
        title: `تنبيه خسائر الهدر: ${totalWasteCost.toLocaleString()} ${restaurant.currency}`,
        description: `تم تسجيل هدر إجمالي بقدر ${totalWasteCost.toLocaleString()} ${restaurant.currency}. المادة الأكثر هدرأ هي (${topName}).`,
        actionableRecommendation: `ينصح بمراجعة تاريخ الصلاحية وحفظ المواد وتدريب الطاقم على معايير الوصفات الدقيقة لتقليل الهدر.`
      });
    }

    // Alert 2: Low Profit Margin Recipes (< 40%)
    recipes.forEach(r => {
      const prod = products.find(p => p.id === r.productId);
      if (prod && r.profitMargin < 40) {
        expenseAlerts.push({
          id: `alert_margin_${r.id}`,
          type: 'low_margin',
          severity: r.profitMargin < 25 ? 'high' : 'medium',
          title: `ارتفاع تكلفة وجبة "${prod.name}" (هامش ربح ${r.profitMargin.toFixed(1)}%)`,
          description: `سعر البيع (${prod.price.toLocaleString()} ${restaurant.currency}) يقارب تكلفة المكونات (${r.calculatedCost.toLocaleString()} ${restaurant.currency}).`,
          actionableRecommendation: `تعديل سعر البيع إلى ${r.suggestedPrice.toLocaleString()} ${restaurant.currency} أو استبدال المكونات المكلفة بموردين أرخص.`
        });
      }
    });

    // Alert 3: Critical Low Stock Purchase Warning
    if (lowStockIngredients.length > 0) {
      expenseAlerts.push({
        id: 'alert_low_stock_expense',
        type: 'low_stock',
        severity: 'high',
        title: `تنبيه شراء طارئ: ${lowStockIngredients.length} مواد قرب النفاد`,
        description: `نفاد المواد (${lowStockIngredients.map(i => i.name).slice(0, 3).join('، ')}) قد يضطرك للشراء السريع بأسعار مرتفعة.`,
        actionableRecommendation: `قم بطلب الشراء الفوري من الموردين المعتمدين لتجنب توقف المبيعات أو الشراء التكتيكي المكلف.`
      });
    }

    // Expense Calculations
    const todayExpensesList = expenses.filter(e => e.date.startsWith(today));
    const todayExpenses = todayExpensesList.reduce((acc, e) => acc + e.amount, 0);

    const catLabels: Record<ExpenseCategory, string> = {
      wages: 'أجور ورواتب العمال',
      utilities: 'كهرباء وغاز وماء',
      supplies: 'محارم ومستلزمات صالة',
      rent: 'إيجار العقار',
      maintenance: 'صيانة وإصلاحات',
      staff_meals: 'وجبات وأكل العمال',
      other: 'مصاريف أخرى'
    };

    const categoryTotals: Record<ExpenseCategory, number> = {
      wages: 0,
      utilities: 0,
      supplies: 0,
      rent: 0,
      maintenance: 0,
      staff_meals: 0,
      other: 0
    };

    expenses.forEach(e => {
      if (categoryTotals[e.category] !== undefined) {
        categoryTotals[e.category] += e.amount;
      } else {
        categoryTotals['other'] += e.amount;
      }
    });

    const expensesByCategory = (Object.keys(categoryTotals) as ExpenseCategory[]).map(cat => ({
      category: cat,
      label: catLabels[cat],
      total: categoryTotals[cat]
    }));

    const netProfitAfterExpenses = Math.max(0, estimatedProfit - todayExpenses - totalWasteCost);

    return {
      todaySales,
      orderCount,
      avgOrderValue,
      estimatedProfit,
      todayExpenses,
      netProfitAfterExpenses,
      salesByDay: daysArr,
      topSellingProducts,
      lowStockIngredients,
      recentActivities: activityLogs.slice(0, 8),
      wasteAnalytics: {
        totalWasteCost,
        wasteCount: wasteMovements.length,
        topWastedIngredients,
        wasteByReason
      },
      expenseAlerts,
      expensesByCategory
    };
  };

  const getLowMarginProducts = () => {
    return products.map(prod => {
      const recipe = recipes.find(r => r.productId === prod.id);
      const cost = recipe ? recipe.calculatedCost : prod.price * 0.5;
      const margin = prod.price > 0 ? ((prod.price - cost) / prod.price) * 100 : 0;
      return {
        product: prod,
        recipe,
        margin: Number(margin.toFixed(1)),
        cost
      };
    }).sort((a, b) => a.margin - b.margin);
  };

  // AI Assistant Integration Call
  const sendChatMessage = async (userText: string) => {
    const userMsg: AIChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);

    try {
      // Send context to backend /api/ai/chat
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          context: {
            restaurant,
            branch: currentBranch,
            user: currentUser,
            products,
            categories,
            ingredients,
            recipes,
            suppliers,
            purchases,
            orders,
            stats: getDashboardStats()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI Request failed with code ${response.status}`);
      }

      const data = await response.json();

      // Process Tool Execution if backend requested function execution or confirmation
      if (data.actionToPerform) {
        const { actionName, payload, requiresConfirmation, confirmationPrompt } = data.actionToPerform;

        if (requiresConfirmation) {
          const aiMsg: AIChatMessage = {
            id: `msg_ai_${Date.now()}`,
            sender: 'assistant',
            text: confirmationPrompt || data.textReply || 'هل أنت متأكد من تنفيذ هذه العملية الحساسة؟',
            timestamp: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }),
            requireConfirmation: {
              actionType: actionName,
              payload,
              promptText: confirmationPrompt
            }
          };
          setChatMessages(prev => [...prev, aiMsg]);
          return;
        }

        // Execute action immediately
        const resultSummary = executeAIAction(actionName, payload);

        const aiMsg: AIChatMessage = {
          id: `msg_ai_${Date.now()}`,
          sender: 'assistant',
          text: data.textReply + (resultSummary ? `\n\n✅ **تم التنفيذ:** ${resultSummary}` : ''),
          timestamp: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }),
          toolCallsPerformed: [{ toolName: actionName, summary: resultSummary, success: true }]
        };
        setChatMessages(prev => [...prev, aiMsg]);
      } else {
        const aiMsg: AIChatMessage = {
          id: `msg_ai_${Date.now()}`,
          sender: 'assistant',
          text: data.textReply || 'أنا جاهز لمساعدتك في إدارة المطعم.',
          timestamp: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error('AI Error:', err);
      // Local fallback parser for client resilience if API endpoint is unreachable
      const fallbackReply = processLocalAIFallback(userText);
      setChatMessages(prev => [...prev, fallbackReply]);
    }
  };

  // Helper to execute AI tool action locally on context
  const executeAIAction = (actionName: string, payload: any): string => {
    switch (actionName) {
      case 'create_product': {
        // find or create category
        let cat = categories.find(c => c.name.trim().toLowerCase() === (payload.categoryName || '').trim().toLowerCase());
        if (!cat) {
          cat = addCategory(payload.categoryName || 'منتجات عامة');
        }
        const p = addProduct({
          name: payload.name,
          price: Number(payload.price),
          categoryId: cat.id,
          categoryName: cat.name,
          description: payload.description || '',
          isAvailable: true
        });
        return `تمت إضافة المنتج "${p.name}" بسعر ${p.price} ${restaurant.currency} ضمن تصنيف "${p.categoryName}"`;
      }
      case 'delete_product': {
        const target = products.find(p => p.id === payload.id || p.name.trim().toLowerCase() === (payload.name || '').trim().toLowerCase());
        if (target) {
          deleteProduct(target.id);
          return `تم حذف المنتج "${target.name}" بنجاح`;
        }
        return `لم يتم العثور على المنتج المحدد للحذف`;
      }
      case 'add_ingredient': {
        const ing = addIngredient({
          name: payload.name,
          unit: payload.unit || 'kg',
          currentStock: Number(payload.currentStock || 0),
          minStockThreshold: Number(payload.minStockThreshold || 5),
          costPerUnit: Number(payload.costPerUnit || 0)
        });
        return `تمت إضافة المادة الأولية "${ing.name}" بالكمية ${ing.currentStock} ${ing.unit}`;
      }
      case 'record_purchase': {
        let sup = suppliers.find(s => s.name.includes(payload.supplierName) || payload.supplierName.includes(s.name));
        if (!sup) {
          sup = addSupplier({ name: payload.supplierName, phone: '' });
        }
        // find ingredient
        let ing = ingredients.find(i => i.name.trim().toLowerCase() === payload.ingredientName.trim().toLowerCase());
        if (!ing) {
          ing = addIngredient({
            name: payload.ingredientName,
            unit: payload.unit || 'kg',
            currentStock: 0,
            minStockThreshold: 5,
            costPerUnit: Number(payload.costPerUnit)
          });
        }
        recordPurchase(
          sup.id,
          sup.name,
          [{
            ingredientId: ing.id,
            ingredientName: ing.name,
            quantity: Number(payload.quantity),
            unit: payload.unit || ing.unit,
            costPerUnit: Number(payload.costPerUnit)
          }]
        );
        return `تم تسجيل شراء ${payload.quantity} ${payload.unit || ing.unit} من ${ing.name} من المورد ${sup.name}`;
      }
      case 'record_waste': {
        let ing = ingredients.find(i => i.name.trim().toLowerCase() === payload.ingredientName.trim().toLowerCase());
        if (ing) {
          recordWaste(ing.id, Number(payload.quantity), payload.unit || ing.unit, payload.reason || 'هدر مسجل عن طريق الذكاء الاصطناعي');
          return `تم تسجيل هدر ${payload.quantity} ${payload.unit || ing.unit} من المادة ${ing.name}`;
        }
        return `لم يتم العثور على المادة الأولية "${payload.ingredientName}" لتسجيل الهدر`;
      }
      case 'create_recipe': {
        let prod = products.find(p => p.name.trim().toLowerCase() === payload.productName.trim().toLowerCase());
        if (!prod) {
          return `لم نجد المنتج "${payload.productName}" لإضافة وصفته. يرجى إنشاء المنتج أولاً.`;
        }
        // process ingredients in recipe
        const recipeItems = (payload.ingredients || []).map((item: any) => {
          let ing = ingredients.find(i => i.name.trim().toLowerCase() === item.name.trim().toLowerCase());
          if (!ing) {
            ing = addIngredient({
              name: item.name,
              unit: item.unit || 'g',
              currentStock: 10,
              minStockThreshold: 2,
              costPerUnit: 100
            });
          }
          return {
            ingredientId: ing.id,
            ingredientName: ing.name,
            unit: item.unit || ing.unit,
            quantity: Number(item.quantity)
          };
        });

        const rec = saveRecipe(prod.id, recipeItems);
        return `تم ربط ووصفة المنتج "${prod.name}" بـ ${recipeItems.length} مكونات. التكلفة المحسوبة: ${rec.calculatedCost} ${restaurant.currency}`;
      }
      case 'update_inventory': {
        let ing = ingredients.find(i => i.name.trim().toLowerCase() === payload.ingredientName.trim().toLowerCase());
        if (ing) {
          updateIngredientStock(ing.id, Number(payload.newStock), 'تحديث مباشر من الذكاء الاصطناعي');
          return `تم تعديل مخزون "${ing.name}" إلى ${payload.newStock} ${ing.unit}`;
        }
        return `المادة الأولية غير موجودة`;
      }
      case 'add_expense': {
        const exp = addExpense(
          payload.title || 'مصروف تشغيلي',
          payload.category || 'other',
          Number(payload.amount) || 0,
          payload.notes,
          payload.recipientOrWorker,
          'cash'
        );
        return `تم تسجيل المصروف "${exp.title}" بقيمة ${exp.amount.toLocaleString()} ${restaurant.currency} بنجاح!`;
      }
      default:
        return `تم تنفيذ الإجراء ${actionName}`;
    }
  };

  const confirmPendingAIAction = async (messageId: string, approved: boolean) => {
    const msgIndex = chatMessages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const targetMsg = chatMessages[msgIndex];
    if (!targetMsg.requireConfirmation) return;

    const { actionType, payload } = targetMsg.requireConfirmation;

    if (approved) {
      const summary = executeAIAction(actionType, payload);
      setChatMessages(prev => prev.map((m, idx) => {
        if (idx === msgIndex) {
          return {
            ...m,
            requireConfirmation: undefined,
            text: m.text + `\n\n✅ **تم التأكيد والفي المباشر:** ${summary}`
          };
        }
        return m;
      }));
    } else {
      setChatMessages(prev => prev.map((m, idx) => {
        if (idx === msgIndex) {
          return {
            ...m,
            requireConfirmation: undefined,
            text: m.text + `\n\n❌ **تم إلغاء العملية بناءً على طلبك.**`
          };
        }
        return m;
      }));
    }
  };

  const clearChatHistory = () => {
    setChatMessages([
      {
        id: 'msg_welcome',
        sender: 'assistant',
        text: 'أهلاً بك مجدداً في MATO AI. كيف يمكنني مساعدتك اليوم؟',
        timestamp: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Local AI Fallback logic to process Syrian dialect commands if internet/API fails
  const processLocalAIFallback = (prompt: string): AIChatMessage => {
    const text = prompt.toLowerCase();
    let actionName = '';
    let payload: any = {};
    let replyText = '';

    if (text.includes('أضف منتج') || text.includes('ضف منتج') || text.includes('ساوي منتج')) {
      // Regex parsing for name, price, category
      const nameMatch = prompt.match(/اسمه?\s+([^،,]+)/i) || prompt.match(/منتج\s+([^،,]+)/i);
      const priceMatch = prompt.match(/سعره?\s+(\d+)/i) || prompt.match(/بـ?\s*(\d+)/i);
      const catMatch = prompt.match(/تصنيفه?\s+([^،,]+)/i);

      if (nameMatch && priceMatch) {
        const prodName = nameMatch[1].trim();
        const price = priceMatch[1].trim();
        const cat = catMatch ? catMatch[1].trim() : 'عام';

        actionName = 'create_product';
        payload = { name: prodName, price, categoryName: cat };
        const summary = executeAIAction(actionName, payload);
        replyText = `تكرم عينك! ${summary}`;
      } else {
        replyText = `أهلاً بك! لإضافة منتج يرجى كتابة اسمه وسعره وتصنيفه بشكل واضح، مثل:\n"أضف منتج اسمه كرواسون حبش، سعره 25000، وتصنيفه كرواسون"`;
      }
    } else if (text.includes('اشتريت') || text.includes('سجل شراء')) {
      const qtyMatch = prompt.match(/(\d+)\s*(كيلو|كغ|قطعة|لتر|غرام)/i);
      const nameMatch = prompt.match(/(كيلو|كغ|قطعة|لتر|غرام)\s+([^\s]+)/i);
      const priceMatch = prompt.match(/بسعر\s+(\d+)/i);
      const supMatch = prompt.match(/من المورد\s+([^\s]+)/i) || prompt.match(/من\s+([^\s]+)/i);

      if (qtyMatch && nameMatch && priceMatch) {
        actionName = 'record_purchase';
        payload = {
          quantity: qtyMatch[1],
          unit: qtyMatch[2],
          ingredientName: nameMatch[2],
          costPerUnit: priceMatch[1],
          supplierName: supMatch ? supMatch[1] : 'المورد المعتمد'
        };
        const summary = executeAIAction(actionName, payload);
        replyText = `أبشر! ${summary}`;
      } else {
        replyText = `لتسجيل الشراء، يرجى كتابة التفاصيل مثل:\n"اشتريت 10 كيلو حبش بسعر 120000 للكيلو من المورد أبو أحمد"`;
      }
    } else if (text.includes('سجل هدر') || text.includes('سجل التلف')) {
      const qtyMatch = prompt.match(/(\d+)\s*(كيلو|كغ|قطعة|لتر|غرام)/i);
      const nameMatch = prompt.match(/(كيلو|كغ|قطعة|لتر|غرام)\s+([^\s]+)/i);

      if (qtyMatch && nameMatch) {
        actionName = 'record_waste';
        payload = {
          quantity: qtyMatch[1],
          unit: qtyMatch[2],
          ingredientName: nameMatch[2],
          reason: 'هدر مسجل من المساعد الذكي'
        };
        const summary = executeAIAction(actionName, payload);
        replyText = `تم تسجيل الهدر في النظام: ${summary}`;
      } else {
        replyText = `لتسجيل الهدر، يرجى الصياغة كالتالي:\n"سجل هدر 2 كيلو حبش"`;
      }
    } else if (text.includes('سجل أجر') || text.includes('أجر عامل') || text.includes('سجل مصروف') || text.includes('مصروف غاز') || text.includes('مصروف كهرباء')) {
      const amountMatch = prompt.match(/بقيمة\s+(\d+)/i) || prompt.match(/بـ?\s*(\d+)/i) || prompt.match(/(\d+)\s*(ل\.س|ليرة)?/i);
      const amount = amountMatch ? amountMatch[1] : '50000';
      const category: ExpenseCategory = text.includes('أجر') || text.includes('عامل') ? 'wages' : text.includes('غاز') || text.includes('كهرباء') ? 'utilities' : text.includes('محارم') || text.includes('نظافة') ? 'supplies' : 'other';

      actionName = 'add_expense';
      payload = {
        title: prompt.length > 50 ? prompt.substring(0, 50) : prompt,
        category,
        amount: Number(amount),
        notes: 'مسجل عبر المساعد الذكي MATO AI'
      };
      const summary = executeAIAction(actionName, payload);
      replyText = `أبشر! ${summary}`;
    } else if (text.includes('هدر') || text.includes('مصاريف') || text.includes('تنبيهات')) {
      const stats = getDashboardStats();
      const { wasteAnalytics, expenseAlerts } = stats;
      const topWasted = wasteAnalytics.topWastedIngredients.map(i => `• **${i.ingredientName}**: ${i.totalQuantity} ${i.unit} (بقيمة ${i.totalCost.toLocaleString()} ${restaurant.currency})`).join('\n') || 'لا يوجد هدر مسجل';
      const alertsText = expenseAlerts.map(a => `⚠️ **${a.title}**\n${a.description}\n💡 *التوصية:* ${a.actionableRecommendation}`).join('\n\n') || '✅ لا توجد تنبيهات خطيرة للتكاليف أو التلف حالياً.';

      replyText = `🛡️ **تقرير الهدر والمصاريف الزائدة:**\n\n- إجمالي خسائر الهدر المسجلة: **${wasteAnalytics.totalWasteCost.toLocaleString()} ${restaurant.currency}** (${wasteAnalytics.wasteCount} حالات)\n\n📊 **أبرز المواد المهدورة:**\n${topWasted}\n\n🚨 **التنبيهات والتوصيات المباشرة:**\n${alertsText}`;
    } else if (text.includes('ربحت') || text.includes('أرباح') || text.includes('المبيعات')) {
      const stats = getDashboardStats();
      replyText = `📊 **تقرير الأرباح والمبيعات اليوم:**\n- إجمالي مبيعات اليوم: **${stats.todaySales.toLocaleString()} ${restaurant.currency}**\n- عدد الطلبات: **${stats.orderCount} طلبات**\n- الربح التقديري الصافي: **${stats.estimatedProfit.toLocaleString()} ${restaurant.currency}**\n- متوسط قيمة الطلب: **${stats.avgOrderValue.toLocaleString()} ${restaurant.currency}**`;
    } else if (text.includes('تخلص') || text.includes('نقص') || text.includes('المخزون')) {
      const lowStock = ingredients.filter(i => i.currentStock <= i.minStockThreshold);
      if (lowStock.length > 0) {
        const itemsList = lowStock.map(i => `• **${i.name}**: المتبقي ${i.currentStock} ${i.unit} (الحد الأدنى: ${i.minStockThreshold} ${i.unit})`).join('\n');
        replyText = `⚠️ **المواد المنخفضة بالمخزون التي تقترب من النفاد (${lowStock.length} مواد):**\n\n${itemsList}\n\nينصح بطلب توريد هذه المواد قريباً!`;
      } else {
        replyText = `✅ **المخزون بوضع ممتاز!** جميع المواد الأولية أعلى من الحد الأدنى.`;
      }
    } else if (text.includes('أكتر') || text.includes('أكثر') || text.includes('مبيعاً')) {
      const stats = getDashboardStats();
      if (stats.topSellingProducts.length > 0) {
        const topList = stats.topSellingProducts.map((p, idx) => `${idx + 1}. **${p.name}** - تم بيع ${p.quantity} قطع (إجمالي: ${p.revenue.toLocaleString()} ${restaurant.currency})`).join('\n');
        replyText = `🏆 **أكثر المنتجات مبيعاً:**\n\n${topList}`;
      } else {
        replyText = `لا توجد طلبات مسجلة بعد حساب الأكثر مبيعاً.`;
      }
    } else {
      replyText = `أهلاً بك! أنا MATO AI، بقدر أساعدك بإدارة المطعم والمخزون والمنتجات والأرباح. جرب تطلب مني:\n• "أضف منتج اسمه كرواسون حبش بسعر 25000"\n• "اشتريت 10 كيلو حبش بسعر 120000 من المورد أبو أحمد"\n• "شو أكتر المنتجات مبيعاً؟"\n• "كم ربحت اليوم؟"\n• "شو المواد اللي رح تخلص قريب؟"`;
    }

    return {
      id: `msg_ai_${Date.now()}`,
      sender: 'assistant',
      text: replyText,
      timestamp: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <DataContext.Provider
      value={{
        isAuthenticated,
        systemRegistrations,
        subscriptionRequests,
        pendingRestaurantRequestsCount,
        ownerContact,
        updateOwnerContact,
        requestRestaurantSubscription,
        approveRestaurantSubscription,
        rejectRestaurantSubscription,
        activateRestaurantWithCode,
        deleteRestaurantRecord,
        deleteSubscriptionRequest,
        createDirectRestaurantLicense,
        firestoreRestaurants,
        generateAnnualActivationCode,
        loginUser,
        logoutUser,
        updateUserPassword,

        // Shift & Role Passwords Management
        activeShiftRole,
        isShiftUnlocked,
        rolePasswords,
        selectShiftRole,
        updateRolePasswords,
        lockToShiftSelection,
        switchUserWithPassword,

        deleteRegistrationRecord,
        deleteStaffRequest,
        currentRestaurant: restaurant,
        currentBranch,
        currentUser,
        isPlatformOwner,
        branches,
        users,
        pendingUsers,
        pendingUsersCount,
        requireOwnerApproval,
        setRequireOwnerApproval,
        categories,
        rawMaterialCategories,
        products,
        ingredients,
        recipes,
        suppliers,
        purchases,
        stockMovements,
        orders,
        expenses,
        activityLogs,
        chatMessages,
        setCurrentUser,
        setCurrentBranch,
        updateUserRole,
        addUser,
        approveUser,
        rejectUser,
        requestUserRegistration,
        deleteUser,
        toggleUserActive,
        addBranch,
        updateBranch,
        deleteBranch,
        registerNewTenant,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        updateIngredientStock,
        saveRecipe,
        addRawMaterialCategory,
        deleteRawMaterialCategory,
        addSupplier,
        deleteSupplier,
        recordPurchase,
        updatePurchase,
        deletePurchase,
        recordWaste,
        addExpense,
        updateExpense,
        deleteExpense,
        clearAllExpenses,
        createOrder,
        logActivity,
        clearAllProductsAndIngredients,
        sendChatMessage,
        confirmPendingAIAction,
        clearChatHistory,
        licenseInfo,
        isLicenseExpired,
        licenseKeys,
        redeemLicenseKey,
        generateLicenseKey,
        updateRestaurantBranding,
        exportSystemBackup,
        importSystemBackup,
        isOnline,
        pendingOfflineCount,
        triggerOfflineSync,
        toggleOfflineSimulation,
        isSimulatedOffline,
        isCloudSynced,
        lastCloudSyncTime,
        syncCloudNow,
        getDashboardStats,
        getLowMarginProducts,

        // In-App Notifications
        notifications,
        unreadNotificationsCount,
        addInAppNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteInAppNotification,
        clearAllNotifications,
        approveRequestFromNotification,
        rejectRequestFromNotification,
        activeRealtimeAlert,
        dismissRealtimeAlert
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

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
  NotificationType
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
  generateAnnualCodeForRestaurant,
  approveRestaurantInFirestore,
  deleteRestaurantFromFirestore,
  permanentlyDeleteRestaurantFromFirestore,
  subscribeRestaurantsRealtime,
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
  subscribeRestaurantAppDataRealtime
} from '../lib/firebase';


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
  approveRestaurantSubscription: (requestId: string, durationYears?: number) => Promise<{ code: string; expiry: string; restaurantName: string; ownerPhone: string }>;
  rejectRestaurantSubscription: (requestId: string, reason?: string) => Promise<void>;
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
  loginUser: (emailOrPhone: string, passwordInput?: string) => LoginResult;
  logoutUser: () => void;
  updateUserPassword: (userId: string, newPass: string) => { success: boolean; message: string };
  setCurrentUser: (user: User) => void;
  setCurrentBranch: (branch: Branch) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
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
  registerNewTenant: (restaurantName: string, ownerName: string, emailOrPhone: string, method?: 'email' | 'phone', password?: string) => void;
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
  
  recordPurchase: (supplierId: string, supplierName: string, items: { ingredientId: string; ingredientName: string; quantity: number; unit: string; costPerUnit: number }[]) => Purchase;
  
  recordWaste: (ingredientId: string, quantity: number, unit: string, reason?: string) => StockMovement;
  
  addExpense: (title: string, category: ExpenseCategory, amount: number, notes?: string, recipientOrWorker?: string, paymentMethod?: 'cash' | 'card' | 'bank', date?: string) => Expense;
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session & Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const loadedUsers = safeStorageArrayParse<User>(`${STORAGE_KEY}_users`, []);
    if (!Array.isArray(loadedUsers) || loadedUsers.length === 0) return false;
    return safeStorageParse(`${STORAGE_KEY}_is_authenticated`, false);
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
    return users.filter(u => u.isPendingApproval === true);
  }, [users]);

  const pendingUsersCount = pendingUsers.length;

  const defaultEmptyUser: User = {
    id: 'usr_owner_default',
    restaurantId: 'rest_01',
    branchId: 'br_main',
    name: 'المالك',
    email: 'owner@mato.sy',
    role: 'Owner',
    isPlatformOwner: false,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  const [currentUser, setCurrentUserState] = useState<User>(() => (Array.isArray(users) && users[0]) ? users[0] : defaultEmptyUser);

  // Platform Owner flag: true strictly for Farid (SaaS Platform Creator & System SuperAdmin)
  const isPlatformOwner = useMemo(() => {
    if (!currentUser) return false;
    return (
      currentUser.isPlatformOwner === true ||
      currentUser.email?.toLowerCase() === 'farid.fateh@hotmail.com' ||
      currentUser.id === 'usr_owner_farid'
    );
  }, [currentUser]);

  const [categories, setCategories] = useState<Category[]>(() => {
    return safeStorageArrayParse(`${STORAGE_KEY}_categories`, INITIAL_CATEGORIES);
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const initialList = safeStorageArrayParse<Product>(`${STORAGE_KEY}_products`, INITIAL_PRODUCTS);
    const list = Array.isArray(initialList) && initialList.length > 0 ? initialList : INITIAL_PRODUCTS;
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
    return safeStorageArrayParse(`${STORAGE_KEY}_ingredients`, INITIAL_INGREDIENTS);
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    return safeStorageArrayParse(`${STORAGE_KEY}_recipes`, INITIAL_RECIPES);
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    return safeStorageArrayParse(`${STORAGE_KEY}_suppliers`, INITIAL_SUPPLIERS);
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    return safeStorageArrayParse(`${STORAGE_KEY}_purchases`, INITIAL_PURCHASES);
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    return safeStorageArrayParse(`${STORAGE_KEY}_stockMovements`, INITIAL_STOCK_MOVEMENTS);
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    return safeStorageArrayParse(`${STORAGE_KEY}_orders`, INITIAL_ORDERS);
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    return safeStorageArrayParse(`${STORAGE_KEY}_expenses`, INITIAL_EXPENSES);
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    return safeStorageArrayParse(`${STORAGE_KEY}_activityLogs`, INITIAL_LOGS);
  });

  const [licenseInfo, setLicenseInfo] = useState<SoftwareLicense>(() => {
    const parsed = safeStorageParse<SoftwareLicense | null>(`${STORAGE_KEY}_licenseInfo`, null);
    return (parsed && typeof parsed === 'object' && parsed.licenseKey) ? parsed : DEFAULT_SOFTWARE_LICENSE;
  });

  const [licenseKeys, setLicenseKeys] = useState<LicenseKeyInfo[]>(() => {
    return safeStorageArrayParse(`${STORAGE_KEY}_licenseKeys`, DEFAULT_LICENSE_KEYS);
  });

  // In-App Realtime Notifications System (Dedicated to Employee Registration Requests)
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = safeStorageArrayParse<InAppNotification>(`${STORAGE_KEY}_inapp_notifications`, []);
    // Filter out any previous subscription_request notifications if present in local storage
    const filteredSaved = saved ? saved.filter(n => n.type !== 'subscription_request') : [];
    if (filteredSaved && filteredSaved.length > 0) return filteredSaved;

    const initialList: InAppNotification[] = [
      {
        id: 'notif_demo_01',
        type: 'user_registration',
        title: 'طلب انضمام موظف جديد',
        message: 'قام الموظف (سامر العلي) بطلب انضمام بصفة كاشير إلى الفرع الرئيسي.',
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        isRead: false,
        entityId: 'usr_samer_pending',
        entityData: {
          name: 'سامر العلي',
          emailOrPhone: 'samer.ali@restaurant.sy',
          role: 'Cashier',
          branchId: 'br_main',
          notes: 'خبرة 3 سنوات في نقاط البيع والكاشير'
        },
        status: 'pending'
      },
      {
        id: 'notif_demo_03',
        type: 'system',
        title: 'منظومة تنبيهات الموظفين نشطة 🔔',
        message: 'يتم تنبيه مالك ومدير المطعم فورياً بالصوت والإشعار الفوري عند تسجيل أو طلب انضمام أي موظف جديد.',
        createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        isRead: true,
        status: 'approved'
      }
    ];
    return initialList;
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
    city?: string;
    branchesCount?: number;
    planType?: SaaSPlanType;
    notes?: string;
  }) => {
    const reqId = `sub_${Date.now()}`;
    const newRequest: RestaurantSubscriptionRequest = {
      id: reqId,
      restaurantName: params.restaurantName,
      ownerName: params.ownerName,
      phone: params.phone,
      email: params.email || '',
      city: params.city || 'دمشق',
      branchesCount: params.branchesCount || 1,
      planType: params.planType || 'professional',
      status: 'pending_approval',
      notes: params.notes || '',
      requestedAt: new Date().toISOString()
    };

    setSubscriptionRequests(prev => [newRequest, ...prev]);

    // Save to Firestore as pending
    saveRestaurantToFirestore({
      id: reqId,
      name: params.restaurantName,
      ownerName: params.ownerName,
      phone: params.phone,
      email: params.email || '',
      status: 'pending_approval',
      activationCode: '',
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      registeredAt: new Date().toISOString(),
      planType: params.planType || 'professional'
    });

    logActivity('طلب فتح مطعم', `تم تقديم طلب ترخيص وفتح حساب مطعم جديد (${params.restaurantName}) بواسطة (${params.ownerName}) وهو بانتظار موافقة مالك المنصة (فريد)`);

    return {
      success: true,
      message: 'تم إرسال طلب الترخيص بنجاح! سيتم مراجعة الطلب واعتماده من قبل مالك النظام (فريد).',
      requestId: reqId
    };
  };

  const approveRestaurantSubscription = async (requestId: string, durationYears: number = 1) => {
    const targetLocal = subscriptionRequests.find(r => r.id === requestId);
    const targetFirestore = firestoreRestaurants.find(r => r.id === requestId);
    const restName = targetLocal?.restaurantName || targetFirestore?.name || 'مطعم معتمد';
    const ownerPhone = targetLocal?.phone || targetFirestore?.phone || '';

    // Calculate expiry date
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + durationYears);
    const expiryIso = expiry.toISOString();

    // Generate annual code
    const generated = await generateAnnualCodeForRestaurant(requestId, restName);
    
    // Update local state
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
          ownerName: targetFirestore?.ownerName || 'مدير المطعم',
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

    await approveRestaurantInFirestore(requestId, generated.code, generated.newExpiry || expiryIso);

    logActivity('موافقة على ترخيص مطعم', `تمت الموافقة على ترخيص مطعم (${restName}) وتوليد كود التفعيل السنوي (${generated.code}) وتمديده حتى ${new Date(generated.newExpiry || expiryIso).toLocaleDateString('ar-SY')}`);

    return {
      code: generated.code,
      expiry: generated.newExpiry || expiryIso,
      restaurantName: restName,
      ownerPhone
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

    const unsubscribe = subscribeRestaurantAppDataRealtime(currentRestId, (cloudData) => {
      if (cloudData && cloudData.restaurantId === currentRestId) {
        isRemoteSyncRef.current = true;
        hasInitializedRestRef.current[currentRestId] = true;

        if (Array.isArray(cloudData.products)) {
          setProducts(cloudData.products);
          localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(cloudData.products));
        }
        if (Array.isArray(cloudData.categories) && cloudData.categories.length > 0) {
          setCategories(cloudData.categories);
          localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(cloudData.categories));
        }
        if (Array.isArray(cloudData.rawMaterialCategories) && cloudData.rawMaterialCategories.length > 0) {
          setRawMaterialCategories(cloudData.rawMaterialCategories);
          localStorage.setItem(`${STORAGE_KEY}_rawMaterialCategories`, JSON.stringify(cloudData.rawMaterialCategories));
        }
        if (Array.isArray(cloudData.ingredients)) {
          setIngredients(cloudData.ingredients);
          localStorage.setItem(`${STORAGE_KEY}_ingredients`, JSON.stringify(cloudData.ingredients));
        }
        if (Array.isArray(cloudData.recipes)) {
          setRecipes(cloudData.recipes);
          localStorage.setItem(`${STORAGE_KEY}_recipes`, JSON.stringify(cloudData.recipes));
        }
        if (Array.isArray(cloudData.suppliers)) {
          setSuppliers(cloudData.suppliers);
          localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(cloudData.suppliers));
        }
        if (Array.isArray(cloudData.purchases)) {
          setPurchases(cloudData.purchases);
          localStorage.setItem(`${STORAGE_KEY}_purchases`, JSON.stringify(cloudData.purchases));
        }
        if (Array.isArray(cloudData.stockMovements)) {
          setStockMovements(cloudData.stockMovements);
          localStorage.setItem(`${STORAGE_KEY}_stockMovements`, JSON.stringify(cloudData.stockMovements));
        }
        if (Array.isArray(cloudData.orders)) {
          setOrders(cloudData.orders);
          localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(cloudData.orders));
        }
        if (Array.isArray(cloudData.expenses)) {
          setExpenses(cloudData.expenses);
          localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(cloudData.expenses));
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
        }, 350);
      } else if (!cloudData) {
        // Document does not exist in Firestore yet for this restaurant
        // Seed initial data to Firestore
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
    });

    return () => {
      unsubscribe();
    };
  }, [restaurant?.id]);

  // Debounced Auto-Sync from local changes up to Firestore Cloud
  useEffect(() => {
    if (isRemoteSyncRef.current) return;
    if (!restaurant?.id) return;
    if (!hasInitializedRestRef.current[restaurant.id]) {
      // Avoid uploading local default data before initial cloud load is established
      return;
    }

    const timer = setTimeout(() => {
      if (isRemoteSyncRef.current) return;
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
    }, 120);

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

  // Persist data locally on change
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_is_authenticated`, JSON.stringify(isAuthenticated));
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
  }, [isAuthenticated, systemRegistrations, restaurant, branches, users, categories, rawMaterialCategories, products, ingredients, recipes, suppliers, purchases, stockMovements, orders, expenses, activityLogs, licenseInfo, licenseKeys]);

  // Helper logging
  const logActivity = (actionType: string, description: string, details?: string) => {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      restaurantId: restaurant.id,
      branchId: currentBranch.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
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

  const loginUser = (emailOrPhone: string, passwordInput?: string): LoginResult => {
    const cleanInput = emailOrPhone.trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    if (!cleanInput) {
      return {
        success: false,
        status: 'not_found',
        message: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف المسجل.'
      };
    }

    if (!cleanPass) {
      return {
        success: false,
        status: 'wrong_password',
        message: 'يرجى إدخال كلمة المرور لتسجيل الدخول.'
      };
    }

    // 1. Locate User Profile strictly by registered email or phone
    let matchedUser = users.find(u => 
      (u.email && u.email.trim().toLowerCase() === cleanInput) || 
      (u.phone && u.phone.trim() === emailOrPhone.trim())
    );

    // Fallback: If user is Farid or Owner and not yet in list, provision profile
    if (!matchedUser && (cleanInput === 'farid.fateh@hotmail.com' || cleanInput === 'owner@mato.sy' || cleanInput === 'admin@mato.sy')) {
      const isFarid = cleanInput === 'farid.fateh@hotmail.com';
      matchedUser = {
        id: isFarid ? 'usr_owner_farid' : 'usr_owner_default',
        restaurantId: restaurant.id || 'rest_01',
        branchId: '', // Owner has NO branch constraints
        name: isFarid ? 'فريد (مالك المنظومة)' : 'مدير المطعم (صاحب المنشأة)',
        email: cleanInput,
        phone: '+963991234567',
        password: 'admin',
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
    if (!matchedUser && (cleanInput === 'foodbreak' || cleanInput === 'food break' || cleanInput === 'foodbreak@mato.sy' || cleanInput === '0988776655')) {
      matchedUser = usr_foodbreak_owner;
      setUsers(prev => prev.some(u => u.id === usr_foodbreak_owner.id) ? prev : [usr_foodbreak_owner, ...prev]);
    }

    // Check system registrations
    if (!matchedUser) {
      const matchedReg = systemRegistrations.find(r => r.emailOrPhone.trim().toLowerCase() === cleanInput);
      if (matchedReg) {
        matchedUser = {
          id: `usr_${matchedReg.id}`,
          restaurantId: matchedReg.tenantId,
          branchId: '',
          name: matchedReg.ownerName,
          email: matchedReg.emailOrPhone,
          password: 'admin',
          pinCode: '1234',
          role: 'Owner',
          isPlatformOwner: false,
          isActive: true,
          isPendingApproval: false,
          createdAt: matchedReg.registeredAt
        };
        setUsers(prev => [matchedUser!, ...prev.filter(u => u.email !== matchedReg.emailOrPhone)]);
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

    // Ensure Owner has no branch, is always active, and never requires review/approval
    if (matchedUser.role === 'Owner') {
      matchedUser.branchId = '';
      matchedUser.isPendingApproval = false;
      matchedUser.isActive = true;
    }

    // 2. Check Account Status (Owner NEVER requires review/approval)
    if (matchedUser.role !== 'Owner' && matchedUser.isPendingApproval) {
      logActivity('محاولة دخول معلقة', `حاول (${matchedUser.name}) تسجيل الدخول وحسابه بانتظار موافقة واعتماد المالك`);
      return {
        success: false,
        status: 'pending_approval',
        message: 'الحساب قيد المراجعة: تم استلام طلبك وبانتظار موافقة واعتماد مالك المنظومة لتفعيل الصلاحيات.',
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

    // 3. Strict Password Verification
    const expectedPassword = matchedUser.password || 'admin';
    const isPasswordValid = cleanPass === expectedPassword;

    if (!isPasswordValid) {
      logActivity('محاولة دخول فاشلة', `محاولة دخول فاشلة لحساب (${matchedUser.name}) بكلمة مرور خاطئة`);
      return {
        success: false,
        status: 'wrong_password',
        message: 'كلمة المرور غير صحيحة! يرجى التأكد من كتابة كلمة المرور الصحيحة الخاصة بالحساب.'
      };
    }

    // 4. Authenticate User and apply restaurant context if switching tenant
    if (matchedUser.restaurantId === 'rest_foodbreak') {
      setRestaurant(FOOD_BREAK_RESTAURANT);
      setBranches(FOOD_BREAK_BRANCHES);
      setCurrentBranchState(FOOD_BREAK_BRANCHES[0]);
    } else if (matchedUser.restaurantId === 'rest_01' || matchedUser.isPlatformOwner) {
      setRestaurant(INITIAL_RESTAURANT);
      setBranches(INITIAL_BRANCHES);
      setCurrentBranchState(INITIAL_BRANCHES[0]);
    }

    setCurrentUserState(matchedUser);
    setIsAuthenticated(true);
    logActivity('تسجيل دخول ناجح', `تم تسجيل الدخول بنجاح لحساب ${matchedUser.name} (${matchedUser.role})`);
    return {
      success: true,
      status: 'active',
      message: `أهلاً وسهلاً بك، ${matchedUser.name}`,
      user: matchedUser
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

  const logoutUser = () => {
    setIsAuthenticated(false);
    logActivity('تسجيل خروج', `تم إغلاق الجلسة الحالية وحفظ البيانات أوفلاين`);
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

  const registerNewTenant = (
    restaurantName: string,
    ownerName: string,
    emailOrPhone: string,
    method: 'email' | 'phone' = 'email',
    password?: string
  ) => {
    const newRest: Restaurant = {
      id: `rest_${Date.now()}`,
      name: restaurantName,
      type: 'restaurant',
      currency: 'ل.س',
      createdAt: new Date().toISOString()
    };

    const newMainBranch: Branch = {
      id: `br_main_${Date.now()}`,
      restaurantId: newRest.id,
      name: 'الفرع الرئيسي',
      address: 'الموقع الرئيسي',
      phone: emailOrPhone.includes('+') ? emailOrPhone : '',
      isMain: true
    };

    const newOwner: User = {
      id: `usr_owner_${Date.now()}`,
      restaurantId: newRest.id,
      branchId: newMainBranch.id,
      name: ownerName,
      email: emailOrPhone.includes('@') ? emailOrPhone : `${emailOrPhone}@restaurant.sy`,
      phone: emailOrPhone.includes('@') ? undefined : emailOrPhone,
      password: password || '123456',
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
      emailOrPhone,
      method,
      planType: 'professional',
      registeredAt: new Date().toISOString(),
      status: 'active',
      tenantId: newRest.id,
      deviceInfo: 'تطبيق MATO POS Web/Mobile App'
    };

    // Store registration record for system owner/admin tracking
    setSystemRegistrations(prev => [newRegistrationRecord, ...prev]);

    // Save restaurant to Firebase Cloud Firestore for Platform Admin real-time tracking
    const oneYearExpiry = new Date();
    oneYearExpiry.setFullYear(oneYearExpiry.getFullYear() + 1);

    saveRestaurantToFirestore({
      id: newRest.id,
      name: restaurantName,
      ownerName,
      phone: emailOrPhone,
      email: emailOrPhone.includes('@') ? emailOrPhone : '',
      status: 'active',
      activationCode: `MATO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      subscriptionExpiry: oneYearExpiry.toISOString(),
      registeredAt: new Date().toISOString(),
      planType: 'professional'
    });

    // Apply clean isolated workspace

    setRestaurant(newRest);
    setBranches([newMainBranch]);
    setCurrentBranchState(newMainBranch);
    setUsers([newOwner]);
    setCurrentUserState(newOwner);
    
    // Completely reset collections for a clean, isolated tenant
    setCategories(INITIAL_CATEGORIES);
    setProducts([]);
    setIngredients([]);
    setRecipes([]);
    setSuppliers([]);
    setPurchases([]);
    setStockMovements([]);
    setOrders([]);
    setExpenses([]);

    setIsAuthenticated(true);
    logActivity('تسجيل مطعم جديد', `تم إنشاء مطعم جديد حقيقي ومستقل (${restaurantName}) بواسطة (${ownerName})`);
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

    setCategories(prev => prev.filter(c => c.id !== id));
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
    setProducts(prev => [newProduct, ...prev]);
    logActivity('إضافة منتج', `إضافة المنتج ${newProduct.name} بسعر ${newProduct.price} ${restaurant.currency}`);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    logActivity('تعديل منتج', `تحديث بيانات المنتج id:${id}`);
  };

  const deleteProduct = (id: string) => {
    const target = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
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
    setIngredients(prev => [...prev, newIng]);
    logActivity('إضافة مادة أولية', `إضافة المادة ${newIng.name} وحدتها ${newIng.unit}`);
    return newIng;
  };

  const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setIngredients(prev => prev.map(ing => {
      if (ing.id === id) {
        const updated = { ...ing, ...updates };
        logActivity('تعديل مادة أولية', `تحديث المادة ${updated.name} وحدتها ${updated.unit}`);
        return updated;
      }
      return ing;
    }));
  };

  const deleteIngredient = (id: string): boolean => {
    const target = ingredients.find(i => i.id === id);
    if (!target) return false;

    setIngredients(prev => prev.filter(i => i.id !== id));
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
    items: { ingredientId: string; ingredientName: string; quantity: number; unit: string; costPerUnit: number }[]
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

    const newPurchase: Purchase = {
      id: `pur_${Date.now()}`,
      restaurantId: restaurant.id,
      branchId: currentBranch.id,
      supplierId,
      supplierName,
      items: purchaseItems,
      totalAmount,
      date: new Date().toISOString(),
      createdByUserId: currentUser.id,
      createdByName: currentUser.name
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
    date?: string
  ): Expense => {
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
      createdByUserId: currentUser.id,
      createdByName: currentUser.name
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

    const profitAmount = totalAmount - costAmount;

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      restaurantId: restaurant.id,
      branchId: currentBranch.id,
      orderNumber: `ORD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      items: orderItems,
      totalAmount,
      costAmount: Math.round(costAmount),
      profitAmount: Math.round(profitAmount),
      status: 'completed',
      paymentMethod,
      createdAt: new Date().toISOString(),
      createdByUserId: currentUser.id,
      createdByName: currentUser.name
    };

    setOrders(prev => [newOrder, ...prev]);

    // If order is recorded as a Staff Meal (أكل عمال من المحل), automatically record expense!
    if (paymentMethod === 'staff_meal') {
      const mealItemsStr = orderItems.map(i => `${i.productName} (x${i.quantity})`).join('، ');
      const expenseAmount = Math.round(costAmount > 0 ? costAmount : totalAmount);
      const newExpense: Expense = {
        id: `exp_staff_${Date.now()}`,
        restaurantId: restaurant.id,
        branchId: currentBranch.id,
        title: `وجبة عمال - طلب ${newOrder.orderNumber}`,
        category: 'staff_meals',
        amount: expenseAmount,
        date: new Date().toISOString(),
        notes: `وجبة طعام للعمال من المحل (${mealItemsStr}) - تم خصم المواد من المخزون وتسجيل التكلفة بمبلغ ${expenseAmount} ${restaurant.currency}`,
        recipientOrWorker: 'طاقم العمل والعمال',
        paymentMethod: 'cash',
        createdByUserId: currentUser.id,
        createdByName: currentUser.name
      };
      setExpenses(prevExp => [newExpense, ...prevExp]);
      logActivity('تسجيل وجبة عمال كـ مصروف', `تسجيل وجبة طاقم العمال ${newOrder.orderNumber} بقيمة تكلفة ${expenseAmount} ${restaurant.currency} في المصاريف`);
    } else {
      logActivity('تسجيل طلب POS', `إتمام الطلب ${newOrder.orderNumber} بقيمة ${totalAmount} ${restaurant.currency}`);
    }

    return newOrder;
  };

  // Analytics Calculation Helper
  const getDashboardStats = (): DashboardStats => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.createdAt.startsWith(today) && o.status === 'completed');

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

      const dayOrders = orders.filter(o => o.createdAt.startsWith(dateStr) && o.status === 'completed');
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
      if (o.status === 'completed') {
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
        deleteRestaurantRecord,
        deleteSubscriptionRequest,
        createDirectRestaurantLicense,
        firestoreRestaurants,
        generateAnnualActivationCode,
        loginUser,
        logoutUser,
        updateUserPassword,

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

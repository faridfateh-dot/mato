import {
  Restaurant,
  Branch,
  User,
  Category,
  Product,
  Ingredient,
  Recipe,
  Supplier,
  Purchase,
  StockMovement,
  Order,
  ActivityLog,
  Expense,
  RestaurantSubscriptionRequest
} from './types';

export const FOOD_BREAK_TENANT_ID = 'sub_1790630390550';

export const INITIAL_RESTAURANT: Restaurant = {
  id: FOOD_BREAK_TENANT_ID,
  name: 'food break',
  type: 'fast_food',
  currency: 'ل.س',
  logoUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&auto=format&fit=crop&q=80',
  createdAt: '2026-09-28T21:19:50.551Z',
};

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br_main_sub_1790630390550',
    restaurantId: FOOD_BREAK_TENANT_ID,
    name: 'الفرع الرئيسي - Food Break',
    address: 'دمشق، المزة أوتوستراد، بجانب برج دمشق',
    phone: '0980073917',
    isMain: true,
  }
];

export const usr_foodbreak_owner: User = {
  id: 'usr_sub_1790630390550',
  restaurantId: FOOD_BREAK_TENANT_ID,
  branchId: '',
  name: 'farid (مدير مطعم Food Break)',
  email: 'foodbreak@mato.sy',
  phone: '0980073917',
  password: '123454321',
  pinCode: '1234',
  role: 'Owner',
  isPlatformOwner: false,
  isActive: true,
  isPendingApproval: false,
  restaurantName: 'food break',
  createdAt: '2026-09-28T21:19:50.551Z'
};

export const INITIAL_USERS: User[] = [
  usr_foodbreak_owner,
  {
    id: 'usr_owner_farid',
    restaurantId: FOOD_BREAK_TENANT_ID,
    branchId: 'br_main_sub_1790630390550',
    name: 'فريد الفاتح (مالك مطعم Food Break)',
    email: 'farid.fateh@hotmail.com',
    phone: '0980073917',
    password: 'admin',
    pinCode: '1234',
    role: 'Owner',
    isPlatformOwner: true,
    isActive: true,
    isPendingApproval: false,
    restaurantName: 'food break',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr_owner_default',
    restaurantId: FOOD_BREAK_TENANT_ID,
    branchId: 'br_main_sub_1790630390550',
    name: 'مدير المطعم (Food Break)',
    email: 'owner@mato.sy',
    phone: '0980073917',
    password: 'admin',
    pinCode: '1234',
    role: 'Owner',
    isPlatformOwner: false,
    isActive: true,
    isPendingApproval: false,
    restaurantName: 'food break',
    createdAt: '2026-01-01T00:00:00Z'
  }
];

export const FOOD_BREAK_RESTAURANT: Restaurant = {
  id: FOOD_BREAK_TENANT_ID,
  name: 'food break',
  type: 'fast_food',
  currency: 'ل.س',
  logoUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&auto=format&fit=crop&q=80',
  createdAt: '2026-09-28T21:19:50.551Z',
};

export const FOOD_BREAK_BRANCHES: Branch[] = [
  {
    id: 'br_main_sub_1790630390550',
    restaurantId: FOOD_BREAK_TENANT_ID,
    name: 'الفرع الرئيسي - Food Break',
    address: 'دمشق، المزة أوتوستراد، بجانب برج دمشق',
    phone: '0980073917',
    isMain: true,
  }
];

import realFoodBreakData from './foodBreakRealData.json';

export const FOOD_BREAK_CATEGORIES: Category[] = realFoodBreakData.categories as Category[];

export const FOOD_BREAK_PRODUCTS: Product[] = realFoodBreakData.products as Product[];

export const INITIAL_CATEGORIES: Category[] = FOOD_BREAK_CATEGORIES;

export const INITIAL_PRODUCTS: Product[] = FOOD_BREAK_PRODUCTS;

export const INITIAL_INGREDIENTS: Ingredient[] = (realFoodBreakData.ingredients || []) as Ingredient[];

export const INITIAL_RECIPES: Recipe[] = (realFoodBreakData.recipes || []) as Recipe[];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_PURCHASES: Purchase[] = [];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_LOGS: ActivityLog[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_FOOD_BREAK_SUBSCRIPTION: RestaurantSubscriptionRequest = {
  id: FOOD_BREAK_TENANT_ID,
  restaurantName: 'food break',
  ownerName: 'farid',
  phone: '0980073917',
  email: 'foodbreak@mato.sy',
  city: 'دمشق',
  branchesCount: 1,
  planType: 'professional',
  status: 'approved',
  activationCode: 'MATO-2026-HGC1550',
  expiresAt: '2027-09-29T08:47:25.887Z',
  requestedAt: '2026-09-28T21:19:50.551Z',
  approvedAt: '2026-09-28T21:19:50.551Z',
  notes: 'حساب مطعم فود بريك المرخص والمعتمد بالكامل'
};

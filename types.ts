import type { Dispatch, SetStateAction } from 'react';

export interface Business {
  id: string;
  name: string;
  userId: string;
  address?: string;
  contactPhone?: string;
  taxId?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  monthlySalary: number;
  businessId: string;
}

export interface Overhead {
  id: string;
  name: string;
  type: 'Fixed' | 'Variable';
  monthlyCost: number;
  businessId: string;
}

export interface InventoryItem {
  id: string;
  name:string;
  category: 'Produce' | 'Meat' | 'Dairy' | 'Pantry' | 'Bakery' | 'Beverages' | 'Seafood';
  quantity: number;
  unit: string;
  unitCost: number;
  unitPrice: number;
  lowStockThreshold: number;
  businessId: string;
  yieldPercentage?: number; // Trim/peel yield
}

export type IngredientType = 'item' | 'recipe';

export interface Ingredient {
  id: string; // Unique ID for the ingredient entry itself
  type: IngredientType;
  itemId: string; // ID of either InventoryItem or Recipe
  quantity: number;
  unit: string;
  yieldPercentage?: number; // Preparation yield
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  ingredients: Ingredient[];
  servings: number;
  instructions: string[];
  targetSalePricePerServing?: number;
  costHistory?: { date: string; cost: number }[];
  businessId: string;
  imageUrl?: string;
  productionYield?: number; // How much this recipe produces
  productionUnit?: string; // e.g., kg, L, portion
  labourMinutes: number; // in minutes, per serving
  packagingCostPerServing: number;
  wastageFactor: number; // as a percentage, e.g. 5 for 5%
  useCustomLabourCost?: boolean;
  customLabourSalary?: number;
  customWorkingDays?: number;
  customWorkingHours?: number;
}

export interface RecipeCategory {
  id: string;
  name: string;
  businessId: string;
}

export interface IngredientUnit {
  id: string;
  name: string;
  businessId: string;
}

export interface UnitConversion {
  id: string;
  fromUnit: string;
  toUnit: string;
  factor: number;
  itemId?: string; // For item-specific conversions
  businessId: string;
}

export interface RecipeTemplate {
  id: string;
  name: string;
  recipeData: Omit<Recipe, 'id' | 'businessId' | 'name' | 'costHistory' | 'imageUrl'>;
  businessId: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  businessId: string;
}

export interface MenuItem {
  id: string;
  name: string;
  recipeId: string;
  salePrice: number;
  salesCount: number; // total units sold
  businessId: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  quantity: number;
  cost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  orderDate: string; // ISO string
  dueDate?: string; // ISO string
  completionDate?: string; // ISO string
  items: PurchaseOrderItem[];
  totalCost: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  businessId: string;
}

export interface SaleItem {
  menuItemId: string;
  quantity: number;
  salePriceAtTime: number;
  costAtTime: number;
}

export interface Sale {
  id: string;
  saleDate: string; // ISO string
  items: SaleItem[];
  totalRevenue: number;
  totalProfit: number;
  businessId: string;
}


export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  persistent?: boolean;
}

export interface NotificationContextType {
  addNotification: (message: string, type: Notification['type'], persistent?: boolean) => void;
}

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export interface AppSettings {
  foodCostTarget: number;
  // Financial settings
  workingDaysPerMonth: number;
  hoursPerDay: number;
  totalDishesProduced: number;
  totalDishesSold: number;
  dashboard: {
    inventoryValue: boolean;
    lowStockItems: boolean;
    totalRecipes: boolean;
    avgMenuProfit: boolean;
  };
}

export interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

export interface RecipeCostBreakdown {
    rawMaterialCost: number;
    adjustedRMC: number;
    labourCost: number;
    variableOverheadCost: number;
    fixedOverheadCost: number;
    packagingCost: number;
    totalCost: number;
    costPerServing: number;
}


export interface DataContextType {
  loading: boolean;
  // Business Management
  businesses: Business[];
  activeBusinessId: string | null;
  setActiveBusinessId: (id: string) => void;
  addBusiness: (name: string) => Promise<void>;
  updateBusiness: (business: Business) => Promise<void>;
  
  // Scoped Data (filtered by activeBusinessId)
  inventory: InventoryItem[];
  recipes: Recipe[];
  categories: RecipeCategory[];
  ingredientUnits: IngredientUnit[];
  recipeTemplates: RecipeTemplate[];
  unitConversions: UnitConversion[];
  staffMembers: StaffMember[];
  overheads: Overhead[];
  suppliers: Supplier[];
  menuItems: MenuItem[];
  purchaseOrders: PurchaseOrder[];
  sales: Sale[];
  
  // CRUD Operations
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'businessId'>) => Promise<InventoryItem | null>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  bulkUpdateInventoryItems: (itemIds: string[], update: Partial<Pick<InventoryItem, 'unitCost' | 'unitPrice'>>) => Promise<void>;
  bulkDeleteInventoryItems: (itemIds: string[]) => Promise<{ deletedCount: number; failedItems: string[] }>;
  bulkAddInventoryItems: (newItems: Omit<InventoryItem, 'id' | 'businessId'>[]) => Promise<{ successCount: number; duplicateCount: number }>;

  addRecipe: (recipe: Omit<Recipe, 'id' | 'businessId'>) => Promise<void>;
  updateRecipe: (recipe: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<{ success: boolean; message?: string }>;
  recordRecipeCostHistory: (recipeId: string) => Promise<void>;
  duplicateRecipe: (id: string, includeHistory: boolean) => Promise<Recipe | undefined>;
  uploadRecipeImage: (recipeId: string, file: File) => Promise<void>;
  removeRecipeImage: (recipeId: string) => Promise<void>;
  bulkAddRecipes: (newRecipes: Omit<Recipe, 'id' | 'businessId'>[]) => Promise<{ successCount: number; duplicateCount: number }>;

  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<{ success: boolean; message?: string }>;

  addUnit: (name: string) => Promise<void>;
  updateUnit: (id: string, name: string) => Promise<void>;
  deleteUnit: (id: string) => Promise<{ success: boolean; message?: string }>;

  addUnitConversion: (conversion: Omit<UnitConversion, 'id' | 'businessId'>) => Promise<void>;
  updateUnitConversion: (conversion: UnitConversion) => Promise<void>;
  deleteUnitConversion: (id: string) => Promise<void>;

  addRecipeTemplate: (template: Omit<RecipeTemplate, 'id' | 'businessId'>) => Promise<void>;

  addStaffMember: (staff: Omit<StaffMember, 'id' | 'businessId'>) => Promise<void>;
  updateStaffMember: (staff: StaffMember) => Promise<void>;
  deleteStaffMember: (id: string) => Promise<void>;

  addOverhead: (overhead: Omit<Overhead, 'id' | 'businessId'>) => Promise<void>;
  updateOverhead: (overhead: Overhead) => Promise<void>;
  deleteOverhead: (id: string) => Promise<void>;

  // Suppliers
  addSupplier: (supplier: Omit<Supplier, 'id' | 'businessId'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<{ success: boolean; message?: string }>;
  bulkAddSuppliers: (newSuppliers: Omit<Supplier, 'id' | 'businessId'>[]) => Promise<{ successCount: number; duplicateCount: number }>;
  
  // Menu Items
  addMenuItem: (item: Omit<MenuItem, 'id' | 'businessId'>) => Promise<void>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;

  // Purchase Orders
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'businessId' | 'poNumber' | 'orderDate' | 'totalCost' | 'status'>) => Promise<void>;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => Promise<void>;

  // Sales
  addSale: (items: { menuItemId: string; quantity: number }[]) => Promise<void>;

  // Helper functions
  getInventoryItemById: (id: string) => InventoryItem | undefined;
  getRecipeById: (id: string) => Recipe | undefined;
  getSupplierById: (id: string) => Supplier | undefined;
  calculateRecipeCost: (recipe: Recipe | null) => number;
  calculateRecipeCostBreakdown: (recipe: Recipe | null) => RecipeCostBreakdown;
  getConversionFactor: (fromUnit: string, toUnit: string, itemId: string | null) => number | null;
}
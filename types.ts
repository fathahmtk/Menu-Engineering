
import type { Dispatch, SetStateAction } from 'react';

export interface Business {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  businessId: string;
}

export interface InventoryItem {
  id: string;
  name:string;
  category: 'Produce' | 'Meat' | 'Dairy' | 'Pantry' | 'Bakery' | 'Beverages' | 'Seafood';
  quantity: number;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'unit' | 'dozen';
  unitCost: number;
  unitPrice: number;
  supplierId: string;
  lowStockThreshold: number;
  businessId: string;
}

export interface Ingredient {
  itemId: string;
  quantity: number;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'unit' | 'dozen';
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
}

export interface MenuItem {
  id: string;
  name: string;
  recipeId: string;
  salePrice: number;
  salesCount: number;
  businessId: string;
}

export interface RecipeCategory {
  id: string;
  name: string;
  businessId: string;
}

export interface RecipeTemplate {
  id: string;
  name: string;
  recipeData: Omit<Recipe, 'id' | 'businessId' | 'name' | 'costHistory'>;
  businessId: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  quantity: number;
  cost: number; // Cost per unit at time of purchase
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  status: 'Pending' | 'Completed' | 'Cancelled';
  orderDate: string;
  completionDate?: string;
  totalCost: number;
  businessId: string;
}


export interface DataContextType {
  // Business Management
  businesses: Business[];
  activeBusinessId: string | null;
  setActiveBusinessId: (id: string) => void;
  addBusiness: (name: string) => void;
  
  // Scoped Data (filtered by activeBusinessId)
  suppliers: Supplier[];
  inventory: InventoryItem[];
  recipes: Recipe[];
  menuItems: MenuItem[];
  categories: RecipeCategory[];
  recipeTemplates: RecipeTemplate[];
  purchaseOrders: PurchaseOrder[];
  
  // CRUD Operations
  addSupplier: (supplier: Omit<Supplier, 'id' | 'businessId'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  
  // Fix: Use imported Dispatch and SetStateAction types.
  setInventory: Dispatch<SetStateAction<InventoryItem[]>>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'businessId'>) => InventoryItem;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  bulkUpdateInventoryItems: (itemIds: string[], update: Partial<Pick<InventoryItem, 'unitCost' | 'unitPrice' | 'supplierId'>>) => void;
  bulkDeleteInventoryItems: (itemIds: string[]) => { deletedCount: number; failedItems: string[] };

  addRecipe: (recipe: Omit<Recipe, 'id' | 'businessId'>) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => { success: boolean; message?: string };
  recordRecipeCostHistory: (recipeId: string) => void;
  duplicateRecipe: (id: string, includeHistory: boolean) => Recipe | undefined;

  addMenuItem: (item: Omit<MenuItem, 'id' | 'businessId'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;

  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => { success: boolean; message?: string };

  addRecipeTemplate: (template: Omit<RecipeTemplate, 'id' | 'businessId'>) => void;

  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'businessId' | 'status' | 'orderDate' | 'totalCost'>) => void;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void;

  // Helper functions
  getInventoryItemById: (id: string) => InventoryItem | undefined;
  getRecipeById: (id: string) => Recipe | undefined;
  getSupplierById: (id: string) => Supplier | undefined;
  calculateRecipeCost: (recipe: Recipe | null) => number;
}

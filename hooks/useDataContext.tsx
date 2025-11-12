
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { InventoryItem, Recipe, Supplier, MenuItem, Ingredient, Business, RecipeCategory, RecipeTemplate, PurchaseOrder, Sale, SaleItem, IngredientUnit } from '../types';
import { supabase } from '../services/supabaseClient';

// A custom hook to persist state to localStorage
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null
      ? JSON.parse(stickyValue)
      : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

interface DataContextType {
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
  ingredientUnits: IngredientUnit[];
  recipeTemplates: RecipeTemplate[];
  purchaseOrders: PurchaseOrder[];
  sales: Sale[];
  
  // CRUD Operations
  addSupplier: (supplier: Omit<Supplier, 'id' | 'businessId'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => { success: boolean; message?: string };
  bulkAddSuppliers: (newSuppliers: Omit<Supplier, 'id' | 'businessId'>[]) => { successCount: number; duplicateCount: number };
  
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'businessId'>) => InventoryItem;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  bulkUpdateInventoryItems: (itemIds: string[], update: Partial<Pick<InventoryItem, 'unitCost' | 'unitPrice' | 'supplierId'>>) => void;
  bulkDeleteInventoryItems: (itemIds: string[]) => { deletedCount: number; failedItems: string[] };
  bulkAddInventoryItems: (newItems: Omit<InventoryItem, 'id' | 'businessId'>[]) => { successCount: number; duplicateCount: number };

  addRecipe: (recipe: Omit<Recipe, 'id' | 'businessId'>) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => { success: boolean; message?: string };
  recordRecipeCostHistory: (recipeId: string) => void;
  duplicateRecipe: (id: string, includeHistory: boolean) => Recipe | undefined;
  uploadRecipeImage: (recipeId: string, file: File) => Promise<void>;
  removeRecipeImage: (recipeId: string) => Promise<void>;
  bulkAddRecipes: (newRecipes: Omit<Recipe, 'id' | 'businessId'>[]) => { successCount: number; duplicateCount: number };


  addMenuItem: (item: Omit<MenuItem, 'id' | 'businessId'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;

  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => { success: boolean; message?: string };

  addUnit: (name: string) => void;
  updateUnit: (id: string, name: string) => void;
  deleteUnit: (id: string) => { success: boolean; message?: string };

  addRecipeTemplate: (template: Omit<RecipeTemplate, 'id' | 'businessId'>) => void;

  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'businessId' | 'status' | 'orderDate' | 'totalCost'>) => void;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void;
  addSale: (items: { menuItemId: string; quantity: number }[]) => void;


  // Helper functions
  getInventoryItemById: (id: string) => InventoryItem | undefined;
  getRecipeById: (id: string) => Recipe | undefined;
  getSupplierById: (id: string) => Supplier | undefined;
  calculateRecipeCost: (recipe: Recipe | null) => number;
  getConversionFactor: (fromUnit: Ingredient['unit'], toUnit: InventoryItem['unit']) => number | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Fix: Export useData hook
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Fix: Add return statement and implement missing context functions
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Master data lists using localStorage persistence, initialized empty
  const [businesses, setBusinesses] = useStickyState<Business[]>([], 'fb_businesses');
  const [suppliers, setSuppliers] = useStickyState<Supplier[]>([], 'fb_suppliers');
  const [inventory, setInventory] = useStickyState<InventoryItem[]>([], 'fb_inventory');
  const [recipes, setRecipes] = useStickyState<Recipe[]>([], 'fb_recipes');
  const [menuItems, setMenuItems] = useStickyState<MenuItem[]>([], 'fb_menuItems');
  const [categories, setCategories] = useStickyState<RecipeCategory[]>([], 'fb_categories');
  const [ingredientUnits, setIngredientUnits] = useStickyState<IngredientUnit[]>([], 'fb_ingredientUnits');
  const [recipeTemplates, setRecipeTemplates] = useStickyState<RecipeTemplate[]>([], 'fb_recipeTemplates');
  const [purchaseOrders, setPurchaseOrders] = useStickyState<PurchaseOrder[]>([], 'fb_purchaseOrders');
  const [sales, setSales] = useStickyState<Sale[]>([], 'fb_sales');
  
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null);
  const [isDataInitialized, setIsDataInitialized] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      // Check if data is already in localStorage. If not, it's the first load.
      const isFirstLoad = !window.localStorage.getItem('fb_businesses');

      if (isFirstLoad) {
        const mockData = await import('./mockData');
        setBusinesses(mockData.initialBusinesses);
        setSuppliers(mockData.initialSuppliers);
        setInventory(mockData.initialInventory);
        setRecipes(mockData.initialRecipes);
        setMenuItems(mockData.initialMenuItems);
        setCategories(mockData.initialCategories);
        setIngredientUnits(mockData.initialIngredientUnits);
        setRecipeTemplates(mockData.initialRecipeTemplates);
        setPurchaseOrders(mockData.initialPurchaseOrders);
        setSales(mockData.initialSales);
      }
      setIsDataInitialized(true);
    };

    initializeData();
  }, []); // Empty dependency array ensures this runs only once.

  useEffect(() => {
    if (!isDataInitialized) return; // Don't run until data is loaded
    
    const savedBusinessId = localStorage.getItem('activeBusinessId');
    if (savedBusinessId && businesses.some(b => b.id === savedBusinessId)) {
      setActiveBusinessIdState(savedBusinessId);
    } else if (businesses.length > 0) {
      setActiveBusinessIdState(businesses[0].id);
    } else {
      setActiveBusinessIdState(null);
    }
  }, [businesses, isDataInitialized]);

  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL

  const setActiveBusinessId = useCallback((id: string) => {
    localStorage.setItem('activeBusinessId', id);
    setActiveBusinessIdState(id);
  }, []);

  // Business CRUD
  const addBusiness = useCallback((name: string) => {
    const newBusiness = { id: `biz${Date.now()}`, name };
    setBusinesses(prev => [...prev, newBusiness]);
    if (!activeBusinessId) {
        setActiveBusinessId(newBusiness.id);
    }
  }, [activeBusinessId, setActiveBusinessId, setBusinesses]);

  // Helper functions
  const getInventoryItemById = useCallback((id: string) => inventory.find(item => item.id === id), [inventory]);
  const getRecipeById = useCallback((id: string) => recipes.find(r => r.id === id), [recipes]);
  const getSupplierById = useCallback((id: string) => suppliers.find(s => s.id === id), [suppliers]);
  
  const getConversionFactor = useCallback((fromUnit: Ingredient['unit'], toUnit: InventoryItem['unit']): number | null => {
      if (fromUnit.toLowerCase() === toUnit.toLowerCase()) return 1;
      const conversions: { [key: string]: { [key: string]: number } } = {
          'kg': { 'g': 1000 }, 'g': { 'kg': 0.001 },
          'l': { 'ml': 1000 }, 'ml': { 'l': 0.001 },
          'dozen': { 'unit': 12 }, 'unit': { 'dozen': 1 / 12 },
      };
      const from = fromUnit.toLowerCase();
      const to = toUnit.toLowerCase();
      return conversions[from]?.[to] || null;
  }, []);

  const calculateRecipeCost = useCallback((recipe: Recipe | null): number => {
    if (!recipe) return 0;
    return recipe.ingredients.reduce((total, ingredient) => {
        const item = getInventoryItemById(ingredient.itemId);
        if (!item) return total;
        const costConversionFactor = getConversionFactor(ingredient.unit, item.unit) || 1;
        return total + (item.unitCost * ingredient.quantity * costConversionFactor);
    }, 0);
  }, [getInventoryItemById, getConversionFactor]);


  // Supplier CRUD
  const addSupplier = useCallback((supplier: Omit<Supplier, 'id' | 'businessId'>) => {
    if (!activeBusinessId) return;
    const newSupplier = { ...supplier, id: `sup${Date.now()}`, businessId: activeBusinessId };
    setSuppliers(prev => [...prev, newSupplier]);
  }, [activeBusinessId, setSuppliers]);

  const bulkAddSuppliers = useCallback((newSuppliers: Omit<Supplier, 'id' | 'businessId'>[]) => {
    if (!activeBusinessId) return { successCount: 0, duplicateCount: 0 };

    let successCount = 0;
    let duplicateCount = 0;
    const itemsToAdd: Supplier[] = [];
    const existingNames = new Set(suppliers.filter(s => s.businessId === activeBusinessId).map(s => s.name.toLowerCase()));

    newSuppliers.forEach(supplier => {
        if (existingNames.has(supplier.name.toLowerCase())) {
            duplicateCount++;
        } else {
            itemsToAdd.push({ ...supplier, id: `sup${Date.now()}${successCount}`, businessId: activeBusinessId });
            existingNames.add(supplier.name.toLowerCase());
            successCount++;
        }
    });

    if (itemsToAdd.length > 0) {
        setSuppliers(prev => [...prev, ...itemsToAdd]);
    }

    return { successCount, duplicateCount };
  }, [activeBusinessId, suppliers, setSuppliers]);


  const updateSupplier = useCallback((updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  }, [setSuppliers]);

  const deleteSupplier = useCallback((id: string): { success: boolean; message?: string } => {
    const isUsed = inventory.some(item => item.businessId === activeBusinessId && item.supplierId === id);
    if (isUsed) {
        return { success: false, message: 'Cannot delete supplier. It is currently assigned to one or more inventory items.' };
    }
    setSuppliers(prev => prev.filter(s => s.id !== id));
    return { success: true };
  }, [inventory, activeBusinessId, setSuppliers]);
  
  // Inventory CRUD
  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'businessId'>) => {
      if (!activeBusinessId) throw new Error("No active business selected");
      const newItem = { ...item, id: `inv${Date.now()}`, businessId: activeBusinessId };
      setInventory(prev => [...prev, newItem]);
      return newItem;
  }, [activeBusinessId, setInventory]);

  const bulkAddInventoryItems = useCallback((newItems: Omit<InventoryItem, 'id' | 'businessId'>[]) => {
    if (!activeBusinessId) return { successCount: 0, duplicateCount: 0 };
    
    let successCount = 0;
    let duplicateCount = 0;
    const itemsToAdd: InventoryItem[] = [];
    const existingNames = new Set(inventory.filter(i => i.businessId === activeBusinessId).map(i => i.name.toLowerCase()));
    
    newItems.forEach(item => {
        if (existingNames.has(item.name.toLowerCase())) {
            duplicateCount++;
        } else {
            itemsToAdd.push({ ...item, id: `inv${Date.now()}${successCount}`, businessId: activeBusinessId });
            existingNames.add(item.name.toLowerCase());
            successCount++;
        }
    });

    if (itemsToAdd.length > 0) {
        setInventory(prev => [...prev, ...itemsToAdd]);
    }

    return { successCount, duplicateCount };
  }, [activeBusinessId, inventory, setInventory]);

  const updateInventoryItem = useCallback((updatedItem: InventoryItem) => {
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  }, [setInventory]);

  const deleteInventoryItem = useCallback((id: string) => {
      if (recipes.some(r => r.ingredients.some(i => i.itemId === id))) {
        alert('Cannot delete item. It is currently used in one or more recipes.');
        return;
      }
      setInventory(prev => prev.filter(i => i.id !== id));
  }, [recipes, setInventory]);
    
  const bulkUpdateInventoryItems = useCallback((itemIds: string[], update: Partial<Pick<InventoryItem, 'unitCost' | 'unitPrice' | 'supplierId'>>) => {
    const idsToUpdate = new Set(itemIds);
    setInventory(prev => prev.map(item => 
        idsToUpdate.has(item.id) ? { ...item, ...update } : item
    ));
  }, [setInventory]);

  const bulkDeleteInventoryItems = useCallback((itemIds: string[]): { deletedCount: number; failedItems: string[] } => {
    const failedItems: string[] = [];
    const itemIdsSet = new Set(itemIds);
    
    const usedItemIds = new Set<string>();
    recipes.forEach(recipe => {
        if (recipe.businessId !== activeBusinessId) return;
        recipe.ingredients.forEach(ingredient => {
            if (itemIdsSet.has(ingredient.itemId)) {
                usedItemIds.add(ingredient.itemId);
            }
        });
    });

    const successfulIdsToDelete = new Set<string>();
    
    itemIds.forEach(id => {
        const item = inventory.find(i => i.id === id);
        if (item) {
            if (usedItemIds.has(id)) {
                failedItems.push(item.name);
            } else {
                successfulIdsToDelete.add(id);
            }
        }
    });

    if (successfulIdsToDelete.size > 0) {
        setInventory(prev => prev.filter(i => !successfulIdsToDelete.has(i.id)));
    }
    
    return { deletedCount: successfulIdsToDelete.size, failedItems: [...new Set(failedItems)] };
  }, [recipes, activeBusinessId, inventory, setInventory]);


  // Category CRUD
  const addCategory = useCallback((name: string) => {
    if (!activeBusinessId) return;
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.businessId === activeBusinessId)) return;
    const newCategory = { id: `cat${Date.now()}`, name, businessId: activeBusinessId };
    setCategories(prev => [...prev, newCategory]);
  }, [categories, activeBusinessId, setCategories]);

  const updateCategory = useCallback((id: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  }, [setCategories]);

  const deleteCategory = useCallback((id: string) => {
    const isUsed = recipes.some(r => {
      const cat = categories.find(c => c.id === id);
      return r.category === cat?.name && r.businessId === activeBusinessId;
    });
    if (isUsed) {
      return { success: false, message: 'Cannot delete category. It is currently used by one or more recipes.' };
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    return { success: true };
  }, [recipes, categories, activeBusinessId, setCategories]);

  // Unit CRUD
  const addUnit = useCallback((name: string) => {
      if (!activeBusinessId) return;
      if (ingredientUnits.some(u => u.name.toLowerCase() === name.toLowerCase() && u.businessId === activeBusinessId)) return;
      const newUnit = { id: `unit${Date.now()}`, name, businessId: activeBusinessId };
      setIngredientUnits(prev => [...prev, newUnit]);
  }, [ingredientUnits, activeBusinessId, setIngredientUnits]);

  const updateUnit = useCallback((id: string, name: string) => {
      setIngredientUnits(prev => prev.map(u => (u.id === id ? { ...u, name } : u)));
  }, [setIngredientUnits]);

  const deleteUnit = useCallback((id: string) => {
      const unitToDelete = ingredientUnits.find(u => u.id === id);
      if (!unitToDelete) return { success: false, message: 'Unit not found.' };

      const isUsedInRecipes = recipes.some(r =>
          r.businessId === activeBusinessId && r.ingredients.some(i => i.unit.toLowerCase() === unitToDelete.name.toLowerCase())
      );
      const isUsedInInventory = inventory.some(i =>
          i.businessId === activeBusinessId && i.unit.toLowerCase() === unitToDelete.name.toLowerCase()
      );

      if (isUsedInRecipes || isUsedInInventory) {
          return { success: false, message: 'Cannot delete unit. It is currently used in recipes or inventory items.' };
      }
      setIngredientUnits(prev => prev.filter(u => u.id !== id));
      return { success: true };
  }, [recipes, inventory, ingredientUnits, activeBusinessId, setIngredientUnits]);

  // Recipe CRUD
  const addRecipe = useCallback((recipe: Omit<Recipe, 'id' | 'businessId'>) => {
    if (!activeBusinessId) return;
    
    // Auto-add category if it's new
    if (!categories.some(c => c.name.toLowerCase() === recipe.category.toLowerCase() && c.businessId === activeBusinessId)) {
        addCategory(recipe.category);
    }
    
    const newRecipe = { ...recipe, id: `rec${Date.now()}`, businessId: activeBusinessId };
    setRecipes(prev => [...prev, newRecipe]);
  }, [activeBusinessId, categories, addCategory, setRecipes]);
  
  const bulkAddRecipes = useCallback((newRecipes: Omit<Recipe, 'id' | 'businessId'>[]) => {
      if (!activeBusinessId) return { successCount: 0, duplicateCount: 0 };
      
      let successCount = 0;
      let duplicateCount = 0;
      const itemsToAdd: Recipe[] = [];
      const existingNames = new Set(recipes.filter(r => r.businessId === activeBusinessId).map(r => r.name.toLowerCase()));
      
      newRecipes.forEach(recipe => {
          if (existingNames.has(recipe.name.toLowerCase())) {
              duplicateCount++;
          } else {
              // Auto-add new category
              if (!categories.some(c => c.name.toLowerCase() === recipe.category.toLowerCase() && c.businessId === activeBusinessId)) {
                addCategory(recipe.category);
              }
              itemsToAdd.push({ ...recipe, id: `rec${Date.now()}${successCount}`, businessId: activeBusinessId });
              existingNames.add(recipe.name.toLowerCase());
              successCount++;
          }
      });
  
      if (itemsToAdd.length > 0) {
          setRecipes(prev => [...prev, ...itemsToAdd]);
      }
  
      return { successCount, duplicateCount };
  }, [activeBusinessId, recipes, categories, setRecipes, addCategory]);


  const updateRecipe = useCallback((updatedRecipe: Recipe) => {
    setRecipes(prev => prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
  }, [setRecipes]);

  const deleteRecipe = useCallback((id: string) => {
    if (menuItems.some(m => m.recipeId === id && m.businessId === activeBusinessId)) {
        return { success: false, message: 'Cannot delete recipe. It is currently on a menu.' };
    }
    setRecipes(prev => prev.filter(r => r.id !== id));
    return { success: true };
  }, [menuItems, activeBusinessId, setRecipes]);

  const recordRecipeCostHistory = useCallback((recipeId: string) => {
    setRecipes(prev => {
      const recipe = prev.find(r => r.id === recipeId);
      // find uses the full list, so this should work even with filtering
      const masterRecipe = recipes.find(r => r.id === recipeId);
      if (!recipe || !masterRecipe) return prev;
      
      const currentCost = calculateRecipeCost(masterRecipe);
      const today = new Date().toISOString().split('T')[0];

      const lastHistory = recipe.costHistory?.[recipe.costHistory.length - 1];
      
      if (lastHistory && lastHistory.date === today && lastHistory.cost.toFixed(2) === currentCost.toFixed(2)) {
          return prev; // No change, don't add duplicate entry for same day/cost
      }
      
      const newHistory = [...(recipe.costHistory || []), { date: today, cost: currentCost }];
      
      if (newHistory.length > 30) {
        newHistory.shift();
      }

      return prev.map(r => r.id === recipeId ? { ...r, costHistory: newHistory } : r);
    });
  }, [setRecipes, calculateRecipeCost, recipes]);

  const duplicateRecipe = useCallback((id: string, includeHistory: boolean): Recipe | undefined => {
    const recipeToDuplicate = recipes.find(r => r.id === id);
    if (!recipeToDuplicate) return undefined;
    const newRecipe: Recipe = {
      ...recipeToDuplicate,
      id: `rec${Date.now()}`,
      name: `${recipeToDuplicate.name} (Copy)`,
      costHistory: includeHistory ? recipeToDuplicate.costHistory : [],
    };
    setRecipes(prev => [...prev, newRecipe]);
    return newRecipe;
  }, [recipes, setRecipes]);

  const uploadRecipeImage = useCallback(async (recipeId: string, file: File) => {
    if (!activeBusinessId) throw new Error("No active business");
    const filePath = `${activeBusinessId}/${recipeId}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { error } = await supabase.storage.from('recipe-images').upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('recipe-images').getPublicUrl(filePath);
    const imageUrl = data.publicUrl;
    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, imageUrl } : r));
  }, [activeBusinessId, setRecipes]);

  const removeRecipeImage = useCallback(async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe?.imageUrl) {
        const urlParts = recipe.imageUrl.split('/');
        const fileName = urlParts[urlParts.length-1];
        const businessIdFromFile = urlParts[urlParts.length-2];
        const { error } = await supabase.storage.from('recipe-images').remove([`${businessIdFromFile}/${fileName}`]);
        if(error) console.error("Error removing image: ", error);
    }
    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, imageUrl: undefined } : r));
  }, [recipes, setRecipes]);

  const addMenuItem = useCallback((item: Omit<MenuItem, 'id' | 'businessId'>) => {
    if (!activeBusinessId) return;
    const newMenuItem = { ...item, id: `menu${Date.now()}`, businessId: activeBusinessId };
    setMenuItems(prev => [...prev, newMenuItem]);
  }, [activeBusinessId, setMenuItems]);

  const updateMenuItem = useCallback((updatedItem: MenuItem) => {
    setMenuItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  }, [setMenuItems]);

  const deleteMenuItem = useCallback((id: string) => {
    setMenuItems(prev => prev.filter(i => i.id !== id));
  }, [setMenuItems]);

  const addRecipeTemplate = useCallback((template: Omit<RecipeTemplate, 'id' | 'businessId'>) => {
    if (!activeBusinessId) return;
    const newTemplate = { ...template, id: `tmpl${Date.now()}`, businessId: activeBusinessId };
    setRecipeTemplates(prev => [...prev, newTemplate]);
  }, [activeBusinessId, setRecipeTemplates]);

  const addPurchaseOrder = useCallback((po: Omit<PurchaseOrder, 'id' | 'businessId' | 'status' | 'orderDate' | 'totalCost'>) => {
    if (!activeBusinessId) return;
    const totalCost = po.items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    const newPO: PurchaseOrder = {
      ...po,
      id: `po${Date.now()}`,
      businessId: activeBusinessId,
      status: 'Pending',
      orderDate: new Date().toISOString(),
      totalCost,
    };
    setPurchaseOrders(prev => [...prev, newPO]);
  }, [activeBusinessId, setPurchaseOrders]);

  const updatePurchaseOrderStatus = useCallback((id: string, status: PurchaseOrder['status']) => {
    setPurchaseOrders(prev => {
        const order = prev.find(p => p.id === id);
        if (order && status === 'Completed' && order.status !== 'Completed') {
            // Update inventory
            setInventory(currentInventory => {
                const newInventory = [...currentInventory];
                order.items.forEach(poItem => {
                    const invItemIndex = newInventory.findIndex(inv => inv.id === poItem.itemId);
                    if (invItemIndex > -1) {
                        newInventory[invItemIndex].quantity += poItem.quantity;
                    }
                });
                return newInventory;
            });
        }
        return prev.map(p => p.id === id ? { ...p, status, completionDate: status === 'Completed' ? new Date().toISOString() : undefined } : p);
    });
  }, [setPurchaseOrders, setInventory]);

  const addSale = useCallback((items: { menuItemId: string; quantity: number }[]) => {
    if (!activeBusinessId) return;

    let totalRevenue = 0;
    let totalCost = 0;

    const saleItems: SaleItem[] = items.map(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
        if (!menuItem) return null;

        const recipe = recipes.find(r => r.id === menuItem.recipeId);
        const recipeCost = calculateRecipeCost(recipe || null);
        const costPerServing = (recipe && recipe.servings > 0) ? recipeCost / recipe.servings : 0;
        
        totalRevenue += menuItem.salePrice * item.quantity;
        totalCost += costPerServing * item.quantity;

        return {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            salePrice: menuItem.salePrice,
            cost: costPerServing,
        };
    }).filter((item): item is SaleItem => item !== null);

    const totalProfit = totalRevenue - totalCost;

    const newSale: Sale = {
        id: `sale${Date.now()}`,
        businessId: activeBusinessId,
        items: saleItems,
        saleDate: new Date().toISOString(),
        totalRevenue,
        totalCost,
        totalProfit,
    };
    setSales(prev => [...prev, newSale]);
    // Also update sales count on menu item
    setMenuItems(prevMenuItems => {
        const newMenuItems = [...prevMenuItems];
        saleItems.forEach(saleItem => {
            const menuItemIndex = newMenuItems.findIndex(mi => mi.id === saleItem.menuItemId);
            if(menuItemIndex > -1) {
                newMenuItems[menuItemIndex].salesCount += saleItem.quantity;
            }
        });
        return newMenuItems;
    });

  }, [activeBusinessId, menuItems, recipes, calculateRecipeCost, setSales, setMenuItems]);

  // Filtered data for the active business
  const filteredSuppliers = useMemo(() => suppliers.filter(s => s.businessId === activeBusinessId), [suppliers, activeBusinessId]);
  const filteredInventory = useMemo(() => inventory.filter(i => i.businessId === activeBusinessId), [inventory, activeBusinessId]);
  const filteredRecipes = useMemo(() => recipes.filter(r => r.businessId === activeBusinessId), [recipes, activeBusinessId]);
  const filteredMenuItems = useMemo(() => menuItems.filter(m => m.businessId === activeBusinessId), [menuItems, activeBusinessId]);
  const filteredCategories = useMemo(() => categories.filter(c => c.businessId === activeBusinessId), [categories, activeBusinessId]);
  const filteredIngredientUnits = useMemo(() => ingredientUnits.filter(u => u.businessId === activeBusinessId), [ingredientUnits, activeBusinessId]);
  const filteredRecipeTemplates = useMemo(() => recipeTemplates.filter(t => t.businessId === activeBusinessId), [recipeTemplates, activeBusinessId]);
  const filteredPurchaseOrders = useMemo(() => purchaseOrders.filter(p => p.businessId === activeBusinessId), [purchaseOrders, activeBusinessId]);
  const filteredSales = useMemo(() => sales.filter(s => s.businessId === activeBusinessId), [sales, activeBusinessId]);


  const value: DataContextType = {
    businesses,
    activeBusinessId,
    setActiveBusinessId,
    addBusiness,
    
    suppliers: filteredSuppliers,
    inventory: filteredInventory,
    recipes: filteredRecipes,
    menuItems: filteredMenuItems,
    categories: filteredCategories,
    ingredientUnits: filteredIngredientUnits,
    recipeTemplates: filteredRecipeTemplates,
    purchaseOrders: filteredPurchaseOrders,
    sales: filteredSales,
    
    addSupplier,
    updateSupplier,
    deleteSupplier,
    bulkAddSuppliers,
    
    setInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    bulkUpdateInventoryItems,
    bulkDeleteInventoryItems,
    bulkAddInventoryItems,

    addRecipe,
    updateRecipe,
    deleteRecipe,
    recordRecipeCostHistory,
    duplicateRecipe,
    uploadRecipeImage,
    removeRecipeImage,
    bulkAddRecipes,

    addMenuItem,
    updateMenuItem,
    deleteMenuItem,

    addCategory,
    updateCategory,
    deleteCategory,

    addUnit,
    updateUnit,
    deleteUnit,

    addRecipeTemplate,

    addPurchaseOrder,
    updatePurchaseOrderStatus,
    addSale,

    getInventoryItemById,
    getRecipeById,
    getSupplierById,
    calculateRecipeCost,
    getConversionFactor,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

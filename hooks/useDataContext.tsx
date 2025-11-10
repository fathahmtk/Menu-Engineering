
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { InventoryItem, Recipe, Supplier, MenuItem, Ingredient, Business, RecipeCategory, RecipeTemplate, PurchaseOrder, Sale, SaleItem } from '../types';

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
  recipeTemplates: RecipeTemplate[];
  purchaseOrders: PurchaseOrder[];
  sales: Sale[];
  
  // CRUD Operations
  addSupplier: (supplier: Omit<Supplier, 'id' | 'businessId'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
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
  addSale: (items: { menuItemId: string; quantity: number }[]) => void;


  // Helper functions
  getInventoryItemById: (id: string) => InventoryItem | undefined;
  getRecipeById: (id: string) => Recipe | undefined;
  getSupplierById: (id: string) => Supplier | undefined;
  calculateRecipeCost: (recipe: Recipe | null) => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Master data lists using localStorage persistence, initialized empty
  const [businesses, setBusinesses] = useStickyState<Business[]>([], 'fb_businesses');
  const [suppliers, setSuppliers] = useStickyState<Supplier[]>([], 'fb_suppliers');
  const [inventory, setInventory] = useStickyState<InventoryItem[]>([], 'fb_inventory');
  const [recipes, setRecipes] = useStickyState<Recipe[]>([], 'fb_recipes');
  const [menuItems, setMenuItems] = useStickyState<MenuItem[]>([], 'fb_menuItems');
  const [categories, setCategories] = useStickyState<RecipeCategory[]>([], 'fb_categories');
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

  // Memoized filtered data based on active business
  // Moved before early return to comply with Rules of Hooks
  const activeSuppliers = useMemo(() => suppliers.filter(s => s.businessId === activeBusinessId), [suppliers, activeBusinessId]);
  const activeInventory = useMemo(() => inventory.filter(i => i.businessId === activeBusinessId), [inventory, activeBusinessId]);
  const activeRecipes = useMemo(() => recipes.filter(r => r.businessId === activeBusinessId), [recipes, activeBusinessId]);
  const activeMenuItems = useMemo(() => menuItems.filter(m => m.businessId === activeBusinessId), [menuItems, activeBusinessId]);
  const activeCategories = useMemo(() => categories.filter(c => c.businessId === activeBusinessId), [categories, activeBusinessId]);
  const activeRecipeTemplates = useMemo(() => recipeTemplates.filter(rt => rt.businessId === activeBusinessId), [recipeTemplates, activeBusinessId]);
  const activePurchaseOrders = useMemo(() => purchaseOrders.filter(po => po.businessId === activeBusinessId), [purchaseOrders, activeBusinessId]);
  const activeSales = useMemo(() => sales.filter(s => s.businessId === activeBusinessId), [sales, activeBusinessId]);

  if (!isDataInitialized) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-transparent">
            <div className="text-center p-8">
                <p className="text-lg font-semibold text-primary">Initializing Application Data...</p>
            </div>
        </div>
    );
  }

  const setActiveBusinessId = (id: string) => {
    localStorage.setItem('activeBusinessId', id);
    setActiveBusinessIdState(id);
  };

  // Business CRUD
  const addBusiness = (name: string) => {
    const newBusiness = { id: `biz${Date.now()}`, name };
    setBusinesses(prev => [...prev, newBusiness]);
    if (!activeBusinessId) {
        setActiveBusinessId(newBusiness.id);
    }
  };

  // Helper functions
  const getInventoryItemById = (id: string) => inventory.find(item => item.id === id);
  
  const getConversionFactor = (fromUnit: Ingredient['unit'], toUnit: InventoryItem['unit']): number | null => {
      if (fromUnit === toUnit) return 1;
      const conversions: { [key: string]: { [key: string]: number } } = {
          'kg': { 'g': 1000 }, 'g': { 'kg': 0.001 },
          'L': { 'ml': 1000 }, 'ml': { 'L': 0.001 },
          'dozen': { 'unit': 12 }, 'unit': { 'dozen': 1 / 12 },
      };
      return conversions[fromUnit]?.[toUnit] || null;
  };

  const calculateRecipeCost = (recipe: Recipe | null): number => {
    if (!recipe) return 0;
    return recipe.ingredients.reduce((total, ingredient) => {
        const item = getInventoryItemById(ingredient.itemId);
        if (!item) return total;
        const costConversionFactor = getConversionFactor(ingredient.unit, item.unit) || 1;
        return total + (item.unitCost * ingredient.quantity * costConversionFactor);
    }, 0);
  };


  // Supplier CRUD
  const addSupplier = (supplier: Omit<Supplier, 'id' | 'businessId'>) => {
    if (!activeBusinessId) return;
    const newSupplier = { ...supplier, id: `sup${Date.now()}`, businessId: activeBusinessId };
    setSuppliers(prev => [...prev, newSupplier]);
  };
  const updateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  };
  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };
  
  // Inventory CRUD
  const addInventoryItem = (item: Omit<InventoryItem, 'id' | 'businessId'>) => {
      if (!activeBusinessId) throw new Error("No active business selected");
      const newItem = { ...item, id: `inv${Date.now()}`, businessId: activeBusinessId };
      setInventory(prev => [...prev, newItem]);
      return newItem;
  };
  const updateInventoryItem = (updatedItem: InventoryItem) => {
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  };
  const deleteInventoryItem = (id: string) => {
      if (recipes.some(r => r.ingredients.some(i => i.itemId === id))) {
        alert('Cannot delete item. It is currently used in one or more recipes.');
        return;
      }
      setInventory(prev => prev.filter(i => i.id !== id));
  };
    
  const bulkUpdateInventoryItems = (itemIds: string[], update: Partial<Pick<InventoryItem, 'unitCost' | 'unitPrice' | 'supplierId'>>) => {
    const idsToUpdate = new Set(itemIds);
    setInventory(prev => prev.map(item => 
        idsToUpdate.has(item.id) ? { ...item, ...update } : item
    ));
  };

  const bulkDeleteInventoryItems = (itemIds: string[]): { deletedCount: number; failedItems: string[] } => {
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
  };


  // Category CRUD
  const addCategory = (name: string) => {
    if (!activeBusinessId) return;
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.businessId === activeBusinessId)) return;
    const newCategory = { id: `cat${Date.now()}`, name, businessId: activeBusinessId };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  const deleteCategory = (id: string) => {
    const isUsed = recipes.some(r => {
      const cat = categories.find(c => c.id === id);
      return r.category === cat?.name && r.businessId === activeBusinessId;
    });
    if (isUsed) {
      return { success: false, message: 'Cannot delete category. It is currently used by one or more recipes.' };
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    return { success: true };
  };

  // Recipe CRUD
  const addRecipe = (recipe: Omit<Recipe, 'id' | 'businessId'>) => {
    if (!activeBusinessId) return;
    
    // Auto-add category if it's new
    if (!categories.some(c => c.name.toLowerCase() === recipe.category.toLowerCase() && c.businessId === activeBusinessId)) {
        addCategory(recipe.category);
    }
    
    const newRecipe = { ...recipe, id: `rec${Date.now()}`, businessId: activeBusinessId };
    setRecipes(prev => [...prev, newRecipe]);
  };
  const updateRecipe = (updatedRecipe: Recipe) => {
    setRecipes(prev => prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
  };
  const deleteRecipe = (id: string) => {
    if (menuItems.some(m => m.recipeId === id && m.businessId === activeBusinessId)) {
        return { success: false, message: 'Cannot delete recipe. It is currently used in one or more menu items.'};
    }
    setRecipes(prev => prev.filter(r => r.id !== id));
    return { success: true };
  };

  const duplicateRecipe = (id: string, includeHistory: boolean): Recipe | undefined => {
    if (!activeBusinessId) return undefined;
    const recipeToDuplicate = recipes.find(r => r.id === id);
    if (!recipeToDuplicate) return undefined;

    const { id: _oldId, name, costHistory, ...restOfRecipe } = recipeToDuplicate;

    const newRecipe: Recipe = {
        ...restOfRecipe,
        id: `rec${Date.now()}`,
        name: `${name} (Copy)`,
        businessId: activeBusinessId,
        ...(includeHistory && { costHistory: costHistory })
    };
    
    setRecipes(prev => [...prev, newRecipe]);
    return newRecipe;
  };

  const recordRecipeCostHistory = (recipeId: string) => {
    setRecipes(prevRecipes => {
        const recipeIndex = prevRecipes.findIndex(r => r.id === recipeId);
        if (recipeIndex === -1) return prevRecipes;

        const recipe = prevRecipes[recipeIndex];
        const currentCost = parseFloat(calculateRecipeCost(recipe).toFixed(2));
        
        const costHistory = recipe.costHistory || [];
        const lastEntry = costHistory.length > 0 ? costHistory[costHistory.length - 1] : null;

        if (!lastEntry || lastEntry.cost !== currentCost) {
            const newHistoryEntry = {
                date: new Date().toISOString().split('T')[0],
                cost: currentCost,
            };
            const updatedRecipe = {
                ...recipe,
                costHistory: [...costHistory, newHistoryEntry],
            };
            
            const newRecipes = [...prevRecipes];
            newRecipes[recipeIndex] = updatedRecipe;
            return newRecipes;
        }

        return prevRecipes; // No change needed
    });
  };

  // Recipe Template CRUD
  const addRecipeTemplate = (template: Omit<RecipeTemplate, 'id' | 'businessId'>) => {
    if (!activeBusinessId) return;
    const newTemplate = { ...template, id: `tmpl${Date.now()}`, businessId: activeBusinessId };
    setRecipeTemplates(prev => [...prev, newTemplate]);
  };

  // Menu Item CRUD
  const addMenuItem = (item: Omit<MenuItem, 'id' | 'businessId'>) => {
    if (!activeBusinessId) return;
    const newItem = { ...item, id: `menu${Date.now()}`, businessId: activeBusinessId };
    setMenuItems(prev => [...prev, newItem]);
  };
  const updateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems(prev => prev.map(m => m.id === updatedItem.id ? updatedItem : m));
  };
  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
  };

  // Purchase Order CRUD
  const addPurchaseOrder = (po: Omit<PurchaseOrder, 'id' | 'businessId' | 'status' | 'orderDate' | 'totalCost'>) => {
    if (!activeBusinessId) return;
    const totalCost = po.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    const newPO: PurchaseOrder = {
      ...po,
      id: `po${Date.now()}`,
      businessId: activeBusinessId,
      status: 'Pending',
      orderDate: new Date().toISOString().split('T')[0],
      totalCost,
    };
    setPurchaseOrders(prev => [...prev, newPO]);
  };

  const updatePurchaseOrderStatus = (id: string, status: PurchaseOrder['status']) => {
    const order = purchaseOrders.find(po => po.id === id);
    if (!order) return;

    if (status === 'Completed' && order.status !== 'Completed') {
      const inventoryMap = new Map(inventory.map(i => [i.id, { ...i }]));
      order.items.forEach(orderItem => {
        if (inventoryMap.has(orderItem.itemId)) {
          const item = inventoryMap.get(orderItem.itemId)!;
          item.quantity += orderItem.quantity;
        }
      });
      setInventory(Array.from(inventoryMap.values()));
    }

    setPurchaseOrders(prev => prev.map(po => 
      po.id === id 
        ? { 
            ...po, 
            status,
            completionDate: status === 'Completed' ? new Date().toISOString().split('T')[0] : po.completionDate
          } 
        : po
    ));
  };

  // Sales CRUD
  const addSale = (items: { menuItemId: string; quantity: number }[]) => {
    if (!activeBusinessId) return;

    const saleItems: SaleItem[] = [];
    let totalRevenue = 0;
    let totalCost = 0;

    const inventoryUpdates = new Map<string, number>();

    for (const saleItem of items) {
        const menuItem = menuItems.find(m => m.id === saleItem.menuItemId);
        if (!menuItem) continue;

        const recipe = recipes.find(r => r.id === menuItem.recipeId);
        if (!recipe) continue;

        const recipeCost = calculateRecipeCost(recipe);
        const costPerServing = recipe.servings > 0 ? recipeCost / recipe.servings : 0;
        
        // Denormalize data for the sale record
        saleItems.push({
            menuItemId: saleItem.menuItemId,
            quantity: saleItem.quantity,
            salePrice: menuItem.salePrice,
            cost: costPerServing,
        });

        totalRevenue += menuItem.salePrice * saleItem.quantity;
        totalCost += costPerServing * saleItem.quantity;

        // Tally up inventory deductions
        for (const ingredient of recipe.ingredients) {
            const currentQuantity = inventoryUpdates.get(ingredient.itemId) || 0;
            // The total quantity of this ingredient needed for this line item in the sale
            const quantityToDecrement = (ingredient.quantity / recipe.servings) * saleItem.quantity;
            
            // Handle unit conversions for inventory deduction
            const inventoryItem = getInventoryItemById(ingredient.itemId);
            if(inventoryItem) {
                const conversionFactor = getConversionFactor(ingredient.unit, inventoryItem.unit) || 1;
                inventoryUpdates.set(ingredient.itemId, currentQuantity + (quantityToDecrement * conversionFactor));
            }
        }
    }

    // Create the sale record
    const newSale: Sale = {
        id: `sale${Date.now()}`,
        businessId: activeBusinessId,
        items: saleItems,
        saleDate: new Date().toISOString(),
        totalRevenue,
        totalCost,
        totalProfit: totalRevenue - totalCost,
    };
    setSales(prev => [...prev, newSale]);
    
    // Update inventory
    setInventory(prevInventory => {
        return prevInventory.map(invItem => {
            if (inventoryUpdates.has(invItem.id)) {
                return { ...invItem, quantity: invItem.quantity - (inventoryUpdates.get(invItem.id) || 0) };
            }
            return invItem;
        });
    });

    // Update menu item sales counts
    setMenuItems(prevMenuItems => {
        return prevMenuItems.map(menuItem => {
            const saleItem = items.find(i => i.menuItemId === menuItem.id);
            if (saleItem) {
                return { ...menuItem, salesCount: menuItem.salesCount + saleItem.quantity };
            }
            return menuItem;
        });
    });
  };

  const getRecipeById = (id: string) => recipes.find(recipe => recipe.id === id);
  const getSupplierById = (id: string) => suppliers.find(supplier => supplier.id === id);


  return (
    <DataContext.Provider value={{
      businesses, activeBusinessId, setActiveBusinessId, addBusiness,
      suppliers: activeSuppliers, addSupplier, updateSupplier, deleteSupplier,
      inventory: activeInventory, setInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, bulkUpdateInventoryItems, bulkDeleteInventoryItems,
      recipes: activeRecipes, addRecipe, updateRecipe, deleteRecipe, recordRecipeCostHistory, duplicateRecipe,
      menuItems: activeMenuItems, addMenuItem, updateMenuItem, deleteMenuItem,
      categories: activeCategories, addCategory, updateCategory, deleteCategory,
      recipeTemplates: activeRecipeTemplates, addRecipeTemplate,
      purchaseOrders: activePurchaseOrders,
      addPurchaseOrder,
      updatePurchaseOrderStatus,
      sales: activeSales,
      addSale,
      getInventoryItemById, getRecipeById, getSupplierById,
      calculateRecipeCost,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

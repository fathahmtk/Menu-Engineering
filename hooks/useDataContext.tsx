import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { InventoryItem, Recipe, Supplier, MenuItem, Ingredient, Business, RecipeCategory, RecipeTemplate, PurchaseOrder, Sale, SaleItem, IngredientUnit, DataContextType, PurchaseOrderItem } from '../types';
import { mockBusinesses, mockSuppliers, mockInventory, mockRecipes, mockMenuItems, mockCategories, mockIngredientUnits, mockPurchaseOrders, mockSales, mockRecipeTemplates } from './mockData';
import { AlertTriangle } from 'lucide-react';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [businesses, setBusinesses] = useState<Business[]>(mockBusinesses);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [categories, setCategories] = useState<RecipeCategory[]>(mockCategories);
  const [ingredientUnits, setIngredientUnits] = useState<IngredientUnit[]>(mockIngredientUnits);
  const [recipeTemplates, setRecipeTemplates] = useState<RecipeTemplate[]>(mockRecipeTemplates);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [sales, setSales] = useState<Sale[]>(mockSales);
  
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(() => {
      const savedBusinessId = localStorage.getItem('activeBusinessId');
      const businessExists = businesses.some(b => b.id === savedBusinessId);
      return businessExists ? savedBusinessId : (businesses[0]?.id || null);
  });

  useEffect(() => {
    if (activeBusinessId) {
      localStorage.setItem('activeBusinessId', activeBusinessId);
    } else if (businesses.length > 0) {
      const newActiveId = businesses[0].id;
      setActiveBusinessIdState(newActiveId);
      localStorage.setItem('activeBusinessId', newActiveId);
    }
  }, [activeBusinessId, businesses]);


  const setActiveBusinessId = useCallback((id: string) => {
    localStorage.setItem('activeBusinessId', id);
    setActiveBusinessIdState(id);
  }, []);

  const addBusiness = async (name: string) => {
    const newBusiness: Business = {
        id: crypto.randomUUID(),
        name,
        userId: 'mock-user-id'
    };
    setBusinesses(prev => [...prev, newBusiness]);
    if (!activeBusinessId) {
      setActiveBusinessId(newBusiness.id);
    }
  };

  const updateBusiness = async (updatedBusiness: Business) => {
    setBusinesses(prev => prev.map(b => b.id === updatedBusiness.id ? updatedBusiness : b));
  };


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

  const filteredSuppliers = useMemo(() => suppliers.filter(s => s.businessId === activeBusinessId), [suppliers, activeBusinessId]);
  const filteredInventory = useMemo(() => inventory.filter(i => i.businessId === activeBusinessId), [inventory, activeBusinessId]);
  const filteredRecipes = useMemo(() => recipes.filter(r => r.businessId === activeBusinessId), [recipes, activeBusinessId]);
  const filteredMenuItems = useMemo(() => menuItems.filter(m => m.businessId === activeBusinessId), [menuItems, activeBusinessId]);
  const filteredCategories = useMemo(() => categories.filter(c => c.businessId === activeBusinessId), [categories, activeBusinessId]);
  const filteredIngredientUnits = useMemo(() => ingredientUnits.filter(u => u.businessId === activeBusinessId), [ingredientUnits, activeBusinessId]);
  const filteredRecipeTemplates = useMemo(() => recipeTemplates.filter(t => t.businessId === activeBusinessId), [recipeTemplates, activeBusinessId]);
  const filteredPurchaseOrders = useMemo(() => purchaseOrders.filter(p => p.businessId === activeBusinessId).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()), [purchaseOrders, activeBusinessId]);
  const filteredSales = useMemo(() => sales.filter(s => s.businessId === activeBusinessId), [sales, activeBusinessId]);

  // CRUD functions
  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'businessId'>) => {
    if (!activeBusinessId) return;
    const newSupplier = { ...supplier, id: crypto.randomUUID(), businessId: activeBusinessId };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const bulkAddSuppliers = async (newSuppliers: Omit<Supplier, 'id' | 'businessId'>[]) => {
    if (!activeBusinessId) return { successCount: 0, duplicateCount: 0 };
    const existingNames = new Set(suppliers.map(s => s.name.toLowerCase()));
    const toAdd = newSuppliers.filter(s => !existingNames.has(s.name.toLowerCase()));
    const duplicateCount = newSuppliers.length - toAdd.length;

    if (toAdd.length === 0) return { successCount: 0, duplicateCount };
    
    const data = toAdd.map(s => ({ ...s, id: crypto.randomUUID(), businessId: activeBusinessId }));
    setSuppliers(prev => [...prev, ...data]);
    return { successCount: data.length, duplicateCount };
  };

  const updateSupplier = async (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
  };

  const deleteSupplier = async (id: string) => {
    const isUsed = inventory.some(item => item.supplierId === id);
    if (isUsed) return { success: false, message: 'Cannot delete supplier. It is currently assigned to one or more inventory items.' };
    
    setSuppliers(prev => prev.filter(s => s.id !== id));
    return { success: true };
  };
  
  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'businessId'>) => {
      if (!activeBusinessId) return null;
      const newItem = { ...item, id: crypto.randomUUID(), businessId: activeBusinessId };
      setInventory(prev => [...prev, newItem]);
      return newItem;
  };

  const bulkAddInventoryItems = async (newItems: Omit<InventoryItem, 'id' | 'businessId'>[]) => {
    if (!activeBusinessId) return { successCount: 0, duplicateCount: 0 };
    const existingNames = new Set(inventory.map(i => i.name.toLowerCase()));
    const toAdd = newItems.filter(i => !existingNames.has(i.name.toLowerCase()));
    const duplicateCount = newItems.length - toAdd.length;

    if (toAdd.length === 0) return { successCount: 0, duplicateCount };
    
    const data = toAdd.map(i => ({ ...i, id: crypto.randomUUID(), businessId: activeBusinessId }));
    setInventory(prev => [...prev, ...data]);
    return { successCount: data.length, duplicateCount };
  };

  const updateInventoryItem = async (updatedItem: InventoryItem) => {
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  const deleteInventoryItem = async (id: string) => {
      if (recipes.some(r => r.ingredients.some(i => i.itemId === id))) {
        alert('Cannot delete item. It is currently used in one or more recipes.');
        return;
      }
      setInventory(prev => prev.filter(i => i.id !== id));
  };
    
  const bulkUpdateInventoryItems = async (itemIds: string[], update: Partial<Pick<InventoryItem, 'unitCost' | 'unitPrice' | 'supplierId'>>) => {
    setInventory(prev => prev.map(item => itemIds.includes(item.id) ? { ...item, ...update } : item));
  };

  const bulkDeleteInventoryItems = async (itemIds: string[]) => {
    const failedItems: string[] = [];
    const itemIdsSet = new Set(itemIds);
    
    const usedItemIds = new Set<string>();
    recipes.forEach(recipe => recipe.ingredients.forEach(ingredient => {
        if (itemIdsSet.has(ingredient.itemId)) usedItemIds.add(ingredient.itemId);
    }));

    const successfulIdsToDelete = itemIds.filter(id => !usedItemIds.has(id));
    
    itemIds.forEach(id => {
        if (usedItemIds.has(id)) {
            const item = inventory.find(i => i.id === id);
            if(item) failedItems.push(item.name);
        }
    });

    if (successfulIdsToDelete.length > 0) {
        setInventory(prev => prev.filter(i => !successfulIdsToDelete.includes(i.id)));
    }
    
    return { deletedCount: successfulIdsToDelete.length, failedItems: [...new Set(failedItems)] };
  };

  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'businessId'>) => {
      if(!activeBusinessId) return;
      await addCategory(recipe.category); // Ensure category exists
      const newRecipe = { ...recipe, id: crypto.randomUUID(), businessId: activeBusinessId };
      setRecipes(prev => [...prev, newRecipe]);
  };
  const updateRecipe = async (recipe: Recipe) => {
      setRecipes(prev => prev.map(r => r.id === recipe.id ? recipe : r));
  };
  const deleteRecipe = async (id: string) => {
      const isUsed = menuItems.some(m => m.recipeId === id);
      if (isUsed) return { success: false, message: 'Cannot delete recipe. It is currently on a menu.' };

      setRecipes(prev => prev.filter(r => r.id !== id));
      return { success: true };
  };
  
  const recordRecipeCostHistory = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const currentCost = calculateRecipeCost(recipe);
    const lastCostEntry = recipe.costHistory?.[recipe.costHistory.length - 1];

    if (!lastCostEntry || Math.abs(lastCostEntry.cost - currentCost) > 0.01) { 
        const newHistoryEntry = { date: new Date().toISOString(), cost: currentCost };
        const newHistory = [...(recipe.costHistory || []), newHistoryEntry];
        
        setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, costHistory: newHistory } : r));
    }
  };

  const duplicateRecipe = async (id: string, includeHistory: boolean): Promise<Recipe | undefined> => {
    const recipeToDuplicate = recipes.find(r => r.id === id);
    if (!recipeToDuplicate) return undefined;

    const newRecipe: Recipe = {
        ...recipeToDuplicate,
        id: crypto.randomUUID(),
        name: `${recipeToDuplicate.name} (Copy)`,
        costHistory: includeHistory ? [...(recipeToDuplicate.costHistory || [])] : [{ date: new Date().toISOString(), cost: calculateRecipeCost(recipeToDuplicate) }],
    };

    setRecipes(prev => [...prev, newRecipe]);
    return newRecipe;
  };
  
  const bulkAddRecipes = async (newRecipes: Omit<Recipe, 'id' | 'businessId'>[]) => {
    if (!activeBusinessId) return { successCount: 0, duplicateCount: 0 };
    const existingNames = new Set(recipes.map(r => r.name.toLowerCase()));
    const toAdd = newRecipes.filter(r => !existingNames.has(r.name.toLowerCase()));
    const duplicateCount = newRecipes.length - toAdd.length;

    if (toAdd.length === 0) return { successCount: 0, duplicateCount };
    
    const data = toAdd.map(r => ({
      ...r,
      id: crypto.randomUUID(),
      businessId: activeBusinessId,
      costHistory: [{ date: new Date().toISOString(), cost: calculateRecipeCost(r as Recipe) }]
    }));

    const newCategories = [...new Set(data.map(r => r.category))];
    for (const catName of newCategories) {
        await addCategory(catName);
    }
    
    setRecipes(prev => [...prev, ...data]);
    return { successCount: data.length, duplicateCount };
  };

  const addCategory = async (name: string) => {
      if(!activeBusinessId || !name || categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.businessId === activeBusinessId)) return;
      const newCategory = { name, id: crypto.randomUUID(), businessId: activeBusinessId };
      setCategories(prev => [...prev, newCategory]);
  };
  
  const updateCategory = async (id: string, name: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  const deleteCategory = async (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete) return { success: false, message: 'Category not found.'};

    const isUsed = recipes.some(r => r.category.toLowerCase() === categoryToDelete.name.toLowerCase());
    if (isUsed) {
        return { success: false, message: 'Cannot delete category. It is used in one or more recipes.' };
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    return { success: true };
  };

  const addUnit = async (name: string) => {
      if(!activeBusinessId || !name || ingredientUnits.some(u => u.name.toLowerCase() === name.toLowerCase() && u.businessId === activeBusinessId)) return;
      const newUnit = { name, id: crypto.randomUUID(), businessId: activeBusinessId };
      setIngredientUnits(prev => [...prev, newUnit]);
  }

  const updateUnit = async (id: string, name: string) => {
    setIngredientUnits(prev => prev.map(u => u.id === id ? { ...u, name } : u));
  };

  const deleteUnit = async (id: string) => {
    const unitToDelete = ingredientUnits.find(u => u.id === id);
    if (!unitToDelete) return { success: false, message: 'Unit not found.' };

    const isUsed = recipes.some(r => r.ingredients.some(i => i.unit.toLowerCase() === unitToDelete.name.toLowerCase()));
    if (isUsed) {
        return { success: false, message: 'Cannot delete unit. It is used in one or more recipes.' };
    }
    setIngredientUnits(prev => prev.filter(u => u.id !== id));
    return { success: true };
  };
  
  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'businessId'>) => {
    if(!activeBusinessId) return;
    const newMenuItem = { ...item, id: crypto.randomUUID(), businessId: activeBusinessId };
    setMenuItems(prev => [...prev, newMenuItem]);
  };
  
  const updateMenuItem = async (item: MenuItem) => {
    setMenuItems(prev => prev.map(m => m.id === item.id ? item : m));
  };
  
  const deleteMenuItem = async (id: string) => {
    setMenuItems(prev => prev.filter(m => m.id !== id));
  };

  const addRecipeTemplate = async (template: Omit<RecipeTemplate, 'id' | 'businessId'>) => {
    if(!activeBusinessId) return;
    const newTemplate = { ...template, id: crypto.randomUUID(), businessId: activeBusinessId };
    setRecipeTemplates(prev => [...prev, newTemplate]);
  };
  
  const uploadRecipeImage = async (recipeId: string, file: File): Promise<void> => {
    return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const imageUrl = reader.result as string;
            setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, imageUrl } : r));
            resolve();
        };
        reader.readAsDataURL(file);
    });
  };

  const removeRecipeImage = async (recipeId: string) => {
    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, imageUrl: undefined } : r));
  };
  
  const addPurchaseOrder = async (po: { supplierId: string; items: PurchaseOrderItem[]; dueDate?: string; }) => {
    if (!activeBusinessId) return;

    const totalCost = po.items.reduce((sum, item) => {
        return sum + (item.quantity * item.cost);
    }, 0);

    const newPO: PurchaseOrder = {
        ...po,
        id: crypto.randomUUID(),
        businessId: activeBusinessId,
        status: 'Pending',
        orderDate: new Date().toISOString(),
        totalCost,
    };

    setPurchaseOrders(prev => [...prev, newPO]);
  };

  const updatePurchaseOrderStatus = async (id: string, status: PurchaseOrder['status']) => {
      const poToUpdate = purchaseOrders.find(po => po.id === id);
      if (!poToUpdate || !activeBusinessId) return;
      
      const update: Partial<PurchaseOrder> = { status };

      if (status === 'Completed') {
          update.completionDate = new Date().toISOString();
          const newInventory = [...inventory];
          for (const poItem of poToUpdate.items) {
              const currentItemIndex = newInventory.findIndex(invItem => invItem.id === poItem.itemId);
              if (currentItemIndex !== -1) {
                  newInventory[currentItemIndex].quantity += poItem.quantity;
              }
          }
          setInventory(newInventory);
      }
      
      setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, ...update } : po));
  };

  const addSale = async (items: { menuItemId: string; quantity: number }[]) => {
    if (!activeBusinessId) return;

    const saleItems: SaleItem[] = [];
    let totalRevenue = 0;
    let totalCost = 0;

    const inventoryMap = new Map<string, InventoryItem>(inventory.map(i => [i.id, {...i}]));
    const menuItemsMap = new Map<string, MenuItem>(menuItems.map(m => [m.id, {...m}]));

    for (const item of items) {
      const menuItem = menuItemsMap.get(item.menuItemId);
      if (!menuItem) {
        console.warn(`Menu item with id ${item.menuItemId} not found.`);
        continue;
      }

      const recipe = recipes.find(r => r.id === menuItem.recipeId);
      const costPerServing = recipe ? calculateRecipeCost(recipe) / (recipe.servings || 1) : 0;

      saleItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        salePrice: menuItem.salePrice,
        cost: costPerServing,
      });

      totalRevenue += menuItem.salePrice * item.quantity;
      totalCost += costPerServing * item.quantity;

      if (recipe) {
        for (const ingredient of recipe.ingredients) {
          const invItem = inventoryMap.get(ingredient.itemId);
          if (invItem) {
            const conversionFactor = getConversionFactor(ingredient.unit, invItem.unit) || 1;
            const quantityToDecrement = (ingredient.quantity / (recipe.servings || 1)) * item.quantity * conversionFactor;
            invItem.quantity -= quantityToDecrement;
          }
        }
      }

      menuItem.salesCount += item.quantity;
    }
    
    const totalProfit = totalRevenue - totalCost;
    const newSale: Sale = {
      id: crypto.randomUUID(),
      items: saleItems,
      saleDate: new Date().toISOString(),
      totalRevenue,
      totalCost,
      totalProfit,
      businessId: activeBusinessId,
    };
    
    setSales(prev => [...prev, newSale]);
    setInventory(Array.from(inventoryMap.values()));
    setMenuItems(Array.from(menuItemsMap.values()));
  };

  const value: DataContextType = {
    loading,
    businesses,
    activeBusinessId,
    setActiveBusinessId,
    addBusiness,
    updateBusiness,
    
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
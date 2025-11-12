import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { InventoryItem, Recipe, Supplier, MenuItem, Ingredient, Business, RecipeCategory, RecipeTemplate, PurchaseOrder, Sale, SaleItem, IngredientUnit, DataContextType, PurchaseOrderItem } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './useAuthContext';
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Master data lists, fetched from Supabase
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [ingredientUnits, setIngredientUnits] = useState<IngredientUnit[]>([]);
  const [recipeTemplates, setRecipeTemplates] = useState<RecipeTemplate[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null);

  // HOOKS MOVED HERE TO PREVENT CONDITIONAL HOOK CALLS
  const setActiveBusinessId = useCallback((id: string) => {
    localStorage.setItem('activeBusinessId', id);
    window.location.reload(); // Easiest way to refetch all data for the new business
  }, []);

  // Business CRUD
  const addBusiness = useCallback(async (name: string) => {
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase
      .from('businesses')
      .insert({ name, userId: user.id })
      .select()
      .single();
    if (error) throw error;
    if (data) {
      setBusinesses(prev => [...prev, data]);
      if (!activeBusinessId) {
        setActiveBusinessId(data.id);
      }
    }
  }, [user, activeBusinessId, setActiveBusinessId]);

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
  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'businessId'>) => {
    if (!activeBusinessId) return;
    const { data, error } = await supabase.from('suppliers').insert({ ...supplier, businessId: activeBusinessId }).select().single();
    if (error) throw error;
    if (data) setSuppliers(prev => [...prev, data]);
  };

  const bulkAddSuppliers = async (newSuppliers: Omit<Supplier, 'id' | 'businessId'>[]) => {
    if (!activeBusinessId) return { successCount: 0, duplicateCount: 0 };
    // This is a simplified version. A real-world scenario would handle this on the backend.
    const existingNames = new Set(suppliers.map(s => s.name.toLowerCase()));
    const toAdd = newSuppliers.filter(s => !existingNames.has(s.name.toLowerCase()));
    const duplicateCount = newSuppliers.length - toAdd.length;

    if (toAdd.length === 0) return { successCount: 0, duplicateCount };
    
    const { data, error } = await supabase.from('suppliers').insert(toAdd.map(s => ({ ...s, businessId: activeBusinessId }))).select();
    if (error) throw error;
    if (data) setSuppliers(prev => [...prev, ...data]);
    return { successCount: data.length, duplicateCount };
  };

  const updateSupplier = async (updatedSupplier: Supplier) => {
    const { data, error } = await supabase.from('suppliers').update(updatedSupplier).eq('id', updatedSupplier.id).select().single();
    if (error) throw error;
    if (data) setSuppliers(prev => prev.map(s => s.id === data.id ? data : s));
  };

  const deleteSupplier = async (id: string) => {
    const isUsed = inventory.some(item => item.supplierId === id);
    if (isUsed) return { success: false, message: 'Cannot delete supplier. It is currently assigned to one or more inventory items.' };
    
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    setSuppliers(prev => prev.filter(s => s.id !== id));
    return { success: true };
  };
  
  // Inventory CRUD
  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'businessId'>) => {
      if (!activeBusinessId) return null;
      const { data, error } = await supabase.from('inventory').insert({ ...item, businessId: activeBusinessId }).select().single();
      if(error) throw error;
      if (data) setInventory(prev => [...prev, data]);
      return data;
  };

  const bulkAddInventoryItems = async (newItems: Omit<InventoryItem, 'id' | 'businessId'>[]) => {
    if (!activeBusinessId) return { successCount: 0, duplicateCount: 0 };
    const existingNames = new Set(inventory.map(i => i.name.toLowerCase()));
    const toAdd = newItems.filter(i => !existingNames.has(i.name.toLowerCase()));
    const duplicateCount = newItems.length - toAdd.length;

    if (toAdd.length === 0) return { successCount: 0, duplicateCount };
    
    const { data, error } = await supabase.from('inventory').insert(toAdd.map(i => ({ ...i, businessId: activeBusinessId }))).select();
    if (error) throw error;
    if (data) setInventory(prev => [...prev, ...data]);
    return { successCount: data.length, duplicateCount };
  };

  const updateInventoryItem = async (updatedItem: InventoryItem) => {
      const { data, error } = await supabase.from('inventory').update(updatedItem).eq('id', updatedItem.id).select().single();
      if (error) throw error;
      if (data) setInventory(prev => prev.map(i => i.id === data.id ? data : i));
  };

  const deleteInventoryItem = async (id: string) => {
      if (recipes.some(r => r.ingredients.some(i => i.itemId === id))) {
        alert('Cannot delete item. It is currently used in one or more recipes.');
        return;
      }
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
      setInventory(prev => prev.filter(i => i.id !== id));
  };
    
  const bulkUpdateInventoryItems = async (itemIds: string[], update: Partial<Pick<InventoryItem, 'unitCost' | 'unitPrice' | 'supplierId'>>) => {
    const { data, error } = await supabase.from('inventory').update(update).in('id', itemIds).select();
    if (error) throw error;
    if (data) {
        setInventory(prev => prev.map(item => {
            const updatedItem = data.find(d => d.id === item.id);
            return updatedItem ? updatedItem : item;
        }));
    }
  };

  const bulkDeleteInventoryItems = async (itemIds: string[]) => {
    // This is complex logic that should ideally be a single DB transaction.
    // For simplicity here, we'll check for usage first.
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
        const { error } = await supabase.from('inventory').delete().in('id', successfulIdsToDelete);
        if (error) throw error;
        setInventory(prev => prev.filter(i => !successfulIdsToDelete.includes(i.id)));
    }
    
    return { deletedCount: successfulIdsToDelete.length, failedItems: [...new Set(failedItems)] };
  };

  // Other CRUD operations would follow the same async pattern...
  // For brevity, only a few are fully implemented. The rest would be similar.
  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'businessId'>) => {
      if(!activeBusinessId) return;
      await addCategory(recipe.category); // Ensure category exists
      const { data, error } = await supabase.from('recipes').insert({ ...recipe, businessId: activeBusinessId }).select().single();
      if(error) throw error;
      if (data) setRecipes(prev => [...prev, data]);
  };
  const updateRecipe = async (recipe: Recipe) => {
      const { data, error } = await supabase.from('recipes').update(recipe).eq('id', recipe.id).select().single();
      if(error) throw error;
      if(data) setRecipes(prev => prev.map(r => r.id === data.id ? data : r));
  };
  const deleteRecipe = async (id: string) => {
      // Check usage in menuItems
      const isUsed = menuItems.some(m => m.recipeId === id);
      if (isUsed) return { success: false, message: 'Cannot delete recipe. It is currently on a menu.' };

      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) return { success: false, message: error.message };
      setRecipes(prev => prev.filter(r => r.id !== id));
      return { success: true };
  };
  
  const addCategory = async (name: string) => {
      if(!activeBusinessId || categories.some(c => c.name.toLowerCase() === name.toLowerCase())) return;
      const { data, error } = await supabase.from('categories').insert({ name, businessId: activeBusinessId }).select().single();
      if(error) throw error;
      if (data) setCategories(prev => [...prev, data]);
  }

  const uploadRecipeImage = async (recipeId: string, file: File) => {
    if (!activeBusinessId) throw new Error("No active business");
    const filePath = `${user?.id}/${activeBusinessId}/${recipeId}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { error } = await supabase.storage.from('recipe-images').upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('recipe-images').getPublicUrl(filePath);
    const imageUrl = data.publicUrl;
    
    const { data: updatedRecipe, error: updateError } = await supabase.from('recipes').update({ imageUrl }).eq('id', recipeId).select().single();
    if(updateError) throw updateError;
    if (updatedRecipe) setRecipes(prev => prev.map(r => r.id === recipeId ? updatedRecipe : r));
  };

  const removeRecipeImage = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe?.imageUrl) {
        const filePath = recipe.imageUrl.split('/recipe-images/')[1];
        await supabase.storage.from('recipe-images').remove([filePath]);
    }
    const { data: updatedRecipe, error: updateError } = await supabase.from('recipes').update({ imageUrl: null }).eq('id', recipeId).select().single();
    if(updateError) throw updateError;
    if (updatedRecipe) setRecipes(prev => prev.map(r => r.id === recipeId ? updatedRecipe : r));
  };
  
  const addPurchaseOrder = async (po: { supplierId: string; items: PurchaseOrderItem[]; dueDate?: string; }) => {
    if (!activeBusinessId) return;

    const totalCost = po.items.reduce((sum, item) => {
        return sum + (item.quantity * item.cost);
    }, 0);

    const newPO: Omit<PurchaseOrder, 'id'> = {
        ...po,
        businessId: activeBusinessId,
        status: 'Pending',
        orderDate: new Date().toISOString(),
        totalCost,
    };

    const { data, error } = await supabase.from('purchaseOrders').insert(newPO).select().single();
    if (error) throw error;
    if (data) {
        setPurchaseOrders(prev => [...prev, data]);
    }
  };

  const updatePurchaseOrderStatus = async (id: string, status: PurchaseOrder['status']) => {
      const poToUpdate = purchaseOrders.find(po => po.id === id);
      if (!poToUpdate || !activeBusinessId) return;
      
      const update: Partial<PurchaseOrder> = { status };
      let inventoryWasUpdated = false;

      if (status === 'Completed') {
          update.completionDate = new Date().toISOString();
          
          for (const poItem of poToUpdate.items) {
              const currentItem = inventory.find(invItem => invItem.id === poItem.itemId);
              if (currentItem) {
                  const newQuantity = currentItem.quantity + poItem.quantity;
                  const { error } = await supabase
                      .from('inventory')
                      .update({ quantity: newQuantity })
                      .eq('id', poItem.itemId);
                  if (error) {
                      console.error(`Failed to update inventory for item ${currentItem.name}:`, error);
                  }
              }
          }
          inventoryWasUpdated = true;
      }
      
      const { data, error } = await supabase.from('purchaseOrders').update(update).eq('id', id).select().single();
      if (error) throw error;
      if (data) {
          const updatedPOs = purchaseOrders.map(po => po.id === id ? data : po);
          setPurchaseOrders(updatedPOs);

          if (inventoryWasUpdated) {
              const { data: refreshedInventory } = await supabase.from('inventory').select('*').eq('businessId', activeBusinessId);
              if (refreshedInventory) setInventory(refreshedInventory);
          }
      }
  };

  const addSale = async (items: { menuItemId: string; quantity: number }[]) => {
    if (!activeBusinessId) return;

    const saleItems: SaleItem[] = [];
    let totalRevenue = 0;
    let totalCost = 0;

    const inventoryUpdates: { id: string; newQuantity: number }[] = [];
    const menuItemUpdates: { id: string; newSalesCount: number }[] = [];
    const inventoryMap = new Map(inventory.map(i => [i.id, i]));
    const menuItemsMap = new Map(menuItems.map(m => [m.id, m]));

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
            const quantityToDecrement = ingredient.quantity * item.quantity * conversionFactor;
            
            const existingUpdate = inventoryUpdates.find(u => u.id === invItem.id);
            if (existingUpdate) {
                existingUpdate.newQuantity -= quantityToDecrement;
            } else {
                inventoryUpdates.push({ id: invItem.id, newQuantity: invItem.quantity - quantityToDecrement });
            }
          }
        }
      }

      const existingMenuUpdate = menuItemUpdates.find(u => u.id === menuItem.id);
      if (existingMenuUpdate) {
        existingMenuUpdate.newSalesCount += item.quantity;
      } else {
        menuItemUpdates.push({ id: menuItem.id, newSalesCount: menuItem.salesCount + item.quantity });
      }
    }
    
    const totalProfit = totalRevenue - totalCost;
    const newSale: Omit<Sale, 'id' | 'businessId'> & { businessId: string } = {
      items: saleItems,
      saleDate: new Date().toISOString(),
      totalRevenue,
      totalCost,
      totalProfit,
      businessId: activeBusinessId,
    };
    
    const { data: saleData, error: saleError } = await supabase.from('sales').insert(newSale).select().single();
    if (saleError) throw saleError;
    
    const inventoryUpdatePromises = inventoryUpdates.map(update =>
      supabase.from('inventory').update({ quantity: update.newQuantity }).eq('id', update.id)
    );
    const menuItemUpdatePromises = menuItemUpdates.map(update =>
      supabase.from('menuItems').update({ salesCount: update.newSalesCount }).eq('id', update.id)
    );

    await Promise.all([...inventoryUpdatePromises, ...menuItemUpdatePromises]);

    if (saleData) setSales(prev => [...prev, saleData]);
    
    const { data: refreshedInventory } = await supabase.from('inventory').select('*').eq('businessId', activeBusinessId);
    if (refreshedInventory) setInventory(refreshedInventory);

    const { data: refreshedMenuItems } = await supabase.from('menuItems').select('*').eq('businessId', activeBusinessId);
    if (refreshedMenuItems) setMenuItems(refreshedMenuItems);
  };


  // Stubs for other functions
  const placeholder = async () => { console.warn("Function not implemented"); return { success: false } as any; };
  const placeholderArray = async () => { console.warn("Function not implemented"); return []; };
  const placeholderCounts = async () => { console.warn("Function not implemented"); return { successCount: 0, duplicateCount: 0 }; };

  // Filtered data for the active business
  const filteredSuppliers = useMemo(() => suppliers.filter(s => s.businessId === activeBusinessId), [suppliers, activeBusinessId]);
  const filteredInventory = useMemo(() => inventory.filter(i => i.businessId === activeBusinessId), [inventory, activeBusinessId]);
  const filteredRecipes = useMemo(() => recipes.filter(r => r.businessId === activeBusinessId), [recipes, activeBusinessId]);
  const filteredMenuItems = useMemo(() => menuItems.filter(m => m.businessId === activeBusinessId), [menuItems, activeBusinessId]);
  const filteredCategories = useMemo(() => categories.filter(c => c.businessId === activeBusinessId), [categories, activeBusinessId]);
  const filteredIngredientUnits = useMemo(() => ingredientUnits.filter(u => u.businessId === activeBusinessId), [ingredientUnits, activeBusinessId]);
  const filteredRecipeTemplates = useMemo(() => recipeTemplates.filter(t => t.businessId === activeBusinessId), [recipeTemplates, activeBusinessId]);
  const filteredPurchaseOrders = useMemo(() => purchaseOrders.filter(p => p.businessId === activeBusinessId).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()), [purchaseOrders, activeBusinessId]);
  const filteredSales = useMemo(() => sales.filter(s => s.businessId === activeBusinessId), [sales, activeBusinessId]);


  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      
      try {
        const { data: businessesData, error: businessesError } = await supabase
          .from('businesses')
          .select('*')
          .eq('userId', user.id);
        
        if (businessesError) throw businessesError;
        
        setBusinesses(businessesData || []);

        const savedBusinessId = localStorage.getItem('activeBusinessId');
        const currentBusinessId = (businessesData && businessesData.some(b => b.id === savedBusinessId))
          ? savedBusinessId
          : businessesData?.[0]?.id || null;
        
        setActiveBusinessIdState(currentBusinessId);

        if (currentBusinessId) {
          // Fetch all data related to the active business
          const tables = ['suppliers', 'inventory', 'recipes', 'menuItems', 'categories', 'ingredientUnits', 'recipeTemplates', 'purchaseOrders', 'sales'];
          const setters = [setSuppliers, setInventory, setRecipes, setMenuItems, setCategories, setIngredientUnits, setRecipeTemplates, setPurchaseOrders, setSales];
          
          await Promise.all(tables.map(async (table, index) => {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .eq('businessId', currentBusinessId);
            if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
            setters[index](data as any);
          }));
        } else {
          // No business, clear all data
          [setSuppliers, setInventory, setRecipes, setMenuItems, setCategories, setIngredientUnits, setRecipeTemplates, setPurchaseOrders, setSales].forEach(setter => setter([]));
        }
      } catch (err: unknown) {
        console.error("Data fetching error:", err);
        let errorMessage = "An unknown error occurred while loading your data.";

        if (typeof err === 'object' && err !== null) {
            const potentialError = err as { message?: unknown, details?: unknown, hint?: unknown };
            if (typeof potentialError.message === 'string') {
                errorMessage = potentialError.message;
                if (typeof potentialError.details === 'string') {
                    errorMessage += `\n\nDetails: ${potentialError.details}`;
                }
                if (typeof potentialError.hint === 'string') {
                    errorMessage += `\nHint: ${potentialError.hint}`;
                }
            } else {
                try {
                    errorMessage = JSON.stringify(err, null, 2);
                } catch {
                     errorMessage = "An un-stringifiable error object was thrown.";
                }
            }
        } else {
            errorMessage = String(err);
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (error) {
    return (
        <div className="w-screen h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-lg text-center bg-card p-8 rounded-xl shadow-lg border border-border">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <h2 className="mt-4 text-2xl font-bold text-foreground">Failed to Load Data</h2>
                <pre className="mt-2 text-sm text-left text-muted-foreground bg-destructive/10 p-3 rounded-md font-mono overflow-x-auto whitespace-pre-wrap">{error}</pre>
                <div className="mt-4 text-left text-sm text-muted-foreground space-y-2">
                    <p>This can happen for a few reasons:</p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                        <li><strong>Network problem:</strong> Check your internet connection.</li>
                        <li><strong>Configuration issue:</strong> Ensure the Supabase URL and Key are correct.</li>
                        <li><strong>Permissions error:</strong> Check that your Row Level Security (RLS) policies are correctly configured for the 'businesses' table and other tables. Your user may not have permission to read the data.</li>
                    </ul>
                </div>
                 <button 
                    onClick={() => window.location.reload()}
                    className="mt-6 w-full bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>
    );
  }

  const value: DataContextType = {
    loading,
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
    
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    bulkUpdateInventoryItems,
    bulkDeleteInventoryItems,
    bulkAddInventoryItems,

    addRecipe,
    updateRecipe,
    deleteRecipe,
    recordRecipeCostHistory: placeholder,
    duplicateRecipe: placeholder,
    uploadRecipeImage,
    removeRecipeImage,
    bulkAddRecipes: placeholderCounts,

    addMenuItem: placeholder,
    updateMenuItem: placeholder,
    deleteMenuItem: placeholder,

    addCategory,
    updateCategory: placeholder,
    deleteCategory: placeholder,

    addUnit: placeholder,
    updateUnit: placeholder,
    deleteUnit: placeholder,

    addRecipeTemplate: placeholder,

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

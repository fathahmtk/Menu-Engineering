
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { InventoryItem, Recipe, Supplier, MenuItem, Ingredient, Business, RecipeCategory, RecipeTemplate, PurchaseOrder, Sale, SaleItem, IngredientUnit, DataContextType } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './useAuthContext';

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

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select('*')
        .eq('userId', user.id);
      
      if (businessesError) console.error('Error fetching businesses:', businessesError);
      else setBusinesses(businessesData || []);

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
          if (error) console.error(`Error fetching ${table}:`, error);
          else setters[index](data as any);
        }));
      } else {
        // No business, clear all data
        [setSuppliers, setInventory, setRecipes, setMenuItems, setCategories, setIngredientUnits, setRecipeTemplates, setPurchaseOrders, setSales].forEach(setter => setter([]));
      }
      
      setLoading(false);
    };

    fetchData();
  }, [user]);

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
        const updatedIds = new Set(data.map(d => d.id));
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
  const filteredPurchaseOrders = useMemo(() => purchaseOrders.filter(p => p.businessId === activeBusinessId), [purchaseOrders, activeBusinessId]);
  const filteredSales = useMemo(() => sales.filter(s => s.businessId === activeBusinessId), [sales, activeBusinessId]);


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

    addPurchaseOrder: placeholder,
    updatePurchaseOrderStatus: placeholder,
    addSale: placeholder,

    getInventoryItemById,
    getRecipeById,
    getSupplierById,
    calculateRecipeCost,
    getConversionFactor,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

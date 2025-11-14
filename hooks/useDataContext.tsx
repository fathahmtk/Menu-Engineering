import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { InventoryItem, Recipe, Business, RecipeCategory, RecipeTemplate, IngredientUnit, DataContextType, UnitConversion, StaffMember, Overhead, RecipeCostBreakdown, Supplier, MenuItem, PurchaseOrder, Sale, SaleItem, PurchaseOrderItem } from '../types';
import { mockBusinesses, mockInventory, mockRecipes, mockCategories, mockIngredientUnits, mockRecipeTemplates, mockUnitConversions, mockStaffMembers, mockOverheads, mockSuppliers, mockMenuItems, mockPurchaseOrders, mockSales } from './mockData';
import { useAppSettings } from './useAppSettings';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings } = useAppSettings();
  const [loading, setLoading] = useState(false);
  
  const [businesses, setBusinesses] = useState<Business[]>(mockBusinesses);
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [categories, setCategories] = useState<RecipeCategory[]>(mockCategories);
  const [ingredientUnits, setIngredientUnits] = useState<IngredientUnit[]>(mockIngredientUnits);
  const [unitConversions, setUnitConversions] = useState<UnitConversion[]>(mockUnitConversions);
  const [recipeTemplates, setRecipeTemplates] = useState<RecipeTemplate[]>(mockRecipeTemplates);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(mockStaffMembers);
  const [overheads, setOverheads] = useState<Overhead[]>(mockOverheads);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
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
  
  const getConversionFactor = useCallback((fromUnit: string, toUnit: string, itemId: string | null): number | null => {
      const from = fromUnit.toLowerCase();
      const to = toUnit.toLowerCase();
      if (from === to) return 1;

      if(itemId) {
        const specificConversion = unitConversions.find(c => 
          c.itemId === itemId && 
          ((c.fromUnit.toLowerCase() === from && c.toUnit.toLowerCase() === to) || 
           (c.fromUnit.toLowerCase() === to && c.toUnit.toLowerCase() === from))
        );
        if (specificConversion) {
          return specificConversion.fromUnit.toLowerCase() === from ? specificConversion.factor : 1 / specificConversion.factor;
        }
      }

      const genericConversion = unitConversions.find(c =>
        !c.itemId &&
         ((c.fromUnit.toLowerCase() === from && c.toUnit.toLowerCase() === to) || 
           (c.fromUnit.toLowerCase() === to && c.toUnit.toLowerCase() === from))
      );
       if (genericConversion) {
          return genericConversion.fromUnit.toLowerCase() === from ? genericConversion.factor : 1 / genericConversion.factor;
       }
      
      const hardcodedConversions: { [key: string]: { [key: string]: number } } = {
          'kg': { 'g': 1000, 'lb': 2.20462, 'oz': 35.274 },
          'g': { 'kg': 0.001, 'oz': 0.035274 },
          'lb': { 'kg': 0.453592, 'g': 453.592, 'oz': 16 },
          'oz': { 'g': 28.3495, 'kg': 0.02835, 'lb': 0.0625 },
          'l': { 'ml': 1000, 'gal': 0.264172 },
          'ml': { 'l': 0.001 },
          'gal': { 'l': 3.78541 },
          'dozen': { 'unit': 12 }, 'unit': { 'dozen': 1 / 12 },
      };
      
      if (hardcodedConversions[from]?.[to]) return hardcodedConversions[from][to];
      if (hardcodedConversions[to]?.[from]) return 1 / hardcodedConversions[to][from];
      
      return null;
  }, [unitConversions]);
  
const calculateRecipeCost = useCallback((recipe: Recipe | null): number => {
    if (!recipe) return 0;
    
    const visitedRecipes = new Set<string>();

    const calculateCostRecursive = (currentRecipe: Recipe): number => {
      if (visitedRecipes.has(currentRecipe.id)) {
        console.error(`Circular dependency detected in recipe: ${currentRecipe.name}`);
        return 0;
      }
      visitedRecipes.add(currentRecipe.id);

      const total = currentRecipe.ingredients.reduce((total, ingredient) => {
        let ingredientCost = 0;
        
        if (ingredient.type === 'item') {
            const item = getInventoryItemById(ingredient.itemId);
            if (!item) return total;
            
            const costConversionFactor = getConversionFactor(ingredient.unit, item.unit, item.id) || 1;
            
            const trimYieldFactor = (item.yieldPercentage || 100) / 100;
            const prepYieldFactor = (ingredient.yieldPercentage || 100) / 100;
            
            if (trimYieldFactor > 0 && prepYieldFactor > 0) {
                const ediblePortionCost = item.unitCost / trimYieldFactor;
                const requiredQuantity = ingredient.quantity / prepYieldFactor;
                ingredientCost = ediblePortionCost * requiredQuantity * costConversionFactor;
            }
        } else { // type === 'recipe'
            const subRecipe = recipes.find(r => r.id === ingredient.itemId);
            if (!subRecipe || !subRecipe.productionYield || !subRecipe.productionUnit) {
                console.warn(`Sub-recipe "${subRecipe?.name}" is not configured correctly for costing.`);
                return total;
            }

            const subRecipeTotalCost = calculateCostRecursive(subRecipe);
            const costPerProductionUnit = subRecipeTotalCost / subRecipe.productionYield;
            
            const conversionFactor = getConversionFactor(ingredient.unit, subRecipe.productionUnit, null) || 1;
            
            const subRecipeCostInRecipe = costPerProductionUnit * ingredient.quantity * conversionFactor;
            
            const prepYieldFactor = (ingredient.yieldPercentage || 100) / 100;
            ingredientCost = prepYieldFactor > 0 ? subRecipeCostInRecipe / prepYieldFactor : subRecipeCostInRecipe;
        }

        return total + ingredientCost;
      }, 0);

      visitedRecipes.delete(currentRecipe.id);
      return total;
    };
    
    return calculateCostRecursive(recipe);
}, [getInventoryItemById, getConversionFactor, recipes]);

const calculateRecipeCostBreakdown = useCallback((recipe: Recipe | null): RecipeCostBreakdown => {
    const emptyBreakdown: RecipeCostBreakdown = { rawMaterialCost: 0, adjustedRMC: 0, labourCost: 0, variableOverheadCost: 0, fixedOverheadCost: 0, packagingCost: 0, totalCost: 0, costPerServing: 0 };
    if (!recipe) return emptyBreakdown;

    const rawMaterialCost = calculateRecipeCost(recipe);
    const adjustedRMC = rawMaterialCost * (1 + (recipe.wastageFactor || 0) / 100);

    // Labour Cost Calculation
    let labourCost = 0;
    if (recipe.useCustomLabourCost) {
        const days = recipe.customWorkingDays || settings.workingDaysPerMonth;
        const hours = recipe.customWorkingHours || settings.hoursPerDay;
        const salary = recipe.customLabourSalary || 0;
        const customMinutes = days * hours * 60;
        const customCostPerMinute = customMinutes > 0 ? salary / customMinutes : 0;
        labourCost = customCostPerMinute * (recipe.labourMinutes || 0) * recipe.servings;
    } else {
        const filteredStaff = staffMembers.filter(s => s.businessId === activeBusinessId);
        const totalSalary = filteredStaff.reduce((sum, staff) => sum + staff.monthlySalary, 0);
        const workingMinutes = settings.workingDaysPerMonth * settings.hoursPerDay * 60;
        const costPerMinute = workingMinutes > 0 ? totalSalary / workingMinutes : 0;
        labourCost = costPerMinute * (recipe.labourMinutes || 0) * recipe.servings;
    }
    
    const filteredOverheads = overheads.filter(o => o.businessId === activeBusinessId);
    const totalVOH = filteredOverheads.filter(o => o.type === 'Variable').reduce((sum, o) => sum + o.monthlyCost, 0);
    const totalFOH = filteredOverheads.filter(o => o.type === 'Fixed').reduce((sum, o) => sum + o.monthlyCost, 0);
    
    const VOH_per_dish = (settings.totalDishesProduced || 1) > 0 ? totalVOH / settings.totalDishesProduced : 0;
    const FOH_per_dish = (settings.totalDishesSold || 1) > 0 ? totalFOH / settings.totalDishesSold : 0;

    const variableOverheadCost = VOH_per_dish * recipe.servings;
    const fixedOverheadCost = FOH_per_dish * recipe.servings;
    const packagingCost = (recipe.packagingCostPerServing || 0) * recipe.servings;
    const totalCost = adjustedRMC + labourCost + variableOverheadCost + fixedOverheadCost + packagingCost;

    return {
        rawMaterialCost,
        adjustedRMC,
        labourCost,
        variableOverheadCost,
        fixedOverheadCost,
        packagingCost,
        totalCost,
        costPerServing: totalCost / (recipe.servings || 1)
    };
}, [calculateRecipeCost, staffMembers, overheads, settings, activeBusinessId]);


  const filteredInventory = useMemo(() => inventory.filter(i => i.businessId === activeBusinessId), [inventory, activeBusinessId]);
  const filteredRecipes = useMemo(() => recipes.filter(r => r.businessId === activeBusinessId), [recipes, activeBusinessId]);
  const filteredCategories = useMemo(() => categories.filter(c => c.businessId === activeBusinessId), [categories, activeBusinessId]);
  const filteredIngredientUnits = useMemo(() => ingredientUnits.filter(u => u.businessId === activeBusinessId), [ingredientUnits, activeBusinessId]);
  const filteredUnitConversions = useMemo(() => unitConversions.filter(uc => uc.businessId === activeBusinessId), [unitConversions, activeBusinessId]);
  const filteredRecipeTemplates = useMemo(() => recipeTemplates.filter(t => t.businessId === activeBusinessId), [recipeTemplates, activeBusinessId]);
  const filteredStaffMembers = useMemo(() => staffMembers.filter(s => s.businessId === activeBusinessId), [staffMembers, activeBusinessId]);
  const filteredOverheads = useMemo(() => overheads.filter(o => o.businessId === activeBusinessId), [overheads, activeBusinessId]);
  const filteredSuppliers = useMemo(() => suppliers.filter(s => s.businessId === activeBusinessId), [suppliers, activeBusinessId]);
  const filteredMenuItems = useMemo(() => menuItems.filter(m => m.businessId === activeBusinessId), [menuItems, activeBusinessId]);
  const filteredPurchaseOrders = useMemo(() => purchaseOrders.filter(p => p.businessId === activeBusinessId), [purchaseOrders, activeBusinessId]);
  const filteredSales = useMemo(() => sales.filter(s => s.businessId === activeBusinessId), [sales, activeBusinessId]);

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
    
  const bulkUpdateInventoryItems = async (itemIds: string[], update: Partial<Pick<InventoryItem, 'unitCost' | 'unitPrice'>>) => {
    setInventory(prev => prev.map(item => itemIds.includes(item.id) ? { ...item, ...update } : item));
  };

  const bulkDeleteInventoryItems = async (itemIds: string[]) => {
    const failedItems: string[] = [];
    const itemIdsSet = new Set(itemIds);
    
    const usedItemIds = new Set<string>();
    recipes.forEach(recipe => recipe.ingredients.forEach(ingredient => {
        if (ingredient.type === 'item' && itemIdsSet.has(ingredient.itemId)) usedItemIds.add(ingredient.itemId);
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
      await addCategory(recipe.category);
      const newRecipe = { ...recipe, id: crypto.randomUUID(), businessId: activeBusinessId };
      setRecipes(prev => [...prev, newRecipe]);
  };
  const updateRecipe = async (recipe: Recipe) => {
      setRecipes(prev => prev.map(r => r.id === recipe.id ? recipe : r));
  };
  const deleteRecipe = async (id: string) => {
      const isUsedAsSubRecipe = recipes.some(r => r.ingredients.some(i => i.type === 'recipe' && i.itemId === id));
      if (isUsedAsSubRecipe) return { success: false, message: 'Cannot delete recipe. It is being used as a sub-recipe in another recipe.' };

      setRecipes(prev => prev.filter(r => r.id !== id));
      return { success: true };
  };
  
  const recordRecipeCostHistory = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const { totalCost } = calculateRecipeCostBreakdown(recipe);
    const lastCostEntry = recipe.costHistory?.[recipe.costHistory.length - 1];

    if (!lastCostEntry || Math.abs(lastCostEntry.cost - totalCost) > 0.01) { 
        const newHistoryEntry = { date: new Date().toISOString(), cost: totalCost };
        const newHistory = [...(recipe.costHistory || []), newHistoryEntry];
        
        setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, costHistory: newHistory } : r));
    }
  };

  const duplicateRecipe = async (id: string, includeHistory: boolean): Promise<Recipe | undefined> => {
    const recipeToDuplicate = recipes.find(r => r.id === id);
    if (!recipeToDuplicate) return undefined;
    
    const { totalCost } = calculateRecipeCostBreakdown(recipeToDuplicate);
    const newRecipe: Recipe = {
        ...recipeToDuplicate,
        id: crypto.randomUUID(),
        name: `${recipeToDuplicate.name} (Copy)`,
        costHistory: includeHistory ? [...(recipeToDuplicate.costHistory || [])] : [{ date: new Date().toISOString(), cost: totalCost }],
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
      costHistory: [{ date: new Date().toISOString(), cost: calculateRecipeCostBreakdown(r as Recipe).totalCost }]
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
  
  const addUnitConversion = async (conversion: Omit<UnitConversion, 'id' | 'businessId'>) => {
    if(!activeBusinessId) return;
    const newConversion = { ...conversion, id: crypto.randomUUID(), businessId: activeBusinessId };
    setUnitConversions(prev => [...prev, newConversion]);
  };

  const updateUnitConversion = async (conversion: UnitConversion) => {
    setUnitConversions(prev => prev.map(uc => uc.id === conversion.id ? conversion : uc));
  };

  const deleteUnitConversion = async (id: string) => {
    setUnitConversions(prev => prev.filter(uc => uc.id !== id));
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
  
  const addStaffMember = async (staff: Omit<StaffMember, 'id' | 'businessId'>) => {
    if(!activeBusinessId) return;
    const newStaff = { ...staff, id: crypto.randomUUID(), businessId: activeBusinessId };
    setStaffMembers(prev => [...prev, newStaff]);
  };
  const updateStaffMember = async (staff: StaffMember) => {
    setStaffMembers(prev => prev.map(s => s.id === staff.id ? staff : s));
  };
  const deleteStaffMember = async (id: string) => {
    setStaffMembers(prev => prev.filter(s => s.id !== id));
  };

  const addOverhead = async (overhead: Omit<Overhead, 'id' | 'businessId'>) => {
    if(!activeBusinessId) return;
    const newOverhead = { ...overhead, id: crypto.randomUUID(), businessId: activeBusinessId };
    setOverheads(prev => [...prev, newOverhead]);
  };
  const updateOverhead = async (overhead: Overhead) => {
    setOverheads(prev => prev.map(o => o.id === overhead.id ? overhead : o));
  };
  const deleteOverhead = async (id: string) => {
    setOverheads(prev => prev.filter(o => o.id !== id));
  };

  const getSupplierById = useCallback((id: string) => suppliers.find(s => s.id === id), [suppliers]);
  
  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'businessId'>) => {
    if(!activeBusinessId) return;
    const newSupplier: Supplier = { ...supplier, id: crypto.randomUUID(), businessId: activeBusinessId };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const updateSupplier = async (supplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
  };

  const deleteSupplier = async (id: string) => {
    if (purchaseOrders.some(po => po.supplierId === id)) {
        return { success: false, message: 'Cannot delete supplier. They are associated with one or more purchase orders.'};
    }
    setSuppliers(prev => prev.filter(s => s.id !== id));
    return { success: true };
  };

  const bulkAddSuppliers = async (newSuppliers: Omit<Supplier, 'id'|'businessId'>[]) => {
    if (!activeBusinessId) return { successCount: 0, duplicateCount: 0 };
    const existingNames = new Set(suppliers.map(s => s.name.toLowerCase()));
    const toAdd = newSuppliers.filter(s => !existingNames.has(s.name.toLowerCase()));
    const duplicateCount = newSuppliers.length - toAdd.length;

    if (toAdd.length === 0) return { successCount: 0, duplicateCount };
    
    const data = toAdd.map(s => ({ ...s, id: crypto.randomUUID(), businessId: activeBusinessId }));
    setSuppliers(prev => [...prev, ...data]);
    return { successCount: data.length, duplicateCount };
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'businessId'>) => {
      if(!activeBusinessId) return;
      const newItem = { ...item, id: crypto.randomUUID(), businessId: activeBusinessId };
      setMenuItems(prev => [...prev, newItem]);
  };
  const updateMenuItem = async (item: MenuItem) => {
      setMenuItems(prev => prev.map(m => m.id === item.id ? item : m));
  };
  const deleteMenuItem = async (id: string) => {
      setMenuItems(prev => prev.filter(m => m.id !== id));
  };

  const addPurchaseOrder = async (order: Omit<PurchaseOrder, 'id' | 'businessId' | 'poNumber' | 'orderDate' | 'totalCost' | 'status'>) => {
    if(!activeBusinessId) return;
    const totalCost = order.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    const newOrder: PurchaseOrder = {
        ...order,
        id: crypto.randomUUID(),
        businessId: activeBusinessId,
        poNumber: `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
        orderDate: new Date().toISOString(),
        totalCost,
        status: 'Pending',
    };
    setPurchaseOrders(prev => [...prev, newOrder]);
  };
  const updatePurchaseOrderStatus = async (id: string, status: PurchaseOrder['status']) => {
    setPurchaseOrders(prev => prev.map(order => {
        if (order.id === id) {
            const updatedOrder = { ...order, status, completionDate: status === 'Completed' ? new Date().toISOString() : undefined };
            if (status === 'Completed') {
                // Update inventory
                setInventory(currentInventory => {
                    const newInventory = [...currentInventory];
                    updatedOrder.items.forEach(orderItem => {
                        const invIndex = newInventory.findIndex(invItem => invItem.id === orderItem.itemId);
                        if(invIndex > -1) {
                            newInventory[invIndex].quantity += orderItem.quantity;
                        }
                    });
                    return newInventory;
                });
            }
            return updatedOrder;
        }
        return order;
    }));
  };

  const addSale = async (items: { menuItemId: string; quantity: number }[]) => {
      if(!activeBusinessId) return;
      
      const saleItems: SaleItem[] = [];
      let totalRevenue = 0;
      let totalProfit = 0;

      for (const item of items) {
          const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
          if (!menuItem) continue;
          
          const recipe = recipes.find(r => r.id === menuItem.recipeId);
          const { costPerServing } = calculateRecipeCostBreakdown(recipe);

          const revenue = menuItem.salePrice * item.quantity;
          const cost = costPerServing * item.quantity;
          
          totalRevenue += revenue;
          totalProfit += (revenue - cost);

          saleItems.push({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              salePriceAtTime: menuItem.salePrice,
              costAtTime: costPerServing
          });

          // Also update total sales count on menu item
          setMenuItems(prev => prev.map(mi => mi.id === item.menuItemId ? { ...mi, salesCount: mi.salesCount + item.quantity } : mi));
      }

      const newSale: Sale = {
          id: crypto.randomUUID(),
          saleDate: new Date().toISOString(),
          items: saleItems,
          totalRevenue,
          totalProfit,
          businessId: activeBusinessId
      };
      setSales(prev => [...prev, newSale]);
  };


  const value: DataContextType = {
    loading,
    businesses,
    activeBusinessId,
    setActiveBusinessId,
    addBusiness,
    updateBusiness,
    
    inventory: filteredInventory,
    recipes: filteredRecipes,
    categories: filteredCategories,
    ingredientUnits: filteredIngredientUnits,
    unitConversions: filteredUnitConversions,
    recipeTemplates: filteredRecipeTemplates,
    staffMembers: filteredStaffMembers,
    overheads: filteredOverheads,
    suppliers: filteredSuppliers,
    menuItems: filteredMenuItems,
    purchaseOrders: filteredPurchaseOrders,
    sales: filteredSales,
    
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

    addCategory,
    updateCategory,
    deleteCategory,

    addUnit,
    updateUnit,
    deleteUnit,

    addUnitConversion,
    updateUnitConversion,
    deleteUnitConversion,

    addRecipeTemplate,

    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    addOverhead,
    updateOverhead,
    deleteOverhead,

    addSupplier,
    updateSupplier,
    deleteSupplier,
    bulkAddSuppliers,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addPurchaseOrder,
    updatePurchaseOrderStatus,
    addSale,

    getInventoryItemById,
    getRecipeById,
    getSupplierById,
    calculateRecipeCost,
    calculateRecipeCostBreakdown,
    getConversionFactor,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
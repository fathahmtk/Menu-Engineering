import { Business, PricedItem, Recipe, RecipeCategory, IngredientUnit, RecipeTemplate, UnitConversion, StaffMember, Overhead, Supplier, MenuItem } from '../types';

const MOCK_BUSINESS_ID = 'b1';

export const mockBusinesses: Business[] = [
    { id: MOCK_BUSINESS_ID, name: 'iCAN Group - Qatar Division', userId: 'mock-user-id', address: '', contactPhone: '', taxId: '' }
];

export const mockPricedItems: PricedItem[] = [
    { id: 'i1', name: 'Chicken Breast (Halal)', category: 'Meat', unit: 'kg', unitCost: 18, businessId: MOCK_BUSINESS_ID },
    { id: 'i2', name: 'Lamb Mince (Halal)', category: 'Meat', unit: 'kg', unitCost: 35, businessId: MOCK_BUSINESS_ID },
    { id: 'i3', name: 'Samosa Pastry Sheets', category: 'Pantry', unit: 'box', unitCost: 40, businessId: MOCK_BUSINESS_ID },
    { id: 'i4', name: 'Mixed Vegetables (Peas, Carrots, Corn)', category: 'Produce', unit: 'kg', unitCost: 5, businessId: MOCK_BUSINESS_ID },
    { id: 'i5', name: 'Cumin Powder', category: 'Pantry', unit: 'kg', unitCost: 25, businessId: MOCK_BUSINESS_ID },
    { id: 'i6', name: 'Onions', category: 'Produce', unit: 'kg', unitCost: 2, businessId: MOCK_BUSINESS_ID },
    { id: 'i7', name: 'Printed Cardboard Boxes (Small)', category: 'Pantry', unit: 'unit', unitCost: 0.75, businessId: MOCK_BUSINESS_ID },
    { id: 'i8', name: 'Breadcrumbs', category: 'Pantry', unit: 'kg', unitCost: 10, businessId: MOCK_BUSINESS_ID },
];

export const mockRecipes: Recipe[] = [
    { 
        id: 'r4',
        name: 'Samosa Filling (Batch)',
        category: 'Sub-Recipes',
        ingredients: [
             { id: crypto.randomUUID(), type: 'item', itemId: 'i1', quantity: 10, unit: 'kg', yieldPercentage: 98 },
             { id: crypto.randomUUID(), type: 'item', itemId: 'i6', quantity: 5, unit: 'kg', yieldPercentage: 95 },
             { id: crypto.randomUUID(), type: 'item', itemId: 'i5', quantity: 0.5, unit: 'kg' },
        ],
        servings: 1,
        instructions: ['Cook chicken and onions with spices.', 'Let filling cool.'],
        businessId: MOCK_BUSINESS_ID,
        productionYield: 14,
        productionUnit: 'kg',
        labourMinutes: 60,
        packagingCostPerServing: 0,
        labourCostMethod: 'blended',
    },
    { 
        id: 'r1', 
        name: 'Chicken Samosas (Production Batch)', 
        category: 'Frozen Snacks', 
        ingredients: [
            { id: crypto.randomUUID(), type: 'recipe', itemId: 'r4', quantity: 14, unit: 'kg' },
            { id: crypto.randomUUID(), type: 'item', itemId: 'i3', quantity: 5, unit: 'box' },
        ],
        servings: 500,
        instructions: ['Fold filling into samosa pastry sheets.', 'Flash freeze.', 'Package for sale.'],
        costHistory: [{ date: new Date().toISOString(), cost: 402.5 }],
        businessId: MOCK_BUSINESS_ID,
        labourMinutes: 0.5,
        packagingCostPerServing: 0.05,
        labourCostMethod: 'custom',
        customLabourSalary: 2800,
        customWorkingDays: 24,
        customWorkingHours: 9,
    },
    { 
        id: 'r2', 
        name: 'Lamb Kebabs (Production Batch)', 
        category: 'Frozen Meats', 
        ingredients: [
            { id: crypto.randomUUID(), type: 'item', itemId: 'i2', quantity: 20, unit: 'kg', yieldPercentage: 96 },
            { id: crypto.randomUUID(), type: 'item', itemId: 'i5', quantity: 1, unit: 'kg' },
            { id: crypto.randomUUID(), type: 'item', itemId: 'i6', quantity: 4, unit: 'kg' },
        ], 
        servings: 20,
        instructions: ['Mix lamb mince with spices and minced onions.', 'Form into kebab shapes.', 'Package into 1kg trays.', 'Flash freeze.'],
        costHistory: [{ date: new Date().toISOString(), cost: 733 }],
        businessId: MOCK_BUSINESS_ID,
        labourMinutes: 5,
        packagingCostPerServing: 0.40,
        labourCostMethod: 'blended',
    },
     { 
        id: 'r3', 
        name: 'Chicken Nuggets (Production Batch)', 
        category: 'Frozen Snacks', 
        ingredients: [
            { id: crypto.randomUUID(), type: 'item', itemId: 'i1', quantity: 15, unit: 'kg' },
            { id: crypto.randomUUID(), type: 'item', itemId: 'i8', quantity: 5, unit: 'kg' },
        ], 
        servings: 30,
        instructions: ['Cut chicken into nugget shapes.', 'Coat with breadcrumbs.', 'Flash freeze.', 'Package into 500g bags.'],
        costHistory: [{ date: new Date().toISOString(), cost: 320 }],
        businessId: MOCK_BUSINESS_ID,
        labourMinutes: 3,
        packagingCostPerServing: 0.25,
        labourCostMethod: 'staff',
        assignedStaffId: 'staff1',
    },
];

export const mockCategories: RecipeCategory[] = [
    { id: 'c1', name: 'Frozen Snacks', businessId: MOCK_BUSINESS_ID },
    { id: 'c2', name: 'Frozen Meats', businessId: MOCK_BUSINESS_ID },
    { id: 'c3', name: 'Ready Meals', businessId: MOCK_BUSINESS_ID },
    { id: 'c4', name: 'Sub-Recipes', businessId: MOCK_BUSINESS_ID },
];

export const mockIngredientUnits: IngredientUnit[] = [
    { id: 'u1', name: 'box', businessId: MOCK_BUSINESS_ID }
];

export const mockUnitConversions: UnitConversion[] = [
    { id: 'uc1', fromUnit: 'box', toUnit: 'unit', factor: 100, itemId: 'i3', businessId: MOCK_BUSINESS_ID },
    { id: 'uc2', fromUnit: 'kg', toUnit: 'g', factor: 1000, businessId: MOCK_BUSINESS_ID },
    { id: 'uc3', fromUnit: 'L', toUnit: 'ml', factor: 1000, businessId: MOCK_BUSINESS_ID },
];

export const mockRecipeTemplates: RecipeTemplate[] = [];

export const mockStaffMembers: StaffMember[] = [
    { id: 'staff1', name: 'Head Chef', monthlySalary: 5000, businessId: MOCK_BUSINESS_ID },
    { id: 'staff2', name: 'Kitchen Assistant 1', monthlySalary: 2400, businessId: MOCK_BUSINESS_ID },
    { id: 'staff3', name: 'Kitchen Assistant 2', monthlySalary: 2400, businessId: MOCK_BUSINESS_ID },
];

export const mockOverheads: Overhead[] = [
    { id: 'ov1', name: 'Kitchen Rent', type: 'Fixed', monthlyCost: 8000, businessId: MOCK_BUSINESS_ID },
    { id: 'ov2', name: 'Admin Salaries', type: 'Fixed', monthlyCost: 6000, businessId: MOCK_BUSINESS_ID },
    { id: 'ov3', name: 'Cooking Gas', type: 'Variable', monthlyCost: 1500, businessId: MOCK_BUSINESS_ID },
    { id: 'ov4', name: 'Utilities (Water/Elec)', type: 'Variable', monthlyCost: 2000, businessId: MOCK_BUSINESS_ID },
];

export const mockSuppliers: Supplier[] = [
    { id: 's1', name: 'Global Food Supplies', contactPerson: 'John Doe', phone: '+974 1111 2222', email: 'john@gfs.com', businessId: MOCK_BUSINESS_ID },
    { id: 's2', name: 'Fresh Produce Qatar', contactPerson: 'Fatima Ahmed', phone: '+974 3333 4444', email: 'fatima@fpq.com', businessId: MOCK_BUSINESS_ID },
];

export const mockMenuItems: MenuItem[] = [
    { id: 'm1', name: 'Chicken Samosas (12 pcs)', recipeId: 'r1', salePrice: 15, salesCount: 1250, businessId: MOCK_BUSINESS_ID },
    { id: 'm2', name: 'Lamb Kebabs (1kg Pack)', recipeId: 'r2', salePrice: 45, salesCount: 800, businessId: MOCK_BUSINESS_ID },
    { id: 'm3', name: 'Chicken Nuggets (500g Pack)', recipeId: 'r3', salePrice: 12, salesCount: 1500, businessId: MOCK_BUSINESS_ID },
];
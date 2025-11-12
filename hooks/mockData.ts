import { Business, Supplier, InventoryItem, Recipe, MenuItem, RecipeCategory, IngredientUnit, PurchaseOrder, Sale, RecipeTemplate } from '../types';

const MOCK_BUSINESS_ID = 'b1';

// Updated Business Name
export const mockBusinesses: Business[] = [
    { id: MOCK_BUSINESS_ID, name: 'Qatar Frozen Foods Co.', userId: 'mock-user-id' }
];

// Qatar-based Suppliers for a frozen food production company
export const mockSuppliers: Supplier[] = [
    { id: 's1', name: 'Gulf Food Imports', contactPerson: 'Ahmed Al-Kuwari', phone: '+974 4455 6677', email: 'ahmed@gfi.qa', businessId: MOCK_BUSINESS_ID },
    { id: 's2', name: 'Qatar Packaging Solutions', contactPerson: 'Fatima Al-Mansoori', phone: '+974 4422 3344', email: 'sales@qpack.qa', businessId: MOCK_BUSINESS_ID },
    { id: 's3', name: 'Doha Spice Market', contactPerson: 'Hassan Mahmoud', phone: '+974 5588 9900', email: 'orders@dohaspice.com', businessId: MOCK_BUSINESS_ID },
    { id: 's4', name: 'Al Wakra Poultry', contactPerson: 'Khalid Al-Thani', phone: '+974 4477 8899', email: 'sales@alwakrapoultry.qa', businessId: MOCK_BUSINESS_ID }
];

// Inventory relevant to frozen food production
export const mockInventory: InventoryItem[] = [
    { id: 'i1', name: 'Chicken Breast (Halal)', category: 'Meat', quantity: 250, unit: 'kg', unitCost: 18, unitPrice: 35, supplierId: 's4', lowStockThreshold: 50, businessId: MOCK_BUSINESS_ID },
    { id: 'i2', name: 'Lamb Mince (Halal)', category: 'Meat', quantity: 150, unit: 'kg', unitCost: 35, unitPrice: 60, supplierId: 's1', lowStockThreshold: 30, businessId: MOCK_BUSINESS_ID },
    { id: 'i3', name: 'Samosa Pastry Sheets', category: 'Pantry', quantity: 100, unit: 'box', unitCost: 40, unitPrice: 70, supplierId: 's1', lowStockThreshold: 20, businessId: MOCK_BUSINESS_ID }, // Assume a box has 100 sheets
    { id: 'i4', name: 'Mixed Vegetables (Peas, Carrots, Corn)', category: 'Produce', quantity: 200, unit: 'kg', unitCost: 5, unitPrice: 10, supplierId: 's1', lowStockThreshold: 40, businessId: MOCK_BUSINESS_ID },
    { id: 'i5', name: 'Cumin Powder', category: 'Pantry', quantity: 20, unit: 'kg', unitCost: 25, unitPrice: 45, supplierId: 's3', lowStockThreshold: 5, businessId: MOCK_BUSINESS_ID },
    { id: 'i6', name: 'Onions', category: 'Produce', quantity: 80, unit: 'kg', unitCost: 2, unitPrice: 4, supplierId: 's1', lowStockThreshold: 10, businessId: MOCK_BUSINESS_ID },
    { id: 'i7', name: 'Printed Cardboard Boxes (Small)', category: 'Pantry', quantity: 2000, unit: 'unit', unitCost: 0.75, unitPrice: 1.5, supplierId: 's2', lowStockThreshold: 500, businessId: MOCK_BUSINESS_ID },
    { id: 'i8', name: 'Breadcrumbs', category: 'Pantry', quantity: 50, unit: 'kg', unitCost: 10, unitPrice: 20, supplierId: 's1', lowStockThreshold: 10, businessId: MOCK_BUSINESS_ID },
];

// Recipes for frozen products
export const mockRecipes: Recipe[] = [
    { 
        id: 'r1', 
        name: 'Chicken Samosas (Production Batch)', 
        category: 'Frozen Snacks', 
        ingredients: [
            { itemId: 'i1', quantity: 10, unit: 'kg' },  // Chicken Breast
            { itemId: 'i6', quantity: 5, unit: 'kg' },   // Onions
            { itemId: 'i5', quantity: 0.5, unit: 'kg' }, // Cumin Powder
            { itemId: 'i3', quantity: 5, unit: 'box' },  // Samosa Pastry (5 boxes of 100 = 500 sheets)
        ],
        servings: 500, // Makes 500 individual samosas
        instructions: ['Cook chicken and onions with spices.', 'Let filling cool.', 'Fold filling into samosa pastry sheets.', 'Flash freeze.', 'Package for sale.'],
        costHistory: [{ date: new Date().toISOString(), cost: 402.5 }],
        businessId: MOCK_BUSINESS_ID 
    },
    { 
        id: 'r2', 
        name: 'Lamb Kebabs (Production Batch)', 
        category: 'Frozen Meats', 
        ingredients: [
            { itemId: 'i2', quantity: 20, unit: 'kg' }, // Lamb Mince
            { itemId: 'i5', quantity: 1, unit: 'kg' },  // Cumin Powder
            { itemId: 'i6', quantity: 4, unit: 'kg' },  // Onions
        ], 
        servings: 20, // Makes 20 packs of 1kg
        instructions: ['Mix lamb mince with spices and minced onions.', 'Form into kebab shapes.', 'Package into 1kg trays.', 'Flash freeze.'],
        costHistory: [{ date: new Date().toISOString(), cost: 733 }],
        businessId: MOCK_BUSINESS_ID 
    },
     { 
        id: 'r3', 
        name: 'Chicken Nuggets (Production Batch)', 
        category: 'Frozen Snacks', 
        ingredients: [
            { itemId: 'i1', quantity: 15, unit: 'kg' }, // Chicken Breast
            { itemId: 'i8', quantity: 5, unit: 'kg' },  // Breadcrumbs
        ], 
        servings: 30, // Makes 30 packs of 500g
        instructions: ['Cut chicken into nugget shapes.', 'Coat with breadcrumbs.', 'Flash freeze.', 'Package into 500g bags.'],
        costHistory: [{ date: new Date().toISOString(), cost: 320 }],
        businessId: MOCK_BUSINESS_ID 
    },
];

// Final products for sale
export const mockMenuItems: MenuItem[] = [
    { id: 'm1', name: 'Frozen Chicken Samosas (Pack of 20)', recipeId: 'r1', salePrice: 25.00, salesCount: 320, businessId: MOCK_BUSINESS_ID },
    { id: 'm2', name: 'Frozen Lamb Kebabs (1kg Pack)', recipeId: 'r2', salePrice: 55.00, salesCount: 180, businessId: MOCK_BUSINESS_ID },
    { id: 'm3', name: 'Ready-to-Cook Chicken Nuggets (500g)', recipeId: 'r3', salePrice: 22.00, salesCount: 450, businessId: MOCK_BUSINESS_ID },
];

// Relevant categories
export const mockCategories: RecipeCategory[] = [
    { id: 'c1', name: 'Frozen Snacks', businessId: MOCK_BUSINESS_ID },
    { id: 'c2', name: 'Frozen Meats', businessId: MOCK_BUSINESS_ID },
    { id: 'c3', name: 'Ready Meals', businessId: MOCK_BUSINESS_ID }
];

export const mockIngredientUnits: IngredientUnit[] = [
    { id: 'u1', name: 'box', businessId: MOCK_BUSINESS_ID }
];

export const mockRecipeTemplates: RecipeTemplate[] = [];

// Updated POs
export const mockPurchaseOrders: PurchaseOrder[] = [
    {
        id: 'po1',
        supplierId: 's4',
        items: [{ itemId: 'i1', quantity: 100, cost: 18 }],
        status: 'Completed',
        orderDate: new Date('2024-05-20').toISOString(),
        completionDate: new Date('2024-05-22').toISOString(),
        totalCost: 1800,
        businessId: MOCK_BUSINESS_ID,
    },
    {
        id: 'po2',
        supplierId: 's2',
        items: [{ itemId: 'i7', quantity: 1000, cost: 0.75 }],
        status: 'Pending',
        orderDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        totalCost: 750,
        businessId: MOCK_BUSINESS_ID,
    }
];

// Updated Sales
export const mockSales: Sale[] = [
    {
        id: 'sale1',
        items: [{ menuItemId: 'm3', quantity: 50, salePrice: 22.00, cost: 10.67 }],
        saleDate: new Date('2024-05-28T14:00:00Z').toISOString(),
        totalRevenue: 1100,
        totalCost: 533.5,
        totalProfit: 566.5,
        businessId: MOCK_BUSINESS_ID,
    },
    {
        id: 'sale2',
        items: [
            { menuItemId: 'm1', quantity: 30, salePrice: 25.00, cost: 16.1 },
            { menuItemId: 'm2', quantity: 10, salePrice: 55.00, cost: 36.65 }
        ],
        saleDate: new Date('2024-05-28T12:30:00Z').toISOString(),
        totalRevenue: 1300,
        totalCost: 849.5,
        totalProfit: 450.5,
        businessId: MOCK_BUSINESS_ID,
    }
];
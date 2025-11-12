import { Business, Supplier, InventoryItem, Recipe, MenuItem, RecipeCategory, IngredientUnit, PurchaseOrder, Sale, RecipeTemplate } from '../types';

const MOCK_BUSINESS_ID = 'b1';

export const mockBusinesses: Business[] = [
    { id: MOCK_BUSINESS_ID, name: 'My Restaurant', userId: 'mock-user-id' }
];

export const mockSuppliers: Supplier[] = [
    { id: 's1', name: 'Fresh Produce Co.', contactPerson: 'John Appleseed', phone: '555-1234', email: 'john@fresh.co', businessId: MOCK_BUSINESS_ID },
    { id: 's2', name: 'Meat Masters', contactPerson: 'Jane Doe', phone: '555-5678', email: 'jane@meat.co', businessId: MOCK_BUSINESS_ID }
];

export const mockInventory: InventoryItem[] = [
    { id: 'i1', name: 'Tomatoes', category: 'Produce', quantity: 10, unit: 'kg', unitCost: 2.5, unitPrice: 5, supplierId: 's1', lowStockThreshold: 2, businessId: MOCK_BUSINESS_ID },
    { id: 'i2', name: 'Ground Beef', category: 'Meat', quantity: 15, unit: 'kg', unitCost: 8, unitPrice: 15, supplierId: 's2', lowStockThreshold: 5, businessId: MOCK_BUSINESS_ID },
    { id: 'i3', name: 'Milk', category: 'Dairy', quantity: 12, unit: 'L', unitCost: 1.5, unitPrice: 3, supplierId: 's1', lowStockThreshold: 4, businessId: MOCK_BUSINESS_ID },
    { id: 'i4', name: 'Flour', category: 'Pantry', quantity: 25, unit: 'kg', unitCost: 1, unitPrice: 2, supplierId: 's1', lowStockThreshold: 10, businessId: MOCK_BUSINESS_ID },
];

export const mockRecipes: Recipe[] = [
    { 
        id: 'r1', 
        name: 'Classic Burger', 
        category: 'Main Course', 
        ingredients: [
            { itemId: 'i2', quantity: 0.2, unit: 'kg' },
        ],
        servings: 1, 
        instructions: ['Form patty', 'Grill patty', 'Assemble burger'],
        costHistory: [{ date: new Date().toISOString(), cost: 1.6 }],
        businessId: MOCK_BUSINESS_ID 
    },
    { 
        id: 'r2', 
        name: 'Tomato Soup', 
        category: 'Appetizer', 
        ingredients: [
            { itemId: 'i1', quantity: 0.5, unit: 'kg' },
        ], 
        servings: 4, 
        instructions: ['Chop tomatoes', 'Simmer with herbs', 'Blend until smooth'],
        costHistory: [{ date: new Date().toISOString(), cost: 1.25 }],
        businessId: MOCK_BUSINESS_ID 
    },
];

export const mockMenuItems: MenuItem[] = [
    { id: 'm1', name: 'Cheeseburger', recipeId: 'r1', salePrice: 12.99, salesCount: 150, businessId: MOCK_BUSINESS_ID },
    { id: 'm2', name: 'Creamy Tomato Soup', recipeId: 'r2', salePrice: 6.50, salesCount: 80, businessId: MOCK_BUSINESS_ID },
];

export const mockCategories: RecipeCategory[] = [
    { id: 'c1', name: 'Main Course', businessId: MOCK_BUSINESS_ID },
    { id: 'c2', name: 'Appetizer', businessId: MOCK_BUSINESS_ID }
];

export const mockIngredientUnits: IngredientUnit[] = [
    { id: 'u1', name: 'pinch', businessId: MOCK_BUSINESS_ID }
];

export const mockRecipeTemplates: RecipeTemplate[] = [];

export const mockPurchaseOrders: PurchaseOrder[] = [
    {
        id: 'po1',
        supplierId: 's1',
        items: [{ itemId: 'i1', quantity: 5, cost: 2.5 }],
        status: 'Completed',
        orderDate: new Date('2024-05-20').toISOString(),
        completionDate: new Date('2024-05-22').toISOString(),
        totalCost: 12.5,
        businessId: MOCK_BUSINESS_ID,
    },
    {
        id: 'po2',
        supplierId: 's2',
        items: [{ itemId: 'i2', quantity: 10, cost: 8 }],
        status: 'Pending',
        orderDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        totalCost: 80,
        businessId: MOCK_BUSINESS_ID,
    }
];

export const mockSales: Sale[] = [
    {
        id: 'sale1',
        items: [{ menuItemId: 'm1', quantity: 2, salePrice: 12.99, cost: 1.6 }],
        saleDate: new Date('2024-05-28T14:00:00Z').toISOString(),
        totalRevenue: 25.98,
        totalCost: 3.2,
        totalProfit: 22.78,
        businessId: MOCK_BUSINESS_ID,
    },
    {
        id: 'sale2',
        items: [{ menuItemId: 'm2', quantity: 1, salePrice: 6.50, cost: 0.31 }],
        saleDate: new Date('2024-05-28T12:30:00Z').toISOString(),
        totalRevenue: 6.50,
        totalCost: 0.31,
        totalProfit: 6.19,
        businessId: MOCK_BUSINESS_ID,
    }
];

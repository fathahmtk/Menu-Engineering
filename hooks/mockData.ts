
import { Business, Supplier, InventoryItem, Recipe, MenuItem, RecipeCategory, RecipeTemplate, PurchaseOrder, Sale } from '../types';

export const initialBusinesses: Business[] = [
  { id: 'biz1', name: 'Main Restaurant' },
  { id: 'biz2', name: 'Corner Cafe' },
];

export const initialSuppliers: Supplier[] = [
  { id: 'sup1', name: 'Al Thuraya Food Industries', contactPerson: 'Nasser Al-Khater', phone: '+974 4412 3456', email: 'sales@althurayafoods.qa', businessId: 'biz1' },
  { id: 'sup2', name: 'Hotbake Catering Supplies', contactPerson: 'Fatima Al-Jaber', phone: '+974 4488 7766', email: 'orders@hotbakeqatar.com', businessId: 'biz1' },
  { id: 'sup3', name: 'Qatar Fresh Produce', contactPerson: 'Ahmed Hassan', phone: '+974 4455 9900', email: 'info@qatarfresh.qa', businessId: 'biz1' },
  { id: 'sup4', name: 'Qatar Fisheries Co.', contactPerson: 'Ali Al-Marri', phone: '+974 4469 1122', email: 'procurement@qatarfish.qa', businessId: 'biz1' },
  { id: 'sup5', name: 'Cafe Beans Emporium', contactPerson: 'Khalid Mohammed', phone: '+974 4433 2211', email: 'beans@emporium.qa', businessId: 'biz2' },
  { id: 'sup6', name: 'Doha Pastries & Co.', contactPerson: 'Aisha Al-Baker', phone: '+974 4477 8899', email: 'sales@dohapastries.com', businessId: 'biz2' },
];

export const initialInventory: InventoryItem[] = [
  // Biz 1: Main Restaurant
  { id: 'inv1', name: 'Lamb Shoulder', category: 'Meat', quantity: 50, unit: 'kg', unitCost: 48, unitPrice: 58, supplierId: 'sup1', lowStockThreshold: 10, businessId: 'biz1' },
  { id: 'inv2', name: 'Chicken Breast', category: 'Meat', quantity: 80, unit: 'kg', unitCost: 26, unitPrice: 32, supplierId: 'sup1', lowStockThreshold: 20, businessId: 'biz1' },
  { id: 'inv3', name: 'Basmati Rice', category: 'Pantry', quantity: 200, unit: 'kg', unitCost: 16, unitPrice: 21, supplierId: 'sup1', lowStockThreshold: 50, businessId: 'biz1' },
  { id: 'inv4', name: 'Pita Bread (Large)', category: 'Bakery', quantity: 20, unit: 'dozen', unitCost: 12, unitPrice: 15, supplierId: 'sup2', lowStockThreshold: 5, businessId: 'biz1' },
  { id: 'inv6', name: 'Saffron Threads', category: 'Pantry', quantity: 100, unit: 'g', unitCost: 28, unitPrice: 35, supplierId: 'sup1', lowStockThreshold: 20, businessId: 'biz1' },
  { id: 'inv8', name: 'Plain Yogurt', category: 'Dairy', quantity: 10, unit: 'L', unitCost: 8, unitPrice: 10, supplierId: 'sup1', lowStockThreshold: 3, businessId: 'biz1' },
  { id: 'inv10', name: 'Tomatoes', category: 'Produce', quantity: 30, unit: 'kg', unitCost: 6, unitPrice: 8, supplierId: 'sup3', lowStockThreshold: 10, businessId: 'biz1' },
  { id: 'inv13', name: 'Hammour Fish (Whole)', category: 'Seafood', quantity: 25, unit: 'kg', unitCost: 55, unitPrice: 65, supplierId: 'sup4', lowStockThreshold: 5, businessId: 'biz1' },
  { id: 'inv14', name: 'Beef Cubes', category: 'Meat', quantity: 40, unit: 'kg', unitCost: 42, unitPrice: 50, supplierId: 'sup1', lowStockThreshold: 10, businessId: 'biz1' },
  { id: 'inv15', name: 'Onions', category: 'Produce', quantity: 50, unit: 'kg', unitCost: 4, unitPrice: 5, supplierId: 'sup3', lowStockThreshold: 15, businessId: 'biz1' },
  { id: 'inv16', name: 'Garlic', category: 'Produce', quantity: 10, unit: 'kg', unitCost: 7, unitPrice: 9, supplierId: 'sup3', lowStockThreshold: 2, businessId: 'biz1' },
  { id: 'inv17', name: 'Pasta', category: 'Pantry', quantity: 25, unit: 'kg', unitCost: 10, unitPrice: 15, supplierId: 'sup1', lowStockThreshold: 5, businessId: 'biz1' },


  // Biz 2: Corner Cafe
  { id: 'inv101', name: 'Espresso Beans', category: 'Pantry', quantity: 20, unit: 'kg', unitCost: 85, unitPrice: 100, supplierId: 'sup5', lowStockThreshold: 5, businessId: 'biz2' },
  { id: 'inv102', name: 'Full-Fat Milk', category: 'Dairy', quantity: 30, unit: 'L', unitCost: 6, unitPrice: 8, supplierId: 'sup6', lowStockThreshold: 10, businessId: 'biz2' },
  { id: 'inv103', name: 'Croissants', category: 'Bakery', quantity: 5, unit: 'dozen', unitCost: 30, unitPrice: 40, supplierId: 'sup6', lowStockThreshold: 2, businessId: 'biz2' },
  { id: 'inv104', name: 'Avocado', category: 'Produce', quantity: 15, unit: 'kg', unitCost: 25, unitPrice: 30, supplierId: 'sup3', lowStockThreshold: 4, businessId: 'biz2' },
  { id: 'inv105', name: 'Sourdough Bread', category: 'Bakery', quantity: 10, unit: 'unit', unitCost: 18, unitPrice: 25, supplierId: 'sup6', lowStockThreshold: 3, businessId: 'biz2' },
];

export const initialCategories: RecipeCategory[] = [
  // Biz 1
  { id: 'cat1', name: 'Main Course', businessId: 'biz1' },
  { id: 'cat2', name: 'Appetizer', businessId: 'biz1' },
  // Biz 2
  { id: 'cat101', name: 'Beverages', businessId: 'biz2' },
  { id: 'cat102', name: 'Breakfast', businessId: 'biz2' },
  { id: 'cat103', name: 'Pastries', businessId: 'biz2' },
];

export const initialRecipes: Recipe[] = [
  // Biz 1: Main Restaurant
  {
    id: 'rec1',
    name: 'Lamb Machboos',
    category: 'Main Course',
    servings: 10,
    targetSalePricePerServing: 75,
    imageUrl: 'https://pscoppugrlcyphpfowvu.supabase.co/storage/v1/object/public/recipe-images/placeholder/lamb-machboos.jpg',
    ingredients: [
      { itemId: 'inv1', quantity: 2.5, unit: 'kg' },
      { itemId: 'inv3', quantity: 2, unit: 'kg' },
      { itemId: 'inv15', quantity: 500, unit: 'g' },
      { itemId: 'inv6', quantity: 2, unit: 'g' },
    ],
    instructions: ['Sear the lamb pieces.', 'Sauté onions, add lamb and spices, simmer for 1.5 hours.', 'Cook rice in broth.', 'Return lamb to pot and serve.'],
    costHistory: [{ date: '2024-07-15', cost: 212.20 }],
    businessId: 'biz1',
  },
  {
    id: 'rec2',
    name: 'Chicken Shawarma Plate',
    category: 'Main Course',
    servings: 8,
    targetSalePricePerServing: 45,
    imageUrl: 'https://pscoppugrlcyphpfowvu.supabase.co/storage/v1/object/public/recipe-images/placeholder/shawarma-plate.jpg',
    ingredients: [
      { itemId: 'inv2', quantity: 2, unit: 'kg' },
      { itemId: 'inv4', quantity: 8, unit: 'unit' },
      { itemId: 'inv8', quantity: 500, unit: 'ml' },
      { itemId: 'inv16', quantity: 20, unit: 'g' },
      { itemId: 'inv10', quantity: 500, unit: 'g' },
    ],
    instructions: ['Marinate chicken.', 'Grill chicken.', 'Slice chicken.', 'Serve with pita and sauce.'],
    businessId: 'biz1',
  },
  // Biz 2: Corner Cafe
  {
    id: 'rec101',
    name: 'Classic Cappuccino',
    category: 'Beverages',
    servings: 1,
    targetSalePricePerServing: 18,
    ingredients: [
      { itemId: 'inv101', quantity: 18, unit: 'g' },
      { itemId: 'inv102', quantity: 150, unit: 'ml' },
    ],
    instructions: ['Grind coffee beans and pull a double espresso shot.', 'Steam and froth milk to a velvety microfoam.', 'Pour steamed milk over the espresso.'],
    businessId: 'biz2',
  },
  {
    id: 'rec102',
    name: 'Avocado Toast',
    category: 'Breakfast',
    servings: 1,
    targetSalePricePerServing: 25,
    ingredients: [
      { itemId: 'inv104', quantity: 0.5, unit: 'unit' },
      { itemId: 'inv105', quantity: 1, unit: 'unit' },
    ],
    instructions: ['Toast the sourdough slice.', 'Mash the avocado with salt and pepper.', 'Spread avocado on toast and serve immediately.'],
    businessId: 'biz2',
  },
];

export const initialMenuItems: MenuItem[] = [
    // Biz 1: Main Restaurant
    { id: 'menu1', name: 'Traditional Lamb Machboos', recipeId: 'rec1', salePrice: 75.00, salesCount: 150, businessId: 'biz1' },
    { id: 'menu2', name: 'Chicken Shawarma Platter', recipeId: 'rec2', salePrice: 45.00, salesCount: 250, businessId: 'biz1' },
    // Biz 2: Corner Cafe
    { id: 'menu101', name: 'Cappuccino', recipeId: 'rec101', salePrice: 18.00, salesCount: 500, businessId: 'biz2' },
    { id: 'menu102', name: 'Signature Avocado Toast', recipeId: 'rec102', salePrice: 25.00, salesCount: 320, businessId: 'biz2' },
];

export const initialRecipeTemplates: RecipeTemplate[] = [
  {
    id: 'tmpl1',
    name: 'Basic Grill Marinade',
    businessId: 'biz1',
    recipeData: {
      category: 'Main Course',
      servings: 4,
      ingredients: [
        { itemId: 'inv8', quantity: 250, unit: 'ml' },
        { itemId: 'inv16', quantity: 15, unit: 'g' },
      ],
      instructions: ['Combine all ingredients in a bowl.', 'Add protein and marinate for at least 30 minutes.'],
      targetSalePricePerServing: 0,
    },
  },
];

export const initialPurchaseOrders: PurchaseOrder[] = [
  // Biz 1: Main Restaurant
  {
    id: 'po1',
    supplierId: 'sup1',
    items: [
      { itemId: 'inv1', quantity: 20, cost: 48 },
      { itemId: 'inv2', quantity: 30, cost: 26 },
    ],
    status: 'Completed',
    orderDate: '2024-07-10',
    completionDate: '2024-07-12',
    totalCost: 1740,
    businessId: 'biz1',
  },
  {
    id: 'po2',
    supplierId: 'sup3',
    items: [
      { itemId: 'inv10', quantity: 50, cost: 6 },
      { itemId: 'inv15', quantity: 100, cost: 4 },
    ],
    status: 'Pending',
    orderDate: '2024-07-20',
    totalCost: 700,
    businessId: 'biz1',
  },
  // Biz 2: Corner Cafe
  {
    id: 'po101',
    supplierId: 'sup5',
    items: [
      { itemId: 'inv101', quantity: 10, cost: 85 },
    ],
    status: 'Pending',
    orderDate: '2024-07-22',
    totalCost: 850,
    businessId: 'biz2',
  },
    {
    id: 'po102',
    supplierId: 'sup6',
    items: [
      { itemId: 'inv102', quantity: 50, cost: 6 },
      { itemId: 'inv103', quantity: 10, cost: 30 },
    ],
    status: 'Cancelled',
    orderDate: '2024-07-18',
    totalCost: 600,
    businessId: 'biz2',
  },
];

export const initialSales: Sale[] = [
  // Biz 1
  {
    id: 'sale1',
    businessId: 'biz1',
    saleDate: '2024-07-28T10:00:00Z',
    items: [
      { menuItemId: 'menu1', quantity: 2, salePrice: 75, cost: 21.22 },
      { menuItemId: 'menu2', quantity: 1, salePrice: 45, cost: 8.23 },
    ],
    totalRevenue: 195,
    totalCost: 50.67,
    totalProfit: 144.33,
  },
  {
    id: 'sale2',
    businessId: 'biz1',
    saleDate: '2024-07-29T12:30:00Z',
    items: [
      { menuItemId: 'menu2', quantity: 3, salePrice: 45, cost: 8.23 },
    ],
    totalRevenue: 135,
    totalCost: 24.69,
    totalProfit: 110.31,
  },
  // Biz 2
  {
    id: 'sale101',
    businessId: 'biz2',
    saleDate: '2024-07-28T09:15:00Z',
    items: [
      { menuItemId: 'menu101', quantity: 2, salePrice: 18, cost: 2.79 },
      { menuItemId: 'menu102', quantity: 1, salePrice: 25, cost: 2.50 },
    ],
    totalRevenue: 61,
    totalCost: 8.08,
    totalProfit: 52.92,
  },
];
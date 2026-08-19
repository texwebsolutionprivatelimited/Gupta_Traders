
// ============================================================
// inventoryStorage.js
// Common Inventory Storage
// Purchase / Sales / Returns sab isi ko use karenge.
// ============================================================

const STORAGE_KEY = "inventoryProducts";

// ------------------------------------------------------------
// DEFAULT PRODUCTS
// Agar inventoryProducts pehle se localStorage me nahi hai,
// tab ye products save honge.
// ------------------------------------------------------------

const defaultProducts = [
  {
    id: 1,
    name: "Basmati Rice",
    sku: "RICE001",
    category: "Rice",
    brand: "India Gate",
    purchasePrice: 85,
    sellingPrice: 95,
    stock: 100,
    minStock: 20,
    gst: 5,
    unit: "Kg",
  },
  {
    id: 2,
    name: "Toor Dal",
    sku: "DAL001",
    category: "Pulses",
    brand: "Tata Sampann",
    purchasePrice: 110,
    sellingPrice: 125,
    stock: 60,
    minStock: 15,
    gst: 5,
    unit: "Kg",
  },
  {
    id: 3,
    name: "Wheat Flour",
    sku: "FLOUR001",
    category: "Flour",
    brand: "Aashirvaad",
    purchasePrice: 45,
    sellingPrice: 52,
    stock: 80,
    minStock: 20,
    gst: 0,
    unit: "Kg",
  },
  {
    id: 4,
    name: "Sugar",
    sku: "SUGAR001",
    category: "Grocery",
    brand: "Madhur",
    purchasePrice: 42,
    sellingPrice: 48,
    stock: 75,
    minStock: 20,
    gst: 0,
    unit: "Kg",
  },
  {
    id: 5,
    name: "Salt",
    sku: "SALT001",
    category: "Grocery",
    brand: "Tata",
    purchasePrice: 20,
    sellingPrice: 25,
    stock: 90,
    minStock: 20,
    gst: 0,
    unit: "Kg",
  },
  {
    id: 6,
    name: "Cooking Oil",
    sku: "OIL001",
    category: "Oil",
    brand: "Fortune",
    purchasePrice: 135,
    sellingPrice: 150,
    stock: 50,
    minStock: 15,
    gst: 5,
    unit: "Litre",
  },
  {
    id: 7,
    name: "Mustard Oil",
    sku: "OIL002",
    category: "Oil",
    brand: "Fortune",
    purchasePrice: 145,
    sellingPrice: 165,
    stock: 40,
    minStock: 10,
    gst: 5,
    unit: "Litre",
  },
  {
    id: 8,
    name: "Tea",
    sku: "TEA001",
    category: "Beverages",
    brand: "Tata Tea",
    purchasePrice: 210,
    sellingPrice: 240,
    stock: 35,
    minStock: 10,
    gst: 5,
    unit: "Pack",
  },
  {
    id: 9,
    name: "Coffee",
    sku: "COFFEE001",
    category: "Beverages",
    brand: "Bru",
    purchasePrice: 280,
    sellingPrice: 320,
    stock: 25,
    minStock: 8,
    gst: 5,
    unit: "Pack",
  },
  {
    id: 10,
    name: "Poha",
    sku: "POHA001",
    category: "Breakfast",
    brand: "Local",
    purchasePrice: 45,
    sellingPrice: 55,
    stock: 45,
    minStock: 10,
    gst: 5,
    unit: "Kg",
  },
  {
    id: 11,
    name: "Besan",
    sku: "BESAN001",
    category: "Flour",
    brand: "Fortune",
    purchasePrice: 75,
    sellingPrice: 90,
    stock: 35,
    minStock: 10,
    gst: 5,
    unit: "Kg",
  },
  {
    id: 12,
    name: "Moong Dal",
    sku: "DAL002",
    category: "Pulses",
    brand: "Tata Sampann",
    purchasePrice: 105,
    sellingPrice: 120,
    stock: 45,
    minStock: 10,
    gst: 5,
    unit: "Kg",
  },
  {
    id: 13,
    name: "Chana Dal",
    sku: "DAL003",
    category: "Pulses",
    brand: "Tata Sampann",
    purchasePrice: 75,
    sellingPrice: 90,
    stock: 50,
    minStock: 12,
    gst: 5,
    unit: "Kg",
  },
  {
    id: 14,
    name: "Maggi Noodles",
    sku: "NOODLE001",
    category: "Snacks",
    brand: "Nestle",
    purchasePrice: 12,
    sellingPrice: 15,
    stock: 100,
    minStock: 20,
    gst: 12,
    unit: "Pack",
  },
  {
    id: 15,
    name: "Parle-G Biscuits",
    sku: "BISC001",
    category: "Biscuits",
    brand: "Parle",
    purchasePrice: 8,
    sellingPrice: 10,
    stock: 120,
    minStock: 25,
    gst: 5,
    unit: "Pack",
  },
  {
    id: 16,
    name: "Britannia Good Day",
    sku: "BISC002",
    category: "Biscuits",
    brand: "Britannia",
    purchasePrice: 25,
    sellingPrice: 30,
    stock: 80,
    minStock: 20,
    gst: 18,
    unit: "Pack",
  },
  {
    id: 17,
    name: "Tomato Ketchup",
    sku: "KETCHUP001",
    category: "Sauces",
    brand: "Kissan",
    purchasePrice: 90,
    sellingPrice: 105,
    stock: 30,
    minStock: 8,
    gst: 12,
    unit: "Bottle",
  },
  {
    id: 18,
    name: "Mango Pickle",
    sku: "PICKLE001",
    category: "Pickles",
    brand: "Mother's Recipe",
    purchasePrice: 100,
    sellingPrice: 120,
    stock: 25,
    minStock: 8,
    gst: 12,
    unit: "Jar",
  },
  {
    id: 19,
    name: "Milk",
    sku: "MILK001",
    category: "Dairy",
    brand: "Amul",
    purchasePrice: 27,
    sellingPrice: 30,
    stock: 60,
    minStock: 15,
    gst: 0,
    unit: "Litre",
  },
  {
    id: 20,
    name: "Paneer",
    sku: "PANEER001",
    category: "Dairy",
    brand: "Amul",
    purchasePrice: 340,
    sellingPrice: 380,
    stock: 15,
    minStock: 5,
    gst: 5,
    unit: "Kg",
  },
];


// ============================================================
// GET INVENTORY
// ============================================================

export function getInventory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaultProducts)
      );

      return defaultProducts;
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed
      : defaultProducts;
  } catch (error) {
    console.error("Failed to load inventory:", error);

    return defaultProducts;
  }
}

// ============================================================
// SAVE INVENTORY
// ============================================================

export function saveInventory(products) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(products)
    );

    // Same browser ke dusre components ko notify karega
    window.dispatchEvent(
      new CustomEvent("inventoryUpdated", {
        detail: products,
      })
    );

    return true;
  } catch (error) {
    console.error("Failed to save inventory:", error);

    return false;
  }
}

// ============================================================
// FIND PRODUCT
// ============================================================

export function findInventoryProduct(productIdOrName) {
  const products = getInventory();

  return products.find(
    (product) =>
      String(product.id) === String(productIdOrName) ||
      product.name === productIdOrName ||
      product.sku === productIdOrName
  );
}

// ============================================================
// UPDATE STOCK
//
// quantity positive  => stock IN
// quantity negative  => stock OUT
// ============================================================

export function updateStock(productIdOrName, quantity) {
  const products = getInventory();

  const index = products.findIndex(
    (product) =>
      String(product.id) === String(productIdOrName) ||
      product.name === productIdOrName ||
      product.sku === productIdOrName
  );

  if (index === -1) {
    console.warn(
      "Inventory product not found:",
      productIdOrName
    );

    return {
      success: false,
      message: "Product not found in inventory.",
    };
  }

  const currentStock = Number(
    products[index].stock || 0
  );

  const change = Number(quantity || 0);

  const newStock = currentStock + change;

  // Stock negative nahi hone dena
  if (newStock < 0) {
    return {
      success: false,
      message: `Insufficient stock for ${products[index].name}. Available: ${currentStock}`,
    };
  }

  products[index] = {
    ...products[index],
    stock: newStock,
  };

  saveInventory(products);

  return {
    success: true,
    product: products[index],
    previousStock: currentStock,
    newStock,
  };
}

// ============================================================
// STOCK IN
// Purchase Entry ke liye
// ============================================================

export function addStock(productIdOrName, quantity) {
  return updateStock(
    productIdOrName,
    Math.abs(Number(quantity))
  );
}

// ============================================================
// STOCK OUT
// Sales / POS ke liye
// ============================================================

export function removeStock(productIdOrName, quantity) {
  return updateStock(
    productIdOrName,
    -Math.abs(Number(quantity))
  );
}

// ============================================================
// PURCHASE RETURN
// Purchase return = stock kam hoga
// ============================================================

export function purchaseReturnStock(
  productIdOrName,
  quantity
) {
  return removeStock(
    productIdOrName,
    quantity
  );
}

// ============================================================
// SALES RETURN
// Sales return = stock badhega
// ============================================================

export function salesReturnStock(
  productIdOrName,
  quantity
) {
  return addStock(
    productIdOrName,
    quantity
  );
}

// ============================================================
// SET EXACT STOCK
// Opening Stock / Adjustment ke liye
// ============================================================

export function setStock(
  productIdOrName,
  newStock
) {
  const products = getInventory();

  const index = products.findIndex(
    (product) =>
      String(product.id) === String(productIdOrName) ||
      product.name === productIdOrName ||
      product.sku === productIdOrName
  );

  if (index === -1) {
    return {
      success: false,
      message: "Product not found in inventory.",
    };
  }

  const stock = Number(newStock);

  if (!Number.isFinite(stock) || stock < 0) {
    return {
      success: false,
      message: "Invalid stock quantity.",
    };
  }

  products[index] = {
    ...products[index],
    stock,
  };

  saveInventory(products);

  return {
    success: true,
    product: products[index],
  };
}

// ============================================================
// RESET INVENTORY
// Development/testing ke liye
// ============================================================

export function resetInventory() {
  saveInventory(defaultProducts);

  return defaultProducts;
}


export function findInventoryProduct(productName) {
  const inventoryProducts = JSON.parse(localStorage.getItem("inventoryProducts")) || [];
  return inventoryProducts.find((product) => product.name === productName);
}

export function addStock(productName, quantity) {
  const inventoryProducts = JSON.parse(localStorage.getItem("inventoryProducts")) || [];
  const productIndex = inventoryProducts.findIndex((product) => product.name === productName);
  
  if (productIndex === -1) {
    return {
      success: false,
      message: `${productName} inventory me nahi mila.`,
    };
  }
  
  const existingProduct = inventoryProducts[productIndex];
  const currentStock = Number(existingProduct.stock || 0);
  const addQty = Number(quantity || 0);
  
  inventoryProducts[productIndex] = {
    ...existingProduct,
    stock: currentStock + addQty,
  };
  
  localStorage.setItem("inventoryProducts", JSON.stringify(inventoryProducts));
  return { success: true };
}

import { createContext, useContext, useState, useEffect } from 'react';

const ReportContext = createContext();

export function ReportProvider({ children }) {
  const [salesRecords, setSalesRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('salesHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load salesHistory:', e);
      return [];
    }
  });

  const [purchaseRecords, setPurchaseRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('purchaseHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load purchaseHistory:', e);
      return [];
    }
  });

  const [stockItems, setStockItems] = useState(() => {
    try {
      const saved = localStorage.getItem('inventoryProducts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load inventoryProducts:', e);
      return [];
    }
  });

  // Sync state if storage changes elsewhere
  useEffect(() => {
    const handleStorageChange = (e) => {
      try {
        if (e.key === 'salesHistory') {
          setSalesRecords(e.newValue ? JSON.parse(e.newValue) : []);
        } else if (e.key === 'purchaseHistory') {
          setPurchaseRecords(e.newValue ? JSON.parse(e.newValue) : []);
        } else if (e.key === 'inventoryProducts') {
          setStockItems(e.newValue ? JSON.parse(e.newValue) : []);
        }
      } catch (err) {
        console.error('Failed to parse storage update:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <ReportContext.Provider
      value={{
        salesRecords,
        setSalesRecords,
        purchaseRecords,
        setPurchaseRecords,
        stockItems,
        setStockItems,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}

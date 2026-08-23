import { createContext, useContext, useState, useEffect } from 'react';

const ExpenseContext = createContext();

export function ExpenseProvider({ children }) {
  const [rentHistory, setRentHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('rentHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load rentHistory:', e);
      return [];
    }
  });

  const [electricityRecords, setElectricityRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('electricityRecords');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load electricityRecords:', e);
      return [];
    }
  });

  const [staffSalaryRecords, setStaffSalaryRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('staffSalaryRecords');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load staffSalaryRecords:', e);
      return [];
    }
  });

  const [miscExpenses, setMiscExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('miscExpenses');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load miscExpenses:', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rentHistory', JSON.stringify(rentHistory));
    } catch (e) {
      console.error('Failed to save rentHistory:', e);
    }
  }, [rentHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('electricityRecords', JSON.stringify(electricityRecords));
    } catch (e) {
      console.error('Failed to save electricityRecords:', e);
    }
  }, [electricityRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('staffSalaryRecords', JSON.stringify(staffSalaryRecords));
    } catch (e) {
      console.error('Failed to save staffSalaryRecords:', e);
    }
  }, [staffSalaryRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('miscExpenses', JSON.stringify(miscExpenses));
    } catch (e) {
      console.error('Failed to save miscExpenses:', e);
    }
  }, [miscExpenses]);

  return (
    <ExpenseContext.Provider
      value={{
        rentHistory,
        setRentHistory,
        electricityRecords,
        setElectricityRecords,
        staffSalaryRecords,
        setStaffSalaryRecords,
        miscExpenses,
        setMiscExpenses,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpense() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
}

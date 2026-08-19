
import { createContext, useContext, useState } from "react";

const ExpenseContext = createContext();

export function ExpenseProvider({ children }) {
    const [rentHistory, setRentHistory] = useState([
        {
            id: 1,
            propertyName: "Gupta Traders Main Shop",
            ownerName: "Rajesh Gupta",
            amount: 15000,
            paymentDate: "2026-08-01",
            paymentMode: "Bank Transfer",
        },
    ]);

    const [electricityRecords, setElectricityRecords] = useState([
        {
            id: 1,
            billNumber: "EB-001",
            consumerNumber: "CN-1001",
            units: 250,
            amount: 4500,
            paymentDate: "2026-08-05",
            status: "Paid",
        },
    ]);

    const [staffSalaryRecords, setStaffSalaryRecords] = useState([
        {
            id: 1,
            employeeName: "Ramesh Kumar",
            designation: "Salesman",
            salary: 22000,
            paymentDate: "2026-08-10",
            paymentMode: "Cash",
            status: "Paid",
        },
    ]);

    const [miscExpenses, setMiscExpenses] = useState([
        {
            id: 1,
            category: "Office Supplies",
            vendor: "ABC Stationery",
            amount: 4000,
            expenseDate: "2026-08-12",
            paymentMode: "Cash",
        },
    ]);

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

export const useExpense = () => useContext(ExpenseContext);


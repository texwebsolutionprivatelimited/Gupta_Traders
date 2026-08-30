import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { listExpenses, listProducts, listPurchases, listSales, subscribeToTable } from '../services/erpService'
const ReportContext=createContext()
export function ReportProvider({children}){
 const [salesRecords,setSalesRecords]=useState([]),[purchaseRecords,setPurchaseRecords]=useState([]),[stockItems,setStockItems]=useState([]),[expenseRecords,setExpenseRecords]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true)
 const refresh=useCallback(async()=>{try{const [s,p,i,e]=await Promise.all([listSales(),listPurchases(),listProducts({status:null}),listExpenses()]);setSalesRecords(s);setPurchaseRecords(p);setStockItems(i.map(x=>({...x,stock:Number(x.inventory?.quantity||0),currentStock:Number(x.inventory?.quantity||0),minStock:Number(x.minimum_stock||0),purchasePrice:Number(x.purchase_price),sellingPrice:Number(x.selling_price)})));setExpenseRecords(e);setError('')}catch(err){setError(err.message)}finally{setLoading(false)}},[])
 useEffect(()=>{refresh();const off=['sales','purchases','inventory','expenses'].map(t=>subscribeToTable(t,refresh));return()=>off.forEach(x=>x())},[refresh])
 return <ReportContext.Provider value={{salesRecords,purchaseRecords,stockItems,expenseRecords,loading,error,refresh,setSalesRecords,setPurchaseRecords,setStockItems}}>{children}</ReportContext.Provider>
}
export function useReport(){const value=useContext(ReportContext);if(!value)throw new Error('useReport must be inside ReportProvider');return value}

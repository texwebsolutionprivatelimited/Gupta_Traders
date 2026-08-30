import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { deleteExpense, listExpenses, saveExpense, subscribeToTable } from '../services/erpService'
const ExpenseContext = createContext()
const types = { rentHistory:'rent', electricityRecords:'electricity', staffSalaryRecords:'staff_salary', miscExpenses:'miscellaneous' }
function fromRow(row) { return { id:row.id, amount:Number(row.amount), date:row.expense_date, paymentDate:row.expense_date, description:row.description, paymentMode:row.payment_method, category:row.category, ...(row.metadata || {}) } }
function toRow(type, value) { const known=['id','amount','date','paymentDate','description','paymentMode','category']; const metadata=Object.fromEntries(Object.entries(value).filter(([k])=>!known.includes(k))); return { expense_type:type, expense_date:value.paymentDate||value.date||new Date().toISOString().slice(0,10), amount:Number(value.amount||value.rentAmount||value.salary||0), description:value.description||value.propertyName||value.employeeName||type.replace('_',' '), category:value.category||null, payment_method:value.paymentMode||'Cash', payee:value.ownerName||value.employeeName||value.payee||null, bill_number:value.billNumber||null, metadata } }
export function ExpenseProvider({ children }) {
  const [rows,setRows]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState('')
  const refresh=useCallback(async()=>{ try{setRows(await listExpenses());setError('')}catch(e){setError(e.message)}finally{setLoading(false)} },[])
  useEffect(()=>{refresh();return subscribeToTable('expenses',refresh)},[refresh])
  function setter(type){ return async update=>{ const current=rows.filter(r=>r.expense_type===type).map(fromRow); const next=typeof update==='function'?update(current):update; try{ const removed=current.filter(x=>!next.some(n=>n.id===x.id)); const changed=next.filter(n=>!n.id||JSON.stringify(n)!==JSON.stringify(current.find(c=>c.id===n.id))); await Promise.all(removed.map(x=>deleteExpense(x.id))); await Promise.all(changed.map(x=>saveExpense(toRow(type,x),x.id))); await refresh() }catch(e){setError(e.message);throw e} } }
  const value={ loading,error,refresh }
  for(const [name,type] of Object.entries(types)){ value[name]=rows.filter(r=>r.expense_type===type).map(fromRow); value[`set${name[0].toUpperCase()}${name.slice(1)}`]=setter(type) }
  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
}
export function useExpense(){const value=useContext(ExpenseContext);if(!value)throw new Error('useExpense must be inside ExpenseProvider');return value}

import React, { useState, useEffect } from 'react'
import {
  PhoneIcon,
  EmailIcon,
  MapIcon,
  CopyIcon,
  CloseIcon,
  LedgerIcon,
  PrintIcon
} from './Icons'
import { recordCustomerTransaction } from '../../hooks/customerData'
import { formatINR } from '../../hooks/productData'

export default function CustomerLedgerModal({ customer, onTransactionRecorded, onClose }) {
  const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'Admin'
  const [txnAmount, setTxnAmount] = useState('')
  const [txnType, setTxnType] = useState('payment') // 'payment', 'invoice', or 'adjustment'
  const [paymentMode, setPaymentMode] = useState('UPI')
  const [refNo, setRefNo] = useState('')
  const [txnDescription, setTxnDescription] = useState('Payment received')
  const [error, setError] = useState('')

  useEffect(() => {
    const mainEl = document.querySelector('main')
    const originalBodyOverflow = document.body.style.overflow
    const originalMainOverflow = mainEl ? mainEl.style.overflow : ''

    document.body.style.overflow = 'hidden'
    if (mainEl) mainEl.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalBodyOverflow
      if (mainEl) mainEl.style.overflow = originalMainOverflow
    }
  }, [])

  function handleRecordTxn(e) {
    e.preventDefault()
    setError('')

    const amt = Number(txnAmount)
    if (!txnAmount || isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }

    if (!txnDescription.trim()) {
      setError('Please enter a brief transaction description')
      return
    }

    let finalDesc = txnDescription.trim()
    if (txnType === 'payment') {
      finalDesc += ` via ${paymentMode} ${refNo ? `(Ref: ${refNo})` : ''}`
    }

    const payload = {
      type: txnType,
      amount: amt,
      description: finalDesc,
    }

    const result = recordCustomerTransaction(customer.id, payload)
    if (result.error) {
      setError(result.error)
      return
    }

    // Clear form
    setTxnAmount('')
    setTxnDescription('')
    setRefNo('')
    onTransactionRecorded(result.data, `Transaction recorded successfully`)
  }

  function handleTypeChange(type) {
    setTxnType(type)
    if (type === 'payment') {
      setTxnDescription('Payment received')
    } else if (type === 'invoice') {
      setTxnDescription('Sales Invoice #GT-')
    } else {
      setTxnDescription('Balance adjustment')
    }
  }

  function handlePrintStatement() {
    const printWindow = window.open('', '_blank')
    const ledgerHTML = `
      <html>
        <head>
          <title>Gupta Traders - Customer Account Statement</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; }
            .meta { font-size: 14px; text-align: right; }
            .cust-info { margin: 20px 0; font-size: 14px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f5f5f5; }
            .text-right { text-align: right; }
            .debit { color: #dc2626; font-weight: bold; }
            .credit { color: #16a34a; font-weight: bold; }
            .summary { margin-top: 30px; text-align: right; font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">GUPTA TRADERS</div>
              <div>Main Market, Rohtak, Haryana</div>
              <div>Phone: +91 98123 45678 | Email: billing@guptatraders.com</div>
            </div>
            <div class="meta">
              <h2>Customer Statement</h2>
              <div>Date: ${new Date().toLocaleDateString('en-IN')}</div>
              <div>Account ID: ${customer.id}</div>
            </div>
          </div>
          <div class="cust-info">
            <strong>Customer Details:</strong><br>
            Name: ${customer.name}<br>
            Phone: ${customer.phone || 'N/A'}<br>
            Email: ${customer.email || 'N/A'}<br>
            City: ${customer.city || 'N/A'}<br>
            GSTIN: ${customer.gstin || 'N/A'}
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th class="text-right">Debit (Invoiced)</th>
                <th class="text-right">Credit (Received)</th>
                <th class="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${customer.ledger.map(entry => {
      const isInvoice = entry.type === 'invoice' || (entry.type === 'opening_balance' && entry.amount >= 0)
      const isPayment = entry.type === 'payment' || (entry.type === 'opening_balance' && entry.amount < 0)
      const debit = isInvoice ? formatINR(Math.abs(entry.amount)) : ''
      const credit = isPayment ? formatINR(Math.abs(entry.amount)) : ''

      return `
                  <tr>
                    <td>${new Date(entry.date).toLocaleDateString('en-IN')}</td>
                    <td>${entry.type.toUpperCase().replace('_', ' ')}</td>
                    <td>${entry.description}</td>
                    <td class="text-right debit">${debit}</td>
                    <td class="text-right credit">${credit}</td>
                    <td class="text-right">${formatINR(entry.balanceAfter)}</td>
                  </tr>
                `
    }).join('')}
            </tbody>
          </table>
          <div class="summary">
            Current Outstanding Balance: ${formatINR(customer.outstandingBalance)}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `
    printWindow.document.write(ledgerHTML)
    printWindow.document.close()
  }

  // Credit limit progress stats
  const creditUsagePct = Math.min(Math.round((customer.outstandingBalance / customer.creditLimit) * 100), 100)
  const isOverLimit = customer.outstandingBalance > customer.creditLimit
  const progressBg = isOverLimit ? 'bg-rose-500' : creditUsagePct > 80 ? 'bg-amber-500' : 'bg-teal-500'

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-0 animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-0 max-w-5xl w-full shadow-2xl animate-scaleIn overflow-hidden flex flex-col md:flex-row h-auto md:h-[85vh] md:max-h-[750px] my-auto" onClick={e => e.stopPropagation()}>

        {/* Left column: Customer Profile & Transaction Recorder */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-950/20 p-6 flex flex-col justify-between shrink-0 md:overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {customer.id}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${customer.status === 'active' ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-500/10 text-slate-400'
                }`}>
                {customer.status}
              </span>
            </div>

            {customer.profilePic && (
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-800 mb-4 shadow-lg shrink-0">
                <img src={customer.profilePic} alt={customer.name} className="w-full h-full object-cover" />
              </div>
            )}

            <h2 className="text-xl font-bold text-slate-100 mb-1 leading-tight">
              {customer.name}
            </h2>
            <div className="flex gap-1.5 mb-4">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${customer.customerType === 'contractor' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                customer.customerType === 'wholesaler' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20' :
                  customer.customerType === 'regular' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' :
                    'bg-slate-500/15 text-slate-400 border border-slate-800'
                }`}>
                {customer.customerType}
              </span>
            </div>

            <div className="space-y-2 mb-6 text-xs text-slate-400">
              {customer.phone && (
                <div className="flex items-center">
                  <PhoneIcon />
                  <span className="select-all">{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="truncate flex items-center">
                  <EmailIcon />
                  <span className="select-all">{customer.email}</span>
                </div>
              )}
              {customer.city && (
                <div className="flex items-start">
                  <span className="shrink-0 mt-0.5"><MapIcon /></span>
                  <span>{customer.address ? `${customer.address}, ` : ''}{customer.city}</span>
                </div>
              )}
              {customer.gstin && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/40 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span>GSTIN: <span className="text-slate-300 font-semibold">{customer.gstin}</span></span>
                  <button onClick={() => {
                    navigator.clipboard.writeText(customer.gstin)
                  }} className="cursor-pointer hover:bg-slate-800 p-0.5 rounded transition-colors">
                    <CopyIcon />
                  </button>
                </div>
              )}
            </div>

            {/* Balances card */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 mb-5 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Outstanding Balance
              </div>
              <div className={`text-2xl font-black ${customer.outstandingBalance > 0
                ? 'text-rose-400'
                : customer.outstandingBalance < 0
                  ? 'text-emerald-400'
                  : 'text-slate-400'
                }`}>
                {formatINR(customer.outstandingBalance)}
              </div>
              <div className="text-[9px] text-slate-500 mt-1.5">
                {customer.outstandingBalance > 0
                  ? '⚠️ Receivables (Customer owes us)'
                  : customer.outstandingBalance < 0
                    ? '🤝 Customer Credit (Advance deposit)'
                    : '✅ Accounts Settle/Clear'}
              </div>
            </div>

            {/* Credit Limit utilization status */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1.5">
                <span>CREDIT LIMIT USED</span>
                <span className={isOverLimit ? 'text-rose-400' : 'text-slate-300'}>
                  {creditUsagePct}% ({formatINR(Math.max(0, customer.outstandingBalance))})
                </span>
              </div>
              <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full ${progressBg} transition-all duration-500`}
                  style={{ width: `${Math.max(0, Math.min(100, customer.outstandingBalance > 0 ? creditUsagePct : 0))}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                <span>Limit: {formatINR(customer.creditLimit)}</span>
                {isOverLimit && <span className="text-rose-400 font-bold">BREACHED!</span>}
              </div>
            </div>
          </div>

          {/* Quick Action Transaction Form */}
          {userRole !== 'Cashier' && (
            <div className="border-t border-slate-800/80 pt-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Record Transaction
              </h4>

              <form onSubmit={handleRecordTxn} className="space-y-3">
                {error && (
                  <p className="text-[10px] text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                    {error}
                  </p>
                )}

                <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('payment')}
                    className={`flex-1 text-[10px] py-1.5 rounded-md font-bold uppercase tracking-wider transition-colors cursor-pointer ${txnType === 'payment' ? 'bg-teal-600 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Received Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('invoice')}
                    className={`flex-1 text-[10px] py-1.5 rounded-md font-bold uppercase tracking-wider transition-colors cursor-pointer ${txnType === 'invoice' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Bill Debit
                  </button>
                </div>

                <div>
                  <input
                    type="number"
                    value={txnAmount}
                    onChange={e => setTxnAmount(e.target.value)}
                    placeholder="Amount (₹)"
                    className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-teal-500/60 text-xs font-semibold"
                  />
                </div>

                {txnType === 'payment' && (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value)}
                      className="px-2 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-[11px] focus:outline-none focus:border-teal-500/60"
                    >
                      <option value="UPI">UPI (GPay/Paytm)</option>
                      <option value="Cash">Cash Hand</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Cheque">Cheque Deposit</option>
                    </select>
                    <input
                      type="text"
                      value={refNo}
                      onChange={e => setRefNo(e.target.value)}
                      placeholder="Ref # (Optional)"
                      className="w-full px-2 py-1.5 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500/60 text-[11px]"
                    />
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    value={txnDescription}
                    onChange={e => setTxnDescription(e.target.value)}
                    placeholder="Description"
                    className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-teal-500/60 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-slate-100 font-bold rounded-lg text-xs tracking-wider transition-colors cursor-pointer"
                >
                  Record Entry
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right column: Ledger History */}
        <div className="flex-1 flex flex-col bg-slate-950/10 min-h-0">
          <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-md font-bold text-slate-200">
                Customer Ledger Account
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial transaction history statement
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrintStatement}
                className="text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 bg-slate-900/60 p-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
              >
                <PrintIcon />
                <span>Statement</span>
              </button>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 transition-colors p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto min-h-0 max-h-[400px] md:max-h-[none] scrollbar-thin">
            {customer.ledger && customer.ledger.length > 0 ? (
              <div className="space-y-4">
                {customer.ledger.map((entry) => {
                  let badgeColor = ''
                  let typeLabel = ''
                  let amtPrefix = ''
                  let amountColor = ''

                  switch (entry.type) {
                    case 'opening_balance':
                      badgeColor = 'bg-slate-800 text-slate-300'
                      typeLabel = 'Opening Bal'
                      amtPrefix = entry.amount >= 0 ? '' : ''
                      amountColor = 'text-slate-300 font-semibold'
                      break
                    case 'invoice':
                      badgeColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                      typeLabel = 'Invoice'
                      amtPrefix = '+'
                      amountColor = 'text-rose-400 font-bold'
                      break
                    case 'payment':
                      badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                      typeLabel = 'Payment'
                      amtPrefix = '-'
                      amountColor = 'text-emerald-400 font-bold'
                      break
                    case 'adjustment':
                      badgeColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                      typeLabel = 'Adjustment'
                      amtPrefix = entry.amount >= 0 ? '+' : '-'
                      amountColor = entry.amount >= 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'
                      break
                  }

                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-slate-700/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 flex flex-col items-center justify-center shrink-0 border border-slate-800/80">
                          <span className="text-[10px] text-teal-400/80 font-bold uppercase">
                            {new Date(entry.date).toLocaleString('en', { month: 'short' })}
                          </span>
                          <span className="text-slate-200 font-extrabold text-sm leading-none mt-0.5">
                            {new Date(entry.date).getDate()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                              {typeLabel}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-200 mt-1">
                            {entry.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col sm:items-end justify-between items-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/40">
                        <span className="text-xs text-slate-500 sm:hidden">Amount & Balance</span>
                        <div className="text-right">
                          <div className={`font-bold text-sm ${amountColor}`}>
                            {amtPrefix}{formatINR(Math.abs(entry.amount))}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Bal: {formatINR(entry.balanceAfter)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                <LedgerIcon />
                <p className="text-sm font-semibold mt-3">No transactions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

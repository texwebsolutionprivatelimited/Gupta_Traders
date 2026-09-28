import { useState, useEffect, useMemo } from 'react'
import { listUISales, listUIPurchases } from '../services/erpService'
import { formatINR } from '../utils/erp'
import {
  FaTimes,
  FaFilePdf,
  FaFileExcel,
  FaCalendarAlt,
  FaArrowDown,
  FaArrowUp,
  FaBalanceScale,
  FaSearch,
} from 'react-icons/fa'

export default function GSTReportModal({ isOpen, onClose }) {
  const [filterPeriod, setFilterPeriod] = useState('This Week') // 'This Week' | 'This Month' | 'This Year' | 'Custom Date Range'
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [appliedCustomRange, setAppliedCustomRange] = useState(null)

  const [activeTab, setActiveTab] = useState('all') // 'all' | 'sales' | 'purchases'
  const [searchQuery, setSearchQuery] = useState('')

  const [loading, setLoading] = useState(true)
  const [salesRecords, setSalesRecords] = useState([])
  const [purchaseRecords, setPurchaseRecords] = useState([])
  const [storeGstin, setStoreGstin] = useState('09ABCDE1234F1Z5')
  const [storeName, setStoreName] = useState('Gupta Traders & Superstore')

  // Set default custom dates (start of month to today)
  useEffect(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    setCustomTo(`${yyyy}-${mm}-${dd}`)
    setCustomFrom(`${yyyy}-${mm}-01`)
  }, [])

  // Load store settings and transaction data
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    setLoading(true)

    try {
      const savedGst = localStorage.getItem('erp_settings_gst')
      if (savedGst) {
        const parsed = JSON.parse(savedGst)
        if (parsed.gstin) setStoreGstin(parsed.gstin)
      }
      const savedShop = localStorage.getItem('erp_settings_shop')
      if (savedShop) {
        const parsed = JSON.parse(savedShop)
        if (parsed.name || parsed.storeName) setStoreName(parsed.name || parsed.storeName)
      }
    } catch {
      // Fallback defaults
    }

    Promise.all([
      listUISales().catch(() => []),
      listUIPurchases().catch(() => [])
    ]).then(([sales, purchases]) => {
      if (!isMounted) return
      setSalesRecords(sales || [])
      setPurchaseRecords(purchases || [])
      setLoading(false)
    }).catch(err => {
      console.error('Error fetching GST transaction data:', err)
      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Calculate Date Range based on filter selection
  const { dateRange, periodLabel } = useMemo(() => {
    const now = new Date()

    if (filterPeriod === 'This Week') {
      const current = new Date(now)
      const day = current.getDay()
      // Difference to Monday (day 1). If Sunday (0), day diff is -6
      const diff = current.getDate() - day + (day === 0 ? -6 : 1)
      const start = new Date(current.setDate(diff))
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)

      return {
        dateRange: { start, end },
        periodLabel: `This Week (${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`
      }
    }

    if (filterPeriod === 'This Month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)

      return {
        dateRange: { start, end },
        periodLabel: `This Month (${start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})`
      }
    }

    if (filterPeriod === 'This Year') {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)

      return {
        dateRange: { start, end },
        periodLabel: `This Year (${now.getFullYear()})`
      }
    }

    // Custom Date Range
    if (appliedCustomRange) {
      return {
        dateRange: appliedCustomRange,
        periodLabel: `Custom (${appliedCustomRange.start.toLocaleDateString('en-IN')} - ${appliedCustomRange.end.toLocaleDateString('en-IN')})`
      }
    }

    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const defaultEnd = new Date(now)
    defaultEnd.setHours(23, 59, 59, 999)
    return {
      dateRange: { start: defaultStart, end: defaultEnd },
      periodLabel: `Custom (${defaultStart.toLocaleDateString('en-IN')} - ${defaultEnd.toLocaleDateString('en-IN')})`
    }
  }, [filterPeriod, appliedCustomRange])

  const handleGenerateCustomReport = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!customFrom || !customTo) {
      alert('Please select both From and To dates.')
      return
    }
    const start = new Date(customFrom)
    start.setHours(0, 0, 0, 0)
    const end = new Date(customTo)
    end.setHours(23, 59, 59, 999)

    if (start > end) {
      alert('From date cannot be after To date.')
      return
    }

    setAppliedCustomRange({ start, end })
  }

  // Parse transaction date safely
  const parseTxDate = (dateVal) => {
    if (!dateVal) return null
    if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal
    const str = String(dateVal).trim()
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : d
  }

  // Filter Sales Transactions with GST info
  const filteredSales = useMemo(() => {
    if (!dateRange) return []

    return salesRecords.filter(s => {
      const txDate = parseTxDate(s.date || s.sale_date || s.createdAt || s.created_at)
      if (!txDate) return false
      return txDate >= dateRange.start && txDate <= dateRange.end
    }).map(s => {
      const txDate = parseTxDate(s.date || s.sale_date || s.createdAt || s.created_at)
      const rawTotal = Number(s.total ?? s.total_amount ?? 0)
      const discount = Number(s.discount || 0)

      let recordedGst = Number(s.gst ?? s.tax_amount ?? s.tax ?? 0)
      let taxableVal = Number(s.subtotal ?? 0)

      if (recordedGst === 0 && Array.isArray(s.items) && s.items.length > 0) {
        s.items.forEach(it => {
          const rate = Number(it.tax_rate ?? it.gst ?? 0)
          const qty = Number(it.quantity || 1)
          const price = Number(it.price || it.salesPrice || it.unit_price || 0)
          const lineTotal = qty * price
          if (rate > 0) {
            const base = lineTotal / (1 + rate / 100)
            recordedGst += (lineTotal - base)
          }
        })
      }

      if (taxableVal <= 0 || taxableVal === rawTotal) {
        taxableVal = Math.max(0, rawTotal - recordedGst)
      }

      const cgst = Math.round((recordedGst / 2) * 100) / 100
      const sgst = Math.round((recordedGst / 2) * 100) / 100

      return {
        id: s.id,
        type: 'Sale',
        invoiceNo: s.invoice || s.invoice_number || `INV-${s.id?.slice(0, 8) || 'N/A'}`,
        date: txDate,
        dateFormatted: txDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        partyName: s.customer || s.customerObj?.name || 'Walk-in Customer',
        partyGstin: s.customerObj?.gstin || s.customerObj?.gst_number || s.customerGstin || 'Unregistered',
        taxableValue: Math.round(taxableVal * 100) / 100,
        cgst,
        sgst,
        totalGst: Math.round(recordedGst * 100) / 100,
        totalAmount: rawTotal,
        discount,
        status: s.status || 'Completed',
        items: s.items || []
      }
    })
  }, [salesRecords, dateRange])

  // Filter Purchase Transactions with GST info
  const filteredPurchases = useMemo(() => {
    if (!dateRange) return []

    return purchaseRecords.filter(p => {
      const txDate = parseTxDate(p.date || p.purchase_date || p.createdAt || p.created_at)
      if (!txDate) return false
      return txDate >= dateRange.start && txDate <= dateRange.end
    }).map(p => {
      const txDate = parseTxDate(p.date || p.purchase_date || p.createdAt || p.created_at)
      const rawTotal = Number(p.total ?? p.total_amount ?? 0)

      let recordedGst = Number(p.gst ?? p.tax_amount ?? p.tax ?? 0)
      let taxableVal = Number(p.subtotal ?? 0)

      if (recordedGst === 0 && Array.isArray(p.items) && p.items.length > 0) {
        p.items.forEach(it => {
          const rate = Number(it.tax_rate ?? it.gst ?? 0)
          const qty = Number(it.quantity || 1)
          const price = Number(it.purchasePrice || it.unit_price || 0)
          const lineTotal = qty * price
          if (rate > 0) {
            const base = lineTotal / (1 + rate / 100)
            recordedGst += (lineTotal - base)
          }
        })
      }

      if (taxableVal <= 0 || taxableVal === rawTotal) {
        taxableVal = Math.max(0, rawTotal - recordedGst)
      }

      const cgst = Math.round((recordedGst / 2) * 100) / 100
      const sgst = Math.round((recordedGst / 2) * 100) / 100

      return {
        id: p.id,
        type: 'Purchase',
        invoiceNo: p.billNo || p.invoice || `PUR-${p.id?.slice(0, 8) || 'N/A'}`,
        date: txDate,
        dateFormatted: txDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        partyName: p.supplier || 'Standard Supplier',
        partyGstin: p.supplierGstin || p.supplier?.gstin || 'Registered Supplier',
        taxableValue: Math.round(taxableVal * 100) / 100,
        cgst,
        sgst,
        totalGst: Math.round(recordedGst * 100) / 100,
        totalAmount: rawTotal,
        status: p.status || 'Completed',
        items: p.items || []
      }
    })
  }, [purchaseRecords, dateRange])

  // Summary Metrics
  const summary = useMemo(() => {
    const totalSalesCount = filteredSales.length
    const totalSalesTaxable = filteredSales.reduce((sum, s) => sum + s.taxableValue, 0)
    const totalSalesCGST = filteredSales.reduce((sum, s) => sum + s.cgst, 0)
    const totalSalesSGST = filteredSales.reduce((sum, s) => sum + s.sgst, 0)
    const totalSalesGST = filteredSales.reduce((sum, s) => sum + s.totalGst, 0)
    const totalSalesGross = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0)

    const totalPurchasesCount = filteredPurchases.length
    const totalPurchasesTaxable = filteredPurchases.reduce((sum, p) => sum + p.taxableValue, 0)
    const totalPurchasesCGST = filteredPurchases.reduce((sum, p) => sum + p.cgst, 0)
    const totalPurchasesSGST = filteredPurchases.reduce((sum, p) => sum + p.sgst, 0)
    const totalPurchasesGST = filteredPurchases.reduce((sum, p) => sum + p.totalGst, 0)
    const totalPurchasesGross = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0)

    const totalTransactions = totalSalesCount + totalPurchasesCount
    const netGstLiability = Math.round((totalSalesGST - totalPurchasesGST) * 100) / 100

    return {
      totalTransactions,
      sales: {
        count: totalSalesCount,
        taxable: Math.round(totalSalesTaxable * 100) / 100,
        cgst: Math.round(totalSalesCGST * 100) / 100,
        sgst: Math.round(totalSalesSGST * 100) / 100,
        totalGst: Math.round(totalSalesGST * 100) / 100,
        gross: Math.round(totalSalesGross * 100) / 100,
      },
      purchases: {
        count: totalPurchasesCount,
        taxable: Math.round(totalPurchasesTaxable * 100) / 100,
        cgst: Math.round(totalPurchasesCGST * 100) / 100,
        sgst: Math.round(totalPurchasesSGST * 100) / 100,
        totalGst: Math.round(totalPurchasesGST * 100) / 100,
        gross: Math.round(totalPurchasesGross * 100) / 100,
      },
      netGstLiability
    }
  }, [filteredSales, filteredPurchases])

  // Combined and filtered table list
  const combinedList = useMemo(() => {
    let list = []
    if (activeTab === 'all' || activeTab === 'sales') {
      list = [...list, ...filteredSales]
    }
    if (activeTab === 'all' || activeTab === 'purchases') {
      list = [...list, ...filteredPurchases]
    }

    list.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(item =>
        item.invoiceNo.toLowerCase().includes(q) ||
        item.partyName.toLowerCase().includes(q) ||
        item.partyGstin.toLowerCase().includes(q)
      )
    }

    return list
  }, [filteredSales, filteredPurchases, activeTab, searchQuery])

  // ─── CSV Download Handler ──────────────────────────────────────
  const handleDownloadCSV = () => {
    const filename = `gst_report_${periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.csv`

    let csv = '\uFEFF' // UTF-8 BOM
    csv += `"${storeName.toUpperCase()} - GST TAX & COMPLIANCE REPORT"\n`
    csv += `"Store GSTIN:","${storeGstin}"\n`
    csv += `"Report Period:","${periodLabel}"\n`
    csv += `"Generated At:","${new Date().toLocaleString('en-IN')}"\n\n`

    // Summary Section
    csv += `"--- GST EXECUTIVE SUMMARY ---"\n`
    csv += `"Category","Transaction Count","Taxable Turnover (₹)","Output/Input CGST (₹)","Output/Input SGST (₹)","Total Tax Amount (₹)","Gross Value (₹)"\n`
    csv += `"Sales (Outward Supplies)",${summary.sales.count},"${summary.sales.taxable.toFixed(2)}","${summary.sales.cgst.toFixed(2)}","${summary.sales.sgst.toFixed(2)}","${summary.sales.totalGst.toFixed(2)}","${summary.sales.gross.toFixed(2)}"\n`
    csv += `"Purchases (Inward Supplies)",${summary.purchases.count},"${summary.purchases.taxable.toFixed(2)}","${summary.purchases.cgst.toFixed(2)}","${summary.purchases.sgst.toFixed(2)}","${summary.purchases.totalGst.toFixed(2)}","${summary.purchases.gross.toFixed(2)}"\n`
    csv += `"Net GST Position",${summary.totalTransactions},"-","-","-","${summary.netGstLiability.toFixed(2)}","${summary.netGstLiability >= 0 ? 'Payable' : 'Credit / ITC'}"\n\n`

    // Sales Register
    csv += `"--- SALES GST REGISTER (OUTWARD SUPPLIES) ---"\n`
    csv += `"Type","Invoice No","Date","Customer Name","Customer GSTIN","Taxable Value (₹)","CGST (₹)","SGST (₹)","Total GST (₹)","Invoice Total (₹)"\n`
    filteredSales.forEach(s => {
      csv += `"Sale","${s.invoiceNo}","${s.dateFormatted}","${s.partyName.replace(/"/g, '""')}","${s.partyGstin}","${s.taxableValue.toFixed(2)}","${s.cgst.toFixed(2)}","${s.sgst.toFixed(2)}","${s.totalGst.toFixed(2)}","${s.totalAmount.toFixed(2)}"\n`
    })
    csv += '\n'

    // Purchases Register
    csv += `"--- PURCHASE GST REGISTER (INWARD SUPPLIES) ---"\n`
    csv += `"Type","Bill / Inv No","Date","Supplier Name","Supplier GSTIN","Taxable Value (₹)","CGST (₹)","SGST (₹)","Input GST / ITC (₹)","Bill Total (₹)"\n`
    filteredPurchases.forEach(p => {
      csv += `"Purchase","${p.invoiceNo}","${p.dateFormatted}","${p.partyName.replace(/"/g, '""')}","${p.partyGstin}","${p.taxableValue.toFixed(2)}","${p.cgst.toFixed(2)}","${p.sgst.toFixed(2)}","${p.totalGst.toFixed(2)}","${p.totalAmount.toFixed(2)}"\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // ─── PDF Download Handler ──────────────────────────────────────
  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to view and print the GST PDF report.')
      return
    }

    const netStatusColor = summary.netGstLiability >= 0 ? '#b45309' : '#047857'
    const netStatusText = summary.netGstLiability >= 0 ? 'Net GST Payable to Govt' : 'Net Input Tax Credit (ITC Carried Forward)'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>GST Report - ${periodLabel}</title>
  <meta charset="utf-8">
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 10px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .store-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .store-meta {
      font-size: 11px;
      color: #475569;
      font-weight: 600;
    }
    .report-badge {
      display: inline-block;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .report-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin: 2px 0;
    }
    .period-text {
      font-size: 11px;
      color: #475569;
      font-weight: 600;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .kpi-title {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 3px;
    }
    .kpi-val {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-top: 14px;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      font-size: 10px;
      text-transform: uppercase;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 5px 8px;
      font-size: 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .footer {
      margin-top: 25px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      font-size: 9px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="store-title">${storeName}</h1>
      <div class="store-meta">GSTIN: <strong>${storeGstin}</strong> • Tax Invoice & Compliance Ledger</div>
    </div>
    <div style="text-align: right;">
      <span class="report-badge">GST Summary Report</span>
      <div class="report-title">Tax Return Filing Period</div>
      <div class="period-text">${periodLabel}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Total Transactions</div>
      <div class="kpi-val">${summary.totalTransactions} <span style="font-size: 10px; font-weight: normal; color: #64748b;">(${summary.sales.count} sales, ${summary.purchases.count} pur)</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Output GST (Sales)</div>
      <div class="kpi-val" style="color: #2563eb;">₹${summary.sales.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Input Tax Credit (Purchases)</div>
      <div class="kpi-val" style="color: #059669;">₹${summary.purchases.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">${netStatusText}</div>
      <div class="kpi-val" style="color: ${netStatusColor};">₹${Math.abs(summary.netGstLiability).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
    </div>
  </div>

  <div class="section-title">1. GST Summary Totals (Outward & Inward Supplies)</div>
  <table>
    <thead>
      <tr>
        <th>Supply Nature</th>
        <th class="text-center">Count</th>
        <th class="text-right">Taxable Turnover (₹)</th>
        <th class="text-right">CGST (₹)</th>
        <th class="text-right">SGST (₹)</th>
        <th class="text-right">Total Tax (₹)</th>
        <th class="text-right">Gross Total (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="font-bold">Sales (Outward Supplies)</td>
        <td class="text-center">${summary.sales.count}</td>
        <td class="text-right">${summary.sales.taxable.toFixed(2)}</td>
        <td class="text-right">${summary.sales.cgst.toFixed(2)}</td>
        <td class="text-right">${summary.sales.sgst.toFixed(2)}</td>
        <td class="text-right font-bold" style="color: #2563eb;">${summary.sales.totalGst.toFixed(2)}</td>
        <td class="text-right font-bold">${summary.sales.gross.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="font-bold">Purchases (Inward Supplies / ITC)</td>
        <td class="text-center">${summary.purchases.count}</td>
        <td class="text-right">${summary.purchases.taxable.toFixed(2)}</td>
        <td class="text-right">${summary.purchases.cgst.toFixed(2)}</td>
        <td class="text-right">${summary.purchases.sgst.toFixed(2)}</td>
        <td class="text-right font-bold" style="color: #059669;">${summary.purchases.totalGst.toFixed(2)}</td>
        <td class="text-right font-bold">${summary.purchases.gross.toFixed(2)}</td>
      </tr>
      <tr style="background: #f8fafc; font-weight: 800;">
        <td>Net Position</td>
        <td class="text-center">${summary.totalTransactions}</td>
        <td class="text-right">-</td>
        <td class="text-right">${(summary.sales.cgst - summary.purchases.cgst).toFixed(2)}</td>
        <td class="text-right">${(summary.sales.sgst - summary.purchases.sgst).toFixed(2)}</td>
        <td class="text-right" style="color: ${netStatusColor};">₹${summary.netGstLiability.toFixed(2)}</td>
        <td class="text-right">${netStatusText}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">2. Outward Supplies (Sales Details) - ${filteredSales.length} Invoices</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Invoice #</th>
        <th>Customer</th>
        <th>Customer GSTIN</th>
        <th class="text-right">Taxable (₹)</th>
        <th class="text-right">CGST (₹)</th>
        <th class="text-right">SGST (₹)</th>
        <th class="text-right">GST (₹)</th>
        <th class="text-right">Total (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${filteredSales.length === 0 ? '<tr><td colspan="9" class="text-center" style="padding: 10px; color: #94a3b8;">No sales records found in this period.</td></tr>' : ''}
      ${filteredSales.map(s => `
        <tr>
          <td>${s.dateFormatted}</td>
          <td class="font-bold">${s.invoiceNo}</td>
          <td>${s.partyName}</td>
          <td>${s.partyGstin}</td>
          <td class="text-right">${s.taxableValue.toFixed(2)}</td>
          <td class="text-right">${s.cgst.toFixed(2)}</td>
          <td class="text-right">${s.sgst.toFixed(2)}</td>
          <td class="text-right font-bold">${s.totalGst.toFixed(2)}</td>
          <td class="text-right font-bold">${s.totalAmount.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">3. Inward Supplies (Purchase Details) - ${filteredPurchases.length} Orders</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Bill / Inv #</th>
        <th>Supplier</th>
        <th>Supplier GSTIN</th>
        <th class="text-right">Taxable (₹)</th>
        <th class="text-right">CGST (₹)</th>
        <th class="text-right">SGST (₹)</th>
        <th class="text-right">ITC GST (₹)</th>
        <th class="text-right">Total (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${filteredPurchases.length === 0 ? '<tr><td colspan="9" class="text-center" style="padding: 10px; color: #94a3b8;">No purchase records found in this period.</td></tr>' : ''}
      ${filteredPurchases.map(p => `
        <tr>
          <td>${p.dateFormatted}</td>
          <td class="font-bold">${p.invoiceNo}</td>
          <td>${p.partyName}</td>
          <td>${p.partyGstin}</td>
          <td class="text-right">${p.taxableValue.toFixed(2)}</td>
          <td class="text-right">${p.cgst.toFixed(2)}</td>
          <td class="text-right">${p.sgst.toFixed(2)}</td>
          <td class="text-right font-bold" style="color: #059669;">${p.totalGst.toFixed(2)}</td>
          <td class="text-right font-bold">${p.totalAmount.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>Generated on ${new Date().toLocaleString('en-IN')} • Gupta Traders Superstore ERP</div>
    <div>Authorized Signatory: _________________________</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    }
  </script>
</body>
</html>
`
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-5 animate-fadeIn">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* ─── Modal Header ───────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FaBalanceScale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">GST Report (वस्तु एवं सेवा कर रिपोर्ट)</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  GSTIN: {storeGstin}
                </span>
              </div>
              <p className="text-xs text-slate-400">Independent GST compliance ledger & transaction reporting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all cursor-pointer"
            title="Close (बंद करें)"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* ─── Filter Bar ─────────────────────────────────────── */}
        <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-blue-400 text-xs" />
              <span className="text-xs font-semibold text-slate-300">Period:</span>
              <select
                value={filterPeriod}
                onChange={(e) => {
                  setFilterPeriod(e.target.value)
                  if (e.target.value !== 'Custom Date Range') {
                    setAppliedCustomRange(null)
                  }
                }}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Year">This Year</option>
                <option value="Custom Date Range">Custom Date Range</option>
              </select>
            </div>

            {filterPeriod === 'Custom Date Range' && (
              <form onSubmit={handleGenerateCustomReport} className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">From:</span>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">To:</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-sm shadow-blue-500/20"
                >
                  Generate Report
                </button>
              </form>
            )}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Active: <span className="text-slate-200 font-bold">{periodLabel}</span>
          </div>
        </div>

        {/* ─── Summary Metric Cards ────────────────────────────── */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. Transactions */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Transactions</p>
              <p className="text-lg font-black text-slate-100 mt-0.5">{summary.totalTransactions}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {summary.sales.count} sales • {summary.purchases.count} purchases
              </p>
            </div>

            {/* 2. Output GST (Sales) */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Output GST (Sales)</p>
                <FaArrowUp className="text-blue-400 text-xs" />
              </div>
              <p className="text-lg font-black text-blue-400 mt-0.5">{formatINR(summary.sales.totalGst)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                CGST: {formatINR(summary.sales.cgst)} | SGST: {formatINR(summary.sales.sgst)}
              </p>
            </div>

            {/* 3. Input GST / ITC (Purchases) */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Input GST (ITC)</p>
                <FaArrowDown className="text-emerald-400 text-xs" />
              </div>
              <p className="text-lg font-black text-emerald-400 mt-0.5">{formatINR(summary.purchases.totalGst)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Eligible input tax credit on purchases
              </p>
            </div>

            {/* 4. Net GST Liability */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Position</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${summary.netGstLiability >= 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {summary.netGstLiability >= 0 ? 'PAYABLE' : 'CREDIT'}
                </span>
              </div>
              <p className={`text-lg font-black mt-0.5 ${summary.netGstLiability >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {formatINR(Math.abs(summary.netGstLiability))}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {summary.netGstLiability >= 0 ? 'Tax payable to government' : 'ITC credit carry forward'}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Tab Bar & Search ─────────────────────────────────── */}
        <div className="px-6 py-2.5 border-b border-slate-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              All Records ({filteredSales.length + filteredPurchases.length})
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'sales'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Sales (Outward) ({filteredSales.length})
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'purchases'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Purchases (ITC) ({filteredPurchases.length})
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search by invoice, customer, GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 px-3 py-1.5 pl-8 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            <FaSearch className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* ─── Table Content ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-[260px] scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3" />
              <p className="text-xs font-semibold">Loading GST transaction records...</p>
            </div>
          ) : combinedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <FaBalanceScale className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-bold text-slate-300">No GST transactions found</p>
              <p className="text-xs text-slate-500 mt-1">No sales or purchases match the selected timeframe ({periodLabel}).</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950/80 sticky top-0 z-10 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Inv / Bill No</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Party & GSTIN</th>
                  <th className="px-4 py-3 font-semibold text-right">Taxable (₹)</th>
                  <th className="px-4 py-3 font-semibold text-right">CGST (₹)</th>
                  <th className="px-4 py-3 font-semibold text-right">SGST (₹)</th>
                  <th className="px-4 py-3 font-semibold text-right">Total GST (₹)</th>
                  <th className="px-4 py-3 font-semibold text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {combinedList.map((item, idx) => (
                  <tr key={`${item.type}-${item.id || idx}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        item.type === 'Sale'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-200">{item.invoiceNo}</td>
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{item.dateFormatted}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-slate-200 truncate max-w-[180px]">{item.partyName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.partyGstin}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-300 tabular-nums">
                      {formatINR(item.taxableValue)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400 tabular-nums">
                      {formatINR(item.cgst)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400 tabular-nums">
                      {formatINR(item.sgst)}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${item.type === 'Sale' ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {formatINR(item.totalGst)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-100 tabular-nums">
                      {formatINR(item.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ─── Bottom Action Bar ───────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Showing <strong className="text-slate-200">{combinedList.length}</strong> GST records for <span className="text-blue-400 font-semibold">{periodLabel}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCSV}
              disabled={loading || combinedList.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <FaFileExcel className="text-sm" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={loading || combinedList.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <FaFilePdf className="text-sm" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

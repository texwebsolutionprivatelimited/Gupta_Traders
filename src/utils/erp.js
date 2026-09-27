export const formatINR=amount=>'₹'+Number(amount||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
export const unitOptions=['Piece','Kg','Gram','Litre','ML','Pack','Box','Bottle','Dozen','Meter','Other','pcs','kg','g','L','ml','pack','box','bottle','dozen','meter','other'].map(value=>({value,label:value}))
export const gstOptions=[0,5,12,18,28].map(value=>({value,label:`${value}%${value?' GST':' (No GST)'}`}))
export const generateNextSKU=()=>`SKU-${crypto.randomUUID().slice(0,8).toUpperCase()}`
export const generateNextProductCode=()=>`LC-${crypto.randomUUID().slice(0,8).toUpperCase()}`
export const generateNextBarcode=type=>type==='loose'?`9${Date.now().toString().slice(-6)}${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`:''
export function calculateItemGST(price,quantity,gstRate,isInclusive=false){const total=Number(price)*Number(quantity),rate=Number(gstRate||0);if(isInclusive){const base=total/(1+rate/100);return{baseAmount:base,gstAmount:total-base,totalAmount:total}}const gst=total*rate/100;return{baseAmount:total,gstAmount:gst,totalAmount:total+gst}}
export function calculateBillSummary(items,billDiscount=0,isInclusive=true){let subtotal=0,totalGST=0,itemDiscountTotal=0;items.forEach(item=>{const unitRate=Number((item.rate??item.price??item.sellingPrice)||0),gross=unitRate*Number(item.quantity||0),discount=gross*Number(item.itemDiscount||0)/100,taxable=gross-discount,rate=Number(item.gstRate||0);itemDiscountTotal+=discount;if(isInclusive){const base=taxable/(1+rate/100);subtotal+=base;totalGST+=taxable-base}else{subtotal+=taxable;totalGST+=taxable*rate/100}});const beforeDiscount=subtotal+totalGST,discountAmount=beforeDiscount*Number(billDiscount||0)/100,grandTotal=beforeDiscount-discountAmount;return{subtotal,totalGST,totalCGST:totalGST/2,totalSGST:totalGST/2,itemDiscountTotal,billDiscount:Number(billDiscount||0),billDiscountAmount:discountAmount,discountAmount,grandTotal,roundedTotal:Math.round(grandTotal)}}
export const iconPresets=['🛒','🍚','🌾','🍬','🧴','📦','🥛','⚖️']
export const colorPresets=['#10b981','#f59e0b','#ef4444','#d97706','#ec4899','#eab308','#f97316','#06b6d4','#8b5cf6','#6366f1','#3b82f6','#dc2626','#14b8a6']

export function numberToWordsINR(amount) {
  const num = Math.round(Number(amount || 0) * 100) / 100
  if (isNaN(num) || num <= 0) return 'Rupees Zero Only'

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertTwoDigits(n) {
    if (n < 20) return ones[n]
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
  }

  function convertThreeDigits(n) {
    let str = ''
    if (Math.floor(n / 100) > 0) {
      str += ones[Math.floor(n / 100)] + ' Hundred'
      if (n % 100) str += ' '
    }
    if (n % 100 > 0) {
      str += convertTwoDigits(n % 100)
    }
    return str
  }

  const intPart = Math.floor(num)
  const decPart = Math.round((num - intPart) * 100)

  let words = ''
  const crore = Math.floor(intPart / 10000000)
  const lakh = Math.floor((intPart % 10000000) / 100000)
  const thousand = Math.floor((intPart % 100000) / 1000)
  const remainder = intPart % 1000

  if (crore > 0) words += convertTwoDigits(crore) + ' Crore '
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh '
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand '
  if (remainder > 0) words += convertThreeDigits(remainder)

  words = words.trim()
  if (!words) words = 'Zero'

  let result = 'Rupees ' + words
  if (decPart > 0) {
    result += ' and ' + convertTwoDigits(decPart) + ' Paise'
  }
  result += ' Only'
  return result
}


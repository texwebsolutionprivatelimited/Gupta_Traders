import AdminAccess from '../login/AdminAccess'
import ManagerAccess from '../login/ManagerAccess'
import CashierAccess from '../login/CashierAccess'

export default function Dashboard() {
  const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'Admin'

  if (role === 'Manager') {
    return <ManagerAccess />
  }
  if (role === 'Cashier') {
    return <CashierAccess />
  }
  return <AdminAccess />
}

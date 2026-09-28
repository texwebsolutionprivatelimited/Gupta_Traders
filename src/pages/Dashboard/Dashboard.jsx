import AdminAccess from '../login/AdminAccess'
import CashierAccess from '../login/CashierAccess'
import { useAuth } from '../../context/AuthContext'

export default function Dashboard() {
  const { role } = useAuth()

  if (role === 'cashier') {
    return <CashierAccess />
  }
  return role === 'admin' ? <AdminAccess /> : null
}

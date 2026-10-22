import { useSelector } from 'react-redux'
import EmployeeDashboard from './EmployeeDashboard'
import ManagerDashboard from './ManagerDashboard'
import HRDashboard from './HRDashboard'

// Shows the dashboard that matches the logged-in role
export default function Dashboard() {
  const { user } = useSelector((s) => s.auth)
  if (user.role === 'hr') return <HRDashboard />
  if (user.role === 'manager') return <ManagerDashboard />
  return <EmployeeDashboard />
}

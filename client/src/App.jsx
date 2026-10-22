import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { fetchMe } from './store/authSlice'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Loader from './components/Loader'

// Lazy loading: every page is downloaded only when it is first opened
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Leaves = lazy(() => import('./pages/Leaves'))
const LeaveRequests = lazy(() => import('./pages/LeaveRequests'))
const Announcements = lazy(() => import('./pages/Announcements'))
const Trainings = lazy(() => import('./pages/Trainings'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Team = lazy(() => import('./pages/manager/Team'))
const TeamAttendance = lazy(() => import('./pages/manager/TeamAttendance'))
const Employees = lazy(() => import('./pages/hr/Employees'))
const Managers = lazy(() => import('./pages/hr/Managers'))
const AttendanceTracking = lazy(() => import('./pages/hr/AttendanceTracking'))
const Reports = lazy(() => import('./pages/hr/Reports'))

export default function App() {
  const dispatch = useDispatch()
  useEffect(() => { dispatch(fetchMe()) }, [dispatch])

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* everything below needs a login and uses the sidebar layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/trainings" element={<Trainings />} />
          <Route path="/notifications" element={<Notifications />} />

          <Route path="/team" element={<ProtectedRoute roles={['manager']}><Team /></ProtectedRoute>} />
          <Route path="/team/attendance" element={<ProtectedRoute roles={['manager']}><TeamAttendance /></ProtectedRoute>} />
          <Route path="/leave-requests" element={<ProtectedRoute roles={['manager', 'hr']}><LeaveRequests /></ProtectedRoute>} />

          <Route path="/hr/employees" element={<ProtectedRoute roles={['hr']}><Employees /></ProtectedRoute>} />
          <Route path="/hr/managers" element={<ProtectedRoute roles={['hr']}><Managers /></ProtectedRoute>} />
          <Route path="/hr/attendance" element={<ProtectedRoute roles={['hr']}><AttendanceTracking /></ProtectedRoute>} />
          <Route path="/hr/reports" element={<ProtectedRoute roles={['hr']}><Reports /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

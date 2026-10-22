import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Loader from './Loader'

// Shell for every logged-in page: sidebar + top bar + page content
export default function Layout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="main">
        <Navbar onMenu={() => setOpen(true)} />
        <main className="content">
          <Suspense fallback={<Loader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

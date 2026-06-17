import { NavLink, Outlet } from 'react-router-dom'
import './layout.css'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/products', label: 'Products' },
  { to: '/customers', label: 'Customers' },
  { to: '/orders', label: 'Orders' },
]

export default function Layout() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Ethara</div>
        <div className="topbarUser">Admin</div>
      </header>

      <div className="body">
        <aside className="sidebar">
          <nav className="sidebarNav">
            {navItems.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}>
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

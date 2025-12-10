import { Link, useLocation } from 'react-router-dom'
import { cn } from '../utils/cn'

export default function AppLayout({ children }) {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="text-xl font-bold text-blue-600">
                Webloom
              </Link>
              <div className="flex items-center gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-blue-600',
                      location.pathname === item.path ? 'text-blue-600' : 'text-gray-600'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}


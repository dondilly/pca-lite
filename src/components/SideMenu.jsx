import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const primaryNavigation = [
  ['Dashboard', 'speedometer2', '/'],
  ['Orders', 'cart', '/orders'],
  ['Items', 'box-seam', '/items'],
  ['Customers', 'people', '/customers'],
  ['Vendors', 'truck', '/vendors'],
  ['Main Categories', 'tags', '/main-categories'],
  ['Subcategories', 'tag', '/sub-categories'],
  ['Account Groups', 'collection', '/account-groups'],
  ['Accounts', 'journal-text', '/accounts'],
  ['Reports', 'bar-chart-line', '/reports'],
  ['Integrations', 'puzzle', '/integrations'],
]

const adminNavigation = [
  ['Settings', 'gear', '/settings'],
  ['Security', 'shield-check', '/security'],
  ['Help & Support', 'question-circle', '/help'],
]

function SideMenu({ mobileSidebarOpen = false, onClose }) {
  const location = useLocation()
  const isOrdersActive = location.pathname.startsWith('/orders')
  const [ordersExpanded, setOrdersExpanded] = useState(() => isOrdersActive)

  return (
    
    <aside
      className={`admin-sidebar${mobileSidebarOpen ? ' show' : ''}`}
      id="admin-sidebar"
    >
      <div className="sidebar-content">
        <nav className="sidebar-nav" aria-label="Main navigation">
          <ul className="nav flex-column">
            {primaryNavigation.map(([label, icon, path], index) => (
              <li className="nav-item" key={label}>
                {index === 0 && (
                  <small className="text-muted px-3 text-uppercase fw-bold">
                    Workspace
                  </small>
                )}
                {label === 'Orders' ? (
                  <>
                    <button
                      type="button"
                      className={`nav-link w-100 text-start${isOrdersActive ? ' active' : ''}`}
                      data-bs-toggle="collapse"
                      aria-expanded={ordersExpanded}
                      aria-controls="orders-submenu"
                      onClick={() => setOrdersExpanded((expanded) => !expanded)}
                    >
                      <i className={`bi bi-${icon}`} aria-hidden="true" />
                      <span>{label}</span>
                      <i className="bi bi-chevron-down ms-auto" aria-hidden="true" />
                    </button>
                    {ordersExpanded && (
                      <ul className="nav nav-submenu" id="orders-submenu">
                        <li className="nav-item">
                          <NavLink
                            to="/orders/add-sales"
                            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                            onClick={onClose}
                          >
                            <span>Add Sales</span>
                          </NavLink>
                        </li>
                        <li className="nav-item">
                          <NavLink
                            to="/orders/sales-list"
                            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                            onClick={onClose}
                          >
                            <span>Sales List</span>
                          </NavLink>
                        </li>
                        <li className="nav-item">
                          <NavLink
                            to="/orders/receipts"
                            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                            onClick={onClose}
                          >
                            <span>Receipts</span>
                          </NavLink>
                        </li>
                      </ul>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={path}
                    end={path === '/'}
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    onClick={onClose}
                  >
                    <i className={`bi bi-${icon}`} aria-hidden="true" />
                    <span>{label}</span>
                  </NavLink>
                )}
              </li>
            ))}
            <li className="nav-item">
              <small className="text-muted px-3 text-uppercase fw-bold">
                Admin
              </small>
            </li>
            {adminNavigation.map(([label, icon, path]) => (
              <li className="nav-item" key={label}>
                <NavLink
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  to={path}
                  onClick={onClose}
                >
                  <i className={`bi bi-${icon}`} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}

export default SideMenu

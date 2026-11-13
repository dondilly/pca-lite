import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const primaryNavigation = [
  ['Dashboard', 'speedometer2', '/'],
  [
    'Orders',
    'cart',
    '/orders',
    [
      ['Add Sales', 'orders/add-sales'],
      ['Sales List', 'orders/invoice-list'],
      ['Receipts', '/orders/receipt-list'],
    ],
  ],
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
  const [expandedMenus, setExpandedMenus] = useState({})

  return (
    <aside
      className={`admin-sidebar${mobileSidebarOpen ? ' show' : ''}`}
      id="admin-sidebar"
    >
      <div className="sidebar-content">
        <nav className="sidebar-nav" aria-label="Main navigation">
          <ul className="nav flex-column">
            {primaryNavigation.map(([label, icon, path, children], index) => {
              const isActive =
                path === '/'
                  ? location.pathname === '/'
                  : location.pathname === path ||
                    location.pathname.startsWith(`${path}/`)
              const isExpanded = expandedMenus[label] ?? isActive
              const submenuId = `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-submenu`

              return (
                <li className="nav-item" key={label}>
                  {index === 0 && (
                    <small className="text-muted px-3 text-uppercase fw-bold">
                      Workspace
                    </small>
                  )}
                  {children?.length ? (
                    <>
                      <button
                        type="button"
                        className={`nav-link w-100 text-start${isActive ? ' active' : ''}`}
                        data-bs-toggle="collapse"
                        aria-expanded={isExpanded}
                        aria-controls={submenuId}
                        onClick={() =>
                          setExpandedMenus((current) => ({
                            ...current,
                            [label]: !(current[label] ?? isActive),
                          }))
                        }
                      >
                        <i className={`bi bi-${icon}`} aria-hidden="true" />
                        <span>{label}</span>
                        <i className="bi bi-chevron-down ms-auto" aria-hidden="true" />
                      </button>
                      {isExpanded && (
                        <ul className="nav nav-submenu" id={submenuId}>
                          {children.map(([childLabel, childPath]) => (
                            <li className="nav-item" key={childPath}>
                              <NavLink
                                to={childPath}
                                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                                onClick={onClose}
                              >
                                <span>{childLabel}</span>
                              </NavLink>
                            </li>
                          ))}
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
              )
            })}
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

import { NavLink } from 'react-router-dom'

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
                <NavLink
                  to={path}
                  end={path === '/'}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  <i className={`bi bi-${icon}`} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
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

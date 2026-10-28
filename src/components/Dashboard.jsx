import { useEffect, useState } from 'react'
import logo from '../metis/assets/images/logo.svg'
import avatar from '../metis/assets/images/avatar-placeholder.svg'
import '@fontsource-variable/inter'
import '../metis/styles/scss/main.scss'
import '../App.css'
import { getRestData, getSelectedBranch } from '../api/auth.js'
import { Route, Routes } from 'react-router-dom'
import SideMenu from './SideMenu.jsx'
import Items from './Items.jsx'
import Customers from './Customers.jsx'
import Vendors from './Vendors.jsx'
import MainCategories from './MainCategories.jsx'
import SubCategories from './SubCategories.jsx'
import AccountGroup from './AccountGroup.jsx'
import Accounts from './Accounts.jsx'

const stats = [
  { label: 'Total users', value: '12,426', change: '+12.5%', icon: 'people', positive: true },
  { label: 'Revenue', value: '$54,320', change: '+8.2%', icon: 'graph-up', positive: true },
  { label: 'Orders', value: '1,852', change: '-2.1%', icon: 'bag-check', positive: false },
  { label: 'Avg. response', value: '2.3s', change: '+5.4%', icon: 'clock-history', positive: true },
]

async function fetchCustomersRankingBySales(branchId) {
  const endpoint = new URL(
    'http://localhost:8080/Inventory/api/dashboard/getCustomersRankingBySales',
  )
  endpoint.searchParams.set('X-Branch-Id', String(branchId))

  const response = await getRestData(endpoint)
  const customers = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : null

  if (!customers) {
    throw new Error('The customer ranking response was not a list.')
  }

  return customers
}



async function fetchItemsRankingBySales(branchId) {
  const endpoint = new URL(
    'http://localhost:8080/Inventory/api/dashboard/getProductRankingBySales',
  )
  endpoint.searchParams.set('X-Branch-Id', String(branchId))

  const response = await getRestData(endpoint)
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : null

  if (!items) {
    throw new Error('The items ranking response was not a list.')
  }

  return items
}

function MenuPage({ title }) {
  return (
    <div className="container-fluid p-4 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">{title}</h1>
      </div>
      <section className="card">
        <div className="card-body">
          <p className="mb-0">{title} page</p>
        </div>
      </section>
    </div>
  )
}

function Dashboard() {
  const selectedBranchId = getSelectedBranch()
  const [theme, setTheme] = useState('light')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [customers, setCustomers] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [items, setItems] = useState([])
  const [dataError, setDataError] = useState('')

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
  }, [theme])

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      try {
        if (selectedBranchId == null) {
          throw new Error('No branch is selected.')
        }

        const customerData = await fetchCustomersRankingBySales(selectedBranchId)
        const itemData = await fetchItemsRankingBySales(selectedBranchId)
        if (isMounted) {
          setCustomers(customerData)
          setItems(itemData)
        }
      } catch (error) {
        if (isMounted) {
          setDataError(
            error instanceof Error ? error.message : 'Unable to load customer rankings.',
          )
        }
      } finally {
        if (isMounted) {
          setDataLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [selectedBranchId])



  function toggleSidebar() {
    if (window.matchMedia('(max-width: 991.98px)').matches) {
      setMobileSidebarOpen((isOpen) => !isOpen)
      return
    }

    setSidebarCollapsed((isCollapsed) => !isCollapsed)
  }

  return (
    <div
      className={`admin-wrapper${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}
      id="admin-wrapper"
    >
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header className="admin-header">
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
          <div className="container-fluid">
            <a className="navbar-brand d-flex align-items-center" href="#dashboard">
              <img src={logo} alt="" height="32" className="d-inline-block align-text-top me-2" />
              <span className="h4 mb-0 fw-bold text-primary-emphasis">Metis</span>
            </a>

            <button
              className={`hamburger-menu${sidebarCollapsed ? ' is-active' : ''}`}
              type="button"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              aria-expanded={mobileSidebarOpen || !sidebarCollapsed}
            >
              <i className="bi bi-list" aria-hidden="true" />
            </button>

            <div className="search-container flex-grow-1 mx-4">
              <div className="position-relative">
                <input className="form-control" type="search" placeholder="Search..." aria-label="Search" />
                <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-3" aria-hidden="true" />
              </div>
            </div>

            <div className="navbar-nav flex-row">
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                title="Toggle theme"
              >
                <i className={`bi bi-${theme === 'light' ? 'moon-fill' : 'sun-fill'}`} aria-hidden="true" />
              </button>
              <button className="btn btn-outline-secondary position-relative" type="button" aria-label="Notifications">
                <i className="bi bi-bell" aria-hidden="true" />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">3</span>
              </button>
              <button className="btn btn-outline-secondary d-flex align-items-center" type="button">
                <img src={avatar} alt="" width="24" height="24" className="rounded-circle me-2" />
                <span className="d-none d-md-inline">Admin</span>
                <i className="bi bi-chevron-down ms-1" aria-hidden="true" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      <SideMenu
        mobileSidebarOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <button
        className={`sidebar-backdrop${mobileSidebarOpen ? ' show' : ''}`}
        type="button"
        aria-label="Close navigation"
        onClick={() => setMobileSidebarOpen(false)}
      />

      <main id="main-content" className="admin-main">
        <Routes>
          <Route path="/" element={<div className="container-fluid p-4 p-lg-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
            <div>
              <h1 className="h3 mb-0">Dashboard</h1>
              <p className="text-muted mb-0">Your business at a glance</p>
            </div>
            <div className="d-flex gap-2 flex-shrink-0">
              <button className="btn btn-primary" type="button">
                <i className="bi bi-plus-lg me-2" aria-hidden="true" />
                <span>New item</span>
              </button>
              <button className="btn btn-outline-secondary" type="button" aria-label="Refresh data" title="Refresh data">
                <i className="bi bi-arrow-clockwise" aria-hidden="true" />
              </button>
              <button className="btn btn-outline-secondary d-none d-sm-inline-block" type="button" aria-label="Export data" title="Export data">
                <i className="bi bi-download" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="row g-3 g-lg-4 mb-4">
            {stats.map((stat) => (
              <div className="col-sm-6 col-xl-3" key={stat.label}>
                <section className="card stats-card h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="stats-icon me-3">
                        <i className={`bi bi-${stat.icon}`} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="h6 mb-0 text-muted">{stat.label}</p>
                        <h2 className="h3 mb-1">{stat.value}</h2>
                        <small className={stat.positive ? 'text-success-emphasis' : 'text-danger-emphasis'}>
                          <i className={`bi bi-arrow-${stat.positive ? 'up' : 'down'}`} aria-hidden="true" /> {stat.change}
                        </small>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            ))}
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <section className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h2 className="card-title">Revenue overview</h2>
                  <button className="btn btn-sm btn-outline-secondary" type="button">Last 7 days</button>
                </div>
                <div className="card-body">
                  <div className="chart-summary mb-3">
                    <span className="h3 mb-0">$18,240</span>
                    <span className="text-success-emphasis ms-2"><i className="bi bi-arrow-up" aria-hidden="true" /> 8.2%</span>
                  </div>
                  <div className="dashboard-chart" role="img" aria-label="Revenue trending upward over the last seven days">
                    <div className="chart-y-labels" aria-hidden="true">
                      <span>$20k</span><span>$15k</span><span>$10k</span><span>$5k</span><span>$0</span>
                    </div>
                    <svg viewBox="0 0 720 220" preserveAspectRatio="none" aria-hidden="true">
                      <defs>
                        <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="var(--bs-primary)" stopOpacity=".18" />
                          <stop offset="100%" stopColor="var(--bs-primary)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path className="chart-gridline" d="M0 20H720 M0 65H720 M0 110H720 M0 155H720 M0 200H720" />
                      <path d="M0 171 C38 160 50 167 83 145 S137 158 171 119 S221 130 257 107 S307 120 343 88 S391 108 428 74 S480 92 514 65 S565 74 600 50 S655 55 720 25 V200 H0Z" fill="url(#revenue-fill)" />
                      <path className="chart-line" d="M0 171 C38 160 50 167 83 145 S137 158 171 119 S221 130 257 107 S307 120 343 88 S391 108 428 74 S480 92 514 65 S565 74 600 50 S655 55 720 25" />
                    </svg>
                    <div className="chart-x-labels" aria-hidden="true">
                      <span>Oct 15</span><span>Oct 16</span><span>Oct 17</span><span>Oct 18</span><span>Oct 19</span><span>Oct 20</span><span>Oct 21</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-lg-4">
              <section className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h2 className="card-title">Recent activity</h2>
                  <a href="#activity" className="small">View all</a>
                </div>
                <ul className="list-group list-group-flush activity-list">
                  <li className="list-group-item d-flex gap-3">
                    <span className="activity-dot bg-primary" />
                    <div><strong>New user registered</strong><div className="text-muted small">Sophia Chen joined the team</div><time className="text-muted small">12 minutes ago</time></div>
                  </li>
                  <li className="list-group-item d-flex gap-3">
                    <span className="activity-dot bg-success" />
                    <div><strong>Order completed</strong><div className="text-muted small">Order #ORD-7239 was completed</div><time className="text-muted small">38 minutes ago</time></div>
                  </li>
                  <li className="list-group-item d-flex gap-3">
                    <span className="activity-dot bg-warning" />
                    <div><strong>Payment pending</strong><div className="text-muted small">Order #ORD-7238 needs attention</div><time className="text-muted small">1 hour ago</time></div>
                  </li>
                  <li className="list-group-item d-flex gap-3">
                    <span className="activity-dot bg-info" />
                    <div><strong>Report is ready</strong><div className="text-muted small">Your weekly report is available</div><time className="text-muted small">3 hours ago</time></div>
                  </li>
                </ul>
              </section>
            </div>
          </div>

          <section className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h2 className="card-title">Customers ranked by sales</h2>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Customer Name</th>
                    <th scope="col">Amount</th>
                  </tr>
                </thead>

                <tbody>
                    {dataLoading ? (
                      <tr><td colSpan={3} className="text-center py-4">Loading customer rankings…</td></tr>
                    ) : dataError ? (
                      <tr><td colSpan={3} className="text-center text-danger py-4" role="alert">{dataError}</td></tr>
                    ) : customers.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-4">No customer ranking data available.</td></tr>
                    ) : (
                      customers.map((c, index) => (
                        <tr key={c.id}>
                          <td>{index + 1}</td>
                          <td>{c.customer}</td>
                          <td>{c.amount}</td>
                        </tr>
                      ))
                    )}
                  
                </tbody>
              </table>
            </div>
          </section>

          <section className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h2 className="card-title">Items ranked by sales</h2>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">ItemName</th>
                    <th scope="col">Amount</th>
                  </tr>
                </thead>

                <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-4">No item ranking data available.</td></tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item.item}</td>
                          <td>{item.amount}</td>
                        </tr>
                      ))
                    )}
                  
                </tbody>
              </table>
            </div>
          </section>

          </div>} />
          <Route path="/orders" element={<MenuPage title="Orders" />} />
          <Route
            path="/items"
            element={<Items />}
          />
          <Route
            path="/customers"
            element={<Customers customers={customers} loading={dataLoading} error={dataError} />}
          />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/main-categories" element={<MainCategories />} />
          <Route path="/sub-categories" element={<SubCategories />} />
          <Route path="/account-groups" element={<AccountGroup />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/reports" element={<MenuPage title="Reports" />} />
          <Route path="/integrations" element={<MenuPage title="Integrations" />} />
          <Route path="/settings" element={<MenuPage title="Settings" />} />
          <Route path="/security" element={<MenuPage title="Security" />} />
          <Route path="/help" element={<MenuPage title="Help & Support" />} />
          <Route path="*" element={<MenuPage title="Page not found" />} />
        </Routes>
      </main>
      <footer className="admin-footer px-4">
        <div className="container-fluid d-flex justify-content-between flex-wrap gap-2">
          <span className="text-muted small">© 2026 PCA Lite</span>
          <span className="text-muted small">Powered by Scopefountain Server Chain</span>
        </div>
      </footer>
    </div>
  )
}

export default Dashboard

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setMobileSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    {
      path: "/admin",
      icon: "bi-speedometer2",
      label: "Dashboard",
      exact: true,
    },
    {
      path: "/admin/payments",
      icon: "bi-credit-card",
      label: "Manajemen Pembayaran",
    },
    {
      path: "/admin/selection-and-placement",
      icon: "bi-clipboard-check",
      label: "Manajemen Seleksi & Penyaluran",
    },
    {
      path: "/admin/financial-reports",
      icon: "bi-graph-up",
      label: "Laporan Keuangan",
    },
    {
      path: "/admin/programs",
      icon: "bi-journal-text",
      label: "Manajemen Program",
    },
    {
      path: "/admin/users",
      icon: "bi-people",
      label: "Manajemen User",
    },
  ];

  const isActive = (menuItem) => {
    if (menuItem.exact) {
      return location.pathname === menuItem.path;
    }
    return (
      location.pathname === menuItem.path ||
      location.pathname.startsWith(menuItem.path + "/")
    );
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const handleMenuClick = () => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <div className="admin-layout">
      {/* Sidebar untuk Desktop */}
      {!isMobile && (
        <div
          className={`sidebar bg-primary text-white ${sidebarCollapsed ? "collapsed" : ""
            }`}
        >
          <div className="sidebar-header d-flex align-items-center justify-content-between p-3 border-bottom">
            {!sidebarCollapsed && (
              <div>
                <h5 className="mb-0 text-white">FITALENTA</h5>
                <small className="text-white">Admin Panel</small>
              </div>
            )}
            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
            >
              <i
                className={`bi ${sidebarCollapsed ? "bi-chevron-right" : "bi-chevron-left"
                  }`}
              ></i>
            </button>
          </div>

          <ul className="sidebar-menu list-unstyled mb-0">
            {menuItems.map((item) => (
              <li key={item.path} className="menu-item">
                <Link
                  to={item.path}
                  className={`menu-link d-flex align-items-center text-white p-3 text-decoration-none ${isActive(item) ? "active" : ""
                    }`}
                  title={sidebarCollapsed ? item.label : ""}
                >
                  <i
                    className={`bi ${item.icon} ${sidebarCollapsed ? "fs-5 mx-auto" : "me-3"
                      }`}
                    style={{ width: "20px", textAlign: "center" }}
                  ></i>
                  {!sidebarCollapsed && (
                    <span className="flex-grow-1 text-start">{item.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="sidebar-footer p-3 border-top">
            <button
              className="btn btn-outline-light btn-sm w-100"
              onClick={handleLogout}
              title={sidebarCollapsed ? "Logout" : ""}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              {!sidebarCollapsed && "Logout"}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && mobileSidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <div
          className={`mobile-sidebar bg-primary text-white ${mobileSidebarOpen ? "open" : ""
            }`}
        >
          <div className="sidebar-header d-flex align-items-center justify-content-between p-3 border-bottom">
            <div>
              <h5 className="mb-0 text-white">FITALENTA</h5>
              <small className="text-white">Admin Panel</small>
            </div>
            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <i className="bi bi-x"></i>
            </button>
          </div>

          <ul className="sidebar-menu list-unstyled mb-0">
            {menuItems.map((item) => (
              <li key={item.path} className="menu-item">
                <Link
                  to={item.path}
                  className={`menu-link d-flex align-items-center text-white p-3 text-decoration-none ${isActive(item) ? "active" : ""
                    }`}
                  onClick={handleMenuClick}
                >
                  <i
                    className={`bi ${item.icon} me-3`}
                    style={{ width: "20px", textAlign: "center" }}
                  ></i>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="sidebar-footer p-3 border-top">
            <button
              className="btn btn-outline-light btn-sm w-100"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`main-content ${isMobile ? "mobile" : ""} ${sidebarCollapsed && !isMobile ? "expanded" : ""
          }`}
      >
        {/* Topbar */}
        <div className="topbar bg-white border-bottom shadow-sm">
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center py-2 py-md-3">
              <div className="d-flex align-items-center">
                {/* Mobile Menu Toggle */}
                {isMobile && (
                  <button
                    className="btn btn-outline-secondary me-2 me-md-3"
                    onClick={toggleMobileSidebar}
                    aria-label="Open menu"
                  >
                    <i className="bi bi-list"></i>
                  </button>
                )}
              </div>
              <div className="d-flex align-items-center">
                <div className="dropdown">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <div
                      className="user-avatar bg-primary rounded-circle d-inline-flex align-items-center justify-content-center me-2"
                      style={{ width: "32px", height: "32px" }}
                    >
                      <i className="bi bi-person-fill text-white"></i>
                    </div>
                    <span className="d-none d-md-inline">
                      {user?.full_name || "Admin"}
                    </span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area p-2 p-md-4">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
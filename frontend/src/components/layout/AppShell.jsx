import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell() {
  // sidebarOpen = desktop collapsed/expanded
  // mobileOpen  = mobile drawer open/closed
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const location = useLocation();

  // Close the mobile drawer on every navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close drawer when screen grows past mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e) => { if (e.matches) setMobileOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleMobile  = () => setMobileOpen(v => !v);
  const closeMobile   = () => setMobileOpen(false);

  return (
    <div className="app-shell">
      {/* ── Mobile backdrop ─────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
      />

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="app-main">
        <Topbar
          onMenuToggle={toggleMobile}
          mobileOpen={mobileOpen}
        />
        <Outlet />
      </div>
    </div>
  );
}

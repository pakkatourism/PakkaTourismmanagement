import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useNotificationStore from '../../store/useNotificationStore';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard', '/admin': 'Admin Dashboard',
  '/attendance': 'Smart Attendance', '/leads': 'Lead Pipeline',
  '/quotes': 'Quote Builder', '/matrix': 'Tariff Matrix',
  '/pricing': 'Pricing Engine', '/bookings': 'Booking Management',
  '/vendors': 'Vendor Management', '/finance': 'Financial Ledger',
  '/itinerary': 'Itinerary Builder', '/analytics': 'Analytics',
  '/whatsapp': 'WhatsApp Automation', '/exports': 'Excel Export',
  '/settings': 'Settings',
};

const TYPE_ICONS = {
  lead_assigned: '👤', lead_reassigned: '🔄', followup_reminder: '⏰',
  followup_overdue: '⚠️', lead_converted: '🎉', lead_lost: '❌',
  attendance_marked: '✅', geofence_failure: '📍', quote_sent: '📄',
  advance_received: '💰', booking_confirmed: '🎊', general: 'ℹ️'
};

const TYPE_COLORS = {
  lead_assigned: '#3B82F6', lead_reassigned: '#8B5CF6', followup_reminder: '#F59E0B',
  followup_overdue: '#EF4444', lead_converted: '#10B981', lead_lost: '#EF4444',
  attendance_marked: '#10B981', geofence_failure: '#EF4444', quote_sent: '#3B82F6',
  advance_received: '#10B981', booking_confirmed: '#10B981', general: '#64748B'
};

function timeAgo(date) {
  const secs = Math.floor((new Date() - new Date(date)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ── Premium Notification Panel ─────────────────────────────────
function NotificationPanel({ notifications, unreadCount, markRead, markAllRead, onNavigate, onClose }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <>
      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bellRing {
          0%,100% { transform: rotate(0deg); }
          15%     { transform: rotate(15deg); }
          30%     { transform: rotate(-12deg); }
          45%     { transform: rotate(10deg); }
          60%     { transform: rotate(-8deg); }
          75%     { transform: rotate(5deg); }
        }
        .notif-item {
          display: flex; gap: 12px; padding: 14px 16px; cursor: pointer;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          transition: background 0.15s;
          position: relative;
        }
        .notif-item:hover { background: rgba(59,130,246,0.04) !important; }
        .notif-item:last-child { border-bottom: none; }
        .notif-icon-wrap {
          width: 38px; height: 38px; border-radius: 12px;
          display: grid; place-items: center; font-size: 17px;
          flex-shrink: 0; position: relative;
        }
        .notif-panel-scroll::-webkit-scrollbar { width: 4px; }
        .notif-panel-scroll::-webkit-scrollbar-track { background: transparent; }
        .notif-panel-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 99px; }
      `}</style>

      <div style={{
        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
        width: 'min(380px, calc(100vw - 24px))',
        background: 'var(--color-bg-surface, #fff)',
        border: '1px solid var(--color-border, #E2E8F0)',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
        zIndex: 500, overflow: 'hidden',
        animation: 'notifSlideIn 0.22s cubic-bezier(0.34,1.2,0.64,1)',
        maxHeight: '78vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '16px 18px 12px',
          background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '10px',
                background: 'rgba(255,255,255,0.15)',
                display: 'grid', placeItems: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Notifications</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </div>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.12)', color: '#fff',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              >
                ✓ Mark all read
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '3px' }}>
            {[['all', 'All'], ['unread', `Unread (${unreadCount})`]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 600,
                  background: filter === val ? '#fff' : 'transparent',
                  color: filter === val ? '#1E40AF' : 'rgba(255,255,255,0.7)',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Notification List ── */}
        <div className="notif-panel-scroll" style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                {filter === 'unread' ? '🎉' : '🔔'}
              </div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary, #1E293B)', marginBottom: '4px' }}>
                {filter === 'unread' ? 'All caught up!' : 'No notifications'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #64748B)' }}>
                {filter === 'unread' ? "You've read all your notifications" : 'New notifications will appear here'}
              </div>
            </div>
          ) : (
            filtered.slice(0, 25).map((n, idx) => {
              const typeColor = TYPE_COLORS[n.type] || '#64748B';
              return (
                <div
                  key={n._id}
                  className="notif-item"
                  onClick={() => { if (!n.read) markRead(n._id); if (n.actionUrl) onNavigate(n.actionUrl); onClose(); }}
                  style={{
                    background: !n.read
                      ? `linear-gradient(90deg, ${typeColor}08 0%, transparent 100%)`
                      : 'transparent',
                  }}
                >
                  {/* Unread indicator bar */}
                  {!n.read && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: '3px', height: '60%', borderRadius: '0 2px 2px 0',
                      background: typeColor,
                    }} />
                  )}

                  {/* Icon */}
                  <div className="notif-icon-wrap" style={{ background: `${typeColor}15` }}>
                    <span>{TYPE_ICONS[n.type] || '🔔'}</span>
                    {!n.read && (
                      <div style={{
                        position: 'absolute', top: -2, right: -2,
                        width: 8, height: 8, borderRadius: '50%',
                        background: typeColor,
                        border: '2px solid var(--color-bg-surface, #fff)',
                      }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: n.read ? 500 : 700,
                      color: 'var(--color-text-primary, #1E293B)',
                      lineHeight: 1.4, marginBottom: '3px',
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}>
                      {n.title}
                    </div>
                    <div style={{
                      fontSize: '12px', color: 'var(--color-text-muted, #64748B)',
                      lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {n.message}
                    </div>
                    <div style={{
                      fontSize: '10px', color: 'var(--color-text-muted, #94A3B8)',
                      marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <span style={{
                        display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                        background: typeColor, opacity: 0.7,
                      }} />
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>

                  {/* Chevron */}
                  {n.actionUrl && (
                    <div style={{ flexShrink: 0, color: 'var(--color-text-muted, #CBD5E1)', marginTop: '2px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        {notifications.length > 0 && (
          <div style={{
            padding: '10px 16px', borderTop: '1px solid var(--color-border, #E2E8F0)',
            background: 'var(--color-bg-secondary, #F8FAFC)',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #94A3B8)', textAlign: 'center' }}>
              Showing latest {Math.min(filtered.length, 25)} of {notifications.length} notifications
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Topbar ────────────────────────────────────────────────
export default function Topbar({ onMenuToggle, mobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, token } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markRead, markAllRead, connectSocket, disconnectSocket } = useNotificationStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');
  const notifRef = useRef(null);

  const pageTitle = PAGE_TITLES[location.pathname] || 'Pakka Tourism';

  useEffect(() => {
    if (token) {
      connectSocket(token);
      fetchNotifications();
      if (Notification.permission === 'default') Notification.requestPermission();
    }
    return () => disconnectSocket();
  }, [token]);

  useEffect(() => {
    if (token) fetchNotifications();
  }, [location.pathname]);

  // Close notification panel on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    setTheme(next);
  };

  // Profile photo resolver
  const API_BASE = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : '';
  const profilePhotoUrl = user?.profilePhoto
    ? (user.profilePhoto.startsWith('http') ? user.profilePhoto : `${API_BASE}${user.profilePhoto}`)
    : null;

  const ROLE_COLORS = { admin: '#2563EB', employee: '#059669' };
  const roleColor = ROLE_COLORS[user?.role] || '#64748B';

  return (
    <header className="app-topbar">
      {/* Left */}
      <div className="topbar-left">
        <button
          className="btn btn-ghost btn-icon btn-sm topbar-hamburger"
          onClick={onMenuToggle}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
        <div>
          <div className="topbar-breadcrumb">Pakka Tourism</div>
          <div className="topbar-page">{pageTitle}</div>
        </div>
      </div>

      {/* Right */}
      <div className="topbar-right">
        {/* Role Badge */}
        <span className="badge topbar-role-badge" style={{ background: `${roleColor}18`, color: roleColor, borderColor: `${roleColor}30`, fontSize: '11px', fontWeight: 700 }}>
          {user?.role?.toUpperCase()}
        </span>

        {/* Theme Toggle */}
        <button className="btn btn-ghost btn-icon btn-sm topbar-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 12.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" /></svg>
          )}
        </button>

        {/* 🔔 Notifications Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setNotifOpen(o => !o)}
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              style={{ animation: unreadCount > 0 ? 'bellRing 2s ease-in-out infinite' : 'none' }}
            >
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                minWidth: '17px', height: '17px', padding: '0 4px',
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                borderRadius: '99px', fontSize: '9px',
                fontWeight: 800, color: '#fff', display: 'grid', placeItems: 'center',
                border: '2px solid var(--color-bg-surface)',
                boxShadow: '0 2px 6px rgba(239,68,68,0.5)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              markRead={markRead}
              markAllRead={markAllRead}
              onNavigate={navigate}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>

        {/* User Avatar */}
        <div
          onClick={() => navigate('/profile')}
          title={`${user?.name} — ${user?.role}`}
          style={{
            width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
            border: `2px solid ${roleColor}`,
            background: profilePhotoUrl
              ? `url(${profilePhotoUrl}) center/cover no-repeat`
              : roleColor,
            display: 'grid', placeItems: 'center',
            color: '#fff', fontWeight: 800, fontSize: '13px', flexShrink: 0,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = `0 0 0 3px ${roleColor}40`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {!profilePhotoUrl && (user?.name || 'U')[0].toUpperCase()}
        </div>
      </div>
    </header>
  );
}

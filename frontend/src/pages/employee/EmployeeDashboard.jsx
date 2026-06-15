import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

const STAGE_COLORS = {
  new_inquiry: '#60A5FA', contacted: '#818CF8', negotiation: '#A78BFA',
  quote_sent: '#FBBF24', advance_pending: '#FB923C', confirmed: '#34D399',
  completed: '#10B981', lost: '#F87171'
};
const STAGE_LABELS = {
  new_inquiry: 'New Inquiry', contacted: 'Contacted', negotiation: 'Negotiation',
  quote_sent: 'Quote Sent', advance_pending: 'Advance Pending',
  confirmed: 'Confirmed', completed: 'Completed', lost: 'Lost'
};
const PRIORITY_STYLE = {
  urgent: { bg: '#FEF2F2', color: '#DC2626', border: '#FEE2E2' },
  high:   { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  medium: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  low:    { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' },
};

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  // State
  const [leads, setLeads] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [followUps, setFollowUps] = useState({ today: [], overdue: [] });
  const [loading, setLoading] = useState(true);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all in parallel
      const [leadsRes, attendanceRes] = await Promise.all([
        api.get('/leads?limit=10'),
        api.get(`/attendance?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}&limit=31`),
      ]);

      const allLeads = leadsRes.data.data || [];
      setLeads(allLeads);

      // Today's attendance
      const today = new Date().toISOString().split('T')[0];
      const todayRec = attendanceRes.data.data?.find(r => r.date === today);
      setTodayAttendance(todayRec || null);
      setMonthlyStats(attendanceRes.data.stats || null);

      // Categorize follow-ups
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
      const todayFU = [], overdueFU = [];

      for (const lead of allLeads) {
        if (!lead.followUpDate) continue;
        const fuDate = new Date(lead.followUpDate);
        if (fuDate >= todayStart && fuDate <= todayEnd) {
          todayFU.push(lead);
        } else if (fuDate < todayStart && !['confirmed', 'completed', 'lost'].includes(lead.leadStatus)) {
          overdueFU.push(lead);
        }
      }
      setFollowUps({ today: todayFU, overdue: overdueFU });

    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute stats from real leads
  const activeLeads = leads.filter(l => !['confirmed', 'completed', 'lost'].includes(l.leadStatus));
  const convertedLeads = leads.filter(l => ['confirmed', 'completed'].includes(l.leadStatus));
  const urgentLeads = leads.filter(l => l.priority === 'urgent' && !['confirmed', 'completed', 'lost'].includes(l.leadStatus));

  const kpis = [
    { label: 'My Active Leads', value: activeLeads.length, icon: '🎯', change: `${leads.length} total assigned`, up: true },
    { label: "Today's Follow-ups", value: followUps.today.length, icon: '⏰', change: followUps.overdue.length > 0 ? `${followUps.overdue.length} overdue` : 'All on time', up: followUps.overdue.length === 0 },
    { label: 'My Conversions', value: convertedLeads.length, icon: '✅', change: leads.length > 0 ? `${Math.round((convertedLeads.length / leads.length) * 100)}% rate` : '—', up: true },
    { label: 'Monthly Attendance', value: monthlyStats ? `${monthlyStats.attendancePct || 0}%` : '—', icon: '📊', change: monthlyStats ? `${monthlyStats.presentDays || 0} days present` : '—', up: true },
  ];

  return (
    <div className="page-content">
      {/* Greeting */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ fontSize: '26px' }}>
          {greeting}, {user?.name?.split(' ')[0] || 'Team'} 👋
        </h1>
        <p className="page-sub">
          {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — Here's your workday overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '20px' }}>
        {loading ? [1, 2, 3, 4].map(i => (
          <div key={i} className="kpi-card" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
            <div style={{ height: '12px', background: 'var(--color-bg-secondary)', borderRadius: '6px', marginBottom: '12px', width: '60%' }} />
            <div style={{ height: '28px', background: 'var(--color-bg-secondary)', borderRadius: '6px', width: '80%' }} />
          </div>
        )) : kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{k.icon}</div>
            <div className="kpi-value" style={{ fontSize: '24px' }}>{k.value}</div>
            <span className={`kpi-change ${k.up ? 'up' : 'down'}`} style={{ fontSize: '11px' }}>{k.change}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>

        {/* Left: Leads */}
        <div>
          {/* Overdue Follow-ups */}
          {followUps.overdue.length > 0 && (
            <div className="card" style={{ marginBottom: '16px', borderLeft: '3px solid #DC2626' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <div className="card-title" style={{ marginBottom: 0, color: '#DC2626' }}>Overdue Follow-ups</div>
                <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>{followUps.overdue.length}</span>
              </div>
              {followUps.overdue.map((lead, i) => {
                const ps = PRIORITY_STYLE[lead.priority] || PRIORITY_STYLE.medium;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#FEF2F2', borderRadius: '10px', marginBottom: '8px', border: '1px solid #FCA5A5', cursor: 'pointer' }}
                    onClick={() => navigate('/leads')}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{lead.customerName}</div>
                      <div style={{ fontSize: '11px', color: '#DC2626' }}>
                        📍 {lead.destination} · 👥 {lead.totalPax || 0} pax · 📅 Due: {new Date(lead.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <a href={`https://wa.me/91${lead.mobileNumber}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-xs" style={{ color: '#25D366' }}>💬</button>
                      </a>
                      <a href={`tel:${lead.mobileNumber}`} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-xs">📞</button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Today's Follow-ups */}
          {followUps.today.length > 0 && (
            <div className="card" style={{ marginBottom: '16px', borderLeft: '3px solid #F59E0B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span>⏰</span>
                <div className="card-title" style={{ marginBottom: 0, color: '#D97706' }}>Today's Follow-ups</div>
                <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>{followUps.today.length}</span>
              </div>
              {followUps.today.map((lead, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#FFFBEB', borderRadius: '10px', marginBottom: '8px', border: '1px solid #FDE68A', cursor: 'pointer' }}
                  onClick={() => navigate('/leads')}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{lead.customerName}</div>
                    <div style={{ fontSize: '11px', color: '#D97706' }}>📍 {lead.destination} · {fmtTime(lead.followUpDate)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <a href={`https://wa.me/91${lead.mobileNumber}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-xs" style={{ color: '#25D366' }}>💬</button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* My Leads Pipeline */}
          <div className="table-card">
            <div className="table-toolbar">
              <div className="card-title" style={{ margin: 0 }}>My Leads Pipeline</div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/leads')}>
                View All →
              </button>
            </div>
            {loading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading…</div>
            ) : leads.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</div>
                No leads assigned yet. Contact your admin.
              </div>
            ) : (
              <table className="ds-table">
                <thead><tr><th>Client</th><th>Destination</th><th>Pax</th><th>Stage</th><th>Follow-up</th><th>Actions</th></tr></thead>
                <tbody>
                  {leads.slice(0, 8).map((lead) => {
                    const ps = PRIORITY_STYLE[lead.priority] || PRIORITY_STYLE.medium;
                    const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date() && !['confirmed', 'completed', 'lost'].includes(lead.leadStatus);
                    return (
                      <tr key={lead._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{lead.customerName}</div>
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '99px', background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, fontWeight: 600 }}>{lead.priority}</span>
                        </td>
                        <td>📍 {lead.destination}</td>
                        <td style={{ textAlign: 'center' }}><strong>{lead.totalPax || 0}</strong></td>
                        <td>
                          <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '99px', fontWeight: 600, background: `${STAGE_COLORS[lead.leadStatus] || '#94A3B8'}18`, color: STAGE_COLORS[lead.leadStatus] || '#94A3B8', border: `1px solid ${STAGE_COLORS[lead.leadStatus] || '#94A3B8'}30` }}>
                            {STAGE_LABELS[lead.leadStatus] || lead.leadStatus}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: isOverdue ? '#DC2626' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                          {lead.followUpDate ? (isOverdue ? '⚠️ ' : '⏰ ') + new Date(lead.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <a href={`https://wa.me/91${lead.mobileNumber}`} target="_blank" rel="noreferrer">
                              <button className="btn btn-ghost btn-xs" style={{ color: '#25D366' }}>💬</button>
                            </a>
                            <a href={`tel:${lead.mobileNumber}`}>
                              <button className="btn btn-ghost btn-xs">📞</button>
                            </a>
                            <button className="btn btn-ghost btn-xs" onClick={() => navigate('/leads')}>✏️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Attendance + Monthly Stats */}
        <div>
          {/* Today's Attendance */}
          <div className="card" style={{ marginBottom: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Today's Attendance</div>
            {todayAttendance ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Check In</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-success)' }}>{fmtTime(todayAttendance.checkInTime)}</div>
                  </div>
                  <div style={{ width: '1px', background: 'var(--color-border)' }} />
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Mode</div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{todayAttendance.workMode === 'office' ? '🏢 Office' : '🏠 WFH'}</div>
                  </div>
                  <div style={{ width: '1px', background: 'var(--color-border)' }} />
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Status</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: todayAttendance.attendanceStatus === 'late' ? '#D97706' : 'var(--color-success)' }}>
                      {todayAttendance.attendanceStatus?.replace('_', ' ')?.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {todayAttendance.faceVerified && <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)' }}>Face ID ✓</span>}
                  {todayAttendance.geoFenceStatus === 'verified' && <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)' }}>Geo ✓</span>}
                  {todayAttendance.checkOutTime && <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}>Out: {fmtTime(todayAttendance.checkOutTime)}</span>}
                </div>
                {!todayAttendance.checkInTime && (
                  <button className="btn btn-primary btn-sm" style={{ marginTop: '10px' }} onClick={() => navigate('/attendance')}>
                    🕐 Check In Now
                  </button>
                )}
              </>
            ) : (
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏰</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>Not checked in yet</div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/attendance')}>🕐 Check In Now</button>
              </div>
            )}
          </div>

          {/* Monthly Stats */}
          <div className="card card-sm" style={{ marginBottom: '16px' }}>
            <div className="card-title">📅 This Month</div>
            {monthlyStats ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Days Present', value: monthlyStats.presentDays || 0, pct: ((monthlyStats.presentDays || 0) / 26) * 100 },
                  { label: 'Days WFH', value: monthlyStats.wfhDays || 0, pct: ((monthlyStats.wfhDays || 0) / 26) * 100 },
                  { label: 'Total Hours', value: `${monthlyStats.totalHours || 0}h`, pct: ((monthlyStats.totalHours || 0) / 208) * 100 },
                  { label: 'Attendance %', value: `${monthlyStats.attendancePct || 0}%`, pct: monthlyStats.attendancePct || 0 },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
                      <span style={{ fontWeight: 600 }}>{s.value}</span>
                    </div>
                    <div className="progress-wrap">
                      <div className="progress-bar progress-blue" style={{ width: `${Math.min(100, s.pct)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '12px' }}>No attendance data</div>
            )}
          </div>

          {/* Urgent Leads */}
          {urgentLeads.length > 0 && (
            <div className="card card-sm">
              <div className="card-title" style={{ color: '#DC2626' }}>🔥 Urgent Leads ({urgentLeads.length})</div>
              {urgentLeads.slice(0, 3).map((l, i) => (
                <div key={i} style={{ padding: '8px 10px', background: '#FEF2F2', borderRadius: '8px', marginBottom: '6px', fontSize: '12px', border: '1px solid #FCA5A5', cursor: 'pointer' }} onClick={() => navigate('/leads')}>
                  <div style={{ fontWeight: 600 }}>{l.customerName}</div>
                  <div style={{ color: '#DC2626', fontSize: '11px' }}>📍 {l.destination} · 👥 {l.totalPax} pax</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

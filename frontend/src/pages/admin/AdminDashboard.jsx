import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtK = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n || 0}`;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function SkeletonCard() {
  return (
    <div className="kpi-card" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      <div style={{ height: '12px', background: 'var(--color-bg-secondary)', borderRadius: '6px', marginBottom: '12px', width: '60%' }} />
      <div style={{ height: '28px', background: 'var(--color-bg-secondary)', borderRadius: '6px', marginBottom: '8px', width: '80%' }} />
      <div style={{ height: '12px', background: 'var(--color-bg-secondary)', borderRadius: '6px', width: '40%' }} />
    </div>
  );
}

const STAGE_COLORS_MAP = {
  new_inquiry: '#60A5FA', contacted: '#818CF8', negotiation: '#A78BFA',
  quote_sent: '#FBBF24', advance_pending: '#FB923C',
  confirmed: '#34D399', completed: '#10B981', lost: '#F87171'
};
const STAGE_LABELS = {
  new_inquiry: 'New Inquiry', contacted: 'Contacted', negotiation: 'Negotiation',
  quote_sent: 'Quote Sent', advance_pending: 'Advance Pending',
  confirmed: 'Confirmed', completed: 'Completed', lost: 'Lost'
};
const SOURCE_COLORS = ['#25D366', '#3B82F6', '#F97316', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await api.get('/analytics/overview');
      setData(res.data);
    } catch (err) {
      setError('Failed to load dashboard data. Ensure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Build trend chart data from API response
  const trendData = data?.trend?.map(t => ({
    month: MONTH_NAMES[(t._id.month || 1) - 1],
    revenue: t.total
  })) || [];

  // Build lead funnel from API
  const funnelData = data?.leadStages?.map(s => ({
    stage: STAGE_LABELS[s._id] || s._id,
    count: s.count,
    color: STAGE_COLORS_MAP[s._id] || '#94A3B8'
  })).sort((a, b) => b.count - a.count) || [];

  const maxFunnelCount = funnelData[0]?.count || 1;

  // Source pie data
  const sourcePieData = data?.sourceDistribution?.map((s, i) => ({
    name: s._id,
    value: s.count,
    color: SOURCE_COLORS[i % SOURCE_COLORS.length]
  })) || [];

  if (loading) return (
    <div className="page-content">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ height: '28px', background: 'var(--color-bg-secondary)', borderRadius: '8px', width: '200px', marginBottom: '8px' }} />
        <div style={{ height: '14px', background: 'var(--color-bg-secondary)', borderRadius: '6px', width: '300px' }} />
      </div>
      <div className="kpi-grid">{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>
    </div>
  );

  if (error) return (
    <div className="page-content">
      <div style={{ textAlign: 'center', padding: '60px', color: '#DC2626' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Dashboard Error</div>
        <div style={{ fontSize: '13px', marginBottom: '20px', color: 'var(--color-text-muted)' }}>{error}</div>
        <button className="btn btn-primary" onClick={fetchData}>🔄 Retry</button>
      </div>
    </div>
  );

  const leads = data?.leads || {};
  const revenue = data?.revenue || {};
  const bookings = data?.bookings || {};
  const attendance = data?.attendance?.today || {};

  const kpis = [
    { label: 'Gross Revenue', value: fmtK(revenue.thisMonth), change: revenue.growth > 0 ? `↑ ${revenue.growth}%` : revenue.growth < 0 ? `↓ ${Math.abs(revenue.growth)}%` : '—', up: revenue.growth >= 0, icon: '💰', cls: 'blue' },
    { label: 'Active Bookings', value: bookings.thisMonth || 0, change: `${bookings.total || 0} total`, up: true, icon: '📋', cls: 'green' },
    { label: 'Lead Conversion', value: `${leads.conversionRate || 0}%`, change: `${leads.converted || 0} converted`, up: true, icon: '🎯', cls: 'amber' },
    { label: 'Pending Payments', value: fmtK(data?.pendingPayments?.total), change: `${data?.pendingPayments?.count || 0} bookings`, up: false, icon: '⏳', cls: 'red' },
  ];

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-sub">Live data from MongoDB · {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchData}>🔄 Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/analytics')}>Full Analytics →</button>
        </div>
      </div>

      {/* Attendance Quick Bar */}
      {attendance && attendance.totalEmployees > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '16px' }}>
          {[
            { label: "Today's Present", value: attendance.present || 0, color: '#059669', bg: '#ECFDF5', icon: '✅' },
            { label: 'Absent', value: attendance.absent || 0, color: '#DC2626', bg: '#FEF2F2', icon: '❌' },
            { label: 'Late', value: attendance.late || 0, color: '#D97706', bg: '#FFFBEB', icon: '⏰' },
            { label: 'WFH', value: attendance.wfh || 0, color: '#2563EB', bg: '#EFF6FF', icon: '🏠' },
            { label: 'Total Staff', value: attendance.totalEmployees || 0, color: '#7C3AED', bg: '#F5F3FF', icon: '👥' },
          ].map(s => (
            <div key={s.label} style={{ padding: '10px 14px', borderRadius: '12px', background: s.bg, border: `1px solid ${s.color}20`, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className={`kpi-icon ${k.cls}`} style={{ position: 'static', marginBottom: '8px', width: 36, height: 36 }}>
              <span style={{ fontSize: '18px' }}>{k.icon}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-footer">
              <span className={`kpi-change ${k.up ? 'up' : 'down'}`}>{k.change}</span>
              <span className="kpi-period">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 — stacks on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {/* Revenue Trend */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Revenue Trend</div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{trendData.length} months</span>
          </div>
          {trendData.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '13px', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '32px' }}>📊</span>
              No transaction data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => [fmt(v), 'Revenue']} contentStyle={{ borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Lead Source Pie */}
        <div className="card">
          <div className="card-title">Lead Sources</div>
          {sourcePieData.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '12px', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '28px' }}>🎯</span>No leads yet
            </div>
          ) : (
            <>
              <PieChart width={200} height={150} style={{ margin: '0 auto' }}>
                <Pie data={sourcePieData} cx={95} cy={70} innerRadius={40} outerRadius={68} dataKey="value" stroke="none">
                  {sourcePieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v, n, p) => [v, p.payload.name]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              </PieChart>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sourcePieData.slice(0, 5).map(s => {
                  const total = sourcePieData.reduce((a, b) => a + b.value, 0);
                  return (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{s.name}</span>
                      <strong>{Math.round((s.value / total) * 100)}%</strong>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row 2 — stacks on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {/* Lead Funnel */}
        <div className="card">
          <div className="card-title">Lead Pipeline Funnel</div>
          {funnelData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</div>No leads yet
            </div>
          ) : (
            funnelData.map((stage) => (
              <div key={stage.stage} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{stage.stage}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{stage.count}</span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-bar" style={{ width: `${(stage.count / maxFunnelCount) * 100}%`, background: stage.color }} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Employee Performance */}
        <div className="card">
          <div className="card-title">Top Sales Performers</div>
          {!data?.performance || data.performance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>No conversions yet
            </div>
          ) : (
            data.performance.map((emp, i) => (
              <div key={emp.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : '#B45309', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{emp.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{emp.conversions} conversions</div>
                </div>
                <div className="progress-wrap" style={{ width: '80px' }}>
                  <div className="progress-bar progress-blue" style={{ width: `${(emp.conversions / (data.performance[0]?.conversions || 1)) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Destinations Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <div className="card-title" style={{ margin: 0 }}>Top Destinations</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/analytics')}>View All →</button>
        </div>
        <div className="table-wrap">
          {!data?.destinations || data.destinations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>No booking data yet
            </div>
          ) : (
            <table className="ds-table">
              <thead><tr>
                <th>Destination</th><th>Bookings</th><th>Revenue</th><th>Avg/Booking</th><th>Share</th>
              </tr></thead>
              <tbody>
                {data.destinations.map((d, i) => {
                  const totalRevenue = data.destinations.reduce((s, x) => s + x.revenue, 0) || 1;
                  return (
                    <tr key={d._id}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{'🏔️🌴🏰🏖️✈️🏕️🌄🌊'[i] || '📍'}</span>
                        <strong>{d._id}</strong>
                      </div></td>
                      <td>{d.count}</td>
                      <td className="mono">{fmtK(d.revenue)}</td>
                      <td className="mono">{fmtK(Math.round(d.revenue / (d.count || 1)))}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="progress-wrap" style={{ width: '60px' }}>
                            <div className="progress-bar progress-blue" style={{ width: `${(d.revenue / totalRevenue) * 100}%` }} />
                          </div>
                          <span style={{ fontSize: '11px' }}>{Math.round((d.revenue / totalRevenue) * 100)}%</span>
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
    </div>
  );
}

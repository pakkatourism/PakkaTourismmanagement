import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '../../services/api';

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtK = n => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SOURCE_COLORS = ['#25D366', '#3B82F6', '#F97316', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];
const STAGE_COLORS = { new_inquiry: '#60A5FA', contacted: '#818CF8', negotiation: '#A78BFA', quote_sent: '#FBBF24', advance_pending: '#FB923C', confirmed: '#34D399', completed: '#10B981', lost: '#F87171' };
const STAGE_LABELS = { new_inquiry: 'New Inquiry', contacted: 'Contacted', negotiation: 'Negotiation', quote_sent: 'Quote Sent', advance_pending: 'Advance Pending', confirmed: 'Confirmed', completed: 'Completed', lost: 'Lost' };

function EmptyChart({ label }) {
  return (
    <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', gap: '8px' }}>
      <span style={{ fontSize: '32px' }}>📊</span>
      <span style={{ fontSize: '12px' }}>{label}</span>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState(null);
  const [leadAnalytics, setLeadAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [ovRes, laRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/leads/analytics')
      ]);
      setOverview(ovRes.data.data);
      setLeadAnalytics(laRes.data.data);
    } catch (err) {
      setError('Failed to load analytics. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="page-content">
      <div className="page-header"><h1 className="page-title">Analytics Dashboard</h1></div>
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--color-text-muted)' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
        <div style={{ fontSize: '15px', fontWeight: 600 }}>Loading live analytics…</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="page-content">
      <div style={{ textAlign: 'center', padding: '60px', color: '#DC2626' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontWeight: 700, marginBottom: '8px' }}>{error}</div>
        <button className="btn btn-primary" onClick={fetchAll}>🔄 Retry</button>
      </div>
    </div>
  );

  // Revenue trend
  const trendData = overview?.trend?.map(t => ({
    month: MONTH_NAMES[(t._id.month || 1) - 1],
    revenue: t.total,
    bookings: 0
  })) || [];

  // Source pie
  const sourcePie = (overview?.sourceDistribution || leadAnalytics?.sourceDistribution || []).map((s, i) => ({
    name: s._id || 'Other', value: s.count, color: SOURCE_COLORS[i % SOURCE_COLORS.length]
  }));
  const sourcePieTotal = sourcePie.reduce((a, b) => a + b.value, 0) || 1;

  // Conversion funnel
  const funnelStages = leadAnalytics?.stageDistribution || overview?.leadStages || [];
  const funnelData = funnelStages.map(s => ({
    name: STAGE_LABELS[s._id] || s._id,
    value: s.count,
    color: STAGE_COLORS[s._id] || '#94A3B8'
  })).sort((a, b) => b.value - a.value);
  const maxFunnel = funnelData[0]?.value || 1;

  // Destinations
  const destData = overview?.destinations?.map((d, i) => ({
    name: d._id?.length > 12 ? d._id.substring(0, 12) + '…' : d._id,
    revenue: d.revenue, count: d.count,
    color: SOURCE_COLORS[i % SOURCE_COLORS.length]
  })) || [];

  // Employee performance
  const empPerf = leadAnalytics?.empPerformance || overview?.performance || [];

  // Monthly leads trend
  const monthlyLeads = (leadAnalytics?.monthlyLeads || []).map(m => ({
    month: MONTH_NAMES[(m._id.month || 1) - 1],
    leads: m.count,
    converted: m.converted
  }));

  const revenue = overview?.revenue || {};
  const leads = overview?.leads || {};
  const bookings = overview?.bookings || {};

  const kpis = [
    { label: 'Gross Revenue', value: fmtK(revenue.thisMonth), change: revenue.growth >= 0 ? `↑${revenue.growth}%` : `↓${Math.abs(revenue.growth)}%`, up: revenue.growth >= 0, icon: '💰' },
    { label: 'Total Bookings', value: bookings.total || 0, change: `${bookings.thisMonth || 0} this month`, up: true, icon: '📋' },
    { label: 'Active Leads', value: leads.total || 0, change: `${leads.unassigned || 0} unassigned`, up: true, icon: '🎯' },
    { label: 'Conversion Rate', value: `${leads.conversionRate || 0}%`, change: `${leads.converted || 0} converted`, up: true, icon: '📈' },
    { label: 'Avg Booking Value', value: bookings.total > 0 ? fmtK(Math.round((revenue.thisMonth || 0) / bookings.thisMonth)) : '₹0', change: 'this month', up: true, icon: '💎' },
  ];

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-sub">Live data from MongoDB · {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchAll}>🔄 Refresh</button>
      </div>

      {/* Top KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: '20px' }}>
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{k.icon}</div>
            <div className="kpi-value" style={{ fontSize: '22px' }}>{k.value}</div>
            <span className={`kpi-change ${k.up ? 'up' : 'down'}`}>{k.change}</span>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Revenue Trend */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Revenue Trend</div>
          </div>
          {trendData.length === 0 ? <EmptyChart label="No transactions recorded yet" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => [fmt(v), 'Revenue']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5} fill="url(#aGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Lead Source Pie */}
        <div className="card">
          <div className="card-title">Lead Sources</div>
          {sourcePie.length === 0 ? <EmptyChart label="No leads yet" /> : (
            <>
              <PieChart width={200} height={160} style={{ margin: '0 auto' }}>
                <Pie data={sourcePie} cx={95} cy={75} innerRadius={40} outerRadius={72} dataKey="value" stroke="none">
                  {sourcePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v, n, p) => [`${Math.round((v / sourcePieTotal) * 100)}% (${v})`, p.payload.name]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              </PieChart>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '8px' }}>
                {sourcePie.map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{s.name}</span>
                    <strong>{Math.round((s.value / sourcePieTotal) * 100)}%</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Destination Revenue */}
        <div className="card">
          <div className="card-title">Top Destinations</div>
          {destData.length === 0 ? <EmptyChart label="No bookings yet" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={destData} layout="vertical">
                <XAxis type="number" tickFormatter={v => fmtK(v)} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip formatter={v => [fmt(v), 'Revenue']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                  {destData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Conversion Funnel */}
        <div className="card">
          <div className="card-title">Lead Conversion Funnel</div>
          {funnelData.length === 0 ? <EmptyChart label="No leads yet" /> : (
            funnelData.map(s => (
              <div key={s.name} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{s.name}</span>
                  <span style={{ fontWeight: 600 }}>{s.value} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({Math.round((s.value / maxFunnel) * 100)}%)</span></span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-bar" style={{ width: `${(s.value / maxFunnel) * 100}%`, background: s.color }} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Monthly Leads */}
        <div className="card">
          <div className="card-title">Monthly Leads vs Converted</div>
          {monthlyLeads.length === 0 ? <EmptyChart label="No data yet" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={monthlyLeads}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Line type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} name="Leads" />
                <Line type="monotone" dataKey="converted" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Converted" />
              </LineChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 10, height: 10, background: '#3B82F6', borderRadius: '50%' }} /> Leads</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 10, height: 10, background: '#10B981', borderRadius: '50%' }} /> Converted</span>
          </div>
        </div>
      </div>

      {/* Employee Performance Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <div className="card-title" style={{ margin: 0 }}>👑 Employee Performance Leaderboard</div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Live from MongoDB</span>
        </div>
        {empPerf.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
            No employee conversions yet. Assign leads and close deals to see performance!
          </div>
        ) : (
          <table className="ds-table">
            <thead><tr><th>Rank</th><th>Agent</th><th>Total Leads</th><th>Converted</th><th>Rate</th></tr></thead>
            <tbody>
              {empPerf.map((e, i) => (
                <tr key={e.name}>
                  <td>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'inline-grid', placeItems: 'center', fontWeight: 800, fontSize: '12px', background: i === 0 ? '#FEF3C7' : i === 1 ? '#F1F5F9' : i === 2 ? '#FFF7ED' : 'var(--color-bg-secondary)', color: i === 0 ? '#D97706' : i === 1 ? '#64748B' : i === 2 ? '#B45309' : 'var(--color-text-muted)' }}>
                      {i + 1}
                    </span>
                  </td>
                  <td><strong>{e.name}</strong></td>
                  <td>{e.total}</td>
                  <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{e.converted}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="progress-wrap" style={{ width: '50px' }}>
                        <div className="progress-bar progress-green" style={{ width: `${e.convRate || 0}%` }} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{e.convRate || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

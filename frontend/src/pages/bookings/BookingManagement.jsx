import React, { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');

const MOCK_BOOKINGS = [
  { _id:'BK-2025-0089', clientName:'Tech Corp Ltd',    phone:'9900009988', destination:'International',      travelDate:'2025-09-10', pax:30, totalAmount:900000, advancePaid:300000, balanceDue:600000, status:'confirmed',  assignedTo:'Priya S.' },
  { _id:'BK-2025-0088', clientName:'Anjali Verma',     phone:'9456123780', destination:'Manali',             travelDate:'2025-06-18', pax:3,  totalAmount:36000,  advancePaid:36000,  balanceDue:0,       status:'completed',  assignedTo:'Rahul M.' },
  { _id:'BK-2025-0087', clientName:'Rohit Party',      phone:'9012345678', destination:'Shimla',             travelDate:'2025-06-12', pax:12, totalAmount:144000, advancePaid:72000,  balanceDue:72000,   status:'confirmed',  assignedTo:'Priya S.' },
  { _id:'BK-2025-0086', clientName:'Meena Iyer',       phone:'9871234560', destination:'Coorg',              travelDate:'2025-07-01', pax:2,  totalAmount:22000,  advancePaid:11000,  balanceDue:11000,   status:'confirmed',  assignedTo:'Anjali K.' },
  { _id:'BK-2025-0085', clientName:'Suresh Travels',   phone:'9988776655', destination:'Himachal Pradesh',   travelDate:'2025-06-20', pax:15, totalAmount:180000, advancePaid:90000,  balanceDue:90000,   status:'in_progress',assignedTo:'Sanjay R.' },
  { _id:'BK-2025-0084', clientName:'Corporate Group',  phone:'9123456780', destination:'Goa',                travelDate:'2025-08-05', pax:22, totalAmount:220000, advancePaid:110000, balanceDue:110000,  status:'confirmed',  assignedTo:'Nisha P.' },
  { _id:'BK-2025-0083', clientName:'Rajesh Kumar',     phone:'9876543210', destination:'Manali',             travelDate:'2025-06-15', pax:8,  totalAmount:85000,  advancePaid:85000,  balanceDue:0,       status:'completed',  assignedTo:'Priya S.' },
];

const STATUS_BADGE = {
  confirmed:  'badge-confirmed', completed: 'badge-success',
  cancelled:  'badge-danger',    in_progress:'badge-info',
  draft:      'badge-neutral',   refunded:   'badge-warning',
};

export default function BookingManagement() {
  const [bookings] = useState(MOCK_BOOKINGS);
  const [selected, setSelected]   = useState(null);
  const [showNew, setShowNew]     = useState(false);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');

  const filtered = bookings.filter(b => {
    const s = filter === 'all' || b.status === filter;
    const q = !search || b.clientName.toLowerCase().includes(search.toLowerCase()) || b._id.includes(search) || b.destination.toLowerCase().includes(search.toLowerCase());
    return s && q;
  });

  const totalRevenue  = bookings.reduce((s,b) => s + b.totalAmount, 0);
  const totalCollected= bookings.reduce((s,b) => s + b.advancePaid, 0);
  const totalPending  = bookings.reduce((s,b) => s + b.balanceDue, 0);

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 className="page-title">Booking Management</h1>
          <p className="page-sub">{bookings.length} bookings · Revenue {fmt(totalRevenue)} · Pending {fmt(totalPending)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Booking</button>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'10px', marginBottom:'16px' }}>
        {[
          { label:'Total Revenue',  value: fmt(totalRevenue),   icon:'💰', cls:'blue' },
          { label:'Collected',      value: fmt(totalCollected), icon:'✅', cls:'green' },
          { label:'Balance Due',    value: fmt(totalPending),   icon:'⏳', cls:'red' },
          { label:'Total Bookings', value: bookings.length,     icon:'📋', cls:'amber' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ minWidth:0 }}>
            <div className="kpi-label" style={{ fontSize:'10px' }}>{k.label}</div>
            <div style={{ fontSize:'20px', marginBottom:'2px' }}>{k.icon}</div>
            <div className="kpi-value" style={{ fontSize:'18px', wordBreak:'break-all' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', flex:1 }}>
          {['all','confirmed','in_progress','completed','cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`btn btn-sm ${filter===s?'btn-primary':'btn-secondary'}`}>
              {s === 'all' ? 'All' : s.replace('_',' ')}
            </button>
          ))}
        </div>
        <div className="search-wrap" style={{ width:'100%', maxWidth:'240px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="search-input" style={{ width:'100%' }} placeholder="Search bookings…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-wrap">
          <table className="ds-table">
            <thead><tr>
              <th>Booking #</th><th>Client</th><th>Destination</th>
              <th>Travel Date</th><th>Pax</th><th>Total</th>
              <th>Collected</th><th>Balance</th><th>Status</th><th>Agent</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b._id}>
                  <td><span className="id-chip">{b._id}</span></td>
                  <td>
                    <div style={{ fontWeight:600 }}>{b.clientName}</div>
                    <div style={{ fontSize:'11px', color:'var(--color-text-muted)' }}>{b.phone}</div>
                  </td>
                  <td>📍 {b.destination}</td>
                  <td><span className="mono">{new Date(b.travelDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span></td>
                  <td style={{ textAlign:'center' }}><strong>{b.pax}</strong></td>
                  <td className="mono" style={{ fontWeight:600 }}>{fmt(b.totalAmount)}</td>
                  <td className="mono" style={{ color:'var(--color-success)', fontWeight:600 }}>{fmt(b.advancePaid)}</td>
                  <td className="mono" style={{ color: b.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight:600 }}>
                    {b.balanceDue > 0 ? fmt(b.balanceDue) : '✓ Cleared'}
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[b.status]||'badge-neutral'}`}>{b.status.replace('_',' ')}</span></td>
                  <td style={{ fontSize:'12px' }}>{b.assignedTo}</td>
                  <td>
                    <div style={{ display:'flex', gap:'4px' }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => setSelected(b)} title="View Details">👁</button>
                      <button className="btn btn-ghost btn-xs" title="Payment">💳</button>
                      <button className="btn btn-ghost btn-xs" title="Itinerary">🗺</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span style={{ fontSize:'12px', color:'var(--color-text-muted)' }}>Showing {filtered.length} of {bookings.length}</span>
          <div style={{ display:'flex', gap:'8px' }}>
            <button className="btn btn-ghost btn-xs">← Prev</button>
            <button className="btn btn-ghost btn-xs">Next →</button>
          </div>
        </div>
      </div>

      {/* Booking Detail Drawer */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" style={{ maxWidth:'640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize:'11px', color:'var(--color-text-muted)', marginBottom:'2px' }}>{selected._id}</div>
                <div className="modal-title">{selected.clientName}</div>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              {/* Booking info grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px' }}>
                {[
                  ['📍 Destination', selected.destination],
                  ['📅 Travel Date', new Date(selected.travelDate).toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})],
                  ['👥 Pax Count', selected.pax],
                  ['👤 Sales Agent', selected.assignedTo],
                  ['📞 Phone', selected.phone],
                  ['🏷 Status', selected.status],
                ].map(([k,v]) => (
                  <div key={k} style={{ padding:'10px 12px', background:'var(--color-bg-secondary)', borderRadius:'10px' }}>
                    <div style={{ fontSize:'11px', color:'var(--color-text-muted)', marginBottom:'2px' }}>{k}</div>
                    <div style={{ fontWeight:600, fontSize:'13px' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Payment Timeline */}
              <div style={{ fontWeight:700, fontSize:'13px', marginBottom:'12px' }}>💳 Payment Timeline</div>
              <div style={{ marginBottom:'16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'8px', flexWrap:'wrap', gap:'4px' }}>
                  <span>Total: <strong>{fmt(selected.totalAmount)}</strong></span>
                  <span>Collected: <strong style={{ color:'var(--color-success)' }}>{fmt(selected.advancePaid)}</strong></span>
                  <span>Balance: <strong style={{ color: selected.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{selected.balanceDue > 0 ? fmt(selected.balanceDue) : '✓ Cleared'}</strong></span>
                </div>
                <div className="progress-wrap" style={{ height:'8px' }}>
                  <div className="progress-bar progress-green" style={{ width:`${(selected.advancePaid/selected.totalAmount)*100}%` }}/>
                </div>
                <div style={{ fontSize:'11px', color:'var(--color-text-muted)', marginTop:'4px', textAlign:'right' }}>
                  {Math.round((selected.advancePaid/selected.totalAmount)*100)}% collected
                </div>
              </div>

              {/* Installments Mock */}
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {[
                  { label:'Advance (50%)', amount: selected.totalAmount * 0.5, status:'paid', date:'2025-05-10', method:'UPI' },
                  { label:'Balance (50%)', amount: selected.totalAmount * 0.5, status: selected.balanceDue > 0 ? 'pending' : 'paid', date: selected.balanceDue > 0 ? 'Due: '+new Date(selected.travelDate).toLocaleDateString('en-IN') : '2025-06-01', method: selected.balanceDue > 0 ? '—' : 'Bank Transfer' },
                ].map((inst, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:'10px', border:'1px solid var(--color-border)', background: inst.status === 'paid' ? 'var(--color-success-bg)' : 'var(--color-bg-secondary)' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'13px' }}>{inst.label}</div>
                      <div style={{ fontSize:'11px', color:'var(--color-text-muted)' }}>{inst.date} · {inst.method}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700, fontSize:'14px' }}>{fmt(inst.amount)}</div>
                      <span className={`badge ${inst.status === 'paid' ? 'badge-confirmed' : 'badge-warning'}`} style={{ fontSize:'10px' }}>{inst.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
              <button className="btn btn-secondary">🖨️ Invoice</button>
              <button className="btn btn-primary">💳 Record Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

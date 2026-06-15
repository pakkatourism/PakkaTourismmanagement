import React, { useState } from 'react';

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');

const MOCK_VENDORS = [
  { _id:'V001', name:'Sunrise Hotels Manali', type:'hotel',     phone:'9812000001', destination:'Manali',   rating:4, totalPayable:380000, totalPaid:280000, isActive:true },
  { _id:'V002', name:'Alpine Jeep Services',  type:'transport', phone:'9900112233', destination:'Shimla',   rating:5, totalPayable:240000, totalPaid:240000, isActive:true },
  { _id:'V003', name:'Kerala Backwaters Inn', type:'hotel',     phone:'9871500001', destination:'Kerala',   rating:4, totalPayable:180000, totalPaid:90000,  isActive:true },
  { _id:'V004', name:'Rajasthan Royal Cabs',  type:'transport', phone:'9988123456', destination:'Jaipur',   rating:3, totalPayable:150000, totalPaid:150000, isActive:true },
  { _id:'V005', name:'Goa Beach Resorts',     type:'hotel',     phone:'9123450001', destination:'Goa',      rating:4, totalPayable:320000, totalPaid:160000, isActive:true },
  { _id:'V006', name:'Mountain Guides HP',    type:'guide',     phone:'9456780002', destination:'Himachal', rating:5, totalPayable:48000,  totalPaid:48000,  isActive:true },
  { _id:'V007', name:'Spice Garden Food Co.', type:'food',      phone:'9900001234', destination:'All',      rating:3, totalPayable:120000, totalPaid:60000,  isActive:false },
];

const TYPE_ICON = { hotel:'🏨', transport:'🚙', guide:'🧗', food:'🍽️', activity:'🎯', other:'📦' };
const TYPE_COLOR = { hotel:'#2563EB', transport:'#7C3AED', guide:'#059669', food:'#D97706', activity:'#DC2626', other:'#64748B' };

const Stars = ({ n }) => '★'.repeat(n) + '☆'.repeat(5-n);

export default function VendorManagement() {
  const [vendors, setVendors] = useState(MOCK_VENDORS);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [filterType, setFilterType] = useState('all');

  const filtered = vendors.filter(v => filterType === 'all' || v.type === filterType);
  const totalOwed = vendors.reduce((s,v) => s + (v.totalPayable - v.totalPaid), 0);

  return (
    <div className="page-content">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 className="page-title">Vendor Management</h1>
          <p className="page-sub">{vendors.length} vendors · Outstanding dues: <strong style={{ color:'var(--color-danger)' }}>{fmt(totalOwed)}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Vendor</button>
      </div>

      {/* KPIs — auto-fit wraps to 2×2 on mobile, 4 on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px',
        marginBottom: '16px',
      }}>
        {[
          { label:'Total Vendors',  value: vendors.length,                                   icon:'🏢', cls:'blue' },
          { label:'Total Payable',  value: fmt(vendors.reduce((s,v)=>s+v.totalPayable,0)),   icon:'💰', cls:'amber' },
          { label:'Total Paid',     value: fmt(vendors.reduce((s,v)=>s+v.totalPaid,0)),      icon:'✅', cls:'green' },
          { label:'Outstanding',    value: fmt(totalOwed),                                   icon:'⚠️', cls:'red' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ minWidth: 0 }}>
            <div className="kpi-label" style={{ fontSize:'10px' }}>{k.label}</div>
            <div style={{ fontSize:'18px', marginBottom:'2px' }}>{k.icon}</div>
            <div className="kpi-value" style={{ fontSize:'17px', wordBreak:'break-all' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Type Filter */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
        {['all','hotel','transport','guide','food','activity'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`btn btn-sm ${filterType===t?'btn-primary':'btn-secondary'}`}>
            {t==='all'?'All Types':TYPE_ICON[t]+' '+t}
          </button>
        ))}
      </div>

      {/* Vendor Cards Grid — 260px min so it works on 375px phones */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'12px' }}>
        {filtered.map(v => {
          const outstanding = v.totalPayable - v.totalPaid;
          const paidPct = (v.totalPaid / v.totalPayable) * 100;
          return (
            <div key={v._id} className="card" style={{
              cursor:'pointer', transition:'all 0.2s',
              opacity: v.isActive ? 1 : 0.6,
              borderLeft:`3px solid ${TYPE_COLOR[v.type]||'var(--color-border)'}`,
            }} onClick={() => setSelected(v)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ fontSize:'20px' }}>{TYPE_ICON[v.type]}</span>
                    <span style={{ fontWeight:700, fontSize:'14px' }}>{v.name}</span>
                  </div>
                  <div style={{ fontSize:'11px', color:'var(--color-text-muted)', marginTop:'3px' }}>
                    📍 {v.destination} · 📞 {v.phone}
                  </div>
                </div>
                <span style={{ fontSize:'11px', color:'#F59E0B', whiteSpace:'nowrap', flexShrink:0 }}>{Stars(v.rating)}</span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'10px', fontSize:'12px' }}>
                <div style={{ background:'var(--color-bg-secondary)', padding:'8px', borderRadius:'8px' }}>
                  <div style={{ color:'var(--color-text-muted)' }}>Payable</div>
                  <div style={{ fontWeight:700 }}>{fmt(v.totalPayable)}</div>
                </div>
                <div style={{ background: outstanding>0 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', padding:'8px', borderRadius:'8px' }}>
                  <div style={{ color:'var(--color-text-muted)' }}>Outstanding</div>
                  <div style={{ fontWeight:700, color: outstanding>0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {outstanding > 0 ? fmt(outstanding) : '✓ Clear'}
                  </div>
                </div>
              </div>

              <div className="progress-wrap">
                <div className="progress-bar" style={{ width:`${paidPct}%`, background: paidPct===100?'#10B981':'#3B82F6' }}/>
              </div>
              <div style={{ fontSize:'10px', color:'var(--color-text-muted)', marginTop:'3px', textAlign:'right' }}>
                {Math.round(paidPct)}% paid
              </div>

              {!v.isActive && <div style={{ marginTop:'8px', fontSize:'11px', color:'var(--color-warning)', background:'var(--color-warning-bg)', padding:'4px 8px', borderRadius:'6px' }}>Inactive</div>}
            </div>
          );
        })}
      </div>

      {/* Vendor Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize:'22px', marginBottom:'2px' }}>{TYPE_ICON[selected.type]}</div>
                <div className="modal-title">{selected.name}</div>
                <div style={{ fontSize:'12px', color:'var(--color-text-muted)' }}>📍 {selected.destination}</div>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              {/* Modal stats — wraps to 1 col on small screens */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'10px', marginBottom:'16px' }}>
                {[
                  { label:'Total Payable', value: fmt(selected.totalPayable), color:'var(--color-warning)' },
                  { label:'Total Paid',    value: fmt(selected.totalPaid),    color:'var(--color-success)' },
                  { label:'Outstanding',   value: fmt(selected.totalPayable - selected.totalPaid), color:'var(--color-danger)' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center', padding:'12px', background:'var(--color-bg-secondary)', borderRadius:'10px' }}>
                    <div style={{ fontSize:'11px', color:'var(--color-text-muted)', marginBottom:'4px' }}>{s.label}</div>
                    <div style={{ fontSize:'18px', fontWeight:800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="form-group" style={{ marginBottom:'12px' }}>
                <label className="form-label">Record Payment</label>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    <input className="form-input" type="number" placeholder="Amount (₹)"/>
                    <select className="form-select">
                      <option>Cash</option><option>UPI</option><option>Bank Transfer</option>
                    </select>
                  </div>
                  <button className="btn btn-success w-full">💳 Record Payment</button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
              <button className="btn btn-primary">💾 Update Vendor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

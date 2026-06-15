import React, { useState } from 'react';

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');

const MOCK_TXN = [
  { _id:'T001', type:'income',  category:'booking_payment', amount:300000, date:'2025-05-24', method:'UPI',         description:'Advance for BK-2025-0089 - Tech Corp', booking:'BK-2025-0089' },
  { _id:'T002', type:'expense', category:'vendor_cost',     amount:85000,  date:'2025-05-23', method:'bank_transfer',description:'Hotel payment - Sunrise Hotels Manali',  vendor:'Sunrise Hotels' },
  { _id:'T003', type:'income',  category:'balance',         amount:36000,  date:'2025-05-22', method:'cash',        description:'Full payment - Anjali Verma / Manali',   booking:'BK-2025-0088' },
  { _id:'T004', type:'income',  category:'advance',         amount:72000,  date:'2025-05-21', method:'UPI',         description:'50% advance - Rohit Party / Shimla',     booking:'BK-2025-0087' },
  { _id:'T005', type:'expense', category:'vendor_cost',     amount:48000,  date:'2025-05-20', method:'cash',        description:'Jeep rental payment - Alpine Jeep',       vendor:'Alpine Jeep' },
  { _id:'T006', type:'income',  category:'booking_payment', amount:110000, date:'2025-05-19', method:'bank_transfer',description:'Advance - Corporate Group / Goa',        booking:'BK-2025-0084' },
  { _id:'T007', type:'expense', category:'salary',          amount:350000, date:'2025-05-18', method:'bank_transfer',description:'May 2025 salary disbursement',            vendor:null },
  { _id:'T008', type:'income',  category:'advance',         amount:90000,  date:'2025-05-17', method:'UPI',         description:'Advance - Suresh Travels / Himachal',    booking:'BK-2025-0085' },
];

const TYPE_COLOR = { income:'var(--color-success)', expense:'var(--color-danger)', vendor_payment:'var(--color-warning)', refund:'var(--color-info)' };
const METHOD_ICON = { UPI:'💳', cash:'💵', bank_transfer:'🏦', card:'💳', cheque:'📄' };

export default function FinancialLedger() {
  const [transactions] = useState(MOCK_TXN);
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = transactions.filter(t => typeFilter === 'all' || t.type === typeFilter);
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
  const netProfit    = totalIncome - totalExpense;

  return (
    <div className="page-content">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 className="page-title">Financial Ledger</h1>
          <p className="page-sub">All income, expenses and transactions</p>
        </div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          <button className="btn btn-ghost btn-sm">📥 Export</button>
          <button className="btn btn-primary btn-sm">+ Add Transaction</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'10px', marginBottom:'20px' }}>
        {[
          { label:'Total Income',  value: fmt(totalIncome),  icon:'📈', color:'var(--color-success)', bg:'var(--color-success-bg)' },
          { label:'Total Expense', value: fmt(totalExpense), icon:'📉', color:'var(--color-danger)',  bg:'var(--color-danger-bg)' },
          { label:'Net Profit',    value: fmt(netProfit),    icon:'💰', color: netProfit>=0?'var(--color-success)':'var(--color-danger)', bg: netProfit>=0?'var(--color-success-bg)':'var(--color-danger-bg)' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ borderLeft:`3px solid ${k.color}`, minWidth:0 }}>
            <div className="kpi-label" style={{ fontSize:'10px' }}>{k.label}</div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
              <div style={{ width:32, height:32, borderRadius:'10px', background:k.bg, display:'grid', placeItems:'center', fontSize:'16px', flexShrink:0 }}>{k.icon}</div>
              <div className="kpi-value" style={{ fontSize:'18px', margin:0, wordBreak:'break-all' }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        {['all','income','expense','vendor_payment','refund'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`btn btn-sm ${typeFilter===t?'btn-primary':'btn-secondary'}`}>
            {t==='all'?'All':t.replace('_',' ')}
          </button>
        ))}
      </div>

      {/* Transaction Feed */}
      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
        {filtered.map(t => (
          <div key={t._id} style={{
            display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px',
            background:'var(--color-bg-surface)', borderRadius:'12px',
            border:'1px solid var(--color-border)', boxShadow:'var(--shadow-sm)',
            transition:'all 0.15s'
          }}>
            {/* Type Icon */}
            <div style={{
              width:40, height:40, borderRadius:'10px', flexShrink:0, display:'grid', placeItems:'center', fontSize:'20px',
              background: t.type==='income' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            }}>
              {t.type==='income' ? '⬇️' : '⬆️'}
            </div>

            {/* Description */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:'13px', marginBottom:'2px' }}>{t.description}</div>
              <div style={{ fontSize:'11px', color:'var(--color-text-muted)', display:'flex', gap:'10px', flexWrap:'wrap' }}>
                <span>📅 {new Date(t.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
                <span>{METHOD_ICON[t.method]||'💰'} {t.method?.replace('_',' ')}</span>
                {t.booking && <span className="id-chip">{t.booking}</span>}
                {t.vendor && <span style={{ color:'var(--color-text-muted)' }}>→ {t.vendor}</span>}
              </div>
            </div>

            {/* Amount */}
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:'16px', fontWeight:800, color: TYPE_COLOR[t.type] }}>
                {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
              </div>
              <span className={`badge ${t.type==='income'?'badge-confirmed':'badge-danger'}`} style={{ fontSize:'10px' }}>
                {t.type}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Summary */}
      <div className="card" style={{ marginTop:'20px' }}>
        <div className="card-title">Monthly P&L Summary — May 2025</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'12px' }}>
          {[
            { label:'Booking Revenue', value: fmt(totalIncome),      pct:100, color:'var(--color-accent)' },
            { label:'Vendor Costs',    value: fmt(133000),            pct: Math.round((133000/totalIncome)*100), color:'var(--color-danger)' },
            { label:'Salaries',        value: fmt(350000),            pct: Math.round((350000/totalIncome)*100), color:'var(--color-warning)' },
            { label:'Net Profit',      value: fmt(netProfit),         pct: Math.round((netProfit/totalIncome)*100), color:'var(--color-success)' },
          ].map(s => (
            <div key={s.label} style={{ padding:'14px', background:'var(--color-bg-secondary)', borderRadius:'12px' }}>
              <div style={{ fontSize:'11px', color:'var(--color-text-muted)', marginBottom:'6px' }}>{s.label}</div>
              <div style={{ fontSize:'18px', fontWeight:800, color: s.color, marginBottom:'8px' }}>{s.value}</div>
              <div className="progress-wrap">
                <div className="progress-bar" style={{ width:`${Math.max(s.pct,0)}%`, background: s.color }}/>
              </div>
              <div style={{ fontSize:'10px', color:'var(--color-text-muted)', marginTop:'3px' }}>{s.pct}% of revenue</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

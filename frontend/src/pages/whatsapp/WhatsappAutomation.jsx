import React, { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';

const MOCK_TEMPLATES = [
  { _id:'T1', name:'Lead Welcome',     type:'lead_followup',    message:'Hi {{clientName}}! 👋 Thank you for reaching out to Pakka Tourism. We received your inquiry for {{destination}} for {{pax}} pax.\n\nWe will send you a detailed quotation shortly. 🏔️', sentCount:287, triggerOn:'lead_created' },
  { _id:'T2', name:'Quote Sent',       type:'quote_send',       message:'Hi {{clientName}}, your custom quotation for {{destination}} is ready! 📋\n\nPackage: {{days}} Days · {{pax}} Pax\nAmount: {{amount}}\n\nPlease review and confirm your booking. 🌟', sentCount:156, triggerOn:'quote_sent' },
  { _id:'T3', name:'Booking Confirm',  type:'booking_confirm',  message:'🎉 Congratulations {{clientName}}!\n\nYour trip to {{destination}} is CONFIRMED!\n\nBooking ID: {{bookingId}}\nTravel Date: {{travelDate}}\n\nSit back and let Pakka Tourism handle everything! ✈️', sentCount:89, triggerOn:'booking_confirmed' },
  { _id:'T4', name:'Payment Reminder', type:'payment_reminder', message:'Hi {{clientName}}, this is a gentle reminder that your balance payment of {{amount}} for the {{destination}} trip is due on {{dueDate}}.\n\nPay now to confirm your booking! 💳', sentCount:42, triggerOn:'manual' },
];

const MOCK_LOGS = [
  { phone:'9876543210', client:'Rajesh Kumar', template:'Lead Welcome',    status:'read',      time:'2m ago' },
  { phone:'9812345678', client:'Priya Sharma',  template:'Quote Sent',    status:'delivered', time:'15m ago' },
  { phone:'9900112233', client:'Amit Verma',    template:'Booking Confirm',status:'sent',     time:'1h ago' },
  { phone:'9988776655', client:'Suresh Travels',template:'Payment Reminder',status:'read',    time:'3h ago' },
  { phone:'9123456780', client:'Corp Group',    template:'Lead Welcome',   status:'failed',   time:'5h ago' },
];

const STATUS_COLOR = { read:'#25D366', delivered:'#059669', sent:'#2563EB', failed:'#DC2626' };
const STATUS_ICON  = { read:'✓✓', delivered:'✓✓', sent:'✓', failed:'✗' };

const TYPE_LABEL = {
  lead_followup:'Lead Follow-up', quote_send:'Quote Send',
  booking_confirm:'Booking Confirm', payment_reminder:'Payment Reminder', custom:'Custom'
};
const TRIGGER_LABEL = {
  lead_created:'On Lead Created', quote_sent:'On Quote Sent',
  booking_confirmed:'On Booking Confirm', manual:'Manual Only', none:'None'
};

export default function WhatsappAutomation() {
  const [templates, setTemplates] = useState(MOCK_TEMPLATES);
  const [selected,  setSelected]  = useState(MOCK_TEMPLATES[0]);
  const [showNew,   setShowNew]   = useState(false);
  const [sendTo,    setSendTo]    = useState('');
  const [sending,   setSending]   = useState(false);

  const handleSend = () => {
    if (!sendTo) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSendTo(''); alert('✅ Message sent successfully!'); }, 1500);
  };

  return (
    <div className="page-content">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 className="page-title">WhatsApp Automation</h1>
          <p className="page-sub">Message templates, bulk sending and conversation tracking</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Template</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:'10px', marginBottom:'20px' }}>
        {[
          { label:'Templates', value: templates.length, icon:'📝', cls:'blue' },
          { label:'Sent Today', value: '47', icon:'📤', cls:'green' },
          { label:'Read Rate',  value: '84%', icon:'👁', cls:'amber' },
          { label:'Auto-sent',  value: '312', icon:'🤖', cls:'blue' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ minWidth:0 }}>
            <div className="kpi-label" style={{ fontSize:'10px' }}>{k.label}</div>
            <div style={{ fontSize:'20px', marginBottom:'2px' }}>{k.icon}</div>
            <div className="kpi-value" style={{ fontSize:'20px' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Main layout — stacks on mobile */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'20px' }}>

        {/* ── Template List ── */}
        <div>
          <div className="card">
            <div className="card-title">Message Templates</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {templates.map(t => (
                <div key={t._id}
                  onClick={() => setSelected(t)}
                  style={{
                    padding:'12px', borderRadius:'12px', cursor:'pointer',
                    border:`1.5px solid ${selected?._id===t._id?'#25D366':'var(--color-border)'}`,
                    background: selected?._id===t._id?'rgba(37,211,102,0.06)':'var(--color-bg-secondary)',
                    transition:'all 0.15s'
                  }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                    <span style={{ fontWeight:600, fontSize:'13px' }}>{t.name}</span>
                    <span style={{ fontSize:'10px', background:'rgba(37,211,102,0.15)', color:'#25D366', padding:'2px 7px', borderRadius:'99px', fontWeight:600 }}>
                      {t.sentCount} sent
                    </span>
                  </div>
                  <div style={{ fontSize:'11px', color:'var(--color-text-muted)' }}>
                    {TYPE_LABEL[t.type]} · {TRIGGER_LABEL[t.triggerOn]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div>
          {selected && (
            <>
              {/* Template Preview */}
              <div className="card" style={{ marginBottom:'16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                  <div className="card-title" style={{ marginBottom:0 }}>📱 Template: {selected.name}</div>
                  <div style={{ display:'flex', gap:'6px' }}>
                    <span style={{ fontSize:'11px', padding:'3px 8px', borderRadius:'99px', background:'rgba(37,211,102,0.12)', color:'#25D366', border:'1px solid rgba(37,211,102,0.3)', fontWeight:600 }}>
                      {TRIGGER_LABEL[selected.triggerOn]}
                    </span>
                  </div>
                </div>

                {/* WhatsApp message bubble */}
                <div style={{ background:'#E8FDD8', borderRadius:'14px 14px 4px 14px', padding:'12px 14px', maxWidth:'360px', marginLeft:'auto', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize:'13px', lineHeight:1.6, color:'#1F2937', whiteSpace:'pre-line' }}>{selected.message}</div>
                  <div style={{ fontSize:'10px', color:'#6B7280', textAlign:'right', marginTop:'6px' }}>
                    10:42 AM {STATUS_ICON.read} <span style={{ color:STATUS_COLOR.read }}>Read</span>
                  </div>
                </div>

                {/* Placeholders */}
                <div style={{ marginTop:'12px', display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {['clientName','destination','pax','amount','bookingId','travelDate','dueDate','days'].map(p => (
                    (selected.message.includes(`{{${p}}}`)) && (
                      <span key={p} style={{ fontSize:'11px', background:'var(--color-bg-secondary)', border:'1px solid var(--color-border)', borderRadius:'6px', padding:'2px 8px', fontFamily:'monospace', color:'var(--color-accent)' }}>
                        {`{{${p}}}`}
                      </span>
                    )
                  ))}
                </div>
              </div>

              {/* Quick Send */}
              <div className="card" style={{ marginBottom:'16px' }}>
                <div className="card-title">📤 Quick Send</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'8px' }}>
                  <input className="form-input" placeholder="Enter phone number (9876543210)" value={sendTo} onChange={e => setSendTo(e.target.value)}/>
                  <button className="btn btn-success" onClick={handleSend} disabled={sending} style={{ whiteSpace:'nowrap' }}>
                    {sending ? '⟳ Sending…' : '💬 Send Now'}
                  </button>
                </div>
                <div style={{ fontSize:'11px', color:'var(--color-text-muted)', marginTop:'6px' }}>
                  Template: <strong>{selected.name}</strong> · Message will be sent via WhatsApp Business API
                </div>
              </div>

              {/* Message Log */}
              <div className="table-card">
                <div className="table-toolbar"><div className="card-title" style={{ margin:0 }}>Recent Message Log</div></div>
                <table className="ds-table">
                  <thead><tr><th>Client</th><th>Phone</th><th>Template</th><th>Status</th><th>Time</th></tr></thead>
                  <tbody>
                    {MOCK_LOGS.map((log, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight:600 }}>{log.client}</td>
                        <td className="mono">{log.phone}</td>
                        <td>{log.template}</td>
                        <td>
                          <span style={{ fontSize:'12px', fontWeight:600, color: STATUS_COLOR[log.status] }}>
                            {STATUS_ICON[log.status]} {log.status}
                          </span>
                        </td>
                        <td style={{ fontSize:'12px', color:'var(--color-text-muted)' }}>{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

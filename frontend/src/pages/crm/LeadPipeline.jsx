import React, { useState, useEffect, useRef, useCallback } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';

/* ─── Constants ─────────────────────────────────────────────────────────── */
const STAGES = ['new_inquiry', 'contacted', 'negotiation', 'quote_sent', 'advance_pending', 'confirmed', 'completed', 'lost'];
const STAGE_LABELS = {
  new_inquiry: 'New Inquiry', contacted: 'Contacted', negotiation: 'Negotiation',
  quote_sent: 'Quote Sent', advance_pending: 'Advance Pending',
  confirmed: 'Confirmed', completed: 'Completed', lost: 'Lost'
};
const STAGE_COLORS = {
  new_inquiry: '#60A5FA', contacted: '#818CF8', negotiation: '#A78BFA',
  quote_sent: '#FBBF24', advance_pending: '#FB923C', confirmed: '#34D399',
  completed: '#10B981', lost: '#F87171'
};
const PRIORITY_BADGE = {
  urgent: { bg: '#FEF2F2', color: '#DC2626', border: '#FEE2E2' },
  high:   { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  medium: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  low:    { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' },
};
const SOURCE_ICON = { whatsapp: '💬', phone: '📞', website: '🌐', referral: '🤝', indiamart: '🛒', google: '🔍', social: '📱', walk_in: '🚶', other: '📧' };
const ACTIVITY_ICONS = {
  lead_created: '🌱', assigned: '👤', reassigned: '🔄', call_made: '📞',
  followup_added: '⏰', quote_sent: '📄', advance_received: '💰',
  booking_confirmed: '🎉', stage_changed: '→', note_added: '✏️', lost: '❌'
};

/* ─── Lead Card (Kanban) ─────────────────────────────────────────────────── */
function LeadCard({ lead, onDragStart, onClick }) {
  const pb = PRIORITY_BADGE[lead.priority] || PRIORITY_BADGE.medium;
  const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date() && !['confirmed', 'completed', 'lost'].includes(lead.leadStatus);

  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(lead._id); }}
      onClick={() => onClick(lead)}
      style={{ cursor: 'grab' }}
    >
      {/* Priority + Source */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="kanban-card-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.customerName}</div>
          <div className="kanban-card-meta">📍 {lead.destination}</div>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', marginLeft: '6px', flexShrink: 0, background: pb.bg, color: pb.color, border: `1px solid ${pb.border}` }}>
          {(lead.priority || 'medium').toUpperCase()}
        </span>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
        <span>🗓 {lead.travelDate ? new Date(lead.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>
        <span>👥 {lead.totalPax || (lead.adults || 0) + (lead.children || 0)} pax</span>
        <span>{SOURCE_ICON[lead.source] || '📧'} {lead.source || '—'}</span>
        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>₹{lead.budget ? (lead.budget / 1000).toFixed(0) + 'K' : '—'}</span>
      </div>

      {/* Assigned to */}
      {lead.assignedEmployee && (
        <div style={{ fontSize: '10px', marginBottom: '6px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#E0E7FF', display: 'grid', placeItems: 'center', fontSize: '8px', fontWeight: 700, color: '#4F46E5' }}>
            {lead.assignedEmployee.name?.[0]?.toUpperCase()}
          </div>
          {lead.assignedEmployee.name}
        </div>
      )}

      {/* Follow-up */}
      {lead.followUpDate && (
        <div style={{ fontSize: '10px', background: isOverdue ? '#FEF2F2' : 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: '6px', marginBottom: '8px', color: isOverdue ? '#DC2626' : 'var(--color-text-muted)', border: isOverdue ? '1px solid #FCA5A5' : 'none' }}>
          {isOverdue ? '⚠️ Overdue: ' : '⏰ Follow-up: '}
          <strong style={{ color: isOverdue ? '#DC2626' : 'var(--color-text-primary)' }}>
            {new Date(lead.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </strong>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
        <a href={`https://wa.me/91${lead.mobileNumber}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-xs" style={{ padding: '4px 8px', fontSize: '12px', color: '#25D366' }} title="WhatsApp">💬</button>
        </a>
        <a href={`tel:${lead.mobileNumber}`} onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-xs" style={{ padding: '4px 8px', fontSize: '12px' }} title="Call">📞</button>
        </a>
      </div>
    </div>
  );
}

/* ─── Lead Detail Drawer ─────────────────────────────────────────────────── */
function LeadDetailDrawer({ lead, onClose, onUpdate, employees, isAdmin }) {
  const { user } = useAuthStore();
  const [tab, setTab]         = useState('details');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm]       = useState({ ...lead, adults: lead.adults || 1, children: lead.children || 0 });
  const [followUpForm, setFollowUpForm] = useState({ note: '', followUpDate: '' });
  const [activityForm, setActivityForm] = useState({ action: 'call_made', description: '' });
  const [assignId, setAssignId] = useState(lead.assignedEmployee?._id || '');
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/leads/${lead._id}`, form);
      onUpdate();
    } catch (err) { console.error(err); } finally { setSaving(false); setEditMode(false); }
  };

  const addFollowUp = async () => {
    if (!followUpForm.note) return;
    try {
      await api.post(`/leads/${lead._id}/followup`, followUpForm);
      setFollowUpForm({ note: '', followUpDate: '' });
      onUpdate();
    } catch (err) { console.error(err); }
  };

  const addActivity = async () => {
    if (!activityForm.description) return;
    try {
      await api.post(`/leads/${lead._id}/activity`, activityForm);
      setActivityForm({ action: 'call_made', description: '' });
      onUpdate();
    } catch (err) { console.error(err); }
  };

  const assignLead = async () => {
    if (!assignId) return;
    try {
      await api.post(`/leads/${lead._id}/assign`, { employeeId: assignId });
      onUpdate();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }} onClick={onClose}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
      <div style={{ width: '480px', background: 'var(--color-bg-elevated)', height: '100%', overflow: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '17px', marginBottom: '2px' }}>{lead.customerName}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>📍 {lead.destination} · {lead.mobileNumber}</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {!editMode && <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(true)}>✏️ Edit</button>}
            {editMode && <button className="btn btn-success btn-sm" onClick={save} disabled={saving}>{saving ? '…' : '💾 Save'}</button>}
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          {[{ k: 'details', l: '📋 Details' }, { k: 'timeline', l: '📜 Timeline' }, { k: 'followup', l: '⏰ Follow-up' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{ flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: tab === t.k ? 700 : 400, color: tab === t.k ? 'var(--color-accent)' : 'var(--color-text-muted)', borderBottom: tab === t.k ? '2px solid var(--color-accent)' : '2px solid transparent' }}>
              {t.l}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {/* Details Tab */}
          {tab === 'details' && (
            <div>
              {/* Status badges */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: STAGE_COLORS[lead.leadStatus] + '20', color: STAGE_COLORS[lead.leadStatus], border: `1px solid ${STAGE_COLORS[lead.leadStatus]}40` }}>
                  {STAGE_LABELS[lead.leadStatus]}
                </span>
                {lead.priority && (
                  <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: PRIORITY_BADGE[lead.priority]?.bg, color: PRIORITY_BADGE[lead.priority]?.color, border: `1px solid ${PRIORITY_BADGE[lead.priority]?.border}` }}>
                    {lead.priority.toUpperCase()} PRIORITY
                  </span>
                )}
              </div>

              {/* Edit Form or View */}
              {editMode ? (
                <div className="form-grid">
                  <div className="form-group"><label className="form-label">Customer Name *</label><input className="form-input" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Mobile *</label><input className="form-input" value={form.mobileNumber} onChange={e => setForm(f => ({ ...f, mobileNumber: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Destination *</label><input className="form-input" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Travel Date</label><input type="date" className="form-input" value={form.travelDate ? new Date(form.travelDate).toISOString().split('T')[0] : ''} onChange={e => setForm(f => ({ ...f, travelDate: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Adults</label><input type="number" className="form-input" min="0" value={form.adults} onChange={e => setForm(f => ({ ...f, adults: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Children</label><input type="number" className="form-input" min="0" value={form.children} onChange={e => setForm(f => ({ ...f, children: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Budget (₹)</label><input type="number" className="form-input" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Priority</label>
                    <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                      {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Source</label>
                    <select className="form-select" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                      {Object.keys(SOURCE_ICON).map(s => <option key={s} value={s}>{SOURCE_ICON[s]} {s}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Follow-up Date</label><input type="date" className="form-input" value={form.followUpDate ? new Date(form.followUpDate).toISOString().split('T')[0] : ''} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} /></div>
                  <div className="form-group full"><label className="form-label">Remarks</label><textarea className="form-textarea" rows={2} value={form.remarks || ''} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} /></div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    ['📱 Mobile', lead.mobileNumber],
                    ['✉️ Email', lead.email || '—'],
                    ['📍 Destination', lead.destination],
                    ['🗓 Travel Date', lead.travelDate ? new Date(lead.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
                    ['👥 Pax', `${lead.adults || 0} adults, ${lead.children || 0} children (${lead.totalPax || 0} total)`],
                    ['💰 Budget', lead.budget ? `₹${Number(lead.budget).toLocaleString('en-IN')}` : '—'],
                    ['📢 Source', `${SOURCE_ICON[lead.source] || ''} ${lead.source || '—'}`],
                    ['⏰ Follow-up', lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
                    ['📝 Remarks', lead.remarks || '—'],
                    ['📅 Created', new Date(lead.createdAt).toLocaleDateString('en-IN')],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', gap: '8px', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ color: 'var(--color-text-muted)', minWidth: '110px', flexShrink: 0 }}>{label}</span>
                      <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Admin: Assignment */}
              {isAdmin && (
                <div style={{ marginTop: '16px', padding: '14px', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>👤 Assign Lead</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select className="form-select" style={{ flex: 1 }} value={assignId} onChange={e => setAssignId(e.target.value)}>
                      <option value="">Select employee…</option>
                      {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={assignLead} disabled={!assignId}>Assign</button>
                  </div>
                  {lead.assignedEmployee && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Currently: <strong style={{ color: 'var(--color-text-primary)' }}>{lead.assignedEmployee.name}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Log Activity */}
              <div style={{ marginTop: '16px', padding: '14px', background: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>📝 Log Activity</div>
                <select className="form-select" style={{ marginBottom: '8px' }} value={activityForm.action} onChange={e => setActivityForm(f => ({ ...f, action: e.target.value }))}>
                  {[['call_made', '📞 Call Made'], ['note_added', '✏️ Note Added'], ['quote_sent', '📄 Quote Sent'], ['advance_received', '💰 Advance Received'], ['booking_confirmed', '🎉 Booking Confirmed']].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input className="form-input" placeholder="Description…" style={{ flex: 1 }} value={activityForm.description} onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))} />
                  <button className="btn btn-primary btn-sm" onClick={addActivity} disabled={!activityForm.description}>Log</button>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {tab === 'timeline' && (
            <div>
              {(!lead.activityTimeline || lead.activityTimeline.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📜</div>
                  No activity recorded yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {lead.activityTimeline.map((act, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', position: 'relative' }}>
                      {/* Line */}
                      {i < lead.activityTimeline.length - 1 && (
                        <div style={{ position: 'absolute', left: '15px', top: '32px', bottom: 0, width: '2px', background: 'var(--color-border)' }} />
                      )}
                      {/* Icon */}
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-bg-secondary)', border: '2px solid var(--color-border)', display: 'grid', placeItems: 'center', fontSize: '14px', flexShrink: 0, zIndex: 1 }}>
                        {ACTIVITY_ICONS[act.action] || '•'}
                      </div>
                      <div style={{ flex: 1, paddingTop: '4px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{act.description || act.action?.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          by {act.performedByName || 'System'} · {new Date(act.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Follow-up Tab */}
          {tab === 'followup' && (
            <div>
              {/* Add follow-up form */}
              <div style={{ padding: '14px', background: 'var(--color-bg-secondary)', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>+ Add Follow-up</div>
                <textarea className="form-textarea" placeholder="Notes about this follow-up…" rows={2} value={followUpForm.note} onChange={e => setFollowUpForm(f => ({ ...f, note: e.target.value }))} style={{ marginBottom: '8px' }} />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="datetime-local" className="form-input" style={{ flex: 1 }} value={followUpForm.followUpDate} onChange={e => setFollowUpForm(f => ({ ...f, followUpDate: e.target.value }))} />
                  <button className="btn btn-primary btn-sm" onClick={addFollowUp} disabled={!followUpForm.note}>Save</button>
                </div>
              </div>

              {/* Follow-up history */}
              {lead.followUps && lead.followUps.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {lead.followUps.slice().reverse().map((fu, i) => {
                    const isOverdue = fu.followUpDate && new Date(fu.followUpDate) < new Date() && fu.status !== 'done';
                    return (
                      <div key={i} style={{ padding: '12px', background: isOverdue ? '#FEF2F2' : 'var(--color-bg-secondary)', borderRadius: '10px', border: `1px solid ${isOverdue ? '#FCA5A5' : 'var(--color-border)'}` }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>{fu.note}</div>
                        <div style={{ fontSize: '11px', color: isOverdue ? '#DC2626' : 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{fu.byName} · {new Date(fu.createdAt).toLocaleDateString('en-IN')}</span>
                          {fu.followUpDate && (
                            <span style={{ fontWeight: 600 }}>
                              {isOverdue ? '⚠️ OVERDUE: ' : '📅 '}{new Date(fu.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontSize: '13px' }}>No follow-ups yet</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main LeadPipeline Component ─────────────────────────────────────────── */
export default function LeadPipeline() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [kanban, setKanban]         = useState({});
  const [loading, setLoading]       = useState(true);
  const [analytics, setAnalytics]   = useState(null);
  const [employees, setEmployees]   = useState([]);
  const [search, setSearch]         = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showAdd, setShowAdd]       = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [dragLeadId, setDragLeadId] = useState(null);
  const [dragOver, setDragOver]     = useState(null);
  const [addForm, setAddForm]       = useState({ customerName: '', mobileNumber: '', destination: '', travelDate: '', adults: 1, children: 0, budget: '', source: 'phone', priority: 'medium', remarks: '', followUpDate: '', assignedEmployee: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [lostModal, setLostModal]   = useState(null); // { leadId, newStage }
  const [lostReason, setLostReason] = useState('');
  const [view, setView]             = useState('kanban'); // kanban | list

  const loadKanban = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/leads/kanban');
      setKanban(data.data || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const loadAnalytics = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/leads/analytics');
      setAnalytics(data.data);
    } catch (err) { console.error(err); }
  }, [isAdmin]);

  const loadEmployees = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/auth/users');
      setEmployees(data.data || []);
    } catch (err) { console.error(err); }
  }, [isAdmin]);

  useEffect(() => {
    loadKanban();
    loadAnalytics();
    loadEmployees();
  }, [loadKanban, loadAnalytics, loadEmployees]);

  /* ─── Drag & Drop ─────────────────────────────────────────────────────── */
  const handleDragOver = (e, stage) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(stage); };
  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDragOver(null);
    if (!dragLeadId) return;

    // Find source stage
    let sourceStage = null;
    for (const [stage, leads] of Object.entries(kanban)) {
      if (leads.some(l => l._id === dragLeadId)) { sourceStage = stage; break; }
    }
    if (sourceStage === targetStage) return;

    // If moving to lost, show modal
    if (targetStage === 'lost') {
      setLostModal({ leadId: dragLeadId, newStage: targetStage });
      setDragLeadId(null);
      return;
    }

    // Optimistic update
    setKanban(prev => {
      const next = { ...prev };
      const lead = (next[sourceStage] || []).find(l => l._id === dragLeadId);
      if (!lead) return prev;
      next[sourceStage] = (next[sourceStage] || []).filter(l => l._id !== dragLeadId);
      next[targetStage] = [{ ...lead, leadStatus: targetStage }, ...(next[targetStage] || [])];
      return next;
    });
    setDragLeadId(null);

    try {
      await api.patch(`/leads/${dragLeadId}/stage`, { leadStatus: targetStage });
    } catch (err) {
      console.error('Stage update failed:', err);
      loadKanban(); // Revert on error
    }
  };

  const confirmLostMove = async () => {
    if (!lostModal) return;
    try {
      await api.patch(`/leads/${lostModal.leadId}/stage`, { leadStatus: 'lost', lostReason });
      setLostModal(null); setLostReason('');
      loadKanban();
    } catch (err) { console.error(err); }
  };

  /* ─── Create Lead ─────────────────────────────────────────────────────── */
  const handleCreate = async () => {
    if (!addForm.customerName || !addForm.mobileNumber || !addForm.destination) return;
    setAddLoading(true);
    try {
      await api.post('/leads', { ...addForm, totalPax: parseInt(addForm.adults || 1) + parseInt(addForm.children || 0) });
      setShowAdd(false);
      setAddForm({ customerName: '', mobileNumber: '', destination: '', travelDate: '', adults: 1, children: 0, budget: '', source: 'phone', priority: 'medium', remarks: '', followUpDate: '', assignedEmployee: '' });
      loadKanban(); loadAnalytics();
    } catch (err) { console.error(err); }
    finally { setAddLoading(false); }
  };

  /* ─── Auto Assign ─────────────────────────────────────────────────────── */
  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      const { data } = await api.post('/leads/auto-assign');
      alert(`✅ ${data.message}`);
      loadKanban();
    } catch (err) { alert(err.response?.data?.message || 'Auto-assign failed'); }
    finally { setAutoAssigning(false); }
  };

  /* ─── Filter leads in kanban ──────────────────────────────────────────── */
  const filterLeads = (leads) => {
    if (!leads) return [];
    return leads.filter(l => {
      const matchSearch = !search || l.customerName?.toLowerCase().includes(search.toLowerCase()) || l.destination?.toLowerCase().includes(search.toLowerCase()) || l.mobileNumber?.includes(search);
      const matchPriority = filterPriority === 'all' || l.priority === filterPriority;
      return matchSearch && matchPriority;
    });
  };

  const totalLeads = Object.values(kanban).flat().length;
  const totalPipeline = Object.values(kanban).flat().reduce((s, l) => s + (l.budget || 0), 0);

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Lead Pipeline</h1>
          <p className="page-sub">
            {totalLeads} leads · Pipeline: <strong>₹{(totalPipeline / 100000).toFixed(1)}L</strong>
            {analytics && <span> · Conversion: <strong style={{ color: 'var(--color-success)' }}>{analytics.conversionRate}%</strong></span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input className="search-input" placeholder="Search leads…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 'auto', padding: '7px 12px', fontSize: '13px' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {isAdmin && (
            <button className="btn btn-secondary btn-sm" onClick={handleAutoAssign} disabled={autoAssigning}>
              {autoAssigning ? '⟳ Assigning…' : '🔄 Auto Assign'}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ New Lead</button>
        </div>
      </div>

      {/* Analytics Row (Admin) */}
      {isAdmin && analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Total Leads', value: analytics.total, color: '#64748B' },
            { label: 'Assigned', value: analytics.assigned, color: '#2563EB' },
            { label: 'Unassigned', value: analytics.unassigned, color: '#D97706' },
            { label: 'Converted', value: analytics.converted, color: '#059669' },
            { label: 'Lost', value: analytics.lost, color: '#DC2626' },
            { label: 'Conv. Rate', value: `${analytics.conversionRate}%`, color: '#7C3AED' },
          ].map(s => (
            <div key={s.label} className="card card-sm" style={{ textAlign: 'center', padding: '12px' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px', animation: 'spin 1s linear infinite' }}>⟳</div>
          Loading leads…
        </div>
      ) : (
        <div className="kanban-board" style={{ overflowX: 'auto' }}>
          {STAGES.map(stage => {
            const cards = filterLeads(kanban[stage] || []);
            const stageValue = cards.reduce((s, l) => s + (l.budget || 0), 0);
            const isDragTarget = dragOver === stage;
            return (
              <div key={stage} className="kanban-col"
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, stage)}
                style={{ outline: isDragTarget ? `2px dashed ${STAGE_COLORS[stage]}` : 'none', background: isDragTarget ? STAGE_COLORS[stage] + '08' : undefined, borderRadius: '12px', transition: 'all 0.2s' }}>
                <div className="kanban-col-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: STAGE_COLORS[stage], flexShrink: 0 }} />
                    <div className="kanban-col-title">{STAGE_LABELS[stage]}</div>
                  </div>
                  <span className="kanban-col-count">{cards.length}</span>
                </div>
                {stageValue > 0 && (
                  <div style={{ padding: '0 8px 6px', fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    ₹{(stageValue / 1000).toFixed(0)}K pipeline
                  </div>
                )}
                <div className="kanban-cards">
                  {cards.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 8px', fontSize: '11px', color: isDragTarget ? STAGE_COLORS[stage] : 'var(--color-text-muted)', border: `1px dashed ${isDragTarget ? STAGE_COLORS[stage] : 'var(--color-border)'}`, borderRadius: '10px', transition: 'all 0.2s' }}>
                      {isDragTarget ? 'Drop here' : 'No leads'}
                    </div>
                  ) : (
                    cards.map(lead => (
                      <LeadCard key={lead._id} lead={lead}
                        onDragStart={setDragLeadId}
                        onClick={async (l) => {
                          try {
                            const { data } = await api.get(`/leads/${l._id}`);
                            setSelectedLead(data.data);
                          } catch { setSelectedLead(l); }
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          employees={employees}
          isAdmin={isAdmin}
          onClose={() => setSelectedLead(null)}
          onUpdate={async () => {
            await loadKanban();
            await loadAnalytics();
            try { const { data } = await api.get(`/leads/${selectedLead._id}`); setSelectedLead(data.data); } catch {}
          }}
        />
      )}

      {/* Add Lead Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title">+ New Lead</div>
              <button className="modal-close" onClick={() => setShowAdd(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Customer Name *</label><input className="form-input" placeholder="Rajesh Kumar" value={addForm.customerName} onChange={e => setAddForm(f => ({ ...f, customerName: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Mobile Number *</label><input className="form-input" placeholder="9876543210" value={addForm.mobileNumber} onChange={e => setAddForm(f => ({ ...f, mobileNumber: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Destination *</label><input className="form-input" placeholder="Manali, HP" value={addForm.destination} onChange={e => setAddForm(f => ({ ...f, destination: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Travel Date</label><input type="date" className="form-input" value={addForm.travelDate} onChange={e => setAddForm(f => ({ ...f, travelDate: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Adults</label><input type="number" className="form-input" min="0" value={addForm.adults} onChange={e => setAddForm(f => ({ ...f, adults: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Children</label><input type="number" className="form-input" min="0" value={addForm.children} onChange={e => setAddForm(f => ({ ...f, children: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Budget (₹)</label><input type="number" className="form-input" placeholder="50000" value={addForm.budget} onChange={e => setAddForm(f => ({ ...f, budget: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Source</label>
                  <select className="form-select" value={addForm.source} onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}>
                    {Object.keys(SOURCE_ICON).map(s => <option key={s} value={s}>{SOURCE_ICON[s]} {s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Priority</label>
                  <select className="form-select" value={addForm.priority} onChange={e => setAddForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="urgent">Urgent</option>
                  </select>
                </div>
                {isAdmin && (
                  <div className="form-group"><label className="form-label">Assign To</label>
                    <select className="form-select" value={addForm.assignedEmployee} onChange={e => setAddForm(f => ({ ...f, assignedEmployee: e.target.value }))}>
                      <option value="">Unassigned</option>
                      {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group"><label className="form-label">Follow-up Date</label><input type="date" className="form-input" value={addForm.followUpDate} onChange={e => setAddForm(f => ({ ...f, followUpDate: e.target.value }))} /></div>
                <div className="form-group full"><label className="form-label">Remarks</label><textarea className="form-textarea" placeholder="Any special requirements…" value={addForm.remarks} onChange={e => setAddForm(f => ({ ...f, remarks: e.target.value }))} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={addLoading || !addForm.customerName || !addForm.mobileNumber || !addForm.destination}>
                {addLoading ? '⟳ Saving…' : '💾 Create Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lost Reason Modal */}
      {lostModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '400px' }}>
            <div className="modal-header"><div className="modal-title">❌ Mark as Lost</div></div>
            <div className="modal-body">
              <label className="form-label">Reason for losing this lead *</label>
              <textarea className="form-textarea" placeholder="Budget issue, competitor won, no response…" rows={3} value={lostReason} onChange={e => setLostReason(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setLostModal(null); setLostReason(''); loadKanban(); }}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmLostMove} disabled={!lostReason}>Mark Lost</button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowAdd(true)}
        style={{ position: 'fixed', bottom: '28px', right: '28px', width: '52px', height: '52px', borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#fff', fontSize: '24px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,0.4)', display: 'grid', placeItems: 'center', zIndex: 100 }}
        title="Add New Lead">+</button>
    </div>
  );
}

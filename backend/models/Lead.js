const mongoose = require('mongoose');

// Activity timeline entry
const ActivitySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      'lead_created', 'assigned', 'reassigned', 'call_made',
      'followup_added', 'quote_sent', 'advance_received',
      'booking_confirmed', 'stage_changed', 'note_added', 'lost'
    ],
    required: true
  },
  description:  { type: String },
  performedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String },
  timestamp:    { type: Date, default: Date.now },
  meta:         { type: mongoose.Schema.Types.Mixed }, // extra data (old stage, new stage, etc.)
}, { _id: true });

const FollowUpSchema = new mongoose.Schema({
  note:         { type: String },
  followUpDate: { type: Date },
  status:       { type: String, enum: ['pending', 'done', 'overdue'], default: 'pending' },
  by:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  byName:       { type: String },
  createdAt:    { type: Date, default: Date.now },
}, { _id: true });

const LeadSchema = new mongoose.Schema({
  // Basic Customer Info
  customerName:   { type: String, required: true, trim: true },
  mobileNumber:   { type: String, required: true, trim: true },
  email:          { type: String, lowercase: true, trim: true },

  // Trip Details
  destination:    { type: String, required: true, trim: true },
  travelDate:     { type: Date },
  returnDate:     { type: Date },
  adults:         { type: Number, default: 1, min: 0 },
  children:       { type: Number, default: 0, min: 0 },
  totalPax:       { type: Number, default: 1 },
  nights:         { type: Number, default: 1 },
  budget:         { type: Number, default: 0 },

  // Lead Classification
  source: {
    type: String,
    enum: ['website', 'whatsapp', 'phone', 'referral', 'indiamart', 'google', 'social', 'walk_in', 'other'],
    default: 'phone'
  },
  leadStatus: {
    type: String,
    enum: ['new_inquiry', 'contacted', 'negotiation', 'quote_sent', 'advance_pending', 'confirmed', 'completed', 'lost'],
    default: 'new_inquiry'
  },
  priority:       { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  aiScore:        { type: Number, min: 0, max: 100, default: 50 },

  // Assignment
  assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Follow-up
  followUpDate:   { type: Date },
  followUps:      [FollowUpSchema],

  // Remarks & Notes
  remarks:        { type: String },
  notes:          { type: String },

  // Linked documents
  quotationId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  booking:        { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },

  // WhatsApp
  whatsappSent:   { type: Boolean, default: false },
  lastWhatsappAt: { type: Date },

  // Activity Timeline
  activityTimeline: [ActivitySchema],

  // Loss info
  lostReason:     { type: String },
  lostAt:         { type: Date },

  tags:           [{ type: String }],

}, { timestamps: true });

// Indexes
LeadSchema.index({ leadStatus: 1, assignedEmployee: 1, travelDate: 1 });
LeadSchema.index({ mobileNumber: 1 });
LeadSchema.index({ customerName: 'text', mobileNumber: 'text', destination: 'text' });
LeadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', LeadSchema);

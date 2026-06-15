const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'lead_assigned',
      'lead_reassigned',
      'followup_reminder',
      'followup_overdue',
      'lead_converted',
      'lead_lost',
      'attendance_marked',
      'geofence_failure',
      'quote_sent',
      'advance_received',
      'booking_confirmed',
      'general'
    ],
    required: true
  },
  title:      { type: String, required: true },
  message:    { type: String, required: true },
  read:       { type: Boolean, default: false },
  readAt:     { type: Date },

  // Optional references
  leadId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  actionUrl:  { type: String }, // frontend route to navigate to

}, { timestamps: true });

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);

const Booking = require('../models/Booking');
const Lead = require('../models/Lead');
const Transaction = require('../models/Transaction');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @route  GET /api/analytics/overview
const getOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0);

    // Revenue this month
    const revenueThisMonth = await Transaction.aggregate([
      { $match: { type: 'income', date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Revenue last month
    const revenueLastMonth = await Transaction.aggregate([
      { $match: { type: 'income', date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Bookings
    const totalBookings = await Booking.countDocuments({ status: 'confirmed' });
    const bookingsThisMonth = await Booking.countDocuments({ status: 'confirmed', createdAt: { $gte: startOfMonth } });

    // Leads funnel (real data)
    const leadStages = await Lead.aggregate([
      { $group: { _id: '$leadStatus', count: { $sum: 1 } } }
    ]);

    // Monthly revenue trend (last 6 months)
    const trend = await Transaction.aggregate([
      { $match: { type: 'income', date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
      { $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        total: { $sum: '$amount' }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Pending payments
    const pendingPayments = await Booking.aggregate([
      { $match: { status: 'confirmed', balanceDue: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$balanceDue' }, count: { $sum: 1 } } }
    ]);

    // Destination analytics (from bookings)
    const destinations = await Booking.aggregate([
      { $group: { _id: '$destination', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Employee performance (from leads)
    const performance = await Lead.aggregate([
      { $match: { leadStatus: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: '$assignedEmployee', conversions: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', conversions: 1, _id: 0 } },
      { $sort: { conversions: -1 } },
      { $limit: 5 }
    ]);

    // Lead summary
    const totalLeads = await Lead.countDocuments();
    const assignedLeads = await Lead.countDocuments({ assignedEmployee: { $ne: null } });
    const convertedLeads = await Lead.countDocuments({ leadStatus: { $in: ['confirmed', 'completed'] } });
    const lostLeads = await Lead.countDocuments({ leadStatus: 'lost' });

    // Source distribution (from leads)
    const sourceDistribution = await Lead.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    // Today's attendance stats
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.find({ date: today });
    const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });

    const gross = revenueThisMonth[0]?.total || 0;
    const lastMonthGross = revenueLastMonth[0]?.total || 0;
    const growth = lastMonthGross > 0 ? (((gross - lastMonthGross) / lastMonthGross) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        revenue: { thisMonth: gross, lastMonth: lastMonthGross, growth },
        bookings: { total: totalBookings, thisMonth: bookingsThisMonth },
        leads: { total: totalLeads, assigned: assignedLeads, unassigned: totalLeads - assignedLeads, converted: convertedLeads, lost: lostLeads, conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0 },
        leadStages, trend,
        pendingPayments: pendingPayments[0] || { total: 0, count: 0 },
        destinations, performance, sourceDistribution,
        attendance: {
          today: {
            present: todayAttendance.filter(r => ['present', 'late'].includes(r.attendanceStatus)).length,
            absent: Math.max(0, totalEmployees - todayAttendance.filter(r => r.checkInTime).length),
            wfh: todayAttendance.filter(r => r.workMode === 'wfh' && r.checkInTime).length,
            late: todayAttendance.filter(r => r.attendanceStatus === 'late').length,
            totalEmployees
          }
        }
      }
    });
  } catch (err) { next(err); }
};

module.exports = { getOverview };

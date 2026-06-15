const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getLeads, createLead, getLead, updateLead, updateStage,
  addFollowup, deleteLead, getKanban, assignLead, autoAssignLeads,
  addActivity, getLeadAnalytics
} = require('../controllers/leadController');

router.get('/kanban',         protect, getKanban);
router.get('/analytics',      protect, adminOnly, getLeadAnalytics);
router.post('/auto-assign',   protect, adminOnly, autoAssignLeads);

router.get('/',               protect, getLeads);
router.post('/',              protect, createLead);
router.get('/:id',            protect, getLead);
router.put('/:id',            protect, updateLead);
router.patch('/:id/stage',    protect, updateStage);
router.post('/:id/assign',    protect, adminOnly, assignLead);
router.post('/:id/followup',  protect, addFollowup);
router.post('/:id/activity',  protect, addActivity);
router.delete('/:id',         protect, adminOnly, deleteLead);

module.exports = router;

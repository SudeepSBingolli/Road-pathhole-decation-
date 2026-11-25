const cron = require('node-cron');
const Report = require('../models/Report');
const { notifyAndEmit } = require('../config/socket');

/**
 * Initializes the hourly cron job to flag overdue reports
 */
const initOverdueCron = () => {
  // Default to running at minute 0 of every hour: '0 * * * *'
  const schedule = process.env.OVERDUE_CRON_SCHEDULE || '0 * * * *';

  cron.schedule(schedule, async () => {
    console.log('[Cron Job] Checking for overdue road reports...');
    try {
      const now = new Date();

      // Find reports where dueDate has passed, status is not verified/rejected/duplicate, and isOverdue is false
      const overdueReports = await Report.find({
        dueDate: { $lt: now, $ne: null },
        status: { $nin: ['verified', 'rejected', 'duplicate'] },
        isOverdue: false
      }).populate('assignedTeam', 'name members');

      if (overdueReports.length === 0) {
        console.log('[Cron Job] No newly overdue reports found.');
        return;
      }

      console.log(`[Cron Job] Found ${overdueReports.length} newly overdue report(s). Updating...`);

      for (const report of overdueReports) {
        report.isOverdue = true;
        report.statusHistory.push({
          status: report.status,
          note: `Report marked overdue: due date (${report.dueDate.toISOString().split('T')[0]}) has passed without verification.`,
          at: now
        });
        await report.save();

        const teamRooms = report.assignedTeam
          ? [`team:${report.assignedTeam._id.toString()}`]
          : [];
        const recipientUserIds =
          report.assignedTeam && report.assignedTeam.members
            ? report.assignedTeam.members
            : [];

        // Realtime notification
        await notifyAndEmit({
          event: 'report:statusChanged',
          rooms: ['role:admin', ...teamRooms],
          data: {
            reportId: report._id,
            complaintId: report.complaintId,
            isOverdue: true,
            dueDate: report.dueDate,
            status: report.status
          },
          message: `OVERDUE ALERT: Report ${report.complaintId} has passed its due date without verified completion.`,
          reportId: report._id,
          recipientUserIds
        });
      }

      console.log(`[Cron Job] Successfully flagged ${overdueReports.length} overdue report(s).`);
    } catch (err) {
      console.error('[Cron Job Error] Failed to process overdue reports:', err.message);
    }
  });

  console.log(`[Cron Job] Overdue checker scheduled with expression: '${schedule}'`);
};

module.exports = { initOverdueCron };


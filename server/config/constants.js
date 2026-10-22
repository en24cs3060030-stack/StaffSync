// Shared HR rules - change them here and the whole app follows
module.exports = {
  ROLES: ['hr', 'manager', 'employee'],
  LEAVE_TYPES: ['Casual', 'Sick', 'Earned', 'Unpaid'],
  // yearly paid-leave quota (Unpaid has no limit)
  LEAVE_QUOTA: { Casual: 12, Sick: 10, Earned: 15 },
  ATTENDANCE_STATUS: ['Present', 'Late', 'Half Day', 'Absent', 'On Leave'],
  ANNOUNCEMENT_CATEGORIES: ['General', 'Policy', 'Event', 'Holiday', 'Urgent'],
  TRAINING_MODES: ['Online', 'Offline', 'Hybrid'],
};

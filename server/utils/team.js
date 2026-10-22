const Manager = require('../models/managerModel');
const Employee = require('../models/employeeModel');

// Returns the manager profile and the employee profiles that report to this manager user
const getTeam = async (managerUserId) => {
  const manager = await Manager.findOne({ user: managerUserId });
  if (!manager) return { manager: null, members: [] };
  const members = await Employee.find({ manager: manager._id }).populate('user', 'name email phone isActive');
  return { manager, members };
};

const getTeamUserIds = async (managerUserId) => {
  const { members } = await getTeam(managerUserId);
  return members.map((m) => m.user._id);
};

module.exports = { getTeam, getTeamUserIds };

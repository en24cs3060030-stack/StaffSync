const Manager = require('../models/managerModel');
const factory = require('./staffFactory');

module.exports = factory({ Model: Manager, role: 'manager', idField: 'managerId', prefix: 'MGR' });

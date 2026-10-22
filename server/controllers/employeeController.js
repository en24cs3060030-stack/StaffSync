const Employee = require('../models/employeeModel');
const factory = require('./staffFactory');

module.exports = factory({ Model: Employee, role: 'employee', idField: 'employeeId', prefix: 'EMP' });

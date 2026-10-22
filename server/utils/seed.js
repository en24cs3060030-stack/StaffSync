// npm run seed  -> creates the HR account + a demo manager, employees, announcements, training, attendance and leaves
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const Manager = require('../models/managerModel');
const Attendance = require('../models/attendanceModel');
const Leave = require('../models/leaveModel');
const Announcement = require('../models/announcementModel');
const Training = require('../models/trainingModel');
const generateId = require('./generateId');
const { toDateKey } = require('./dateUtils');

const DAY = 24 * 3600 * 1000;
const key = (offset) => toDateKey(new Date(Date.now() + offset * DAY));

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let hr = await User.findOne({ email: process.env.HR_EMAIL.toLowerCase() });
  if (!hr) {
    hr = await User.create({ name: process.env.HR_NAME, email: process.env.HR_EMAIL, password: process.env.HR_PASSWORD, role: 'hr', phone: '9000000001' });
    console.log(`HR created: ${process.env.HR_EMAIL} / ${process.env.HR_PASSWORD}`);
  } else console.log('HR already exists');

  if (await Manager.countDocuments()) {
    console.log('Demo data already exists - nothing else to seed');
    return;
  }

  // ----- manager -----
  const mUser = await User.create({ name: 'Rohan Mehta', email: 'manager@staffsync.com', password: 'Manager@123', role: 'manager', phone: '9000000002' });
  const manager = await Manager.create({ user: mUser._id, managerId: await generateId(Manager, 'managerId', 'MGR'), department: 'Engineering', designation: 'Engineering Manager', gender: 'Male', dateOfJoining: new Date('2021-04-12') });
  console.log('Manager created: manager@staffsync.com / Manager@123');

  // ----- employees -----
  const people = [
    ['Aarav Sharma', 'employee1@staffsync.com', 'Engineering', 'Software Engineer', 'Male'],
    ['Priya Verma', 'employee2@staffsync.com', 'Engineering', 'QA Engineer', 'Female'],
    ['Neha Patel', 'employee3@staffsync.com', 'Design', 'UI Designer', 'Female'],
  ];
  const employees = [];
  for (const [i, [name, email, department, designation, gender]] of people.entries()) {
    const u = await User.create({ name, email, password: 'Employee@123', role: 'employee', phone: `90000001${i}0` });
    employees.push(await Employee.create({
      user: u._id, employeeId: await generateId(Employee, 'employeeId', 'EMP'), department, designation, gender,
      manager: i < 2 ? manager._id : null, // Neha is left unassigned so a manager can add her to the team
      dateOfJoining: new Date(Date.now() - (200 + i * 90) * DAY),
    }));
  }
  console.log('Employees created: employee1/2/3@staffsync.com / Employee@123');

  // ----- attendance for the last few days -----
  const now = new Date();
  const att = [];
  for (let d = 1; d <= 4; d++) {
    for (const e of employees) {
      const inAt = new Date(`${key(-d)}T09:${d % 2 ? '05' : '40'}:00`);
      const outAt = new Date(`${key(-d)}T18:10:00`);
      att.push({ user: e.user, date: key(-d), checkIn: inAt, checkOut: outAt, workHours: 8.5, status: d % 2 ? 'Present' : 'Late' });
    }
  }
  att.push({ user: employees[0].user, date: toDateKey(now), checkIn: new Date(), status: 'Present' });
  await Attendance.insertMany(att);

  // ----- leaves -----
  await Leave.insertMany([
    { user: employees[0].user, leaveType: 'Casual', startDate: key(5), endDate: key(6), days: 2, reason: 'Family function', status: 'Pending' },
    { user: employees[1].user, leaveType: 'Sick', startDate: key(-10), endDate: key(-9), days: 2, reason: 'Fever', status: 'Approved', reviewedBy: mUser._id, reviewedAt: new Date() },
    { user: employees[2].user, leaveType: 'Earned', startDate: key(10), endDate: key(12), days: 3, reason: 'Short trip', status: 'Pending' },
  ]);

  // ----- announcements & training -----
  await Announcement.insertMany([
    { title: 'Welcome to StaffSync', content: 'StaffSync is now our one place for attendance, leaves, announcements and training. Please complete your profile.', category: 'General', isPinned: true, postedBy: hr._id },
    { title: 'Diwali Holiday Schedule', content: 'The office will remain closed during the Diwali break. Please apply for any extra leave in advance.', category: 'Holiday', postedBy: hr._id },
    { title: 'Updated Leave Policy', content: 'Employees now get 12 casual, 10 sick and 15 earned leaves each year. Unpaid leave is unlimited with manager approval.', category: 'Policy', postedBy: hr._id },
  ]);
  await Training.create({
    title: 'Secure Coding Basics', description: 'OWASP top 10, authentication best practices and secure API design.', trainer: 'Anil Kapoor', mode: 'Online', location: 'https://meet.example.com/secure-coding',
    startDate: new Date(Date.now() + 3 * DAY), endDate: new Date(Date.now() + 3 * DAY + 4 * 3600 * 1000), capacity: 25, createdBy: mUser._id, enrolled: [employees[0].user],
  });

  console.log('Demo announcements, training, attendance and leaves created');
})()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());

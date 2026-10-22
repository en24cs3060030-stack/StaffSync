# StaffSync – Human Resource Management System (MERN, no TypeScript)

HR, managers and employees manage attendance, leaves, announcements, training and employee records in one secure app.

## 1. Install once
- Node.js 18+  → https://nodejs.org
- MongoDB Community Server → https://www.mongodb.com/try/download/community  (or a free MongoDB Atlas URI)

## 2. Run the backend
```bash
cd StaffSync/server
npm install
# edit .env  (set JWT_SECRET; MONGO_URI is already set for local MongoDB)
npm run seed     # creates the HR account + demo manager, employees, announcements, training, leaves
npm run dev      # API on http://localhost:5000
```
Check: open http://localhost:5000/api/health

## 3. Run the frontend (separate terminal - keep the backend running)
```bash
cd StaffSync/client
npm install
npm run dev      # http://localhost:5173
```
`client/vite.config.js` proxies `/api` to http://localhost:5000, so no CORS setup is needed in development.

## Demo logins (created by `npm run seed`)
| Role | Email | Password |
|---|---|---|
| HR | hr@staffsync.com | Hr@12345 |
| Manager | manager@staffsync.com | Manager@123 |
| Employee | employee1@staffsync.com (also employee2, employee3) | Employee@123 |

`employee3` (Neha) has no manager yet, so you can add her from **My Team → Add member** when logged in as the manager.
Public registration always creates an **Employee**; HR creates managers and other employees from the HR screens.

## Pages
| Everyone | Manager | HR |
|---|---|---|
| `/` Home, `/login`, `/register` | `/team` My Team (+ performance reviews) | `/hr/employees`, `/hr/managers` |
| `/dashboard` (Employee / Manager / HR dashboard) | `/team/attendance` Team attendance | `/hr/attendance` Track attendance |
| `/profile`, `/attendance`, `/leaves` | `/leave-requests` Approve / reject | `/leave-requests` (everyone) |
| `/announcements`, `/trainings`, `/notifications` | `/trainings` create & manage programmes | `/hr/reports` Reports & analytics (CSV export) |

## Business rules
- **Attendance:** check-in after `LATE_AFTER` (default 10:15) is marked *Late*; working fewer than `HALF_DAY_HOURS` (default 4) is marked *Half Day*. Approved leave days become *On Leave* automatically.
- **Leave quota per year:** Casual 12, Sick 10, Earned 15, Unpaid unlimited (`server/config/constants.js`).
- **Who approves leave:** a manager approves their team's leaves; HR approves anyone's (managers' own leaves go to HR). Nobody can review their own request.
- **Trainings:** managers/HR create them; employees enrol (capacity enforced); managers can enrol their own team members.
- **Notifications** are created automatically (leave applied/reviewed, announcements, new trainings, performance reviews…).

## API summary  (base: /api)
| Area | Endpoints |
|---|---|
| Auth | POST /auth/register, /auth/login, /auth/logout · GET /auth/me · PUT /auth/password |
| Profile | GET/PUT /profile |
| Employees (HR) | GET /employees (?search&department&manager&page&limit), GET /employees/all, GET/PUT/DELETE /employees/:id, POST /employees |
| Managers (HR) | same as employees under /managers |
| Team (Manager) | GET /team · GET /team/attendance?date · GET /team/unassigned · POST /team/members · DELETE /team/members/:id · GET /team/:id · POST /team/:id/performance |
| Attendance | GET /attendance/today, /attendance/my?month · POST /attendance/check-in, /check-out · HR: GET /attendance (?date&month&status&search), POST /attendance/manual, DELETE /attendance/:id |
| Leaves | POST /leaves · GET /leaves/my, /leaves/balance · PUT /leaves/:id/cancel · Manager/HR: GET /leaves (?status), PUT /leaves/:id/review |
| Announcements | GET /announcements (?category&search) · HR: POST, PUT/DELETE /announcements/:id |
| Trainings | GET /trainings (?status&mine&enrolled) · POST /trainings/:id/enroll, /unenroll · Manager/HR: POST, GET/PUT/DELETE /trainings/:id, POST /trainings/:id/assign |
| Notifications | GET /notifications, /notifications/unread-count · PUT /notifications/read-all, /notifications/:id/read · DELETE /notifications/:id |
| Dashboard / Reports | GET /dashboard (per role) · HR: GET /reports/analytics?month |

Auth: JWT is set as an httpOnly cookie and also returned in JSON. For Postman use header `Authorization: Bearer <token>`.

## Security & optimisation checklist
- JWT authentication, bcrypt password hashing, role-based access control (`authorize('hr','manager')`), protected React routes
- Input validation (controllers + Mongoose schemas + ObjectId validation middleware), helmet, rate limiting on auth routes
- MongoDB indexes on every frequently filtered field (unique user+date for attendance, status/date for reports, etc.)
- Pagination on all lists, React lazy loading for every page, `X-Response-Time` header + slow-request log (`SLOW_REQUEST_MS`)

## Test checklist (manual)
1. **Authentication:** register, login, wrong password, logout, open `/hr/employees` as an employee (redirects).
2. **Attendance:** check-in → check-out, second check-in is refused, HR corrects a record.
3. **Leave:** apply (balance + overlap checks), manager approves, employee sees status, cancel a pending request.
4. **Employee management:** HR adds / edits / deactivates / deletes an employee and a manager.
5. **Dashboards:** log in as each role and verify the numbers match the data.

# Appointment system (local)

End-to-end appointment requests with doctor approval, backed by local MongoDB.

## Prerequisites

- Node.js 20+
- MongoDB running locally (`mongodb://127.0.0.1:27017`)

## Setup

```bash
# Frontend deps (repo root)
npm install

# API deps + seed doctors/services/availability
npm --prefix server install
npm run seed
```

## Run

```bash
# Terminal 1 — API on :4000
npm run server

# Terminal 2 — Vite on :5173 (proxies /api → :4000)
npm run dev
```

## URLs

- Patient booking: http://localhost:5173/book-appointment/
- Doctor dashboard: http://localhost:5173/doctor-dashboard/
- Appointment status: http://localhost:5173/appointment-status/<token>/

## Seeded login

| Email | Password |
| --- | --- |
| doctor@mukhijaskinclinic.com | value of `DASHBOARD_PASS` in `server/.env` |

After login, choose **Dr. R. D. Mukhija** or **Dr. Gaurav Mukhija**. You can switch doctors anytime from the dashboard dropdown.

## Email (GoDaddy SMTP)

Emails send from `appointments@drmukhijaskinclinic.com` when SMTP is configured.

1. Open `server/.env`
2. Set `SMTP_PASS` to the mailbox password for `appointments@drmukhijaskinclinic.com`
3. Keep:
   - `EMAIL_PROVIDER=smtp`
   - `EMAIL_FROM=appointments@drmukhijaskinclinic.com`
   - `SMTP_HOST=smtp.titan.email`
   - `SMTP_PORT=465`
   - `SMTP_SECURE=true`
   - `SMTP_USER=appointments@drmukhijaskinclinic.com`
4. Restart the API (`npm run server`)

If SMTP auth fails, try `SMTP_PORT=587` and `SMTP_SECURE=false`.

Use `EMAIL_PROVIDER=console` to disable real sending (logs only).

Patient emails require an email on the booking form. New request alerts also go to `EMAIL_STAFF_TO` (default: appointments@).

## Appointment reminders

Reminder jobs run automatically when the server starts:

- **24-hour reminder** — runs daily at 8 PM IST, sends email/WhatsApp reminders for next day's approved appointments
- **2-hour reminder** — runs every 30 minutes, sends WhatsApp reminders for appointments 1–3 hours ahead

Reminders only send to approved appointments and skip if already sent (idempotent). Patients must have opted in to email/WhatsApp notifications.


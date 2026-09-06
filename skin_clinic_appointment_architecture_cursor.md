# Skin Clinic Appointment System — End-to-End Architecture & Cursor Implementation Plan

## 1. Objective

Build a complete appointment-request and approval system for a skin clinic website using:

- **Frontend:** Existing clinic website
- **Backend:** Existing application backend/API
- **Database:** MongoDB
- **Email:** Transactional email provider (recommended: Resend, SendGrid, AWS SES, or equivalent)
- **WhatsApp:** WhatsApp Business Platform / Cloud API through an approved provider
- **Doctor Dashboard:** Secure authenticated dashboard
- **Optional:** Patient photo upload, appointment reminders, rescheduling, cancellation

The intended workflow is:

```text
Patient
   |
   v
Website Booking Form
   |
   v
Backend API
   |
   +----> MongoDB
   |
   +----> Notification Service
              |
              +----> Email
              |
              +----> WhatsApp
   |
   v
Doctor Dashboard
   |
   +---- Approve
   |
   +---- Reject
   |
   +---- Reschedule
   |
   v
Notification Service
   |
   +----> Patient Email
   |
   +----> Patient WhatsApp
```

The appointment should initially be a **REQUEST**, not a confirmed appointment. It becomes **APPROVED** only after the doctor accepts it.

---

# 2. Product Scope

## Patient side

The patient should be able to:

1. Select a treatment/service.
2. Select a preferred date.
3. Select an available time slot.
4. Enter personal/contact information.
5. Describe their skin/hair concern.
6. Optionally answer a short questionnaire.
7. Optionally upload photos.
8. Provide required consent.
9. Submit an appointment request.
10. Receive an immediate acknowledgement.
11. Receive approval/rejection/rescheduling communication.
12. Receive reminders.
13. Cancel or request rescheduling if permitted.

## Doctor side

The doctor should be able to:

1. Log in securely.
2. See pending appointment requests.
3. View patient/contact details.
4. View the patient's stated concern/questionnaire.
5. View uploaded images.
6. Approve the appointment.
7. Reject the appointment with an optional reason.
8. Request rescheduling.
9. Manage availability.
10. View upcoming appointments.
11. Mark appointments completed/cancelled/no-show.
12. Add internal appointment notes.
13. See notification status.

---

# 3. Recommended Architecture

Use a modular backend rather than putting all logic into the booking route.

```text
                         ┌─────────────────────┐
                         │   Patient Website   │
                         │   React / Next.js   │
                         └──────────┬──────────┘
                                    |
                                    | HTTPS
                                    v
                         ┌─────────────────────┐
                         │     Backend API     │
                         │                     │
                         │ Auth                │
                         │ Booking              │
                         │ Availability         │
                         │ Appointments         │
                         │ Patients             │
                         │ Notifications        │
                         └──────────┬──────────┘
                                    |
                     ┌──────────────┼───────────────┐
                     |              |               |
                     v              v               v
              ┌────────────┐ ┌────────────┐ ┌──────────────┐
              │  MongoDB   │ │  Storage   │ │ Notification │
              │            │ │            │ │   Queue      │
              │ Patients   │ │ Skin Photos│ │ / Jobs       │
              │ Appointments││            │ │              │
              │ Doctors    │ └────────────┘ └──────┬───────┘
              │ Services   │                       |
              └────────────┘              ┌────────┼────────┐
                                          |        |        |
                                          v        v        v
                                        Email   WhatsApp  Reminders


                         ┌─────────────────────┐
                         │  Doctor Dashboard   │
                         │                     │
                         │ Login/Auth          │
                         │ Requests            │
                         │ Calendar            │
                         │ Patients            │
                         │ Availability         │
                         └──────────┬──────────┘
                                    |
                                    v
                              Backend API
```

---

# 4. Important Design Decision: MongoDB

MongoDB is appropriate for this use case because patient questionnaires and appointment information can evolve over time.

Use separate collections instead of one enormous appointment document.

Recommended collections:

```text
users
doctors
patients
services
appointments
appointment_status_history
doctor_availability
doctor_schedule_exceptions
patient_questionnaires
patient_images
notifications
notification_templates
clinic_settings
```

---

# 5. MongoDB Data Model

## 5.1 users

Used for authentication and roles.

```javascript
{
  _id: ObjectId,
  email: String,
  passwordHash: String,
  role: "doctor" | "receptionist" | "admin",
  doctorId: ObjectId | null,
  isActive: Boolean,
  lastLoginAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

Do not store plain-text passwords.

Recommended indexes:

```javascript
{ email: 1 } // unique
{ role: 1 }
```

---

# 6. doctors

```javascript
{
  _id: ObjectId,
  name: String,
  title: String,
  email: String,
  phone: String,
  whatsappNumber: String,
  profileImage: String | null,
  isActive: Boolean,
  timezone: String,
  createdAt: Date,
  updatedAt: Date
}
```

Example:

```json
{
  "name": "Dr. Example",
  "title": "Dermatologist",
  "email": "doctor@example.com",
  "phone": "+91XXXXXXXXXX",
  "whatsappNumber": "+91XXXXXXXXXX",
  "timezone": "Asia/Kolkata",
  "isActive": true
}
```

---

# 7. patients

A patient should have one patient record even if they make multiple appointment requests.

```javascript
{
  _id: ObjectId,
  fullName: String,
  phone: String,
  email: String | null,
  age: Number | null,
  gender: String | null,
  whatsappOptIn: Boolean,
  emailOptIn: Boolean,
  createdAt: Date,
  updatedAt: Date,
  lastAppointmentAt: Date | null
}
```

Recommended indexes:

```javascript
{ phone: 1 }
{ email: 1 }
```

Do not assume phone/email is always unique unless the clinic's business rules require it.

---

# 8. services

```javascript
{
  _id: ObjectId,
  name: String,
  slug: String,
  description: String,
  durationMinutes: Number,
  price: Number | null,
  currency: String,
  isActive: Boolean,
  sortOrder: Number,
  createdAt: Date,
  updatedAt: Date
}
```

Examples:

```text
Acne Consultation
Pigmentation Consultation
Hair Fall Consultation
Laser Consultation
Skin Rejuvenation
Anti-Aging Consultation
```

Do not hardcode services in the frontend.

---

# 9. appointments

This is the primary appointment collection.

```javascript
{
  _id: ObjectId,

  appointmentNumber: String,

  patientId: ObjectId,
  doctorId: ObjectId,
  serviceId: ObjectId,

  appointmentDate: Date,

  startTime: String,
  endTime: String,

  status:
    "PENDING" |
    "APPROVED" |
    "REJECTED" |
    "RESCHEDULE_REQUESTED" |
    "CANCELLED" |
    "COMPLETED" |
    "NO_SHOW",

  bookingSource: "WEBSITE" | "ADMIN",

  patientNotes: String | null,

  doctorNotes: String | null,

  rejectionReason: String | null,

  cancellationReason: String | null,

  rescheduleReason: String | null,

  approvedAt: Date | null,
  rejectedAt: Date | null,
  cancelledAt: Date | null,
  completedAt: Date | null,

  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

```javascript
{ appointmentNumber: 1 } // unique
{ doctorId: 1, appointmentDate: 1, startTime: 1 }
{ patientId: 1, appointmentDate: -1 }
{ status: 1, createdAt: -1 }
{ appointmentDate: 1, status: 1 }
```

---

# 10. Appointment Status Lifecycle

Use an explicit state machine.

```text
                    ┌──────────────┐
                    │    PENDING   │
                    └──────┬───────┘
                           |
                ┌──────────┼───────────┐
                |          |           |
                v          v           v
           APPROVED     REJECTED   RESCHEDULE_REQUESTED
                |                         |
                |                         v
                |                    PENDING/APPROVED
                |
        ┌───────┼────────┐
        |       |        |
        v       v        v
   COMPLETED CANCELLED NO_SHOW
```

Never use only a boolean such as:

```javascript
isBooked: true
```

A real status is necessary for communication and dashboard workflows.

---

# 11. appointment_status_history

Every important status change should be recorded.

```javascript
{
  _id: ObjectId,
  appointmentId: ObjectId,

  fromStatus: String | null,
  toStatus: String,

  changedByType: "PATIENT" | "DOCTOR" | "ADMIN" | "SYSTEM",
  changedById: ObjectId | null,

  reason: String | null,

  createdAt: Date
}
```

Example:

```text
SYSTEM
PENDING created

DOCTOR
PENDING -> APPROVED

SYSTEM
APPROVED notification sent
```

This gives you a useful audit trail.

---

# 12. doctor_availability

Store recurring working hours.

```javascript
{
  _id: ObjectId,
  doctorId: ObjectId,
  dayOfWeek: Number, // 0-6
  startTime: String, // "10:00"
  endTime: String,   // "13:00"
  slotDurationMinutes: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

Example:

```text
Monday
10:00 - 13:00
16:00 - 19:00
```

---

# 13. doctor_schedule_exceptions

For holidays, leave, conferences, etc.

```javascript
{
  _id: ObjectId,
  doctorId: ObjectId,
  date: Date,
  startTime: String | null,
  endTime: String | null,
  type: "BLOCK" | "SPECIAL_HOURS",
  reason: String | null,
  createdAt: Date
}
```

Example:

```text
12 September 2026
BLOCK
Doctor unavailable
```

---

# 14. patient_questionnaires

Keep the questionnaire separate so it can evolve.

```javascript
{
  _id: ObjectId,
  patientId: ObjectId,
  appointmentId: ObjectId,

  primaryConcern: String,

  symptoms: [String],

  duration: String | null,

  previousTreatment: Boolean | null,

  previousTreatmentDetails: String | null,

  currentProducts: String | null,

  allergies: String | null,

  additionalNotes: String | null,

  consentGiven: Boolean,
  consentVersion: String,

  createdAt: Date,
  updatedAt: Date
}
```

Only collect information that is actually needed by the clinic.

---

# 15. patient_images

Do not store large image binaries directly inside appointment documents.

Use private object storage.

```javascript
{
  _id: ObjectId,

  patientId: ObjectId,
  appointmentId: ObjectId,

  storageKey: String,

  originalFileName: String,
  mimeType: String,
  fileSize: Number,

  uploadedAt: Date
}
```

Storage can be:

- S3
- Cloudflare R2
- Supabase Storage
- another private object-storage provider

The database stores the reference.

Images should not be publicly accessible.

---

# 16. notifications

Every communication should be tracked.

```javascript
{
  _id: ObjectId,

  appointmentId: ObjectId | null,
  patientId: ObjectId | null,

  recipientType: "PATIENT" | "DOCTOR",
  recipientId: ObjectId | null,

  channel: "EMAIL" | "WHATSAPP",

  templateKey: String,

  recipientAddress: String,

  provider: String,

  providerMessageId: String | null,

  status:
    "QUEUED" |
    "SENT" |
    "DELIVERED" |
    "FAILED" |
    "READ",

  attempts: Number,

  lastAttemptAt: Date | null,
  deliveredAt: Date | null,
  failedAt: Date | null,

  errorMessage: String | null,

  metadata: Object,

  createdAt: Date,
  updatedAt: Date
}
```

This is important because you should be able to answer:

> Did the doctor receive the notification?

and:

> Did the patient receive the approval message?

---

# 17. notification_templates

Do not hardcode communication messages throughout the application.

```javascript
{
  _id: ObjectId,

  key: String,

  channel: "EMAIL" | "WHATSAPP",

  recipientType: "PATIENT" | "DOCTOR",

  subject: String | null,

  body: String,

  isActive: Boolean,

  createdAt: Date,
  updatedAt: Date
}
```

Example keys:

```text
APPOINTMENT_REQUESTED_DOCTOR
APPOINTMENT_RECEIVED_PATIENT
APPOINTMENT_APPROVED_PATIENT
APPOINTMENT_REJECTED_PATIENT
APPOINTMENT_RESCHEDULED_PATIENT
APPOINTMENT_CANCELLED_PATIENT
APPOINTMENT_REMINDER_PATIENT
```

---

# 18. clinic_settings

```javascript
{
  _id: ObjectId,

  clinicName: String,
  clinicPhone: String,
  clinicEmail: String,

  address: {
    line1: String,
    line2: String | null,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },

  timezone: String,

  cancellationNoticeHours: Number,

  bookingNoticeHours: Number,

  reminder24HoursEnabled: Boolean,
  reminder2HoursEnabled: Boolean,

  createdAt: Date,
  updatedAt: Date
}
```

Use `Asia/Kolkata` for an India-based clinic unless the clinic operates differently.

---

# 19. Booking API

Recommended API structure:

```text
POST   /api/appointments
GET    /api/appointments/available-slots
GET    /api/appointments/:id

POST   /api/appointments/:id/cancel
POST   /api/appointments/:id/reschedule

POST   /api/doctor/appointments/:id/approve
POST   /api/doctor/appointments/:id/reject
POST   /api/doctor/appointments/:id/reschedule

GET    /api/doctor/appointments
GET    /api/doctor/appointments/pending
GET    /api/doctor/appointments/today

GET    /api/doctor/patients/:id

GET    /api/doctor/availability
POST   /api/doctor/availability
PATCH  /api/doctor/availability/:id

GET    /api/doctor/notifications
```

Protect every doctor endpoint with authentication and role authorization.

---

# 20. Booking API Request

Example:

```json
{
  "serviceId": "SERVICE_ID",
  "doctorId": "DOCTOR_ID",
  "appointmentDate": "2026-09-12",
  "startTime": "17:30",
  "endTime": "18:00",

  "patient": {
    "fullName": "Aarav Sharma",
    "phone": "+91XXXXXXXXXX",
    "email": "patient@example.com",
    "age": 28,
    "gender": "male",
    "whatsappOptIn": true,
    "emailOptIn": true
  },

  "questionnaire": {
    "primaryConcern": "Acne",
    "symptoms": ["Acne", "Acne scars"],
    "duration": "8 months",
    "previousTreatment": true,
    "previousTreatmentDetails": "Used prescribed creams",
    "additionalNotes": "Acne keeps recurring"
  },

  "consent": {
    "given": true,
    "version": "2026-01"
  }
}
```

---

# 21. Booking API Server Flow

When `/api/appointments` is called:

```text
1. Validate request schema.
2. Validate required fields.
3. Validate consent.
4. Validate service exists and is active.
5. Validate doctor exists and is active.
6. Validate requested date/time.
7. Validate doctor availability.
8. Check schedule exceptions.
9. Check conflicting appointments.
10. Find or create patient.
11. Create appointment.
12. Create questionnaire.
13. Create status history.
14. Queue doctor notification.
15. Return appointment number/status.
```

The response should look approximately like:

```json
{
  "success": true,
  "appointment": {
    "appointmentNumber": "MKH-20260912-7F3A",
    "status": "PENDING",
    "date": "2026-09-12",
    "startTime": "17:30"
  }
}
```

---

# 22. Do NOT send notifications before the database transaction succeeds

Bad:

```text
Send email
Create appointment
```

Better:

```text
Create appointment
Create questionnaire
Commit
       |
       v
Queue notification
```

If notification fails, the appointment still exists.

---

# 23. Notification Architecture

Create one internal notification service.

Example:

```text
NotificationService
│
├── sendAppointmentRequested()
├── sendAppointmentApproved()
├── sendAppointmentRejected()
├── sendAppointmentRescheduled()
├── sendAppointmentCancelled()
└── sendAppointmentReminder()
```

Then separate channel adapters:

```text
NotificationService
       |
       +---- EmailProvider
       |
       +---- WhatsAppProvider
```

This means you can change email/WhatsApp vendors later without rewriting appointment logic.

---

# 24. Email flow

For a new request:

```text
Patient submits
       |
       v
Appointment = PENDING
       |
       v
Notification Queue
       |
       v
Email Provider
       |
       v
Doctor
```

Email:

```text
New Appointment Request

Patient: Aarav Sharma
Concern: Acne
Date: 12 September 2026
Time: 5:30 PM

Please review the appointment request
in the doctor dashboard.

[Review Appointment]
```

The button should point to the authenticated dashboard.

Do not put sensitive patient information into a public URL.

---

# 25. WhatsApp flow

Use the official WhatsApp Business Platform / Cloud API or an approved provider.

The basic flow:

```text
Backend
   |
   v
WhatsApp Provider
   |
   v
WhatsApp Business Number
   |
   v
Patient / Doctor
```

For proactive notifications, use approved WhatsApp message templates where required by WhatsApp's current business messaging rules.

Recommended templates:

```text
appointment_request
appointment_approved
appointment_rejected
appointment_reschedule
appointment_cancelled
appointment_reminder
```

Example patient notification:

```text
Hello {{name}},

Your appointment request with {{clinic}}
has been approved.

Date: {{date}}
Time: {{time}}

Address:
{{address}}

Appointment ID:
{{appointmentNumber}}
```

Use WhatsApp template variables rather than generating arbitrary promotional messages.

---

# 26. Doctor notification

When patient submits:

```text
Email Doctor
+
WhatsApp Doctor
+
Dashboard Notification
```

The dashboard should show:

```text
5 Pending Requests
```

Doctor doesn't need to depend on WhatsApp to manage the appointment.

WhatsApp/email are notification channels.

The dashboard is the system of record.

---

# 27. Patient notification

When approved:

```text
Doctor clicks APPROVE
        |
        v
Appointment.status = APPROVED
        |
        v
Notification Service
        |
        +---- Email Patient
        |
        +---- WhatsApp Patient
```

Patient receives:

```text
Your appointment has been confirmed.

Dr. ______
Makhija Skin & Hair Clinic

12 September 2026
5:30 PM

Address:
...

Appointment ID:
...
```

---

# 28. Rejection flow

Doctor clicks:

```text
Reject
```

Optional reason:

```text
Reason:
Doctor unavailable / unsuitable time / other
```

Backend:

```text
status = REJECTED
rejectionReason = ...
```

Then notify patient:

```text
Your appointment request could not be confirmed.

Please contact the clinic or select another
available time.
```

Avoid exposing internal doctor notes.

---

# 29. Reschedule flow

Doctor chooses:

```text
Request Reschedule
```

Then selects a new slot.

Store:

```javascript
{
  status: "RESCHEDULE_REQUESTED",
  rescheduleReason: "...",
  proposedStartTime: "...",
  proposedEndTime: "..."
}
```

Patient can accept or choose another slot.

For a simpler MVP, the doctor can directly choose a new slot and set the appointment back to `PENDING`, followed by a notification to the patient.

---

# 30. Appointment reminders

Create scheduled jobs.

Recommended:

```text
24 hours before appointment
        |
        v
Email + WhatsApp

2 hours before appointment
        |
        v
WhatsApp + optionally Email
```

Reminder jobs should only send if:

```text
appointment.status == APPROVED
```

Never send a reminder for:

```text
REJECTED
CANCELLED
```

---

# 31. Idempotency

This is critical for notifications.

Suppose your server retries:

```text
appointment_approved
```

You don't want the patient receiving five identical WhatsApp messages.

Use an idempotency key:

```text
appointmentId + eventType
```

Example:

```text
507f...:APPOINTMENT_APPROVED:WHATSAPP
```

Before sending:

```text
Check whether this notification already succeeded.
```

If yes:

```text
Do not send again.
```

---

# 32. Notification queue

For production, don't make the appointment API wait for email/WhatsApp.

Use a job queue.

Example:

```text
POST /api/appointments
        |
        v
MongoDB
        |
        v
Job Queue
        |
        +------------------+
        |                  |
        v                  v
 Email Worker       WhatsApp Worker
```

Possible technologies:

- BullMQ + Redis
- Cloud task/queue service
- MongoDB-based job processing
- Provider-native asynchronous systems

For a small clinic, you can initially implement a simple database-backed job mechanism, but a proper queue is preferable once traffic grows.

---

# 33. Notification retry policy

Example:

```text
Attempt 1 → immediately
Attempt 2 → after 1 minute
Attempt 3 → after 5 minutes
Attempt 4 → after 30 minutes
```

After the retry limit:

```text
FAILED
```

Show this to admin/doctor.

---

# 34. Dashboard screens

Build these pages.

## `/doctor/login`

```text
Email
Password
Login
Forgot password
```

## `/doctor/dashboard`

```text
Pending Requests
Today's Appointments
Upcoming Appointments
Recent Notifications
```

## `/doctor/appointments`

Filters:

```text
Pending
Approved
Rejected
Cancelled
Completed
```

## `/doctor/appointments/:id`

Show:

```text
Patient
Contact
Concern
Questionnaire
Images
Appointment
Status history

[Approve]
[Reject]
[Reschedule]
```

## `/doctor/calendar`

Calendar view:

```text
Day
Week
Month
```

## `/doctor/availability`

```text
Monday
10:00–13:00
16:00–19:00

Tuesday
10:00–13:00
16:00–19:00
```

## `/doctor/patients`

Search:

```text
Name
Phone
Appointment number
```

---

# 35. Patient appointment status page

After booking, give the patient a status page.

Example:

```text
/appointment-status/:secureToken
```

But do NOT use the MongoDB `_id` directly as a public identifier.

Generate a random secure token.

Example:

```text
Appointment Request

MKH-20260912-7F3A

Status

✓ Request received
✓ Sent to doctor
○ Awaiting approval
```

After approval:

```text
✓ Request received
✓ Doctor reviewed
✓ Appointment confirmed
```

---

# 36. Security for the patient status page

Use a high-entropy random token.

Do not create:

```text
/appointment/507f1f77bcf86cd799439011
```

and assume the ID is secret.

Prefer:

```text
/appointment-status/<random-long-token>
```

Store a hash of the token if possible.

Only expose the minimum required information.

---

# 37. API security

Implement:

```text
HTTPS
Authentication
Authorization
Rate limiting
Request validation
Input sanitization
CORS configuration
CSRF protection where applicable
Secure cookies
Audit logging
Error handling
```

For doctor dashboard:

```text
Authentication
       |
       v
Role check
       |
       v
Doctor ID check
       |
       v
Appointment access
```

A doctor should not be able to modify another doctor's appointments unless their role explicitly allows it.

---

# 38. Patient privacy

Treat skin images and questionnaire data as sensitive.

Requirements:

- Private image storage.
- Signed/temporary image URLs.
- No patient images in public folders.
- No sensitive data in frontend logs.
- No sensitive information in analytics events.
- No sensitive information in notification URLs.
- HTTPS everywhere.
- Database backups.
- Access control.
- Audit trail.

The application should also have a clinic-reviewed privacy/consent policy appropriate to the jurisdiction in which it operates.

---

# 39. Email provider abstraction

Don't scatter provider-specific code throughout the application.

Use:

```text
EmailService
```

with:

```javascript
send({
  to,
  subject,
  template,
  data
})
```

Implementation:

```text
EmailService
      |
      v
Resend / SendGrid / SES
```

Recommended environment variables:

```env
EMAIL_PROVIDER=resend
EMAIL_API_KEY=...
EMAIL_FROM=appointments@yourdomain.com
```

Never commit secrets to Git.

---

# 40. WhatsApp provider abstraction

Create:

```text
WhatsAppService
```

Interface:

```javascript
sendTemplate({
  phone,
  templateName,
  language,
  variables
})
```

Environment variables:

```env
WHATSAPP_PROVIDER=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
```

Exact environment variables will depend on the provider.

---

# 41. Environment variables

Create `.env.example`:

```env
# Application
NODE_ENV=development
APP_URL=http://localhost:3000

# MongoDB
MONGODB_URI=

# Authentication
AUTH_SECRET=

# Email
EMAIL_PROVIDER=resend
EMAIL_API_KEY=
EMAIL_FROM=

# WhatsApp
WHATSAPP_PROVIDER=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=

# Storage
STORAGE_PROVIDER=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=

# Queue
REDIS_URL=

# Clinic
CLINIC_TIMEZONE=Asia/Kolkata
```

Do not put actual credentials in `.env.example`.

---

# 42. Suggested backend folder structure

If using a Node.js/TypeScript backend:

```text
src/
│
├── config/
│   ├── env.ts
│   └── database.ts
│
├── modules/
│   ├── auth/
│   ├── patients/
│   ├── doctors/
│   ├── services/
│   ├── appointments/
│   ├── availability/
│   ├── notifications/
│   └── uploads/
│
├── services/
│   ├── email/
│   ├── whatsapp/
│   ├── storage/
│   └── queue/
│
├── jobs/
│   ├── notification.worker.ts
│   └── reminder.worker.ts
│
├── middleware/
│   ├── auth.ts
│   ├── errorHandler.ts
│   ├── rateLimit.ts
│   └── validation.ts
│
├── utils/
│   ├── appointmentNumber.ts
│   ├── tokens.ts
│   └── dates.ts
│
└── app.ts
```

If the existing website already has a backend, integrate these modules into its existing structure rather than unnecessarily creating a second backend.

---

# 43. Frontend structure

Example:

```text
app/
│
├── book-appointment/
│   ├── page.tsx
│   └── components/
│       ├── ServiceSelector.tsx
│       ├── DateSelector.tsx
│       ├── TimeSlotSelector.tsx
│       ├── PatientForm.tsx
│       ├── ConcernForm.tsx
│       ├── PhotoUpload.tsx
│       └── BookingSummary.tsx
│
├── appointment-status/
│   └── [token]/
│       └── page.tsx
│
└── doctor/
    ├── login/
    ├── dashboard/
    ├── appointments/
    ├── patients/
    ├── calendar/
    └── availability/
```

---

# 44. Booking UI

The booking experience should be a multi-step form rather than one enormous form.

```text
STEP 1
Choose Service
      ↓
STEP 2
Choose Date & Time
      ↓
STEP 3
Your Details
      ↓
STEP 4
Skin/Hair Concern
      ↓
STEP 5
Review & Consent
      ↓
SUBMIT
```

At every step:

- Validate inputs.
- Preserve entered data.
- Show clear progress.
- Make mobile use easy.
- Prevent accidental double submission.

---

# 45. Validation

Use a schema validation library such as Zod if you're using TypeScript.

Validate on:

```text
Frontend
+
Backend
```

Never trust frontend validation alone.

Examples:

```text
name → required
phone → valid format
email → valid if supplied
service → must exist
date → valid future date
time → valid slot
consent → required
photo → MIME type + file size limits
```

---

# 46. Timezone handling

This needs to be designed carefully.

Store appointment date/time in a consistent representation.

For an India-based clinic:

```text
Timezone:
Asia/Kolkata
```

Convert incoming date/time into a canonical timestamp on the server.

Do not rely on the browser's timezone.

This prevents problems if the doctor or patient uses a device configured for another timezone.

---

# 47. Prevent booking in the past

Backend must reject:

```text
Yesterday
10:00 AM
```

and optionally enforce:

```text
Minimum booking notice:
2 hours
```

depending on clinic policy.

---

# 48. Booking confirmation response

After submission, show:

```text
Appointment Request Received

Thank you, Aarav.

Your appointment request has been sent
to Dr. Makhija for approval.

Requested appointment:

12 September 2026
5:30 PM

You will receive confirmation by
Email and WhatsApp once approved.

Appointment Request ID:
MKH-20260912-7F3A
```

This wording is important.

Do not say "confirmed" yet.

---

# 49. Doctor approval transaction

When doctor clicks approve:

```text
1. Authenticate doctor.
2. Verify appointment exists.
3. Verify doctor owns appointment.
4. Verify appointment is PENDING.
5. Re-check slot availability.
6. Update status to APPROVED.
7. Record approvedAt.
8. Create status history.
9. Queue patient email.
10. Queue patient WhatsApp.
11. Return success.
```

The availability must be checked again because the situation could have changed since the request was created.

---

# 50. Approval race condition

This is another important case.

Suppose:

```text
Appointment A → 5:30 PM
Appointment B → 5:30 PM
```

Both are pending.

Doctor tries to approve A.

Then B.

Your approval operation must re-check availability and prevent two approved appointments from occupying the same slot.

The database should be treated as the final authority.

---

# 51. Notification events

Define application events:

```text
APPOINTMENT_CREATED
APPOINTMENT_APPROVED
APPOINTMENT_REJECTED
APPOINTMENT_RESCHEDULE_REQUESTED
APPOINTMENT_CANCELLED
APPOINTMENT_COMPLETED
APPOINTMENT_REMINDER_24H
APPOINTMENT_REMINDER_2H
```

Each event can create one or more notification jobs.

Example:

```text
APPOINTMENT_APPROVED

      |
      +----> EMAIL_PATIENT
      |
      +----> WHATSAPP_PATIENT
```

---

# 52. Recommended communication matrix

| Event | Patient Email | Patient WhatsApp | Doctor Email | Doctor WhatsApp |
|---|---:|---:|---:|---:|
| Request created | Yes | Optional | Yes | Yes |
| Approved | Yes | Yes | No | No |
| Rejected | Yes | Yes | No | No |
| Reschedule | Yes | Yes | No | No |
| Cancelled | Yes | Yes | Yes | Yes |
| 24h reminder | Yes | Yes | Optional | Optional |
| 2h reminder | Optional | Yes | Optional | Optional |

Avoid excessive notifications.

---

# 53. Dashboard notification center

Doctor dashboard:

```text
Notifications

● New appointment request
  Aarav Sharma
  2 minutes ago

● New appointment request
  Priya Mehta
  18 minutes ago

✓ Appointment approved
  Rahul Verma
  Yesterday
```

Clicking notification should take the doctor to the relevant appointment.

---

# 54. Webhooks

Email and WhatsApp providers can send webhooks.

Example:

```text
Provider
   |
   | delivery event
   v
POST /api/webhooks/email
```

or:

```text
POST /api/webhooks/whatsapp
```

Update:

```text
notifications.status
```

Example:

```text
QUEUED
   ↓
SENT
   ↓
DELIVERED
   ↓
READ
```

Handle webhook signatures according to the provider's documentation.

---

# 55. Analytics

Track operational metrics, not sensitive medical content.

Useful:

```text
Appointment requests
Approval rate
Cancellation rate
No-show rate
Appointments by service
Appointments by day
Booking conversion
Notification delivery rate
```

Avoid sending skin concerns, photos, medical notes, etc. to third-party analytics platforms.

---

# 56. Admin dashboard metrics

Example:

```text
Appointments Today: 8

Pending: 5

Approved: 23

Completed: 17

Cancelled: 2

No Show: 1
```

And:

```text
Most Requested Services

Acne                38%
Hair Treatment      25%
Pigmentation        19%
Laser               12%
Other                6%
```

---

# 57. MVP implementation order

Cursor should implement in this order.

## Phase 1 — Foundation

- Inspect existing project.
- Identify framework/backend.
- Configure MongoDB.
- Create environment configuration.
- Add authentication.
- Add common API error handling.
- Add validation.
- Add logging.

## Phase 2 — MongoDB

Create models/schemas for:

```text
User
Doctor
Patient
Service
Appointment
AppointmentStatusHistory
DoctorAvailability
DoctorScheduleException
PatientQuestionnaire
PatientImage
Notification
NotificationTemplate
ClinicSettings
```

## Phase 3 — Booking

Implement:

```text
GET available slots
POST appointment
GET appointment status
```

Implement:

- slot validation
- duplicate prevention
- patient creation/update
- appointment numbering
- status history

## Phase 4 — Doctor dashboard

Implement:

```text
login
dashboard
pending requests
appointment details
approve
reject
reschedule
calendar
availability
```

## Phase 5 — Email

Implement:

```text
EmailService
Email templates
Notification records
Provider webhooks
Retry handling
```

## Phase 6 — WhatsApp

Implement:

```text
WhatsAppService
Template messages
Webhook
Delivery tracking
Retry handling
Opt-in handling
```

## Phase 7 — Reminders

Implement scheduled jobs:

```text
24h reminder
2h reminder
```

## Phase 8 — Photos

Implement:

```text
secure upload
private storage
doctor-only access
file validation
```

## Phase 9 — Hardening

Test:

```text
Double booking
Duplicate requests
Concurrent approval
Invalid doctor access
Expired status tokens
Notification failures
Provider timeouts
Webhook replay
Large uploads
Cancelled appointments
Rescheduled appointments
```

---

# 58. Cursor Implementation Rules

When implementing this project, follow these rules.

### Rule 1

Do not rewrite unrelated existing website code.

### Rule 2

First inspect the existing repository:

```text
package.json
src/
app/
pages/
server/
API routes
environment configuration
database code
authentication
```

Determine the existing framework before adding dependencies.

### Rule 3

Reuse existing architecture where possible.

### Rule 4

Do not introduce a second backend if the existing application already has a suitable backend.

### Rule 5

Keep database operations in repository/service layers.

### Rule 6

Keep notification providers behind interfaces.

### Rule 7

Never expose secrets to frontend code.

### Rule 8

Never expose private patient images publicly.

### Rule 9

Validate all client input on the server.

### Rule 10

Do not allow the frontend to directly set:

```text
APPROVED
COMPLETED
REJECTED
```

Only authorized backend operations may change these states.

---

# 59. Suggested service architecture

Use:

```text
AppointmentController
        |
        v
AppointmentService
        |
        +---- PatientService
        |
        +---- AvailabilityService
        |
        +---- AppointmentRepository
        |
        +---- StatusHistoryService
        |
        +---- NotificationService
```

Notification:

```text
NotificationService
        |
        +---- EmailProvider
        |
        +---- WhatsAppProvider
        |
        +---- NotificationRepository
        |
        +---- Queue
```

This keeps the system maintainable.

---

# 60. Error responses

Use consistent API responses.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "SLOT_NOT_AVAILABLE",
    "message": "The selected appointment slot is no longer available."
  }
}
```

Possible error codes:

```text
INVALID_REQUEST
SERVICE_NOT_FOUND
DOCTOR_NOT_FOUND
SLOT_NOT_AVAILABLE
APPOINTMENT_NOT_FOUND
UNAUTHORIZED
FORBIDDEN
INVALID_STATUS_TRANSITION
NOTIFICATION_FAILED
UPLOAD_FAILED
```

Do not expose internal stack traces to users.

---

# 61. Security checklist

Before production:

```text
[ ] HTTPS enabled
[ ] Secure authentication
[ ] Password hashing
[ ] Doctor role authorization
[ ] Rate limiting
[ ] Input validation
[ ] MongoDB authentication
[ ] MongoDB network restrictions
[ ] Database backups
[ ] Private image storage
[ ] Signed image URLs
[ ] No secrets in frontend
[ ] No secrets in Git
[ ] Webhook signature validation
[ ] Notification idempotency
[ ] Audit trail
[ ] Secure patient status tokens
[ ] Error handling
[ ] Logging without sensitive data
[ ] Privacy/consent review
```

---

# 62. Testing requirements

Create unit tests for:

```text
slot generation
slot availability
booking validation
status transitions
appointment approval
appointment rejection
rescheduling
cancellation
notification creation
notification idempotency
```

Integration tests:

```text
POST appointment
        ↓
MongoDB
        ↓
notification job
```

Test doctor authorization:

```text
Doctor A
    ↓
Appointment belonging to Doctor B
    ↓
403 Forbidden
```

Test concurrent bookings.

---

# 63. End-to-End Example

### Patient books

```text
Aarav Sharma
Acne Consultation
12 Sep 2026
5:30 PM
```

Backend creates:

```text
Appointment
status = PENDING
```

Doctor gets:

```text
Email ✓
WhatsApp ✓
Dashboard notification ✓
```

Doctor opens dashboard.

Sees:

```text
Aarav Sharma

Concern:
Acne

Duration:
8 months

Previous treatment:
Yes

Photos:
3
```

Doctor clicks:

```text
APPROVE
```

Backend:

```text
PENDING → APPROVED
```

Patient receives:

```text
Email ✓
WhatsApp ✓
```

24 hours before:

```text
Reminder Email ✓
Reminder WhatsApp ✓
```

2 hours before:

```text
Reminder WhatsApp ✓
```

After consultation:

```text
Doctor → COMPLETED
```

Everything remains in MongoDB as a complete appointment history.

---

# 64. Recommended first production version

For the first release, implement:

```text
                    PATIENT
                       |
                       v
                Booking Website
                       |
                       v
                  Backend API
                       |
                       v
                    MongoDB
                       |
                       v
                Doctor Dashboard
                       |
              Approve / Reject
                       |
                       v
                Notification Queue
                   /          \
                  /            \
                 v              v
              EMAIL          WHATSAPP
                 \              /
                  \            /
                   v          v
                     PATIENT
```

Features:

- Service selection
- Date/time selection
- Availability
- Patient details
- Skin concern
- Optional photo upload
- Consent
- Pending status
- Doctor approval
- Doctor rejection
- Rescheduling
- Email notifications
- WhatsApp notifications
- Notification tracking
- 24h reminder
- 2h reminder
- Doctor dashboard
- Appointment history
- Cancellation
- Secure authentication

This is the right balance between a useful MVP and a production-ready foundation.

---

# 65. Cursor's implementation sequence

Cursor should execute the work in this exact order:

```text
STEP 1
Inspect existing repository and identify framework.

STEP 2
Create/verify MongoDB connection.

STEP 3
Create database models and indexes.

STEP 4
Create seed data for doctor + services + availability.

STEP 5
Implement availability API.

STEP 6
Implement patient booking API.

STEP 7
Implement appointment status machine.

STEP 8
Implement doctor authentication.

STEP 9
Implement doctor dashboard.

STEP 10
Implement approve/reject/reschedule actions.

STEP 11
Implement email provider abstraction.

STEP 12
Implement WhatsApp provider abstraction.

STEP 13
Implement notification queue.

STEP 14
Implement notification delivery tracking.

STEP 15
Implement provider webhooks.

STEP 16
Implement reminders.

STEP 17
Implement secure patient appointment status page.

STEP 18
Implement private photo upload/storage.

STEP 19
Add tests.

STEP 20
Run security review.

STEP 21
Run end-to-end booking test.

STEP 22
Prepare production environment configuration.
```

---

# 66. Definition of Done

The feature is complete only when this entire scenario works:

```text
Patient visits website
        ↓
Selects Acne Consultation
        ↓
Selects available date
        ↓
Selects available time
        ↓
Enters name + phone + email
        ↓
Adds skin concern
        ↓
Optionally uploads photos
        ↓
Accepts consent
        ↓
Submits
        ↓
Appointment created as PENDING
        ↓
Doctor receives Email
        ↓
Doctor receives WhatsApp
        ↓
Doctor sees request in dashboard
        ↓
Doctor opens request
        ↓
Doctor approves
        ↓
Appointment becomes APPROVED
        ↓
Patient receives Email
        ↓
Patient receives WhatsApp
        ↓
24h reminder sent
        ↓
2h reminder sent
        ↓
Patient attends
        ↓
Doctor marks COMPLETED
        ↓
Status history preserved
```

There should be no manual database updates required anywhere in this workflow.

---

# 67. Final implementation principle

The website is the **booking interface**.

The doctor dashboard is the **management interface**.

MongoDB is the **source of truth**.

The notification service is the **communication layer**.

Email and WhatsApp are **delivery channels**, not the appointment system itself.

The final relationship should therefore be:

```text
                 ┌──────────────┐
                 │    WEBSITE   │
                 └──────┬───────┘
                        │
                        v
                 ┌──────────────┐
                 │   BACKEND    │
                 └──────┬───────┘
                        │
              ┌─────────┴─────────┐
              v                   v
       ┌─────────────┐     ┌───────────────┐
       │   MONGODB   │     │ NOTIFICATION  │
       │             │     │    SYSTEM     │
       └─────────────┘     └───────┬───────┘
                                   │
                            ┌──────┴──────┐
                            v             v
                         EMAIL        WHATSAPP

                 ┌──────────────┐
                 │    DOCTOR    │
                 │  DASHBOARD   │
                 └──────┬───────┘
                        │
                        v
                    BACKEND/API
```

**Implement the architecture in a modular way so that the clinic can later add multiple doctors, online payments, prescriptions, treatment plans, patient accounts, invoices, and additional communication channels without redesigning the core appointment system.**

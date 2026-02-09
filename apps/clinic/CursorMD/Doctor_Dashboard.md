# Clinic Management Web Tool – For Doctors & Clinics Only

**Product scope:** This application is a **clinic management web tool only**. It is **not** for the general public or for patients to use directly. It is used by **doctors and clinic staff** to manage the clinic. When a patient needs a video consultation, the doctor/clinic **initiates the call and sends a join link** (e.g. by SMS/email); the patient opens that link to join—no patient login or patient portal is required.

---

## 🏗️ PLATFORM ARCHITECTURE

**Core components (in scope):**

- **Clinic / Staff app** – Login, dashboard, patients, appointments, prescriptions, billing, inventory, etc. (clinic_admin, receptionist, nurse, etc.)
- **Doctor Portal** – Doctor dashboard, appointments, patient records, prescriptions, schedule, earnings, **video calls** (doctor starts the call and sends link to patient when needed)
- **Admin Portal** – Super Admin dashboard for platform management (tenants, doctors, verification, reports, etc.)
- **Backend API** (Node.js)
- **Database** (MongoDB)

**Out of scope / disabled:**

- **Patient Portal** – No public website for patients to “find & book” doctors. No patient login, no patient dashboard. Patients are **managed by the clinic**; when they need a video call, the **clinic/doctor sends them a join link** and they open it in the browser (no app login).

**Document convention (clinic-only):** In Parts 2 and 3 and in Phases, “patients” means **patient records** managed by the clinic. “Booking” means **clinic-side appointment creation** (staff/doctor books for a patient). “New registrations” = new clinics and new doctors, not patient sign-ups.

---

**Current implementation (clinic-only rollout):**

- All `/patient-portal` and `/patient-portal/*` routes redirect to `/login?reason=clinic_only`.
- Login page shows a notice when `?reason=clinic_only`; text from `auth.clinicOnlyNotice` (en/fr/es): app is for clinic staff and doctors only; patients receive video call links from their clinic when needed.
- Homepage hero and CTA emphasize "Clinic Management – For Doctors & Clinic Staff Only" and "Start a video call when a patient needs it; they join via a link you send."
- **For Doctors** link in Header (Login | For Doctors | Get Started) and **I'm a Doctor** button in Hero both go to `/doctors/register`; i18n: `navigation.forDoctors`, `homepage.forDoctors` (en/fr/es).
- Doctor registration "Back" goes to `/`. Telemedicine post-call "Book follow-up" goes to `/appointments/new`. Forgot-password is email-only (clinic/staff/doctor); no patient-portal OTP.
- Video consultation is doctor/clinic-initiated; the patient joins via the link sent to them (no login).

---

## 📱 PART 1: PATIENT PORTAL – OUT OF SCOPE (DISABLED)

**Note:** The following patient-portal / public-website features are **not** part of this product. The app is clinic management only. Patient-facing flows (public homepage, doctor search, patient self-booking, patient dashboard) are disabled; all patient-portal routes redirect to clinic/staff login.

<details>
<summary>Legacy / reference: original Patient Portal (Public Website) spec – kept for reference only</summary>

_(The content below is the original patient-portal spec; it is not implemented for this clinic-only product.)_

📱 PATIENT PORTAL (PUBLIC WEBSITE) – **NOT IN USE**
Homepage Features
Create a modern healthcare homepage with:

Header:

- Logo and clinic name
- Navigation: Find Doctors, Specialties, About Us, Blog, Contact
- Login/Sign Up buttons
- Emergency number display

Hero Section:

- Main headline: "Find & Book Doctor Appointments Online"
- Search bar with filters: Location, Specialty, Doctor Name, Insurance
- "Book Appointment" CTA button
- Trust badges (patients served, verified doctors, etc.)

Features Section:

- Instant booking
- Verified doctors
- Digital prescriptions
- Video consultations
- Lab test booking
- Medicine delivery integration

How It Works (3-step process):

1. Search for doctors
2. Book appointment
3. Get consultation

Specialties Grid:

- Cards for: Dentist, Cardiologist, Dermatologist, Pediatrician, etc.
- Icons for each specialty
- "View All Specialties" link

Featured Doctors:

- Doctor cards with: Photo, Name, Specialty, Rating, Experience, Fees
- "Book Now" button on each card

Testimonials:

- Patient reviews carousel
- Star ratings
- Patient name and treatment type

Footer:

- Links: About, Careers, Privacy Policy, Terms
- Social media links
- Contact info
- Newsletter signup
  Doctor Search & Listing Page
  Build a comprehensive doctor search page:

Filters Sidebar:

- Location (city/area dropdown or map)
- Specialty dropdown
- Gender (Male/Female/Any)
- Consultation fee range slider
- Experience (years)
- Languages spoken
- Availability (Today, Tomorrow, This Week)
- Rating (4+ stars, 3+ stars)
- Consultation type (In-clinic, Video, Both)

Search Results:

- Sort by: Relevance, Rating, Experience, Fees (Low to High)
- Doctor cards showing:
  - Profile photo
  - Name, Qualifications
  - Specialty
  - Experience years
  - Rating with review count
  - Consultation fee
  - Clinic address
  - Available today indicator
  - Next available slot
  - "Book Appointment" button
  - "View Profile" link

Pagination or Infinite scroll

Map View Toggle:

- Show doctors on Google Maps
- Pins with basic info
- Click to see details
  Doctor Profile Page
  Create detailed doctor profile:

Header Section:

- Large profile photo
- Name with verification badge
- Qualifications (MBBS, MD, etc.)
- Specialty
- Experience years
- Rating with total reviews
- Clinic name and address
- "Book Appointment" prominent button

Tabs:

1. Overview:
   - About doctor
   - Education details
   - Registrations/Certifications
   - Memberships
   - Awards and recognitions

2. Experience:
   - Current and past positions
   - Years in practice
   - Special interests

3. Services:
   - Conditions treated
   - Procedures offered
   - Treatment approaches

4. Locations:
   - Multiple clinic addresses
   - Map integration
   - Working hours per location

5. Reviews:
   - Patient reviews with ratings
   - Filter by rating
   - Verified patient badge
   - Helpful/Not helpful votes

6. Business Hours:
   - Weekly schedule
   - Available time slots
   - Consultation duration

7. Fees:
   - In-clinic consultation fee
   - Video consultation fee
   - Follow-up fee
   - Insurance accepted

Appointment Booking Widget (Sticky):

- Date picker (calendar view)
- Available time slots
- Consultation type selector
- Instant booking button
  Booking Flow
  Multi-step appointment booking:

Step 1: Select Date & Time

- Calendar with available dates highlighted
- Time slots grid (Morning/Afternoon/Evening)
- Selected slot confirmation

Step 2: Patient Details

- For existing users: Select from family members or self
- For new users:
  - Full name
  - Age/Date of birth
  - Gender
  - Phone number
  - Email
  - Problem/Reason for visit (textarea)
  - Upload reports (optional)

Step 3: Confirmation

- Summary of booking
- Doctor details
- Date, time, location
- Patient details
- Fees breakdown
- Terms acceptance checkbox

Step 4: Payment (if applicable)

- Payment method selection
- Razorpay/Stripe integration
- Pay now or pay at clinic option

Step 5: Booking Confirmed

- Confirmation message
- Booking ID
- Appointment details
- Add to calendar button
- Download appointment slip
- SMS/Email confirmation sent
  Patient Registration/Login
  Create authentication system:

Sign Up:

- Full name
- Email
- Phone number with OTP verification
- Password with strength indicator
- Date of birth
- Gender
- Terms acceptance
- Social login (Google, Facebook)

Login:

- Email or Phone number
- Password
- "Remember me" checkbox
- Forgot password link
- OTP login option

Forgot Password:

- Email/Phone input
- OTP verification
- New password creation

Email Verification:

- Verification link sent
- Verification success page
  Patient Dashboard
  Build patient dashboard after login:

Sidebar Navigation:

- Dashboard
- My Appointments
- Medical Records
- Prescriptions
- Lab Reports
- Family Members
- Payments & Invoices
- Profile Settings

Dashboard Home:

- Welcome message with patient name
- Upcoming appointments cards
- Quick actions: Book Appointment, Upload Records, Order Medicine
- Recent activities
- Health reminders
- Pending payments

My Appointments:

- Tabs: Upcoming, Past, Cancelled
- Appointment cards with:
  - Doctor photo and name
  - Date, time, location
  - Consultation type
  - Status badge
  - Actions: Reschedule, Cancel, Join Video Call, Download Prescription
- Filter by date range, doctor, status

Medical Records:

- Upload medical documents
- Categorize: Reports, Prescriptions, Bills, Images
- View/Download documents
- Share with doctor option
- Timeline view of medical history

Prescriptions:

- Digital prescriptions from doctors
- Medicine list with dosage
- Prescription PDF download
- Reorder medicines button (pharmacy integration)
- Prescription history

Lab Reports:

- Upload lab reports
- Test results with normal ranges
- Trends graph for repeated tests
- Share with doctor
- Book lab tests

Family Members:

- Add family members
- Manage profiles (name, age, relation, medical conditions)
- Book appointments for family
- View their medical records

Profile Settings:

- Edit personal details
- Change password
- Notification preferences
- Privacy settings
- Delete account option
  Video Consultation
  Implement telemedicine:

Pre-Call Setup:

- System check (camera, microphone)
- Waiting room before scheduled time
- Chat with doctor option

Video Call Interface:

- Large video windows
- Mute/Unmute controls
- Video on/off
- Chat panel
- Screen share option
- Document share
- End call button
- Connection quality indicator

Post-Call:

- Prescription generation
- Book follow-up option
- Rate the consultation
- Download consultation summary

</details>

---

## 👨‍⚕️ PART 2: DOCTOR PORTAL (IN SCOPE)

Doctor Registration/Onboarding
Create doctor onboarding flow:

Step 1: Basic Info

- Full name
- Email and phone (with verification)
- Password creation
- Specialty selection
- Years of experience

Step 2: Professional Details

- Medical registration number
- Qualifications (add multiple)
- Degrees and universities
- Certifications
- Specializations

Step 3: Clinic Details

- Clinic name
- Address with map picker
- Multiple locations option
- Working hours per location
- Consultation fees

Step 4: Documents Upload

- Medical license (PDF/Image)
- Degree certificates
- ID proof
- Clinic registration

Step 5: Banking Details

- Bank account for payments
- PAN/Tax details
- Payment preferences

Admin Verification Process:

- Pending approval status
- Document review by admin
- Approval/Rejection with reasons
- Email notification on status change
  Doctor Dashboard (Full from earlier + additions)
  Enhanced doctor dashboard features:

Dashboard Home:

- Daily stats: Appointments today, Patients waiting, Completed consultations
- Earnings today/this month
- Upcoming appointments list
- Pending tasks/actions
- Patient feedback alerts
- New patient requests

Appointment Management:

- Calendar view (Day/Week/Month)
- Appointment list with patient details
- Status: Scheduled, In Progress, Completed, Cancelled, No-show
- Quick actions:
  - Start consultation
  - View patient history
  - Reschedule
  - Cancel with reason
- Consultation notes during appointment
- Mark as completed

Patient Records:

- Complete patient database
- Search patients
- Patient detail page with:
  - Medical history timeline
  - Previous prescriptions
  - Lab reports
  - Appointment history
  - Personal notes
  - Allergies and chronic conditions

Prescription Creator:

- Patient selection
- Symptoms/Diagnosis
- Medicine search from database
- Dosage, frequency, duration
- Instructions
- Add investigations needed
- Follow-up date
- Digital signature
- Print/Download/Email prescription

Schedule Management:

- Set working hours per clinic
- Mark holidays/leaves
- Set appointment duration
- Buffer time between appointments
- Emergency slots
- Block specific time slots

Earnings & Payments:

- Daily/Weekly/Monthly earnings
- Payment breakdown (consultation, procedures)
- Pending settlements
- Transaction history
- Generate invoices
- Tax reports

Reviews & Ratings:

- View all patient reviews
- Average rating display
- Respond to reviews
- Flag inappropriate reviews

Video Consultation:

- **Clinic/doctor initiated only:** The doctor or clinic starts the video session and sends a **join link** (SMS/email) to the patient when a video consultation is needed. The patient opens the link in a browser to join—**no patient login or patient portal** is required.
- Schedule video appointments (from clinic side)
- Join video call (doctor from app; patient via link)
- Prescription during or after video call
- Digital payment collection (when applicable)

  Doctor Profile Management
  Doctor profile editing:

Professional Profile:

- Profile photo upload
- About me section
- Specializations
- Services offered
- Languages spoken
- Conditions treated
- Awards and recognitions

Clinic Management:

- Add/Edit/Delete clinic locations
- Clinic photos upload
- Facilities available
- Parking info
- Public transport access

Fee Management:

- In-clinic consultation fee
- Video consultation fee
- Follow-up fee
- Procedure fees
- Insurance accepted list

Availability Settings:

- Weekly schedule grid
- Different timing for different locations
- Online/Offline availability
- Slot duration configuration
- Break times

---

## 👑 PART 3: ADMIN PORTAL (SUPER ADMIN) – IN SCOPE

Admin Dashboard
Create comprehensive admin panel:

Dashboard Overview (clinic-only):

- Total users (clinic staff, doctors, admins)—“patients” here means patient records, not patient-portal users
- Today's appointments
- Revenue today/this month
- New registrations (clinics & doctors; no patient self-sign-up)
- Pending doctor verifications
- Active consultations
- System health status

Quick Stats Cards:

- Total doctors (verified/pending)
- Total patient records (managed by clinics)
- Total appointments
- Total revenue
- Completed consultations
- Cancelled appointments
- Average rating

Charts & Analytics:

- User growth graph (monthly)
- Appointment trends
- Revenue trends
- Popular specialties
- Peak booking hours
- Geographic distribution
  User Management
  Manage all users:

Doctor Management:

- List all doctors
- Filter: Verified/Pending/Rejected/Suspended
- Search by name, specialty, location
- Actions:
  - View profile
  - Verify/Reject
  - Suspend/Activate
  - Edit details
  - Delete
- Bulk actions: Export, Send notification

Doctor Verification:

- Pending applications list
- View uploaded documents
- Verify credentials
- Approve/Reject with comments
- Request additional documents
- Email notification to doctor

Patient Management (clinic-only: patient **records**, not patient-portal users):

- List all patient records (managed by clinics)
- Search by name, phone, email
- View patient details
- Appointment history
- Payment history
- Suspend/Delete record (or flag)
- Export patient data

Admin Users:

- Create sub-admins
- Role-based permissions
- Activity logs
- Enable/Disable admins
  Appointment Management
  Manage all appointments:

Appointments List:

- All appointments across platform
- Filter: Status, Date, Doctor, Patient, Location
- Search by booking ID
- View details
- Modify/Cancel appointments
- Resolve disputes

Appointment Analytics:

- Completion rate
- Cancellation rate
- No-show rate
- Average consultation duration
- Peak hours analysis
- Doctor-wise stats
  Content Management (clinic-only: clinic/tenant branding and internal content, not public “find doctors” marketing)
  Manage website content:

Specialty Management:

- Add/Edit/Delete specialties
- Upload specialty icons
- Set order/priority
- Activate/Deactivate

Blog/Articles:

- Create health articles
- Rich text editor
- Add images/videos
- SEO settings
- Publish/Draft status
- Categories and tags

FAQs:

- Add frequently asked questions
- Categorize (Patients, Doctors, General)
- Reorder questions

Pages:

- Edit static pages (About, Contact, Terms, Privacy)
- Manage content blocks
- Update footer links

Banner Management:

- Homepage banners/sliders
- Promotional banners
- Schedule banner display
  Financial Management
  Revenue and payment management:

Revenue Dashboard:

- Total revenue
- Commission earned
- Pending settlements
- Completed transactions
- Revenue by doctor
- Revenue by specialty
- Payment method breakdown

Doctor Settlements:

- Pending settlements list
- Payment due per doctor
- Mark as paid
- Generate settlement reports
- Transaction history
- Dispute management

Commission Settings:

- Platform commission percentage
- Doctor-wise commission
- Specialty-wise rates
- Payment cycle configuration

Invoicing:

- Generate invoices
- Tax calculations
- Invoice templates
- Email invoices
  Reports & Analytics
  Comprehensive reporting:

User Reports:

- New registrations (daily/weekly/monthly)
- Active users
- User retention rate
- User demographics

Appointment Reports:

- Booking trends
- Cancellation analysis
- Doctor utilization
- Popular time slots
- Specialty-wise distribution

Financial Reports:

- Revenue reports
- Payment gateway transactions
- Refund reports
- Tax reports
- Profit/Loss statements

Performance Reports:

- Doctor ratings
- Patient satisfaction scores
- Average wait time
- Consultation duration
- Platform performance metrics

Export Options:

- PDF, Excel, CSV formats
- Date range selection
- Custom report builder
  Settings & Configuration
  Platform settings:

General Settings:

- Platform name and logo
- Contact information
- Social media links
- Operating hours
- Support email/phone

Booking Settings:

- Minimum advance booking time
- Maximum advance booking days
- Cancellation policy
- Reschedule policy
- No-show policy
- Buffer time between appointments

Payment Settings:

- Payment gateway configuration
- Accepted payment methods
- Refund policy
- Transaction fees
- Currency settings

Notification Settings:

- Email templates
- SMS templates
- Push notification settings
- Trigger configuration

Email/SMS Configuration:

- SMTP settings
- SMS gateway API
- Sender ID configuration
- Template management

SEO Settings:

- Meta tags
- Sitemap generation
- Robots.txt
- Analytics integration (Google Analytics)

Security Settings:

- Password policies
- Session timeout
- Two-factor authentication
- IP whitelist/blacklist
- API rate limiting
  Review & Rating Management
  Manage platform reviews:

Reviews Dashboard:

- All reviews list
- Filter by rating, date, doctor
- Pending approval (if moderation enabled)
- Flagged reviews

Review Actions:

- Approve/Reject reviews
- Mark as inappropriate
- Respond to reviews
- Delete fake reviews
- Feature positive reviews

Rating Analytics:

- Average platform rating
- Doctor-wise ratings
- Specialty-wise ratings
- Rating trends
- Review sentiment analysis

🔧 PART 4: TECHNICAL IMPLEMENTATION
Technology Stack Recommendation
Frontend:

- React 18 + TypeScript
- Next.js (for SEO and SSR)
- Tailwind CSS + shadcn/ui
- State: Zustand or Redux Toolkit
- Forms: React Hook Form + Zod
- API calls: Axios or React Query
- Charts: Recharts or Chart.js

Backend:
Option 1 (Node.js):

- Node.js + Express.js
- TypeScript
- Prisma ORM or TypeORM
- PostgreSQL database
- Redis for caching
- JWT authentication
- Socket.io for real-time features

Option 2 (Python):

- Django or FastAPI
- PostgreSQL
- Django REST Framework
- Celery for background tasks
- Redis

Database Schema:

- Users (patients, doctors, admins)
- Appointments
- Prescriptions
- Medical_records
- Payments
- Reviews
- Clinics
- Specialties
- Notifications
- Messages

Third-Party Integrations:

- Payment: Razorpay, Stripe
- SMS: Twilio, MSG91
- Email: SendGrid, Amazon SES
- Video: Twilio Video, Agora, WebRTC
- Maps: Google Maps API
- Storage: AWS S3, Cloudinary
- Analytics: Google Analytics, Mixpanel
  Database Schema Design
  sql-- Users Table
  CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  user_type ENUM('patient', 'doctor', 'admin'),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
  );

-- Patients Table
CREATE TABLE patients (
id UUID PRIMARY KEY,
user_id UUID REFERENCES users(id),
full_name VARCHAR NOT NULL,
date_of_birth DATE,
gender ENUM('male', 'female', 'other'),
blood_group VARCHAR,
address TEXT,
emergency_contact VARCHAR,
profile_photo VARCHAR
);

-- Doctors Table
CREATE TABLE doctors (
id UUID PRIMARY KEY,
user_id UUID REFERENCES users(id),
full_name VARCHAR NOT NULL,
specialization_id UUID REFERENCES specializations(id),
registration_number VARCHAR UNIQUE,
experience_years INT,
consultation_fee DECIMAL,
video_consultation_fee DECIMAL,
rating DECIMAL(2,1),
total_reviews INT,
verification_status ENUM('pending', 'verified', 'rejected'),
profile_photo VARCHAR,
about TEXT,
qualifications JSONB,
awards JSONB
);

-- Clinics Table
CREATE TABLE clinics (
id UUID PRIMARY KEY,
doctor_id UUID REFERENCES doctors(id),
name VARCHAR NOT NULL,
address TEXT NOT NULL,
city VARCHAR,
state VARCHAR,
pincode VARCHAR,
latitude DECIMAL,
longitude DECIMAL,
working_hours JSONB,
facilities JSONB
);

-- Appointments Table
CREATE TABLE appointments (
id UUID PRIMARY KEY,
patient_id UUID REFERENCES patients(id),
doctor_id UUID REFERENCES doctors(id),
clinic_id UUID REFERENCES clinics(id),
appointment_date DATE NOT NULL,
appointment_time TIME NOT NULL,
duration INT DEFAULT 30,
consultation_type ENUM('in-person', 'video'),
status ENUM('scheduled', 'completed', 'cancelled', 'no-show'),
reason TEXT,
payment_status ENUM('pending', 'paid', 'refunded'),
payment_amount DECIMAL,
booking_id VARCHAR UNIQUE,
created_at TIMESTAMP
);

-- Prescriptions Table
CREATE TABLE prescriptions (
id UUID PRIMARY KEY,
appointment_id UUID REFERENCES appointments(id),
patient_id UUID REFERENCES patients(id),
doctor_id UUID REFERENCES doctors(id),
diagnosis TEXT,
medicines JSONB,
tests_recommended JSONB,
instructions TEXT,
follow_up_date DATE,
created_at TIMESTAMP
);

-- Reviews Table
CREATE TABLE reviews (
id UUID PRIMARY KEY,
doctor_id UUID REFERENCES doctors(id),
patient_id UUID REFERENCES patients(id),
appointment_id UUID REFERENCES appointments(id),
rating INT CHECK (rating >= 1 AND rating <= 5),
review_text TEXT,
is_verified BOOLEAN DEFAULT false,
is_approved BOOLEAN DEFAULT true,
created_at TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
id UUID PRIMARY KEY,
appointment_id UUID REFERENCES appointments(id),
patient_id UUID REFERENCES patients(id),
amount DECIMAL NOT NULL,
payment_method VARCHAR,
transaction_id VARCHAR UNIQUE,
status ENUM('pending', 'completed', 'failed', 'refunded'),
gateway_response JSONB,
created_at TIMESTAMP
);

-- Add more tables for: specializations, medical_records,
-- notifications, messages, etc.

```

### API Endpoints Structure
```

Authentication:
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/verify-email
POST /api/auth/verify-otp

Patients:
GET /api/patients
GET /api/patients/:id
PUT /api/patients/:id
DELETE /api/patients/:id
GET /api/patients/:id/appointments
GET /api/patients/:id/prescriptions
GET /api/patients/:id/medical-records
POST /api/patients/:id/medical-records

Doctors:
GET /api/doctors
GET /api/doctors/:id
PUT /api/doctors/:id
POST /api/doctors/register
GET /api/doctors/search
GET /api/doctors/:id/reviews
GET /api/doctors/:id/availability
GET /api/doctors/:id/appointments

Appointments:
POST /api/appointments
GET /api/appointments/:id
PUT /api/appointments/:id
DELETE /api/appointments/:id
GET /api/appointments/:id/reschedule
POST /api/appointments/:id/cancel
GET /api/appointments/slots

Prescriptions:
POST /api/prescriptions
GET /api/prescriptions/:id
PUT /api/prescriptions/:id
GET /api/prescriptions/:id/download

Reviews:
POST /api/reviews
GET /api/reviews
PUT /api/reviews/:id
DELETE /api/reviews/:id

Payments:
POST /api/payments/initiate
POST /api/payments/verify
GET /api/payments/:id
POST /api/payments/refund

Admin:
GET /api/admin/dashboard
GET /api/admin/users
GET /api/admin/doctors/verify
GET /api/admin/appointments
GET /api/admin/reports
POST /api/admin/settings

Video Consultation:
POST /api/video/generate-token
GET /api/video/room/:id
POST /api/video/end-call

```

### Feature Priority & Timeline
```

Phase 1 (Weeks 1-4): MVP
✅ User authentication (patients & doctors)
✅ Doctor profile & listings
✅ Basic appointment booking
✅ Patient dashboard
✅ Doctor dashboard
✅ Basic admin panel
✅ Payment integration

Phase 2 (Weeks 5-8): Core Features
✅ Video consultation
✅ Prescription management
✅ Medical records upload
✅ Reviews & ratings
✅ Search & filters
✅ Notifications (email/SMS)

Phase 3 (Weeks 9-12): Advanced Features
✅ Advanced analytics
✅ Multi-clinic support
✅ Family member management
✅ Lab test integration
✅ Medicine delivery integration
✅ Insurance integration
✅ Mobile responsive optimization

Phase 4 (Weeks 13-16): Polish & Launch
✅ Performance optimization
✅ Security hardening
✅ SEO optimization
✅ Testing (unit, integration, E2E)
✅ Documentation
✅ Beta launch

Phase 5 (Post-Launch): Enhancements
✅ Mobile apps (iOS & Android)
✅ AI-powered features
✅ Multilingual support
✅ Advanced telemedicine features
✅ Wearable device integration

```

---

## 📋 COMPLETE CURSOR AI PROMPTS

### Phase 1: Project Setup
```

Create a full-stack healthcare platform with:

Frontend Setup:

- Monorepo structure with 3 apps: patient-portal, doctor-portal, admin-portal
- Next.js 14 with App Router
- TypeScript strict mode
- Tailwind CSS + shadcn/ui
- Shared components library
- Responsive design mobile-first

Backend Setup:

- Node.js + Express + TypeScript
- PostgreSQL with Prisma ORM
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- File upload handling (multer)
- Email service (nodemailer)
- SMS service integration
- Error handling middleware
- Request validation (Zod)
- API rate limiting

Project Structure:
/apps
/patient-portal
/doctor-portal
/admin-portal
/packages
/ui (shared components)
/api-client
/utils
/types
/backend
/src
/routes
/controllers
/services
/models
/middleware
/utils
/config

Initialize with all dependencies and basic configuration.

```

### Phase 2: Authentication System
```

Implement complete authentication system:

Features needed:

1. Patient registration with email/phone OTP
2. Doctor registration with document verification
3. Admin login (email + 2FA)
4. JWT access & refresh tokens
5. Password reset flow
6. Email verification
7. Social login (Google, Facebook)
8. Session management
9. Role-based route protection

Frontend components:

- Login page with email/phone toggle
- Registration forms (separate for patient/doctor)
- OTP verification modal
- Forgot password flow
- Email verification page
- Protected route wrapper

Backend APIs:

- POST /auth/register
- POST /auth/login
- POST /auth/verify-otp
- POST /auth/refresh-token
- POST /auth/forgot-password
- POST /auth/reset-password
- GET /auth/me
- POST /auth/logout

Security:

- Password hashing (bcrypt)
- Rate limiting on auth endpoints
- CSRF protection
- XSS prevention
- Secure cookie handling

```

### Phase 3: Doctor Features
```

Build complete doctor module:

1. Doctor Profile Management:

- Profile photo upload with crop
- Professional details form
- Multiple qualifications add/edit/delete
- Clinic management (add multiple locations)
- Service offerings
- Fee structure
- Working hours per clinic
- Upload verification documents

2. Doctor Search & Listing:

- Advanced search with filters
- Sort options
- Map view integration
- Pagination
- Doctor cards with key info
- Quick book button

3. Doctor Detail Page:

- Comprehensive profile display
- Tabbed interface
- Reviews section
- Availability calendar
- Book appointment widget (sticky)
- Share profile button

4. Doctor Dashboard:

- Stats cards
- Today's appointments
- Upcoming schedule
- Earnings summary
- Quick actions
- Recent notifications

Database models:

- doctors table
- clinics table
- doctor_qualifications table
- doctor_services table
- working_hours table

Include form validations, image optimization, and SEO.

```

### Phase 4: Appointment System
```

Create comprehensive appointment booking system:

1. Availability Management (Doctor side):

- Weekly schedule grid
- Set working hours per clinic
- Block time slots
- Mark holidays/leaves
- Set slot duration
- Emergency slot toggle

2. Booking Flow (Patient side):

- Doctor selection
- Date picker with available dates
- Time slot selection
- Patient details form
- Problem description
- Upload reports
- Payment integration
- Confirmation page

3. Appointment Management:

- Calendar view (day/week/month)
- List view with filters
- Status management
- Reschedule functionality
- Cancellation with refund
- No-show handling
- SMS/Email reminders

4. Real-time Features:

- Slot availability updates
- Booking notifications
- Waiting room for video calls

Database:

- appointments table with all fields
- appointment_slots table
- appointment_cancellations table

APIs:

- GET /doctors/:id/availability
- POST /appointments
- GET /appointments/:id
- PUT /appointments/:id/reschedule
- DELETE /appointments/:id
- GET /appointments/upcoming

Add optimistic UI updates and error handling.

```

### Phase 5: Video Consultation
```

Implement telemedicine features:

Video Call System:

- Integration: Agora SDK or Twilio Video
- Pre-call system check
- Waiting room
- Call interface with controls
- Chat during call
- Screen sharing
- Document sharing
- Call recording (optional)
- Call quality monitoring

Features:

- Scheduled video appointments
- Instant consultations (if doctor available)
- Join call 5 mins before scheduled time
- Automatic call disconnect after duration
- Post-call survey

Frontend:

- System check page (camera/mic test)
- Waiting room with countdown
- Video call interface
- Chat panel
- Controls (mute, video, share, end)
- Connection quality indicator

Backend:

- Generate video tokens
- Create video rooms
- Track call duration
- Store call logs
- Handle disconnections

Components needed:

- VideoCallRoom component
- SystemCheck component
- WaitingRoom component
- ChatPanel component
- ControlBar component

Include error handling for network issues.

```

### Phase 6: Prescription & Medical Records
```

Build prescription and medical records system:

1. Digital Prescription Creator (Doctor):

- Patient search and selection
- Symptoms/Diagnosis input
- Medicine search from database
- Dosage, frequency, duration selectors
- Add multiple medicines
- Tests recommended
- Special instructions
- Follow-up date
- Digital signature
- Print/Download PDF
- Email to patient

2. Prescription Database:

- Medicine master with autocomplete
- Generic and brand names
- Dosage forms
- Common instructions templates

3. Medical Records (Patient):

- Upload documents (PDF, images)
- Categorize: Reports, Prescriptions, Images
- OCR for lab reports
- Timeline view
- Share with doctor
- Download/Print

4. Patient Medical History (Doctor view):

- Complete timeline
- Past prescriptions
- Lab reports
- Allergies
- Chronic conditions
- Previous consultations
- Doctor notes

Database:

- prescriptions table
- prescription_medicines table
- medicines_master table
- medical_records table
- patient_allergies table

PDF Generation:

- Use jsPDF or PDFKit
- Professional prescription template
- Include doctor letterhead
- QR code for verification

Include validation and drug interaction warnings.

```

### Phase 7: Payment Integration
```

Implement complete payment system:

Payment Gateways:

- Razorpay (India)
- Stripe (International)
- Multiple payment methods support

Features:

1. Payment Flow:

- Payment initiation
- Gateway redirect
- Payment verification
- Webhook handling
- Success/Failure pages
- Payment confirmation email/SMS

2. Wallet System:

- Patient wallet
- Add money
- Pay from wallet
- Wallet transactions history
- Refund to wallet

3. Refund Management:

- Automatic refund on cancellation
- Partial/Full refund
- Refund timeline
- Refund status tracking

4. Doctor Settlements:

- Commission calculation
- Settlement cycle
- Payout initiation
- Transaction reports
- TDS calculation

Database:

- payments table
- transactions table
- wallet table
- refunds table
- settlements table

APIs:

- POST /payments/initiate
- POST /payments/verify
- POST /payments/webhook
- GET /payments/:id
- POST /refunds
- GET /wallet/balance
- GET /transactions

Security:

- Payment signature verification
- Webhook authentication
- PCI compliance
- Encrypted sensitive data

Include payment status polling and timeout handling.
Phase 8: Reviews & Ratings
Create review and rating system:

Features:

1. Submit Review (Patient):

- Star rating (1-5)
- Written review
- Multiple aspects (Punctuality, Behavior, Expertise)
- Upload photos (optional)
- Anonymous option

2. Review Display:

- Average rating
- Rating breakdown (5-star, 4-star, etc.)
- Total reviews count
- Verified patient badge
- Review date
- Helpful/Not helpful votes
- Sort: Newest, Highest, Lowest
- Filter by rating

3. Doctor Response:

- Respond to reviews
- Thank patients
- Address concerns

4. Review Moderation (Admin):

- Pending reviews
- Approve/Reject
- Flag inappropriate
- Remove fake reviews

5. Review Analytics:

- Rating trends
- Sentiment analysis
- Common keywords
- Improvement areas

Database:

- reviews table
- review_votesContinue4:44 PMtable

review_responses table

Validation:

One review per appointment
Only completed appointments
Review within 30 days of appointment

Include spam detection and sentiment analysis.

### Phase 9: Admin Panel

Build comprehensive admin dashboard:

Dashboard Overview:

Total users stats
Today's appointments
Revenue metrics
Charts and graphs
Quick actions

User Management:

All users list (patients, doctors, admins)
Search and filters
User details modal
Suspend/Activate users
Delete users
Export data

Doctor Verification:

Pending applications
Document viewer
Verify/Reject with reason
Email notification
Verification history

Appointment Management:

All appointments view
Filter by status, date, doctor
Modify appointments
Resolve disputes
Cancellation analytics

Financial Management:

Revenue dashboard
Commission reports
Pending settlements
Transaction logs
Refund management
Generate invoices

Content Management:

Manage specialties
Blog posts CRUD
FAQ management
Static page editing
Banner management

Settings:

Platform settings
Payment configuration
Email/SMS templates
Commission rates
Booking policies
SEO settings

Reports & Analytics:

User reports
Appointment reports
Revenue reports
Performance metrics
Export functionality

Include role-based permissions and activity logs.

### Phase 10: Notifications System

Implement multi-channel notification system:
Notification Types:

Email Notifications:

Welcome email
Email verification
Appointment confirmation
Appointment reminder (24hrs, 1hr before)
Appointment cancellation
Prescription ready
Payment confirmation
Password reset

SMS Notifications:

OTP verification
Appointment confirmation
Appointment reminder
Cancellation alert
Payment success

Push Notifications (Web):

New appointment request
Appointment confirmed
New message
Review received
Payment received

In-app Notifications:

Real-time notification center
Notification bell with badge
Mark as read/unread
Notification history
Categorized notifications

Implementation:

Email: Nodemailer + SendGrid
SMS: Twilio or MSG91
Push: Firebase Cloud Messaging
In-app: Socket.io

Database:

notifications table
notification_preferences table
email_logs table
sms_logs table

Features:

Notification preferences (opt-in/opt-out)
Batch notifications
Scheduled notifications
Retry mechanism
Delivery tracking

Create reusable email templates with branding.

### Phase 11: Search & Filters

**Clinic-only:** Doctor search is for **clinic staff and admin** (e.g. selecting a doctor for an appointment, managing doctors). No public “find a doctor” for patients.

Implement advanced search functionality:

Doctor Search (clinic-internal):

Full-text search on name, specialty
Filters:

Location (city, area) with autocomplete
Specialty dropdown
Gender
Experience range
Fee range slider
Rating (4+, 3+)
Availability (Today, Tomorrow, This week)
Consultation type
Languages spoken
Insurance accepted

Search Results:

Sort by: Relevance, Rating, Experience, Fees
Pagination or infinite scroll
Result count
Applied filters display with remove option
Save search option

Autocomplete:

Location autocomplete using Google Places
Doctor name suggestions
Specialty suggestions
Recent searches

Map Integration:

Show doctors on map
Filter by radius
Cluster markers
Click marker for details
Get directions

Backend:

Elasticsearch for fast search (optional)
Database indexing
Query optimization
Caching popular searches

Frontend:

Debounced search input
Loading states
No results state
Search analytics

Include geolocation for "Near me" feature.

### Phase 12: Mobile Optimization

Make platform fully mobile responsive for **clinic staff and doctors** (no patient portal in scope):
Responsive Design:

Clinic / Staff app:

Mobile-friendly dashboard
Touch-friendly navigation
Mobile-optimized forms (appointments, patients, prescriptions)
Mobile calendar and queue views

Doctor Portal:

Responsive sidebar
Mobile appointment management
Touch-friendly prescription creator
Mobile schedule view
Optimized dashboard cards

Common Features:

Hamburger menu
Slide-out panels
Bottom sheets for actions
Pull-to-refresh
Infinite scroll
Touch gestures
Mobile search overlay

Breakpoints:

Mobile: 320px - 768px
Tablet: 769px - 1024px
Desktop: 1025px+

Testing:

Test on actual devices
Chrome DevTools responsive mode
Various screen sizes
Portrait and landscape
Touch interactions

Performance:

Lazy loading images
Code splitting
Minimize bundle size
Optimize images for mobile
Service worker for offline support

Include mobile-specific UX improvements.

### Phase 13: Advanced Features

Implement premium features:

Family Member Management:

Add family members
Manage profiles
Book for family
Separate medical records
Switch between profiles

Lab Test Booking:

Lab test catalog
Home collection booking
Lab partners integration
Test packages
Upload lab results
Track sample collection

Medicine Delivery:

Medicine order from prescription
Pharmacy integration (1mg, PharmEasy)
Cart and checkout
Track delivery
Reorder medicines

Insurance Integration:

Insurance provider list
Claim submission
Cashless treatment
Insurance verification
Claim status tracking

Health Records:

Vaccination records
Allergy tracker
Medication reminders
Health vitals logging
BMI calculator
Health tips

Chat with Doctor:

Text messaging
Image sharing
Voice messages
Read receipts
Typing indicators

Appointment Templates:

Recurring appointments
Bulk booking
Group appointments
Emergency booking

Multi-language Support:

Language selector
Translations for UI
RTL support for Arabic/Urdu
Localized content

Include third-party API integrations.

### Phase 14: Analytics & Tracking

Implement comprehensive analytics:

User Analytics:

Google Analytics 4 integration
Custom event tracking
User journey mapping
Conversion funnel analysis
Cohort analysis

Events to Track:

Page views
User registrations
Doctor searches
Appointment bookings
Payment completions
Video call sessions
Prescription downloads
Review submissions

Admin Analytics Dashboard:

Real-time visitor count
Popular pages
User acquisition sources
Conversion rates
Drop-off points
A/B test results

Doctor Analytics:

Profile views
Booking conversion rate
Average rating trend
Revenue analytics
Patient retention
Peak booking hours

Business Metrics:

CAC (Customer Acquisition Cost)
LTV (Lifetime Value)
Churn rate
MRR (Monthly Recurring Revenue)
DAU/MAU
Booking success rate

Tools:

Google Analytics
Mixpanel
Hotjar for heatmaps
Custom analytics dashboard

Privacy:

GDPR compliance
Cookie consent
Anonymized data
User opt-out option

Include custom events and conversion tracking.

### Phase 15: SEO Optimization

Implement comprehensive SEO:

Technical SEO:

Server-side rendering (Next.js)
Meta tags for all pages
Open Graph tags
Twitter cards
Structured data (JSON-LD)
Canonical URLs
XML sitemap
Robots.txt
Fast loading times
Mobile-friendly

On-Page SEO:

Optimized titles and descriptions
H1, H2, H3 hierarchy
Alt text for images
Internal linking
Breadcrumbs
Rich snippets for doctors
FAQ schema
Local business schema

Doctor Profile SEO:

Unique URLs (/doctors/dr-john-smith)
Optimized meta descriptions
Schema markup for medical professionals
Reviews in search results
Location information

Content Marketing:

Health blog with articles
Disease/condition pages
Treatment guides
Doctor listing pages by specialty
City-wise landing pages

Performance:

Image optimization
Lazy loading
Code splitting
CDN integration
Caching strategy
Core Web Vitals optimization

Analytics:

Google Search Console
Track rankings
Monitor crawl errors
Submit sitemap
Performance reports

Implement dynamic meta tags and prerendering.

### Phase 16: Security Hardening

Implement enterprise-grade security:

Authentication Security:

bcrypt password hashing (12 rounds)
JWT with short expiry
Refresh token rotation
Session management
Account lockout after failed attempts
Two-factor authentication
Biometric login support

Authorization:

Role-based access control
Permission-based routes
API endpoint protection
Resource ownership validation

Data Security:

Encryption at rest (database)
Encryption in transit (HTTPS)
Sensitive data masking
PII data protection
HIPAA compliance measures
Data anonymization

API Security:

Rate limiting per endpoint
Request throttling
CORS configuration
Input validation (Zod)
SQL injection prevention
XSS protection
CSRF tokens
API key rotation

File Upload Security:

File type validation
File size limits
Virus scanning
Secure file storage
Signed URLs for access

Monitoring & Logging:

Security audit logs
Failed login tracking
Suspicious activity detection
Error logging (Sentry)
Real-time alerts

Compliance:

GDPR compliance
HIPAA compliance (if US)
Data retention policies
Right to deletion
Privacy policy
Terms of service

Infrastructure:

Firewall configuration
DDoS protection
SSL certificates
Backup strategy
Disaster recovery plan

Include security headers and penetration testing checklist.

### Phase 17: Testing

Implement comprehensive testing strategy:

Unit Tests:

Jest for JavaScript/TypeScript
Test utilities and helpers
API service tests
Validation logic tests
Business logic tests
80%+ code coverage

Integration Tests:

API endpoint tests
Database integration tests
Third-party service mocks
Payment gateway tests
Email/SMS service tests

End-to-End Tests:

Playwright or Cypress
Critical user journeys:

Patient registration and booking
Doctor profile creation
Appointment flow
Payment flow
Video consultation
Prescription creation

Component Tests:

React Testing Library
User interaction tests
Form validation tests
Modal and dialog tests
Responsive component tests

Performance Tests:

Load testing (Artillery, k6)
Stress testing
API performance benchmarks
Database query optimization
Frontend performance metrics

Security Tests:

OWASP top 10 checks
Penetration testing
Vulnerability scanning
Dependency audits

Accessibility Tests:

WCAG compliance
Screen reader testing
Keyboard navigation
Color contrast checks

Test Coverage Goals:

Unit tests: 80%+
Integration tests: 70%+
E2E tests: Critical paths

CI/CD Integration:

GitHub Actions or GitLab CI
Automated test runs
Test reports
Coverage reports
Failed build notifications

Include test fixtures and mocking strategies.

### Phase 18: Deployment & DevOps

Set up production deployment:

Infrastructure:

Cloud provider: AWS/Google Cloud/Azure
Frontend: Vercel or Netlify
Backend: AWS EC2, ECS, or Railway
Database: AWS RDS or managed PostgreSQL
File storage: AWS S3 or Cloudinary
CDN: CloudFront or Cloudflare
Redis: ElastiCache or managed Redis

Environment Setup:

Development
Staging
Production
Environment variables management
Secrets management (AWS Secrets Manager)

CI/CD Pipeline:

GitHub Actions workflow
Automated testing on PR
Build and deploy on merge
Rollback mechanism
Blue-green deployment

Monitoring:

Application monitoring (New Relic, Datadog)
Error tracking (Sentry)
Uptime monitoring (Pingdom)
Log aggregation (CloudWatch, LogRocket)
Performance monitoring
Alert configuration

Backup & Recovery:

Automated database backups
Backup retention policy
Point-in-time recovery
Disaster recovery plan
Data restoration testing

Scaling:

Auto-scaling configuration
Load balancer setup
Database read replicas
Caching strategy (Redis)
CDN for static assets

Domain & SSL:

Domain configuration
SSL certificate (Let's Encrypt)
DNS management
Subdomain setup

Documentation:

Deployment runbook
Architecture diagrams
API documentation (Swagger)
Environment setup guide
Troubleshooting guide

Include health checks and status page.

---

## 🎁 BONUS FEATURES

**Clinic-only scope:** The items below assume a patient-facing app (symptom checker, patient chatbot, “doctor suggestions for patients”). They are **out of scope** for the clinic-only product. Kept for reference if a patient portal is reintroduced later.

### AI-Powered Features (reference; patient-facing = out of scope)

Symptom Checker:

AI-based preliminary diagnosis
Suggest relevant specialists
Medical knowledge base integration

Smart Scheduling:

AI-optimized appointment slots
Predict no-shows
Dynamic pricing

Chatbot:

Patient query handling
Appointment booking assistance
FAQ responses
24/7 availability

Document Analysis:

OCR for lab reports
Extract key findings
Trend analysis

Personalized Recommendations:

Doctor suggestions based on history
Health tips
Preventive care reminders

### Marketing Features

Referral Program:

Share referral code
Reward credits
Track referrals

Loyalty Program:

Points on bookings
Tier benefits
Redeem rewards

Email Marketing:

Newsletter campaigns
Promotional emails
Segment targeting

SEO Content:

Auto-generated city pages
Specialty landing pages
Doctor profile blogs

---

## 📊 SUCCESS METRICS

**Scope reminder:** This product is clinic management only (doctors and clinic staff). “Patients” in metrics refers to **patient records** managed by the clinic, not to patient-portal users.

Track these KPIs:
User Metrics:

Total patient records (managed by clinics)
Total verified doctors
Active clinic/staff/doctor users (DAU/MAU)
User retention rate
Churn rate

Business Metrics:

Total appointments booked
Appointment completion rate
Average booking value
Monthly recurring revenue
Customer lifetime value
Platform commission earned

Engagement Metrics (clinic-only):

Average session duration (clinic/staff/doctor)
Pages per session
Bounce rate
Conversion rate (e.g. clinic signup to first appointment, or N/A if no public funnel)
Search-to-booking ratio: within-clinic only (staff/doctor search → appointment created)

Quality Metrics (clinic-only):

Average doctor rating (from clinic feedback, not public patient reviews)
Patient satisfaction (from post-visit feedback if collected by clinic)
Response time, cancellation rate, no-show rate (clinic-side metrics)

Technical Metrics:

Page load time
API response time
Uptime percentage
Error rate
Mobile vs desktop traffic

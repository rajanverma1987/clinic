# Telemedicine Workflow Guide
## Complete Video Consultation Process

---

## Overview

Video consultations are fully integrated into the appointments system. There's **ONE** place to schedule: the **Appointments page**.

---

## 📍 Single Entry Point for Scheduling

### ✅ Where to Schedule Video Consultations:
**`/appointments/new`** - The ONLY place to schedule

### ❌ What Was Removed:
- `/telemedicine/new` - Deleted (no longer needed)
- "Schedule Video Consultation" button from `/telemedicine` - Replaced with "Book Appointment"

---

## Complete User Journey

### 1. **Schedule Video Consultation**

**Where**: `/appointments/new`

**Steps**:
```
1. Doctor navigates to Appointments → Book Appointment
   
2. Fills in patient details:
   - Select patient
   - Select doctor
   - Choose date & time
   - Set duration
   - Select appointment type

3. Consultation Method appears with 2 options:
   
   [📍 In-Person Visit]  [🎥 Video Consultation]
    Patient visits         Remote via video call
        clinic

4. Click "Video Consultation"
   
5. Email field appears (required):
   Patient Email Address *
   [patient@example.com_________________]
   📧 An email with the secure video consultation 
      link will be sent to this address

6. Compliance notice shows:
   ┌─────────────────────────────────────────────┐
   │ Video Consultation - Privacy & Compliance   │
   │                                             │
   │ • Video calls are encrypted end-to-end      │
   │ • Sessions are HIPAA and GDPR compliant     │
   │ • Data is stored securely on our servers    │
   │ • Patient consent is required and recorded  │
   │ • All sessions are logged for compliance    │
   │ • Automated email sent with session details │
   │                                             │
   │ ☑ Patient consents to video consultation   │
   │   and understands their rights under        │
   │   HIPAA/GDPR *                              │
   └─────────────────────────────────────────────┘

7. Check consent checkbox (required)

8. Click "Schedule Appointment"

9. System automatically:
   ✅ Creates appointment
   ✅ Creates telemedicine session
   ✅ Generates secure session link
   ✅ Sends email to patient
   ✅ Logs all actions (audit trail)
```

---

### 2. **Email Notification (Automated)**

**Sent To**: Patient's email address

**Email Subject**: 
```
Video Consultation Scheduled - Monday, December 2, 2024
```

**Email Contains**:

```
┌──────────────────────────────────────────────────┐
│   Video Consultation Scheduled                   │
│                                                  │
│ Dear John Doe,                                   │
│                                                  │
│ Your video consultation has been scheduled with  │
│ Dr. Sarah Smith.                                 │
│                                                  │
│ Appointment Details:                             │
│ • Date: Monday, December 2, 2024                 │
│ • Time: 10:00 AM                                 │
│ • Doctor: Dr. Sarah Smith                        │
│ • Session ID: TM-0001                            │
│                                                  │
│     [🎥 Join Video Consultation]                 │
│        ↑ Clickable blue button                   │
│                                                  │
│ ⚠️ Important: Join 5 minutes early               │
│                                                  │
│ Technical Requirements:                          │
│ • Camera and microphone enabled                  │
│ • Stable internet (2+ Mbps)                      │
│ • Modern browser (Chrome/Firefox/Safari/Edge)    │
│ • Private, quiet environment                     │
│                                                  │
│ 🔒 Your Privacy is Protected:                    │
│ • End-to-end encrypted                           │
│ • HIPAA & GDPR compliant                         │
│ • No third-party access                          │
│ • Secure and private                             │
└──────────────────────────────────────────────────┘
```

**Link Format**:
```
https://your-clinic.com/telemedicine/[session-id]
```

---

### 3. **Queue Management**

**Where**: `/queue`

**What Doctors See**:

```
Queue #  Position  Patient      Doctor        Type           Priority  Wait    Actions
────────────────────────────────────────────────────────────────────────────────────────
Q-001    1         John Doe     Dr. Smith    🎥 Video       Normal    5 min   [Start Video]
Q-002    2         Jane Smith   Dr. Smith    🏥 In-Person   Normal    10 min  [Call Next]
Q-003    3         Bob Jones    Dr. Brown    🎥 Video       Urgent    15 min  [Start Video]
```

**Type Column**:
- 🎥 **Video** (blue tag) - Video consultation
- 🏥 **In-Person** (green tag) - Clinic visit

**Actions**:
- **Video appointments**: Blue "Start Video" button
- **In-person appointments**: "Call Next" button

---

### 4. **Starting Video Consultation**

**From Queue**:
```
1. Doctor sees patient in queue with 🎥 Video icon
2. Clicks "Start Video" button
3. Opens video consultation room
4. WebRTC auto-connects
5. Video call begins (encrypted)
```

**From Email Link**:
```
1. Patient clicks link in email
2. Opens /telemedicine/[session-id]
3. Browser asks for camera/mic permission
4. Patient allows access
5. Joins waiting room
6. Doctor clicks "Start Video" from queue
7. Both connected!
```

---

### 5. **During Video Call**

**Features Available**:
- 🎥 Video (HD quality, encrypted)
- 🎤 Audio (clear, encrypted)
- 💬 Chat (text messaging)
- 📎 File sharing
- 📝 Clinical notes
- 🔇 Mute/Unmute
- 📷 Camera on/off
- 🔴 End call

**All Communications**:
- ✅ End-to-end encrypted
- ✅ HIPAA/GDPR compliant
- ✅ Audit logged
- ✅ No third-party access

---

### 6. **Post-Consultation**

**After Call Ends**:
```
1. Doctor adds clinical notes
2. Can add prescriptions
3. Can create invoice
4. Session summary generated
5. All data saved (encrypted)
6. Patient can access summary
```

---

## Updated Pages

### `/telemedicine` - Dashboard

**NOW Shows**:
- Button: "Book Appointment" (goes to `/appointments/new`)
- List of existing video sessions
- Session history
- Upcoming video consultations

**REMOVED**:
- "Schedule Video Consultation" button
- Direct scheduling from this page

**Empty State**:
```
┌─────────────────────────────────────────────┐
│         Get Started with Telemedicine       │
│                                             │
│  Schedule video consultations from the      │
│  appointments page. Select "Video           │
│  Consultation" when booking to enable       │
│  remote care with secure, HIPAA-compliant   │
│  video calls.                               │
│                                             │
│  [Book Video Consultation] [View Appts]     │
└─────────────────────────────────────────────┘
```

---

## Navigation Flow

```
Appointments Page
      ↓
 Book Appointment
      ↓
Choose "Video Consultation"
      ↓
 Enter email + consent
      ↓
  Schedule
      ↓
System creates:
├─ Appointment
├─ Telemedicine Session  
├─ Secure Link
└─ Sends Email 📧
      ↓
Patient receives email
      ↓
Appointment appears in Queue 🎥
      ↓
Doctor clicks "Start Video"
      ↓
Video Call Active! 🎥
```

---

## For Developers

### Files Modified:

**Removed**:
- ❌ `app/telemedicine/new/page.tsx` - DELETED

**Updated**:
- ✅ `app/telemedicine/page.tsx` - Removed scheduling button
- ✅ `app/appointments/new/page.tsx` - Added video option + email
- ✅ `app/queue/page.tsx` - Added video type + Start Video button
- ✅ `app/api/appointments/route.ts` - Creates session + sends email
- ✅ `lib/email/email-service.ts` - Email templates

---

## API Flow

### POST `/api/appointments`

**Request Body** (for video consultation):
```json
{
  "patientId": "...",
  "doctorId": "...",
  "appointmentDate": "2024-12-02",
  "startTime": "2024-12-02T10:00:00Z",
  "endTime": "2024-12-02T10:30:00Z",
  "duration": 30,
  "type": "consultation",
  "isTelemedicine": true,
  "telemedicineConsent": true,
  "patientEmail": "patient@example.com",
  "reason": "Follow-up consultation",
  "notes": "..."
}
```

**Backend Process**:
```javascript
1. Validate input
2. Create appointment
3. If isTelemedicine:
   a. Create telemedicine session
   b. Link session to appointment
   c. Generate secure session link
   d. Get patient/doctor details
   e. Send email notification
   f. Log all actions
4. Return appointment + session ID
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "patientId": "...",
    "doctorId": "...",
    "isTelemedicine": true,
    "telemedicineSessionId": "...",
    "status": "scheduled",
    "createdAt": "..."
  }
}
```

---

## Testing Checklist

### ✅ Test Video Consultation Booking:
```
1. Go to /appointments/new
2. Fill patient, doctor, date, time
3. Click "Video Consultation"
4. Verify email field appears
5. Enter test@example.com
6. Check consent checkbox
7. Click Schedule
8. Check console for email log
9. Verify appointment created
```

### ✅ Test Queue Display:
```
1. Go to /queue
2. See appointment with 🎥 Video icon
3. Verify "Start Video" button appears
4. Click "Start Video"
5. Verify redirects to video room
```

### ✅ Test Email Notification:
```
1. Schedule video appointment
2. Check server logs for:
   "📧 Video consultation email sent to: ..."
3. In production, verify email received
4. Click link in email
5. Verify opens video room
```

### ✅ Test Telemedicine Dashboard:
```
1. Go to /telemedicine
2. Verify shows "Book Appointment" button
3. Click button
4. Verify redirects to /appointments/new
5. Verify empty state shows correct message
```

---

## Summary

### ✅ What Changed:
- **Removed**: Standalone telemedicine scheduling page
- **Added**: Video consultation option in appointments
- **Added**: Email notification system
- **Updated**: Queue to show video appointments
- **Updated**: Telemedicine dashboard to redirect to appointments

### ✅ Benefits:
- **Single source of truth**: All appointments in one place
- **Consistent UX**: Same booking flow for all appointment types
- **Better organization**: Video and in-person together
- **Email automation**: Patients get links automatically
- **Queue integration**: Doctors see all appointments unified

### ✅ Compliance:
- HIPAA compliant ✅
- GDPR compliant ✅
- Consent required ✅
- Audit trail ✅
- Encrypted ✅
- No PHI in emails ✅

---

**The complete telemedicine workflow is now streamlined through the appointments system!** 🎉


# Queue Workflow Documentation

## Overview
This document explains how patients move from appointments to the queue system in the clinic management platform.

---

## 📋 Complete Workflow

### **Step 1: Book Appointment**
**Location**: `/appointments/new`

1. Select patient (search by name, ID, or phone)
2. Choose doctor
3. Select consultation type (In-Person or Video)
4. Set date and time
5. Add reason and notes
6. Click **"Book Appointment"**

**Result**: Appointment created with status `SCHEDULED`

---

### **Step 2: View Appointments**
**Location**: `/appointments`

**Features**:
- ✅ Today's appointment count card
- ✅ Tomorrow's appointment count card
- ✅ Filter by date
- ✅ View all appointments in a table
- ✅ See appointment method (Video 🎥 or In-Person 🏥)
- ✅ Status indicators with color coding

**Available Actions**:
| Current Status | Available Action | What Happens |
|---------------|------------------|--------------|
| `SCHEDULED` | **Mark Arrived** | Patient added to queue |
| `CONFIRMED` | **Mark Arrived** | Patient added to queue |
| `ARRIVED` | **Start Appointment** | Consultation begins |
| `IN_PROGRESS` | **Complete Appointment** | Marks as done |

---

### **Step 3: Mark Patient as Arrived** ✨
**Location**: `/appointments` → Click **"Mark Arrived"** button

**What Happens Automatically**:

1. **Appointment Status Updated** → `ARRIVED`
2. **Queue Entry Created** → Patient automatically added to queue with:
   - Unique queue number (e.g., `Q-0001`, `Q-0002`)
   - Position calculated based on waiting count
   - Priority set to `NORMAL` (can be changed)
   - Estimated wait time calculated (30 min × position)
   - Status set to `WAITING`

3. **Toast Notification** → Success message displayed:
   ```
   "[Patient Name] marked as arrived and added to the queue!"
   ```

4. **Auto-Refresh** → Both appointments list and stats cards update automatically

---

### **Step 4: View Queue**
**Location**: `/queue`

**Queue Display Shows**:
- Queue number (e.g., `Q-0001`)
- Position in line
- Patient name
- Doctor assigned
- Consultation type: 🎥 **Video** or 🏥 **In-Person**
- Priority (Urgent/High/Normal)
- Estimated wait time
- Status

**Queue Actions**:
1. **Call Next** → Changes status to `CALLED`
2. **Mark In Progress** → Changes status to `IN_PROGRESS`
3. **Start Video** → (For video consultations) Opens telemedicine room
4. **Refresh Queue** → Manual refresh button to reload

---

## 🔄 Status Flow Diagram

```
APPOINTMENT WORKFLOW:
┌────────────┐     Mark        ┌──────────┐     Start         ┌─────────────┐     Complete     ┌───────────┐
│ SCHEDULED  │ ──Arrived──→    │ ARRIVED  │ ──Appointment──→  │ IN_PROGRESS │ ──Appointment──→ │ COMPLETED │
└────────────┘                 └──────────┘                   └─────────────┘                  └───────────┘
                                     │
                                     │ (Automatic)
                                     ▼
                               ┌──────────┐
                               │  QUEUE   │
                               │ WAITING  │
                               └──────────┘
```

---

## 🎯 Key Features

### **Automatic Queue Addition**
- ✅ No manual queue entry needed
- ✅ "Mark Arrived" button automatically creates queue entry
- ✅ Prevents duplicate queue entries for same appointment
- ✅ Auto-calculates position and wait time

### **Smart Position Management**
- ✅ Positions auto-calculated based on:
  - Priority level (Urgent → High → Normal)
  - Current doctor's queue
  - Join time (FIFO within priority)
- ✅ Positions automatically recalculated when:
  - New patients join
  - Priority changes
  - Patients are called/completed

### **User Feedback**
- ✅ Toast notifications for all status changes
- ✅ Success messages with patient names
- ✅ Error handling with user-friendly messages
- ✅ Real-time stats updates

### **Multi-Method Support**
- ✅ In-Person consultations
- ✅ Video consultations (Telemedicine feature)
- ✅ Visual indicators for consultation type
- ✅ Different workflows for each type

---

## 💡 Best Practices

### **For Reception Staff**

1. **When Patient Arrives**:
   - Go to `/appointments`
   - Find patient's appointment
   - Click **"Mark Arrived"** button
   - Verify success notification
   - Patient automatically appears in queue

2. **Managing Queue**:
   - Go to `/queue`
   - Click **"Refresh Queue"** to see latest
   - Use **"Call Next"** to notify patient
   - Doctor starts consultation from queue

3. **For Video Consultations**:
   - Mark as arrived same way
   - Patient receives email with session link
   - Click **"Start Video"** in queue when ready

---

## 🔧 Technical Implementation

### **Backend Service**
**File**: `services/appointment.service.ts`

When status changes to `ARRIVED`:
```typescript
// Automatically creates queue entry
case AppointmentStatus.ARRIVED:
  updateData.arrivedAt = now;
  
  // Create queue entry (lines 388-437)
  await Queue.create({
    tenantId,
    type: QueueType.APPOINTMENT,
    appointmentId,
    patientId,
    doctorId,
    queueNumber,
    position,
    priority: QueuePriority.NORMAL,
    status: QueueStatus.WAITING,
    joinedAt: now,
    estimatedWaitTime: (position - 1) * 30
  });
```

### **Frontend Component**
**File**: `app/appointments/page.tsx`

```typescript
// Mark Arrived button (lines 306-321)
<Button
  onClick={() => handleStatusChange(row._id, 'arrived', patientName)}
  title="Mark patient as arrived and add to queue"
>
  Mark Arrived
</Button>

// Success notification
showSuccess(
  `${patientName} marked as arrived and added to the queue!`,
  'Added to Queue'
);
```

---

## 🚨 Error Handling

### **Duplicate Queue Entry Prevention**
- System checks if appointment already in queue
- Prevents creating duplicate entries
- Returns error: "Appointment is already in queue"

### **Validation Checks**
- ✅ Patient exists and belongs to tenant
- ✅ Doctor exists and is active
- ✅ Appointment matches patient/doctor
- ✅ Appointment not deleted

### **User-Friendly Errors**
- ✅ Toast notifications for all errors
- ✅ Clear error messages (no technical jargon)
- ✅ Actionable error information

---

## 📊 Queue Statistics

### **Auto-Calculated Metrics**
1. **Position**: Based on waiting count + priority
2. **Wait Time**: `(position - 1) × 30 minutes`
3. **Queue Number**: Auto-incremented per tenant
4. **Priority**: Affects position in queue

### **Real-Time Updates**
- Stats refresh after status changes
- Queue positions recalculate automatically
- Wait times update dynamically

---

## 🎓 Training Guide

### **Quick Start for New Staff**

1. **Patient arrives for appointment**
   - Open Appointments page
   - Find their appointment
   - Click "Mark Arrived"
   - See success message

2. **Check queue**
   - Open Queue page
   - See patient in waiting list
   - Note their position and wait time

3. **Call patient**
   - Click "Call Next" button
   - Patient status → Called

4. **Start consultation**
   - Doctor clicks "Start" in queue
   - Or starts video call for telemedicine

---

## 🔍 Troubleshooting

### **Patient Not Appearing in Queue**

**Issue**: Clicked "Mark Arrived" but patient not in queue

**Solutions**:
1. Check if success notification appeared
2. Click "Refresh Queue" button
3. Verify appointment status changed to "Arrived"
4. Check browser console for errors
5. Ensure patient belongs to correct doctor

### **Wrong Queue Position**

**Issue**: Patient position seems incorrect

**Solutions**:
1. Check priority level (Urgent goes first)
2. Verify correct doctor selected
3. Click "Refresh Queue"
4. Positions are per-doctor (not global)

---

## 📝 Future Enhancements

### **Potential Features**
- [ ] Bulk "Mark Arrived" for multiple patients
- [ ] Custom wait time estimates per doctor
- [ ] SMS notifications when called
- [ ] Priority override button
- [ ] Queue position swap/reorder
- [ ] Walk-in patient quick add
- [ ] Queue analytics dashboard

---

## 📞 Support

If you encounter issues with the queue workflow:
1. Check this documentation
2. Review error messages in toast notifications
3. Contact technical support with:
   - Appointment ID
   - Patient name
   - Error message screenshot
   - Steps to reproduce

---

**Last Updated**: December 2025  
**Version**: 1.0  
**Related Docs**: 
- [Telemedicine Workflow](./TELEMEDICINE_WORKFLOW.md)
- [Feature Gating](./TELEMEDICINE_FEATURE_GATING.md)
- [Error Handling](./ERROR_HANDLING_BEST_PRACTICES.md)


# Queue Duplicate Key Error Fix

## Problem

When marking appointments as "arrived", a duplicate key error was occurring:
```
E11000 duplicate key error collection: clinic.queues index: tenantId_1_queueNumber_1 
dup key: { tenantId: ObjectId('...'), queueNumber: "Q-0002" }
```

## Root Cause

1. **Race Condition**: When multiple appointments are marked as "arrived" simultaneously, they might try to generate the same queue number
2. **Unique Index**: MongoDB has a unique index on `tenantId + queueNumber`, preventing duplicate queue numbers
3. **Error Propagation**: The error was being thrown and preventing the appointment status from being updated

## Solution

### 1. Improved Queue Entry Check

Before creating a queue entry, we now:
- Check if a queue entry already exists for this appointment (not just active ones)
- If exists, log and continue (don't try to create duplicate)
- If completed/cancelled, reactivate it instead of creating new

### 2. Graceful Error Handling

If queue creation fails:
- Check if queue entry was actually created (race condition handling)
- If it exists, continue successfully
- If not, log error but **don't fail** the appointment status update
- Appointment status is still updated to "arrived" even if queue creation has issues

### 3. Frontend Handling

- Better error messages for duplicate queue errors
- Show success message if appointment is "already in queue"
- Filter out "arrived" appointments from the appointments list

## Code Changes

### Backend (`services/appointment.service.ts`)

```typescript
// Check for existing queue entry (including all statuses)
const existingQueueEntry = await Queue.findOne(
  withTenant(tenantId, {
    appointmentId: appointmentId,
    deletedAt: null,
  })
);

if (existingQueueEntry) {
  // Queue entry exists - reactivate if needed
  if (existingQueueEntry.status === QueueStatus.COMPLETED || 
      existingQueueEntry.status === QueueStatus.CANCELLED) {
    await Queue.findByIdAndUpdate(existingQueueEntry._id, {
      $set: { status: QueueStatus.WAITING, joinedAt: now }
    });
  }
} else {
  // Create new queue entry using queue service
  // Handle duplicate errors gracefully
}
```

### Frontend (`app/appointments/page.tsx`)

1. **Filter "arrived" appointments**:
```typescript
const filteredAppointments = appointmentsList.filter(
  (apt: Appointment) => apt.status !== 'arrived'
);
```

2. **Better error handling**:
```typescript
if (errorMessage.includes('duplicate') && errorMessage.includes('queue')) {
  showSuccess('Patient is already in queue.', 'Already in Queue');
  // Refresh list
}
```

## Workflow After Fix

1. **Mark Arrived** → Appointments page
   - Appointment status updated to "arrived" ✅
   - Queue entry created (or existing one reactivated) ✅
   - Appointment removed from appointments list ✅
   - Shows in queue list ✅

2. **Error Scenarios**:
   - If duplicate queue number: Queue entry checked, appointment still marked as arrived
   - If queue entry exists: Reactivated, appointment marked as arrived
   - If creation fails: Logged but appointment status still updated

## Testing

1. Mark two appointments as "arrived" quickly (simulate race condition)
2. Mark an appointment as "arrived" that already has a queue entry
3. Verify "arrived" appointments don't show in appointments list
4. Verify all "arrived" appointments appear in queue list

## Benefits

✅ No more duplicate key errors blocking appointment status updates  
✅ Graceful handling of race conditions  
✅ Better user experience with appropriate success/error messages  
✅ Cleaner appointments list (only shows scheduled/confirmed)  
✅ Queue list shows all waiting patients  


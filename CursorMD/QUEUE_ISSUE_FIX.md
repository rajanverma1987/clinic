# Queue Issue Fix - Mark Arrived Appointments Not Showing in Queue

## Problem
When appointments are marked as "Arrived", they should automatically be added to the queue, but some appointments are missing queue entries.

## Root Causes Found

1. **Appointment Status Conflict**: When creating a queue entry from an ARRIVED appointment, the queue service was trying to change the appointment status to IN_QUEUE, causing conflicts.

2. **Queue Number Generation Race Condition**: The queue number generation had a race condition where concurrent requests could generate the same queue number, causing duplicate key errors.

3. **Silent Failures**: Errors in queue creation were being caught and logged but not surfaced to the user, so appointments were marked as ARRIVED but queue entries weren't created.

## Fixes Applied

### 1. Fixed Queue Service (`services/queue.service.ts`)
- **Updated appointment status handling**: Now checks if appointment is already ARRIVED or IN_PROGRESS before changing status to IN_QUEUE
- **Improved queue number generation**: Now finds the next available queue number by checking all existing numbers, handling gaps properly

### 2. Fixed TypeScript Errors (`app/appointments/page.tsx`)
- Fixed `showSuccess` function calls - removed incorrect second parameter (title) which should be duration (number) only

### 3. Improved Error Handling
- Better error logging in queue creation
- Queue creation errors don't prevent appointment status from being updated (but errors are logged)

## Missing Queue Entries

Found 2 appointments marked as ARRIVED but missing queue entries:
- Appointment ID: `69313fcf3aa5dfa27ad677ea`
- Appointment ID: `693140293aa5dfa27ad678f8`

Both are assigned to doctor: `692f14a0527d334f41042dc0`

## Next Steps

1. Test the fixes by marking a new appointment as "Arrived"
2. Manually create queue entries for the 2 missing appointments
3. Monitor logs to ensure queue creation succeeds

## Scripts Created

- `scripts/debug-queue-issue.js` - Debug script to find missing queue entries
- `scripts/fix-missing-queue-entries.js` - Script to manually fix missing entries


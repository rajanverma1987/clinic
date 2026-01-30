/**
 * Available Appointment Slots API Route
 * Get available time slots for a doctor on a specific date
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Doctor from '@/models/Doctor';
import Appointment from '@/models/Appointment';
import { logger } from '@/lib/utils/logger.js';

/**
 * GET /api/appointments/slots
 * Get available appointment slots for a doctor
 */
async function getHandler(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get('doctorId');
  const date = searchParams.get('date');

  if (!doctorId || !date) {
    return NextResponse.json(
      errorResponse('doctorId and date are required', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  try {
    // Get doctor schedule
    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      return NextResponse.json(errorResponse('Doctor not found', 'NOT_FOUND'), { status: 404 });
    }

    // Get appointments for the date
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctorId,
      startTime: {
        $gte: dateStart,
        $lte: dateEnd,
      },
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
      deletedAt: null,
    }).lean();

    // Get doctor's schedule for the day
    const dayOfWeek = dateStart.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const schedule = doctor.schedule?.slots?.find((slot) => slot.day === dayOfWeek);

    // Default working hours if no schedule
    const defaultStart = '09:00';
    const defaultEnd = '17:00';
    const slotDuration = doctor.schedule?.slotDuration || 30; // minutes
    const bufferTime = doctor.schedule?.bufferTime || 0; // minutes

    const startTime = schedule?.startTime || defaultStart;
    const endTime = schedule?.endTime || defaultEnd;

    // Generate time slots
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const slotTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      // Check if slot is booked
      const isBooked = appointments.some((apt) => {
        const aptTime = new Date(apt.startTime);
        const aptHour = aptTime.getHours();
        const aptMin = aptTime.getMinutes();
        return aptHour === currentHour && aptMin === currentMin;
      });

      if (!isBooked) {
        slots.push(slotTime);
      }

      // Move to next slot
      currentMin += slotDuration + bufferTime;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    return NextResponse.json(
      successResponse({
        slots,
        date,
        doctorId,
        slotDuration,
        bufferTime,
      })
    );
  } catch (err) {
    logger.error('Failed to fetch appointment slots:', err);
    return NextResponse.json(errorResponse('Failed to fetch slots', 'FETCH_ERROR'), {
      status: 500,
    });
  }
}

// Apply middleware (public endpoint)
export const GET = withErrorHandler(apiRateLimit(getHandler));

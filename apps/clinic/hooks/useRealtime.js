/**
 * useRealtime Hook
 * React hook for real-time updates (appointments, queue, etc.)
 * Separate from telemedicine Socket.IO
 */

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useRealtime(options = {}) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?.tenantId) return;

    // Connect to real-time namespace (must match server io.of('/realtime'))
    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    const origin =
      typeof baseUrl === 'string' && baseUrl.includes('://') ? new URL(baseUrl).origin : baseUrl;
    const socket = io(`${origin}/realtime`, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);

      // Join tenant room
      if (user.tenantId) {
        socket.emit('join-tenant', user.tenantId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen to real-time events
    socket.on('appointment.created', (data) => {
      setEvents((prev) => [...prev, { type: 'appointment.created', ...data }]);
      options.onAppointmentCreated?.(data);
    });

    socket.on('appointment.statusChanged', (data) => {
      setEvents((prev) => [...prev, { type: 'appointment.statusChanged', ...data }]);
      options.onAppointmentStatusChanged?.(data);
    });

    socket.on('queue.updated', (data) => {
      setEvents((prev) => [...prev, { type: 'queue.updated', ...data }]);
      options.onQueueUpdated?.(data);
    });

    socket.on('patient.checkedIn', (data) => {
      setEvents((prev) => [...prev, { type: 'patient.checkedIn', ...data }]);
      options.onPatientCheckedIn?.(data);
    });

    socket.on('doctor.statusChanged', (data) => {
      setEvents((prev) => [...prev, { type: 'doctor.statusChanged', ...data }]);
      options.onDoctorStatusChanged?.(data);
    });

    socket.on('prescription.ready', (data) => {
      setEvents((prev) => [...prev, { type: 'prescription.ready', ...data }]);
      options.onPrescriptionReady?.(data);
    });

    socket.on('labResult.ready', (data) => {
      setEvents((prev) => [...prev, { type: 'labResult.ready', ...data }]);
      options.onLabResultReady?.(data);
    });

    socket.on('payment.received', (data) => {
      setEvents((prev) => [...prev, { type: 'payment.received', ...data }]);
      options.onPaymentReceived?.(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.tenantId]);

  const joinAppointment = (appointmentId) => {
    if (socketRef.current) {
      socketRef.current.emit('join-appointment', appointmentId);
    }
  };

  const joinQueue = (queueId) => {
    if (socketRef.current) {
      socketRef.current.emit('join-queue', queueId);
    }
  };

  const joinDoctor = (doctorId) => {
    if (socketRef.current) {
      socketRef.current.emit('join-doctor', doctorId);
    }
  };

  return {
    isConnected,
    events,
    joinAppointment,
    joinQueue,
    joinDoctor,
  };
}

export default useRealtime;

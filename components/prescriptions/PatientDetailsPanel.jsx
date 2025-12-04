'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client.js';
import { Card } from '@/components/ui/Card.jsx';

export function PatientDetailsPanel({ patientId }) {
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    } else {
      setPatient(null);
      setAppointments([]);
      setPrescriptions([]);
      setLoading(false);
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const [patientRes, appointmentsRes, prescriptionsRes] = await Promise.all([
        apiClient.get(`/patients/${patientId}`),
        apiClient.get(`/appointments?patientId=${patientId}&limit=10`),
        apiClient.get(`/prescriptions?patientId=${patientId}&limit=10`),
      ]);

      if (patientRes.success && patientRes.data) {
        setPatient(patientRes.data);
      }

      if (appointmentsRes.success && appointmentsRes.data) {
        const apts = Array.isArray(appointmentsRes.data) 
          ? appointmentsRes.data 
          : appointmentsRes.data?.data || [];
        setAppointments(apts);
      }

      if (prescriptionsRes.success && prescriptionsRes.data) {
        const pres = Array.isArray(prescriptionsRes.data)
          ? prescriptionsRes.data
          : prescriptionsRes.data?.data || [];
        setPrescriptions(pres);
      }
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!patientId) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500 text-center">Select a patient to view details</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-sm text-gray-500">Loading patient details...</div>
      </Card>
    );
  }

  if (!patient) {
    return (
      <Card className="p-4">
        <p className="text-sm text-red-500">Failed to load patient details</p>
      </Card>
    );
  }

  const calculateAge = (dateOfBirth) => {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Card className="p-4">
      {/* Tabs */}
      <div className="flex space-x-2 mb-4 border-b">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-3 py-2 text-sm font-medium ${
            activeTab === 'details'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-2 text-sm font-medium ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={`px-3 py-2 text-sm font-medium ${
            activeTab === 'visits'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Visits ({appointments.length})
        </button>
      </div>

      {/* Patient Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-3 text-sm">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {patient.firstName} {patient.lastName}
            </h3>
            <div className="space-y-1 text-gray-600">
              <p><span className="font-medium">ID:</span> {patient.patientId}</p>
              <p><span className="font-medium">Age:</span> {calculateAge(patient.dateOfBirth)} years</p>
              <p><span className="font-medium">Gender:</span> {patient.gender}</p>
              {patient.bloodGroup && (
                <p><span className="font-medium">Blood Group:</span> {patient.bloodGroup}</p>
              )}
              <p><span className="font-medium">Phone:</span> {patient.phone}</p>
              {patient.email && (
                <p><span className="font-medium">Email:</span> {patient.email}</p>
              )}
              {patient.address && (
                <p className="text-xs">
                  {patient.address.city && patient.address.state 
                    ? `${patient.address.city}, ${patient.address.state}`
                    : patient.address.country || ''
                  }
                </p>
              )}
            </div>
          </div>

          {patient.allergies && (
            <div className="pt-2 border-t">
              <p className="font-medium text-red-700 mb-1">Allergies:</p>
              <p className="text-xs text-gray-600">{patient.allergies}</p>
            </div>
          )}

          {patient.currentMedications && (
            <div className="pt-2 border-t">
              <p className="font-medium text-gray-900 mb-1">Current Medications:</p>
              <p className="text-xs text-gray-600">{patient.currentMedications}</p>
            </div>
          )}
        </div>
      )}

      {/* Medical History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3 text-sm">
          {patient.medicalHistory ? (
            <div>
              <p className="font-medium text-gray-900 mb-2">Medical History:</p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{patient.medicalHistory}</p>
            </div>
          ) : (
            <p className="text-gray-500 text-center">No medical history recorded</p>
          )}

          {prescriptions.length > 0 && (
            <div className="pt-3 border-t">
              <p className="font-medium text-gray-900 mb-2">Recent Prescriptions:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {prescriptions.map((pres) => (
                  <div key={pres._id} className="p-2 bg-gray-50 rounded text-xs">
                    <p className="font-medium">{pres.prescriptionNumber}</p>
                    <p className="text-gray-600">
                      {new Date(pres.createdAt).toLocaleDateString()} - {pres.status}
                    </p>
                    <p className="text-gray-500">{pres.items?.length || 0} items</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visits Tab */}
      {activeTab === 'visits' && (
        <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
          {appointments.length > 0 ? (
            appointments.map((apt) => (
              <div key={apt._id} className="p-2 bg-gray-50 rounded border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(apt.appointmentDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-600">{apt.type}</p>
                    {apt.reason && (
                      <p className="text-xs text-gray-500 mt-1">{apt.reason}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                    apt.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">No previous visits</p>
          )}
        </div>
      )}
    </Card>
  );
}


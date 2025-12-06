'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';

export default function SessionSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id;
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await apiClient.get(`/telemedicine/sessions/${sessionId}`);
      if (response.success && response.data) {
        setSession(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <Card>
          <div className="p-8 text-center">
            <p className="text-gray-600">Session not found</p>
            <Button onClick={() => router.push('/telemedicine')} className="mt-4">
              Back to Sessions
            </Button>
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.push('/telemedicine')} className="mb-4">
          ← Back to Sessions
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Consultation Summary</h1>
        <p className="text-gray-600 mt-2">Session {session.sessionId}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Summary */}
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-6">Session Details</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Patient</label>
                <p className="font-medium text-gray-900">
                  {session.patientId.firstName} {session.patientId.lastName}
                  <span className="text-gray-500 text-sm ml-2">({session.patientId.patientId})</span>
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Doctor</label>
                <p className="font-medium text-gray-900">
                  Dr. {session.doctorId.firstName} {session.doctorId.lastName}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Session Type</label>
                <Tag variant="default">{session.sessionType}</Tag>
              </div>

              <div>
                <label className="text-sm text-gray-600">Status</label>
                <Tag variant={session.status === 'COMPLETED' ? 'success' : 'default'}>
                  {session.status}
                </Tag>
              </div>

              <div>
                <label className="text-sm text-gray-600">Scheduled Time</label>
                <p className="font-medium text-gray-900">
                  {new Date(session.scheduledStartTime).toLocaleString()}
                </p>
              </div>

              {session.duration && (
                <div>
                  <label className="text-sm text-gray-600">Duration</label>
                  <p className="font-medium text-gray-900">{session.duration} minutes</p>
                </div>
              )}

              {session.connectionQuality && (
                <div>
                  <label className="text-sm text-gray-600">Connection Quality</label>
                  <Tag variant={session.connectionQuality === 'EXCELLENT' || session.connectionQuality === 'GOOD' ? 'success' : 'warning'}>
                    {session.connectionQuality}
                  </Tag>
                </div>
              )}
            </div>

            {session.notes && (
              <div className="pt-4 border-t">
                <label className="text-sm text-gray-600">Clinical Notes</label>
                <p className="mt-2 text-gray-900 whitespace-pre-wrap">{session.notes}</p>
              </div>
            )}

            {session.diagnosis && (
              <div className="pt-4 border-t">
                <label className="text-sm text-gray-600">Diagnosis</label>
                <p className="mt-2 text-gray-900">{session.diagnosis}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Chat History */}
        <Card>
          <h2 className="text-xl font-semibold mb-6">Chat History</h2>
          
          {session.chatMessages && session.chatMessages.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {session.chatMessages.map((msg, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-semibold text-gray-900">{msg.senderName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{msg.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No chat messages
            </p>
          )}
        </Card>
      </div>

      {/* Actions */}
      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Actions</h3>
            <p className="text-sm text-gray-600">Next steps for this consultation</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const patientId = session.patientId?._id || session.patientId;
                if (patientId) {
                  router.push(`/prescriptions/new?patientId=${patientId}`);
                } else {
                  router.push('/prescriptions/new');
                }
              }}
            >
              Create Prescription
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const patientId = session.patientId?._id || session.patientId;
                if (patientId) {
                  router.push(`/appointments/new?patientId=${patientId}`);
                } else {
                  router.push('/appointments/new');
                }
              }}
            >
              Schedule Follow-up
            </Button>
            <Button onClick={() => window.print()}>
              Print Summary
            </Button>
          </div>
        </div>
      </Card>
    </Layout>
  );
}


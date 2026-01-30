'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DoctorMessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState('inbox'); // inbox, sent, archive
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    message: '',
  });
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'doctor') {
      router.push('/dashboard');
      return;
    }
    fetchMessages();
    fetchPatients();
  }, [authLoading, user, router, activeFolder]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      // Fetch messages from Message model
      const response = await apiClient.get(`/messages?folder=${activeFolder}`);
      if (response.success) {
        setMessages(response.data || []);
      }
    } catch (err) {
      logger.error('Failed to fetch messages', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await apiClient.get('/patients?limit=100');
      if (response.success) {
        setPatients(response.data || []);
      }
    } catch (err) {
      logger.error('Failed to fetch patients', err);
    }
  };

  const handleSendMessage = async () => {
    if (!composeData.to || !composeData.message) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await apiClient.post('/messages', {
        to: composeData.to,
        subject: composeData.subject,
        message: composeData.message,
      });

      if (response.success) {
        alert('Message sent successfully');
        setComposeOpen(false);
        setComposeData({ to: '', subject: '', message: '' });
        fetchMessages();
      } else {
        alert('Failed to send message');
      }
    } catch (err) {
      logger.error('Failed to send message', err);
      alert('Failed to send message');
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      msg.subject?.toLowerCase().includes(query) ||
      msg.message?.toLowerCase().includes(query) ||
      msg.from?.toLowerCase().includes(query)
    );
  });

  if (authLoading || loading) {
    return (
      <Layout>
        <Loader fullScreen size='lg' />
      </Layout>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  return (
    <Layout>
      <div className='max-w-7xl mx-auto space-y-6'>
        <PageHeader title='Messages' subtitle='Communicate with patients and staff' />

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Sidebar */}
          <div className='lg:col-span-1 space-y-4'>
            <Card>
              <div className='p-4'>
                <Button
                  variant='primary'
                  className='w-full mb-4'
                  onClick={() => setComposeOpen(true)}
                >
                  Compose Message
                </Button>
                <div className='space-y-2'>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeFolder === 'inbox'
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                    onClick={() => setActiveFolder('inbox')}
                  >
                    Inbox
                    {messages.filter((m) => !m.read).length > 0 && (
                      <span className='ml-2 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full'>
                        {messages.filter((m) => !m.read).length}
                      </span>
                    )}
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeFolder === 'sent'
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                    onClick={() => setActiveFolder('sent')}
                  >
                    Sent
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeFolder === 'archive'
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                    onClick={() => setActiveFolder('archive')}
                  >
                    Archive
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Messages List */}
          <div className='lg:col-span-3'>
            <Card>
              <div className='p-4 border-b border-neutral-200'>
                <Input
                  type='text'
                  placeholder='Search messages...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className='divide-y divide-neutral-200'>
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((message) => (
                    <div
                      key={message._id}
                      className={`p-4 cursor-pointer hover:bg-neutral-50 transition-colors ${
                        !message.read ? 'bg-primary-50' : ''
                      }`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <span className='font-semibold text-neutral-900'>
                              {message.from || 'Unknown'}
                            </span>
                            {!message.read && (
                              <span className='w-2 h-2 bg-primary-600 rounded-full'></span>
                            )}
                          </div>
                          <p className='text-sm font-medium text-neutral-900 mb-1'>
                            {message.subject || 'No subject'}
                          </p>
                          <p className='text-sm text-neutral-600 line-clamp-2'>
                            {message.message || message.preview}
                          </p>
                        </div>
                        <span className='text-xs text-neutral-500 ml-4'>
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='p-12 text-center'>
                    <p className='text-neutral-500'>No messages in {activeFolder}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Compose Modal */}
        {composeOpen && (
          <div className='fixed inset-0 bg-neutral-500/30 backdrop-blur-sm flex items-center justify-center z-50'>
            <Card className='w-full max-w-2xl m-4'>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-xl font-bold text-neutral-900'>Compose Message</h2>
                  <button
                    onClick={() => setComposeOpen(false)}
                    className='text-neutral-500 hover:text-neutral-900'
                  >
                    ✕
                  </button>
                </div>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      To (Patient/Staff)
                    </label>
                    <select
                      className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                      value={composeData.to}
                      onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                    >
                      <option value=''>Select recipient</option>
                      {patients.map((patient) => (
                        <option key={patient._id} value={patient._id}>
                          {patient.firstName} {patient.lastName} - {patient.patientId}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      Subject
                    </label>
                    <Input
                      type='text'
                      value={composeData.subject}
                      onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                      placeholder='Enter subject'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-neutral-700 mb-2'>
                      Message
                    </label>
                    <textarea
                      className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                      rows={6}
                      value={composeData.message}
                      onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                      placeholder='Enter your message...'
                    />
                  </div>
                  <div className='flex justify-end gap-2'>
                    <Button variant='secondary' onClick={() => setComposeOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant='primary' onClick={handleSendMessage}>
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className='fixed inset-0 bg-neutral-500/30 backdrop-blur-sm flex items-center justify-center z-50'>
            <Card className='w-full max-w-2xl m-4'>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-xl font-bold text-neutral-900'>
                    {selectedMessage.subject || 'No Subject'}
                  </h2>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className='text-neutral-500 hover:text-neutral-900'
                  >
                    ✕
                  </button>
                </div>
                <div className='space-y-4'>
                  <div>
                    <p className='text-sm text-neutral-600'>From:</p>
                    <p className='font-medium text-neutral-900'>{selectedMessage.from}</p>
                  </div>
                  <div>
                    <p className='text-sm text-neutral-600'>Date:</p>
                    <p className='font-medium text-neutral-900'>
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-neutral-600 mb-2'>Message:</p>
                    <div className='p-4 bg-neutral-50 rounded-lg'>
                      <p className='text-neutral-900 whitespace-pre-wrap'>
                        {selectedMessage.message}
                      </p>
                    </div>
                  </div>
                  <div className='flex justify-end gap-2'>
                    <Button variant='secondary' onClick={() => setSelectedMessage(null)}>
                      Close
                    </Button>
                    <Button
                      variant='primary'
                      onClick={() => {
                        setComposeData({
                          to: selectedMessage.from,
                          subject: `Re: ${selectedMessage.subject}`,
                          message: '',
                        });
                        setSelectedMessage(null);
                        setComposeOpen(true);
                      }}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

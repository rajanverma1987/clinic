'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface RevenueReport {
  summary: {
    totalRevenue: number;
    totalPaid: number;
    totalPending: number;
    invoiceCount: number;
    paymentCount: number;
  };
  breakdown?: {
    paymentMethods: Record<string, number>;
    statuses: Record<string, number>;
  };
  timeSeries?: Array<{ period: string; total: number; count: number }>;
}

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'revenue' | 'patients' | 'appointments' | 'inventory'>(
    'revenue'
  );
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [patientReport, setPatientReport] = useState<any>(null);
  const [appointmentReport, setAppointmentReport] = useState<any>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (activeTab === 'revenue') {
        fetchRevenueReport();
      } else if (activeTab === 'patients') {
        fetchPatientReport();
      } else if (activeTab === 'appointments') {
        fetchAppointmentReport();
      } else if (activeTab === 'inventory') {
        fetchInventoryReport();
      }
    }
  }, [authLoading, user, startDate, endDate, activeTab]);

  const fetchRevenueReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        includeBreakdown: 'true',
        groupBy: 'day',
      });

      const response = await apiClient.get<RevenueReport>(`/reports/revenue?${params}`);
      if (response.success && response.data) {
        setRevenueReport(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch revenue report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        includeNewPatients: 'true',
        groupBy: 'day',
      });

      const response = await apiClient.get(`/reports/patients?${params}`);
      if (response.success && response.data) {
        setPatientReport(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch patient report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        groupBy: 'day',
        includeNoShows: 'true',
      });

      const response = await apiClient.get(`/reports/appointments?${params}`);
      if (response.success && response.data) {
        setAppointmentReport(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch appointment report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        includeLowStock: 'true',
        includeExpired: 'true',
      });

      const response = await apiClient.get(`/reports/inventory?${params}`);
      if (response.success && response.data) {
        setInventoryReport(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const exportCSV = async (reportType: string) => {
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        format: 'csv',
      });

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/reports/${reportType}?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('reports.title')}</h1>
        <p className="text-gray-600 mt-2">{t('reports.title')}</p>
      </div>

      <Card className="mb-6">
        <div className="flex gap-4 items-end">
          <Input
            label={t('reports.startDate')}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label={t('reports.endDate')}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button onClick={() => {
            if (activeTab === 'revenue') fetchRevenueReport();
            else if (activeTab === 'patients') fetchPatientReport();
            else if (activeTab === 'appointments') fetchAppointmentReport();
            else if (activeTab === 'inventory') fetchInventoryReport();
          }} isLoading={loading}>
            {t('reports.generateReport')}
          </Button>
        </div>
      </Card>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'revenue'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('reports.revenue')}
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'patients'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('reports.patients')}
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'appointments'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('reports.appointments')}
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'inventory'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('reports.inventory')}
        </button>
      </div>

      {activeTab === 'revenue' && revenueReport && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t('reports.revenueSummary')}</h2>
              <Button variant="outline" onClick={() => exportCSV('revenue')}>
                {t('reports.exportToCSV')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">{t('reports.totalRevenue')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(revenueReport.summary.totalRevenue)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">{t('reports.totalPaid')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(revenueReport.summary.totalPaid)}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">{t('reports.totalPending')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(revenueReport.summary.totalPending)}
                </p>
              </div>
            </div>
          </Card>

          {revenueReport.breakdown && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold mb-4">{t('reports.paymentMethods')}</h3>
                <div className="space-y-2">
                  {Object.entries(revenueReport.breakdown.paymentMethods).map(([method, amount]) => (
                    <div key={method} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{method}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold mb-4">{t('reports.invoiceStatus')}</h3>
                <div className="space-y-2">
                  {Object.entries(revenueReport.breakdown.statuses).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'patients' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t('reports.patientReports')}</h2>
              <Button variant="outline" onClick={() => exportCSV('patients')}>
                {t('reports.exportToCSV')}
              </Button>
            </div>
            {patientReport ? (
              <div className="space-y-6">
                {patientReport.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('reports.totalPatients')}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {patientReport.summary.totalPatients || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('reports.newPatients')}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {patientReport.summary.newPatients || 0}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('reports.activePatients')}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {patientReport.summary.activePatients || 0}
                      </p>
                    </div>
                  </div>
                )}
                {patientReport.breakdown && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {patientReport.breakdown.gender && (
                      <Card>
                        <h3 className="text-lg font-semibold mb-4">{t('reports.byGender')}</h3>
                        <div className="space-y-2">
                          {Object.entries(patientReport.breakdown.gender).map(([gender, count]: [string, any]) => (
                            <div key={gender} className="flex justify-between">
                              <span className="text-gray-600 capitalize">{gender}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                    {patientReport.breakdown.ageGroups && (
                      <Card>
                        <h3 className="text-lg font-semibold mb-4">By Age Group</h3>
                        <div className="space-y-2">
                          {Object.entries(patientReport.breakdown.ageGroups).map(([ageGroup, count]: [string, any]) => (
                            <div key={ageGroup} className="flex justify-between">
                              <span className="text-gray-600">{ageGroup}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                )}
                {patientReport.timeSeries && patientReport.timeSeries.length > 0 && (
                  <Card>
                    <h3 className="text-lg font-semibold mb-4">Patient Growth Over Time</h3>
                    <div className="space-y-2">
                      {patientReport.timeSeries.slice(-10).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-600">{new Date(item.period).toLocaleDateString()}</span>
                          <span className="font-medium">{item.count || 0} patients</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <p className="text-gray-600">No patient data available for the selected period</p>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t('reports.appointmentReports')}</h2>
              <Button variant="outline" onClick={() => exportCSV('appointments')}>
                {t('reports.exportToCSV')}
              </Button>
            </div>
            {appointmentReport ? (
              <div className="space-y-6">
                {appointmentReport.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('reports.totalAppointments')}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {appointmentReport.summary.totalAppointments || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('reports.completed')}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {appointmentReport.summary.completed || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Scheduled</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {appointmentReport.summary.scheduled || 0}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">No Shows</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {appointmentReport.summary.noShows || 0}
                      </p>
                    </div>
                  </div>
                )}
                {appointmentReport.breakdown && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {appointmentReport.breakdown.status && (
                      <Card>
                        <h3 className="text-lg font-semibold mb-4">By Status</h3>
                        <div className="space-y-2">
                          {Object.entries(appointmentReport.breakdown.status).map(([status, count]: [string, any]) => (
                            <div key={status} className="flex justify-between">
                              <span className="text-gray-600 capitalize">{status}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                    {appointmentReport.breakdown.type && (
                      <Card>
                        <h3 className="text-lg font-semibold mb-4">By Type</h3>
                        <div className="space-y-2">
                          {Object.entries(appointmentReport.breakdown.type).map(([type, count]: [string, any]) => (
                            <div key={type} className="flex justify-between">
                              <span className="text-gray-600 capitalize">{type}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                )}
                {appointmentReport.timeSeries && appointmentReport.timeSeries.length > 0 && (
                  <Card>
                    <h3 className="text-lg font-semibold mb-4">Appointments Over Time</h3>
                    <div className="space-y-2">
                      {appointmentReport.timeSeries.slice(-10).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-600">{new Date(item.period).toLocaleDateString()}</span>
                          <span className="font-medium">{item.count || 0} appointments</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <p className="text-gray-600">No appointment data available for the selected period</p>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t('reports.inventoryReports')}</h2>
              <Button variant="outline" onClick={() => exportCSV('inventory')}>
                {t('reports.exportToCSV')}
              </Button>
            </div>
            {inventoryReport ? (
              <div className="space-y-6">
                {inventoryReport.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('reports.totalItems')}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {inventoryReport.summary.totalItems || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('reports.lowStockItems')}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {inventoryReport.summary.lowStockItems || 0}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('reports.expiredItems')}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {inventoryReport.summary.expiredItems || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('reports.totalValue')}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(inventoryReport.summary.totalValue || 0)}
                      </p>
                    </div>
                  </div>
                )}
                {inventoryReport.breakdown && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {inventoryReport.breakdown.byType && (
                      <Card>
                        <h3 className="text-lg font-semibold mb-4">By Type</h3>
                        <div className="space-y-2">
                          {Object.entries(inventoryReport.breakdown.byType).map(([type, count]: [string, any]) => (
                            <div key={type} className="flex justify-between">
                              <span className="text-gray-600 capitalize">{type}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                    {inventoryReport.breakdown.byStatus && (
                      <Card>
                        <h3 className="text-lg font-semibold mb-4">By Status</h3>
                        <div className="space-y-2">
                          {Object.entries(inventoryReport.breakdown.byStatus).map(([status, count]: [string, any]) => (
                            <div key={status} className="flex justify-between">
                              <span className="text-gray-600 capitalize">{status}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                )}
                {inventoryReport.lowStockItems && inventoryReport.lowStockItems.length > 0 && (
                  <Card>
                    <h3 className="text-lg font-semibold mb-4">Low Stock Items</h3>
                    <div className="space-y-2">
                      {inventoryReport.lowStockItems.slice(0, 10).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="text-sm text-gray-600">
                            Stock: {item.availableQuantity} / Threshold: {item.lowStockThreshold}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <p className="text-gray-600">No inventory data available for the selected period</p>
            )}
          </Card>
        </div>
      )}
    </Layout>
  );
}


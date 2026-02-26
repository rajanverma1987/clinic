'use client';

import { PrinterIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ReportTabSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Tabs, getTabPanelId, getTabPanelLabelledBy } from '@/components/ui/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { canExportData, canViewRevenueAnalytics } from '@/lib/permissions/cursor-md-matrix';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { loadJsPDF } from '@/lib/utils/dynamic-imports';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

const REPORTS_AUTO_REFRESH_MS = 2 * 60 * 1000; // 2 minutes – silent refresh for current tab
const ALL_REPORTS_TAB_IDS = ['revenue', 'doctors', 'patients', 'appointments', 'inventory'];

// Revenue and doctors tabs restricted to roles with financial report access (doctor, admin, accountant)
function getVisibleTabIds(role) {
  return ALL_REPORTS_TAB_IDS.filter((id) => {
    if (id === 'revenue' || id === 'doctors') return canViewRevenueAnalytics(role);
    return true;
  });
}

export default function ReportsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { currency, locale, settings } = useSettings();
  const visibleTabIds = useMemo(() => getVisibleTabIds(user?.role), [user?.role]);
  const defaultTab = visibleTabIds[0] || 'patients';
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && visibleTabIds.includes(tabFromUrl) ? tabFromUrl : defaultTab,
  );
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [doctorReport, setDoctorReport] = useState(null);
  const [patientReport, setPatientReport] = useState(null);
  const [appointmentReport, setAppointmentReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [locations, setLocations] = useState([]);
  const [branchId, setBranchId] = useState('');
  const reportsRefreshIntervalRef = useRef(null);

  useEffect(() => {
    if (!user?.tenantId) return;
    let cancelled = false;
    apiClient
      .get('/locations')
      .then((res) => {
        if (!cancelled && res?.success && Array.isArray(res.data)) {
          setLocations(res.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.tenantId]);

  useEffect(() => {
    if (!authLoading && user) {
      if (activeTab === 'revenue') {
        fetchRevenueReport();
      } else if (activeTab === 'doctors') {
        fetchDoctorReport();
      } else if (activeTab === 'patients') {
        fetchPatientReport();
      } else if (activeTab === 'appointments') {
        fetchAppointmentReport();
      } else if (activeTab === 'inventory') {
        fetchInventoryReport();
      }
    }
  }, [authLoading, user, startDate, endDate, activeTab, branchId]);

  // Silent auto-refresh for current report tab (no loading flicker, no page reload)
  useEffect(() => {
    if (authLoading || !user) return;

    const runSilentRefresh = () => {
      if (document.hidden) return;
      if (activeTab === 'revenue') fetchRevenueReport(true);
      else if (activeTab === 'doctors') fetchDoctorReport(true);
      else if (activeTab === 'patients') fetchPatientReport(true);
      else if (activeTab === 'appointments') fetchAppointmentReport(true);
      else if (activeTab === 'inventory') fetchInventoryReport(true);
    };

    reportsRefreshIntervalRef.current = setInterval(runSilentRefresh, REPORTS_AUTO_REFRESH_MS);

    const handleVisibility = () => {
      if (document.hidden && reportsRefreshIntervalRef.current) {
        clearInterval(reportsRefreshIntervalRef.current);
        reportsRefreshIntervalRef.current = null;
      } else if (!document.hidden && !reportsRefreshIntervalRef.current) {
        runSilentRefresh();
        reportsRefreshIntervalRef.current = setInterval(runSilentRefresh, REPORTS_AUTO_REFRESH_MS);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (reportsRefreshIntervalRef.current) {
        clearInterval(reportsRefreshIntervalRef.current);
      }
    };
  }, [authLoading, user, activeTab]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && visibleTabIds.includes(t)) setActiveTab(t);
    else if (!visibleTabIds.includes(activeTab)) setActiveTab(defaultTab);
  }, [searchParams, visibleTabIds]);

  const [isPending, startTransition] = useTransition();

  const handleTabChange = (tabId) => {
    // Update UI immediately for instant feedback
    setReportError(null);
    setActiveTab(tabId);
    // Update URL in a non-blocking transition
    startTransition(() => {
      router.replace((pathname || '/reports') + '?tab=' + encodeURIComponent(tabId));
    });
  };

  const fetchRevenueReport = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setReportError(null);
    }
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        includeBreakdown: 'true',
        groupBy: 'day',
      });

      const response = await apiClient.get(`/reports/revenue?${params}`);
      if (response.success && response.data) {
        setRevenueReport(response.data);
      }
    } catch (error) {
      logger.error('Failed to fetch revenue report', error);
      if (!silent) {
        showError(error?.message || t('reports.fetchError'));
        setReportError(error?.message || t('reports.fetchError'));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchDoctorReport = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setReportError(null);
    }
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        groupBy: 'day',
      });

      const response = await apiClient.get(`/reports/doctors?${params}`);
      if (response.success && response.data) {
        setDoctorReport(response.data);
      }
    } catch (error) {
      logger.error('Failed to fetch doctor report', error);
      if (!silent) {
        showError(error?.message || t('reports.fetchError'));
        setReportError(error?.message || t('reports.fetchError'));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchPatientReport = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setReportError(null);
    }
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        includeNewPatients: 'true',
        groupBy: 'day',
      });
      if (branchId) params.set('branchId', branchId);

      const response = await apiClient.get(`/reports/patients?${params}`);
      if (response.success && response.data) {
        setPatientReport(response.data);
      }
    } catch (error) {
      logger.error('Failed to fetch patient report', error);
      if (!silent) {
        showError(error?.message || t('reports.fetchError'));
        setReportError(error?.message || t('reports.fetchError'));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchAppointmentReport = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setReportError(null);
    }
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        groupBy: 'day',
        includeNoShows: 'true',
      });
      if (branchId) params.set('branchId', branchId);

      const response = await apiClient.get(`/reports/appointments?${params}`);
      if (response.success && response.data) {
        setAppointmentReport(response.data);
      }
    } catch (error) {
      logger.error('Failed to fetch appointment report', error);
      if (!silent) {
        showError(error?.message || t('reports.fetchError'));
        setReportError(error?.message || t('reports.fetchError'));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchInventoryReport = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setReportError(null);
    }
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
      logger.error('Failed to fetch inventory report', error);
      if (!silent) {
        showError(error?.message || t('reports.fetchError'));
        setReportError(error?.message || t('reports.fetchError'));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount, currency, locale);
  };

  /** Load logo image as base64 for PDF (clinic logo or default). */
  const loadLogoAsBase64 = useCallback((logoUrl) => {
    return new Promise((resolve) => {
      const src = logoUrl || '/images/logoclinic.png';
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else resolve(null);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }, []);

  /** Fill PDF with header (logo + title), divider, and report content in table format. */
  const fillReportPdf = useCallback(
    (pdf, overrideData, logoBase64) => {
      const rev = overrideData && activeTab === 'revenue' ? overrideData : revenueReport;
      const doc = overrideData && activeTab === 'doctors' ? overrideData : doctorReport;
      const pat = overrideData && activeTab === 'patients' ? overrideData : patientReport;
      const apt = overrideData && activeTab === 'appointments' ? overrideData : appointmentReport;
      const inv = overrideData && activeTab === 'inventory' ? overrideData : inventoryReport;

      const dateRangeStr = `${startDate} to ${endDate}`;
      const generatedStr = new Date().toLocaleString(locale || 'en-US');
      const margin = 14;
      const pageWidth = 210;
      const contentWidth = pageWidth - margin * 2;
      let y = 10;
      const rowHeight = 8;
      const cellPadding = 2;

      const drawLine = () => {
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.3);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 6;
      };

      // Header: logo + report title
      if (logoBase64) {
        try {
          pdf.addImage(logoBase64, 'PNG', margin, 8, 36, 12);
        } catch {
          // ignore if image fails
        }
        y = 24;
      } else {
        y = 12;
      }

      let title = t('reports.title');
      if (activeTab === 'revenue') title = t('reports.revenue');
      else if (activeTab === 'doctors')
        title = t('reports.doctorPerformance') || 'Doctor Performance';
      else if (activeTab === 'patients') title = t('reports.patients');
      else if (activeTab === 'appointments') title = t('reports.appointments');
      else if (activeTab === 'inventory') title = t('reports.inventory');

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, logoBase64 ? 54 : margin, y);
      pdf.setFont('helvetica', 'normal');
      y += 6;
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(
        `${t('reports.dateRange') || 'Date range'}: ${dateRangeStr}  |  ${t('reports.generated') || 'Generated'}: ${generatedStr}`,
        margin,
        y,
      );
      pdf.setTextColor(0, 0, 0);
      y += 8;
      drawLine();

      // Helper: draw a 2-column summary table (label | value)
      const drawSummaryTable = (rows) => {
        const col1 = margin + cellPadding;
        const col2 = margin + contentWidth * 0.55;
        const tableTop = y;
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, tableTop, contentWidth, rowHeight, 'F');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t('reports.metric') || 'Metric', col1, tableTop + 5.5);
        pdf.text(t('reports.value') || 'Value', col2, tableTop + 5.5);
        pdf.setFont('helvetica', 'normal');
        y = tableTop + rowHeight;
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.1);
        rows.forEach(([label, value]) => {
          pdf.line(margin, y, pageWidth - margin, y);
          pdf.text(String(label), col1, y + 5.5);
          pdf.text(String(value), col2, y + 5.5);
          y += rowHeight;
        });
        pdf.line(margin, y, pageWidth - margin, y);
        y += 10;
      };

      if (activeTab === 'revenue' && rev?.summary) {
        drawSummaryTable([
          [t('reports.totalRevenue'), formatCurrency(rev.summary.totalRevenue || 0)],
          [t('reports.totalPaid'), formatCurrency(rev.summary.totalPaid || 0)],
          [t('reports.totalPending'), formatCurrency(rev.summary.totalPending || 0)],
          [t('reports.invoices'), String(rev.summary.invoiceCount || 0)],
        ]);
      } else if (activeTab === 'doctors' && doc?.summary) {
        drawSummaryTable([
          [t('reports.totalAppointments'), String(doc.summary.totalAppointments || 0)],
          [t('reports.totalRevenue'), formatCurrency(doc.summary.totalRevenue || 0)],
          [t('reports.completionRate'), `${Math.round(doc.summary.averageCompletionRate || 0)}%`],
          [t('reports.totalDoctors') || 'Total Doctors', String(doc.summary.totalDoctors || 0)],
        ]);
        if (doc.doctors?.length) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(t('reports.doctorPerformance') || 'Doctor Performance', margin, y);
          y += 8;
          const colW = [55, 22, 22, 20, 22, 35];
          const cols = [
            margin + cellPadding,
            margin + colW[0],
            margin + colW[0] + colW[1],
            margin + colW[0] + colW[1] + colW[2],
            margin + colW[0] + colW[1] + colW[2] + colW[3],
            margin + colW[0] + colW[1] + colW[2] + colW[3] + colW[4],
          ];
          const headers = [
            t('staff.fullName') || 'Doctor',
            t('reports.totalAppointments'),
            t('reports.completed'),
            t('reports.noShows'),
            t('reports.completionRate'),
            t('reports.totalRevenue'),
          ];
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, y, contentWidth, rowHeight, 'F');
          pdf.setFont('helvetica', 'bold');
          headers.forEach((h, i) => pdf.text(h, cols[i] + 1, y + 5.5));
          pdf.setFont('helvetica', 'normal');
          y += rowHeight;
          pdf.setDrawColor(220, 220, 220);
          doc.doctors.forEach((r) => {
            if (y > 275) return;
            pdf.line(margin, y, pageWidth - margin, y);
            const doctorName =
              (r.doctorName || '—').length > 20
                ? (r.doctorName || '—').slice(0, 18) + '…'
                : r.doctorName || '—';
            pdf.text(doctorName, cols[0] + 1, y + 5.5);
            pdf.text(String(r.totalAppointments ?? 0), cols[1] + 1, y + 5.5);
            pdf.text(String(r.completed ?? 0), cols[2] + 1, y + 5.5);
            pdf.text(String(r.noShows ?? 0), cols[3] + 1, y + 5.5);
            pdf.text(`${r.completionRate ?? 0}%`, cols[4] + 1, y + 5.5);
            pdf.text(formatCurrency(r.totalRevenue || 0), cols[5] + 1, y + 5.5);
            y += rowHeight;
          });
          pdf.line(margin, y, pageWidth - margin, y);
          y += 8;
        }
      } else if (activeTab === 'patients' && pat?.summary) {
        drawSummaryTable([
          [t('reports.totalPatients'), String(pat.summary.totalPatients || 0)],
          [t('reports.newPatients'), String(pat.summary.newPatients || 0)],
          [t('reports.activePatients'), String(pat.summary.activePatients || 0)],
        ]);
      } else if (activeTab === 'appointments' && apt?.summary) {
        drawSummaryTable([
          [t('reports.totalAppointments'), String(apt.summary.totalAppointments || 0)],
          [t('reports.completed'), String(apt.summary.completed || 0)],
          [t('appointments.scheduled'), String(apt.summary.scheduled || 0)],
          [t('reports.noShows'), String(apt.summary.noShows || 0)],
        ]);
      } else if (activeTab === 'inventory' && inv?.summary) {
        drawSummaryTable([
          [t('reports.totalItems'), String(inv.summary.totalItems || 0)],
          [t('reports.lowStockItems'), String(inv.summary.lowStockCount || 0)],
          [t('reports.expiredItems'), String(inv.summary.expiredCount || 0)],
          [t('reports.totalValue'), formatCurrency(inv.summary.totalValue || 0)],
        ]);
      } else {
        pdf.setFontSize(10);
        pdf.text(
          t('reports.noData') ||
            'No report data available. Select a date range and generate the report.',
          margin,
          y,
        );
      }
    },
    [
      activeTab,
      startDate,
      endDate,
      revenueReport,
      doctorReport,
      patientReport,
      appointmentReport,
      inventoryReport,
      formatCurrency,
      t,
      locale,
    ],
  );

  const handleGenerateReportPDF = useCallback(async () => {
    const getReportData = async () => {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        ...(activeTab === 'revenue' && { includeBreakdown: 'true', groupBy: 'day' }),
        ...(activeTab === 'patients' && { includeNewPatients: 'true', groupBy: 'day' }),
        ...(activeTab === 'appointments' && { groupBy: 'day', includeNoShows: 'true' }),
        ...(activeTab === 'inventory' && { includeLowStock: 'true', includeExpired: 'true' }),
        ...(activeTab === 'doctors' && { groupBy: 'day' }),
      });
      if (branchId && (activeTab === 'patients' || activeTab === 'appointments')) {
        params.set('branchId', branchId);
      }
      const url = `/reports/${activeTab}?${params}`;
      const response = await apiClient.get(url);
      if (response?.success && response?.data) {
        if (activeTab === 'revenue') setRevenueReport(response.data);
        else if (activeTab === 'doctors') setDoctorReport(response.data);
        else if (activeTab === 'patients') setPatientReport(response.data);
        else if (activeTab === 'appointments') setAppointmentReport(response.data);
        else if (activeTab === 'inventory') setInventoryReport(response.data);
        return response.data;
      }
      return null;
    };
    setGeneratingPdf(true);
    setReportError(null);
    try {
      const data = await getReportData();
      const logoUrl = settings?.settings?.logo || null;
      const logoBase64 = await loadLogoAsBase64(logoUrl);
      const JsPDF = await loadJsPDF();
      const pdf = new JsPDF('p', 'mm', 'a4');
      fillReportPdf(pdf, data !== null ? data : undefined, logoBase64);
      const name = `report-${activeTab}-${startDate}-to-${endDate}.pdf`;
      pdf.save(name);
      showSuccess(t('reports.pdfDownloaded') || 'Report downloaded as PDF');
    } catch (err) {
      logger.error('Failed to generate report PDF', err);
      showError(err?.message || t('reports.fetchError'));
    } finally {
      setGeneratingPdf(false);
    }
  }, [activeTab, startDate, endDate, branchId, fillReportPdf, loadLogoAsBase64, settings, t]);

  const exportCSV = async (reportType) => {
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        format: 'csv',
      });
      if (branchId && (reportType === 'patients' || reportType === 'appointments')) {
        params.set('branchId', branchId);
      }

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
      logger.error('Failed to export CSV', error);
    }
  };

  /** Resolve display date from chart item: supports period, date (reports), or key "YYYY-MM" (admin). */
  const getChartItemDate = (item) => {
    if (item.period) return new Date(item.period);
    if (item.date) return new Date(item.date);
    if (item.key && /^\d{4}-\d{2}$/.test(String(item.key)))
      return new Date(String(item.key) + '-01');
    return new Date(0);
  };

  // Helper function to render bar chart
  const renderBarChart = (data, maxValue, height = 200) => {
    if (!data || data.length === 0) return null;

    const chartData = data.slice(-14);
    const maxBarValue = Math.max(...chartData.map((d) => d.value || d.total || d.count || 0), 1);
    const chartHeight = height;

    return (
      <div className='relative'>
        {/* Y-axis labels */}
        <div className='flex items-end h-[220px] border-b border-l border-neutral-300 pl-8 pr-4 pb-8'>
          {/* Y-axis scale */}
          <div className='absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-neutral-500'>
            {[100, 75, 50, 25, 0].map((percent) => (
              <span key={percent} className='pr-2' style={{ marginRight: '100%' }}>
                {Math.round((maxBarValue * percent) / 100)}
              </span>
            ))}
          </div>

          {/* Bars */}
          <div className='flex-1 flex items-end justify-between gap-1.5'>
            {chartData.map((item, index) => {
              const value = item.value || item.total || item.count || 0;
              const percentage = (value / maxBarValue) * 100;
              const barHeight = (percentage / 100) * chartHeight;
              const date = getChartItemDate(item);

              return (
                <div key={index} className='flex-1 flex flex-col items-center group relative'>
                  {/* Bar */}
                  <div
                    className='w-full bg-primary-500 hover:bg-primary-600 rounded-t cursor-pointer'
                    style={{
                      height: `${Math.max(barHeight, value > 0 ? 2 : 0)}px`,
                      minHeight: value > 0 ? '2px' : '0',
                    }}
                    title={`${date.toLocaleDateString()}: ${value}`}
                  />

                  {/* Value label on hover */}
                  <div
                    className='absolute -top-8 left-1/2 opacity-0 group-hover:opacity-100 bg-neutral-200 text-neutral-900 border border-neutral-300 text-xs px-2 py-1 rounded whitespace-nowrap z-10'
                    style={{ marginLeft: '-50%' }}
                  >
                    {value}
                  </div>

                  {/* Date label */}
                  <span className='text-xs text-neutral-600 mt-2 text-center leading-tight'>
                    {item.label && chartData.length > 7
                      ? item.label
                      : chartData.length <= 7
                        ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        : date.toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Helper function to render pie chart
  const renderPieChart = (data, size = 200) => {
    if (!data || Object.keys(data).length === 0) return null;

    const entries = Object.entries(data);
    const total = entries.reduce(
      (sum, [, value]) => sum + (typeof value === 'number' ? value : 0),
      0,
    );
    if (total === 0) return null;

    const colors = [
      'var(--color-primary-900)',
      'var(--color-status-success)',
      'var(--color-status-warning)',
      'var(--color-status-error)',
      'var(--color-primary-300)',
      '#8B5CF6',
      '#06B6D4',
    ];
    let currentAngle = 0;

    return (
      <div className='flex items-center justify-center'>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {entries.map(([label, value], index) => {
            const percentage = (value / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            const startAngleRad = (startAngle - 90) * (Math.PI / 180);
            const endAngleRad = (endAngle - 90) * (Math.PI / 180);

            const x1 = size / 2 + (size / 2 - 20) * Math.cos(startAngleRad);
            const y1 = size / 2 + (size / 2 - 20) * Math.sin(startAngleRad);
            const x2 = size / 2 + (size / 2 - 20) * Math.cos(endAngleRad);
            const y2 = size / 2 + (size / 2 - 20) * Math.sin(endAngleRad);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = [
              `M ${size / 2} ${size / 2}`,
              `L ${x1} ${y1}`,
              `A ${size / 2 - 20} ${size / 2 - 20} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z',
            ].join(' ');

            currentAngle += angle;

            return (
              <path
                key={label}
                d={pathData}
                fill={colors[index % colors.length]}
                stroke='white'
                strokeWidth='2'
                className='hover:opacity-80'
              >
                <title>
                  {label}: {typeof value === 'number' ? formatCurrency(value) : value} (
                  {percentage.toFixed(1)}%)
                </title>
              </path>
            );
          })}
        </svg>
        <div className='ml-6 space-y-2'>
          {entries.map(([label, value], index) => {
            const percentage = ((typeof value === 'number' ? value : 0) / total) * 100;
            return (
              <div key={label} className='flex items-center gap-2'>
                <div
                  className='w-4 h-4 rounded'
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className='text-sm text-neutral-600 capitalize'>{label}</span>
                <span className='text-sm font-medium'>
                  {typeof value === 'number' ? formatCurrency(value) : value} (
                  {percentage.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Show empty state while redirecting
  if (!user) {
    return null;
  }

  return (
    <Layout>
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.description')}
        notifications={[]}
        unreadCount={0}
      />
      <div className='data-tabs-container w-full'>
        <div className='tab-content-wide-width data-tabs-content'>
          <div className='filter-row filter-row-items-end mb-4'>
            <div className='w-auto min-w-0'>
              <input
                type='date'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className='filter-input-date'
                aria-label={t('reports.startDate')}
                title={t('reports.startDate')}
              />
            </div>
            <div className='w-auto min-w-0'>
              <input
                type='date'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className='filter-input-date'
                aria-label={t('reports.endDate')}
                title={t('reports.endDate')}
              />
            </div>
            {(activeTab === 'patients' || activeTab === 'appointments') && locations.length > 0 && (
              <div className='w-auto min-w-0'>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className='filter-input-date'
                  aria-label={t('reports.branch') || 'Branch'}
                  title={t('reports.branch') || 'Branch'}
                >
                  <option value=''>{t('reports.allBranches') || 'All branches'}</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name || loc.code || loc._id}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button
              onClick={handleGenerateReportPDF}
              isLoading={loading || generatingPdf}
              disabled={generatingPdf}
              className='filter-button'
              title={t('reports.downloadPdfHint') || 'Generate and download report as PDF'}
            >
              {generatingPdf
                ? t('reports.generatingPdf') || 'Generating PDF…'
                : t('reports.generateReport')}
            </Button>
            <Button
              variant='secondary'
              size='md'
              onClick={() => window.print()}
              className='filter-button'
              aria-label={t('reports.print')}
            >
              <PrinterIcon className='icon icon-sm flex-shrink-0' aria-hidden />
              {t('reports.print') || 'Print'}
            </Button>
          </div>

          <Tabs
            tabs={[
              visibleTabIds.includes('revenue') && { id: 'revenue', label: t('reports.revenue') },
              visibleTabIds.includes('doctors') && {
                id: 'doctors',
                label: t('reports.doctorPerformance') || 'Doctor Performance',
              },
              { id: 'patients', label: t('reports.patients') },
              { id: 'appointments', label: t('reports.appointments') },
              { id: 'inventory', label: t('reports.inventory') },
            ].filter(Boolean)}
            activeTab={activeTab}
            onChange={handleTabChange}
            idPrefix='reports-tabs'
            ariaLabel={t('reports.title')}
          />

          <div
            role='tabpanel'
            id={getTabPanelId('reports-tabs', activeTab)}
            aria-labelledby={getTabPanelLabelledBy('reports-tabs', activeTab)}
            className='mt-3'
          >
            {activeTab === 'revenue' && revenueReport?.summary && (
              <div className='space-y-6'>
                {/* Summary Cards */}
                <div className='content-grid-4'>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalRevenue')}</p>
                      <p className='text-3xl font-bold text-primary-600'>
                        {formatCurrency(revenueReport.summary.totalRevenue || 0)}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>
                        {revenueReport.summary.invoiceCount || 0} {t('reports.invoices')}
                      </p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalPaid')}</p>
                      <p className='text-3xl font-bold text-secondary-600'>
                        {formatCurrency(revenueReport.summary.totalPaid || 0)}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>
                        {revenueReport.summary.paymentCount || 0} {t('reports.payments')}
                      </p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalPending')}</p>
                      <p className='text-3xl font-bold text-status-warning'>
                        {formatCurrency(revenueReport.summary.totalPending || 0)}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>{t('reports.outstanding')}</p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.averageInvoice')}</p>
                      <p className='text-3xl font-bold text-primary-700'>
                        {formatCurrency(
                          revenueReport.summary.invoiceCount > 0
                            ? (revenueReport.summary.totalRevenue || 0) /
                                revenueReport.summary.invoiceCount
                            : 0,
                        )}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>{t('reports.perInvoice')}</p>
                    </div>
                  </Card>
                </div>

                {/* Revenue Trend Chart */}
                {revenueReport?.timeSeries && revenueReport.timeSeries.length > 0 && (
                  <Card>
                    <div className='flex items-center justify-between mb-4'>
                      <h2 className='text-xl font-semibold'>{t('reports.revenueTrend')}</h2>
                      {canExportData(user?.role) && (
                        <Button variant='secondary' size='md' onClick={() => exportCSV('revenue')}>
                          {t('reports.exportToCSV')}
                        </Button>
                      )}
                    </div>
                    {renderBarChart(
                      revenueReport.timeSeries.map((item) => ({
                        period: item.period,
                        value: item.total,
                      })),
                    )}
                  </Card>
                )}

                {/* Breakdown Charts */}
                {revenueReport?.breakdown && (
                  <div className='content-grid-2 content-grid-gap-6'>
                    <Card>
                      <h3 className='text-lg font-semibold mb-4'>{t('reports.paymentMethods')}</h3>
                      {renderPieChart(revenueReport.breakdown.paymentMethods)}
                    </Card>

                    <Card>
                      <h3 className='text-lg font-semibold mb-4'>{t('reports.invoiceStatus')}</h3>
                      {renderPieChart(revenueReport.breakdown.statuses)}
                    </Card>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'doctors' && doctorReport?.summary && (
              <div className='space-y-6'>
                <div className='content-grid-4'>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>
                        {t('reports.totalAppointments')}
                      </p>
                      <p className='text-3xl font-bold text-primary-600'>
                        {doctorReport.summary.totalAppointments || 0}
                      </p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalRevenue')}</p>
                      <p className='text-3xl font-bold text-secondary-600'>
                        {formatCurrency(doctorReport.summary.totalRevenue || 0)}
                      </p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.completionRate')}</p>
                      <p className='text-3xl font-bold text-primary-700'>
                        {Math.round(doctorReport.summary.averageCompletionRate || 0)}%
                      </p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>
                        {t('reports.totalDoctors') || 'Total Doctors'}
                      </p>
                      <p className='text-3xl font-bold text-neutral-800'>
                        {doctorReport.summary.totalDoctors || 0}
                      </p>
                    </div>
                  </Card>
                </div>
                {doctorReport.doctors && doctorReport.doctors.length > 0 && (
                  <Card>
                    <div className='flex items-center justify-between mb-4'>
                      <h2 className='text-xl font-semibold'>
                        {t('reports.doctorPerformance') || 'Doctor Performance'}
                      </h2>
                      {canExportData(user?.role) && (
                        <Button variant='secondary' size='md' onClick={() => exportCSV('doctors')}>
                          {t('reports.exportToCSV')}
                        </Button>
                      )}
                    </div>
                    <Table
                      columns={[
                        { header: t('staff.fullName') || 'Doctor', accessor: 'doctorName' },
                        { header: t('reports.totalAppointments'), accessor: 'totalAppointments' },
                        { header: t('reports.completed'), accessor: 'completed' },
                        { header: t('reports.noShows'), accessor: 'noShows' },
                        {
                          header: t('reports.completionRate'),
                          accessor: (row) => `${row.completionRate}%`,
                        },
                        {
                          header: t('reports.totalRevenue'),
                          accessor: (row) => formatCurrency(row.totalRevenue),
                        },
                      ]}
                      data={doctorReport.doctors}
                    />
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'patients' && patientReport && (
              <div className='space-y-6'>
                {/* Summary Cards */}
                <div className='content-grid-3'>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalPatients')}</p>
                      <p className='text-3xl font-bold text-primary-600'>
                        {patientReport.summary.totalPatients || 0}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>{t('reports.allTime')}</p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.newPatients')}</p>
                      <p className='text-3xl font-bold text-secondary-600'>
                        {patientReport.summary.newPatients || 0}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>
                        {t('reports.inSelectedPeriod')}
                      </p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.activePatients')}</p>
                      <p className='text-3xl font-bold text-primary-700'>
                        {patientReport.summary.activePatients || 0}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>
                        {t('reports.withAppointments')}
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Patient Growth Chart */}
                {patientReport.monthlyTrend && patientReport.monthlyTrend.length > 0 && (
                  <Card>
                    <div className='flex items-center justify-between mb-4'>
                      <h2 className='text-xl font-semibold'>
                        {t('reports.patientGrowthOverTime')}
                      </h2>
                      {canExportData(user?.role) && (
                        <Button variant='secondary' size='md' onClick={() => exportCSV('patients')}>
                          {t('reports.exportToCSV')}
                        </Button>
                      )}
                    </div>
                    {renderBarChart(
                      patientReport.monthlyTrend.map((item) => ({
                        period: item.period,
                        value: item.count,
                      })),
                    )}
                  </Card>
                )}

                {/* Breakdown Charts */}
                {patientReport.breakdown && (
                  <div className='content-grid-2 content-grid-gap-6'>
                    {patientReport.breakdown.gender && (
                      <Card>
                        <h3 className='text-lg font-semibold mb-4'>{t('reports.byGender')}</h3>
                        {renderPieChart(patientReport.breakdown.gender)}
                      </Card>
                    )}
                    {patientReport.breakdown.ageGroups && (
                      <Card>
                        <h3 className='text-lg font-semibold mb-4'>{t('reports.byAgeGroup')}</h3>
                        {renderPieChart(patientReport.breakdown.ageGroups)}
                      </Card>
                    )}
                  </div>
                )}

                {/* Detailed Table */}
                {patientReport.breakdown && (
                  <Card>
                    <h3 className='text-lg font-semibold mb-4'>
                      {t('reports.patientDemographics')}
                    </h3>
                    <div className='content-grid-2 content-grid-gap-6'>
                      {patientReport.breakdown.bloodGroups &&
                        Object.keys(patientReport.breakdown.bloodGroups).length > 0 && (
                          <div>
                            <h4 className='font-medium mb-2'>{t('reports.bloodGroups')}</h4>
                            <div className='space-y-2'>
                              {Object.entries(patientReport.breakdown.bloodGroups).map(
                                ([group, count]) => (
                                  <div
                                    key={group}
                                    className='flex justify-between items-center p-2 bg-neutral-50 rounded'
                                  >
                                    <span className='text-neutral-700'>{group}</span>
                                    <span className='font-medium'>{count}</span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'appointments' && appointmentReport && (
              <div className='space-y-6'>
                {/* Summary Cards */}
                <div className='content-grid-4'>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>
                        {t('reports.totalAppointments')}
                      </p>
                      <p className='text-3xl font-bold text-primary-600'>
                        {appointmentReport.summary.totalAppointments || 0}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>{t('common.total')}</p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.completed')}</p>
                      <p className='text-3xl font-bold text-secondary-600'>
                        {appointmentReport.summary.completed || 0}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>
                        {appointmentReport.summary.totalAppointments > 0
                          ? Math.round(
                              (appointmentReport.summary.completed /
                                appointmentReport.summary.totalAppointments) *
                                100,
                            )
                          : 0}
                        % {t('reports.completionRate')}
                      </p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('appointments.scheduled')}</p>
                      <p className='text-3xl font-bold text-status-warning'>
                        {appointmentReport.summary.scheduled || 0}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>{t('reports.upcoming')}</p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.noShows')}</p>
                      <p className='text-3xl font-bold text-status-error'>
                        {appointmentReport.summary.noShows || 0}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>
                        {appointmentReport.summary.totalAppointments > 0
                          ? Math.round(
                              (appointmentReport.summary.noShows /
                                appointmentReport.summary.totalAppointments) *
                                100,
                            )
                          : 0}
                        % {t('reports.noShowRate')}
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Appointment Trend Chart */}
                {appointmentReport.timeSeries && appointmentReport.timeSeries.length > 0 && (
                  <Card>
                    <div className='flex items-center justify-between mb-4'>
                      <h2 className='text-xl font-semibold'>{t('reports.appointmentsOverTime')}</h2>
                      {canExportData(user?.role) && (
                        <Button
                          variant='secondary'
                          size='md'
                          onClick={() => exportCSV('appointments')}
                        >
                          {t('reports.exportToCSV')}
                        </Button>
                      )}
                    </div>
                    {renderBarChart(
                      appointmentReport.timeSeries.map((item) => ({
                        period: item.period,
                        value: item.count,
                      })),
                    )}
                  </Card>
                )}

                {/* Breakdown Charts */}
                {appointmentReport.breakdown && (
                  <div className='content-grid-2 content-grid-gap-6'>
                    {appointmentReport.breakdown.statuses && (
                      <Card>
                        <h3 className='text-lg font-semibold mb-4'>{t('reports.byStatus')}</h3>
                        {renderPieChart(appointmentReport.breakdown.statuses)}
                      </Card>
                    )}
                    {appointmentReport.breakdown.types && (
                      <Card>
                        <h3 className='text-lg font-semibold mb-4'>{t('reports.byType')}</h3>
                        {renderPieChart(appointmentReport.breakdown.types)}
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'inventory' && inventoryReport && (
              <div className='space-y-6'>
                {/* Summary Cards */}
                <div className='content-grid-4'>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalItems')}</p>
                      <p className='text-3xl font-bold text-primary-600'>
                        {inventoryReport.summary.totalItems || 0}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>{t('reports.activeItems')}</p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.lowStockItems')}</p>
                      <p className='text-3xl font-bold text-status-warning'>
                        {inventoryReport.summary.lowStockCount || 0}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>{t('reports.needReorder')}</p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.expiredItems')}</p>
                      <p className='text-3xl font-bold text-status-error'>
                        {inventoryReport.summary.expiredCount || 0}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>{t('reports.expiredBatches')}</p>
                    </div>
                  </Card>
                  <Card>
                    <div className='p-4'>
                      <p className='text-sm text-neutral-600 mb-1'>{t('reports.totalValue')}</p>
                      <p className='text-3xl font-bold text-secondary-600'>
                        {formatCurrency(inventoryReport.summary.totalValue || 0)}
                      </p>
                      <p className='text-xs text-neutral-500 mt-1'>{t('reports.inventoryValue')}</p>
                    </div>
                  </Card>
                </div>

                {/* Breakdown Charts */}
                {inventoryReport.breakdown && (
                  <div className='content-grid-2 content-grid-gap-6'>
                    {inventoryReport.breakdown.types && (
                      <Card>
                        <h3 className='text-lg font-semibold mb-4'>{t('reports.byType')}</h3>
                        {renderPieChart(inventoryReport.breakdown.types)}
                      </Card>
                    )}
                  </div>
                )}

                {/* Low Stock Items Table */}
                {inventoryReport.lowStockItems && inventoryReport.lowStockItems.length > 0 && (
                  <Card>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-semibold'>{t('reports.lowStockItems')}</h3>
                      {canExportData(user?.role) && (
                        <Button
                          variant='secondary'
                          size='md'
                          onClick={() => exportCSV('inventory')}
                        >
                          {t('reports.exportToCSV')}
                        </Button>
                      )}
                    </div>
                    <Table
                      columns={[
                        { header: t('inventory.itemName'), accessor: 'name' },
                        {
                          header: t('inventory.currentStock'),
                          accessor: (row) => row.currentStock || 0,
                        },
                        {
                          header: t('inventory.lowStockThreshold'),
                          accessor: (row) => row.threshold || 0,
                        },
                        {
                          header: t('common.status'),
                          accessor: (row) => {
                            const stock = row.currentStock || 0;
                            const threshold = row.threshold || 0;
                            if (stock === 0)
                              return (
                                <span className='text-status-error font-medium'>
                                  {t('inventory.outOfStock')}
                                </span>
                              );
                            if (stock <= threshold)
                              return (
                                <span className='text-status-warning font-medium'>
                                  {t('inventory.lowStock')}
                                </span>
                              );
                            return (
                              <span className='text-secondary-600 font-medium'>
                                {t('inventory.adequate')}
                              </span>
                            );
                          },
                        },
                      ]}
                      data={inventoryReport.lowStockItems}
                    />
                  </Card>
                )}

                {/* Expired Items Table */}
                {inventoryReport.expiredItems && inventoryReport.expiredItems.length > 0 && (
                  <Card>
                    <h3 className='text-lg font-semibold mb-4'>{t('reports.expiredItems')}</h3>
                    <Table
                      columns={[
                        { header: t('inventory.itemName'), accessor: 'itemName' },
                        { header: t('inventory.batchNumber'), accessor: 'batchNumber' },
                        {
                          header: t('inventory.expiryDate'),
                          accessor: (row) => new Date(row.expiryDate).toLocaleDateString(),
                        },
                        { header: t('inventory.quantity'), accessor: 'quantity' },
                      ]}
                      data={inventoryReport.expiredItems}
                    />
                  </Card>
                )}
              </div>
            )}

            {loading && (
              <div role='status' aria-label={t('reports.loadingReportData')}>
                <ReportTabSkeleton />
              </div>
            )}

            {!loading && reportError && activeTab === 'revenue' && !revenueReport && (
              <Card className='p-6'>
                <p className='text-status-error text-body-sm mb-3'>{reportError}</p>
                <Button
                  variant='secondary'
                  size='md'
                  onClick={() => {
                    setReportError(null);
                    fetchRevenueReport();
                  }}
                >
                  {t('common.retry')}
                </Button>
              </Card>
            )}

            {!loading && reportError && activeTab === 'patients' && !patientReport && (
              <Card className='p-6'>
                <p className='text-status-error text-body-sm mb-3'>{reportError}</p>
                <Button
                  variant='secondary'
                  size='md'
                  onClick={() => {
                    setReportError(null);
                    fetchPatientReport();
                  }}
                >
                  {t('common.retry')}
                </Button>
              </Card>
            )}

            {!loading && reportError && activeTab === 'appointments' && !appointmentReport && (
              <Card className='p-6'>
                <p className='text-status-error text-body-sm mb-3'>{reportError}</p>
                <Button
                  variant='secondary'
                  size='md'
                  onClick={() => {
                    setReportError(null);
                    fetchAppointmentReport();
                  }}
                >
                  {t('common.retry')}
                </Button>
              </Card>
            )}

            {!loading && reportError && activeTab === 'inventory' && !inventoryReport && (
              <Card className='p-6'>
                <p className='text-status-error text-body-sm mb-3'>{reportError}</p>
                <Button
                  variant='secondary'
                  size='md'
                  onClick={() => {
                    setReportError(null);
                    fetchInventoryReport();
                  }}
                >
                  {t('common.retry')}
                </Button>
              </Card>
            )}

            {!loading && reportError && activeTab === 'doctors' && !doctorReport && (
              <Card className='p-6'>
                <p className='text-status-error text-body-sm mb-3'>{reportError}</p>
                <Button
                  variant='secondary'
                  size='md'
                  onClick={() => {
                    setReportError(null);
                    fetchDoctorReport();
                  }}
                >
                  {t('common.retry')}
                </Button>
              </Card>
            )}

            {!loading && !reportError && activeTab === 'revenue' && !revenueReport && (
              <Card>
                <p className='text-neutral-600 text-center py-8'>{t('reports.noRevenueData')}</p>
              </Card>
            )}

            {!loading && !reportError && activeTab === 'patients' && !patientReport && (
              <Card>
                <p className='text-neutral-600 text-center py-8'>{t('reports.noPatientData')}</p>
              </Card>
            )}

            {!loading && !reportError && activeTab === 'appointments' && !appointmentReport && (
              <Card>
                <p className='text-neutral-600 text-center py-8'>
                  {t('reports.noAppointmentData')}
                </p>
              </Card>
            )}

            {!loading && !reportError && activeTab === 'inventory' && !inventoryReport && (
              <Card>
                <p className='text-neutral-600 text-center py-8'>{t('reports.noInventoryData')}</p>
              </Card>
            )}

            {!loading && !reportError && activeTab === 'doctors' && !doctorReport && (
              <Card>
                <p className='text-neutral-600 text-center py-8'>{t('reports.noDoctorData')}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

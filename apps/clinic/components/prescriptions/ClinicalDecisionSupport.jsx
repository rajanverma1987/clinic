'use client';

import { useI18n } from '@/contexts/I18nContext';
import { useMemo } from 'react';
import clinicalDecisionRules from '@/data/clinical-decision-rules.json';
import { Button } from '@/components/ui/Button';

/**
 * Phase 3.5: Clinical decision support – alerts (e.g. K+ with ACE inhibitors, preventive care)
 * with optional [Order test] / [Referral].
 */
export function ClinicalDecisionSupport({ items, onOrderTest, onReferral }) {
  const { t } = useI18n();

  const alerts = useMemo(() => {
    const drugNames = (items || [])
      .filter((i) => i.itemType === 'drug' && (i.drugName || i.genericName))
      .map((i) => `${(i.drugName || '').toLowerCase()} ${(i.genericName || '').toLowerCase()}`)
      .join(' ');
    if (!drugNames) return [];

    const matched = [];
    for (const rule of clinicalDecisionRules) {
      const triggerCount = rule.triggerKeywords.filter((kw) => drugNames.includes(kw.toLowerCase())).length;
      if (triggerCount >= 2) {
        matched.push({
          ...rule,
          message: t(rule.messageKey) || rule.messageKey,
        });
      }
    }
    return matched;
  }, [items, t]);

  if (alerts.length === 0) return null;

  return (
    <div className="prescription-form-section" style={{ paddingBottom: 'var(--space-4)' }}>
      <h3 className="text-body-md font-medium text-neutral-800 mb-2">
        {t('prescriptions.clinicalDecisionSupport')}
      </h3>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-lg border-l-4 px-4 py-3 flex flex-col gap-2 ${
            alert.severity === 'warning'
              ? 'bg-status-warning/10 border-status-warning text-status-warning'
              : 'bg-blue-50 border-blue-500 text-blue-800'
          }`}
        >
          <span>{alert.message}</span>
          <div className="flex flex-wrap gap-2">
            {alert.suggestTest && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onOrderTest?.(alert.suggestTest)}
              >
                {t('prescriptions.orderTest')} – {alert.suggestTest}
              </Button>
            )}
            {alert.suggestReferral && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onReferral?.(alert)}
              >
                {t('prescriptions.referral')}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

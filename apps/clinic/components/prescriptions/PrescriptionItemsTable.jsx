'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/contexts/I18nContext';
import { MedicineSearchInput } from './MedicineSearchInput';

export function PrescriptionItemsTable({
  items,
  drugs,
  labTests,
  onUpdate,
  onUpdateItem,
  onRemove,
  onAdd,
  fieldErrors = {},
}) {
  const { t } = useI18n();
  const getItemError = (index, field = '') => {
    const key = field ? `item_${index}_${field}` : `item_${index}`;
    return fieldErrors[key];
  };

  return (
    <div className='clinic-table-wrap'>
      <table className='clinic-table prescription-items-table'>
        <thead>
          <tr>
            <th className='prescription-items-col-index'>#</th>
            <th className='prescription-items-col-type'>Type</th>
            <th className='prescription-items-col-item'>Item *</th>
            <th className='prescription-items-col-frequency'>Frequency</th>
            <th className='prescription-items-col-duration'>Duration</th>
            <th className='prescription-items-col-qty'>Qty</th>
            <th className='prescription-items-col-route'>{t('prescriptions.route')}</th>
            <th className='prescription-items-col-refills'>{t('prescriptions.refills')}</th>
            <th className='prescription-items-col-instructions'>Instructions</th>
            <th className='prescription-items-col-actions'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const itemError = getItemError(index);
            const frequencyError = getItemError(index, 'frequency');
            const durationError = getItemError(index, 'duration');
            const quantityError = getItemError(index, 'quantity');

            return (
              <tr key={index}>
                <td className='prescription-items-col-index'>{index + 1}</td>
                <td className='prescription-items-col-type'>
                  <select
                    value={item.itemType || 'drug'}
                    onChange={(e) => {
                      const newType = e.target.value;

                      // Create a completely new item based on type
                      let newItem;

                      if (newType === 'drug') {
                        newItem = {
                          itemType: 'drug',
                          drugId: '',
                          drugName: '',
                          frequency: 'twice daily',
                          duration: 7,
                          quantity: 1,
                          unit: 'tablets',
                          instructions: item.instructions || '',
                          takeWithFood: false,
                          allowSubstitution: true,
                        };
                      } else if (newType === 'lab') {
                        newItem = {
                          itemType: 'lab',
                          labTestCode: '',
                          labTestName: '',
                          labInstructions: '',
                          fastingRequired: false,
                          instructions: item.instructions || '',
                        };
                      } else if (newType === 'procedure') {
                        newItem = {
                          itemType: 'procedure',
                          procedureName: '',
                          procedureCode: '',
                          procedureInstructions: '',
                          instructions: item.instructions || '',
                        };
                      } else {
                        newItem = {
                          itemType: 'other',
                          itemName: '',
                          itemDescription: '',
                          instructions: item.instructions || '',
                        };
                      }

                      // Use onUpdateItem if available to replace entire item, otherwise update itemType only
                      if (onUpdateItem) {
                        onUpdateItem(index, newItem);
                      } else {
                        // Fallback: just update the type for now
                        onUpdate(index, 'itemType', newType);
                      }
                    }}
                    className='prescription-form-input'
                  >
                    <option value='drug'>Drug</option>
                    <option value='lab'>Lab Test</option>
                    <option value='procedure'>Procedure</option>
                    <option value='other'>Other</option>
                  </select>
                </td>
                <td className='prescription-items-col-item'>
                  <div className='prescription-item-drug-cell'>
                    {item.itemType === 'drug' && (
                      <MedicineSearchInput
                        drugs={drugs}
                        value={item.drugId || ''}
                        onChange={(drugId) => {
                          const drug = drugs.find(
                            (d) => String(d._id).trim() === String(drugId).trim(),
                          );

                          // Use onUpdateItem to update all fields at once if available
                          if (onUpdateItem) {
                            const updatedItem = {
                              ...item,
                              drugId: drugId,
                              drugName: drug ? drug.name : '',
                              form: drug ? drug.form || '' : '',
                              strength: drug ? drug.strength || '' : '',
                            };
                            onUpdateItem(index, updatedItem);
                          } else {
                            // Fallback: update fields individually
                            onUpdate(index, 'drugId', drugId);
                            if (drug) {
                              onUpdate(index, 'drugName', drug.name);
                              onUpdate(index, 'form', drug.form || '');
                              onUpdate(index, 'strength', drug.strength || '');
                            }
                          }
                        }}
                        onSelect={(drug) => {
                          if (drug && onUpdateItem) {
                            const updatedItem = {
                              ...item,
                              drugId: drug._id,
                              drugName: drug.name,
                              form: drug.form || '',
                              strength: drug.strength || '',
                            };
                            onUpdateItem(index, updatedItem);
                          }
                        }}
                        placeholder={t('prescriptions.searchMedicine')}
                        className={`prescription-form-input ${
                          itemError ? 'border-status-error' : ''
                        }`}
                      />
                    )}
                    {item.itemType === 'lab' && (
                      <select
                        value={item.labTestCode || ''}
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          const test = labTests.find((lt) => lt.code === selectedValue);

                          // Use onUpdateItem to update all fields at once if available
                          if (onUpdateItem) {
                            const updatedItem = {
                              ...item,
                              labTestCode: selectedValue,
                              labTestName: test ? test.name : '',
                            };
                            onUpdateItem(index, updatedItem);
                          } else {
                            // Fallback: update fields individually
                            onUpdate(index, 'labTestCode', selectedValue);
                            if (test) {
                              onUpdate(index, 'labTestName', test.name);
                            }
                          }
                        }}
                        className={`prescription-form-input ${
                          itemError ? 'border-status-error' : ''
                        }`}
                        required
                      >
                        <option value=''>{t('prescriptions.selectLabTest')}</option>
                        {labTests.map((test) => (
                          <option key={test.code} value={test.code}>
                            {test.code} - {test.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {item.itemType === 'procedure' && (
                      <Input
                        value={item.procedureName || ''}
                        onChange={(e) => onUpdate(index, 'procedureName', e.target.value)}
                        placeholder={t('prescriptions.procedureName')}
                        className={itemError ? 'border-status-error' : ''}
                        required
                      />
                    )}
                    {item.itemType === 'other' && (
                      <Input
                        value={item.itemName || ''}
                        onChange={(e) => onUpdate(index, 'itemName', e.target.value)}
                        placeholder={t('prescriptions.itemName')}
                        className={itemError ? 'border-status-error' : ''}
                        required
                      />
                    )}
                    {itemError && <div className='prescription-form-error'>{itemError}</div>}
                  </div>
                </td>
                <td className='prescription-items-col-frequency'>
                  {item.itemType === 'drug' ? (
                    <div>
                      <select
                        value={item.frequency || 'twice daily'}
                        onChange={(e) => {
                          onUpdate(index, 'frequency', e.target.value);
                        }}
                        className={`prescription-form-input ${
                          frequencyError ? 'border-status-error' : ''
                        }`}
                        required
                      >
                        <option value='once daily'>Once Daily</option>
                        <option value='twice daily'>Twice Daily</option>
                        <option value='three times daily'>Three Times Daily</option>
                        <option value='four times daily'>Four Times Daily</option>
                        <option value='as needed'>As Needed</option>
                      </select>
                      {frequencyError && (
                        <div className='prescription-form-error'>{frequencyError}</div>
                      )}
                    </div>
                  ) : (
                    <span className='prescription-items-na' aria-hidden>
                      —
                    </span>
                  )}
                </td>
                <td className='prescription-items-col-duration'>
                  {item.itemType === 'drug' ? (
                    <div>
                      <div className='prescription-items-duration-wrap'>
                        <Input
                          type='number'
                          min='1'
                          value={item.duration || 7}
                          onChange={(e) =>
                            onUpdate(index, 'duration', parseInt(e.target.value) || 1)
                          }
                          className={`prescription-items-input-narrow ${
                            durationError ? 'border-status-error' : ''
                          }`}
                          required
                        />
                        <span className='prescription-items-duration-unit' aria-hidden>
                          {t('common.days')}
                        </span>
                      </div>
                      {durationError && (
                        <div className='prescription-form-error'>{durationError}</div>
                      )}
                    </div>
                  ) : (
                    <span className='prescription-items-na' aria-hidden>
                      —
                    </span>
                  )}
                </td>
                <td className='prescription-items-col-qty'>
                  {item.itemType === 'drug' ? (
                    <div>
                      <Input
                        type='number'
                        min='1'
                        value={item.quantity || 1}
                        onChange={(e) => onUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
                        className={`prescription-items-input-narrow ${
                          quantityError ? 'border-status-error' : ''
                        }`}
                        required
                      />
                      {quantityError && (
                        <div className='prescription-form-error'>{quantityError}</div>
                      )}
                    </div>
                  ) : (
                    <span className='prescription-items-na' aria-hidden>
                      —
                    </span>
                  )}
                </td>
                <td className='prescription-items-col-route'>
                  {item.itemType === 'drug' ? (
                    <select
                      value={item.route || 'oral'}
                      onChange={(e) => onUpdate(index, 'route', e.target.value)}
                      className='prescription-form-input'
                    >
                      <option value='oral'>{t('prescriptions.routeOral')}</option>
                      <option value='topical'>{t('prescriptions.routeTopical')}</option>
                      <option value='IV'>{t('prescriptions.routeIV')}</option>
                      <option value='IM'>{t('prescriptions.routeIM')}</option>
                      <option value='sublingual'>{t('prescriptions.routeSublingual')}</option>
                      <option value='inhalation'>{t('prescriptions.routeInhalation')}</option>
                    </select>
                  ) : item.itemType === 'lab' ? (
                    <select
                      value={item.priority || 'routine'}
                      onChange={(e) => onUpdate(index, 'priority', e.target.value)}
                      className='prescription-form-input'
                    >
                      <option value='routine'>{t('prescriptions.priorityRoutine')}</option>
                      <option value='urgent'>{t('prescriptions.priorityUrgent')}</option>
                      <option value='stat'>{t('prescriptions.priorityStat')}</option>
                    </select>
                  ) : (
                    <span className='prescription-items-na' aria-hidden>
                      —
                    </span>
                  )}
                </td>
                <td className='prescription-items-col-refills'>
                  {item.itemType === 'drug' ? (
                    <Input
                      type='number'
                      min='0'
                      value={item.refills != null ? item.refills : 0}
                      onChange={(e) =>
                        onUpdate(index, 'refills', parseInt(e.target.value, 10) || 0)
                      }
                      className='prescription-form-input prescription-items-input-narrow'
                    />
                  ) : (
                    <span className='prescription-items-na' aria-hidden>
                      —
                    </span>
                  )}
                </td>
                <td className='prescription-items-col-instructions'>
                  <Input
                    value={item.instructions || ''}
                    onChange={(e) => onUpdate(index, 'instructions', e.target.value)}
                    placeholder={t('prescriptions.instructionsPlaceholder')}
                    className='prescription-form-input'
                  />
                </td>
                <td className='prescription-items-col-actions'>
                  <Button
                    type='button'
                    variant='secondary'
                    size='sm'
                    onClick={() => onRemove(index)}
                    className='prescription-items-remove-btn'
                    aria-label={t('prescriptions.remove') || 'Remove'}
                  >
                    {t('prescriptions.remove') || 'Remove'}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className='prescription-items-empty'>
          {t('prescriptions.noItemsAddItem') ||
            'No items added. Click "Add Item" to add prescription items.'}
        </div>
      )}
    </div>
  );
}

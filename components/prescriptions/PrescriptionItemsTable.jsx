'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function PrescriptionItemsTable({
  items,
  drugs,
  labTests,
  onUpdate,
  onUpdateItem,
  onRemove,
  onAdd,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Prescription Items</h3>
        <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
          + Add Item
        </Button>
      </div>

      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Instructions</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-sm text-gray-900">{index + 1}</td>
                <td className="px-3 py-2 text-sm">
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
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="drug">Drug</option>
                    <option value="lab">Lab</option>
                    <option value="procedure">Procedure</option>
                    <option value="other">Other</option>
                  </select>
                </td>
                <td className="px-3 py-2 text-sm">
                  {item.itemType === 'drug' && (
                    <select
                      value={item.drugId ? String(item.drugId).trim() : ''}
                      onChange={(e) => {
                        const selectedValue = String(e.target.value).trim();
                        const drug = drugs.find(d => String(d._id).trim() === selectedValue);
                        
                        // Use onUpdateItem to update all fields at once if available
                        if (onUpdateItem) {
                          const updatedItem = {
                            ...item,
                            drugId: selectedValue,
                            drugName: drug ? drug.name : '',
                            form: drug ? (drug.form || '') : '',
                            strength: drug ? (drug.strength || '') : '',
                          };
                          onUpdateItem(index, updatedItem);
                        } else {
                          // Fallback: update fields individually
                          onUpdate(index, 'drugId', selectedValue);
                          if (drug) {
                            onUpdate(index, 'drugName', drug.name);
                            onUpdate(index, 'form', drug.form || '');
                            onUpdate(index, 'strength', drug.strength || '');
                          }
                        }
                      }}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select drug</option>
                      {drugs.map((drug) => (
                        <option key={drug._id} value={String(drug._id)}>
                          {drug.name} {drug.strength ? `(${drug.strength})` : ''} {drug.form ? `[${drug.form}]` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {item.itemType === 'lab' && (
                    <select
                      value={item.labTestCode || ''}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        const test = labTests.find(t => t.code === selectedValue);
                        
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
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select lab test</option>
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
                      placeholder="Procedure name"
                      className="text-xs"
                    />
                  )}
                  {item.itemType === 'other' && (
                    <Input
                      value={item.itemName || ''}
                      onChange={(e) => onUpdate(index, 'itemName', e.target.value)}
                      placeholder="Item name"
                      className="text-xs"
                    />
                  )}
                </td>
                <td className="px-3 py-2 text-sm">
                  {item.itemType === 'drug' ? (
                    <select
                      value={item.frequency || 'twice daily'}
                      onChange={(e) => {
                        onUpdate(index, 'frequency', e.target.value);
                      }}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="once daily">Once Daily</option>
                      <option value="twice daily">Twice Daily</option>
                      <option value="three times daily">Three Times</option>
                      <option value="as needed">As Needed</option>
                    </select>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2 text-sm">
                  {item.itemType === 'drug' ? (
                    <Input
                      type="number"
                      min="1"
                      value={item.duration || 7}
                      onChange={(e) => onUpdate(index, 'duration', parseInt(e.target.value) || 1)}
                      className="w-16 text-xs"
                    />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2 text-sm">
                  {item.itemType === 'drug' ? (
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || 1}
                      onChange={(e) => onUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-16 text-xs"
                    />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2 text-sm">
                  <Input
                    value={item.instructions || ''}
                    onChange={(e) => onUpdate(index, 'instructions', e.target.value)}
                    placeholder="Instructions"
                    className="text-xs w-32"
                  />
                </td>
                <td className="px-3 py-2 text-sm">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRemove(index)}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


'use client';

export function PrescriptionPrintView({ prescriptionData }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getItemTypeLabel = (itemType) => {
    switch (itemType) {
      case 'drug': return 'Medication';
      case 'lab': return 'Lab Test';
      case 'procedure': return 'Procedure';
      case 'other': return 'Other';
      default: return itemType;
    }
  };

  return (
    <div className="prescription-print p-8 max-w-4xl mx-auto bg-white">
      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          .prescription-print {
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PRESCRIPTION</h1>
            {prescriptionData.prescriptionNumber && (
              <p className="text-sm text-gray-600">Rx #: {prescriptionData.prescriptionNumber}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Date: {formatDate(prescriptionData.createdAt)}</p>
            <p className="text-sm text-gray-600">Valid Until: {formatDate(prescriptionData.validUntil)}</p>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="mb-6 grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-2">Patient Information</h2>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Name:</span> {prescriptionData.patientId?.firstName} {prescriptionData.patientId?.lastName}</p>
            <p><span className="font-medium">Patient ID:</span> {prescriptionData.patientId?.patientId || 'N/A'}</p>
            {prescriptionData.patientId?.dateOfBirth && (
              <p><span className="font-medium">DOB:</span> {formatDate(prescriptionData.patientId.dateOfBirth)}</p>
            )}
            {prescriptionData.patientId?.phone && (
              <p><span className="font-medium">Phone:</span> {prescriptionData.patientId.phone}</p>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-2">Prescribing Physician</h2>
          <div className="space-y-1 text-sm">
            <p className="font-medium">Dr. {prescriptionData.doctorId?.firstName} {prescriptionData.doctorId?.lastName}</p>
            {prescriptionData.doctorId?.email && (
              <p className="text-gray-600">{prescriptionData.doctorId.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      {prescriptionData.diagnosis && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-2">Diagnosis</h2>
          <p className="text-sm">{prescriptionData.diagnosis}</p>
        </div>
      )}

      {/* Prescription Items */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase mb-3">Medications & Instructions</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">#</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Type</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Medication/Test/Procedure</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Dosage</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Frequency</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Duration</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-xs font-semibold">Instructions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptionData.items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 text-sm">{index + 1}</td>
                <td className="border border-gray-300 px-4 py-3 text-sm">{getItemTypeLabel(item.itemType || 'drug')}</td>
                <td className="border border-gray-300 px-4 py-3 text-sm">
                  {item.itemType === 'drug' && (
                    <div>
                      <div className="font-medium">{item.drugName || 'N/A'}</div>
                      {item.genericName && (
                        <div className="text-xs text-gray-600">({item.genericName})</div>
                      )}
                      {item.strength && (
                        <div className="text-xs text-gray-600">{item.strength} {item.form}</div>
                      )}
                    </div>
                  )}
                  {item.itemType === 'lab' && (
                    <div>
                      <div className="font-medium">{item.labTestName || 'Lab Test'}</div>
                      {item.labTestCode && (
                        <div className="text-xs text-gray-600">Code: {item.labTestCode}</div>
                      )}
                      {item.fastingRequired && (
                        <div className="text-xs text-red-600 font-medium">⚠ Fasting Required</div>
                      )}
                    </div>
                  )}
                  {item.itemType === 'procedure' && (
                    <div>
                      <div className="font-medium">{item.procedureName || 'Procedure'}</div>
                      {item.procedureCode && (
                        <div className="text-xs text-gray-600">Code: {item.procedureCode}</div>
                      )}
                    </div>
                  )}
                  {item.itemType === 'other' && (
                    <div>
                      <div className="font-medium">{item.itemName || 'Other'}</div>
                      {item.itemDescription && (
                        <div className="text-xs text-gray-600">{item.itemDescription}</div>
                      )}
                    </div>
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm">
                  {item.itemType === 'drug' && (
                    <div>
                      {item.quantity && <span>{item.quantity}</span>}
                      {item.unit && <span> {item.unit}</span>}
                    </div>
                  )}
                  {item.itemType !== 'drug' && <span className="text-gray-400">-</span>}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm">
                  {item.itemType === 'drug' ? (item.frequency || '-') : '-'}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm">
                  {item.itemType === 'drug' && item.duration ? `${item.duration} days` : '-'}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm">
                  <div className="text-xs">
                    {item.instructions && <div>{item.instructions}</div>}
                    {item.itemType === 'lab' && item.labInstructions && (
                      <div className="mt-1">{item.labInstructions}</div>
                    )}
                    {item.itemType === 'procedure' && item.procedureInstructions && (
                      <div className="mt-1">{item.procedureInstructions}</div>
                    )}
                    {item.itemType === 'drug' && (
                      <div className="mt-1 space-y-0.5">
                        {item.takeWithFood && <div>• Take with food</div>}
                        {item.allowSubstitution === false && <div>• No generic substitution</div>}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Additional Instructions */}
      {prescriptionData.additionalInstructions && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-2">Additional Instructions</h2>
          <p className="text-sm whitespace-pre-wrap">{prescriptionData.additionalInstructions}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t-2 border-gray-800">
        <div className="grid grid-cols-2 gap-6">
          {prescriptionData.refillsAllowed !== undefined && (
            <div>
              <p className="text-sm"><span className="font-medium">Refills Allowed:</span> {prescriptionData.refillsAllowed}</p>
            </div>
          )}
        </div>
        <div className="mt-6 text-center">
          <div className="inline-block border-t-2 border-gray-800 pt-2 px-8">
            <p className="text-sm font-medium">Physician Signature</p>
            <p className="text-xs text-gray-600 mt-2">Dr. {prescriptionData.doctorId?.firstName} {prescriptionData.doctorId?.lastName}</p>
          </div>
        </div>
      </div>

      {/* Print Instructions */}
      <div className="mt-8 text-xs text-gray-500 text-center no-print">
        <p>This prescription is valid until {formatDate(prescriptionData.validUntil)}</p>
        <p className="mt-2">Press Ctrl+P (or Cmd+P on Mac) to print</p>
      </div>
    </div>
  );
}


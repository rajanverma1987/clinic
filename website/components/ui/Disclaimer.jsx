'use client';

export function Disclaimer({ type = 'general', className = '' }) {
  const disclaimers = {
    general: {
      title: 'HIPAA Compliance Notice',
      items: [
        'This system stores Protected Health Information (PHI) and must comply with HIPAA regulations.',
        'Unauthorized access or disclosure of PHI is prohibited and may result in legal action.',
      ],
    },
    medical: {
      title: 'Medical Disclaimer',
      items: [
        'This system does not provide medical advice, diagnosis, or treatment.',
        'In case of medical emergency, contact emergency services immediately (e.g., 911).',
      ],
    },
    prescription: {
      title: 'Prescription Disclaimer',
      items: [
        'Prescriptions are issued by licensed healthcare providers only.',
        'Patients must follow prescribed dosages and instructions exactly as directed.',
      ],
    },
    telemedicine: {
      title: 'Telemedicine Limitations',
      items: ['For emergencies, seek immediate in-person medical care.'],
    },
    data: {
      title: 'Data Protection',
      items: [
        'All Protected Health Information (PHI) is encrypted and stored securely.',
        'Data breaches must be reported immediately as required by HIPAA.',
      ],
    },
  };

  const disclaimer = disclaimers[type] || disclaimers.general;

  return (
    <div className={`bg-primary-100 border-l-4 border-primary-500 p-3 rounded-lg ${className}`}>
      <div className='flex items-start gap-3'>
        <svg
          className='w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        <div className='flex-1 space-y-1.5'>
          <h4 className='font-semibold text-neutral-900 text-sm'>{disclaimer.title}</h4>
          <ul className='list-disc list-inside space-y-1 text-neutral-700 text-sm'>
            {disclaimer.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

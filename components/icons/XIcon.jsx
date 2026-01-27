export function XIcon({ className = 'icon icon-sm', color = 'currentColor' }) {
  return (
    <svg
      className={className}
      fill='none'
      stroke={color}
      strokeWidth='2'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
    </svg>
  );
}

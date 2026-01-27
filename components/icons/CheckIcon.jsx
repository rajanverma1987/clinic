export function CheckIcon({ className = 'icon icon-sm', color = 'currentColor' }) {
  return (
    <svg
      className={className}
      fill='none'
      stroke={color}
      strokeWidth='2'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
    </svg>
  );
}

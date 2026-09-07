// Iconos simples para el nav, sin librería externa.

export function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.25a1 1 0 0 1 1 1v.63a6.75 6.75 0 0 1 5.75 6.67v3.06c0 1.02.36 2.01 1.02 2.79l.5.6a1 1 0 0 1-.77 1.64H4.5a1 1 0 0 1-.77-1.64l.5-.6c.66-.78 1.02-1.77 1.02-2.79v-3.06A6.75 6.75 0 0 1 11 3.88v-.63a1 1 0 0 1 1-1Z" />
      <path d="M9.75 19.5a2.25 2.25 0 0 0 4.5 0h-4.5Z" />
    </svg>
  );
}

export function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

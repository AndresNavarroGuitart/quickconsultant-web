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

export function InfoIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.75" r="0.1" fill="currentColor" stroke="currentColor" strokeWidth={2.2} />
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

export function ShieldIcon({ className }: { className?: string }) {
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
      <path d="M12 2l7 3v6c0 5-3 8.5-7 11-4-2.5-7-6-7-11V5l7-3z" />
      <path d="M9 12.5l2 2 4-4.5" strokeWidth={2.2} />
    </svg>
  );
}

export function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2c1 3-2 4.5-2 7.5a3.5 3.5 0 0 0 7 0c1.5 1.5 2 3.5 2 5A7 7 0 0 1 5 14.5C5 9 9 6 9 3c1 1 1.5 2 1.5 3.5C11.5 5 12 3.5 12 2z" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3 4.7-5.1" />
    </svg>
  );
}

export function LockIcon({ className }: { className?: string }) {
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
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function WavyBanner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 300"
      preserveAspectRatio="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="1200" height="300" fill="var(--color-brand-800)" />
      <path
        d="M0,60 C150,10 300,110 450,60 C600,10 750,110 900,60 C1050,10 1200,60 1200,60 L1200,0 L0,0 Z"
        fill="var(--color-brand-600)"
        opacity="0.6"
      />
      <path
        d="M0,150 C180,90 320,210 500,150 C680,90 820,210 1000,150 C1120,110 1200,150 1200,150 L1200,300 L0,300 Z"
        fill="var(--color-brand-500)"
      />
      <path
        d="M0,210 C200,160 340,260 520,210 C700,160 860,260 1040,210 C1130,180 1200,205 1200,205 L1200,300 L0,300 Z"
        fill="var(--color-brand-400)"
      />
      <path
        d="M0,255 C220,225 360,285 560,255 C740,228 900,285 1080,255 C1140,240 1200,252 1200,252 L1200,300 L0,300 Z"
        fill="var(--color-accent-500)"
      />
    </svg>
  );
}

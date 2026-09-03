export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`text-xl font-bold tracking-tight text-brand-700 ${className}`}
    >
      Potrero<span className="text-accent-500">Deportivo</span>
    </span>
  );
}

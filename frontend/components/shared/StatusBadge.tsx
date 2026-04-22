import { statusLabel } from '@/lib/utils';

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const base = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`${base} rounded-full font-medium inline-flex items-center gap-1.5 status-${status}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {statusLabel[status] || status}
    </span>
  );
}

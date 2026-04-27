import { cn } from '@/src/lib/utils/cn';
import { SampleStatus, statusLabels, statusColors } from '../types/MuestraTypes/MuestraTypes';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const sampleStatus = status as SampleStatus;
  const label = statusLabels[sampleStatus] || status;
  const colorClass = statusColors[sampleStatus] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <span
      className={cn(
        'inline-flex items-center border px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
}

import { getStatusLabel, getStatusColor } from '../../utils/dateUtils';

interface StatusBadgeProps {
  status: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const StatusBadge = ({ status, pulse = true, size = 'sm' }: StatusBadgeProps) => {
  const colorClass = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full font-bold uppercase tracking-widest ${colorClass} ${
      size === 'sm' ? 'px-3 py-1 text-[9px]' : 'px-4 py-1.5 text-[10px]'
    }`}>
      {pulse && (
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
          status === 'active' || status === 'success' || status === 'paid' ? 'bg-green-500' :
          status === 'due_soon' || status === 'pending' ? 'bg-yellow-500' :
          status === 'due_today' ? 'bg-orange-500' :
          status === 'overdue' || status === 'failed' ? 'bg-red-500' :
          status === 'paused' ? 'bg-blue-500' :
          status === 'refunded' ? 'bg-purple-500' :
          'bg-gray-500'
        }`} />
      )}
      {label}
    </span>
  );
};

export default StatusBadge;

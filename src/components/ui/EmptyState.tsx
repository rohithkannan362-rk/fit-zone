import { type LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-white/20" />
      </div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 bg-gym-red hover:bg-white hover:text-black text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 rounded-lg"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

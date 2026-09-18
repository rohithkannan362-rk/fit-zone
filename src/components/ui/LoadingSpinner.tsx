import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner = ({ message = 'Loading...', fullScreen = false }: LoadingSpinnerProps) => {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 text-gym-red animate-spin" />
      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      {content}
    </div>
  );
};

export default LoadingSpinner;

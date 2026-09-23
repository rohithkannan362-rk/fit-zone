import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface BackButtonProps {
  to: string;
  label?: string;
}

const BackButton = ({ to, label = "BACK" }: BackButtonProps) => {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6 group w-fit"
    >
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">
        {label}
      </span>
    </Link>
  );
};

export default BackButton;

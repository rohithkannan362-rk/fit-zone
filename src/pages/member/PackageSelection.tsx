import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Check, ChevronLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { getActivePackages } from "../../services/packageService";
import { type Package } from "../../lib/supabase-types";
import { formatCurrency } from "../../utils/dateUtils";

const PackageSelection = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setError(null);
      const pkgs = await getActivePackages();
      setPackages(pkgs);
      // Auto-select the popular one or first
      const popular = pkgs.find((p) => p.popular);
      if (popular?.id) setSelectedId(popular.id);
      else if (pkgs[0]?.id) setSelectedId(pkgs[0].id);
    } catch (error) {
      console.error("Failed to load packages:", error);
      setError("Failed to load packages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = packages.find((p) => p.id === selectedId);

  const handleSelect = () => {
    if (!selectedId) return;
    navigate(`/member/payment?packageId=${selectedId}`);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 pb-24 md:pb-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gym-red/5 rounded-full mix-blend-screen filter blur-[200px] opacity-40 pointer-events-none"></div>

      <Link
        to="/member/dashboard"
        className="absolute top-4 left-4 sm:top-8 sm:left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20 min-h-[44px]"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="font-bold tracking-widest text-xs sm:text-sm uppercase">
          Back
        </span>
      </Link>

      <div className="max-w-4xl mx-auto relative z-10 pt-8 sm:pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center justify-center bg-white w-14 h-14 sm:w-16 sm:h-16 rounded-full p-2 shadow-[0_0_20px_rgba(255,51,51,0.25)] border border-white/20 mb-4 sm:mb-6 overflow-hidden">
            <img
              src="/logo.jpg"
              alt="FIT ZONE"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 sm:mb-3">
            {user?.member ? "Renew" : "Welcome to"}{" "}
            <span className="text-gym-red">FIT ZONE</span>
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-2 sm:mt-4 max-w-lg mx-auto">
            Select a membership package to begin your fitness journey.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-gym-red animate-spin mb-4" />
            <p className="text-white/50 text-sm tracking-widest uppercase">
              Loading packages...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-6">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                loadPackages();
              }}
              className="bg-gym-red hover:bg-red-600 text-white px-8 py-3 text-xs font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-2"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {packages.map((pkg, idx) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  onClick={() => setSelectedId(pkg.id!)}
                  className={`relative p-5 sm:p-8 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-2 flex flex-col group ${
                    selectedId === pkg.id
                      ? "bg-[#0a0a0a] border-2 border-gym-red shadow-[0_0_30px_rgba(255,51,51,0.15)]"
                      : "bg-[#0a0a0a] border-2 border-white/10 hover:border-white/30"
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 right-4 bg-gym-red text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-sm shadow-[0_0_10px_rgba(255,51,51,0.5)]">
                      Popular
                    </div>
                  )}

                  {selectedId === pkg.id && (
                    <div className="absolute top-4 left-4 w-6 h-6 bg-gym-red rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 text-center text-white/50">
                    {pkg.name}
                  </h3>

                  <div className="flex items-start justify-center gap-1 mb-2">
                    <span className="text-lg sm:text-xl font-bold mt-1">₹</span>
                    <span className="text-3xl sm:text-5xl font-black">
                      {pkg.price.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="h-6 mb-6 text-center">
                    {pkg.offer && (
                      <p className="text-xs font-bold tracking-widest text-gym-red">
                        {pkg.offer}
                      </p>
                    )}
                  </div>

                  <div className="text-center space-y-1 mb-6">
                    <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                      {pkg.duration_months} Paid Months
                    </div>
                    {(pkg.free_months || 0) > 0 && (
                      <div className="text-green-400 text-[10px] font-bold uppercase tracking-widest">
                        + {pkg.free_months} Free Months
                      </div>
                    )}
                    <div className="text-white text-[12px] font-bold uppercase tracking-widest pt-1 border-t border-white/10 mt-2 inline-block">
                      Total: {pkg.total_months || pkg.duration_months} Months Access
                    </div>
                  </div>

                  <ul className="space-y-3 flex-1">
                    {pkg.features.map((feature, fIdx) => (
                      <li
                        key={fIdx}
                        className="flex items-start gap-3 text-[11px] font-medium tracking-wide text-white/70"
                      >
                        <Check className="w-4 h-4 text-gym-red shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {selectedPackage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <button
                  onClick={handleSelect}
                  className="bg-gym-red hover:bg-red-600 text-white w-full sm:w-auto px-6 sm:px-12 py-4 sm:py-5 text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(255,51,51,0.4)] hover:shadow-[0_0_50px_rgba(255,51,51,0.6)] inline-flex items-center justify-center gap-3"
                >
                  Continue with {selectedPackage.name} —{" "}
                  {formatCurrency(selectedPackage.price)}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PackageSelection;

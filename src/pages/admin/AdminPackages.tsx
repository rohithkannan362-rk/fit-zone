import { useState, useEffect } from "react";
import {
  Plus,
  Edit3,
  ToggleLeft,
  ToggleRight,
  X,
  Package as PackageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAllPackages,
  createPackage,
  updatePackage,
  deactivatePackage,
} from "../../services/packageService";
import { type Package } from "../../lib/supabase-types";
import { formatCurrency } from "../../utils/dateUtils";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import BackButton from "../../components/ui/BackButton";

const AdminPackages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPkg, setEditPkg] = useState<Package | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [durationMonths, setDurationMonths] = useState(1);
  const [freeMonths, setFreeMonths] = useState(0);
  const [totalMonths, setTotalMonths] = useState(1);
  const [price, setPrice] = useState(0);
  const [features, setFeatures] = useState("");
  const [offer, setOffer] = useState("");
  const [popular, setPopular] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const pkgs = await getAllPackages();
      setPackages(pkgs);
    } catch (error) {
      console.error("Failed to load packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDurationMonths(1);
    setFreeMonths(0);
    setTotalMonths(1);
    setPrice(0);
    setFeatures("");
    setOffer("");
    setPopular(false);
    setEditPkg(null);
    setShowForm(false);
  };

  const openEdit = (pkg: Package) => {
    setEditPkg(pkg);
    setName(pkg.name);
    setDurationMonths(pkg.duration_months);
    setFreeMonths(pkg.free_months);
    setTotalMonths(pkg.total_months);
    setPrice(pkg.price);
    setFeatures(pkg.features.join("\n"));
    setOffer(pkg.offer || "");
    setPopular(pkg.popular || false);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    if (durationMonths < 1) {
      alert("Duration must be at least 1 month");
      return;
    }
    if (totalMonths < 1) {
      alert("Total months must be at least 1");
      return;
    }
    if (price < 0) {
      alert("Price cannot be negative");
      return;
    }
    setSaving(true);

    try {
      const data = {
        name,
        duration_months: durationMonths,
        free_months: freeMonths,
        total_months: totalMonths,
        price,
        features: features.split("\n").filter((f) => f.trim()),
        offer: offer || null,
        popular,
      };

      if (editPkg?.id) {
        await updatePackage(editPkg.id, data);
      } else {
        await createPackage(data);
      }

      resetForm();
      await loadPackages();
    } catch (error) {
      console.error("Failed to save package:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pkg: Package) => {
    try {
      if (pkg.active) {
        await deactivatePackage(pkg.id);
      } else {
        await updatePackage(pkg.id, { active: true });
      }
      await loadPackages();
    } catch (error) {
      console.error("Failed to toggle package:", error);
    }
  };

  if (loading) return <LoadingSpinner message="Loading packages..." />;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 sm:p-6 md:p-12 pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto">
        <BackButton to="/admin" label="BACK TO DASHBOARD" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter mb-1 sm:mb-2">
              Manage <span className="text-gym-red">Packages</span>
            </h2>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              {packages.length} Total Packages
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="w-full sm:w-auto justify-center bg-gym-red hover:bg-white hover:text-black text-white px-5 sm:px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 rounded-lg"
          >
            <Plus className="w-4 h-4" /> New Package
          </button>
        </div>

        {/* Package Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl mb-8"
            >
              <form
                onSubmit={handleSubmit}
                className="bg-[#080808] rounded-[15px] p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest">
                    {editPkg ? "Edit Package" : "New Package"}
                  </h3>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-white/40 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                      Name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-gym-red"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                      Duration (months)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={durationMonths}
                      onChange={(e) =>
                        setDurationMonths(Number(e.target.value))
                      }
                      className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-gym-red"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                      Free Months
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={freeMonths}
                      onChange={(e) =>
                        setFreeMonths(Number(e.target.value))
                      }
                      className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-gym-red"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                      Total Months
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={totalMonths}
                      onChange={(e) =>
                        setTotalMonths(Number(e.target.value))
                      }
                      className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-gym-red"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-gym-red"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                      Offer Tag
                    </label>
                    <input
                      value={offer}
                      onChange={(e) => setOffer(e.target.value)}
                      placeholder="e.g. Save ₹1,000"
                      className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-gym-red placeholder:text-white/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                    Features (one per line)
                  </label>
                  <textarea
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    rows={3}
                    className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-gym-red resize-none"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={popular}
                    onChange={(e) => setPopular(e.target.checked)}
                    className="sr-only"
                  />
                  {popular ? (
                    <ToggleRight className="w-6 h-6 text-gym-red" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-white/40" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                    Mark as Popular
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editPkg
                      ? "Update Package"
                      : "Create Package"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Package List */}
        <div className="space-y-4">
          {packages.map((pkg) => (
            <motion.div
              key={pkg.id}
              layout
              className={`bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl ${!pkg.active ? "opacity-50" : ""}`}
            >
              <div className="bg-[#080808] rounded-[15px] p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2.5 sm:p-3 bg-white/5 rounded-xl shrink-0">
                    <PackageIcon className="w-5 h-5 text-gym-red" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm uppercase tracking-widest">
                        {pkg.name}
                      </h3>
                      {pkg.popular && (
                        <span className="bg-gym-red/20 text-gym-red text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                          Popular
                        </span>
                      )}
                      {!pkg.active && (
                        <span className="bg-white/5 text-white/40 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40 font-bold tracking-widest mt-1">
                      {pkg.total_months}{" "}
                      {pkg.total_months === 1 ? "month total" : "months total"} •{" "}
                      {pkg.free_months} free •{" "}
                      {pkg.features.length} features
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-white/5 pt-3 md:pt-0 mt-1 md:mt-0">
                  <span className="text-xl sm:text-2xl font-black">
                    {formatCurrency(pkg.price)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(pkg)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit package"
                    >
                      <Edit3 className="w-4 h-4 text-white/50" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(pkg)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      title={pkg.active ? "Deactivate" : "Activate"}
                    >
                      {pkg.active ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-white/40" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPackages;

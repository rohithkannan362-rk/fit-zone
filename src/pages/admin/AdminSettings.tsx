import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings, Save, Loader2, CheckCircle2, User, ArrowRight } from "lucide-react";
import { getSettings, saveSettings } from "../../services/settingsService";
import { seedDefaultPackages } from "../../services/packageService";
import { type AppSettings } from "../../lib/supabase-types";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import BackButton from "../../components/ui/BackButton";
import { motion, AnimatePresence } from "framer-motion";

const AdminSettings = () => {
  const [settings, setSettings] = useState<
    Omit<AppSettings, "id" | "created_at" | "updated_at">
  >({
    gym_name: "FIT ZONE",
    gym_address: "FIT ZONE GYM & FITNESS",
    gym_phone: "",
    admin_email: "",
    payment_gateway: "manual_upi",
    reminder_schedule: [
      "2_days_before",
      "1_day_before",
      "due_today",
      "1_day_overdue",
      "2_days_overdue",
      "5_days_overdue",
      "7_days_overdue",
    ],
    currency: "INR",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings({
        gym_name: data.gym_name,
        gym_address: data.gym_address,
        gym_phone: data.gym_phone,
        admin_email: data.admin_email,
        payment_gateway: data.payment_gateway,
        reminder_schedule: data.reminder_schedule,
        currency: data.currency,
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSeedPackages = async () => {
    setSeeding(true);
    try {
      await seedDefaultPackages();
      alert("Default packages seeded successfully!");
    } catch (error) {
      console.error("Failed to seed packages:", error);
      alert("Failed to seed packages");
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <BackButton to="/admin" label="BACK TO DASHBOARD" />
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
              Admin <span className="text-gym-red">Settings</span>
            </h2>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              Configure gym & business operations
            </p>
          </div>
          <Link
            to="/admin/profile"
            className="inline-flex items-center gap-2 bg-[#0c0c0c] hover:bg-white/10 border border-white/10 hover:border-gym-red/40 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all min-h-[44px]"
          >
            <User className="w-3.5 h-3.5 text-gym-red" />
            <span>Manage My Profile</span>
            <ArrowRight className="w-3 h-3 text-white/40" />
          </Link>
        </div>

        <div className="space-y-6">
          {/* Gym Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl"
          >
            <div className="bg-[#080808] rounded-[15px] p-8 space-y-5">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Settings className="w-4 h-4 text-gym-red" /> Gym Information
              </h3>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                  Gym Name
                </label>
                <input
                  value={settings.gym_name}
                  onChange={(e) =>
                    setSettings({ ...settings, gym_name: e.target.value })
                  }
                  className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-gym-red"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                  Address
                </label>
                <input
                  value={settings.gym_address || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, gym_address: e.target.value })
                  }
                  className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-gym-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                    Phone
                  </label>
                  <input
                    value={settings.gym_phone || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, gym_phone: e.target.value })
                    }
                    className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-gym-red"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                    Admin Email
                  </label>
                  <input
                    value={settings.admin_email || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, admin_email: e.target.value })
                    }
                    className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-gym-red"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Setup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl"
          >
            <div className="bg-[#080808] rounded-[15px] p-8 space-y-5">
              <h3 className="text-sm font-black uppercase tracking-widest">
                Quick Setup
              </h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                Seed default packages if none exist (1 Month ₹1,000, 3 Months ₹3,000,
                6 Months ₹7,000, 12 Months ₹10,000)
              </p>
              <button
                onClick={handleSeedPackages}
                disabled={seeding}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 rounded-lg disabled:opacity-50"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Seeding...
                  </>
                ) : (
                  "Seed Default Packages"
                )}
              </button>
            </div>
          </motion.div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Settings
                </>
              )}
            </button>

            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-green-500 text-[10px] font-bold uppercase tracking-widest"
                >
                  <CheckCircle2 className="w-4 h-4" /> Saved!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

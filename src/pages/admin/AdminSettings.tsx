import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, CheckCircle2, Mail, Phone, MapPin } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { COLLECTIONS, type AppSettings } from '../../lib/firestore-schema';
import { seedDefaultPackages } from '../../services/packageService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSettings = () => {
  const [settings, setSettings] = useState<AppSettings>({
    gymName: 'FIT ZONE',
    gymAddress: 'FIT ZONE GYM & FITNESS',
    gymPhone: '',
    adminEmail: '',
    paymentGateway: 'razorpay',
    reminderSchedule: ['2_days_before', '1_day_before', 'due_today', '1_day_overdue', '2_days_overdue', '5_days_overdue', '7_days_overdue'],
    currency: 'INR',
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
      const docRef = doc(db, COLLECTIONS.SETTINGS, 'app');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setSettings({ ...settings, ...snap.data() } as AppSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, 'app');
      await setDoc(docRef, settings, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSeedPackages = async () => {
    setSeeding(true);
    try {
      await seedDefaultPackages();
      alert('Default packages seeded successfully!');
    } catch (error) {
      console.error('Failed to seed packages:', error);
      alert('Failed to seed packages');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
            Admin <span className="text-gym-red">Settings</span>
          </h2>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
            Configure gym settings
          </p>
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
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Gym Name</label>
                <input
                  value={settings.gymName}
                  onChange={e => setSettings({ ...settings, gymName: e.target.value })}
                  className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-gym-red"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Address</label>
                <input
                  value={settings.gymAddress}
                  onChange={e => setSettings({ ...settings, gymAddress: e.target.value })}
                  className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-gym-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Phone</label>
                  <input
                    value={settings.gymPhone}
                    onChange={e => setSettings({ ...settings, gymPhone: e.target.value })}
                    className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-gym-red"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Admin Email</label>
                  <input
                    value={settings.adminEmail}
                    onChange={e => setSettings({ ...settings, adminEmail: e.target.value })}
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
              <h3 className="text-sm font-black uppercase tracking-widest">Quick Setup</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                Seed default packages if none exist (Monthly ₹1,000, 3M ₹2,700, 6M ₹5,000, 12M ₹9,000)
              </p>
              <button
                onClick={handleSeedPackages}
                disabled={seeding}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 rounded-lg disabled:opacity-50"
              >
                {seeding ? <><Loader2 className="w-4 h-4 animate-spin" /> Seeding...</> : 'Seed Default Packages'}
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
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Settings</>}
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

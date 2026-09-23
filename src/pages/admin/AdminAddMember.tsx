import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import BackButton from "../../components/ui/BackButton";
import { motion } from "framer-motion";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function AdminAddMember() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "FitZone123!",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.fullName || !formData.email || !formData.mobile || !formData.password) {
        throw new Error("All fields are required");
      }

      // Create a temporary non-persistent client so we don't log the admin out
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const { data, error: signUpError } = await tempClient.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.mobile,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Failed to create user");

      // Supabase returns a fake user with empty identities if the email is already taken
      // (to prevent email enumeration). We check this to show a proper error.
      if (data.user.identities && data.user.identities.length === 0) {
        throw new Error("Email address is already in use by another member.");
      }

      // Successfully created, the database trigger will create the profile.
      // We can redirect the admin to the member's profile page.
      navigate(`/admin/members/${data.user.id}`);
    } catch (err: any) {
      console.error("Add member error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white py-12 px-6">
      <div className="max-w-xl mx-auto">
        <BackButton to="/admin/members" label="BACK TO MEMBERS" />

        <div className="mb-8">
          <h1 className="text-4xl font-black italic tracking-tighter">
            ADD <span className="text-gym-red">MEMBER</span>
          </h1>
          <p className="text-white/50 text-sm mt-2 uppercase tracking-widest">
            Register a new member profile
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#080808] border border-white/5 p-8 rounded-2xl"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm mb-6 uppercase tracking-wider text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                Full Name
              </label>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. john@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                Temporary Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[10px] text-gym-red/80 uppercase tracking-widest mt-1">
                Please share this password with the member.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gym-red hover:bg-white hover:text-black text-white py-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all mt-8 shadow-[0_0_20px_rgba(255,51,51,0.3)] disabled:opacity-50 flex justify-center items-center h-14"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Member"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

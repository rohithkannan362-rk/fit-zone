import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowRight, User, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const returnPath = user?.role === 'admin' ? '/admin' : '/';

  // If they came from a specific plan button, remember it
  const preselectedPlan = new URLSearchParams(location.search).get('plan') || '';

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 2) {
      setError('Please enter your full name');
      return;
    }
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    
    // In a real app, we would create a Firebase Auth user here with OTP verification.
    // For now, we mock the success and move to Checkout.
    navigate(`/checkout?plan=${preselectedPlan}&name=${encodeURIComponent(name)}&phone=${phone}`);
  };

  return (
    <div className="min-h-screen bg-gym-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      {/* Background aesthetics */}
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gym-red rounded-full mix-blend-screen filter blur-[200px] opacity-10 pointer-events-none"></div>
      
      <Link to={returnPath} className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20">
        <ChevronLeft className="w-5 h-5" />
        <span className="font-bold tracking-widest text-sm uppercase">Return</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-10 relative z-10 border-t-4 border-t-gym-red"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="mb-8 bg-white p-3 rounded-lg shadow-2xl transform rotate-2">
            <img src="/logo.jpg" alt="FIT ZONE" className="h-16 w-auto object-contain" />
          </div>
          <h2 className="text-4xl font-black text-white font-heading uppercase tracking-tighter">Join The <span className="text-gym-red">Zone</span></h2>
          <p className="text-white/50 text-sm mt-4 tracking-wider uppercase font-medium">
            Step 1: Create Account
          </p>
        </div>

        {error && (
          <div className="bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-4 text-center font-bold tracking-wider uppercase mb-8">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-6">
          <div>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40">
                <User className="w-5 h-5" />
              </span>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="FULL NAME"
                className="w-full bg-gym-charcoal border-2 border-white/10 py-4 pl-14 pr-5 text-white font-bold tracking-widest focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 uppercase"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 font-bold tracking-widest">+91</span>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="PHONE NUMBER"
                className="w-full bg-gym-charcoal border-2 border-white/10 py-4 pl-16 pr-5 text-white font-bold tracking-widest focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 uppercase"
              />
            </div>
          </div>
          
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-3">
            Continue to Plans <ArrowRight className="w-5 h-5" />
          </button>
          
          <div className="mt-6 text-center border-t border-white/10 pt-6">
            <p className="text-xs text-white/40 font-medium tracking-widest uppercase">
              Already have an account? <Link to="/login" className="text-white hover:text-gym-red transition-colors">Login Here</Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;

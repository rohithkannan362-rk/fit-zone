import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, User, ChevronLeft, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const MemberRegister = () => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile,
        password,
      });
      // Registration successful — redirect to package selection
      navigate('/member/membership');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gym-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gym-red rounded-full mix-blend-screen filter blur-[200px] opacity-10 pointer-events-none"></div>

      <Link to="/" className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20">
        <ChevronLeft className="w-5 h-5" />
        <span className="font-bold tracking-widest text-sm uppercase">Return</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-10 relative z-10 border-t-4 border-t-gym-red"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-6 bg-white p-3 rounded-lg shadow-2xl transform rotate-2">
            <img src="/logo.jpg" alt="FIT ZONE" className="h-14 w-auto object-contain" />
          </div>
          <h2 className="text-3xl font-black text-white font-heading uppercase tracking-tighter">
            Create <span className="text-gym-red">Account</span>
          </h2>
          <p className="text-white/50 text-sm mt-3 tracking-wider uppercase font-medium">
            Join the FIT ZONE family
          </p>
        </div>

        {error && (
          <div className="bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-4 text-center font-bold tracking-wider uppercase mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
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

          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40">
              <Phone className="w-5 h-5" />
            </span>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="MOBILE NUMBER"
              className="w-full bg-gym-charcoal border-2 border-white/10 py-4 pl-14 pr-5 text-white font-bold tracking-widest focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 uppercase"
            />
          </div>

          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40">
              <Mail className="w-5 h-5" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL ADDRESS"
              className="w-full bg-gym-charcoal border-2 border-white/10 py-4 pl-14 pr-5 text-white font-bold tracking-widest focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 lowercase"
            />
          </div>

          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40">
              <Lock className="w-5 h-5" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              className="w-full bg-gym-charcoal border-2 border-white/10 py-4 pl-14 pr-14 text-white font-bold tracking-widest focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 uppercase"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40">
              <Lock className="w-5 h-5" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="CONFIRM PASSWORD"
              className="w-full bg-gym-charcoal border-2 border-white/10 py-4 pl-14 pr-5 text-white font-bold tracking-widest focus:outline-none focus:border-gym-red transition-colors placeholder:text-white/20 uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
            {!isSubmitting && <ArrowRight className="w-5 h-5" />}
          </button>

          <div className="mt-4 text-center border-t border-white/10 pt-6">
            <p className="text-xs text-white/40 font-medium tracking-widest uppercase">
              Already have an account?{' '}
              <Link to="/member/login" className="text-white hover:text-gym-red transition-colors">
                Login Here
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default MemberRegister;

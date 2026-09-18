import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Mail, Lock, ChevronLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface MemberLoginProps {
  isAdmin?: boolean;
}

const MemberLogin = ({ isAdmin = false }: MemberLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { login, resetPassword, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/member/dashboard');
      }
    }
  }, [user, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    try {
      await resetPassword(email.trim().toLowerCase());
      setResetSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gym-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gym-red rounded-full mix-blend-screen filter blur-[200px] opacity-10 pointer-events-none"></div>

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
          <div className="mb-6 bg-white p-3 rounded-lg shadow-2xl transform -rotate-2">
            <img src="/logo.jpg" alt="FIT ZONE" className="h-14 w-auto object-contain" />
          </div>
          <h2 className="text-3xl font-black text-white font-heading uppercase tracking-tighter">
            {isAdmin ? (
              <>Admin <span className="text-gym-red">Portal</span></>
            ) : (
              <>Enter The <span className="text-gym-red">Zone</span></>
            )}
          </h2>
          <p className="text-white/50 text-sm mt-3 tracking-wider uppercase font-medium">
            {isAdmin ? 'Gym Owner Access Only' : 'Member Login'}
          </p>
        </div>

        {error && (
          <div className="bg-gym-red/10 border border-gym-red/30 text-gym-red text-sm p-4 text-center font-bold tracking-wider uppercase mb-6">
            {error}
          </div>
        )}

        {resetSent && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-500 text-sm p-4 text-center font-bold tracking-wider uppercase mb-6">
            Password reset email sent! Check your inbox.
          </div>
        )}

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-6">
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

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-3">
              Send Reset Link <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => { setShowForgotPassword(false); setResetSent(false); setError(''); }}
              className="text-white/40 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors text-center"
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
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

            <div className="text-right">
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setError(''); }}
                className="text-white/40 text-[10px] font-bold uppercase tracking-widest hover:text-gym-red transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isSubmitting ? 'Signing In...' : 'Sign In'}
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>

            {!isAdmin && (
              <div className="mt-4 text-center border-t border-white/10 pt-6">
                <p className="text-xs text-white/40 font-medium tracking-widest uppercase">
                  New to FIT ZONE?{' '}
                  <Link to="/member/register" className="text-white hover:text-gym-red transition-colors">
                    Create Account
                  </Link>
                </p>
              </div>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default MemberLogin;

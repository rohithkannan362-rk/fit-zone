import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, CreditCard, Calendar, FileText, Bell, ChevronRight, User, Download, ScanLine, X, CheckCircle2, Home, IdCard, QrCode, IndianRupee, Menu, ArrowRight, Shield, Smartphone, HelpCircle, Info, Settings, Activity, Flame, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MemberDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('6m');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const plans = [
    { id: '1m', duration: '1 Month', price: '1,000' },
    { id: '3m', duration: '3 Months', price: '3,000' },
    { id: '6m', duration: '6 Months', price: '7,000' },
    { id: '12m', duration: '12 Months', price: '10,000' },
  ];

  const handlePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 3000);
    }, 2000);
  };

  // Mock Data
  const mockMembership = {
    plan: '6 Months',
    status: 'ACTIVE',
    startDate: '16 April 2026',
    expiryDate: '16 October 2026',
    daysRemaining: 30,
    memberId: 'FZG00142'
  };

  const paymentHistory = [
    { id: 'FZG-2026-00142', date: '16 September 2026', amount: 7000, plan: '6 Months', status: 'PAID', method: 'UPI' },
    { id: 'FZG-2025-00081', date: '16 September 2025', amount: 10000, plan: '12 Months', status: 'PAID', method: 'Card' },
  ];

  const attendanceLog = [
    { date: '16 Sep', time: '09:42 AM', status: '✓' },
    { date: '15 Sep', time: '07:15 AM', status: '✓' },
    { date: '14 Sep', time: '-', status: '—' },
    { date: '13 Sep', time: '08:00 AM', status: '✓' },
    { date: '12 Sep', time: '07:30 AM', status: '✓' },
  ];

  const handleQuickLink = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white relative selection:bg-gym-red selection:text-white pb-20 md:pb-0 md:pl-28 font-sans">
      
      {/* Background Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gym-red/10 rounded-full mix-blend-screen filter blur-[200px] opacity-40"></div>
        <div className="absolute top-[20%] left-[-200px] w-[500px] h-[500px] bg-gym-red/5 rounded-full mix-blend-screen filter blur-[150px] opacity-30"></div>
        {/* <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div> */}
      </div>

      {/* Navigation - Premium Sidebar / Bottom Bar */}
      <nav className="fixed bottom-0 left-0 w-full md:w-28 md:h-screen md:top-0 bg-[#080808]/90 backdrop-blur-2xl border-t md:border-t-0 md:border-r border-white/5 z-50 flex md:flex-col items-center justify-around md:justify-start md:pt-10 md:gap-8 px-2 py-4 md:p-0 shadow-2xl">
        <div className="hidden md:flex bg-white p-2 rounded-lg shadow-[0_0_20px_rgba(255,51,51,0.2)] mb-8">
          <img src="/logo.jpg" alt="FIT ZONE" className="h-8 w-auto object-contain" />
        </div>
        
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'membership', icon: IdCard, label: 'Membership' },
          { id: 'attend', icon: QrCode, label: 'Attend' },
          { id: 'fees', icon: IndianRupee, label: 'Fees' },
          { id: 'more', icon: Menu, label: 'More' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-2 group transition-all duration-300 flex-1 md:flex-none relative ${
              activeTab === tab.id ? 'text-gym-red' : 'text-white/40 hover:text-white'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div layoutId="nav-pill" className="absolute -inset-x-4 -inset-y-3 bg-white/5 rounded-xl border border-white/10 hidden md:block" />
            )}
            {activeTab === tab.id && (
              <div className="absolute top-[-16px] w-8 h-1 bg-gym-red rounded-b-full md:hidden shadow-[0_0_10px_rgba(255,51,51,0.8)]" />
            )}
            
            <tab.icon className={`w-6 h-6 md:w-7 md:h-7 transition-all duration-300 relative z-10 ${activeTab === tab.id ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,51,51,0.5)]' : 'group-hover:scale-110'}`} />
            <span className="text-[9px] font-bold uppercase tracking-widest relative z-10">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile Header */}
      <header className="md:hidden bg-[#080808]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-md shadow-lg">
            <img src="/logo.jpg" alt="FIT ZONE" className="h-5 w-auto object-contain" />
          </div>
          <span className="font-black text-sm tracking-widest uppercase block leading-none">Member<span className="text-gym-red">Zone</span></span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-6 pt-10 pb-12 relative z-10 min-h-[80vh]">
        <AnimatePresence mode="wait">
          
          {/* ==========================================
              TAB 1: HOME
          ========================================== */}
          {activeTab === 'home' && (
            <motion.div 
              key="home" 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            >
              <motion.div variants={itemVariants} className="mb-10">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                  Good Morning 👋
                </p>
                <h1 className="text-4xl font-black uppercase tracking-tighter bg-gradient-to-r from-white via-white/90 to-white/50 bg-clip-text text-transparent">
                  Welcome to <span className="text-gym-red">FIT ZONE</span>
                </h1>
              </motion.div>

              {/* Exact Wireframe Membership Box, Upgraded */}
              <motion.div variants={itemVariants} className="group relative mb-6">
                <div className="bg-gradient-to-br from-gym-red/30 to-transparent rounded-2xl p-[1px] transition-all duration-500 hover:from-gym-red">
                  <div className="bg-[#080808]/90 backdrop-blur-2xl border-none rounded-[15px] p-8 w-full relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gym-red/10 blur-[50px] rounded-full group-hover:bg-gym-red/20 transition-colors duration-500"></div>
                    
                    <div className="flex justify-between items-start mb-10 relative z-10">
                      <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Membership</h3>
                      <div className="inline-flex items-center gap-2 bg-gym-red/10 border border-gym-red/20 text-gym-red px-3 py-1.5 rounded-full text-[9px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(255,51,51,0.2)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-gym-red animate-pulse"></div>
                        {mockMembership.status}
                      </div>
                    </div>
                    
                    <div className="mb-8 relative z-10">
                      <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">Valid until</p>
                      <p className="text-3xl font-black text-white/90">{mockMembership.expiryDate}</p>
                    </div>
                    
                    <div className="border-t border-white/10 pt-5 relative z-10">
                      <p className="text-gym-red font-black text-lg uppercase tracking-wider flex items-center gap-2">
                        {mockMembership.daysRemaining} DAYS REMAINING
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.button 
                variants={itemVariants}
                onClick={() => handleQuickLink('fees')}
                className="w-full bg-gym-red hover:bg-white hover:text-black text-white font-black text-sm uppercase tracking-widest py-5 rounded-xl shadow-[0_0_30px_rgba(255,51,51,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-300 flex justify-center items-center gap-2 mb-12 group"
              >
                PAY FEES <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </motion.button>

              <motion.div variants={containerVariants} className="space-y-3 mb-6">
                {[
                  { id: 'attend', icon: Calendar, label: 'Attendance' },
                  { id: 'fees', icon: CreditCard, label: 'Payment History' },
                  { id: 'more', icon: Bell, label: 'Notifications' },
                  { id: 'fees', icon: FileText, label: 'Receipts' },
                ].map((link, i) => (
                  <motion.button 
                    key={i}
                    variants={itemVariants}
                    onClick={() => handleQuickLink(link.id)} 
                    className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-[#0a0a0a] to-[#080808] hover:from-[#111] hover:to-[#0a0a0a] border border-white/5 hover:border-gym-red/30 rounded-xl transition-all duration-300 group shadow-lg"
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-2 bg-white/5 rounded-lg group-hover:bg-gym-red/10 transition-colors">
                        <link.icon className="w-5 h-5 text-white/50 group-hover:text-gym-red transition-colors" />
                      </div>
                      <span className="font-bold text-xs tracking-widest uppercase text-white/80 group-hover:text-white">{link.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gym-red group-hover:translate-x-1 transition-all" />
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ==========================================
              TAB 2: MEMBERSHIP
          ========================================== */}
          {activeTab === 'membership' && (
            <motion.div 
              key="membership" 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            >
              <motion.h2 variants={itemVariants} className="text-4xl font-black uppercase tracking-tighter mb-10 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">My Membership</motion.h2>

              <motion.div variants={itemVariants} className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl relative">
                <div className="bg-[#080808] rounded-[15px] p-8 space-y-8 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gym-red/10 blur-[60px] rounded-full pointer-events-none"></div>
                  
                  <div className="relative z-10 flex justify-between items-start border-b border-white/5 pb-8">
                    <div>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">Plan</p>
                      <p className="text-2xl font-black tracking-tight">{mockMembership.plan}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">Status</p>
                      <div className="inline-flex items-center gap-1.5 bg-gym-red/10 border border-gym-red/20 text-gym-red px-3 py-1.5 rounded-full text-[9px] font-bold tracking-widest uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-gym-red animate-pulse"></div>
                        {mockMembership.status}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 relative z-10 border-b border-white/5 pb-8">
                    <div>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">Start Date</p>
                      <p className="text-sm font-bold tracking-wider">{mockMembership.startDate}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">Expiry Date</p>
                      <p className="text-sm font-bold tracking-wider">{mockMembership.expiryDate}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 relative z-10">
                    <div>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">Days Remaining</p>
                      <p className="text-3xl font-black text-gym-red">{mockMembership.daysRemaining}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">Membership ID</p>
                      <p className="text-sm font-mono tracking-widest text-white/80">{mockMembership.memberId}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ==========================================
              TAB 3: ATTEND (QR & History)
          ========================================== */}
          {activeTab === 'attend' && (
            <motion.div 
              key="attend" 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            >
              <motion.h2 variants={itemVariants} className="text-4xl font-black uppercase tracking-tighter mb-10 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Attendance</motion.h2>

              <motion.button 
                variants={itemVariants} 
                onClick={() => setShowQRScanner(true)}
                className="w-full bg-gym-red hover:bg-white hover:text-black text-white font-black text-sm uppercase tracking-widest py-5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_30px_rgba(255,51,51,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] mb-10"
              >
                <ScanLine className="w-5 h-5" /> SCAN QR TO CHECK IN
              </motion.button>

              <motion.div variants={itemVariants} className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl">
                <div className="bg-[#080808] rounded-[15px] overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-white/5 bg-[#0a0a0a]">
                    <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">September History</h3>
                  </div>
                  
                  <div className="divide-y divide-white/5">
                    {attendanceLog.map((log, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-6 hover:bg-[#111] transition-colors"
                      >
                        <div>
                          <p className="font-bold text-sm tracking-wider mb-1">{log.date}</p>
                          <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">{log.time}</p>
                        </div>
                        <div className={`font-black text-lg ${log.status === '✓' ? 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-white/20'}`}>
                          {log.status}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ==========================================
              TAB 4: FEES (Payment, History, Receipts)
          ========================================== */}
          {activeTab === 'fees' && (
            <motion.div 
              key="fees" 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            >
              <motion.h2 variants={itemVariants} className="text-4xl font-black uppercase tracking-tighter mb-10 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Fees & Payments</motion.h2>

              <motion.div variants={itemVariants} className="bg-gradient-to-br from-gym-red/30 to-transparent p-[1px] rounded-2xl mb-12">
                <div className="bg-[#080808]/90 backdrop-blur-xl rounded-[15px] p-8 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gym-red/20 blur-[50px] rounded-full pointer-events-none"></div>
                  
                  <h3 className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    Select Renewal Plan
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {plans.map(plan => (
                      <div 
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPlan === plan.id ? 'border-gym-red bg-gym-red/10 shadow-[0_0_15px_rgba(255,51,51,0.2)]' : 'border-white/10 hover:border-white/30'}`}
                      >
                        <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${selectedPlan === plan.id ? 'text-gym-red' : 'text-white/50'}`}>{plan.duration}</p>
                        <p className="text-xl font-black">₹{plan.price}</p>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handlePayment}
                    disabled={isProcessingPayment || paymentSuccess}
                    className="w-full bg-gym-red hover:bg-white hover:text-black text-white font-black text-sm uppercase tracking-widest py-5 rounded-xl shadow-[0_0_30px_rgba(255,51,51,0.3)] transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isProcessingPayment ? (
                      <span className="animate-pulse">Processing...</span>
                    ) : paymentSuccess ? (
                      <><CheckCircle2 className="w-5 h-5" /> PAYMENT SUCCESSFUL</>
                    ) : (
                      'PAY NOW SECURELY'
                    )}
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Payment History & Receipts</h3>
                <div className="space-y-4">
                  {paymentHistory.map((payment, i) => (
                    <motion.div 
                      key={payment.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-gradient-to-r from-[#0a0a0a] to-[#080808] border border-white/5 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between hover:border-white/20 transition-all duration-300 shadow-lg group"
                    >
                      <div className="mb-4 md:mb-0">
                        <p className="font-black text-lg mb-1 tracking-wider text-white/90 group-hover:text-white transition-colors">₹{payment.amount.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{payment.date} • {payment.plan}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedReceipt(payment.id)}
                        className="text-[9px] font-bold uppercase tracking-widest text-white/80 hover:text-gym-red hover:bg-gym-red/10 transition-all duration-300 px-6 py-3 border border-white/10 hover:border-gym-red/30 rounded-lg flex items-center justify-center gap-2"
                      >
                        <FileText className="w-3 h-3" /> View Receipt
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ==========================================
              TAB 5: MORE (Settings, Profile, Stats)
          ========================================== */}
          {activeTab === 'more' && (
            <motion.div 
              key="more" 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            >
              <motion.h2 variants={itemVariants} className="text-4xl font-black uppercase tracking-tighter mb-10 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">My Profile</motion.h2>

              {/* Profile Card */}
              <motion.div variants={itemVariants} className="bg-gradient-to-br from-gym-red/30 to-transparent p-[1px] rounded-2xl mb-8">
                <div className="bg-[#080808]/90 backdrop-blur-xl rounded-[15px] p-8 relative overflow-hidden shadow-2xl flex items-center gap-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gym-red/20 blur-[50px] rounded-full pointer-events-none"></div>
                  
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gym-red to-red-900 p-[2px] shadow-[0_0_20px_rgba(255,51,51,0.4)] flex-shrink-0">
                    <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center overflow-hidden">
                       <User className="w-8 h-8 text-white/50" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-wider">{user?.name || 'Member'}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                      <p className="text-gym-red text-[10px] font-bold tracking-[0.2em] uppercase">Premium Member</p>
                    </div>
                    <p className="text-white/40 text-[10px] font-mono tracking-widest mt-2">{user?.phone || '+91 98765 43210'}</p>
                  </div>
                </div>
              </motion.div>

              {/* Fitness Stats */}
              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 mb-12">
                <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl">
                  <div className="bg-[#0a0a0a] rounded-[15px] p-4 text-center shadow-lg h-full">
                    <div className="w-8 h-8 rounded-full bg-gym-red/10 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(255,51,51,0.2)]">
                      <Activity className="w-4 h-4 text-gym-red" />
                    </div>
                    <p className="text-2xl font-black">24</p>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">Workouts</p>
                  </div>
                </div>
                <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl">
                  <div className="bg-[#0a0a0a] rounded-[15px] p-4 text-center shadow-lg h-full">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                      <Flame className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-2xl font-black">5</p>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">Day Streak</p>
                  </div>
                </div>
                <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl">
                  <div className="bg-[#0a0a0a] rounded-[15px] p-4 text-center shadow-lg h-full">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                      <Timer className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-black">32h</p>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">Active Time</p>
                  </div>
                </div>
              </motion.div>

              {/* Settings Menu */}
              <motion.div variants={itemVariants} className="mb-12">
                <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Account Settings
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Bell, title: 'Notifications', desc: 'Workout reminders, alerts' },
                    { icon: Shield, title: 'Privacy & Security', desc: 'Manage your password' },
                    { icon: Smartphone, title: 'App Settings', desc: 'Theme and language' },
                    { icon: HelpCircle, title: 'Help & Support', desc: 'Contact gym admin' },
                    { icon: Info, title: 'About FitZone', desc: 'Version 1.0.0, Terms' },
                  ].map((opt, i) => (
                    <div key={i} className="group bg-gradient-to-r from-[#0a0a0a] to-[#080808] hover:from-[#111] hover:to-[#0a0a0a] border border-white/5 hover:border-gym-red/30 p-5 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-300 shadow-lg">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-lg bg-white/5 group-hover:bg-gym-red/10 flex items-center justify-center transition-colors">
                          <opt.icon className="w-5 h-5 text-white/50 group-hover:text-gym-red transition-colors" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold tracking-wider text-white/90 group-hover:text-white">{opt.title}</h4>
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">{opt.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gym-red group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.button 
                variants={itemVariants}
                onClick={logout}
                className="w-full flex items-center justify-center p-5 bg-[#0a0a0a] hover:bg-gym-red/10 border border-white/5 hover:border-gym-red/50 rounded-xl transition-all duration-300 group text-gym-red shadow-lg mb-4"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-black text-xs uppercase tracking-widest">Sign Out</span>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ==========================================
          MODALS
      ========================================== */}
      
      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showQRScanner && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative"
            >
              <button 
                onClick={() => setShowQRScanner(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white bg-white/5 hover:bg-gym-red p-2 rounded-full transition-all duration-300 z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-10 text-center relative z-10 flex flex-col items-center">
                 <h3 className="text-xl font-black uppercase tracking-widest mb-8">Scan to Check-In</h3>
                 <div className="w-64 h-64 border-4 border-gym-red/30 rounded-xl mb-6 relative overflow-hidden flex items-center justify-center bg-black">
                    <motion.div 
                      animate={{ y: [-128, 128, -128] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute w-full h-[2px] bg-gym-red shadow-[0_0_15px_rgba(255,51,51,1)]" 
                    />
                    <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover bg-center"></div>
                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest z-10 bg-black/50 px-2 py-1 rounded">Camera Feed</p>
                 </div>
                 <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Align QR Code within frame</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-gym-red/10 blur-[50px] rounded-full pointer-events-none"></div>
              
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="absolute top-6 right-6 text-white/40 hover:text-white bg-white/5 hover:bg-gym-red p-2 rounded-full transition-all duration-300 z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-10 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent text-center relative z-10">
                <img src="/logo.jpg" alt="FIT ZONE" className="h-10 w-auto object-contain mx-auto mb-4 bg-white p-1 rounded-sm shadow-xl" />
                <h3 className="text-xl font-black uppercase tracking-widest mb-2">Fit Zone Gym</h3>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Premium Fitness Center</p>
              </div>
              
              <div className="p-10 relative z-10">
                <div className="text-center mb-10">
                  <p className="text-xs font-black tracking-widest uppercase text-gym-red mb-2 bg-gym-red/10 inline-block px-4 py-1.5 rounded-full border border-gym-red/20">Official Receipt</p>
                  <p className="text-[10px] text-white/40 font-mono tracking-widest mt-4">ID: {selectedReceipt}</p>
                </div>
                
                <div className="space-y-5 text-[11px] font-bold uppercase tracking-wider">
                  <div className="flex justify-between border-b border-white/5 pb-3">
                    <span className="text-white/40">Member Name</span>
                    <span className="text-white/90">{user?.name || 'Rohith Kannan'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-3">
                    <span className="text-white/40">Subscribed Plan</span>
                    <span className="text-white/90">6 Months</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-3">
                    <span className="text-white/40">Amount Paid</span>
                    <span className="font-black text-gym-red text-base">₹7,000</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-3">
                    <span className="text-white/40">Payment Method</span>
                    <span className="text-white/90">UPI Transfer</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-3">
                    <span className="text-white/40">Transaction Date</span>
                    <span className="text-white/90">16 September 2026</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-3">
                    <span className="text-white/40">Payment Status</span>
                    <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">SUCCESS</span>
                  </div>
                </div>
                
                <button className="w-full mt-10 bg-white/5 hover:bg-white text-white/80 hover:text-black font-black text-[10px] uppercase tracking-widest py-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 border border-white/10">
                  <Download className="w-4 h-4" /> Download PDF Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MemberDashboard;

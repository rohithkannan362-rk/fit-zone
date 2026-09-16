import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, IndianRupee, LayoutDashboard, CheckCircle2, Search, Plus, Activity, Bell, Send, ArrowUpRight, TrendingUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notificationMsg, setNotificationMsg] = useState('');
  const [notificationSent, setNotificationSent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Active Members', value: '198', icon: <Users className="w-5 h-5 text-gym-red" />, change: 'Total: 247', trend: '+12% vs last month' },
    { label: 'Expiring Soon', value: '19', icon: <Activity className="w-5 h-5 text-gym-red" />, change: 'Expired: 30', trend: 'Requires attention' },
    { label: 'Today\'s Check-ins', value: '47', icon: <CheckCircle2 className="w-5 h-5 text-gym-red" />, change: 'Avg: 120/day', trend: 'Peak at 6:00 PM' },
    { label: 'Today\'s Revenue', value: '₹14K', icon: <IndianRupee className="w-5 h-5 text-gym-red" />, change: 'Target: ₹50K', trend: '+5% this week' }
  ];

  const allMembers = [
    { id: 'FZG00142', name: 'Rohith Kannan', plan: '6 Months', status: 'ACTIVE', expiry: '16 Oct 2026' },
    { id: 'FZG00143', name: 'Priya Singh', plan: '12 Months', status: 'ACTIVE', expiry: '20 Nov 2026' },
    { id: 'FZG00144', name: 'Amit Patel', plan: '1 Month', status: 'EXPIRING', expiry: '18 Sep 2026' },
    { id: 'FZG00145', name: 'Neha Sharma', plan: '3 Months', status: 'EXPIRED', expiry: '10 Sep 2026' },
    { id: 'FZG00146', name: 'Karan Raj', plan: '12 Months', status: 'ACTIVE', expiry: '05 Jan 2027' },
  ];

  const filteredMembers = allMembers.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    member.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allPayments = [
    { name: 'Rohith Kannan', amount: 7000, status: 'PAID', date: 'Today, 09:42 AM', method: 'UPI' },
    { name: 'Arun Kumar', amount: 3000, status: 'PAID', date: 'Today, 08:15 AM', method: 'Card' },
    { name: 'Karthik Raja', amount: 1000, status: 'PAID', date: 'Yesterday, 06:30 PM', method: 'Cash' },
    { name: 'Vijay S', amount: 10000, status: 'PAID', date: '15 Sep, 10:00 AM', method: 'UPI' },
  ];

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationMsg) return;
    setNotificationMsg('');
    setNotificationSent(true);
    setTimeout(() => setNotificationSent(false), 3000);
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
    <div className="min-h-screen bg-[#030303] text-white flex overflow-hidden selection:bg-gym-red selection:text-white font-sans relative">
      
      {/* Background Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gym-red/5 rounded-full mix-blend-screen filter blur-[150px] opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gym-red/5 rounded-full mix-blend-screen filter blur-[150px] opacity-30"></div>
        {/* <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div> */}
      </div>

      {/* Sidebar - Premium Glassmorphism */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-72 bg-[#080808]/80 backdrop-blur-2xl border-r border-white/5 flex flex-col relative z-20 shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gym-red/10 blur-3xl rounded-full"></div>
          <div className="bg-white p-1.5 rounded-sm shadow-[0_0_15px_rgba(255,51,51,0.2)]">
            <img src="/logo.jpg" alt="FIT ZONE" className="h-8 w-auto object-contain" />
          </div>
          <div>
            <span className="font-black text-sm tracking-widest uppercase block leading-none">Admin<span className="text-gym-red">Zone</span></span>
            <span className="text-white/40 text-[8px] font-bold uppercase tracking-[0.2em] mt-1 block">Command Center</span>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-4">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'members', icon: Users, label: 'Manage Members' },
            { id: 'payments', icon: IndianRupee, label: 'Monitor Payments' },
            { id: 'attendance', icon: Activity, label: 'Monitor Attendance' },
            { id: 'notify', icon: Bell, label: 'Send Notifications' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 font-bold uppercase tracking-widest text-[10px] rounded-lg relative overflow-hidden group ${
                activeTab === item.id 
                  ? 'text-white bg-white/5 border border-white/10' 
                  : 'text-white/40 hover:bg-white/[0.02] hover:text-white'
              }`}
            >
              {activeTab === item.id && (
                <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-gradient-to-r from-gym-red/20 to-transparent opacity-50 z-0" />
              )}
              {activeTab === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gym-red shadow-[0_0_10px_rgba(255,51,51,0.8)] z-10" />
              )}
              
              <item.icon className={`w-5 h-5 relative z-10 transition-colors ${activeTab === item.id ? 'text-gym-red' : 'group-hover:text-white'}`} />
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-between px-6 py-4 bg-[#0a0a0a] border border-white/5 hover:border-gym-red/50 text-white/50 hover:text-gym-red transition-all duration-300 font-bold uppercase tracking-widest text-[10px] rounded-lg group shadow-lg"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-2 translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all" />
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10 p-12 scroll-smooth">
        <div className="max-w-6xl mx-auto">
          
          <AnimatePresence mode="wait">
            
            {/* ==============================
                1. DASHBOARD OVERVIEW
            ============================== */}
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard" 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              >
                <motion.div variants={itemVariants} className="mb-12 flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 bg-gradient-to-r from-white via-white/90 to-white/40 bg-clip-text text-transparent">FIT ZONE <span className="text-gym-red">ADMIN</span></h1>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"></span>
                      System Online & Real-time
                    </p>
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3 shadow-2xl">
                    <div className="text-right">
                      <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Today</p>
                      <p className="text-xs font-bold uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {stats.map((stat, i) => (
                    <motion.div key={i} variants={itemVariants} className="group relative h-full">
                      <div className="relative h-full w-full bg-gradient-to-b from-white/[0.08] to-transparent rounded-2xl p-[1px] transition-all duration-500 group-hover:from-gym-red/50">
                        <div className="bg-[#080808] h-full w-full rounded-[15px] p-6 relative overflow-hidden flex flex-col justify-between">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gym-red/5 blur-3xl rounded-full transition-all duration-500 group-hover:bg-gym-red/20 group-hover:scale-150"></div>
                          
                          <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10 shadow-lg group-hover:scale-110 group-hover:border-gym-red/30 transition-all duration-500">
                              {stat.icon}
                            </div>
                            <span className="text-[9px] font-bold tracking-widest uppercase text-white/30 flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                              <TrendingUp className="w-3 h-3" /> 24h
                            </span>
                          </div>
                          
                          <div className="relative z-10">
                            <h3 className="text-4xl font-black mb-1 tracking-tight text-white/90">{stat.value}</h3>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4">{stat.label}</p>
                            
                            <div className="flex items-center justify-between border-t border-white/5 pt-4">
                              <span className="text-[10px] font-bold tracking-widest uppercase text-white/60">
                                {stat.change}
                              </span>
                              <span className="text-[9px] font-bold tracking-wider uppercase text-gym-red/80">
                                {stat.trend}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Quick Actions Area */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl">
                    <div className="bg-[#080808] h-full w-full rounded-[15px] p-8">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black uppercase tracking-widest">Recent Activity</h3>
                        <button className="text-[10px] text-gym-red hover:text-white font-bold uppercase tracking-widest transition-colors flex items-center gap-1">
                          View All <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {[
                          { action: 'New member joined', user: 'Rahul K.', time: '10 mins ago', type: 'join' },
                          { action: 'Payment received ₹7,000', user: 'Priya S.', time: '45 mins ago', type: 'pay' },
                          { action: 'Membership renewed', user: 'Amit P.', time: '2 hours ago', type: 'renew' },
                        ].map((log, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`w-2 h-2 rounded-full ${log.type === 'join' ? 'bg-green-500' : log.type === 'pay' ? 'bg-gym-red' : 'bg-blue-500'} shadow-[0_0_10px_currentColor]`} />
                              <div>
                                <p className="text-xs font-bold tracking-wider">{log.action}</p>
                                <p className="text-[10px] font-medium text-white/40 tracking-widest uppercase mt-0.5">{log.user}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{log.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gym-red/20 via-[#080808] to-[#080808] p-[1px] rounded-2xl relative overflow-hidden">
                    {/* <div className="absolute top-0 right-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay"></div> */}
                    <div className="bg-[#080808]/90 backdrop-blur-xl h-full w-full rounded-[15px] p-8 flex flex-col justify-center items-center text-center relative z-10">
                      <div className="w-16 h-16 rounded-full bg-gym-red/10 border border-gym-red/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,51,51,0.2)]">
                        <Plus className="w-8 h-8 text-gym-red" />
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-widest mb-2">Add Member</h3>
                      <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-8 leading-relaxed">Quickly register a new member into the system and assign a plan.</p>
                      <button onClick={() => navigate('/register')} className="w-full bg-gym-red hover:bg-white hover:text-black text-white font-bold text-[10px] uppercase tracking-widest py-4 rounded-lg shadow-[0_0_20px_rgba(255,51,51,0.3)] transition-all flex items-center justify-center gap-2">
                        Start Registration <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ==============================
                2. MANAGE MEMBERS
            ============================== */}
            {activeTab === 'members' && (
              <motion.div 
                key="members" 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              >
                <motion.div variants={itemVariants} className="flex justify-between items-end mb-10">
                  <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Manage Members</h2>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Member Directory & Control</p>
                  </div>
                  <button onClick={() => navigate('/register')} className="bg-gym-red hover:bg-white hover:text-black text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 rounded-lg shadow-[0_0_20px_rgba(255,51,51,0.3)]">
                    <Plus className="w-4 h-4" /> New Member
                  </button>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl">
                  <div className="bg-[#080808] rounded-[15px] overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/5 bg-[#0a0a0a]">
                      <div className="relative max-w-md">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="SEARCH MEMBERS BY NAME OR ID..." 
                          className="w-full bg-[#111] border border-white/10 rounded-lg py-3.5 pl-12 pr-4 text-[10px] font-bold tracking-widest uppercase text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors shadow-inner"
                        />
                      </div>
                    </div>
                    
                    <div className="divide-y divide-white/5">
                      {filteredMembers.length > 0 ? filteredMembers.map((member, i) => (
                        <motion.div 
                          key={member.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-6 flex items-center justify-between hover:bg-[#111] transition-colors group"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-black text-white/40 border border-white/10 group-hover:border-gym-red/50 transition-colors">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm uppercase tracking-wider mb-1 text-white/90">{member.name}</h3>
                              <p className="text-[10px] font-mono tracking-widest text-white/40">{member.id}</p>
                            </div>
                          </div>
                          
                          <div className="flex-1 max-w-[200px] text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-full border ${
                              member.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                              member.status === 'EXPIRING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-gym-red/10 text-gym-red border-gym-red/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'ACTIVE' ? 'bg-green-500' : member.status === 'EXPIRING' ? 'bg-yellow-500' : 'bg-gym-red'} animate-pulse`} />
                              {member.status}
                            </span>
                          </div>
                          
                          <div className="text-right pr-8">
                            <p className="font-bold text-xs uppercase tracking-wider mb-1">{member.plan} Plan</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Expires: <span className="text-white/70">{member.expiry}</span></p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button className="px-4 py-2 bg-white/5 hover:bg-white hover:text-black text-[9px] font-bold uppercase tracking-widest rounded transition-all duration-300">Manage</button>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="p-12 text-center text-white/40 text-xs font-bold uppercase tracking-widest">
                          No members found matching "{searchQuery}"
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* 3. MONITOR PAYMENTS */}
            {activeTab === 'payments' && (
              <motion.div 
                key="payments" 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              >
                <motion.div variants={itemVariants} className="mb-10">
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Monitor Payments</h2>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Revenue & Transaction Log</p>
                </motion.div>
                
                <motion.div variants={itemVariants} className="flex gap-4 mb-8">
                  {['Today', 'This Week', 'This Month', 'All Time'].map((filter, i) => (
                    <button key={i} className={`px-6 py-2.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                      i === 0 ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-[#0a0a0a] border border-white/5 text-white/50 hover:text-white hover:border-white/20'
                    }`}>
                      {filter}
                    </button>
                  ))}
                </motion.div>

                <motion.div variants={itemVariants} className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl">
                  <div className="bg-[#080808] rounded-[15px] overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-4 gap-4 p-6 border-b border-white/5 bg-[#0a0a0a] text-[9px] font-bold uppercase tracking-widest text-white/40">
                      <div>Member</div>
                      <div>Amount</div>
                      <div>Date & Method</div>
                      <div className="text-right">Status</div>
                    </div>
                    <div className="divide-y divide-white/5">
                      {allPayments.map((payment, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="grid grid-cols-4 gap-4 p-6 items-center hover:bg-[#111] transition-colors"
                        >
                          <h3 className="font-bold text-xs uppercase tracking-wider">{payment.name}</h3>
                          <p className="font-black text-lg text-white/90">₹{payment.amount.toLocaleString()}</p>
                          <div>
                            <p className="text-xs font-bold tracking-wider mb-1">{payment.date}</p>
                            <p className="text-[9px] font-bold tracking-widest uppercase text-white/40">{payment.method}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 text-[9px] font-bold uppercase tracking-widest rounded-md">
                              {payment.status}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* 4. MONITOR ATTENDANCE */}
            {activeTab === 'attendance' && (
              <motion.div 
                key="attendance" 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              >
                <motion.div variants={itemVariants} className="mb-10">
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Monitor Attendance</h2>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Live Gym Capacity</p>
                </motion.div>
                
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-gym-red/20 via-[#080808] to-[#080808] p-[1px] rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gym-red/10 blur-3xl rounded-full transition-all duration-500 group-hover:bg-gym-red/30"></div>
                    <div className="bg-[#0a0a0a]/90 backdrop-blur-xl h-full w-full rounded-[15px] p-8 relative z-10">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gym-red animate-pulse" /> Live Status
                      </h3>
                      <div className="flex items-center gap-12">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Total Members</p>
                          <p className="text-4xl font-black text-white/90">247</p>
                        </div>
                        <div className="h-12 w-px bg-white/10"></div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Checked In Today</p>
                          <p className="text-4xl font-black text-gym-red">47</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl">
                  <div className="bg-[#080808] rounded-[15px] overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/5 bg-[#0a0a0a]">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Hourly Breakdown
                      </h3>
                    </div>
                    <div className="divide-y divide-white/5">
                      {[
                        { time: '09:00 AM', count: 12, max: 20 },
                        { time: '10:00 AM', count: 18, max: 20 },
                        { time: '11:00 AM', count: 17, max: 20 },
                      ].map((slot, i) => (
                        <div key={i} className="p-6 flex items-center gap-8 hover:bg-[#111] transition-colors group">
                          <p className="font-bold text-xs uppercase tracking-wider text-white/60 w-24 group-hover:text-white transition-colors">{slot.time}</p>
                          <div className="flex-1 h-3 bg-[#111] rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(slot.count / slot.max) * 100}%` }}
                              transition={{ duration: 1, delay: i * 0.2, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-gym-red/50 to-gym-red shadow-[0_0_15px_rgba(255,51,51,0.5)]" 
                            />
                          </div>
                          <div className="w-16 text-right">
                            <p className="font-black text-lg text-white/90">{slot.count}</p>
                            <p className="text-[8px] font-bold uppercase tracking-widest text-white/30">Members</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* 5. SEND NOTIFICATIONS */}
            {activeTab === 'notify' && (
              <motion.div 
                key="notify" 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              >
                <motion.div variants={itemVariants} className="mb-10">
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Send Notifications</h2>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Push Broadcast to Member Apps</p>
                </motion.div>
                
                <motion.div variants={itemVariants} className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl max-w-3xl">
                  <div className="bg-[#080808] rounded-[15px] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gym-red/5 blur-[100px] rounded-full"></div>
                    
                    <form onSubmit={handleSendNotification} className="flex flex-col gap-8 relative z-10">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-3">
                          Notification Title
                        </label>
                        <input 
                          type="text" 
                          defaultValue="Holiday Announcement"
                          className="w-full bg-[#111] border border-white/10 rounded-lg py-4 px-5 text-sm font-bold tracking-wider text-white focus:outline-none focus:border-gym-red/50 focus:bg-[#151515] hover:border-white/20 transition-all shadow-inner"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-3">
                          Broadcast Message
                        </label>
                        <textarea 
                          value={notificationMsg}
                          onChange={(e) => setNotificationMsg(e.target.value)}
                          placeholder="Type your message here..."
                          className="w-full bg-[#111] border border-white/10 rounded-lg py-4 px-5 text-sm font-medium tracking-wide text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red/50 focus:bg-[#151515] hover:border-white/20 transition-all h-40 resize-none shadow-inner"
                        />
                      </div>
                      
                      <button 
                        type="submit" 
                        className="bg-gym-red hover:bg-white hover:text-black text-white px-8 py-5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,51,51,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] mt-2"
                      >
                        <Send className="w-4 h-4" /> Broadcast to All Members
                      </button>
                      
                      <AnimatePresence>
                        {notificationSent && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-green-500/10 border border-green-500/30 text-green-500 p-5 rounded-lg flex items-center gap-3 text-xs font-bold uppercase tracking-widest backdrop-blur-sm"
                          >
                            <CheckCircle2 className="w-5 h-5" /> Message Broadcasted Successfully
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </form>
                  </div>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

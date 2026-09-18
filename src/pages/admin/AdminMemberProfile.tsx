import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, CreditCard, Calendar, Clock, Mail, Phone, PauseCircle, PlayCircle, RefreshCw, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMemberByUid } from '../../services/memberService';
import { getCurrentMembership, pauseReminders, resumeReminders } from '../../services/membershipService';
import { getMemberPayments } from '../../services/paymentService';
import { type Member, type Membership, type Payment } from '../../lib/firestore-schema';
import { formatTimestamp, formatCurrency, getMembershipStatus, getDaysRelativeToDue } from '../../utils/dateUtils';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const AdminMemberProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [m, ms, p] = await Promise.all([
        getMemberByUid(id!),
        getCurrentMembership(id!),
        getMemberPayments(id!),
      ]);
      setMember(m);
      setMembership(ms);
      setPayments(p);
    } catch (error) {
      console.error('Error loading member profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseReminders = async (days: number) => {
    if (!membership?.id) return;
    setActionLoading(true);
    try {
      const until = new Date();
      until.setDate(until.getDate() + days);
      await pauseReminders(membership.id, until, `Paused for ${days} days by admin`);
      await loadData();
    } catch (error) {
      console.error('Failed to pause reminders:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeReminders = async () => {
    if (!membership?.id) return;
    setActionLoading(true);
    try {
      await resumeReminders(membership.id);
      await loadData();
    } catch (error) {
      console.error('Failed to resume reminders:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading member..." />;
  if (!member) return <div className="min-h-screen bg-[#030303] flex items-center justify-center text-white">Member not found</div>;

  const status = membership ? getMembershipStatus(membership.endDate.toDate(), membership.nextDueDate.toDate()) : 'inactive';
  const daysRelative = membership ? getDaysRelativeToDue(membership.nextDueDate.toDate()) : 0;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/admin/members" className="text-white/50 hover:text-white flex items-center gap-2 transition-colors mb-10">
          <ChevronLeft className="w-5 h-5" />
          <span className="font-bold tracking-widest text-sm uppercase">Back to Members</span>
        </Link>

        {/* Member Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gym-red/30 to-transparent p-[1px] rounded-2xl mb-8"
        >
          <div className="bg-[#080808]/90 rounded-[15px] p-8 flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gym-red/10 blur-[60px] rounded-full pointer-events-none"></div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gym-red to-red-900 p-[2px] flex-shrink-0">
              <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white/50" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-1">{member.name}</h1>
              <p className="text-white/40 text-[10px] font-mono tracking-widest mb-3">{member.memberCode}</p>
              <div className="flex flex-wrap gap-4 text-[10px] font-bold tracking-widest text-white/50">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {member.email}</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {member.mobile}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {formatTimestamp(member.createdAt)}</span>
              </div>
            </div>
            <StatusBadge status={status} size="md" />
          </div>
        </motion.div>

        {/* Membership Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl mb-8"
        >
          <div className="bg-[#080808] rounded-[15px] p-8">
            <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gym-red" /> Membership
            </h2>

            {membership ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">Package</p>
                    <p className="font-bold tracking-wider">{membership.packageName}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">Amount</p>
                    <p className="font-bold tracking-wider text-gym-red">{formatCurrency(membership.amount)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">Valid Until</p>
                    <p className="font-bold tracking-wider">{formatTimestamp(membership.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">Next Due</p>
                    <p className="font-bold tracking-wider">{formatTimestamp(membership.nextDueDate)}</p>
                    {daysRelative > 0 && <p className="text-[9px] text-white/30">{daysRelative} days left</p>}
                    {daysRelative < 0 && <p className="text-[9px] text-red-500">{Math.abs(daysRelative)} days overdue</p>}
                  </div>
                </div>

                {/* Reminder Status & Actions */}
                <div className="border-t border-white/5 pt-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                      {membership.reminderStatus === 'paused' ? (
                        <>
                          <PauseCircle className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-bold tracking-wider">Reminders Paused</p>
                            {membership.reminderPausedUntil && (
                              <p className="text-[10px] text-white/40">Until {formatTimestamp(membership.reminderPausedUntil)}</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-5 h-5 text-green-500" />
                          <p className="text-sm font-bold tracking-wider">Reminders Active</p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {membership.reminderStatus === 'paused' ? (
                        <button
                          onClick={handleResumeReminders}
                          disabled={actionLoading}
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
                        >
                          Resume Reminders
                        </button>
                      ) : (
                        <>
                          {[7, 15, 30, 60, 90].map(days => (
                            <button
                              key={days}
                              onClick={() => handlePauseReminders(days)}
                              disabled={actionLoading}
                              className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 px-3 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
                            >
                              Hold {days}d
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-white/50 text-sm font-bold uppercase tracking-widest">No active membership</p>
            )}
          </div>
        </motion.div>

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl"
        >
          <div className="bg-[#080808] rounded-[15px] p-8">
            <h2 className="text-sm font-black uppercase tracking-widest mb-6">Payment History</h2>

            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl border border-white/5">
                    <div>
                      <p className="font-bold text-sm tracking-wider">{formatCurrency(payment.amount)}</p>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        {formatTimestamp(payment.paymentDate)} • {payment.packageName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={payment.status} />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{payment.method}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/50 text-sm font-bold uppercase tracking-widest text-center py-8">No payments recorded</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminMemberProfile;

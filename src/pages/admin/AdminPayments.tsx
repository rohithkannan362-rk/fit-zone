import { useState, useEffect } from 'react';
import { IndianRupee, Download, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllPayments } from '../../services/paymentService';
import { type Payment } from '../../lib/firestore-schema';
import { formatTimestamp, formatCurrency } from '../../utils/dateUtils';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const p = await getAllPayments();
      setPayments(p);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = filter === 'all'
    ? payments
    : payments.filter(p => p.status === filter);

  const totalRevenue = payments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <LoadingSpinner message="Loading payments..." />;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
              Monitor <span className="text-gym-red">Payments</span>
            </h2>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              Total Revenue: {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {['all', 'success', 'pending', 'failed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                filter === f
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                  : 'bg-[#0a0a0a] border border-white/5 text-white/50 hover:text-white hover:border-white/20'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Payments Table */}
        <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl">
          <div className="bg-[#080808] rounded-[15px] overflow-hidden shadow-2xl">
            <div className="hidden md:grid grid-cols-5 gap-4 p-6 border-b border-white/5 bg-[#0a0a0a] text-[9px] font-bold uppercase tracking-widest text-white/40">
              <div>Package</div>
              <div>Amount</div>
              <div>Date</div>
              <div>Method</div>
              <div className="text-right">Status</div>
            </div>

            {filteredPayments.length > 0 ? (
              <div className="divide-y divide-white/5">
                {filteredPayments.map((payment, i) => (
                  <motion.div
                    key={payment.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.5) }}
                    className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5 items-center hover:bg-[#111] transition-colors"
                  >
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider">{payment.packageName}</h3>
                      <p className="text-[9px] text-white/40 font-mono md:hidden">{formatTimestamp(payment.paymentDate)}</p>
                    </div>
                    <div className="text-right md:text-left">
                      <p className="font-black text-lg text-white/90">{formatCurrency(payment.amount)}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-xs font-bold tracking-wider">{formatTimestamp(payment.paymentDate, 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/60">{payment.method}</p>
                    </div>
                    <div className="hidden md:flex justify-end">
                      <StatusBadge status={payment.status} />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState icon={IndianRupee} title="No payments found" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;

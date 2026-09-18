import { useState, useEffect } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllMembers } from '../../services/memberService';
import { getAllMemberships } from '../../services/membershipService';
import { getAllPayments } from '../../services/paymentService';
import { type Member, type Membership, type Payment } from '../../lib/firestore-schema';
import { formatTimestamp, formatCurrency, getMembershipStatus } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF types for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const AdminReports = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [m, ms, p] = await Promise.all([
        getAllMembers(),
        getAllMemberships(),
        getAllPayments(),
      ]);
      setMembers(m);
      setMemberships(ms);
      setPayments(p);
    } catch (error) {
      console.error('Failed to load data for reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMemberMembership = (memberId: string): Membership | undefined => {
    return memberships.find(ms => ms.memberId === memberId);
  };

  const createPdfHeader = (doc: jsPDF, title: string) => {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FIT ZONE', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(title, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 34);
    doc.setTextColor(0);
    doc.setDrawColor(255, 51, 51);
    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);
    return 44;
  };

  const generateAllMembersReport = async () => {
    setGenerating('all');
    try {
      const doc = new jsPDF();
      const startY = createPdfHeader(doc, 'All Members Report');

      const rows = members.map(m => {
        const ms = getMemberMembership(m.id!);
        const status = ms ? getMembershipStatus(ms.endDate.toDate(), ms.nextDueDate.toDate()) : 'inactive';
        return [
          m.memberCode,
          m.name,
          m.mobile,
          ms?.packageName || '—',
          status.toUpperCase().replace('_', ' '),
          ms ? formatTimestamp(ms.nextDueDate) : '—',
        ];
      });

      doc.autoTable({
        startY,
        head: [['Code', 'Name', 'Mobile', 'Package', 'Status', 'Due Date']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [255, 51, 51], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: startY },
      });

      doc.save(`FitZone_All_Members_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setGenerating('');
    }
  };

  const generateOverdueReport = async () => {
    setGenerating('overdue');
    try {
      const doc = new jsPDF();
      const startY = createPdfHeader(doc, 'Overdue Members Report');

      const overdue = members.filter(m => {
        const ms = getMemberMembership(m.id!);
        if (!ms) return false;
        return getMembershipStatus(ms.endDate.toDate(), ms.nextDueDate.toDate()) === 'overdue';
      });

      const rows = overdue.map(m => {
        const ms = getMemberMembership(m.id!)!;
        return [
          m.memberCode,
          m.name,
          m.mobile,
          ms.packageName,
          formatTimestamp(ms.nextDueDate),
          formatCurrency(ms.amount),
        ];
      });

      doc.autoTable({
        startY,
        head: [['Code', 'Name', 'Mobile', 'Package', 'Due Date', 'Amount']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [220, 50, 50], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
      });

      doc.save(`FitZone_Overdue_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setGenerating('');
    }
  };

  const generatePaymentReport = async () => {
    setGenerating('payments');
    try {
      const doc = new jsPDF();
      const startY = createPdfHeader(doc, 'Payment Report');

      const successPayments = payments.filter(p => p.status === 'success');
      const total = successPayments.reduce((sum, p) => sum + p.amount, 0);

      doc.setFontSize(12);
      doc.text(`Total Revenue: ${formatCurrency(total)}`, 14, startY);

      const rows = successPayments.map(p => [
        p.packageName,
        formatCurrency(p.amount),
        formatTimestamp(p.paymentDate),
        p.method.toUpperCase(),
        p.providerPaymentId || p.id || '—',
      ]);

      doc.autoTable({
        startY: startY + 8,
        head: [['Package', 'Amount', 'Date', 'Method', 'Payment ID']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [255, 51, 51], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
      });

      doc.save(`FitZone_Payments_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setGenerating('');
    }
  };

  const reports = [
    {
      id: 'all',
      title: 'All Members',
      description: 'Complete list of all registered members with their plan and status',
      action: generateAllMembersReport,
    },
    {
      id: 'overdue',
      title: 'Overdue Members',
      description: 'Members whose payments are overdue',
      action: generateOverdueReport,
    },
    {
      id: 'payments',
      title: 'Payment Report',
      description: 'All successful payments with revenue totals',
      action: generatePaymentReport,
    },
  ];

  if (loading) return <LoadingSpinner message="Preparing reports..." />;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
            Export <span className="text-gym-red">Reports</span>
          </h2>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
            Generate PDF reports
          </p>
        </div>

        <div className="space-y-4">
          {reports.map((report) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl"
            >
              <div className="bg-[#080808] rounded-[15px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <FileText className="w-5 h-5 text-gym-red" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest mb-1">{report.title}</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{report.description}</p>
                  </div>
                </div>
                <button
                  onClick={report.action}
                  disabled={generating === report.id}
                  className="bg-gym-red hover:bg-white hover:text-black text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 rounded-lg disabled:opacity-50"
                >
                  {generating === report.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating</>
                  ) : (
                    <><Download className="w-4 h-4" /> Download PDF</>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;

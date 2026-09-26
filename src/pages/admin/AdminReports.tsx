import { useState, useEffect } from "react";
import { FileText, Printer, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getAllMembers } from "../../services/memberService";
import { getAllMemberships } from "../../services/membershipService";
import { getAllPayments } from "../../services/paymentService";
import {
  type Profile,
  type Membership,
  type Payment,
} from "../../lib/supabase-types";
import {
  formatTimestamp,
  formatCurrency,
  getMembershipStatus,
} from "../../utils/dateUtils";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import BackButton from "../../components/ui/BackButton";

const AdminReports = () => {
  const [members, setMembers] = useState<Profile[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState("");
  
  // Print View State
  const [printData, setPrintData] = useState<{
    title: string;
    subtitle?: string;
    headers: string[];
    rows: (string | number)[][];
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (printData) {
      setTimeout(() => {
        window.print();
        setPrintData(null);
        setGenerating("");
      }, 500);
    }
  }, [printData]);

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
      console.error("Failed to load data for reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMemberMembership = (memberId: string): Membership | undefined => {
    return memberships.find((ms) => ms.member_id === memberId);
  };

  const generateAllMembersReport = () => {
    setGenerating("all");
    const rows = members.map((m) => {
      const ms = getMemberMembership(m.id);
      const status = ms
        ? getMembershipStatus(
            new Date(ms.end_date),
            new Date(ms.next_due_date),
          )
        : "inactive";
      return [
        m.member_code,
        m.full_name,
        m.mobile,
        ms?.package_name || "—",
        status.toUpperCase().replace("_", " "),
        ms ? formatTimestamp(ms.next_due_date) : "—",
      ];
    });

    setPrintData({
      title: "All Members Report",
      headers: ["Code", "Name", "Mobile", "Package", "Status", "Due Date"],
      rows,
    });
  };

  const generateOverdueReport = () => {
    setGenerating("overdue");
    const overdue = members.filter((m) => {
      const ms = getMemberMembership(m.id);
      if (!ms) return false;
      return (
        getMembershipStatus(
          new Date(ms.end_date),
          new Date(ms.next_due_date),
        ) === "overdue"
      );
    });

    const rows = overdue.map((m) => {
      const ms = getMemberMembership(m.id)!;
      return [
        m.member_code,
        m.full_name,
        m.mobile,
        ms.package_name,
        formatTimestamp(ms.next_due_date),
        formatCurrency(ms.amount),
      ];
    });

    setPrintData({
      title: "Overdue Members Report",
      headers: ["Code", "Name", "Mobile", "Package", "Due Date", "Amount"],
      rows,
    });
  };

  const generateStatusReport = (
    statusFilter: "active" | "due_soon" | "due_today",
    title: string,
  ) => {
    setGenerating(statusFilter);
    const filtered = members.filter((m) => {
      const ms = getMemberMembership(m.id);
      if (!ms) return false;
      return (
        getMembershipStatus(
          new Date(ms.end_date),
          new Date(ms.next_due_date),
        ) === statusFilter
      );
    });

    const rows = filtered.map((m) => {
      const ms = getMemberMembership(m.id)!;
      return [
        m.member_code,
        m.full_name,
        m.mobile,
        ms.package_name,
        formatTimestamp(ms.next_due_date),
        formatCurrency(ms.amount),
      ];
    });

    setPrintData({
      title,
      headers: ["Code", "Name", "Mobile", "Package", "Due Date", "Amount"],
      rows,
    });
  };

  const generatePaymentReport = () => {
    setGenerating("payments");
    const successPayments = payments.filter((p) => p.status === "verified");
    const total = successPayments.reduce((sum, p) => sum + p.amount, 0);

    const rows = successPayments.map((p) => [
      p.package_name,
      formatCurrency(p.amount),
      formatTimestamp(p.payment_date || p.created_at),
      p.method.toUpperCase(),
      p.provider_payment_id || p.id || "—",
    ]);

    setPrintData({
      title: "Payment Report",
      subtitle: `Total Revenue: ${formatCurrency(total)}`,
      headers: ["Package", "Amount", "Date", "Method", "Payment ID"],
      rows,
    });
  };

  const generateMonthlyRevenueReport = () => {
    setGenerating("monthly");
    const nowISTStr = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const nowIST = new Date(nowISTStr);
    const currentMonth = nowIST.getMonth();
    const currentYear = nowIST.getFullYear();

    const successPayments = payments.filter((p) => {
      if (p.status !== "verified") return false;
      const pDateStr = new Date(p.payment_date || p.created_at).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const pDate = new Date(pDateStr);
      return (
        pDate.getMonth() === currentMonth &&
        pDate.getFullYear() === currentYear
      );
    });

    const total = successPayments.reduce((sum, p) => sum + p.amount, 0);

    const rows = successPayments.map((p) => [
      p.package_name,
      formatCurrency(p.amount),
      formatTimestamp(p.payment_date || p.created_at),
      p.method.toUpperCase(),
      p.provider_payment_id || p.id || "—",
    ]);

    setPrintData({
      title: "Monthly Revenue Report (Current Month)",
      subtitle: `Total Revenue (${nowIST.toLocaleString("en-US", { month: "long", year: "numeric" })}): ${formatCurrency(total)}`,
      headers: ["Package", "Amount", "Date", "Method", "Payment ID"],
      rows,
    });
  };

  const reports = [
    {
      id: "all",
      title: "All Members",
      description:
        "Complete list of all registered members with their plan and status",
      action: generateAllMembersReport,
    },
    {
      id: "active",
      title: "Active Members",
      description: "Members with currently active memberships",
      action: () => generateStatusReport("active", "Active Members Report"),
    },
    {
      id: "due_soon",
      title: "Due Soon Members",
      description: "Memberships expiring in the next 7 days",
      action: () => generateStatusReport("due_soon", "Due Soon Members Report"),
    },
    {
      id: "due_today",
      title: "Due Today Members",
      description: "Memberships expiring today",
      action: () =>
        generateStatusReport("due_today", "Due Today Members Report"),
    },
    {
      id: "overdue",
      title: "Overdue Members",
      description: "Members whose payments are overdue",
      action: generateOverdueReport,
    },
    {
      id: "payments",
      title: "All Payment History",
      description: "All successful payments with revenue totals",
      action: generatePaymentReport,
    },
    {
      id: "monthly",
      title: "Monthly Revenue",
      description: "Revenue specific to the current calendar month",
      action: generateMonthlyRevenueReport,
    },
  ];

  if (loading) return <LoadingSpinner message="Preparing reports..." />;

  return (
    <>
      <div className="min-h-screen bg-[#030303] text-white p-4 sm:p-6 md:p-12 pb-24 md:pb-12 print:hidden">
        <div className="max-w-4xl mx-auto">
          <BackButton to="/admin" label="BACK TO DASHBOARD" />
          <div className="mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter mb-1 sm:mb-2">
              Export <span className="text-gym-red">Reports</span>
            </h2>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              Generate printable reports
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
                <div className="bg-[#080808] rounded-[15px] p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2.5 sm:p-3 bg-white/5 rounded-xl shrink-0">
                      <FileText className="w-5 h-5 text-gym-red" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-widest mb-0.5 sm:mb-1">
                        {report.title}
                      </h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">
                        {report.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={report.action}
                    disabled={generating !== ""}
                    className="w-full md:w-auto justify-center bg-gym-red hover:bg-white hover:text-black text-white px-5 sm:px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 rounded-lg disabled:opacity-50"
                  >
                    {generating === report.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Preparing
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4" /> Print Report
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Print Only View */}
      {printData && (
        <div className="hidden print:block bg-white text-black min-h-screen p-8">
          <div className="border-b-2 border-gym-red pb-4 mb-8">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-gym-red mb-2">FIT ZONE</h1>
            <h2 className="text-xl font-bold">{printData.title}</h2>
            {printData.subtitle && <p className="text-sm font-bold mt-2">{printData.subtitle}</p>}
            <p className="text-[10px] uppercase text-black/50 mt-2">
              Generated: {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} (IST)
            </p>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gym-red text-white">
                {printData.headers.map((h, i) => (
                  <th key={i} className="py-2 px-3 font-bold uppercase tracking-wider border border-gym-red">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {printData.rows.map((row, i) => (
                <tr key={i} className="border-b border-black/10">
                  {row.map((cell, j) => (
                    <td key={j} className="py-2 px-3 border-x border-black/10">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default AdminReports;

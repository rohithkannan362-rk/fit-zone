import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  PauseCircle,
  PlayCircle,
  Clock,
  ChevronRight,
} from "lucide-react";

import {
  getAllMemberships,
  resumeReminders,
} from "../../services/membershipService";
import { getAllMembers } from "../../services/memberService";
import { type Membership, type Profile } from "../../lib/supabase-types";
import { formatTimestamp, getMembershipStatus } from "../../utils/dateUtils";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import BackButton from "../../components/ui/BackButton";

const AdminReminders = () => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"paused" | "upcoming">("paused");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ms, m] = await Promise.all([getAllMemberships(), getAllMembers()]);
      setMemberships(ms);
      setMembers(m);
    } catch (error) {
      console.error("Failed to load reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (memberId: string): string => {
    const m = members.find((mem) => mem.id === memberId);
    return m?.full_name || "Unknown";
  };

  const getMemberCode = (memberId: string): string => {
    const m = members.find((mem) => mem.id === memberId);
    return m?.member_code || "";
  };

  const pausedMemberships = memberships.filter(
    (ms) => ms.reminder_status === "paused",
  );
  const upcomingDue = memberships.filter((ms) => {
    const status = getMembershipStatus(
      new Date(ms.end_date),
      new Date(ms.next_due_date),
    );
    return (
      ["due_soon", "due_today", "overdue"].includes(status) &&
      ms.reminder_status === "active"
    );
  });

  const handleResume = async (membershipId: string) => {
    try {
      await resumeReminders(membershipId);
      await loadData();
    } catch (error) {
      console.error("Failed to resume reminders:", error);
    }
  };

  if (loading) return <LoadingSpinner message="Loading reminders..." />;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <BackButton to="/admin" label="BACK TO DASHBOARD" />
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
            Reminder <span className="text-gym-red">Management</span>
          </h2>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
            {pausedMemberships.length} Paused • {upcomingDue.length} Upcoming
            Due
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          {[
            {
              id: "paused" as const,
              label: "Paused Reminders",
              count: pausedMemberships.length,
            },
            {
              id: "upcoming" as const,
              label: "Upcoming Due",
              count: upcomingDue.length,
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                tab === t.id
                  ? "bg-white text-black"
                  : "bg-[#0a0a0a] border border-white/5 text-white/50 hover:text-white"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl">
          <div className="bg-[#080808] rounded-[15px] overflow-hidden shadow-2xl">
            {tab === "paused" ? (
              pausedMemberships.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {pausedMemberships.map((ms) => (
                    <div
                      key={ms.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#111] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <PauseCircle className="w-5 h-5 text-blue-500" />
                        <div>
                          <Link
                            to={`/admin/members/${ms.member_id}`}
                            className="font-bold text-sm uppercase tracking-wider hover:text-gym-red transition-colors"
                          >
                            {getMemberName(ms.member_id)}
                          </Link>
                          <p className="text-[10px] font-mono text-white/40 tracking-widest">
                            {getMemberCode(ms.member_id)}
                          </p>
                          {ms.reminder_paused_until && (
                            <p className="text-[9px] text-blue-400 tracking-widest">
                              Until {formatTimestamp(ms.reminder_paused_until)}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleResume(ms.id)}
                        className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2"
                      >
                        <PlayCircle className="w-4 h-4" /> Resume
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={PauseCircle}
                  title="No Paused Reminders"
                  description="All member reminders are active"
                />
              )
            ) : upcomingDue.length > 0 ? (
              <div className="divide-y divide-white/5">
                {upcomingDue.map((ms) => {
                  const status = getMembershipStatus(
                    new Date(ms.end_date),
                    new Date(ms.next_due_date),
                  );
                  return (
                    <Link
                      key={ms.id}
                      to={`/admin/members/${ms.member_id}`}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#111] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Clock className="w-5 h-5 text-white/30" />
                        <div>
                          <p className="font-bold text-sm uppercase tracking-wider">
                            {getMemberName(ms.member_id)}
                          </p>
                          <p className="text-[10px] font-mono text-white/40 tracking-widest">
                            Due: {formatTimestamp(ms.next_due_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={status} />
                        <ChevronRight className="w-4 h-4 text-white/20" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Bell}
                title="No Upcoming Due"
                description="All members are within their billing cycle"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReminders;

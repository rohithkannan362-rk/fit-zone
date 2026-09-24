import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronRight, Users } from "lucide-react";
import { motion } from "framer-motion";
import { getAllMembers } from "../../services/memberService";
import { getAllMemberships } from "../../services/membershipService";
import { type Profile, type Membership } from "../../lib/supabase-types";
import { formatTimestamp, getMembershipStatus } from "../../utils/dateUtils";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import BackButton from "../../components/ui/BackButton";

const AdminMembers = () => {
  const [members, setMembers] = useState<Profile[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [m, ms] = await Promise.all([getAllMembers(), getAllMemberships()]);
      setMembers(m);
      setMemberships(ms);
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoading(false);
    }
  };

  // Map member to their latest membership
  const getMemberMembership = (memberId: string): Membership | undefined => {
    return memberships.find((ms) => ms.member_id === memberId);
  };

  const getMemberStatus = (memberId: string): string => {
    const ms = getMemberMembership(memberId);
    if (!ms) return "inactive";
    return getMembershipStatus(
      new Date(ms.end_date),
      new Date(ms.next_due_date),
    );
  };

  // Filter members
  let filteredMembers = members;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredMembers = filteredMembers.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.mobile.includes(searchQuery) ||
        m.member_code.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q),
    );
  }

  if (statusFilter !== "all") {
    filteredMembers = filteredMembers.filter((m) => {
      const ms = getMemberMembership(m.id);

      if (statusFilter === "paused") {
        return ms?.reminder_status === "paused";
      }

      if (statusFilter === "expired") {
        return ms?.status === "expired" || getMemberStatus(m.id) === "expired";
      }

      if (statusFilter === "inactive") {
        return !ms;
      }

      return getMemberStatus(m.id) === statusFilter;
    });
  }

  const statusFilters = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "due_soon", label: "Due Soon" },
    { value: "due_today", label: "Due Today" },
    { value: "overdue", label: "Overdue" },
    { value: "paused", label: "Paused" },
    { value: "expired", label: "Expired" },
    { value: "inactive", label: "No Plan" },
  ];

  if (loading) return <LoadingSpinner message="Loading members..." />;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <BackButton to="/admin" label="BACK TO DASHBOARD" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
              Manage <span className="text-gym-red">Members</span>
            </h2>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              {members.length} Total Members
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/members/new")}
            className="bg-gym-red hover:bg-white hover:text-black text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 rounded-lg shadow-[0_0_20px_rgba(255,51,51,0.3)]"
          >
            <Plus className="w-4 h-4" /> New Member
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#080808] rounded-2xl p-6 mb-6 border border-white/5">
          <div className="relative max-w-md mb-4">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH BY NAME, PHONE, CODE, EMAIL..."
              className="w-full bg-[#111] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-[10px] font-bold tracking-widest uppercase text-white placeholder:text-white/20 focus:outline-none focus:border-gym-red transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                  statusFilter === f.value
                    ? "bg-white text-black"
                    : "bg-[#111] border border-white/5 text-white/50 hover:text-white hover:border-white/20"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Members List */}
        <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-2xl">
          <div className="bg-[#080808] rounded-[15px] overflow-hidden shadow-2xl">
            {filteredMembers.length > 0 ? (
              <div className="divide-y divide-white/5">
                {filteredMembers.map((member, i) => {
                  const ms = getMemberMembership(member.id);
                  const status = getMemberStatus(member.id);
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.5) }}
                      className="p-5 flex items-center justify-between hover:bg-[#111] transition-colors group cursor-pointer"
                      onClick={() => navigate(`/admin/members/${member.id}`)}
                    >
                      <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center font-black text-white/40 border border-white/10 group-hover:border-gym-red/50 transition-colors flex-shrink-0">
                          {member.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm uppercase tracking-wider mb-0.5 text-white/90 break-words whitespace-normal">
                            {member.full_name}
                          </h3>
                          <p className="text-[10px] font-mono tracking-widest text-white/40 break-words whitespace-normal">
                            {member.member_code} • {member.mobile}
                          </p>
                        </div>
                      </div>

                      <div className="hidden md:flex items-center gap-8">
                        <div className="text-center min-w-[100px]">
                          <StatusBadge status={status} />
                        </div>
                        <div className="text-right min-w-[130px]">
                          {ms ? (
                            <>
                              <p className="font-bold text-xs uppercase tracking-wider mb-0.5">
                                {ms.package_name}
                              </p>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                                Due:{" "}
                                <span className="text-white/70">
                                  {formatTimestamp(ms.next_due_date)}
                                </span>
                              </p>
                            </>
                          ) : (
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                              No plan
                            </p>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gym-red group-hover:translate-x-1 transition-all ml-4 flex-shrink-0" />
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No members found"
                description={
                  searchQuery
                    ? `No results for "${searchQuery}"`
                    : "No members registered yet"
                }
                action={
                  !searchQuery
                    ? {
                        label: "Add First Member",
                        onClick: () => navigate("/admin/members/new"),
                      }
                    : undefined
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMembers;

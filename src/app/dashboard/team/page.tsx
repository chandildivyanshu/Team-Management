"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ActivityCard from "@/components/ActivityCard";
import PlanCalendar from "@/components/PlanCalendar";
import ActivityDetailsModal from "@/components/ActivityDetailsModal";
import { ChevronRight, ChevronDown, User, Plus, X, FileText, ArrowLeft, Wand2, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import clsx from "clsx";

interface TeamMember {
    _id: string;
    empId: string;
    name: string;
    role: string;
    mobile?: string;
    profilePicUrl?: string;
}

const TeamNode = ({ member, onSelect, onDelete, refreshTrigger }: { member: TeamMember; onSelect: (m: TeamMember) => void; onDelete: (m: TeamMember) => void; refreshTrigger: number }) => {
    const { data: session } = useSession();
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchChildren = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/users/team?managerId=${member._id}`);
            const data = await res.json();
            if (data.team) {
                setChildren(data.team);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (expanded) {
            fetchChildren();
        }
    }, [refreshTrigger]);

    const handleExpand = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (expanded) {
            setExpanded(false);
            return;
        }
        await fetchChildren();
        setExpanded(true);
    };

    return (
        <div className="ml-2 sm:ml-6 relative">
            {/* Connector Line */}
            <div className="absolute left-[-0.5rem] sm:left-[-1.5rem] top-0 bottom-0 w-px bg-secondary-200 dark:bg-secondary-800" />

            <div
                className="relative flex items-center justify-between p-2 sm:p-4 bg-white dark:bg-secondary-900 rounded-2xl shadow-sm border border-secondary-200 dark:border-secondary-800 mb-2 sm:mb-3 cursor-pointer hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900 transition-all group"
                onClick={() => onSelect(member)}
            >
                <div className="flex items-center min-w-0 flex-1">
                    <button
                        onClick={handleExpand}
                        className="mr-1 sm:mr-3 p-1 sm:p-1.5 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full transition-colors flex-shrink-0"
                    >
                        {loading ? (
                            <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                        ) : expanded ? (
                            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-secondary-400 group-hover:text-primary-500 transition-colors" />
                        ) : (
                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-secondary-400 group-hover:text-primary-500 transition-colors" />
                        )}
                    </button>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-primary-50 dark:bg-secondary-800 flex items-center justify-center mr-2 sm:mr-4 border-2 border-white dark:border-secondary-700 shadow-sm flex-shrink-0">
                        {member.profilePicUrl ? (
                            <img src={member.profilePicUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User className="w-4 h-4 sm:w-6 sm:h-6 text-primary-500" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm sm:text-base text-secondary-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">
                            {member.name}
                        </h4>
                        <div className="flex flex-wrap items-center mt-0.5 gap-y-1">
                            <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 rounded-full whitespace-nowrap">
                                {member.role}
                            </span>
                            <span className="mx-1 sm:mx-2 text-secondary-300 hidden sm:inline">•</span>
                            <span className="text-[10px] sm:text-xs text-secondary-500 font-mono truncate hidden sm:inline">{member.empId}</span>
                        </div>
                    </div>
                </div>

                {session?.user?.role === 'RBM' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(member);
                        }}
                        className="p-1.5 sm:p-2 ml-2 text-secondary-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors flex-shrink-0"
                        title="Delete Employee"
                    >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                )}
            </div>
            {expanded && (
                <div className="ml-2 sm:ml-6 pl-2">
                    {children.map((child) => (
                        <TeamNode key={child._id} member={child} onSelect={onSelect} onDelete={onDelete} refreshTrigger={refreshTrigger} />
                    ))}
                    {children.length === 0 && !loading && (
                        <div className="text-xs sm:text-sm text-secondary-400 ml-2 sm:ml-6 py-2 italic">No direct reports</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function Team() {
    const { data: session } = useSession();
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [memberHistory, setMemberHistory] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        mobile: "",
        password: "",
    });
    const [creating, setCreating] = useState(false);
    const [memberActivities, setMemberActivities] = useState<any[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [directReports, setDirectReports] = useState<TeamMember[]>([]);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'activities' | 'daily-plans'>('activities');
    const [dailyPlans, setDailyPlans] = useState<any[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [teamStats, setTeamStats] = useState<{ total: number; breakdown: Record<string, number> } | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        if (selectedMember) {
            const fetchMemberActivities = async () => {
                setActivitiesLoading(true);
                try {
                    const res = await fetch(`/api/activities?userId=${selectedMember._id}`);
                    const data = await res.json();
                    if (data.activities) {
                        setMemberActivities(data.activities);
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setActivitiesLoading(false);
                }
            };

            const fetchDirectReports = async () => {
                setReportsLoading(true);
                try {
                    const res = await fetch(`/api/users/team?managerId=${selectedMember._id}`);
                    const data = await res.json();
                    if (data.team) {
                        setDirectReports(data.team);
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setReportsLoading(false);
                }
            };

            const fetchDailyPlans = async () => {
                setPlansLoading(true);
                try {
                    const res = await fetch(`/api/dailyplans?userId=${selectedMember._id}`);
                    const data = await res.json();
                    if (data.plans) {
                        setDailyPlans(data.plans);
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setPlansLoading(false);
                }
            };

            const fetchTeamStats = async () => {
                // MDOs cannot see stats
                if (session?.user?.role === 'MDO') {
                    setTeamStats(null);
                    return;
                }

                // Always show stats for the direct report (root of the drill-down)
                const statsContextMember = memberHistory.length > 0 ? memberHistory[0] : selectedMember;

                setStatsLoading(true);
                try {
                    const res = await fetch(`/api/analytics/team-stats?managerId=${statsContextMember._id}`);
                    const data = await res.json();
                    if (data.total !== undefined) {
                        setTeamStats(data);
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setStatsLoading(false);
                }
            };

            fetchMemberActivities();
            fetchDirectReports();
            fetchDailyPlans();
            fetchTeamStats();
        } else {
            setMemberActivities([]);
            setDirectReports([]);
            setDailyPlans([]);
            setTeamStats(null);
        }
    }, [selectedMember, memberHistory]);

    const fetchTeam = async () => {
        try {
            const res = await fetch("/api/users/team");
            const data = await res.json();
            if (data.team) {
                setTeam(data.team);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    const getChildRole = (currentRole?: string) => {
        if (currentRole === "RBM") return "AreaManager";
        if (currentRole === "AreaManager") return "TerritoryManager";
        if (currentRole === "TerritoryManager") return "MDO";
        return null;
    };

    const childRole = getChildRole(session?.user?.role);

    const handleCreateMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!childRole) return;

        if (!/^\d{10}$/.test(formData.mobile)) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }

        // Password complexity validation
        const password = formData.password;
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters long.");
            return;
        }

        setCreating(true);
        try {
            const res = await fetch("/api/users/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    role: childRole,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`User created successfully! Emp ID: ${data.empId}`);
                setIsModalOpen(false);
                setCreatedMemberCredentials({
                    name: formData.name,
                    empId: data.empId,
                    password: formData.password
                });
                setFormData({ name: "", mobile: "", password: "" });
                fetchTeam(); // Refresh list
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to create user");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setCreating(false);
        }
    };

    const [createdMemberCredentials, setCreatedMemberCredentials] = useState<{ name: string; empId: string; password: string } | null>(null);
    const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
    const [deleteConfirmationName, setDeleteConfirmationName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleDeleteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberToDelete) return;

        if (deleteConfirmationName !== memberToDelete.name) {
            toast.error("Name does not match");
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/users/delete?id=${memberToDelete._id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("User deleted successfully");
                setMemberToDelete(null);
                setDeleteConfirmationName("");
                setRefreshTrigger(prev => prev + 1); // Trigger refresh
                fetchTeam(); // Refresh root list
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete user");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsDeleting(false);
        }
    };

    const [supervisor, setSupervisor] = useState<{ name: string; role: string } | null>(null);

    useEffect(() => {
        const fetchSupervisor = async () => {
            if (session?.user?.role === 'RBM') return;
            try {
                const res = await fetch("/api/users/me");
                const data = await res.json();
                if (data.user && data.user.managerId) {
                    setSupervisor(data.user.managerId);
                }
            } catch (error) {
                console.error("Failed to fetch supervisor:", error);
            }
        };
        fetchSupervisor();
    }, [session]);

    return (
        <DashboardLayout>
            <div className="flex flex-col lg:flex-row h-full gap-6 relative">

                {/* Main Team List */}
                {!selectedMember && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">Team Hierarchy</h2>
                                <p className="text-sm text-secondary-500">Manage your team structure and performance</p>
                            </div>
                            {childRole && (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all hover:scale-105"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add {childRole.replace(/([A-Z])/g, ' $1').trim()}
                                </button>
                            )}
                        </div>

                        {/* Supervisor Section */}
                        {supervisor && (
                            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-center">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mr-4">
                                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">
                                        Reporting To
                                    </p>
                                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                                        {supervisor.name}
                                    </h3>
                                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                                        {supervisor.role}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto bg-white/50 dark:bg-secondary-800/50 rounded-2xl border border-secondary-200 dark:border-secondary-700 p-6 backdrop-blur-sm">
                            {loading ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin h-8 w-8 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                                </div>
                            ) : team.length > 0 ? (
                                <div className="space-y-2">
                                    {team.map((member) => (
                                        <TeamNode key={member._id} member={member} onSelect={setSelectedMember} onDelete={setMemberToDelete} refreshTrigger={refreshTrigger} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-secondary-500">
                                    <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-4">
                                        <User className="w-8 h-8 text-secondary-400" />
                                    </div>
                                    <p className="text-lg font-medium">No team members found</p>
                                    <p className="text-sm">Get started by adding your first team member.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Team Member Details Modal */}
                {selectedMember && (
                    <div className="fixed inset-0 bg-secondary-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
                        <div className="bg-white/90 dark:bg-secondary-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 dark:border-secondary-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all scale-100">
                            <div className="p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => {
                                                if (memberHistory.length > 0) {
                                                    const previousMember = memberHistory[memberHistory.length - 1];
                                                    setSelectedMember(previousMember);
                                                    setMemberHistory(prev => prev.slice(0, -1));
                                                } else {
                                                    setSelectedMember(null);
                                                    setMemberHistory([]);
                                                }
                                            }}
                                            className="mr-4 p-2 rounded-full bg-white dark:bg-secondary-800 shadow-sm border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700 text-secondary-600 dark:text-secondary-300 transition-all"
                                            title={memberHistory.length > 0 ? "Go Back" : "Back to Dashboard"}
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-secondary-800 flex items-center justify-center mr-5 border-2 border-white dark:border-secondary-700 shadow-lg">
                                            {selectedMember.profilePicUrl ? (
                                                <img src={selectedMember.profilePicUrl} alt={selectedMember.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <User className="w-8 h-8 text-primary-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-secondary-900 dark:text-white tracking-tight">
                                                {selectedMember.name}
                                            </h3>
                                            <span className="px-3 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full mt-2 inline-block border border-primary-200 dark:border-primary-800">
                                                {selectedMember.role}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex space-x-1 bg-secondary-100 dark:bg-secondary-800 p-1.5 rounded-xl">
                                            <button
                                                onClick={() => setActiveTab('activities')}
                                                className={clsx("px-4 py-2 text-sm font-medium rounded-lg transition-all", activeTab === 'activities' ? "bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm" : "text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300")}
                                            >
                                                Activities
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('daily-plans')}
                                                className={clsx("px-4 py-2 text-sm font-medium rounded-lg transition-all", activeTab === 'daily-plans' ? "bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm" : "text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300")}
                                            >
                                                Daily Plans
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSelectedMember(null);
                                                setMemberHistory([]);
                                            }}
                                        >
                                            <span className="sr-only">Close</span>
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column: Info & Stats */}
                                    <div className="space-y-6">
                                        <div className="bg-white/50 dark:bg-secondary-800/50 rounded-xl p-5 border border-secondary-100 dark:border-secondary-700/50">
                                            <h4 className="text-xs font-bold text-secondary-400 uppercase tracking-wider mb-4 flex items-center">
                                                <User className="w-3 h-3 mr-2" />
                                                Contact Details
                                            </h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs text-secondary-500 mb-0.5">Mobile Number</p>
                                                    <p className="font-medium text-secondary-900 dark:text-white">{selectedMember.mobile || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-secondary-500 mb-0.5">Employee ID</p>
                                                    <p className="font-medium text-secondary-900 dark:text-white font-mono bg-secondary-100 dark:bg-secondary-800 px-2 py-0.5 rounded inline-block text-sm">{selectedMember.empId}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Team Stats Card */}
                                        {teamStats && (
                                            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                                                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="font-semibold text-primary-50">Team Performance</h4>
                                                        <div className="text-right">
                                                            <span className="text-3xl font-bold block leading-none">{teamStats.total}</span>
                                                            <span className="text-xs text-primary-100 opacity-80">Total Activities</span>
                                                        </div>
                                                    </div>
                                                    <div className={`grid gap-2 text-center text-xs ${session?.user?.role === 'RBM' ? 'grid-cols-3' : session?.user?.role === 'AreaManager' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                                        {session?.user?.role === 'RBM' && (
                                                            <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/10">
                                                                <div className="font-bold text-lg">{teamStats.breakdown.AreaManager || 0}</div>
                                                                <div className="text-primary-100 opacity-80">AM</div>
                                                            </div>
                                                        )}
                                                        {(session?.user?.role === 'RBM' || session?.user?.role === 'AreaManager') && (
                                                            <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/10">
                                                                <div className="font-bold text-lg">{teamStats.breakdown.TerritoryManager || 0}</div>
                                                                <div className="text-primary-100 opacity-80">TM</div>
                                                            </div>
                                                        )}
                                                        <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/10">
                                                            <div className="font-bold text-lg">{teamStats.breakdown.MDO || 0}</div>
                                                            <div className="text-primary-100 opacity-80">MDO</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <h4 className="text-xs font-bold text-secondary-400 uppercase tracking-wider mb-3 flex items-center">
                                                <ChevronDown className="w-3 h-3 mr-2" />
                                                Direct Reports
                                            </h4>
                                            {reportsLoading ? (
                                                <div className="flex justify-center py-4">
                                                    <div className="animate-spin h-5 w-5 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                                    {directReports.map((report) => (
                                                        <div
                                                            key={report._id}
                                                            onClick={() => {
                                                                if (selectedMember) {
                                                                    setMemberHistory(prev => [...prev, selectedMember]);
                                                                }
                                                                setSelectedMember(report);
                                                            }}
                                                            className="flex items-center p-3 bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-xl cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group"
                                                        >
                                                            <div className="w-9 h-9 rounded-full bg-primary-50 dark:bg-secondary-700 flex items-center justify-center mr-3 flex-shrink-0">
                                                                {report.profilePicUrl ? (
                                                                    <img src={report.profilePicUrl} alt={report.name} className="w-full h-full rounded-full object-cover" />
                                                                ) : (
                                                                    <User className="w-4 h-4 text-primary-500" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-secondary-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">{report.name}</p>
                                                                <p className="text-xs text-secondary-500 truncate">{report.role}</p>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-secondary-300 group-hover:text-primary-500 ml-2 transition-colors" />
                                                        </div>
                                                    ))}
                                                    {directReports.length === 0 && (
                                                        <div className="text-center py-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-xl border border-dashed border-secondary-200 dark:border-secondary-700">
                                                            <p className="text-sm text-secondary-500 italic">No direct reports.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Activities & Plans */}
                                    <div className="lg:col-span-2">

                                        {activeTab === 'activities' ? (
                                            <div>
                                                {activitiesLoading ? (
                                                    <div className="flex justify-center items-center h-40">
                                                        <div className="animate-spin h-8 w-8 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {memberActivities.map((activity) => (
                                                            <ActivityCard
                                                                key={activity._id}
                                                                activity={activity}
                                                                onClick={() => setSelectedActivity(activity)}
                                                            />
                                                        ))}
                                                        {memberActivities.length === 0 && (
                                                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-secondary-500">
                                                                <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-4">
                                                                    <FileText className="w-8 h-8 text-secondary-400" />
                                                                </div>
                                                                <p>No recent activities found.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                {plansLoading ? (
                                                    <div className="flex justify-center items-center h-40">
                                                        <div className="animate-spin h-8 w-8 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        <PlanCalendar
                                                            plans={dailyPlans}
                                                            selectedDate={selectedDate}
                                                            onDateSelect={setSelectedDate}
                                                            currentMonth={currentMonth}
                                                            onMonthChange={setCurrentMonth}
                                                        />

                                                        <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-xl p-5 border border-secondary-100 dark:border-secondary-700">
                                                            <h5 className="text-sm font-bold text-secondary-900 dark:text-white mb-4 border-b border-secondary-200 dark:border-secondary-700 pb-2 flex justify-between items-center">
                                                                <span>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                                                <span className="text-xs font-normal text-secondary-500 bg-white dark:bg-secondary-800 px-2 py-1 rounded-lg border border-secondary-200 dark:border-secondary-700">
                                                                    {dailyPlans.filter(p => new Date(p.date).toDateString() === selectedDate.toDateString()).length} Plans
                                                                </span>
                                                            </h5>

                                                            {dailyPlans.filter(p => new Date(p.date).toDateString() === selectedDate.toDateString()).length > 0 ? (
                                                                <div className="space-y-3">
                                                                    {dailyPlans.filter(p => new Date(p.date).toDateString() === selectedDate.toDateString()).map((plan) => (
                                                                        <div key={plan._id} className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl p-4 shadow-sm">
                                                                            <div className="mb-3">
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {plan.villages.map((v: string, i: number) => (
                                                                                        <span key={i} className="px-2.5 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-md border border-primary-100 dark:border-primary-800">
                                                                                            {v}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                            {plan.remarks && (
                                                                                <div className="text-sm text-secondary-600 dark:text-secondary-300 bg-secondary-50 dark:bg-secondary-900/50 p-3 rounded-lg">
                                                                                    {plan.remarks}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-8">
                                                                    <p className="text-sm text-secondary-500 italic">No plans scheduled for this date.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Member Modal */}
                {
                    isModalOpen && (
                        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-800 p-8 w-full max-w-md transform transition-all scale-100">
                                <h3 className="text-2xl font-bold mb-6 text-secondary-900 dark:text-white">
                                    Add New {childRole?.replace(/([A-Z])/g, ' $1').trim()}
                                </h3>
                                <form onSubmit={handleCreateMember}>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="block w-full rounded-xl border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3 transition-all"
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                                Mobile Number
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                value={formData.mobile}
                                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                                className="block w-full rounded-xl border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3 transition-all"
                                                placeholder="10-digit mobile number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                                Initial Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className="block w-full rounded-xl border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3 pr-12 transition-all"
                                                    placeholder="Set a strong password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const length = 12;
                                                        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
                                                        let retVal = "";
                                                        // Ensure at least one of each required type
                                                        retVal += "abcdefghijklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 26));
                                                        retVal += "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(Math.floor(Math.random() * 26));
                                                        retVal += "0123456789".charAt(Math.floor(Math.random() * 10));
                                                        retVal += "!@#$%^&*()_+".charAt(Math.floor(Math.random() * 12));

                                                        for (let i = 0, n = charset.length; i < length - 4; ++i) {
                                                            retVal += charset.charAt(Math.floor(Math.random() * n));
                                                        }
                                                        // Shuffle the password
                                                        retVal = retVal.split('').sort(function () { return 0.5 - Math.random() }).join('');

                                                        setFormData({ ...formData, password: retVal });
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-secondary-400 hover:text-primary-500 transition-colors"
                                                    title="Generate Strong Password"
                                                >
                                                    <Wand2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-5 py-2.5 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-xl hover:bg-secondary-50 dark:bg-secondary-800 dark:text-secondary-300 dark:border-secondary-700 dark:hover:bg-secondary-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={creating}
                                            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 shadow-lg shadow-primary-600/20 transition-all hover:scale-105"
                                        >
                                            {creating ? "Creating..." : "Create Member"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Delete Confirmation Modal */}
                {
                    memberToDelete && (
                        <div className="fixed inset-0 bg-secondary-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-800 p-8 w-full max-w-md transform transition-all scale-100">
                                <h3 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-500">
                                    Delete Employee?
                                </h3>
                                <p className="text-secondary-600 dark:text-secondary-300 mb-6">
                                    Are you sure you want to delete <strong>{memberToDelete.name}</strong>? This action is permanent and will remove all their activities, plans, and personal data.
                                </p>
                                <form onSubmit={handleDeleteMember}>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                                            Type <strong>{memberToDelete.name}</strong> to confirm:
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={deleteConfirmationName}
                                            onChange={(e) => setDeleteConfirmationName(e.target.value)}
                                            className="block w-full rounded-xl border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-3 transition-all"
                                            placeholder="Enter employee name"
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMemberToDelete(null);
                                                setDeleteConfirmationName("");
                                            }}
                                            className="px-5 py-2.5 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-xl hover:bg-secondary-50 dark:bg-secondary-800 dark:text-secondary-300 dark:border-secondary-700 dark:hover:bg-secondary-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isDeleting || deleteConfirmationName !== memberToDelete.name}
                                            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 transition-all hover:scale-105"
                                        >
                                            {isDeleting ? "Deleting..." : "Delete Permanently"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Activity Details Modal */}
                {
                    selectedActivity && (
                        <ActivityDetailsModal
                            activity={selectedActivity}
                            onClose={() => setSelectedActivity(null)}
                            onDelete={() => {
                                setSelectedActivity(null);
                                // Refresh activities
                                if (selectedMember) {
                                    const fetchMemberActivities = async () => {
                                        setActivitiesLoading(true);
                                        try {
                                            const res = await fetch(`/api/activities?userId=${selectedMember._id}`);
                                            const data = await res.json();
                                            if (data.activities) {
                                                setMemberActivities(data.activities);
                                            }
                                        } catch (error) {
                                            console.error(error);
                                        } finally {
                                            setActivitiesLoading(false);
                                        }
                                    };
                                    fetchMemberActivities();
                                }
                            }}
                            onUpdate={() => {
                                // Refresh activities without closing modal if possible, but for now we close it inside modal
                                // Actually modal closes itself on update success.
                                // We just need to refresh the list.
                                if (selectedMember) {
                                    const fetchMemberActivities = async () => {
                                        setActivitiesLoading(true);
                                        try {
                                            const res = await fetch(`/api/activities?userId=${selectedMember._id}`);
                                            const data = await res.json();
                                            if (data.activities) {
                                                setMemberActivities(data.activities);
                                            }
                                        } catch (error) {
                                            console.error(error);
                                        } finally {
                                            setActivitiesLoading(false);
                                        }
                                    };
                                    fetchMemberActivities();
                                }
                            }}
                        />
                    )
                }

                {/* Account Created Success Modal */}
                {createdMemberCredentials && (
                    <div className="fixed inset-0 bg-secondary-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-800 p-8 w-full max-w-md transform transition-all scale-100">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
                                    Account Created!
                                </h3>
                                <p className="text-secondary-500 dark:text-secondary-400">
                                    Share these credentials with your team member.
                                </p>
                            </div>

                            <div className="bg-secondary-50 dark:bg-secondary-800 rounded-xl p-6 mb-6 border border-secondary-100 dark:border-secondary-700">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-secondary-400 uppercase tracking-wider block mb-1">Name</label>
                                        <p className="font-medium text-secondary-900 dark:text-white text-lg">{createdMemberCredentials.name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-secondary-400 uppercase tracking-wider block mb-1">Employee ID</label>
                                            <p className="font-mono font-bold text-primary-600 dark:text-primary-400 text-lg">{createdMemberCredentials.empId}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-secondary-400 uppercase tracking-wider block mb-1">Password</label>
                                            <p className="font-mono font-bold text-secondary-900 dark:text-white text-lg">{createdMemberCredentials.password}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={() => setCreatedMemberCredentials(null)}
                                    className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all hover:scale-105 w-full"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div >
        </DashboardLayout >
    );
}

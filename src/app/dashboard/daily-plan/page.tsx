"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PlanCalendar from "@/components/PlanCalendar";
import { format, isSameDay } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function DailyPlan() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlan, setNewPlan] = useState({ villages: "", remarks: "" });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        const res = await fetch("/api/dailyplans");
        const data = await res.json();
        if (data.plans) {
            setPlans(data.plans);
        }
    };

    const getPlansForDate = (date: Date) => {
        return plans.filter(p => isSameDay(new Date(p.date), date));
    };

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/dailyplans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    villages: newPlan.villages.split(",").map(v => v.trim()),
                    remarks: newPlan.remarks,
                }),
            });

            if (res.ok) {
                setShowCreateModal(false);
                fetchPlans();
                setNewPlan({ villages: "", remarks: "" });
                toast.success("Plan created successfully!");
            } else {
                toast.error("Failed to create plan");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    const handleDeletePlan = async (planId: string) => {
        if (!confirm("Are you sure you want to delete this plan?")) return;

        try {
            const res = await fetch(`/api/dailyplans?id=${planId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                fetchPlans();
                toast.success("Plan deleted successfully!");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete plan");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while deleting the plan");
        }
    };

    const selectedPlans = getPlansForDate(selectedDate);

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
                        Daily Plan
                    </h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all hover:scale-105"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Plan for Today
                    </button>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row gap-6">
                    {/* Calendar */}
                    <div className="flex-1">
                        <PlanCalendar
                            plans={plans}
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            currentMonth={currentMonth}
                            onMonthChange={setCurrentMonth}
                        />
                    </div>

                    {/* Details Panel */}
                    <div className="w-full lg:w-96 bg-white dark:bg-secondary-900 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-800 p-6 overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-secondary-900 dark:text-white border-b border-secondary-100 dark:border-secondary-800 pb-2">
                            {format(selectedDate, "EEEE, MMM d")}
                        </h3>

                        {selectedPlans.length > 0 ? (
                            <div className="space-y-4">
                                {selectedPlans.map((plan, idx) => (
                                    <div key={plan._id} className="bg-secondary-50 dark:bg-secondary-800 rounded-xl p-4 border border-secondary-100 dark:border-secondary-700 relative group">
                                        <button
                                            onClick={() => handleDeletePlan(plan._id)}
                                            className="absolute top-2 right-2 p-1.5 text-secondary-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete Plan"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="mb-3">
                                            <h4 className="text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-2">Villages</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {plan.villages.map((v: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-md">
                                                        {v}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-1">Remarks</h4>
                                            <p className="text-sm text-secondary-700 dark:text-secondary-300">
                                                {plan.remarks || "No remarks"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Plus className="w-6 h-6 text-secondary-400" />
                                </div>
                                <p className="text-secondary-500 text-sm">
                                    No plans for this date.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-800 p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4 text-secondary-900 dark:text-white">Plan for Today ({format(new Date(), "MMM d")})</h3>
                        <form onSubmit={handleCreatePlan}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">Villages (comma separated)</label>
                                <input
                                    type="text"
                                    required
                                    className="block w-full rounded-xl border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3"
                                    value={newPlan.villages}
                                    onChange={e => setNewPlan({ ...newPlan, villages: e.target.value })}
                                    placeholder="Village A, Village B"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">Remarks</label>
                                <textarea
                                    className="block w-full rounded-xl border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3"
                                    rows={3}
                                    value={newPlan.remarks}
                                    onChange={e => setNewPlan({ ...newPlan, remarks: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-xl hover:bg-secondary-50 dark:bg-secondary-800 dark:text-secondary-300 dark:border-secondary-700 dark:hover:bg-secondary-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all hover:scale-105"
                                >
                                    Save Plan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ActivityCard from "@/components/ActivityCard";
import ActivityDetailsModal from "@/components/ActivityDetailsModal";
import Link from "next/link";
import { Plus, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";

export default function Dashboard() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState<any>(null);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await fetch("/api/activities");
                const data = await res.json();
                if (data.activities) {
                    setActivities(data.activities);
                }
            } catch (error) {
                console.error("Failed to fetch activities", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    const handleExport = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/activities?scope=team");
            const data = await res.json();

            if (!data.activities || data.activities.length === 0) {
                toast.error("No activities found to export");
                return;
            }

            const dataToExport = data.activities.map((act: any) => ({
                "Created Date": new Date(act.createdAt).toLocaleDateString(),
                "Created By": act.creatorId?.name || "Unknown",
                "Creator ID": act.creatorId?.empId || "Unknown",
                "Farmer Name": act.farmerName,
                "Farmer Mobile": act.farmerMobile,
                "Village": act.village,
                "Taluka": act.taluka,
                "District": act.district,
                "Crop/Hybrid": act.cropOrHybrid,
                "Farmers Involved": act.farmersInvolved,
                "Tentative Expense": act.tentativeExpense || "N/A",
                "Activity Type": act.activityType || "Special", // Default to Special for old data
                "Contact Type": act.contactType || "N/A",
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Activities");
            XLSX.writeFile(wb, "team_activities_export.xlsx");
            toast.success("Export successful!");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export activities");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    My Activities
                </h2>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Export
                    </button>
                    <Link
                        href="/dashboard/activities/create"
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        New Activity
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activities.map((activity: any) => (
                        <ActivityCard
                            key={activity._id}
                            activity={activity}
                            onClick={() => setSelectedActivity(activity)}
                        />
                    ))}
                    {activities.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                            No activities found. Create one to get started!
                        </div>
                    )}
                </div>
            )}

            {selectedActivity && (
                <ActivityDetailsModal
                    activity={selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                    onDelete={() => {
                        setSelectedActivity(null);
                        const fetchActivities = async () => {
                            setLoading(true);
                            try {
                                const res = await fetch("/api/activities");
                                const data = await res.json();
                                if (data.activities) {
                                    setActivities(data.activities);
                                }
                            } catch (error) {
                                console.error("Failed to fetch activities", error);
                            } finally {
                                setLoading(false);
                            }
                        };
                        fetchActivities();
                    }}
                    onUpdate={() => {
                        const fetchActivities = async () => {
                            setLoading(true);
                            try {
                                const res = await fetch("/api/activities");
                                const data = await res.json();
                                if (data.activities) {
                                    setActivities(data.activities);
                                }
                            } catch (error) {
                                console.error("Failed to fetch activities", error);
                            } finally {
                                setLoading(false);
                            }
                        };
                        fetchActivities();
                    }}
                />
            )}
        </DashboardLayout>
    );
}

import { IActivity } from "@/models/Activity";
import { format } from "date-fns";
import { MapPin, Users, IndianRupee } from "lucide-react";
import NextImage from "next/image";

interface ActivityCardProps {
    activity: any; // Using any for now to avoid strict type issues with serialized JSON
    onClick?: () => void;
}

export default function ActivityCard({ activity, onClick }: ActivityCardProps) {
    return (
        <div
            className={`bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl shadow-sm overflow-hidden group transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900 hover:-translate-y-0.5' : ''}`}
            onClick={onClick}
        >
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800">
                        {activity.cropOrHybrid}
                    </span>
                    <span className="text-xs text-secondary-400 font-medium">
                        {format(new Date(activity.createdAt), "MMM d, yyyy")}
                    </span>
                </div>

                <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
                    {activity.farmerName}
                </h3>

                <div className="flex items-center text-sm text-secondary-500 mb-4">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{activity.village}, {activity.taluka}</span>
                </div>

                {activity.photos && activity.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {activity.photos.slice(0, 2).map((photo: any, index: number) => (
                            <div key={index} className="aspect-video relative rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-800">
                                <NextImage
                                    src={photo.url}
                                    alt={`Activity photo ${index + 1}`}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </div>
                        ))}
                        {activity.photos.length > 2 && (
                            <div className="hidden">
                                {/* Hidden count for now, or could overlay on 2nd image */}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-secondary-100 dark:border-secondary-800">
                    <div className="flex items-center text-xs text-secondary-500 font-medium">
                        <Users className="w-3.5 h-3.5 mr-1.5 text-secondary-400" />
                        {activity.farmersInvolved} Farmers
                    </div>
                    {activity.tentativeExpense !== undefined && (
                        <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <IndianRupee className="w-3 h-3 mr-0.5" />
                            {activity.tentativeExpense}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

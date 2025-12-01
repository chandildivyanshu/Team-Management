import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PlanCalendarProps {
    plans: any[];
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    currentMonth: Date;
    onMonthChange: (date: Date) => void;
}

export default function PlanCalendar({ plans, selectedDate, onDateSelect, currentMonth, onMonthChange }: PlanCalendarProps) {
    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const getPlansForDate = (date: Date) => {
        return plans.filter(p => isSameDay(new Date(p.date), date));
    };

    return (
        <div className="bg-white dark:bg-secondary-900 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => onMonthChange(subMonths(currentMonth, 1))}
                    className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full transition-colors text-secondary-600 dark:text-secondary-400"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                    {format(currentMonth, "MMMM yyyy")}
                </h3>
                <button
                    onClick={() => onMonthChange(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full transition-colors text-secondary-600 dark:text-secondary-400"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">{day}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => {
                    const dayPlans = getPlansForDate(day);
                    const count = dayPlans.length;
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDateSelect(day)}
                            className={`
                                aspect-square p-1 rounded-xl cursor-pointer transition-all relative flex flex-col items-center justify-center border
                                ${isSelected
                                    ? "border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30 bg-primary-50 dark:bg-primary-900/10"
                                    : "border-transparent hover:bg-secondary-50 dark:hover:bg-secondary-800"
                                }
                                ${isCurrentDay && !isSelected ? "bg-secondary-50 dark:bg-secondary-800 font-bold text-primary-600" : ""}
                            `}
                        >
                            <span className={`text-sm ${isCurrentDay ? "font-bold text-primary-600" : "text-secondary-700 dark:text-secondary-300"}`}>
                                {format(day, "d")}
                            </span>

                            {count > 0 && (
                                <div className="mt-1 min-w-[1.25rem] h-5 px-1 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                    {count}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

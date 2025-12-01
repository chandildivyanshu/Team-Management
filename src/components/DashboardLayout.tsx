"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Calendar,
    Youtube,
    UserCircle,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { useTheme } from "@/components/ThemeProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    const navigation = [
        { name: "Activities", href: "/dashboard", icon: LayoutDashboard },
        { name: "Team", href: "/dashboard/team", icon: Users, hidden: session?.user?.role === "MDO" },
        { name: "Daily Plan", href: "/dashboard/daily-plan", icon: Calendar },
        { name: "YouTube Channel", href: "/dashboard/youtube", icon: Youtube },
        { name: "Account", href: "/dashboard/account", icon: UserCircle },
    ];

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex font-sans">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-white dark:bg-secondary-900 shadow-md">
                <span className="text-xl font-bold text-primary-600">Team Organizer</span>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-secondary-800">
                    {isSidebarOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-center h-20 border-b border-secondary-100 dark:border-secondary-800">
                        <h1 className="text-3xl font-bold text-primary-600 tracking-tight">
                            TeamOrg
                        </h1>
                    </div>

                    <div className="p-6 border-b border-secondary-100 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-900/50">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-secondary-800 border-2 border-primary-500 overflow-hidden shadow-sm">
                                {session?.user?.image ? (
                                    <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle className="w-full h-full text-secondary-300 dark:text-secondary-500" />
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-semibold text-secondary-900 dark:text-white truncate">
                                    {session?.user?.name}
                                </p>
                                <p className="text-xs text-secondary-500 uppercase tracking-wider font-medium">
                                    {session?.user?.role}
                                </p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {navigation.map((item) => {
                            if (item.hidden) return null;
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={clsx(
                                        "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                                            : "text-secondary-500 hover:bg-secondary-50 hover:text-secondary-900 dark:text-secondary-400 dark:hover:bg-secondary-800 dark:hover:text-white hover:pl-5"
                                    )}
                                >
                                    <Icon className={clsx("w-5 h-5 mr-3 transition-colors", isActive ? "text-primary-600 dark:text-primary-400" : "text-secondary-400 group-hover:text-secondary-600 dark:text-secondary-500 dark:group-hover:text-white")} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-secondary-100 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-900/50 space-y-2">
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-secondary-600 rounded-xl hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-800 transition-colors"
                        >
                            {theme === "dark" ? (
                                <Sun className="w-5 h-5 mr-3" />
                            ) : (
                                <Moon className="w-5 h-5 mr-3" />
                            )}
                            {theme === "dark" ? "Light Mode" : "Dark Mode"}
                        </button>
                        <button
                            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-screen pt-20 lg:pt-8 bg-secondary-50 dark:bg-secondary-950">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

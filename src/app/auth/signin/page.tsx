"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, User, Lock, ArrowRight, Loader2, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function SignIn() {
    const [empId, setEmpId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                empId,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid credentials. Please try again.");
            } else {
                router.push("/dashboard");
            }
        } catch (error) {
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (

        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-secondary-950 dark:via-secondary-900 dark:to-primary-950 p-4 relative transition-colors duration-300">
            {/* Theme Toggle */}
            <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md border border-secondary-200 dark:border-white/10 text-secondary-600 dark:text-white hover:bg-secondary-100 dark:hover:bg-white/20 transition-all shadow-sm"
                title="Toggle Theme"
            >
                {mounted && theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                ) : (
                    <Moon className="w-5 h-5" />
                )}
            </button>

            <div className="w-full max-w-md backdrop-blur-xl bg-white/70 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300">
                <div className="p-8 space-y-8">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 mb-4 ring-1 ring-primary-500/20 dark:ring-primary-500/40">
                            <LayoutGrid className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white">
                            Team Organizer
                        </h2>
                        <p className="text-secondary-500 dark:text-secondary-400 text-sm">
                            Sign in to access your dashboard
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-secondary-400 dark:text-secondary-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors" />
                                </div>
                                <input
                                    id="empId"
                                    name="empId"
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-secondary-900/50 border border-secondary-200 dark:border-white/10 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all sm:text-sm shadow-sm dark:shadow-none"
                                    placeholder="Employee ID"
                                    value={empId}
                                    onChange={(e) => setEmpId(e.target.value)}
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-secondary-400 dark:text-secondary-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-secondary-900/50 border border-secondary-200 dark:border-white/10 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all sm:text-sm shadow-sm dark:shadow-none"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center animate-pulse">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-secondary-900 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="flex items-center">
                                    Sign in
                                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </form>
                </div>
                <div className="px-8 py-4 bg-secondary-50/50 dark:bg-white/5 border-t border-secondary-100 dark:border-white/5 text-center">
                    <p className="text-xs text-secondary-500">
                        &copy; {new Date().getFullYear()} Team Organizer. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}

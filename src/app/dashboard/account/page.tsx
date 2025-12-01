"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import { UserCircle, Camera, Pencil, Check, X, Eye, EyeOff } from "lucide-react";
import imageCompression from "browser-image-compression";
import { toast } from "react-hot-toast";

export default function Account() {
    const { data: session, update } = useSession();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(session?.user?.name || "");
    const [isEditingName, setIsEditingName] = useState(false);
    const [mobile, setMobile] = useState(session?.user?.mobile || "");
    const [isEditingMobile, setIsEditingMobile] = useState(false);
    const [passwords, setPasswords] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        let file = e.target.files[0];
        setLoading(true);

        try {
            // Compress image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };
            try {
                const compressedFile = await imageCompression(file, options);
                file = compressedFile;
            } catch (error) {
                console.error("Compression failed, using original file", error);
            }

            // 1. Presign
            const presignRes = await fetch("/api/uploads/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                }),
            });
            const { url, key } = await presignRes.json();

            // 2. Upload to S3
            await fetch(url, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            const publicUrl = `/api/images/${key}`;

            // 3. Update User Profile
            const updateRes = await fetch("/api/users/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profilePicUrl: publicUrl }),
            });

            if (updateRes.ok) {
                await update({ image: publicUrl }); // Update session
                toast.success("Profile picture updated!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload profile picture");
        } finally {
            setLoading(false);
        }
    };

    const handleNameUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/users/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                await update({ name });
                setIsEditingName(false);
                toast.success("Name updated successfully!");
            } else {
                toast.error("Failed to update name");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleMobileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!/^\d{10}$/.test(mobile)) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/users/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile }),
            });
            if (res.ok) {
                await update({ mobile });
                setIsEditingMobile(false);
                toast.success("Mobile number updated successfully!");
            } else {
                toast.error("Failed to update mobile number");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        // Password complexity validation
        const password = passwords.newPassword;
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/users/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: passwords.newPassword }),
            });
            if (res.ok) {
                setPasswords({ newPassword: "", confirmPassword: "" });
                setIsEditingPassword(false);
                toast.success("Password updated successfully!");
            } else {
                toast.error("Failed to update password");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };


    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                    Account Settings
                </h2>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center space-x-6 mb-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                                {session?.user?.image ? (
                                    <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle className="w-full h-full text-gray-400" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 text-white shadow-lg">
                                <Camera className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={loading} />
                            </label>
                        </div>
                        <div className="flex-1">
                            {isEditingName ? (
                                <form onSubmit={handleNameUpdate} className="flex items-center gap-2 mb-1">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-1 border"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="p-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditingName(false);
                                            setName(session?.user?.name || "");
                                        }}
                                        className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </form>
                            ) : (
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {session?.user?.name}
                                    </h3>
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <p className="text-gray-500">{session?.user?.role}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Employee ID
                            </label>
                            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-mono">
                                {session?.user?.email}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Mobile Number
                            </label>
                            {isEditingMobile ? (
                                <form onSubmit={handleMobileUpdate} className="flex items-center gap-2">
                                    <input
                                        type="tel"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditingMobile(false);
                                            setMobile(session?.user?.mobile || "");
                                        }}
                                        className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </form>
                            ) : (
                                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                                    <span className="text-gray-900 dark:text-white font-mono">
                                        {session?.user?.mobile || "Not set"}
                                    </span>
                                    <button
                                        onClick={() => setIsEditingMobile(true)}
                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="my-6 border-gray-200 dark:border-gray-700" />

                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Password
                        </label>
                        {isEditingPassword ? (
                            <form onSubmit={handlePasswordUpdate} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            value={passwords.newPassword}
                                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 pr-10 border"
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={passwords.confirmPassword}
                                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 pr-10 border"
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditingPassword(false);
                                            setPasswords({ newPassword: "", confirmPassword: "" });
                                        }}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                                <span className="text-gray-900 dark:text-white font-mono tracking-widest">
                                    ••••••••••••
                                </span>
                                <button
                                    onClick={() => setIsEditingPassword(true)}
                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

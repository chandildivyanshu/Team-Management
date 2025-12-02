"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { Upload, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import { toast } from "react-hot-toast";

export default function CreateActivity() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [activityType, setActivityType] = useState<'General' | 'Special'>('Special');
    const [formData, setFormData] = useState({
        farmerName: "",
        farmerMobile: "",
        village: "",
        taluka: "",
        district: "",
        cropOrHybrid: "",
        farmersInvolved: "",
        tentativeExpense: "",
        contactType: "Direct", // Default for General
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate mobile number
        if (!/^\d{10}$/.test(formData.farmerMobile)) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }

        setLoading(true);

        try {

            // 1. Upload photos (Only for Special Activity)
            const uploadedPhotos = [];
            if (activityType === 'Special') {
                for (const originalFile of files) {
                    let file = originalFile;

                    // Compress image
                    try {
                        const options = {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true,
                        };
                        const compressedFile = await imageCompression(file, options);
                        file = compressedFile;
                    } catch (error) {
                        console.error("Compression failed, using original file", error);
                    }

                    // Get presigned URL
                    const presignRes = await fetch("/api/uploads/presign", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            filename: file.name,
                            contentType: file.type,
                        }),
                    });

                    if (!presignRes.ok) {
                        throw new Error("Failed to get upload URL");
                    }

                    const { url, key } = await presignRes.json();

                    // Upload to S3
                    const uploadRes = await fetch(url, {
                        method: "PUT",
                        body: file,
                        headers: { "Content-Type": file.type },
                    });

                    if (!uploadRes.ok) {
                        throw new Error("Failed to upload image to S3");
                    }

                    uploadedPhotos.push({
                        url: `/api/images/${key}`, // Use proxy URL
                        key,
                    });
                    uploadedPhotos.push({
                        url: `/api/images/${key}`, // Use proxy URL
                        key,
                    });
                }
            }

            // 2. Create Activity
            const res = await fetch("/api/activities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    activityType,
                    contactType: activityType === 'General' ? formData.contactType : undefined,
                    farmersInvolved: Number(formData.farmersInvolved),
                    tentativeExpense: Number(formData.tentativeExpense),
                    photos: uploadedPhotos,
                }),
            });

            if (!res.ok) throw new Error("Failed to create activity");

            toast.success("Activity created successfully!");
            router.push("/dashboard");
        } catch (error) {
            console.error(error);
            toast.error("Failed to create activity");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative">
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Close"
                >
                    <X className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                    Create New Activity
                </h2>

                {/* Activity Type Toggle */}
                <div className="flex justify-center mb-8">
                    <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg inline-flex">
                        <button
                            type="button"
                            onClick={() => setActivityType('Special')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activityType === 'Special'
                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            Special Activity
                        </button>
                        <button
                            type="button"
                            onClick={() => setActivityType('General')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activityType === 'General'
                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            General Activity
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Farmer Name
                            </label>
                            <input
                                type="text"
                                name="farmerName"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Farmer Mobile
                            </label>
                            <input
                                type="tel"
                                name="farmerMobile"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Village
                            </label>
                            <input
                                type="text"
                                name="village"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Taluka
                            </label>
                            <input
                                type="text"
                                name="taluka"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                District
                            </label>
                            <input
                                type="text"
                                name="district"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Crop / Hybrid
                            </label>
                            <input
                                type="text"
                                name="cropOrHybrid"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Farmers Involved
                            </label>
                            <input
                                type="number"
                                name="farmersInvolved"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tentative Expense (₹)
                            </label>
                            <input
                                type="number"
                                name="tentativeExpense"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                                onChange={handleInputChange}
                            />
                        </div>
                        {activityType === 'General' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Contact Type
                                </label>
                                <select
                                    name="contactType"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 border"
                                    value={formData.contactType}
                                    onChange={(e) => setFormData({ ...formData, contactType: e.target.value })}
                                >
                                    <option value="Direct">Direct Visit</option>
                                    <option value="Calling">Calling</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {activityType === 'Special' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Photos
                            </label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="font-semibold">Click to upload</span> or
                                            drag and drop
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                            {files.length > 0 && (
                                <div className="mt-4 grid grid-cols-3 gap-4">
                                    {files.map((file, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt="Preview"
                                                className="h-20 w-full object-cover rounded-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? "Publishing..." : "Publish Activity"}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

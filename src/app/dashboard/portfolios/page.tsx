"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import { Plus, X, Trash2, Image as ImageIcon, Briefcase, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import imageCompression from "browser-image-compression";

interface Portfolio {
    _id: string;
    name: string;
    images: { url: string; key: string }[];
    creatorId: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    key?: string;
    previewUrl: string;
}

export default function Portfolios() {
    const { data: session } = useSession();
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Upload State
    const [uploads, setUploads] = useState<UploadingFile[]>([]);

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editImages, setEditImages] = useState<{ url: string; key: string }[]>([]);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        fetchPortfolios();
    }, []);

    const fetchPortfolios = async () => {
        try {
            const res = await fetch("/api/portfolios");
            const data = await res.json();
            if (data.portfolios) {
                setPortfolios(data.portfolios);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load portfolios");
        } finally {
            setLoading(false);
        }
    };

    // --- Upload Helper Functions ---

    const uploadFile = async (file: File) => {
        const id = Math.random().toString(36).substring(7);
        const previewUrl = URL.createObjectURL(file);

        // Add to uploads state
        setUploads(prev => [...prev, { id, file, progress: 0, status: 'uploading', previewUrl }]);

        try {
            // Compress
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };
            let uploadFile = file;
            try {
                const compressedFile = await imageCompression(file, options);
                uploadFile = compressedFile;
            } catch (err) {
                console.error("Compression failed", err);
            }

            // Presign
            const presignRes = await fetch("/api/uploads/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: uploadFile.name,
                    contentType: uploadFile.type,
                }),
            });
            const { url, key } = await presignRes.json();

            // Upload with Progress monitoring via XMLHttpRequest
            return new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", url);
                xhr.setRequestHeader("Content-Type", uploadFile.type);

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        setUploads(prev => prev.map(u =>
                            u.id === id ? { ...u, progress: percentComplete } : u
                        ));
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        setUploads(prev => prev.map(u =>
                            u.id === id ? { ...u, status: 'completed', progress: 100, key } : u
                        ));
                        resolve();
                    } else {
                        setUploads(prev => prev.map(u =>
                            u.id === id ? { ...u, status: 'error' } : u
                        ));
                        reject(new Error("Upload failed"));
                    }
                };

                xhr.onerror = () => {
                    setUploads(prev => prev.map(u =>
                        u.id === id ? { ...u, status: 'error' } : u
                    ));
                    reject(new Error("Network error"));
                };

                xhr.send(uploadFile);
            });

        } catch (error) {
            console.error("Upload process error", error);
            setUploads(prev => prev.map(u =>
                u.id === id ? { ...u, status: 'error' } : u
            ));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            files.forEach(file => uploadFile(file));
        }
    };

    const removeUpload = (id: string) => {
        setUploads(prev => prev.filter(u => u.id !== id));
    };

    // --- Action Handlers ---

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Portfolio name is required");

        const completedUploads = uploads.filter(u => u.status === 'completed');
        if (completedUploads.length === 0) return toast.error("Please upload at least one image");
        if (uploads.some(u => u.status === 'uploading')) return toast.error("Please wait for all uploads to complete");

        setCreating(true);
        try {
            const imagesPayload = completedUploads.map(u => ({
                key: u.key!,
                url: u.key!
            }));

            // Create Portfolio Record
            const res = await fetch("/api/portfolios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    images: imagesPayload,
                }),
            });

            if (res.ok) {
                toast.success("Portfolio created successfully!");
                setIsCreateModalOpen(false);
                resetForm();
                fetchPortfolios();
            } else {
                toast.error("Failed to create portfolio");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setCreating(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editName.trim()) return toast.error("Portfolio name is required");

        // Existing images + newly uploaded images
        const completedUploads = uploads.filter(u => u.status === 'completed');
        const pendingUploads = uploads.filter(u => u.status === 'uploading');

        if (editImages.length === 0 && completedUploads.length === 0 && pendingUploads.length === 0) {
            return toast.error("At least one image is required");
        }
        if (pendingUploads.length > 0) return toast.error("Please wait for uploads to complete");

        setEditing(true);
        try {
            const newImagesPayload = completedUploads.map(u => ({
                key: u.key as string,
                url: u.key as string,
            }));

            const finalImages = [...editImages, ...newImagesPayload];

            const res = await fetch("/api/portfolios", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    _id: selectedPortfolio?._id,
                    name: editName,
                    images: finalImages,
                }),
            });

            if (res.ok) {
                toast.success("Portfolio updated successfully!");
                setIsEditModalOpen(false);
                resetForm();

                // Update relevant state
                const updatedListRes = await fetch("/api/portfolios");
                const updatedListData = await updatedListRes.json();
                if (updatedListData.portfolios) {
                    setPortfolios(updatedListData.portfolios);
                    const updatedCurrent = updatedListData.portfolios.find((p: Portfolio) => p._id === selectedPortfolio?._id);
                    if (updatedCurrent) setSelectedPortfolio(updatedCurrent);
                }

            } else {
                toast.error("Failed to update portfolio");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setEditing(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPortfolio) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/portfolios?id=${selectedPortfolio._id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Portfolio deleted successfully");
                setSelectedPortfolio(null);
                setIsDeleteModalOpen(false);
                fetchPortfolios();
            } else {
                toast.error("Failed to delete portfolio");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setDeleting(false);
        }
    };

    const resetForm = () => {
        setName("");
        setEditName("");
        setUploads([]);
        setEditImages([]);
    };

    const openCreateModal = () => {
        resetForm();
        setIsCreateModalOpen(true);
    };

    const openEditModal = () => {
        if (selectedPortfolio) {
            resetForm();
            setEditName(selectedPortfolio.name);
            setEditImages(selectedPortfolio.images);
            setIsEditModalOpen(true);
        }
    };

    const removeEditImage = (index: number) => {
        setEditImages(prev => prev.filter((_, i) => i !== index));
    };

    const isSaveDisabled = uploads.some(u => u.status === 'uploading') || creating || editing;

    return (
        <DashboardLayout>
            <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">Portfolios</h2>
                        <p className="text-sm text-secondary-500">Showcase products and achievements</p>
                    </div>
                    {session?.user?.role === "RBM" && (
                        <button
                            onClick={openCreateModal}
                            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all hover:scale-105"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            New Portfolio
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin h-8 w-8 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {portfolios.map((portfolio) => (
                            <div
                                key={portfolio._id}
                                onClick={() => setSelectedPortfolio(portfolio)}
                                className="bg-white dark:bg-secondary-800 rounded-2xl shadow-sm border border-secondary-200 dark:border-secondary-700 overflow-hidden cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
                            >
                                <div className="aspect-[4/3] bg-secondary-100 dark:bg-secondary-900 relative">
                                    {portfolio.images && portfolio.images.length > 0 ? (
                                        <img
                                            src={portfolio.images[0].url}
                                            alt={portfolio.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-secondary-400">
                                            <Briefcase className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                        <p className="text-white font-medium">{portfolio.images.length} Images</p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-1">{portfolio.name}</h3>
                                    <p className="text-xs text-secondary-500">
                                        {new Date(portfolio.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-secondary-200 dark:border-secondary-800 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-secondary-900 dark:text-white">Create New Portfolio</h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-secondary-400 hover:text-secondary-600 dark:hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreate}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Portfolio Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full rounded-xl border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-white p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="Enter portfolio name"
                                            required
                                        />
                                    </div>

                                    {/* Upload Area */}
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Upload Images</label>
                                        <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-xl p-6 text-center hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer relative bg-secondary-50 dark:bg-secondary-800/50">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <ImageIcon className="w-8 h-8 mx-auto text-secondary-400 mb-2" />
                                            <p className="text-sm text-secondary-500">Click to upload images</p>
                                        </div>
                                    </div>

                                    {/* Upload Progress List */}
                                    {uploads.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                            {uploads.map((upload) => (
                                                <div key={upload.id} className="relative aspect-square rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 group">
                                                    <img src={upload.previewUrl} alt="Preview" className="w-full h-full object-cover opacity-80" />

                                                    {/* Status Overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                        {upload.status === 'uploading' && (
                                                            <div className="text-center w-full px-2">
                                                                <div className="w-full bg-white/30 rounded-full h-1.5 mb-1">
                                                                    <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${upload.progress}%` }}></div>
                                                                </div>
                                                                <span className="text-[10px] text-white font-medium">{Math.round(upload.progress)}%</span>
                                                            </div>
                                                        )}
                                                        {upload.status === 'completed' && (
                                                            <CheckCircle className="w-6 h-6 text-green-400" />
                                                        )}
                                                        {upload.status === 'error' && (
                                                            <X className="w-6 h-6 text-red-400" />
                                                        )}
                                                    </div>

                                                    {/* Delete Button (only if completed or error) */}
                                                    {upload.status !== 'uploading' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUpload(upload.id)}
                                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaveDisabled}
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl disabled:opacity-50 flex items-center"
                                    >
                                        {uploads.some(u => u.status === 'uploading') ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : creating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            "Create Portfolio"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
                        <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-secondary-200 dark:border-secondary-800 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-secondary-900 dark:text-white">Edit Portfolio</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-secondary-400 hover:text-secondary-600 dark:hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleUpdate}>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Portfolio Name</label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full rounded-xl border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-white p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="Enter portfolio name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Current Images</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {editImages.map((img, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                                                    <img src={img.url} alt="Portfolio" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEditImage(idx)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        {editImages.length === 0 && <p className="text-sm text-secondary-400 italic">No existing images.</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Add New Images</label>
                                        <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-xl p-6 text-center hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer relative bg-secondary-50 dark:bg-secondary-800/50">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <ImageIcon className="w-6 h-6 mx-auto text-secondary-400 mb-2" />
                                            <p className="text-sm text-secondary-500">Click to upload more images</p>
                                        </div>
                                    </div>

                                    {/* Upload Progress List (Shared state with Create, but reset on open) */}
                                    {uploads.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                            {uploads.map((upload) => (
                                                <div key={upload.id} className="relative aspect-square rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 group">
                                                    <img src={upload.previewUrl} alt="Preview" className="w-full h-full object-cover opacity-80" />

                                                    {/* Status Overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                        {upload.status === 'uploading' && (
                                                            <div className="text-center w-full px-2">
                                                                <div className="w-full bg-white/30 rounded-full h-1.5 mb-1">
                                                                    <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${upload.progress}%` }}></div>
                                                                </div>
                                                                <span className="text-[10px] text-white font-medium">{Math.round(upload.progress)}%</span>
                                                            </div>
                                                        )}
                                                        {upload.status === 'completed' && (
                                                            <CheckCircle className="w-6 h-6 text-green-400" />
                                                        )}
                                                        {upload.status === 'error' && (
                                                            <X className="w-6 h-6 text-red-400" />
                                                        )}
                                                    </div>

                                                    {/* Delete Button */}
                                                    {upload.status !== 'uploading' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUpload(upload.id)}
                                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaveDisabled}
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl disabled:opacity-50 flex items-center"
                                    >
                                        {uploads.some(u => u.status === 'uploading') ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : editing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Detail View Modal */}
                {selectedPortfolio && (
                    <div className="fixed inset-0 bg-secondary-900/90 backdrop-blur-sm z-50 overflow-y-auto flex items-center justify-center">
                        <div className="min-h-screen sm:min-h-0 p-4 sm:p-8 w-full flex items-center justify-center">
                            <div className="max-w-6xl w-full mx-auto bg-transparent">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-2">{selectedPortfolio.name}</h2>
                                        <p className="text-secondary-400">Created by {selectedPortfolio.creatorId?.name} on {new Date(selectedPortfolio.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {session?.user?.role === "RBM" && (
                                            <>
                                                <button
                                                    onClick={openEditModal}
                                                    className="px-4 py-2 bg-white/10 text-white border border-white/20 hover:bg-white/20 rounded-xl transition-colors flex items-center"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setIsDeleteModalOpen(true)}
                                                    className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600 hover:text-white rounded-xl transition-colors flex items-center"
                                                >
                                                    <Trash2 className="w-5 h-5 mr-2" />
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => setSelectedPortfolio(null)}
                                            className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Responsive Layout: Horizontal Scroll on Mobile, Grid on Desktop */}
                                <div className="flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 snap-x snap-mandatory md:snap-none pb-4 md:pb-0 justify-start md:justify-center">
                                    {selectedPortfolio.images.map((img, idx) => (
                                        <div key={idx} className="snap-center shrink-0 w-[85vw] md:w-auto rounded-2xl overflow-hidden bg-black/50 border border-white/10 shadow-2xl">
                                            <img
                                                src={img.url}
                                                alt={`Portfolio image ${idx + 1}`}
                                                className="w-full h-auto object-contain max-h-[70vh]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-secondary-900 rounded-2xl p-6 max-w-sm w-full mx-auto shadow-2xl border border-secondary-200 dark:border-secondary-800">
                            <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">Delete Portfolio?</h3>
                            <p className="text-secondary-500 dark:text-secondary-400 mb-6 text-sm">
                                Are you sure you want to delete <strong>{selectedPortfolio?.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
                                >
                                    {deleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

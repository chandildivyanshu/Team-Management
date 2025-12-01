import { format } from "date-fns";
import { X, MapPin, Calendar, User, Phone, IndianRupee, Trash2, Edit, Save, Upload, FileText, ImageIcon, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import NextImage from "next/image";
import imageCompression from "browser-image-compression";

interface ActivityDetailsModalProps {
    activity: any;
    onClose: () => void;
    onDelete?: () => void;
    onUpdate?: () => void;
}

export default function ActivityDetailsModal({ activity, onClose, onDelete, onUpdate }: ActivityDetailsModalProps) {
    const { data: session } = useSession();
    const [deleting, setDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(activity);
    const [newFiles, setNewFiles] = useState<File[]>([]);

    useEffect(() => {
        setFormData(activity);
    }, [activity]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
        }
    };

    const removePhoto = (index: number) => {
        const updatedPhotos = [...(formData.photos || [])];
        updatedPhotos.splice(index, 1);
        setFormData((prev: any) => ({ ...prev, photos: updatedPhotos }));
    };

    const removeNewFile = (index: number) => {
        setNewFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Upload new photos if any
            let uploadedPhotos: any[] = [];
            if (newFiles.length > 0) {
                const uploadPromises = newFiles.map(async (originalFile) => {
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

                    const res = await fetch("/api/uploads/presign", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ filename: file.name, contentType: file.type }),
                    });
                    const { url, key } = await res.json();
                    await fetch(url, { method: "PUT", body: file });
                    return { key, contentType: file.type };
                });
                uploadedPhotos = await Promise.all(uploadPromises);
            }

            // 2. Update activity
            // Combine existing photos (formData.photos) + new uploaded photos
            const finalPhotos = [...(formData.photos || []), ...uploadedPhotos];

            const res = await fetch("/api/activities", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    photos: finalPhotos,
                }),
            });

            if (res.ok) {
                setIsEditing(false);
                setNewFiles([]);
                if (onUpdate) onUpdate();
                toast.success("Activity updated successfully!");
                onClose();
            } else {
                toast.error("Failed to update activity");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error updating activity");
        } finally {
            setSaving(false);
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/activities?id=${activity._id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                if (onDelete) onDelete();
                toast.success("Activity deleted successfully!");
                onClose();
            } else {
                toast.error("Failed to delete activity");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error deleting activity");
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };



    if (!activity) return null;

    const isRBM = session?.user?.role === 'RBM';

    return (
        <div className="fixed inset-0 bg-secondary-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all scale-100">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex-1 mr-4">
                            {isEditing ? (
                                <div className="mb-2">
                                    <label className="block text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1">Farmer Name</label>
                                    <input
                                        type="text"
                                        name="farmerName"
                                        value={formData.farmerName}
                                        onChange={handleInputChange}
                                        className="text-2xl font-bold text-secondary-900 dark:text-white border-b-2 border-primary-500 focus:outline-none bg-transparent w-full placeholder-secondary-400"
                                        placeholder="Farmer Name"
                                    />
                                </div>
                            ) : (
                                <h2 className="text-3xl font-bold text-secondary-900 dark:text-white tracking-tight mb-2">
                                    {activity.farmerName}
                                </h2>
                            )}

                            <div className="flex flex-wrap items-center gap-y-2 text-sm text-secondary-500">
                                <div className="flex items-center mr-4">
                                    <Calendar className="w-4 h-4 mr-2 text-primary-500" />
                                    {format(new Date(activity.createdAt), "PPP p")}
                                </div>

                                {isEditing ? (
                                    <div className="flex flex-wrap gap-2 w-full mt-2">
                                        <input
                                            type="text"
                                            name="village"
                                            placeholder="Village"
                                            value={formData.village}
                                            onChange={handleInputChange}
                                            className="flex-1 min-w-[120px] px-3 py-1.5 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        />
                                        <input
                                            type="text"
                                            name="taluka"
                                            placeholder="Taluka"
                                            value={formData.taluka}
                                            onChange={handleInputChange}
                                            className="flex-1 min-w-[120px] px-3 py-1.5 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        />
                                        <input
                                            type="text"
                                            name="district"
                                            placeholder="District"
                                            value={formData.district}
                                            onChange={handleInputChange}
                                            className="flex-1 min-w-[120px] px-3 py-1.5 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-2 text-primary-500" />
                                        {activity.village}, {activity.taluka}, {activity.district}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-400 hover:text-secondary-600 transition-colors flex-shrink-0"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-xl p-5 border border-secondary-100 dark:border-secondary-800">
                            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-4 flex items-center uppercase tracking-wider">
                                <User className="w-4 h-4 mr-2 text-primary-500" />
                                Farmer Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-secondary-500 block mb-1">Mobile Number</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="farmerMobile"
                                            value={formData.farmerMobile}
                                            onChange={handleInputChange}
                                            className="w-full bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-white"
                                        />
                                    ) : (
                                        <div className="flex items-center font-medium text-secondary-900 dark:text-white">
                                            <Phone className="w-4 h-4 mr-2 text-secondary-400" />
                                            {activity.farmerMobile}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-secondary-500 block mb-1">Crop / Hybrid</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="cropOrHybrid"
                                            value={formData.cropOrHybrid}
                                            onChange={handleInputChange}
                                            className="w-full bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-white"
                                        />
                                    ) : (
                                        <div className="font-medium text-secondary-900 dark:text-white">
                                            {activity.cropOrHybrid}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-xl p-5 border border-secondary-100 dark:border-secondary-800">
                            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-4 flex items-center uppercase tracking-wider">
                                <FileText className="w-4 h-4 mr-2 text-primary-500" />
                                Activity Stats
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-secondary-500 block mb-1">Farmers Involved</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            name="farmersInvolved"
                                            value={formData.farmersInvolved}
                                            onChange={handleInputChange}
                                            className="w-full bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-white"
                                        />
                                    ) : (
                                        <div className="flex items-center font-medium text-secondary-900 dark:text-white">
                                            <Users className="w-4 h-4 mr-2 text-secondary-400" />
                                            {activity.farmersInvolved}
                                        </div>
                                    )}
                                </div>
                                {(isRBM || activity.creatorId === session?.user?.id) && (
                                    <div>
                                        <label className="text-xs text-secondary-500 block mb-1">Tentative Expense</label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                name="tentativeExpense"
                                                value={formData.tentativeExpense}
                                                onChange={handleInputChange}
                                                className="w-full bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-white"
                                            />
                                        ) : (
                                            <div className="flex items-center font-medium text-emerald-600 dark:text-emerald-400">
                                                <IndianRupee className="w-4 h-4 mr-2" />
                                                {activity.tentativeExpense}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        {!isEditing && (
                            activity.description && (
                                <div className="bg-secondary-50 dark:bg-secondary-800/30 rounded-xl p-5 border border-secondary-100 dark:border-secondary-800 mb-6">
                                    <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">Remarks</h3>
                                    <p className="text-secondary-600 dark:text-secondary-300 whitespace-pre-wrap leading-relaxed">
                                        {activity.description}
                                    </p>
                                </div>
                            )
                        )}

                        <div>
                            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center">
                                <ImageIcon className="w-5 h-5 mr-2 text-primary-500" />
                                Photos ({formData.photos?.length || 0})
                            </h3>

                            {formData.photos && formData.photos.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {formData.photos.map((photo: any, index: number) => (
                                        <div key={index} className="relative aspect-video group rounded-xl overflow-hidden shadow-sm border border-secondary-200 dark:border-secondary-800">
                                            <NextImage
                                                src={photo.url}
                                                alt={`Activity photo ${index + 1}`}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                            {isEditing ? (
                                                <button
                                                    onClick={() => removePhoto(index)}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transition-all transform hover:scale-110 z-10"
                                                    title="Remove photo"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <a
                                                    href={photo.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                >
                                                    <span className="bg-white/90 text-secondary-900 text-xs font-medium px-3 py-1.5 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                        View Full
                                                    </span>
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-secondary-50 dark:bg-secondary-800/30 rounded-xl border border-dashed border-secondary-300 dark:border-secondary-700">
                                    <ImageIcon className="w-10 h-10 text-secondary-300 mx-auto mb-2" />
                                    <p className="text-secondary-500">No photos uploaded</p>
                                </div>
                            )}

                            {isEditing && (
                                <div className="mt-4">
                                    <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white dark:bg-secondary-900 border-2 border-secondary-300 dark:border-secondary-700 border-dashed rounded-xl appearance-none cursor-pointer hover:border-primary-500 focus:outline-none">
                                        <span className="flex flex-col items-center space-y-2">
                                            <Upload className="w-6 h-6 text-secondary-400" />
                                            <span className="font-medium text-secondary-600 dark:text-secondary-400">
                                                Drop files to Attach, or <span className="text-primary-600 underline">browse</span>
                                            </span>
                                            <span className="text-xs text-secondary-500">Supported: JPG, PNG</span>
                                        </span>
                                        <input
                                            type="file"
                                            name="file_upload"
                                            className="hidden"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    {newFiles.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">New files to upload:</p>
                                            {newFiles.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between bg-secondary-50 dark:bg-secondary-800 px-3 py-2 rounded-lg text-sm">
                                                    <span className="truncate max-w-[200px] text-secondary-600 dark:text-secondary-300">{file.name}</span>
                                                    <button onClick={() => removeNewFile(index)} className="text-red-500 hover:text-red-700">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {(isRBM || activity.creatorId === session?.user?.id) && (
                        <div className="flex justify-end gap-4 pt-6 border-t border-secondary-100 dark:border-secondary-800">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-2.5 rounded-xl border border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 font-medium hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all hover:scale-105 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {isRBM && (
                                        <button
                                            onClick={handleDeleteClick}
                                            disabled={deleting}
                                            className="px-6 py-2.5 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center disabled:opacity-70"
                                        >
                                            {deleting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all hover:scale-105 flex items-center"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Activity
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Custom Delete Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                        <div className="bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-800 p-6 w-full max-w-sm transform transition-all scale-100">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
                                    Delete Activity?
                                </h3>
                                <p className="text-secondary-600 dark:text-secondary-300 mb-6 text-sm">
                                    Are you sure you want to delete this activity? This action cannot be undone.
                                </p>
                                <div className="flex space-x-3 w-full">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-xl hover:bg-secondary-50 dark:bg-secondary-800 dark:text-secondary-300 dark:border-secondary-700 dark:hover:bg-secondary-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={deleting}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-600/20 transition-all hover:scale-105"
                                    >
                                        {deleting ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

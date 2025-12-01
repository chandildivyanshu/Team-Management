import { format } from "date-fns";
import { X, MapPin, Calendar, User, Phone, IndianRupee, Trash2, Edit, Save, Upload, FileText, ImageIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

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
                const uploadPromises = newFiles.map(async (file) => {
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

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this activity?")) return;

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
                                    <p className="text-xs text-secondary-500 mb-1">Mobile Number</p>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="farmerMobile"
                                            value={formData.farmerMobile}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        />
                                    ) : (
                                        <p className="font-medium text-secondary-900 dark:text-white flex items-center">
                                            <Phone className="w-3 h-3 mr-2 text-secondary-400" />
                                            {activity.farmerMobile}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-secondary-500 mb-1">Farmers Involved</p>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            name="farmersInvolved"
                                            value={formData.farmersInvolved}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        />
                                    ) : (
                                        <p className="font-medium text-secondary-900 dark:text-white">
                                            {activity.farmersInvolved}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-xl p-5 border border-secondary-100 dark:border-secondary-800">
                            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-4 flex items-center uppercase tracking-wider">
                                <IndianRupee className="w-4 h-4 mr-2 text-primary-500" />
                                Crop & Expense
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-secondary-500 mb-1">Crop / Hybrid</p>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="cropOrHybrid"
                                            value={formData.cropOrHybrid}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        />
                                    ) : (
                                        <p className="font-medium text-secondary-900 dark:text-white">
                                            {activity.cropOrHybrid}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-secondary-500 mb-1">Tentative Expense</p>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            name="tentativeExpense"
                                            value={formData.tentativeExpense}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        />
                                    ) : (
                                        <p className="font-medium text-emerald-600 dark:text-emerald-400">
                                            ₹ {activity.tentativeExpense}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Description Section if needed, though not in original props, adding placeholder logic if description exists */}
                        {activity.description && (
                            <div>
                                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-primary-500" />
                                    Description
                                </h3>
                                {isEditing ? (
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full p-4 border border-secondary-200 dark:border-secondary-700 rounded-xl bg-secondary-50 dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        rows={4}
                                        placeholder="Describe the activity..."
                                    />
                                ) : (
                                    <p className="text-secondary-600 dark:text-secondary-300 whitespace-pre-wrap leading-relaxed">
                                        {activity.description}
                                    </p>
                                )}
                            </div>
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
                                            <img
                                                src={photo.url}
                                                alt={`Activity photo ${index + 1}`}
                                                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
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
                                                    <span className="bg-white/90 text-secondary-900 text-xs font-medium px-3 py-1 rounded-full shadow-lg">View Full</span>
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-secondary-500 italic">No photos available.</p>
                            )}
                        </div>

                        {isRBM && isEditing && (
                            <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-xl p-6 border border-dashed border-secondary-300 dark:border-secondary-700">
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-4">
                                    Add New Photos
                                </label>
                                <div className="flex flex-col items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-primary-100 border-dashed rounded-xl cursor-pointer bg-white dark:bg-secondary-900 hover:bg-primary-50 dark:hover:bg-secondary-800 transition-colors group">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <div className="p-3 bg-primary-50 dark:bg-secondary-800 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                                <Upload className="w-6 h-6 text-primary-500" />
                                            </div>
                                            <p className="mb-1 text-sm text-secondary-500 dark:text-secondary-400">
                                                <span className="font-semibold text-primary-600">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-secondary-400">SVG, PNG, JPG or GIF</p>
                                        </div>
                                        <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                                    </label>
                                </div>
                                {newFiles.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        {newFiles.map((file, index) => (
                                            <div key={index} className="relative p-3 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center overflow-hidden">
                                                    <div className="w-8 h-8 bg-secondary-100 dark:bg-secondary-800 rounded flex items-center justify-center mr-3 flex-shrink-0">
                                                        <ImageIcon className="w-4 h-4 text-secondary-500" />
                                                    </div>
                                                    <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300 truncate">{file.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => removeNewFile(index)}
                                                    className="p-1 text-secondary-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-secondary-200 dark:border-secondary-800 flex justify-end gap-3">
                        {isRBM && !isEditing && (
                            <>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex items-center px-5 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 font-medium text-sm"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {deleting ? "Deleting..." : "Delete Activity"}
                                </button>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center px-5 py-2.5 text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 transition-all hover:scale-105 font-medium text-sm"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Activity
                                </button>
                            </>
                        )}
                        {isEditing && (
                            <>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData(activity);
                                        setNewFiles([]);
                                    }}
                                    className="px-5 py-2.5 text-secondary-700 bg-white border border-secondary-300 rounded-xl hover:bg-secondary-50 dark:bg-secondary-800 dark:text-secondary-300 dark:border-secondary-700 dark:hover:bg-secondary-700 transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center px-5 py-2.5 text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 transition-all hover:scale-105 disabled:opacity-50 font-medium text-sm"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </>
                        )}
                        {!isRBM && (
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 text-secondary-700 bg-secondary-100 hover:bg-secondary-200 rounded-xl transition-colors dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700 font-medium text-sm"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

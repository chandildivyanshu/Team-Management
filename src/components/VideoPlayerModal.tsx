import { X } from "lucide-react";

interface VideoPlayerModalProps {
    videoId: string;
    onClose: () => void;
}

export default function VideoPlayerModal({ videoId, onClose }: VideoPlayerModalProps) {
    if (!videoId) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all z-10"
                >
                    <X className="w-6 h-6" />
                </button>
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                ></iframe>
            </div>
        </div>
    );
}

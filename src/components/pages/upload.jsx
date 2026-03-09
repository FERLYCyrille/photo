import { useLocation } from "react-router-dom";
import { Copy, Lock, Globe } from "lucide-react";
import toast from "react-hot-toast";

export default function ShareRevealPage() {
    const baseUrl = import.meta.env.VITE_APP_URL;

    const location = useLocation();
    const { photo, publicLink, privateLink } = location.state || {};

    const fullPublicLink = `${baseUrl}/reveal/${publicLink}`;
    const fullPrivateLink = `${baseUrl}/dashboard/${privateLink}`;
    const copyToClipboard = async (link) => {
        try {
            await navigator.clipboard.writeText(link);
            toast.success("Lien copié !");
        } catch {
            toast.error("Quelque chose s'est mal passé. Réessayez.");
        }
    };

    if (!photo || !publicLink || !privateLink) {
        return (
            <div className="min-h-screen bg-[#0b0416] flex items-center justify-center text-white">
                <p>Quelque chose s'est mal passé. Réessayez.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0416] text-white flex flex-col items-center px-6 py-8 gap-6">

            {/* Header */}
            <div className="w-full max-w-md flex items-center mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-lg font-bold">G</span>
                    </div>
                    <span className="font-semibold text-lg">Genial</span>
                </div>
            </div>

            {/* Photo Card */}
            <div className="w-full max-w-md relative">

                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 via-pink-500/20 to-blue-500/30 blur-2xl rounded-[32px]" />

                <div className="relative rounded-[28px] overflow-hidden border border-purple-500/20 shadow-[0_0_60px_rgba(168,85,247,0.25)]">

                    <img
                        src={photo}
                        alt="preview"
                        className="w-full h-96 object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    <div className="absolute bottom-4 left-4 flex flex-col gap-2">

                        <span className="text-xs px-3 py-1 rounded-full bg-purple-600/80 backdrop-blur">
                            READY TO REVEAL
                        </span>

                        <span className="text-lg font-semibold">
                            @{publicLink?.slice(0, 8)}
                        </span>

                    </div>

                </div>

            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-gray-400 max-w-md">
                Copie ton lien et colle-le sur WhatsApp, Instagram ou ton statut pour recevoir des avis anonymes.
            </div>

            {/* Links */}
            <div className="w-full max-w-md flex flex-col gap-4">

                {/* Public Link */}
                <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 p-4 rounded-2xl border border-purple-500/20">

                    <p className="text-xs text-purple-300 mb-3 flex items-center gap-2">
                        <Globe size={14} /> Lien public (à partager)
                    </p>

                    <button
                        onClick={() => copyToClipboard(fullPublicLink)}
                        className="w-full flex items-center justify-center gap-2 bg-purple-600 py-3 rounded-xl text-sm hover:bg-purple-500 transition"
                    >
                        <Copy size={16} />
                        Copier le lien public
                    </button>

                </div>

                {/* Private Link */}
                <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 p-4 rounded-2xl border border-emerald-500/20">

                    <p className="text-xs text-emerald-300 mb-3 flex items-center gap-2">
                        <Lock size={14} /> Lien privé (voir les réponses)
                    </p>

                    <button
                        onClick={() => copyToClipboard(fullPrivateLink)}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 py-3 rounded-xl text-sm hover:bg-emerald-500 transition"
                    >
                        <Copy size={16} />
                        Copier le lien privé
                    </button>

                </div>

            </div>

            {/* Footer hint */}
            <div className="text-xs text-gray-500 text-center max-w-md">
                1. Copie ton lien public <br />
                2. Tes amis répondent anonymement <br />
                3. Consulte les réponses avec ton lien privé
            </div>

        </div>
    );
}
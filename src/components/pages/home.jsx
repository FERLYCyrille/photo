import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Camera, Upload } from "lucide-react";
import { supabase } from "../../../supabaseClient";

// ---------- Carousel Component ----------
const slides = [
    {
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
        comment: "J'adore le style ! La veste vient d'où ?"
    },
    {
        image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
        comment: "Très belle photo 🔥"
    },
    {
        image: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe",
        comment: "La lumière est incroyable !"
    }
];

function CarouselPreview({ photo }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % slides.length);
        }, 3500);

        return () => clearInterval(interval);
    }, []);

    const slide = slides[index];

    return (
        <div className="w-full max-w-md bg-[#1a0f2e] rounded-3xl p-4 shadow-2xl">
            <div className="rounded-2xl overflow-hidden relative">
                <img
                    src={photo || slide.image}
                    alt="preview"
                    className="w-full h-72 object-cover transition-all duration-700"
                />

                <div className="absolute bottom-2 left-2 bg-purple-600 text-xs px-2 py-1 rounded">
                    LIEN ACTIF
                </div>
            </div>

            <div className="mt-4">
                <div className="w-full h-2 bg-purple-900 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
                </div>
            </div>

            <div className="mt-4 bg-purple-900/30 p-3 rounded-xl text-sm text-purple-200">
                “{slide.comment}”
            </div>
        </div>
    );
}

// ---------- Landing Page ----------
export default function LandingPage() {
    const navigate = useNavigate();
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const handleUpload = async (file) => {
        if (!file) return;

        // preview immédiat
        const preview = URL.createObjectURL(file);
        setSelectedPhoto(preview);

        const fileName = `${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
            .from("photos")
            .upload(fileName, file);

        if (uploadError) {
            console.error(uploadError);
            alert("Erreur upload : " + uploadError.message);
            return;
        }

        const { data } = supabase.storage
            .from("photos")
            .getPublicUrl(fileName);

        const publicUrl = data.publicUrl;

        const { data: postData, error: postError } = await supabase
            .from("posts")
            .insert({
                photo_url: publicUrl,
                public_link: crypto.randomUUID(),
                private_link: crypto.randomUUID()
            })
            .select()
            .single();

        if (postError) {
            console.error(postError);
            alert("Erreur création post : " + postError.message);
            return;
        }

        navigate("/share", {
            state: {
                photo: postData.photo_url,
                publicLink: postData.public_link,
                privateLink: postData.private_link
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0b0416] via-[#12061f] to-[#0b0416] text-white flex flex-col items-center px-6 py-6">

            {/* Header */}
            <div className="w-full max-w-md flex items-center mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-lg">G</span>
                    </div>
                    <span className="font-semibold text-lg">Genial</span>
                </div>
            </div>

            {/* Badge */}
            <div className="mb-6">
                <div className="px-4 py-1 rounded-full bg-purple-900/40 border border-purple-500/20 text-sm text-purple-300">
                    Nouveau : réactions audio
                </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center leading-tight max-w-md mb-4">
                Publie ta photo et découvre ce que les gens pensent vraiment
            </h1>

            {/* Subtitle */}
            <p className="text-center text-gray-400 max-w-sm mb-8">
                Partage ton lien sur WhatsApp et reçois des avis anonymes.
            </p>

            {/* Input galerie */}
            <input
                type="file"
                accept="image/*"
                id="fileInput"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files[0])}
            />

            {/* Input camera */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                id="cameraInput"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files[0])}
            />

            {/* Buttons */}
            <div className="w-full max-w-md flex flex-col gap-4 mb-10">

                {/* Upload */}
                <button
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-violet-500 py-4 rounded-xl font-medium shadow-lg hover:scale-[1.02] transition"
                    onClick={() => document.getElementById("fileInput").click()}
                >
                    <Upload size={18} />
                    Télécharger une photo
                </button>

                {/* Camera */}
                <button
                    className="flex items-center justify-center gap-2 border border-purple-500/30 py-4 rounded-xl text-purple-200 hover:bg-purple-900/20 transition"
                    onClick={() => document.getElementById("cameraInput").click()}
                >
                    <Camera size={18} />
                    Prendre une photo
                </button>

            </div>

            {/* Preview */}
            <CarouselPreview photo={selectedPhoto} />

        </div>
    );
}
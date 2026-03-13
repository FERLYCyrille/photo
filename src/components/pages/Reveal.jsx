import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import toast from "react-hot-toast";
import { Flame, Heart, Laugh, Send, Mic, Trash2 } from "lucide-react";

export default function RevealPage() {

    const { publicLink } = useParams();

    const [photo, setPhoto] = useState(null);
    const [postId, setPostId] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const [recording, setRecording] = useState(false);
    const [time, setTime] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (publicLink) fetchPost();
    }, [publicLink]);

    const fetchPost = async () => {
        try {
            const { data } = await supabase
                .from("posts")
                .select("*")
                .eq("public_link", publicLink)
                .single();

            if (!data) {
                setLoading(false);
                return;
            }

            setPhoto(data.photo_url);
            setPostId(data.id);

        } catch {
            toast.error("Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    const sendComment = async () => {
        if (!message) return;

        try {
            await supabase
                .from("comments")
                .insert({
                    post_id: postId,
                    message
                });

            setMessage("");
            toast.success("Message envoyé");

        } catch {
            toast.error("Une erreur est survenue");
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            streamRef.current = stream;

            const recorder = new MediaRecorder(stream, {
                mimeType: "audio/webm;codecs=opus"
            });

            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.start();

            setRecording(true);
            setTime(0);

            timerRef.current = setInterval(() => {
                setTime((t) => t + 1);
            }, 1000);

        } catch {
            toast.error("Une erreur est survenue");
        }
    };

    const stopRecording = async (send = true) => {
        clearInterval(timerRef.current);

        if (!mediaRecorderRef.current) return;

        mediaRecorderRef.current.stop();
        streamRef.current.getTracks().forEach((t) => t.stop());

        setRecording(false);

        if (!send) {
            audioChunksRef.current = [];
            return;
        }

        try {
            const blob = new Blob(audioChunksRef.current, {
                type: "audio/webm;codecs=opus"
            });

            const fileName = `${Date.now()}.webm`;

            await supabase.storage
                .from("audio")
                .upload(fileName, blob);

            const { data } = supabase.storage
                .from("audio")
                .getPublicUrl(fileName);

            await supabase
                .from("comments")
                .insert({
                    post_id: postId,
                    audio_url: data.publicUrl
                });

            toast.success("Audio envoyé");

            audioChunksRef.current = [];

        } catch {
            toast.error("Une erreur est survenue");
        }
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0416] flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0416] text-white flex flex-col items-center px-6 py-6 gap-6">

            {/* Header */}
            <div className="w-full max-w-md flex items-center mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-lg font-bold">G</span>
                    </div>
                    <span className="font-semibold text-lg">Genial</span>
                </div>
            </div>

            {/* Photo */}
            <div className="w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl">
                <img
                    src={photo}
                    alt="reveal"
                    className="w-full h-80 object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-purple-600 text-xs px-3 py-1 rounded-full">
                    LIVE NOW
                </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-center">
                Leave an anonymous comment 👀
            </h2>

            {/* Reactions */}
            <div className="flex gap-4">
                <button className="bg-purple-900/40 p-3 rounded-xl">
                    <Flame size={20} />
                </button>
                <button className="bg-purple-900/40 p-3 rounded-xl">
                    <Heart size={20} />
                </button>
                <button className="bg-purple-900/40 p-3 rounded-xl">
                    <Laugh size={20} />
                </button>
            </div>

            {/* Textarea */}
            <textarea
                placeholder="Write a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full max-w-md h-32 bg-[#1a0f2e] rounded-2xl p-4 outline-none border border-purple-500/20"
            />

            {/* Audio recorder */}
            {!recording && (
                <button
                    onMouseDown={startRecording}
                    onTouchStart={startRecording}
                    className="w-full max-w-md flex items-center justify-center gap-2 py-4 rounded-xl bg-purple-700"
                >
                    <Mic size={18} />
                    Send audio
                </button>
            )}

            {recording && (
                <div className="w-full max-w-md flex items-center justify-between bg-[#1a0f2e] px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2 text-red-400">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        {formatTime(time)}
                    </div>
                    <button
                        onClick={() => stopRecording(false)}
                        className="text-red-400"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={() => stopRecording(true)}
                        className="text-green-400"
                    >
                        <Send size={18} />
                    </button>
                </div>
            )}

            {/* Send text */}
            <button
                onClick={sendComment}
                className="w-full max-w-md flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 py-4 rounded-xl font-medium"
            >
                Send anonymously
                <Send size={16} />
            </button>

        </div>
    );
}
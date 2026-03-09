import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { Flame, Heart, Laugh, Send, Mic } from "lucide-react";

export default function RevealPage() {

    const { publicLink } = useParams();

    const [photo, setPhoto] = useState(null);
    const [postId, setPostId] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);

    useEffect(() => {
        if (publicLink) {
            fetchPost();
        }
    }, [publicLink]);

    const fetchPost = async () => {

        const { data, error } = await supabase
            .from("posts")
            .select("*")
            .eq("public_link", publicLink)
            .single();

        if (error) {
            console.error(error);
            return;
        }

        if (!data) {
            setLoading(false);
            return;
        }

        setPhoto(data.photo_url);
        setPostId(data.id);
        setLoading(false);
    };

    const sendComment = async () => {

        if (!message) return;

        const { error } = await supabase
            .from("comments")
            .insert({
                post_id: postId,
                message
            });

        if (error) {
            alert("Erreur : " + error.message);
            return;
        }

        setMessage("");
        alert("Message envoyé anonymement !");
    };

    const toggleRecording = async () => {

        if (!recording) {

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const recorder = new MediaRecorder(stream);

            recorder.ondataavailable = (event) => {
                setAudioChunks((prev) => [...prev, event.data]);
            };

            recorder.onstop = uploadAudio;

            recorder.start();

            setMediaRecorder(recorder);
            setRecording(true);

        } else {

            mediaRecorder.stop();
            setRecording(false);

        }
    };

    const uploadAudio = async () => {

        const blob = new Blob(audioChunks, { type: "audio/webm" });

        const fileName = `${Date.now()}.webm`;

        const { error: uploadError } = await supabase.storage
            .from("audio")
            .upload(fileName, blob);

        if (uploadError) {
            alert(uploadError.message);
            return;
        }

        const { data } = supabase.storage
            .from("audio")
            .getPublicUrl(fileName);

        const audioUrl = data.publicUrl;

        const { error } = await supabase
            .from("comments")
            .insert({
                post_id: postId,
                audio_url: audioUrl
            });

        if (error) {
            alert(error.message);
        }

        setAudioChunks([]);
        alert("Audio envoyé !");
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

            {/* Quick reactions */}

            <div className="flex gap-4">

                <button className="bg-purple-900/40 p-3 rounded-xl hover:bg-purple-700/40 transition">
                    <Flame size={20} />
                </button>

                <button className="bg-purple-900/40 p-3 rounded-xl hover:bg-purple-700/40 transition">
                    <Heart size={20} />
                </button>

                <button className="bg-purple-900/40 p-3 rounded-xl hover:bg-purple-700/40 transition">
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

            {/* Record audio button */}

            <button
                onClick={toggleRecording}
                className={`w-full max-w-md flex items-center justify-center gap-2 py-4 rounded-xl font-medium shadow-lg transition
        ${recording ? "bg-red-500 animate-pulse" : "bg-purple-700"}`}
            >

                <Mic size={18} />

                {recording ? "Recording... Tap to stop" : "Record audio message"}

            </button>

            {/* Send text message */}

            <button
                onClick={sendComment}
                className="w-full max-w-md flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 py-4 rounded-xl font-medium shadow-lg hover:scale-[1.02] transition"
            >

                Send anonymously

                <Send size={16} />

            </button>

        </div>
    );
}
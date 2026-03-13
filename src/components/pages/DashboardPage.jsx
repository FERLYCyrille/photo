import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import toast from "react-hot-toast";
import { Play, Pause, MoreVertical, Mic, MessageCircle } from "lucide-react";
import { Howl } from "howler";

const styleTag = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-ring {
    0% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
    70% { box-shadow: 0 0 0 10px rgba(124,58,237,0); }
    100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
  }
  @keyframes bar-bounce {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(1.6); }
  }

  .msg-item { animation: fadeUp 0.4s ease both; }
  .play-btn:hover { animation: pulse-ring 1s ease infinite; }
  .waveform-playing .bar { animation: bar-bounce 0.6s ease infinite; }
  .waveform-playing .bar:nth-child(2n) { animation-delay: 0.1s; }
  .waveform-playing .bar:nth-child(3n) { animation-delay: 0.2s; }
`;

function WaveformBar({ height, active, playing, index }) {
    return (
        <div
            className="bar rounded-full"
            style={{
                width: "2.5px",
                height: `${Math.max(6, height * 3)}px`,
                background: active
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.25)",
                transition: "height 0.2s ease, background 0.3s ease",
                animationDelay: playing ? `${index * 0.04}s` : "0s",
            }}
        />
    );
}

function VoiceMessage({ waveform, audioUrl }) {
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState("--:--");
    const howlRef = useRef(null);
    const intervalRef = useRef(null);

    const formatDuration = (secs) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const getHowl = () => {
        if (howlRef.current) return howlRef.current;

        const howl = new Howl({
            src: [audioUrl],
            html5: true,
            onload: () => {
                setDuration(formatDuration(howl.duration()));
            },
            onend: () => {
                setPlaying(false);
                setProgress(0);
                clearInterval(intervalRef.current);
            },
            onstop: () => {
                setPlaying(false);
                setProgress(0);
                clearInterval(intervalRef.current);
            },
        });

        howlRef.current = howl;
        return howl;
    };

    const togglePlay = () => {
        const howl = getHowl();

        if (!playing) {
            howl.play();
            intervalRef.current = setInterval(() => {
                const seek = howl.seek();
                const dur = howl.duration();
                if (dur > 0) {
                    setProgress((seek / dur) * 100);
                }
            }, 100);
        } else {
            howl.pause();
            clearInterval(intervalRef.current);
        }

        setPlaying(!playing);
    };

    useEffect(() => {
        return () => {
            howlRef.current?.unload();
            clearInterval(intervalRef.current);
        };
    }, []);

    const activeCount = Math.floor((progress / 100) * waveform.length);

    return (
        <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
                background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 60%, #8b5cf6 100%)",
                minWidth: 230,
                maxWidth: 270,
                boxShadow: "0 4px 20px rgba(109,40,217,0.45)",
            }}
        >
            <button
                onClick={togglePlay}
                className="play-btn flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)" }}
            >
                {playing
                    ? <Pause size={14} fill="white" color="white" />
                    : <Play size={14} fill="white" color="white" style={{ marginLeft: 2 }} />
                }
            </button>

            <div className={`flex items-center gap-[2px] flex-1 ${playing ? "waveform-playing" : ""}`}>
                {waveform.map((h, i) => (
                    <WaveformBar key={i} height={h} active={i < activeCount} playing={playing} index={i} />
                ))}
            </div>

            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <Mic size={10} color="rgba(255,255,255,0.5)" />
                <span className="text-[10px] text-white/60">{duration}</span>
            </div>
        </div>
    );
}

function Avatar() {
    return (
        <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
                background: "linear-gradient(135deg, #2d1b69, #3b1f8c)",
                border: "1.5px solid rgba(124,58,237,0.35)",
            }}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="#a78bfa" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#a78bfa" />
            </svg>
        </div>
    );
}

function TextMessage({ text }) {
    return (
        <div
            className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
            style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "rgba(255,255,255,0.88)",
                maxWidth: 260,
                backdropFilter: "blur(8px)",
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            {text}
        </div>
    );
}

export default function SecretInboxPage() {
    const { privateLink } = useParams();
    const [photo, setPhoto] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (privateLink) fetchData();
    }, [privateLink]);

    const fetchData = async () => {
        try {
            const { data: post } = await supabase
                .from("posts")
                .select("*")
                .eq("private_link", privateLink)
                .single();

            if (!post) return setLoading(false);

            setPhoto(post.photo_url);

            const { data: commentsData } = await supabase
                .from("comments")
                .select("*")
                .eq("post_id", post.id)
                .order("created_at", { ascending: false });

            setComments(commentsData || []);

        } catch {
            toast.error("Impossible de charger les commentaires.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#08051a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #7c3aed", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const waveformData = [2, 5, 7, 4, 9, 6, 8, 3, 7, 5, 9, 4, 6, 8, 5, 7, 3, 8, 6, 4, 9, 5, 7, 4, 8, 6, 5, 7, 4, 6];

    return (
        <>
            <style>{styleTag}</style>
            <div style={{ minHeight: "100vh", background: "#08051a", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
                <div style={{
                    width: 375,
                    minHeight: 812,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                }}>

                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 20px 12px", position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 12, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontWeight: 700, color: "white" }}>G</span>
                            </div>
                            <span style={{ fontWeight: 600, color: "white", fontSize: 16 }}>Genial</span>
                        </div>
                        <button style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <MoreVertical size={18} color="rgba(255,255,255,0.8)" />
                        </button>
                    </div>

                    {/* Photo Hero */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 24px 28px", animation: "fadeUp 0.5s ease" }}>
                        {photo ? (
                            <div style={{
                                width: 180, height: 180, borderRadius: 28, overflow: "hidden",
                                border: "1px solid rgba(124,58,237,0.3)",
                                boxShadow: "0 8px 40px rgba(109,40,217,0.5), 0 0 0 6px rgba(124,58,237,0.08)",
                                marginBottom: 20,
                            }}>
                                <img src={photo} alt="Post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                        ) : (
                            <div style={{
                                width: 180, height: 180, borderRadius: 28, marginBottom: 20,
                                background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(139,92,246,0.08))",
                                border: "1px solid rgba(124,58,237,0.25)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <MessageCircle size={48} color="rgba(124,58,237,0.5)" />
                            </div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: 3, background: "#a78bfa", boxShadow: "0 0 6px #a78bfa" }} />
                            <p style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "-0.5px" }}>
                                {comments.length} people commented
                            </p>
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.38)", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                            New responses are waiting for you
                        </p>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.25), transparent)", margin: "0 20px" }} />

                    {/* Messages list */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
                        {comments.map((msg, idx) => (
                            <div key={msg.id} className="msg-item" style={{ animationDelay: `${idx * 0.08}s` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                    <div style={{ width: 16, height: 1, background: "rgba(167,139,250,0.3)" }} />
                                    <span style={{
                                        fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
                                        color: "rgba(167,139,250,0.5)",
                                        fontFamily: "'DM Sans', sans-serif",
                                    }}>ANONYMOUS</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                                    <Avatar />
                                    {msg.audio_url ? (
                                        <VoiceMessage waveform={waveformData} audioUrl={msg.audio_url} />
                                    ) : (
                                        <TextMessage text={msg.message} />
                                    )}
                                </div>
                            </div>
                        ))}
                        {comments.length === 0 && (
                            <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
                                No comments yet
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}
import { useRef, useState } from "react";
import { nukeStorage } from "../utils/helpers";
import heroImg from "../assets/images/hero-food.jpg";

const Welcome = ({ navigate }) => {
  const audioRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioPlaying) {
      audio.pause();
      setAudioPlaying(false);
    } else {
      audio.play().catch(() => console.warn("[SM] Audio playback blocked by browser"));
      setAudioPlaying(true);
    }
  };

  const handleDemoReset = () => {
    nukeStorage();
    console.log("[SM] Demo storage cleared");
  };

  return (
    <div className="welcome-page">
      {/* Background video */}
      <video
        className="welcome-bg-video"
        autoPlay
        muted
        loop
        playsInline
        onError={(e) => { e.target.style.display = "none"; }}
      >
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>

      {/* Audio element */}
      <audio ref={audioRef} loop>
        <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg" />
      </audio>

      <div className="welcome-overlay" />

      <div className="welcome-content">
        <span className="welcome-flame" role="img" aria-label="flame">🌶</span>

        <h1 className="welcome-title">SPICY MOMENTO</h1>

        <p className="welcome-tagline">
          <em>Feel the heat.</em> Authentic street food, <strong>fiery flavors</strong>, 
          delivered on wheels.
        </p>

        {/* Responsive picture using local image */}
        <picture style={{ display: "none" }}>
          <source media="(min-width: 768px)" srcSet={heroImg} />
          <source media="(min-width: 480px)" srcSet={heroImg} />
          <img
            src={heroImg}
            alt="Spicy Momento food preview"
          />
        </picture>

        <div className="welcome-buttons">
          <button
            className="btn-primary"
            onClick={() => navigate("home")}
            onMouseEnter={(e) => (e.currentTarget.style.letterSpacing = "2px")}
            onMouseLeave={(e) => (e.currentTarget.style.letterSpacing = "0.8px")}
          >
            🌶 Explore Menu
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate("login")}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Login
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate("register")}
          >
            Register
          </button>
        </div>

        <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
          <button
            onClick={handleDemoReset}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "inherit", fontFamily: "inherit" }}
          >
            [Dev: Reset App Data]
          </button>
        </p>
      </div>

      {/* Audio toggle */}
      <button className="audio-btn" onClick={toggleAudio}>
        {audioPlaying ? "🔇 Mute" : "🔊 Ambience"}
      </button>
    </div>
  );
};

export default Welcome;

import { ImageResponse } from "next/og";

export const alt = "OmniArchive — Private, local-first AI chat and prompt vault";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          color: "#F8FAFC",
          background: "#090D16",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.12,
            backgroundImage:
              "linear-gradient(#94A3B8 1px, transparent 1px), linear-gradient(90deg, #94A3B8 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -220,
            left: 250,
            width: 760,
            height: 520,
            borderRadius: "50%",
            opacity: 0.45,
            background: "radial-gradient(circle, #6366F1 0%, #8B5CF6 42%, transparent 72%)",
            filter: "blur(50px)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            width: "100%",
            padding: "64px 72px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", width: 700 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 27, fontWeight: 700 }}>
              <div
                style={{
                  display: "flex",
                  width: 46,
                  height: 46,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  fontSize: 24,
                }}
              >
                🔒
              </div>
              OmniArchive
            </div>
            <div style={{ marginTop: 42, fontSize: 58, lineHeight: 1.08, fontWeight: 700, letterSpacing: -2 }}>
              Stop letting AI platforms trap your chat history.
            </div>
            <div style={{ marginTop: 22, color: "#94A3B8", fontSize: 23, lineHeight: 1.4 }}>
              Your private, local-first vault for ChatGPT, Claude, and Gemini.
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
              <div
                style={{
                  display: "flex",
                  padding: "10px 16px",
                  border: "1px solid rgba(168, 85, 247, 0.55)",
                  borderRadius: 999,
                  color: "#E9D5FF",
                  background: "rgba(168, 85, 247, 0.12)",
                  fontSize: 16,
                }}
              >
                ⚡ Private Beta
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "10px 16px",
                  border: "1px solid rgba(99, 102, 241, 0.45)",
                  borderRadius: 999,
                  color: "#C7D2FE",
                  background: "rgba(99, 102, 241, 0.12)",
                  fontSize: 16,
                }}
              >
                50% off Pro Lifetime
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 250,
              padding: "28px 26px",
              border: "1px solid rgba(139, 92, 246, 0.55)",
              borderRadius: 24,
              background: "rgba(19, 27, 46, 0.92)",
              boxShadow: "0 0 50px rgba(99, 102, 241, 0.28)",
            }}
          >
            <div style={{ color: "#C4B5FD", fontSize: 14, fontWeight: 700, letterSpacing: 1.5 }}>
              FOUNDING MEMBER
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 22 }}>
              <span style={{ fontSize: 54, fontWeight: 700 }}>$19</span>
              <span style={{ color: "#64748B", fontSize: 22, textDecoration: "line-through" }}>$39</span>
            </div>
            <div style={{ marginTop: 8, color: "#94A3B8", fontSize: 17 }}>one-time payment</div>
            <div style={{ marginTop: 28, color: "#A5B4FC", fontSize: 18 }}>No subscriptions.</div>
            <div style={{ marginTop: 8, color: "#CBD5E1", fontSize: 18 }}>Your data stays yours.</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

/* og-image generada dinamicamente con next/og — AOURA branding */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AOURA — Suplementos Deportivos & Nutricionista IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0A0B 0%, #141416 50%, #0A0A0B 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow esmeralda sutil de fondo */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Logo A grande */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <svg
            width="100"
            height="100"
            viewBox="0 0 512 512"
          >
            <rect width="512" height="512" rx="96" ry="96" fill="#1C1C1F" />
            <path
              d="M176 100 L336 100 L416 420 L360 420 L336 332 L176 332 L152 420 L96 420 Z M192 284 L320 284 L274 152 L238 152 Z"
              fill="#10B981"
              fill-rule="evenodd"
            />
          </svg>
        </div>

        {/* Nombre AOURA */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "12px",
            marginBottom: "16px",
            display: "flex",
          }}
        >
          AOURA
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "26px",
            color: "#9CA3AF",
            fontWeight: 500,
            marginBottom: "40px",
            display: "flex",
          }}
        >
          Tu centro. Tu salud. Tu evolucion.
        </div>

        {/* Pills de features */}
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          {["Suplementos", "Fitness Tracker", "Nutricionista IA"].map(
            (label) => (
              <div
                key={label}
                style={{
                  padding: "10px 24px",
                  borderRadius: "999px",
                  border: "1px solid rgba(16,185,129,0.3)",
                  background: "rgba(16,185,129,0.08)",
                  color: "#10B981",
                  fontSize: "18px",
                  fontWeight: 600,
                  display: "flex",
                }}
              >
                {label}
              </div>
            )
          )}
        </div>

        {/* Barra inferior con URL */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#6B7280",
            fontSize: "16px",
          }}
        >
          aoura-salud.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}

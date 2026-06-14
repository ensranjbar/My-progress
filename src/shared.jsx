// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
export const T = {
  bg: "#FAFAF8",
  bgCard: "#FFFFFF",
  bgMuted: "#F4F1EC",
  border: "#E8E4DC",
  text: "#1A1A1A",
  textMid: "#6B6B6B",
  textLight: "#9E9E9E",
  accent: "#E8643A",
  accentLight: "#FDF1EC",
  accentBorder: "#F5C4B0",
  green: "#5A9470",
  greenLight: "#EEF5F1",
  greenBorder: "#B8D8C4",
  blue: "#4A7FC1",
  blueLight: "#EEF3FA",
  blueBorder: "#B8CFEA",
  purple: "#7B5EA7",
  purpleLight: "#F3EEF9",
  gold: "#C49A3C",
  goldLight: "#FDF7EC",
};

export const S = {
  label: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textLight },
  h2: { fontSize: 18, fontWeight: 700, color: T.text, margin: 0 },
  h3: { fontSize: 15, fontWeight: 600, color: T.text, margin: 0 },
  body: { fontSize: 14, color: T.textMid, lineHeight: 1.6 },
  small: { fontSize: 12, color: T.textLight, lineHeight: 1.5 },
};

export const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
export const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function Pill({ children, color, bg, border }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: bg || T.accentLight, color: color || T.accent, border: `1px solid ${border || T.accentBorder}`, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 500 }}>
      {children}
    </span>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: T.border, margin: "20px 0" }} />;
}

export function ProgressBar({ value, color, height = 6 }) {
  return (
    <div style={{ background: T.bgMuted, borderRadius: 999, height, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color || T.accent, borderRadius: 999, transition: "width 0.6s ease" }} />
    </div>
  );
}

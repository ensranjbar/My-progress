import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { T, S, Pill, Divider, ProgressBar, load, save } from "./shared";
import { extractTextFromFile } from "./fileParsers";
import ExpensesScreen from "./ExpensesScreen";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const PROFILE = {
  name: "Ghazale",
  role: "Data Engineer · NTT DATA Italia · Rome",
  exam: { name: "AZ-900", date: "2025-09-30" },
  goals: ["Data Architect", "Germany June/July 2027", "€100–130k by 2030", "German passport 2032"],
  vision: [
    { year: "Now", label: "AZ-900 + Build Platform", salary: null, active: true },
    { year: "2026", label: "Senior DE skills + GitHub portfolio", salary: null },
    { year: "2027", label: "Move to Germany 🇩🇪 Blue Card", salary: "€65–75k" },
    { year: "2028", label: "Lead DE / Data Architect", salary: "€90–100k" },
    { year: "2030", label: "Senior Architect · Stable life in Germany", salary: "€100–130k" },
    { year: "2032", label: "Apply for German passport 🏛️", salary: "€120k+" },
  ],
};

const WEEKLY_TASKS = [
  {
    id: 1, track: "az900", text: "AZ-900: Cloud Concepts + Azure Services Overview",
    time: "2 hrs", weekend: false,
    how: "Go to learn.microsoft.com/en-us/training/paths/az-900-describe-cloud-concepts — free, official. Read + do the exercises. Don't just watch — click through every module.",
    resource: "learn.microsoft.com/azure → AZ-900 learning path",
  },
  {
    id: 2, track: "az900", text: "AZ-900: Practice questions — first 50",
    time: "1 hr", weekend: true,
    how: "Go to learn.microsoft.com → AZ-900 → Practice Assessment (free official practice). Do 50 questions. Write down every wrong answer and why.",
    resource: "learn.microsoft.com → AZ-900 → Practice Assessment (free)",
  },
  {
    id: 3, track: "python", text: "Python: Install + connect to Oracle with cx_Oracle",
    time: "1 hr", weekend: false,
    how: "Install Python 3.11 from python.org. Then: pip install oracledb. Read python-oracledb.readthedocs.io → Quick Start. Write one script that connects and runs SELECT * FROM your_table FETCH FIRST 5 ROWS ONLY.",
    resource: "python-oracledb.readthedocs.io/en/latest/user_guide/installation.html",
  },
  {
    id: 4, track: "python", text: "JSON: read an API response and parse it",
    time: "45 min", weekend: false,
    how: "Read realpython.com/python-json — free article, 20 min. Then open Python and run: import json, requests. Call a free API like api.open-meteo.com (weather, no key needed) and print specific fields.",
    resource: "realpython.com/python-json + api.open-meteo.com (free test API)",
  },
  {
    id: 5, track: "aibuilder", text: "Platform: build one new feature with Claude",
    time: "1.5 hrs", weekend: false,
    how: "Open Claude, describe exactly what you want to add to your platform. Build it together. After it works — read every line of code Claude wrote and explain it to yourself out loud.",
    resource: "claude.ai — your current platform code",
  },
  {
    id: 6, track: "aibuilder", text: "Understand Claude's code — line by line",
    time: "45 min", weekend: false,
    how: "Take the code Claude wrote this week. Open it. For every function: write in a comment what it does and why. If you can't — ask Claude to explain that specific part. Goal: zero black boxes.",
    resource: "Your platform code + Claude for explanations",
  },
  {
    id: 7, track: "architect", text: "DDIA: Read Chapter 1 — Reliable, Scalable, Maintainable",
    time: "1.5 hrs", weekend: true,
    how: "Search 'Designing Data-Intensive Applications PDF' or buy on Amazon (~€35). Chapter 1 is 30 pages. Read slowly — take notes. After: write 3 sentences about what you learned in your decisions log.",
    resource: "Designing Data-Intensive Applications — Martin Kleppmann (O'Reilly)",
  },
  {
    id: 8, track: "cv", text: "GitHub: one commit with README in English",
    time: "30 min", weekend: false,
    how: "Go to github.com/ensranjbar. Pick any repo. Update or write a README.md in English: what the project does, what tech it uses, how to run it. Commit and push. This is your English writing practice.",
    resource: "github.com/ensranjbar — your GitHub profile",
  },
  {
    id: 9, track: "germany", text: "German — Duolingo every day",
    time: "15 min/day", weekend: false,
    how: "Open Duolingo app → German course. Do one lesson every day — morning, before bed, whenever. Set a daily reminder. The streak is the goal — don't break it.",
    resource: "duolingo.com/learn — German course (free)",
  },
];

const TRACKS = [
  { id: "az900", label: "AZ-900", color: T.blue, icon: "☁️", priority: 1, deadline: "September 2025", weekend: true,
    monthly: "Pass AZ-900 with 80%+ score",
    steps: ["Cloud concepts + Azure overview — Microsoft Learn (free)", "Compute, storage, networking, databases", "Security, compliance, pricing", "Practice exams — score 80%+ consistently", "Book and sit the exam"],
    resources: ["learn.microsoft.com/azure", "John Savill AZ-900 on YouTube", "Whizlabs practice exams ($15)"],
    habit: "3 hrs every Saturday — this is your weekend priority until September",
  },
  { id: "python", label: "Python + JSON", color: T.accent, icon: "🐍", priority: 2, deadline: "Parallel — ongoing",
    monthly: "Automate 2 real NTT DATA tasks in Python",
    steps: ["Write first Oracle connection script — cx_Oracle + SQLAlchemy", "JSON: read, write, parse any API response", "Automate one manual daily task", "Push everything to GitHub (ensranjbar)"],
    resources: ["realpython.com — articles not courses", "python-oracledb.readthedocs.io", "docs.python.org/3/library/json.html"],
    habit: "Build something real every weekday session — even 1 function counts",
  },
  { id: "aibuilder", label: "AI Builder", color: T.purple, icon: "🤖", priority: 3, deadline: "Parallel — ongoing",
    monthly: "Explain every part of your platform — no black boxes",
    steps: ["Read every line Claude writes — explain it out loud", "Ask Claude: 'what are 3 ways to architect this? trade-offs?'", "One feature per week built WITHOUT Claude", "Document every architectural decision you make"],
    resources: ["platform.openai.com/docs/quickstart", "docs.streamlit.io/get-started", "cookbook.openai.com"],
    habit: "After every Claude session: spend 10 min reading what it wrote and understanding it",
  },
  { id: "germany", label: "Germany 2027", color: T.green, icon: "🇩🇪", priority: 4, deadline: "Apply mid 2026 · Move June/July 2027",
    monthly: "German A1 progress + CV updated with latest project",
    steps: ["15 min German daily — Duolingo + Pimsleur on any walk", "Every GitHub commit and README in English", "Monthly: update CV with new skill or project", "Research Blue Card requirements at bamf.de"],
    resources: ["duolingo.com/german", "pimsleur.com/learn-german", "bamf.de/EN/blue-card", "stepstone.de"],
    habit: "German 15 min/day — on walks, before bed, whenever. Non-negotiable.",
  },
  { id: "automate", label: "Automate Work", color: T.gold, icon: "⚡", priority: 5, deadline: "Start month 2",
    monthly: "2 scripts saving real time at NTT DATA",
    steps: ["List every manual task you do more than once a week", "Automate the most painful one in Python", "Add Excel output with openpyxl — stakeholders love Excel", "Push to private GitHub — note how much time it saves"],
    resources: ["openpyxl.readthedocs.io", "pypi.org/project/schedule", "docs.python.org/3/library/smtplib.html"],
    habit: "Once a week: pick one manual thing at work and ask 'can I script this?'",
  },
  { id: "architect", label: "Architect Thinking", color: "#9E6B4A", icon: "🏛️", priority: 6, deadline: "Long term — build the habit now",
    monthly: "4 decisions logged · 1 system design practiced",
    steps: ["Every project: write WHY you chose X over Y", "Read 1 chapter of DDIA (Designing Data-Intensive Applications) weekly", "OCI migration: document what breaks and how you fixed it", "One LinkedIn post/month in English about what you built"],
    resources: ["Designing Data-Intensive Applications — Kleppmann (the architect book)", "System Design Interview — Alex Xu", "app.diagrams.net (free architecture diagrams)"],
    habit: "Friday: write 3 sentences about one decision you made this week and why",
  },
];

const MOODS = [
  { id: "great", label: "🔥 Great", advice: "You have energy — use it for your hardest task. Build something you've been putting off." },
  { id: "good", label: "😊 Good", advice: "Solid day. Follow your plan. One thing built, one thing pushed to GitHub." },
  { id: "okay", label: "😐 Okay", advice: "Do the minimum today. 20 min of AZ-900 or one Python function. That's enough." },
  { id: "tired", label: "😴 Tired", advice: "Light day. German practice (15 min) and that's it. Rest is part of the plan." },
  { id: "pms", label: "🌙 PMS", advice: "Everything is safe. Nothing is cancelled — just paused. German only today, or nothing at all. You've already done more than you think." },
  { id: "down", label: "💙 Down", advice: "You are building something real. Most people never start. You have projects on GitHub, an exam coming, and a plan to move to Germany. That's not small — that's enormous." },
];

function getWeekKey() {
  const d = new Date(), y = d.getFullYear();
  const start = new Date(y, 0, 1);
  return `${y}-W${Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7)}`;
}

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function journeyPercent() {
  const start = new Date("2025-06-01"), end = new Date("2027-07-01"), now = new Date();
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
}

// ─── HOME ─────────────────────────────────────────────────────────────────────

function HomeScreen({ logs, setLogs, checklist }) {
  const today = new Date().toISOString().split("T")[0];
  const todayLog = logs[today] || { mood: null, hours: 0 };
  const examDays = daysUntil(PROFILE.exam.date);
  const weekKey = getWeekKey();
  const weekTasks = checklist.filter(t => t.week === weekKey);
  const doneTasks = weekTasks.filter(t => t.done).length;
  const jp = journeyPercent();
  const currentMood = MOODS.find(m => m.id === todayLog.mood);

  const setMood = (id) => {
    const updated = { ...logs, [today]: { ...todayLog, mood: id } };
    setLogs(updated); save("logs", updated);
  };
  const setHours = (h) => {
    const updated = { ...logs, [today]: { ...todayLog, hours: h } };
    setLogs(updated); save("logs", updated);
  };

  return (
    <div>
      {/* Journey bar — the signature element */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={S.label}>Journey to Germany</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>{jp}% complete</span>
        </div>
        <ProgressBar value={jp} color={T.accent} height={8} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={S.small}>June 2025</span>
          <span style={S.small}>June/July 2027 🇩🇪</span>
        </div>
      </div>

      {/* Name + role */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>Good day, {PROFILE.name} 👋</div>
        <div style={{ ...S.body, marginTop: 4 }}>{PROFILE.role}</div>
      </div>

      {/* Key stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Days to AZ-900", value: examDays, color: T.blue, bg: T.blueLight },
          { label: "This week", value: `${doneTasks}/${weekTasks.length}`, color: T.green, bg: T.greenLight, suffix: "tasks" },
          { label: "Today", value: todayLog.hours || 0, color: T.accent, bg: T.accentLight, suffix: "hrs" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            {s.suffix && <div style={{ fontSize: 10, color: s.color, fontWeight: 500 }}>{s.suffix}</div>}
            <div style={{ ...S.small, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Divider />

      {/* Mood */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...S.label, marginBottom: 12 }}>How are you today?</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {MOODS.map(m => (
            <button key={m.id} onClick={() => setMood(m.id)} style={{
              padding: "7px 14px", borderRadius: 20, border: `1px solid ${todayLog.mood === m.id ? T.accent : T.border}`,
              background: todayLog.mood === m.id ? T.accentLight : T.bgCard,
              color: todayLog.mood === m.id ? T.accent : T.textMid,
              cursor: "pointer", fontSize: 13, fontWeight: todayLog.mood === m.id ? 600 : 400,
              transition: "all 0.15s",
            }}>{m.label}</button>
          ))}
        </div>
        {currentMood && (
          <div style={{ marginTop: 12, padding: "12px 16px", background: T.bgMuted, borderRadius: 10, ...S.body, borderLeft: `3px solid ${T.accent}` }}>
            {currentMood.advice}
          </div>
        )}
      </div>

      <Divider />

      {/* Today's focus */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...S.label, marginBottom: 12 }}>Today's focus</div>
        {["pms", "tired", "down"].includes(todayLog.mood) ? (
          <div style={{ ...S.body, padding: "12px 16px", background: T.bgMuted, borderRadius: 10 }}>
            🌙 Light day — German practice only (15 min). Everything else waits. Your plan is safe.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { color: T.blue, text: "AZ-900 — one topic from Microsoft Learn" },
              { color: T.accent, text: "Platform — one feature, built with Claude" },
              { color: T.green, text: "German — 15 min Duolingo · non-negotiable" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, borderLeft: `3px solid ${item.color}` }}>
                <span style={{ ...S.body }}>{item.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Log hours */}
      <div>
        <div style={{ ...S.label, marginBottom: 12 }}>Log today's study hours</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[0.5, 1, 1.5, 2, 2.5, 3, 3.5].map(h => (
            <button key={h} onClick={() => setHours(h)} style={{
              padding: "8px 14px", borderRadius: 8, border: `1px solid ${todayLog.hours === h ? T.accent : T.border}`,
              background: todayLog.hours === h ? T.accentLight : T.bgCard,
              color: todayLog.hours === h ? T.accent : T.textMid,
              cursor: "pointer", fontSize: 13, fontWeight: todayLog.hours === h ? 700 : 400,
              transition: "all 0.15s",
            }}>{h}h</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PLAN ─────────────────────────────────────────────────────────────────────

function PlanScreen() {
  const [active, setActive] = useState(TRACKS[0].id);
  const track = TRACKS.find(t => t.id === active);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.h2}>Your Learning Path</div>
        <div style={{ ...S.body, marginTop: 4 }}>Six tracks, in priority order. Build through coding — not courses.</div>
      </div>

      {/* Track selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
        {TRACKS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
            background: active === t.id ? T.bgMuted : T.bgCard,
            border: `1px solid ${active === t.id ? t.color : T.border}`,
            borderRadius: 10, cursor: "pointer", textAlign: "left",
            transition: "all 0.15s",
          }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: active === t.id ? t.color : T.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{t.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: active === t.id ? t.color : T.text }}>{t.priority}. {t.label}</div>
              <div style={{ fontSize: 11, color: T.textLight, marginTop: 1 }}>{t.deadline}</div>
            </div>
            {t.weekend && <Pill color={T.accent} bg={T.accentLight} border={T.accentBorder}>Weekend priority</Pill>}
          </button>
        ))}
      </div>

      {track && (
        <div>
          <Divider />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 24 }}>{track.icon}</span>
            <div>
              <div style={S.h3}>{track.label}</div>
              <div style={{ fontSize: 12, color: T.textLight }}>{track.deadline}</div>
            </div>
          </div>

          <div style={{ padding: "12px 16px", background: T.bgMuted, borderRadius: 10, marginBottom: 20, borderLeft: `3px solid ${track.color}` }}>
            <div style={S.label}>Monthly goal</div>
            <div style={{ ...S.body, marginTop: 4, fontWeight: 500, color: T.text }}>{track.monthly}</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ ...S.label, marginBottom: 12 }}>Step by step</div>
            {track.steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: track.color + "18", border: `1.5px solid ${track.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: track.color }}>{i + 1}</span>
                </div>
                <span style={S.body}>{s}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ ...S.label, marginBottom: 10 }}>Resources</div>
            {track.resources.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                <span style={{ color: track.color, fontSize: 12, marginTop: 2 }}>→</span>
                <span style={S.body}>{r}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: "12px 16px", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10 }}>
            <div style={S.label}>Daily habit</div>
            <div style={{ ...S.body, marginTop: 4 }}>{track.habit}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CHECKLIST ────────────────────────────────────────────────────────────────

function ChecklistScreen({ checklist, setChecklist }) {
  const week = getWeekKey();
  const [expanded, setExpanded] = useState(null);

  // Merge WEEKLY_TASKS with saved checklist state
  const weekTasks = WEEKLY_TASKS.map(t => {
    const saved = checklist.find(c => c.id === t.id && c.week === week);
    return { ...t, done: saved ? saved.done : false, week };
  });

  const done = weekTasks.filter(t => t.done).length;
  const totalTime = "~10 ساعت";

  const toggle = (id) => {
    const existing = checklist.find(c => c.id === id && c.week === week);
    let updated;
    if (existing) {
      updated = checklist.map(c => c.id === id && c.week === week ? { ...c, done: !c.done } : c);
    } else {
      updated = [...checklist, { id, week, done: true }];
    }
    setChecklist(updated);
    save("checklist", updated);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.h2}>این هفته</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
          <div style={S.body}>{done} of {weekTasks.length} tasks complete</div>
          <div style={{ fontSize: 12, color: T.textLight }}>جمع: {totalTime}</div>
        </div>
        <div style={{ marginTop: 10 }}>
          <ProgressBar value={(done / weekTasks.length) * 100} color={T.green} height={6} />
        </div>
      </div>

      <div>
        {weekTasks.map((task, i) => {
          const tr = TRACKS.find(t => t.id === task.track);
          const isOpen = expanded === task.id;
          return (
            <div key={task.id} style={{ borderBottom: `1px solid ${T.border}` }}>
              {/* Task row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0" }}>
                <button onClick={() => toggle(task.id)} style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${task.done ? tr?.color || T.accent : T.border}`,
                  background: task.done ? tr?.color || T.accent : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {task.done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: task.done ? T.textLight : T.text, textDecoration: task.done ? "line-through" : "none", lineHeight: 1.4 }}>
                    {task.text}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                    {tr && <span style={{ fontSize: 11, color: tr.color }}>{tr.icon} {tr.label}</span>}
                    <span style={{ fontSize: 11, color: T.textLight }}>⏱ {task.time}</span>
                    {task.weekend && <span style={{ fontSize: 11, color: T.gold }}>📅 آخر هفته</span>}
                  </div>
                </div>
                <button onClick={() => setExpanded(isOpen ? null : task.id)} style={{
                  background: "none", border: "none", color: T.textLight, cursor: "pointer",
                  fontSize: 18, padding: "0 4px", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s",
                }}>▾</button>
              </div>

              {/* Expanded how-to */}
              {isOpen && (
                <div style={{ paddingBottom: 14, paddingLeft: 34 }}>
                  <div style={{ background: T.bgMuted, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                    <div style={{ ...S.label, marginBottom: 6 }}>چطور بخونم / انجام بدم</div>
                    <div style={{ ...S.body, color: T.text }}>{task.how}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span style={{ color: tr?.color || T.accent, fontSize: 12, marginTop: 2 }}>→</span>
                    <span style={{ fontSize: 12, color: T.blue }}>{task.resource}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {done === weekTasks.length && (
        <div style={{ textAlign: "center", padding: "24px 0", color: T.green, fontSize: 15, fontWeight: 600 }}>
          🎉 هفته کامل شد! عالی بود.
        </div>
      )}
    </div>
  );
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────────

function ProgressScreen({ logs }) {
  const totalHours = Object.values(logs).reduce((s, d) => s + (d.hours || 0), 0);
  const activeDays = Object.keys(logs).filter(k => logs[k].hours > 0).length;

  const weeklyData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (11 - i) * 7);
    const key = d.toISOString().split("T")[0].slice(0, 7);
    const hrs = Object.entries(logs).filter(([k]) => k.startsWith(key)).reduce((s, [, v]) => s + (v.hours || 0), 0);
    return { week: `W${i + 1}`, hours: hrs, target: 8 };
  });

  const visionData = [
    { year: "2025", salary: 0, journey: 5 },
    { year: "2026", salary: 0, journey: 40 },
    { year: "2027", salary: 70, journey: 65 },
    { year: "2028", salary: 95, journey: 80 },
    { year: "2030", salary: 115, journey: 93 },
    { year: "2032", salary: 125, journey: 100 },
  ];

  const customTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: T.text }}>{label}</div>
        {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {p.value}{p.name === "salary" ? "k€" : p.name === "hours" ? "h" : "%"}</div>)}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.h2}>Your Progress</div>
        <div style={{ ...S.body, marginTop: 4 }}>Every hour logged. Every milestone ahead.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
        {[
          { label: "Total hours", value: totalHours.toFixed(1), suffix: "hrs", color: T.accent, bg: T.accentLight },
          { label: "Active days", value: activeDays, suffix: "days", color: T.green, bg: T.greenLight },
          { label: "AZ-900 exam", value: daysUntil(PROFILE.exam.date), suffix: "days left", color: T.blue, bg: T.blueLight },
          { label: "Germany move", value: "June", suffix: "2027", color: T.purple, bg: T.purpleLight },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 500 }}>{s.suffix}</div>
            <div style={{ ...S.small, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ ...S.label, marginBottom: 14 }}>Weekly study hours — last 12 weeks</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
            <XAxis dataKey="week" tick={{ fill: T.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={customTooltip} />
            <Bar dataKey="hours" fill={T.accent} radius={[4, 4, 0, 0]} name="hours" maxBarSize={32} />
            <Bar dataKey="target" fill={T.bgMuted} radius={[4, 4, 0, 0]} name="target" maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ ...S.label, marginBottom: 14 }}>5-year vision — salary & journey</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={visionData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.green} stopOpacity={0.2} />
                <stop offset="95%" stopColor={T.green} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="journeyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.accent} stopOpacity={0.15} />
                <stop offset="95%" stopColor={T.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
            <XAxis dataKey="year" tick={{ fill: T.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={customTooltip} />
            <Area type="monotone" dataKey="salary" stroke={T.green} strokeWidth={2} fill="url(#salaryGrad)" name="salary" dot={{ fill: T.green, r: 3 }} />
            <Area type="monotone" dataKey="journey" stroke={T.accent} strokeWidth={2} fill="url(#journeyGrad)" name="journey" dot={{ fill: T.accent, r: 3 }} strokeDasharray="5 4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div style={{ ...S.label, marginBottom: 14 }}>Milestones</div>
        {PROFILE.vision.map((v, i) => (
          <div key={i} style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: v.active ? T.accent : T.border, border: `2px solid ${v.active ? T.accent : T.border}`, marginTop: 3 }} />
              {i < PROFILE.vision.length - 1 && <div style={{ width: 1, height: 30, background: T.border, marginTop: 4 }} />}
            </div>
            <div style={{ paddingBottom: 4 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: v.active ? T.accent : T.text }}>{v.year}</span>
                {v.salary && <Pill color={T.green} bg={T.greenLight} border={T.greenBorder}>{v.salary}</Pill>}
              </div>
              <div style={{ ...S.body, marginTop: 2 }}>{v.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CV BUILDER ───────────────────────────────────────────────────────────────

function CVScreen({ logs, checklist }) {
  const [currentCV, setCurrentCV] = useState(() => load("currentCV", ""));
  const [generatedCV, setGeneratedCV] = useState(() => load("generatedCV", ""));
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("3mo");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const totalHours = Object.values(logs).reduce((s, d) => s + (d.hours || 0), 0);
  const doneTasks = checklist.filter(t => t.done).length;

  const saveCV = (val) => { setCurrentCV(val); save("currentCV", val); };

  const handleCVFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg("Reading file...");
    try {
      const text = await extractTextFromFile(file);
      if (!text) {
        setUploadMsg("Couldn't find any text in that file.");
      } else {
        saveCV(text);
        setUploadMsg(`Loaded "${file.name}".`);
      }
    } catch {
      setUploadMsg("Couldn't read that file. Supported: .txt, .md, .pdf, .docx");
    }
    setUploading(false);
    e.target.value = "";
  };

  const buildPrompt = () => {
    const periodLabel = { "3mo": "3 months", "6mo": "6 months", "1yr": "1 year" }[period];
    const completedTracks = TRACKS.map(t => {
      const tasks = checklist.filter(c => c.track === t.id && c.done);
      return tasks.length > 0 ? `${t.label}: ${tasks.map(tk => tk.text).join(", ")}` : null;
    }).filter(Boolean);

    return `You are a professional CV writer specializing in data engineering roles in the German tech market.

Here is Ghazale's current CV / background:
${currentCV || "Data Engineer at NTT DATA Italia. Oracle SQL, PL/SQL (medium), OCI migration (ongoing), Revenue Assurance domain. Building an AI assistant platform. AZ-900 exam in September 2025. CS degree University of Rome. GitHub: ensranjbar."}

Here is what she has ACTUALLY accomplished in the last ${periodLabel}:
- Total study hours logged: ${totalHours.toFixed(1)} hours
- Tasks completed: ${doneTasks} tasks
- Completed activities: ${completedTracks.length > 0 ? completedTracks.join("; ") : "Building Python/AI platform at work, studying AZ-900"}
- Currently: OCI migration at NTT DATA, building AI assistant with Claude/OpenAI

Target: Senior Data Engineer / Data Architect roles in Germany (Berlin, Munich, Frankfurt, Hamburg)
Target salary: €65–75k entry, growing to €100–130k as architect
Visa: EU Blue Card applicant

Write a clean, professional CV in English with German Lebenslauf structure. Include:
1. Professional summary (3 sentences — senior level, confident, Germany-ready)
2. Work experience (NTT DATA — highlight OCI migration and AI platform)
3. Skills (technical: Oracle, Python, OCI, Azure (AZ-900), AI/LLM integration; soft: bridge between legacy and modern systems)
4. Education
5. Projects (GitHub: ensranjbar — list what's there)
6. Languages (Italian native, English professional, German A1 learning)
7. Certifications (AZ-900 in progress — September 2025)

Make it honest — only include what she has actually done. Make it confident — she has real experience with Oracle, data migration, and AI integration. Format cleanly with clear sections.`;
  };

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2000, messages: [{ role: "user", content: buildPrompt() }] }),
      });
      const data = await res.json();
      const text = (data.content || []).map(b => b.text || "").join("").trim();
      setGeneratedCV(text);
      save("generatedCV", text);
    } catch (e) {
      setGeneratedCV("Error generating CV. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.h2}>CV Builder</div>
        <div style={{ ...S.body, marginTop: 4 }}>Your CV updates based on your real progress. Paste your current CV below, choose a period, and generate.</div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ ...S.label, marginBottom: 10 }}>Your current CV or background (optional)</div>
        <textarea
          value={currentCV}
          onChange={e => saveCV(e.target.value)}
          placeholder="Paste your current CV here, or leave empty — I already know your profile from NTT DATA, Oracle, PL/SQL, OCI migration, AI platform..."
          style={{ width: "100%", minHeight: 120, padding: "12px 14px", border: `1px solid ${T.border}`, borderRadius: 10, background: T.bgCard, color: T.text, fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }}
        />
        <div style={{ marginTop: 8 }}>
          <div style={{ ...S.small, marginBottom: 6 }}>Or upload your CV (.pdf, .docx, .txt, .md) to fill the box above</div>
          <input type="file" accept=".pdf,.docx,.txt,.md" onChange={handleCVFile} disabled={uploading}
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 8, background: T.bgCard, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
          />
          {uploadMsg && <div style={{ ...S.body, marginTop: 6 }}>{uploadMsg}</div>}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ ...S.label, marginBottom: 10 }}>Show progress from the last</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ id: "3mo", label: "3 months" }, { id: "6mo", label: "6 months" }, { id: "1yr", label: "1 year" }].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} style={{
              padding: "8px 16px", borderRadius: 8, border: `1px solid ${period === p.id ? T.accent : T.border}`,
              background: period === p.id ? T.accentLight : T.bgCard,
              color: period === p.id ? T.accent : T.textMid,
              cursor: "pointer", fontSize: 13, fontWeight: period === p.id ? 600 : 400,
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      <button onClick={generate} disabled={loading} style={{
        width: "100%", padding: "13px 0", background: loading ? T.bgMuted : T.accent,
        border: "none", borderRadius: 10, color: loading ? T.textLight : "#fff",
        fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginBottom: 24,
        transition: "all 0.15s",
      }}>
        {loading ? "Generating your CV..." : "Generate updated CV →"}
      </button>

      {generatedCV && (
        <div>
          <Divider />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={S.label}>Your updated CV</div>
            <button onClick={() => navigator.clipboard?.writeText(generatedCV)} style={{ padding: "6px 12px", border: `1px solid ${T.border}`, borderRadius: 6, background: T.bgCard, color: T.textMid, cursor: "pointer", fontSize: 12 }}>
              Copy
            </button>
          </div>
          <div style={{ background: T.bgMuted, borderRadius: 10, padding: "20px", fontSize: 13, color: T.text, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "Georgia, serif" }}>
            {generatedCV}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COACH CHAT ───────────────────────────────────────────────────────────────

function ChatScreen({ logs, checklist }) {
  const totalHours = Object.values(logs).reduce((s, d) => s + (d.hours || 0), 0);
  const doneTasks = checklist.filter(t => t.done).length;
  const [messages, setMessages] = useState([{
    role: "assistant",
    text: `Hi Ghazale 👋\n\nI'm your personal learning coach. I know where you are and where you're going:\n\n🎯 AZ-900 in ${daysUntil(PROFILE.exam.date)} days\n📊 ${totalHours.toFixed(1)} study hours logged so far\n✅ ${doneTasks} tasks completed\n🇩🇪 Germany — June/July 2027\n🏛️ German passport — 2032\n💼 Target: Data Architect, €100–130k\n\nTell me how you're doing. Ask me anything — new ideas, feeling overwhelmed, want to add something to your plan, or just need a check-in.`,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const context = `You are Ghazale's personal learning and career coach. You know her completely.

PROFILE:
- Data Engineer, NTT DATA Italia, Rome, Revenue Assurance
- Bachelor CS/Engineering, University of Rome
- GitHub: ensranjbar
- Skills: Oracle SQL, PL/SQL (medium), OCI migration (live at work), building AI assistant platform with Claude
- Gap: uses AI to build but wants to understand the architecture she's creating

GOALS (priority order):
1. AZ-900 Azure Fundamentals — September 2025 (${daysUntil(PROFILE.exam.date)} days away)
2. Python + JSON mastery — through building, not courses
3. AI as builder tool — understand everything she builds
4. Germany move — June/July 2027 — Blue Card
5. Automate daily NTT DATA work
6. Data Architect thinking — document every decision

LONG TERM: Data Architect, €100–130k, fluent English + German, German passport 2032

PROGRESS SO FAR: ${totalHours.toFixed(1)} study hours logged, ${doneTasks} tasks completed

SCHEDULE: Works from home 9-6. Gym 2-3x/week (~2hrs each). 2 therapy sessions/week. ~8-10 hrs study/week on weekdays + 6 hrs weekend (3 hrs Sat + 3 hrs Sun). Has PMS periods — be compassionate and flexible.

LEARNING STYLE: Builds with Claude — learns through doing, not courses. Writes all GitHub content in English. 15 min German daily.

YOUR ROLE: Be her warm, direct, honest mentor. When overwhelmed: simplify to one thing. When down: remind her what she's built and where she's going. When she adds new ideas: filter against her goals (urgent/later/never). Celebrate progress specifically. Never be generic. Keep responses concise — 3-5 sentences unless she needs more. Speak like a trusted mentor, not a chatbot.`;

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 800,
          system: context,
          messages: messages.slice(1).concat({ role: "user", content: userMsg }).map(m => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json();
      const text = (data.content || []).map(b => b.text || "").join("").trim();
      setMessages(prev => [...prev, { role: "assistant", text: text || "I'm here — try again in a moment." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Connection issue. Try again in a moment." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={S.h2}>Your Coach</div>
        <div style={{ ...S.body, marginTop: 4 }}>Your full profile is always loaded. Each session is fresh.</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
            <div style={{
              maxWidth: "82%", padding: "11px 15px", borderRadius: 12,
              background: m.role === "user" ? T.accent : T.bgMuted,
              color: m.role === "user" ? "#fff" : T.text,
              fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
              borderBottomRightRadius: m.role === "user" ? 4 : 12,
              borderBottomLeftRadius: m.role === "assistant" ? 4 : 12,
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
            <div style={{ padding: "11px 15px", borderRadius: 12, borderBottomLeftRadius: 4, background: T.bgMuted, color: T.textLight, fontSize: 14 }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask me anything — progress, new ideas, overwhelmed, feeling down..."
          style={{ flex: 1, padding: "11px 14px", border: `1px solid ${T.border}`, borderRadius: 10, background: T.bgCard, color: T.text, fontSize: 14, outline: "none" }}
        />
        <button onClick={send} disabled={loading} style={{
          padding: "11px 20px", background: loading ? T.bgMuted : T.accent, border: "none",
          borderRadius: 10, color: loading ? T.textLight : "#fff", cursor: loading ? "not-allowed" : "pointer",
          fontSize: 14, fontWeight: 600, transition: "all 0.15s",
        }}>Send</button>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "home", label: "Home" },
  { id: "plan", label: "Plan" },
  { id: "week", label: "Week" },
  { id: "progress", label: "Progress" },
  { id: "expenses", label: "Expenses" },
  { id: "cv", label: "CV" },
  { id: "coach", label: "Coach" },
];

export default function GrowthOS() {
  const [screen, setScreen] = useState("home");
  const [logs, setLogs] = useState(() => load("logs", {}));
  const [checklist, setChecklist] = useState(() => load("checklist", []));

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", color: T.text }}>
      {/* Top journey bar */}
      <div style={{ height: 3, background: T.bgMuted, position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div style={{ height: "100%", width: `${journeyPercent()}%`, background: T.accent, transition: "width 1s ease" }} />
      </div>

      {/* Nav */}
      <div style={{ position: "fixed", top: 3, left: 0, right: 0, background: T.bgCard, borderBottom: `1px solid ${T.border}`, zIndex: 99, padding: "0 16px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setScreen(t.id)} style={{
              padding: "14px 16px", background: "none", border: "none", borderBottom: `2px solid ${screen === t.id ? T.accent : "transparent"}`,
              color: screen === t.id ? T.accent : T.textMid, cursor: "pointer",
              fontSize: 13, fontWeight: screen === t.id ? 600 : 400, whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "72px 16px 40px" }}>
        {screen === "home" && <HomeScreen logs={logs} setLogs={setLogs} checklist={checklist} />}
        {screen === "plan" && <PlanScreen />}
        {screen === "week" && <ChecklistScreen checklist={checklist} setChecklist={setChecklist} />}
        {screen === "progress" && <ProgressScreen logs={logs} />}
        {screen === "expenses" && <ExpensesScreen />}
        {screen === "cv" && <CVScreen logs={logs} checklist={checklist} />}
        {screen === "coach" && <ChatScreen logs={logs} checklist={checklist} />}
      </div>
    </div>
  );
}

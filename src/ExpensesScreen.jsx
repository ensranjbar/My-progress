import { useState, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { T, S, Divider, load, save } from "./shared";
import { parseExpensesExcel } from "./fileParsers";

const DEFAULT_CATEGORIES = ["Rent", "Groceries", "Transport", "Utilities", "Health", "Entertainment", "Shopping", "Savings", "Other"];

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const todayStr = () => new Date().toISOString().split("T")[0];
const monthStr = () => new Date().toISOString().slice(0, 7);

const fieldStyle = { padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 8, background: T.bgCard, color: T.text, fontSize: 13, outline: "none", fontFamily: "inherit" };

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState(() => load("expenses", []));
  const [budgets, setBudgets] = useState(() => load("budgets", {}));
  const [viewMode, setViewMode] = useState("all");
  const [month, setMonth] = useState(monthStr());
  const [form, setForm] = useState({ date: todayStr(), category: DEFAULT_CATEGORIES[0], amount: "", note: "" });
  const [newCategory, setNewCategory] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const categories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);
    expenses.forEach(e => e.category && set.add(e.category));
    Object.keys(budgets).forEach(c => set.add(c));
    return Array.from(set);
  }, [expenses, budgets]);

  const persistExpenses = (list) => { setExpenses(list); save("expenses", list); };
  const persistBudgets = (obj) => { setBudgets(obj); save("budgets", obj); };

  const addExpense = () => {
    const amount = parseFloat(form.amount);
    if (!form.date || !form.category || isNaN(amount) || amount <= 0) return;
    const entry = { id: uid(), date: form.date, category: form.category, amount, note: form.note.trim() };
    persistExpenses([entry, ...expenses]);
    setForm(f => ({ ...f, amount: "", note: "" }));
  };

  const removeExpense = (id) => persistExpenses(expenses.filter(e => e.id !== id));

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name || categories.includes(name)) return;
    persistBudgets({ ...budgets, [name]: budgets[name] || 0 });
    setForm(f => ({ ...f, category: name }));
    setNewCategory("");
  };

  const setBudget = (cat, val) => {
    const n = parseFloat(val);
    persistBudgets({ ...budgets, [cat]: isNaN(n) ? 0 : n });
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg("Importing...");
    try {
      const rows = await parseExpensesExcel(file);
      if (rows.length === 0) {
        setImportMsg("No rows found — make sure the file has Date, Category, Amount columns.");
      } else {
        persistExpenses([...rows.map(r => ({ id: uid(), ...r })), ...expenses]);
        setImportMsg(`Imported ${rows.length} ${rows.length === 1 ? "row" : "rows"}.`);
      }
    } catch {
      setImportMsg("Couldn't read that file. Please upload a .xlsx, .xls, or .csv file.");
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const filteredExpenses = useMemo(
    () => viewMode === "all" ? expenses : expenses.filter(e => e.date?.startsWith(month)),
    [expenses, month, viewMode]
  );
  const totalSpent = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = Object.values(budgets).reduce((s, v) => s + (v || 0), 0);
  const diff = totalBudget - totalSpent;

  const chartData = useMemo(() => {
    const byCategory = {};
    filteredExpenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    const cats = new Set([...Object.keys(budgets).filter(c => budgets[c] > 0), ...Object.keys(byCategory)]);
    return Array.from(cats).map(c => ({ category: c, expected: budgets[c] || 0, actual: Math.round((byCategory[c] || 0) * 100) / 100 }));
  }, [filteredExpenses, budgets]);

  const sortedExpenses = useMemo(() => [...expenses].sort((a, b) => (b.date || "").localeCompare(a.date || "")), [expenses]);

  const customTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: T.text }}>{label}</div>
        {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: €{Number(p.value).toFixed(2)}</div>)}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.h2}>Expenses</div>
        <div style={{ ...S.body, marginTop: 4 }}>Track spending, set expected budgets per category, and import from Excel.</div>
      </div>

      {/* View mode: all time vs a specific month */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        {[{ id: "all", label: "All time" }, { id: "month", label: "By month" }].map(opt => (
          <button key={opt.id} onClick={() => setViewMode(opt.id)} style={{
            padding: "8px 16px", borderRadius: 8, border: `1px solid ${viewMode === opt.id ? T.accent : T.border}`,
            background: viewMode === opt.id ? T.accentLight : T.bgCard,
            color: viewMode === opt.id ? T.accent : T.textMid,
            cursor: "pointer", fontSize: 13, fontWeight: viewMode === opt.id ? 600 : 400,
          }}>{opt.label}</button>
        ))}
        {viewMode === "month" && (
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
        )}
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
        <div style={{ background: T.accentLight, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.accent }}>€{totalSpent.toFixed(2)}</div>
          <div style={{ ...S.small, marginTop: 4 }}>Spent {viewMode === "all" ? "(all time)" : "this month"}</div>
        </div>
        <div style={{ background: T.blueLight, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.blue }}>€{totalBudget.toFixed(2)}</div>
          <div style={{ ...S.small, marginTop: 4 }}>Expected budget (monthly)</div>
        </div>
        <div style={{ background: diff >= 0 ? T.greenLight : T.accentLight, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: diff >= 0 ? T.green : T.accent }}>{diff >= 0 ? "+" : ""}€{diff.toFixed(2)}</div>
          <div style={{ ...S.small, marginTop: 4 }}>{diff >= 0 ? "Under budget" : "Over budget"}</div>
        </div>
      </div>

      {/* Chart: expected vs actual */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ ...S.label, marginBottom: 14 }}>Expected vs actual spend by category{viewMode === "all" ? " (all time)" : ""}</div>
        {chartData.length === 0 ? (
          <div style={{ ...S.body, padding: "16px 0", textAlign: "center" }}>Add expenses or set budgets to see this chart.</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 44)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: T.textLight, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fill: T.textMid, fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={customTooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="expected" fill={T.blue} radius={[0, 4, 4, 0]} name="Expected" maxBarSize={16} />
              <Bar dataKey="actual" fill={T.accent} radius={[0, 4, 4, 0]} name="Actual" maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <Divider />

      {/* Budgets per category */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...S.label, marginBottom: 12 }}>Expected budget per category</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {categories.map(cat => (
            <div key={cat} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ ...S.body, color: T.text }}>{cat}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: T.textLight, fontSize: 13 }}>€</span>
                <input
                  type="number" min="0" step="1"
                  value={budgets[cat] || ""}
                  onChange={e => setBudget(cat, e.target.value)}
                  placeholder="0"
                  style={{ ...fieldStyle, width: 90, textAlign: "right" }}
                />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            value={newCategory} onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCategory()}
            placeholder="New category name"
            style={{ ...fieldStyle, flex: 1 }}
          />
          <button onClick={addCategory} style={{ padding: "10px 16px", border: `1px solid ${T.border}`, borderRadius: 8, background: T.bgCard, color: T.textMid, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            Add category
          </button>
        </div>
      </div>

      <Divider />

      {/* Add expense */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...S.label, marginBottom: 12 }}>Add an expense</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ ...fieldStyle }} />
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...fieldStyle }}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount (€)" style={{ ...fieldStyle }} />
          <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Note (optional)" style={{ ...fieldStyle }} />
        </div>
        <button onClick={addExpense} style={{ width: "100%", padding: "11px 0", background: T.accent, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Add expense
        </button>
      </div>

      {/* Excel upload */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...S.label, marginBottom: 12 }}>Or import from Excel / CSV</div>
        <div style={{ ...S.small, marginBottom: 8 }}>File should have columns like Date, Category, Amount, Note. All sheets/tabs in the file are read.</div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} disabled={importing} style={{ ...fieldStyle, width: "100%", boxSizing: "border-box" }} />
        {importMsg && <div style={{ ...S.body, marginTop: 8 }}>{importMsg}</div>}
      </div>

      <Divider />

      {/* Table */}
      <div>
        <div style={{ ...S.label, marginBottom: 12 }}>All expenses</div>
        {sortedExpenses.length === 0 ? (
          <div style={{ ...S.body, padding: "16px 0", textAlign: "center" }}>No expenses yet — add one above or import a file.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Date", "Category", "Amount", "Note", ""].map((h, i) => (
                    <th key={i} style={{ textAlign: i === 2 ? "right" : "left", padding: "8px 6px", borderBottom: `1px solid ${T.border}`, color: T.textLight, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map(e => (
                  <tr key={e.id}>
                    <td style={{ padding: "8px 6px", borderBottom: `1px solid ${T.border}`, color: T.textMid, whiteSpace: "nowrap" }}>{e.date || "—"}</td>
                    <td style={{ padding: "8px 6px", borderBottom: `1px solid ${T.border}`, color: T.text }}>{e.category}</td>
                    <td style={{ padding: "8px 6px", borderBottom: `1px solid ${T.border}`, color: T.text, textAlign: "right", fontWeight: 600 }}>€{e.amount.toFixed(2)}</td>
                    <td style={{ padding: "8px 6px", borderBottom: `1px solid ${T.border}`, color: T.textLight }}>{e.note}</td>
                    <td style={{ padding: "8px 6px", borderBottom: `1px solid ${T.border}`, textAlign: "right" }}>
                      <button onClick={() => removeExpense(e.id)} style={{ background: "none", border: "none", color: T.textLight, cursor: "pointer", fontSize: 14, padding: "0 4px" }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

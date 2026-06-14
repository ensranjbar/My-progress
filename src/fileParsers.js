// ─── FILE PARSING HELPERS ───────────────────────────────────────────────────
// Heavy parsing libraries (xlsx, mammoth, pdfjs-dist) are loaded on demand via
// dynamic import so they don't bloat the main app bundle.

const readArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

const readText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

function toIsoDate(val) {
  if (val instanceof Date && !isNaN(val)) return val.toISOString().split("T")[0];
  if (typeof val === "number") {
    // Excel serial date (days since 1899-12-30)
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d)) return d.toISOString().split("T")[0];
  }
  if (typeof val === "string") {
    const d = new Date(val);
    if (!isNaN(d)) return d.toISOString().split("T")[0];
    return val.trim();
  }
  return "";
}

function toAmount(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.,-]/g, "").replace(/,(?=\d{3}(\D|$))/g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

const HEADER_KEYS = {
  date: ["date", "data", "day", "giorno"],
  category: ["category", "categoria", "type", "tipo", "group"],
  amount: ["amount", "spent", "spesa", "cost", "price", "importo", "value", "total", "totale"],
  note: ["note", "notes", "description", "desc", "memo", "details", "descrizione"],
};

function matchHeader(headers, keys) {
  return headers.find(h => {
    const lower = h.toLowerCase().trim();
    return keys.some(k => lower.includes(k));
  });
}

// Parses an .xlsx/.xls/.csv file into an array of { date, category, amount, note }.
// Reads every sheet in the workbook (not just the first) and merges the results,
// since expense workbooks are often split across monthly or per-account tabs.
export async function parseExpensesExcel(file) {
  const XLSX = await import("xlsx");
  const buf = await readArrayBuffer(file);
  const workbook = XLSX.read(buf, { type: "array", cellDates: true });

  const result = [];
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
    if (rows.length === 0) continue;

    const headers = Object.keys(rows[0]);
    const dateCol = matchHeader(headers, HEADER_KEYS.date);
    const categoryCol = matchHeader(headers, HEADER_KEYS.category);
    const amountCol = matchHeader(headers, HEADER_KEYS.amount);
    const noteCol = matchHeader(headers, HEADER_KEYS.note);

    // Skip sheets that don't look like expense data at all.
    if (!dateCol && !amountCol) continue;

    rows
      .map(row => ({
        date: dateCol ? toIsoDate(row[dateCol]) : "",
        category: categoryCol ? String(row[categoryCol]).trim() : sheetName,
        amount: amountCol ? toAmount(row[amountCol]) : 0,
        note: noteCol ? String(row[noteCol]).trim() : "",
      }))
      .filter(e => e.amount !== 0 || e.date)
      .forEach(e => result.push(e));
  }

  return result;
}

// Extracts plain text from a CV file (.txt, .md, .pdf, .docx)
export async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const pdfjsLib = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    const buf = await readArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map(it => it.str).join(" "));
    }
    return pages.join("\n\n").trim();
  }

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const buf = await readArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return result.value.trim();
  }

  // .txt, .md, and anything else readable as plain text
  const text = await readText(file);
  return text.trim();
}

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPREADSHEET_ID = '18sqvajQhwu2UuF0HZewAdsveTLzJ280yDryJ9bKUsOM';
const PORT = Number(process.env.PORT) || 3000;

interface GvizCell {
  v?: unknown;
  f?: string;
}

interface GvizResponse {
  status?: string;
  table?: {
    cols?: Array<{ id?: string; label?: string; type?: string }>;
    rows?: Array<{ c?: Array<GvizCell | null> }>;
    parsedNumHeaders?: number;
  };
}

function cellToString(cell: GvizCell | null | undefined): string {
  if (!cell) return '';
  if (cell.v === null || cell.v === undefined) return '';
  if (typeof cell.v === 'string') {
    // Handle gviz Date(Y,M,D,H,m,s) format if a date cell was serialized by Sheets
    const dateMatch = cell.v.match(
      /^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/
    );
    if (dateMatch) {
      if (cell.f) return cell.f.trim();
      const pad = (n: number) => String(n).padStart(2, '0');
      const y = Number(dateMatch[1]);
      const m = Number(dateMatch[2]) + 1;
      const d = Number(dateMatch[3]);
      const h = Number(dateMatch[4] ?? 0);
      const min = Number(dateMatch[5] ?? 0);
      const s = Number(dateMatch[6] ?? 0);
      return `${y}-${pad(m)}-${pad(d)} ${pad(h)}:${pad(min)}:${pad(s)}`;
    }
    return cell.v.trim();
  }
  if (typeof cell.v === 'number') {
    return String(cell.v);
  }
  return String(cell.v).trim();
}

function cellToNumber(cell: GvizCell | null | undefined): number {
  if (!cell || cell.v === null || cell.v === undefined) return 0;
  const n = Number(cell.v);
  return Number.isFinite(n) ? n : 0;
}

async function fetchGvizSheet(sheetName: string): Promise<{
  headers: string[];
  rows: Array<Array<GvizCell | null>>;
}> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    sheetName
  )}&_t=${Date.now()}`;

  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json, text/javascript' },
  });

  if (!res.ok) {
    throw new Error(`Google Sheets returned HTTP ${res.status} for ${sheetName}`);
  }

  const text = await res.text();
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error(`Invalid Google Sheets response for ${sheetName}`);
  }

  const parsed = JSON.parse(text.slice(startIdx, endIdx + 1)) as GvizResponse;
  const table = parsed.table;
  if (!table) {
    return { headers: [], rows: [] };
  }

  const cols = (table.cols ?? []).map((c) => (c.label || '').trim().toLowerCase());
  const rawRows = (table.rows ?? []).map((r) => r.c ?? []);
  const parsedNumHeaders = table.parsedNumHeaders ?? 0;

  if (parsedNumHeaders >= 1) {
    return { headers: cols, rows: rawRows };
  }

  if (rawRows.length > 0) {
    const firstRowText = rawRows[0].map((c) => cellToString(c).toLowerCase());
    const looksLikeHeader =
      firstRowText.includes('st_id') ||
      firstRowText.includes('log_id') ||
      firstRowText.includes('dob');
    if (looksLikeHeader) {
      return { headers: firstRowText, rows: rawRows.slice(1) };
    }
  }

  return { headers: cols, rows: rawRows };
}

function buildColIndex(headers: string[], defaults: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  defaults.forEach((key, idx) => {
    const found = headers.indexOf(key);
    map[key] = found !== -1 ? found : idx;
  });
  return map;
}

function normalizeStressText(raw: string, totalScore: number): string {
  const trimmed = raw.trim();
  if (
    trimmed === 'ความเครียดน้อย' ||
    trimmed === 'ความเครียดปานกลาง' ||
    trimmed === 'ความเครียดมาก' ||
    trimmed === 'ความเครียดมากที่สุด'
  ) {
    return trimmed;
  }
  if (totalScore <= 4) return 'ความเครียดน้อย';
  if (totalScore <= 7) return 'ความเครียดปานกลาง';
  if (totalScore <= 9) return 'ความเครียดมาก';
  return 'ความเครียดมากที่สุด';
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/sheets/data', async (_req, res) => {
    try {
      const [memberSheet, logSheet] = await Promise.all([
        fetchGvizSheet('MEMBER'),
        fetchGvizSheet('ASSESSMENT_LOG'),
      ]);

      const mCols = buildColIndex(memberSheet.headers, [
        'st_id',
        'prefix',
        'name',
        'lname',
        'dob',
        'email',
        'course',
      ]);

      const members = memberSheet.rows
        .map((row) => {
          const stId = cellToString(row[mCols.st_id]);
          if (!stId) return null;
          const rawDob = cellToString(row[mCols.dob]);
          const dob = /^\d{7}$/.test(rawDob) ? rawDob.padStart(8, '0') : rawDob;
          return {
            st_id: stId,
            prefix: cellToString(row[mCols.prefix]),
            name: cellToString(row[mCols.name]),
            lname: cellToString(row[mCols.lname]),
            dob,
            email: cellToString(row[mCols.email]),
            course: cellToString(row[mCols.course]),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      const lCols = buildColIndex(logSheet.headers, [
        'log_id',
        'st_id',
        'date_time',
        'q1',
        'q2',
        'q3',
        'q4',
        'q5',
        'total_score',
        'result_text',
      ]);

      const assessmentLogs = logSheet.rows
        .map((row, idx) => {
          const stId = cellToString(row[lCols.st_id]);
          if (!stId) return null;
          const logId = cellToString(row[lCols.log_id]) || `ROW-${idx + 1}`;
          const q1 = cellToNumber(row[lCols.q1]);
          const q2 = cellToNumber(row[lCols.q2]);
          const q3 = cellToNumber(row[lCols.q3]);
          const q4 = cellToNumber(row[lCols.q4]);
          const q5 = cellToNumber(row[lCols.q5]);
          const rawTotal = cellToString(row[lCols.total_score]);
          const totalScore = rawTotal !== '' ? Number(rawTotal) : q1 + q2 + q3 + q4 + q5;
          const resultText = normalizeStressText(
            cellToString(row[lCols.result_text]),
            totalScore
          );
          return {
            log_id: logId,
            st_id: stId,
            date_time: cellToString(row[lCols.date_time]),
            q1,
            q2,
            q3,
            q4,
            q5,
            total_score: totalScore,
            result_text: resultText,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        members,
        assessmentLogs,
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้';
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

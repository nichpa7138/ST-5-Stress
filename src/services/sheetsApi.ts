import {
  AssessmentLog,
  Member,
  SPREADSHEET_ID,
  normalizeStressLabel,
} from '../types/st5';

const SHEETS_BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;

export interface RealtimeSheetsPayload {
  members: Member[];
  assessmentLogs: AssessmentLog[];
  syncedAt: string;
}

export async function fetchPublicRealtimeData(): Promise<RealtimeSheetsPayload> {
  const res = await fetch('/api/sheets/data', { cache: 'no-store' });
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.error || 'ไม่สามารถเชื่อมต่อข้อมูล Google Sheets แบบเรียลไทม์ได้');
  }
  return payload as RealtimeSheetsPayload;
}

export interface SpreadsheetMetadata {
  title: string;
  sheetTitles: string[];
  memberSheetName: string | null;
  assessmentSheetName: string | null;
}

export class SheetsApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'SheetsApiError';
    this.status = status;
  }
}

async function sheetsFetch<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let detail = '';
    try {
      const json = await res.json();
      detail = json?.error?.message || '';
    } catch {
      detail = res.statusText;
    }

    if (res.status === 401) {
      throw new SheetsApiError('สิทธิ์การเชื่อมต่อ Google หมดอายุ กรุณาเข้าสู่ระบบด้วย Google ใหม่อีกครั้ง', 401);
    }
    if (res.status === 403) {
      throw new SheetsApiError(
        'บัญชี Google นี้ไม่มีสิทธิ์เข้าถึงสเปรดชีตดังกล่าว (403) กรุณาตรวจสอบสิทธิ์การแชร์ Google Sheet',
        403
      );
    }
    throw new SheetsApiError(detail || `เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets (${res.status})`, res.status);
  }

  return res.json() as Promise<T>;
}

interface RawSpreadsheetResponse {
  properties?: { title?: string };
  sheets?: Array<{ properties?: { title?: string; sheetId?: number } }>;
}

export async function fetchSpreadsheetMetadata(accessToken: string): Promise<SpreadsheetMetadata> {
  const data = await sheetsFetch<RawSpreadsheetResponse>(
    `${SHEETS_BASE}?fields=properties.title,sheets.properties(title,sheetId)`,
    accessToken
  );

  const sheetTitles = (data.sheets ?? [])
    .map((s) => s.properties?.title)
    .filter((t): t is string => Boolean(t));

  const findSheet = (target: string) =>
    sheetTitles.find((t) => t.trim().toUpperCase() === target.toUpperCase()) ?? null;

  return {
    title: data.properties?.title || 'ST-5 Database',
    sheetTitles,
    memberSheetName: findSheet('MEMBER'),
    assessmentSheetName: findSheet('ASSESSMENT_LOG'),
  };
}

export async function ensureSheetStructure(
  accessToken: string,
  meta: SpreadsheetMetadata
): Promise<SpreadsheetMetadata> {
  const requests: Array<Record<string, unknown>> = [];

  if (!meta.memberSheetName) {
    requests.push({ addSheet: { properties: { title: 'MEMBER' } } });
  }
  if (!meta.assessmentSheetName) {
    requests.push({ addSheet: { properties: { title: 'ASSESSMENT_LOG' } } });
  }

  if (requests.length > 0) {
    await sheetsFetch(`${SHEETS_BASE}:batchUpdate`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }

  const memberTab = meta.memberSheetName || 'MEMBER';
  const assessmentTab = meta.assessmentSheetName || 'ASSESSMENT_LOG';

  // Ensure headers exist on row 1 if empty
  const memberRow1 = await sheetsFetch<{ values?: string[][] }>(
    `${SHEETS_BASE}/values/${encodeURIComponent(`${memberTab}!A1:G1`)}`,
    accessToken
  );
  if (!memberRow1.values || memberRow1.values.length === 0 || memberRow1.values[0].length === 0) {
    await sheetsFetch(
      `${SHEETS_BASE}/values/${encodeURIComponent(`${memberTab}!A1:G1`)}?valueInputOption=RAW`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({
          values: [['st_id', 'prefix', 'name', 'lname', 'dob', 'email', 'course']],
        }),
      }
    );
  }

  const logRow1 = await sheetsFetch<{ values?: string[][] }>(
    `${SHEETS_BASE}/values/${encodeURIComponent(`${assessmentTab}!A1:J1`)}`,
    accessToken
  );
  if (!logRow1.values || logRow1.values.length === 0 || logRow1.values[0].length === 0) {
    await sheetsFetch(
      `${SHEETS_BASE}/values/${encodeURIComponent(`${assessmentTab}!A1:J1`)}?valueInputOption=RAW`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({
          values: [
            [
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
            ],
          ],
        }),
      }
    );
  }

  return fetchSpreadsheetMetadata(accessToken);
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_');
}

function buildColumnMap(headerRow: string[] | undefined, defaults: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  defaults.forEach((key, idx) => {
    map[key] = idx;
  });

  if (!headerRow || headerRow.length === 0) return map;

  const normalized = headerRow.map(normalizeHeader);
  const hasKnownHeader = defaults.some((d) => normalized.includes(d));
  if (!hasKnownHeader) return map;

  defaults.forEach((key) => {
    const foundIdx = normalized.indexOf(key);
    if (foundIdx !== -1) {
      map[key] = foundIdx;
    }
  });
  return map;
}

function isHeaderRow(row: string[], firstKey: string): boolean {
  const firstCell = (row[0] || '').trim().toLowerCase();
  return firstCell === firstKey || firstCell === 'รหัสนักศึกษา' || firstCell === 'รหัสประวัติการประเมิน';
}

export async function fetchMembers(
  accessToken: string,
  sheetName: string = 'MEMBER'
): Promise<Member[]> {
  const res = await sheetsFetch<{ values?: string[][] }>(
    `${SHEETS_BASE}/values/${encodeURIComponent(`${sheetName}!A:G`)}`,
    accessToken
  );

  const rows = res.values ?? [];
  if (rows.length === 0) return [];

  const firstRowIsHeader = isHeaderRow(rows[0], 'st_id');
  const colMap = buildColumnMap(firstRowIsHeader ? rows[0] : undefined, [
    'st_id',
    'prefix',
    'name',
    'lname',
    'dob',
    'email',
    'course',
  ]);
  const dataRows = firstRowIsHeader ? rows.slice(1) : rows;

  return dataRows
    .map((row): Member | null => {
      const stId = String(row[colMap.st_id] ?? '').trim();
      if (!stId) return null;
      const rawDob = String(row[colMap.dob] ?? '').trim();
      const dob = /^\d{7}$/.test(rawDob) ? rawDob.padStart(8, '0') : rawDob;
      return {
        st_id: stId,
        prefix: String(row[colMap.prefix] ?? '').trim(),
        name: String(row[colMap.name] ?? '').trim(),
        lname: String(row[colMap.lname] ?? '').trim(),
        dob,
        email: String(row[colMap.email] ?? '').trim(),
        course: String(row[colMap.course] ?? '').trim(),
      };
    })
    .filter((m): m is Member => m !== null);
}

export async function fetchAssessmentLogs(
  accessToken: string,
  sheetName: string = 'ASSESSMENT_LOG'
): Promise<AssessmentLog[]> {
  const res = await sheetsFetch<{ values?: string[][] }>(
    `${SHEETS_BASE}/values/${encodeURIComponent(`${sheetName}!A:J`)}`,
    accessToken
  );

  const rows = res.values ?? [];
  if (rows.length === 0) return [];

  const firstRowIsHeader = isHeaderRow(rows[0], 'log_id');
  const colMap = buildColumnMap(firstRowIsHeader ? rows[0] : undefined, [
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
  const dataRows = firstRowIsHeader ? rows.slice(1) : rows;

  return dataRows
    .map((row, idx): AssessmentLog | null => {
      const stId = String(row[colMap.st_id] ?? '').trim();
      const logId = String(row[colMap.log_id] ?? '').trim() || `ROW-${idx + 1}`;
      if (!stId) return null;

      const q1 = Number(row[colMap.q1] ?? 0) || 0;
      const q2 = Number(row[colMap.q2] ?? 0) || 0;
      const q3 = Number(row[colMap.q3] ?? 0) || 0;
      const q4 = Number(row[colMap.q4] ?? 0) || 0;
      const q5 = Number(row[colMap.q5] ?? 0) || 0;
      const parsedTotal = Number(row[colMap.total_score]);
      const totalScore = Number.isFinite(parsedTotal) ? parsedTotal : q1 + q2 + q3 + q4 + q5;
      const rawResult = String(row[colMap.result_text] ?? '').trim();

      return {
        log_id: logId,
        st_id: stId,
        date_time: String(row[colMap.date_time] ?? '').trim(),
        q1,
        q2,
        q3,
        q4,
        q5,
        total_score: totalScore,
        result_text: normalizeStressLabel(rawResult, totalScore),
      };
    })
    .filter((l): l is AssessmentLog => l !== null);
}

export async function appendMember(
  accessToken: string,
  member: Member,
  sheetName: string = 'MEMBER'
): Promise<void> {
  await sheetsFetch(
    `${SHEETS_BASE}/values/${encodeURIComponent(`${sheetName}!A:G`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        values: [
          [
            member.st_id,
            member.prefix,
            member.name,
            member.lname,
            member.dob,
            member.email,
            member.course,
          ],
        ],
      }),
    }
  );
}

export async function appendAssessmentLog(
  accessToken: string,
  log: AssessmentLog,
  sheetName: string = 'ASSESSMENT_LOG'
): Promise<void> {
  await sheetsFetch(
    `${SHEETS_BASE}/values/${encodeURIComponent(`${sheetName}!A:J`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        values: [
          [
            log.log_id,
            log.st_id,
            log.date_time,
            log.q1,
            log.q2,
            log.q3,
            log.q4,
            log.q5,
            log.total_score,
            log.result_text,
          ],
        ],
      }),
    }
  );
}

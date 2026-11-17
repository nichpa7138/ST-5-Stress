export const SPREADSHEET_ID = '18sqvajQhwu2UuF0HZewAdsveTLzJ280yDryJ9bKUsOM';

export const COURSES = ['ปวส.เวชระเบียน', 'วทบ.เวชระเบียน'] as const;
export type CourseType = (typeof COURSES)[number];

export const PREFIX_OPTIONS = ['นาย', 'นางสาว', 'นาง'] as const;

export type StressLevelKey = 'low' | 'moderate' | 'high' | 'severe';

export interface Member {
  st_id: string;
  prefix: string;
  name: string;
  lname: string;
  dob: string; // 8-digit DDMMYYYY (พ.ศ.) e.g. 29102534
  email: string;
  course: string;
}

export interface AssessmentLog {
  log_id: string;
  st_id: string;
  date_time: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  total_score: number;
  result_text: string;
}

export interface ST5Question {
  id: 'q1' | 'q2' | 'q3' | 'q4' | 'q5';
  number: number;
  title: string;
  subtitle: string;
}

export const ST5_QUESTIONS: ST5Question[] = [
  {
    id: 'q1',
    number: 1,
    title: 'มีปัญหาการนอน นอนไม่หลับ หรือนอนมาก',
    subtitle: 'ปัญหานอนไม่หลับ พักผ่อนไม่เพียงพอ หรือหลับไม่สนิทในระยะ 2–4 สัปดาห์ที่ผ่านมา',
  },
  {
    id: 'q2',
    number: 2,
    title: 'มีสมาธิน้อยลง',
    subtitle: 'รู้สึกใจลอย จดจ่อกับการเรียนหรือการทำงานได้ยากกว่าปกติ',
  },
  {
    id: 'q3',
    number: 3,
    title: 'หงุดหงิด / กระวนกระวาย / ว้าวุ่นใจ',
    subtitle: 'อารมณ์เสียง่าย รู้สึกกระสับกระส่าย ไม่สบายใจหรือกังวลใจ',
  },
  {
    id: 'q4',
    number: 4,
    title: 'รู้สึกเบื่อ เซ็ง',
    subtitle: 'หมดความกระตือรือร้น เบื่อหน่ายกิจกรรมที่เคยชอบทำ',
  },
  {
    id: 'q5',
    number: 5,
    title: 'ไม่อยากพบปะผู้คน',
    subtitle: 'อยากแยกตัวอยู่คนเดียว หลีกเลี่ยงการพูดคุยหรือเข้าสังคม',
  },
];

export interface RatingChoice {
  value: 0 | 1 | 2 | 3;
  label: string;
  description: string;
}

export const ST5_RATING_CHOICES: RatingChoice[] = [
  { value: 0, label: 'แทบไม่มี', description: '0 คะแนน · แทบไม่เกิดขึ้นเลย' },
  { value: 1, label: 'เป็นบางครั้ง', description: '1 คะแนน · เกิดขึ้นเป็นครั้งคราว' },
  { value: 2, label: 'เป็นบ่อยครั้ง', description: '2 คะแนน · เกิดขึ้นค่อนข้างบ่อย' },
  { value: 3, label: 'เป็นประจำ', description: '3 คะแนน · เกิดขึ้นเกือบทุกวัน' },
];

export interface StressInterpretation {
  key: StressLevelKey;
  resultText: string;
  happinessText: string;
  emoji: string;
  emojiCaption: string;
  badgeColorClass: string;
  accentBarClass: string;
  surfaceTintClass: string;
  adviceTitle: string;
  adviceList: string[];
}

export function interpretStressScore(totalScore: number): StressInterpretation {
  if (totalScore <= 4) {
    return {
      key: 'low',
      resultText: 'ความเครียดน้อย',
      happinessText: 'ระดับความสุขสูง · สุขภาพใจสดใสสมดุล',
      emoji: '😄',
      emojiCaption: 'อารมณ์แจ่มใส ผ่อนคลายได้ดี',
      badgeColorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      accentBarClass: 'bg-emerald-500',
      surfaceTintClass: 'bg-emerald-50/70 border-emerald-200',
      adviceTitle: 'คำแนะนำในการดูแลสุขภาพใจ',
      adviceList: [
        'คุณสามารถจัดการกับความเครียดในชีวิตประจำวันได้ดีมาก รักษาสมดุลการเรียนและการพักผ่อนนี้ไว้อย่างต่อเนื่อง',
        'หมั่นทำกิจกรรมที่สร้างความสุข เช่น ออกกำลังกาย ฟังเพลง หรืองานอดิเรกที่ชื่นชอบสัปดาห์ละ 2–3 ครั้ง',
        'แบ่งปันพลังบวกและคอยรับฟังเพื่อนรอบข้างเพื่อสร้างสภาพแวดล้อมที่อบอุ่นในชั้นเรียน',
      ],
    };
  }

  if (totalScore <= 7) {
    return {
      key: 'moderate',
      resultText: 'ความเครียดปานกลาง',
      happinessText: 'ระดับความสุขปานกลาง · เริ่มมีความตึงเครียดสะสม',
      emoji: '🙂',
      emojiCaption: 'ยังรับมือได้ แต่ควรจัดเวลาพักผ่อนเพิ่ม',
      badgeColorClass: 'text-pink-700 bg-pink-50 border-pink-200',
      accentBarClass: 'bg-pink-500',
      surfaceTintClass: 'bg-pink-50/70 border-pink-200',
      adviceTitle: 'คำแนะนำในการดูแลสุขภาพใจ',
      adviceList: [
        'ความเครียดอยู่ในระดับปกติที่เกิดขึ้นได้จากการเรียนหรือภาระงาน ควรจัดลำดับความสำคัญและแบ่งเวลาพักสายตาเป็นระยะ',
        'ฝึกหายใจลึกๆ ช้าๆ (Deep Breathing) วันละ 5–10 นาที และเข้านอนให้เป็นเวลาเพื่อลดความล้าทางความคิด',
        'พูดคุยแลกเปลี่ยนความรู้สึกกับเพื่อนสนิทหรือครอบครัวเมื่อรู้สึกตึงเครียด',
      ],
    };
  }

  if (totalScore <= 9) {
    return {
      key: 'high',
      resultText: 'ความเครียดมาก',
      happinessText: 'ระดับความสุขลดลง · ควรได้รับการผ่อนคลายอย่างจริงจัง',
      emoji: '😟',
      emojiCaption: 'มีความกังวลและความล้าทางอารมณ์ชัดเจน',
      badgeColorClass: 'text-amber-800 bg-amber-50 border-amber-200',
      accentBarClass: 'bg-amber-500',
      surfaceTintClass: 'bg-amber-50/70 border-amber-200',
      adviceTitle: 'คำแนะนำในการดูแลสุขภาพใจ',
      adviceList: [
        'คุณกำลังเผชิญกับความเครียดในระดับสูง ควรหยุดพักจากงานหรือหน้าจอและให้เวลากับการดูแลตัวเองทันที',
        'หลีกเลี่ยงเครื่องดื่มที่มีคาเฟอีนสูงในช่วงเย็น ปรับพฤติกรรมการนอน และลองออกกำลังกายเบาๆ เพื่อช่วยคลายความตึงเครียด',
        'แนะนำให้พูดคุยปรึกษากับอาจารย์ที่ปรึกษา หรือผู้เชี่ยวชาญด้านสุขภาพจิตของสถานศึกษาเพื่อร่วมหาทางออก',
      ],
    };
  }

  return {
    key: 'severe',
    resultText: 'ความเครียดมากที่สุด',
    happinessText: 'ระดับความสุขต่ำ · ต้องการการดูแลและช่วยเหลือเร่งด่วน',
    emoji: '😰',
    emojiCaption: 'ความเครียดสะสมสูง ควรรับคำปรึกษาจากผู้เชี่ยวชาญ',
    badgeColorClass: 'text-rose-800 bg-rose-50 border-rose-200',
    accentBarClass: 'bg-rose-600',
    surfaceTintClass: 'bg-rose-50/80 border-rose-200',
    adviceTitle: 'คำแนะนำเร่งด่วนในการดูแลสุขภาพใจ',
    adviceList: [
      'ความเครียดอยู่ในระดับสูงมาก อาจส่งผลต่อการนอนหลับ สมาธิ และการดำเนินชีวิตประจำวัน อย่าเก็บความรู้สึกไว้คนเดียว',
      'โปรดติดต่ออาจารย์ที่ปรึกษา ฝ่ายแนะแนว/สุขภาพจิตของวิทยาลัย หรือสายด่วนสุขภาพจิต กรมสุขภาพจิต โทร. 1323 (ตลอด 24 ชั่วโมง)',
      'ลดภาระงานที่ไม่จำเป็นลงชั่วคราว และอยู่ใกล้ชิดกับบุคคลที่ไว้ใจได้เพื่อให้คุณรู้สึกปลอดภัยและได้รับการสนับสนุน',
    ],
  };
}

export function normalizeStressLabel(resultText: string, totalScore: number): string {
  const trimmed = (resultText || '').trim();
  if (
    trimmed === 'ความเครียดน้อย' ||
    trimmed === 'ความเครียดปานกลาง' ||
    trimmed === 'ความเครียดมาก' ||
    trimmed === 'ความเครียดมากที่สุด'
  ) {
    return trimmed;
  }
  return interpretStressScore(totalScore).resultText;
}

export function inferGenderFromPrefix(prefix: string): 'ชาย' | 'หญิง' | 'ไม่ระบุ' {
  const p = (prefix || '').trim().toLowerCase();
  if (!p) return 'ไม่ระบุ';
  if (
    p.includes('นางสาว') ||
    p.includes('น.ส.') ||
    p.includes('นาง') ||
    p.includes('ด.ญ.') ||
    p.includes('เด็กหญิง') ||
    p.startsWith('ms') ||
    p.startsWith('mrs') ||
    p.startsWith('miss')
  ) {
    return 'หญิง';
  }
  if (
    p.includes('นาย') ||
    p.includes('ด.ช.') ||
    p.includes('เด็กชาย') ||
    p.startsWith('mr')
  ) {
    return 'ชาย';
  }
  return 'ไม่ระบุ';
}

export function formatCurrentDateTime(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function parseDateTimeSafe(raw: string): Date | null {
  const s = (raw || '').trim();
  if (!s) return null;

  // ISO or YYYY-MM-DD HH:mm:ss
  const isoMatch = s.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
  );
  if (isoMatch) {
    let year = Number(isoMatch[1]);
    if (year > 2400) year -= 543; // Buddhist Era -> Gregorian
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const hour = Number(isoMatch[4] ?? 0);
    const min = Number(isoMatch[5] ?? 0);
    const sec = Number(isoMatch[6] ?? 0);
    const d = new Date(year, month, day, hour, min, sec);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY [HH:mm:ss]
  const dmyMatch = s.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
  );
  if (dmyMatch) {
    let year = Number(dmyMatch[3]);
    if (year > 2400) year -= 543;
    const month = Number(dmyMatch[2]) - 1;
    const day = Number(dmyMatch[1]);
    const hour = Number(dmyMatch[4] ?? 0);
    const min = Number(dmyMatch[5] ?? 0);
    const sec = Number(dmyMatch[6] ?? 0);
    const d = new Date(year, month, day, hour, min, sec);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatThaiDateTime(raw: string): string {
  const d = parseDateTimeSafe(raw);
  if (!d) return raw || '-';
  const thaiMonths = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ];
  const pad = (n: number) => String(n).padStart(2, '0');
  const buddhistYear = d.getFullYear() + 543;
  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${buddhistYear} · ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())} น.`;
}

export function getWeekStartInfo(date: Date): { key: string; label: string; sortKey: number } {
  // Week starting Monday
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay();
  const diffToMonday = (day + 6) % 7;
  copy.setDate(copy.getDate() - diffToMonday);

  const thaiMonths = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ];

  const pad = (n: number) => String(n).padStart(2, '0');
  const key = `${copy.getFullYear()}-${pad(copy.getMonth() + 1)}-${pad(copy.getDate())}`;
  const shortYear = String((copy.getFullYear() + 543) % 100);
  const label = `${copy.getDate()} ${thaiMonths[copy.getMonth()]} ${shortYear}`;
  return { key, label, sortKey: copy.getTime() };
}

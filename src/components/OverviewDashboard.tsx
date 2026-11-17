import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  GraduationCap,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  AssessmentLog,
  COURSES,
  Member,
  getWeekStartInfo,
  inferGenderFromPrefix,
  normalizeStressLabel,
  parseDateTimeSafe,
} from '../types/st5';

interface OverviewDashboardProps {
  members: Member[];
  assessmentLogs: AssessmentLog[];
  isLoading: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
}

type CourseFilter = 'ทั้งหมด' | (typeof COURSES)[number];
type ChartMetricMode = 'both' | 'avgScore' | 'count';

interface StatBucket {
  label: string;
  count: number;
  percentage: number;
  barClass: string;
  dotColor: string;
}

interface WeeklyPoint {
  weekKey: string;
  weekLabel: string;
  sortKey: number;
  avgScore: number;
  count: number;
}

function toPercent(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  members,
  assessmentLogs,
  isLoading,
  errorMessage,
  onRefresh,
}) => {
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('ทั้งหมด');
  const [chartMode, setChartMode] = useState<ChartMetricMode>('both');
  const [hoveredWeekIdx, setHoveredWeekIdx] = useState<number | null>(null);

  const memberById = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach((m) => map.set(m.st_id.trim(), m));
    return map;
  }, [members]);

  // Filtered members & logs based on course filter
  const filteredMembers = useMemo(() => {
    if (courseFilter === 'ทั้งหมด') return members;
    return members.filter((m) => m.course.trim() === courseFilter);
  }, [members, courseFilter]);

  const filteredLogs = useMemo(() => {
    if (courseFilter === 'ทั้งหมด') return assessmentLogs;
    return assessmentLogs.filter((log) => {
      const m = memberById.get(log.st_id.trim());
      return m?.course.trim() === courseFilter;
    });
  }, [assessmentLogs, courseFilter, memberById]);

  // 1. Course stats (always computed from full members so comparison stays visible)
  const courseStats: StatBucket[] = useMemo(() => {
    const pvsCount = members.filter((m) => m.course.trim() === COURSES[0]).length;
    const wtbCount = members.filter((m) => m.course.trim() === COURSES[1]).length;
    const otherCount = members.length - pvsCount - wtbCount;
    const total = members.length;

    const list: StatBucket[] = [
      {
        label: COURSES[0],
        count: pvsCount,
        percentage: toPercent(pvsCount, total),
        barClass: 'bg-pink-600',
        dotColor: '#DB2777',
      },
      {
        label: COURSES[1],
        count: wtbCount,
        percentage: toPercent(wtbCount, total),
        barClass: 'bg-rose-400',
        dotColor: '#FB7185',
      },
    ];

    if (otherCount > 0) {
      list.push({
        label: 'หลักสูตรอื่นๆ',
        count: otherCount,
        percentage: toPercent(otherCount, total),
        barClass: 'bg-pink-200',
        dotColor: '#FBCFE8',
      });
    }
    return list;
  }, [members]);

  // 2. Gender stats analyzed from prefix
  const genderStats: StatBucket[] = useMemo(() => {
    let male = 0;
    let female = 0;
    let unknown = 0;

    filteredMembers.forEach((m) => {
      const g = inferGenderFromPrefix(m.prefix);
      if (g === 'ชาย') male += 1;
      else if (g === 'หญิง') female += 1;
      else unknown += 1;
    });

    const total = filteredMembers.length;
    const list: StatBucket[] = [
      {
        label: 'เพศหญิง (นางสาว / นาง)',
        count: female,
        percentage: toPercent(female, total),
        barClass: 'bg-pink-500',
        dotColor: '#EC4899',
      },
      {
        label: 'เพศชาย (นาย)',
        count: male,
        percentage: toPercent(male, total),
        barClass: 'bg-indigo-500',
        dotColor: '#6366F1',
      },
    ];
    if (unknown > 0) {
      list.push({
        label: 'ไม่ระบุคำนำหน้า',
        count: unknown,
        percentage: toPercent(unknown, total),
        barClass: 'bg-slate-300',
        dotColor: '#CBD5E1',
      });
    }
    return list;
  }, [filteredMembers]);

  // 3. Stress level stats
  const stressLevelStats: StatBucket[] = useMemo(() => {
    const counts = {
      'ความเครียดน้อย': 0,
      'ความเครียดปานกลาง': 0,
      'ความเครียดมาก': 0,
      'ความเครียดมากที่สุด': 0,
    };

    filteredLogs.forEach((log) => {
      const key = normalizeStressLabel(log.result_text, log.total_score) as keyof typeof counts;
      if (counts[key] !== undefined) {
        counts[key] += 1;
      }
    });

    const total = filteredLogs.length;
    return [
      {
        label: 'ความเครียดน้อย (0–4 คะแนน)',
        count: counts['ความเครียดน้อย'],
        percentage: toPercent(counts['ความเครียดน้อย'], total),
        barClass: 'bg-emerald-500',
        dotColor: '#10B981',
      },
      {
        label: 'ความเครียดปานกลาง (5–7 คะแนน)',
        count: counts['ความเครียดปานกลาง'],
        percentage: toPercent(counts['ความเครียดปานกลาง'], total),
        barClass: 'bg-pink-500',
        dotColor: '#EC4899',
      },
      {
        label: 'ความเครียดมาก (8–9 คะแนน)',
        count: counts['ความเครียดมาก'],
        percentage: toPercent(counts['ความเครียดมาก'], total),
        barClass: 'bg-amber-500',
        dotColor: '#F59E0B',
      },
      {
        label: 'ความเครียดมากที่สุด (10–15 คะแนน)',
        count: counts['ความเครียดมากที่สุด'],
        percentage: toPercent(counts['ความเครียดมากที่สุด'], total),
        barClass: 'bg-rose-600',
        dotColor: '#E11D48',
      },
    ];
  }, [filteredLogs]);

  // 4. Weekly Stress Trend Data
  const weeklyTrend: WeeklyPoint[] = useMemo(() => {
    const groups = new Map<
      string,
      { label: string; sortKey: number; totalScore: number; count: number }
    >();

    filteredLogs.forEach((log) => {
      const parsed = parseDateTimeSafe(log.date_time);
      if (!parsed) return;
      const week = getWeekStartInfo(parsed);
      const existing = groups.get(week.key);
      if (existing) {
        existing.totalScore += log.total_score;
        existing.count += 1;
      } else {
        groups.set(week.key, {
          label: week.label,
          sortKey: week.sortKey,
          totalScore: log.total_score,
          count: 1,
        });
      }
    });

    return Array.from(groups.entries())
      .map(([weekKey, val]) => ({
        weekKey,
        weekLabel: val.label,
        sortKey: val.sortKey,
        avgScore: val.totalScore / val.count,
        count: val.count,
      }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-10);
  }, [filteredLogs]);

  const averageOverallScore = useMemo(() => {
    if (filteredLogs.length === 0) return 0;
    const sum = filteredLogs.reduce((acc, l) => acc + l.total_score, 0);
    return sum / filteredLogs.length;
  }, [filteredLogs]);

  const maxWeeklyCount = useMemo(() => {
    return Math.max(1, ...weeklyTrend.map((w) => w.count));
  }, [weeklyTrend]);

  // SVG chart geometry
  const svgWidth = 760;
  const svgHeight = 260;
  const padLeft = 46;
  const padRight = 46;
  const padTop = 24;
  const padBottom = 42;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const getPointX = (idx: number, total: number) => {
    if (total <= 1) return padLeft + plotWidth / 2;
    const step = plotWidth / total;
    return padLeft + step * idx + step / 2;
  };

  const getScoreY = (score: number) => {
    const ratio = Math.min(1, Math.max(0, score / 15));
    return padTop + plotHeight * (1 - ratio);
  };

  const getCountBarHeight = (count: number) => {
    return (count / maxWeeklyCount) * (plotHeight * 0.85);
  };

  const linePath = useMemo(() => {
    if (weeklyTrend.length === 0) return '';
    return weeklyTrend
      .map((w, idx) => {
        const x = getPointX(idx, weeklyTrend.length);
        const y = getScoreY(w.avgScore);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [weeklyTrend]);

  const activeWeek = hoveredWeekIdx !== null ? weeklyTrend[hoveredWeekIdx] ?? null : null;
  const isInitialLoading = isLoading && members.length === 0 && assessmentLogs.length === 0;

  return (
    <section
      id="overview-dashboard"
      className="mx-auto w-full max-w-[1200px] px-4 pt-4 pb-14 sm:px-6 lg:px-8"
    >
      {/* Dashboard Section Header */}
      <div className="flex flex-col gap-4 border-t border-pink-200/70 pt-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold text-pink-700">
            สถิติภาพรวมสำหรับอาจารย์และผู้เข้าชม
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#2A1526] sm:text-3xl">
            Dashboard สรุปสถิติความสุขและความเครียดภาพรวม
          </h2>
          <p className="mt-1 text-sm text-[#6E4A6F]">
            ประมวลผลข้อมูลจริงจากชีท MEMBER และ ASSESSMENT_LOG แบบเรียลไทม์
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Course Filter Segmented Buttons */}
          <div className="flex items-center gap-1 rounded-xl border border-pink-100 bg-white p-1">
            {(['ทั้งหมด', ...COURSES] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCourseFilter(option)}
                className={`h-9 rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  courseFilter === option
                    ? 'bg-pink-600 text-white'
                    : 'text-[#6E4A6F] hover:text-pink-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 text-xs font-semibold text-[#4A2B4B] transition-colors hover:bg-pink-50 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-pink-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>อัปเดตข้อมูล</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800"
        >
          {errorMessage}
        </div>
      )}

      {/* Top 4-Column KPI Strip */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-pink-200/80 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#6E4A6F]">
            <span>นักศึกษาในระบบ</span>
            <Users className="h-4 w-4 text-pink-500" />
          </div>
          <div className="font-mono-tabular mt-2 text-3xl font-bold text-[#2A1526]">
            {isInitialLoading ? '—' : filteredMembers.length}
            <span className="ml-1.5 text-sm font-medium text-[#6E4A6F]">คน</span>
          </div>
          <p className="mt-1 text-xs text-[#6E4A6F]">
            {courseFilter === 'ทั้งหมด' ? 'รวมทุกหลักสูตร' : courseFilter}
          </p>
        </div>

        <div className="rounded-2xl border border-pink-200/80 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#6E4A6F]">
            <span>จำนวนการประเมินทั้งหมด</span>
            <BarChart3 className="h-4 w-4 text-pink-500" />
          </div>
          <div className="font-mono-tabular mt-2 text-3xl font-bold text-[#2A1526]">
            {isInitialLoading ? '—' : filteredLogs.length}
            <span className="ml-1.5 text-sm font-medium text-[#6E4A6F]">ครั้ง</span>
          </div>
          <p className="mt-1 text-xs text-[#6E4A6F]">บันทึกในชีท ASSESSMENT_LOG</p>
        </div>

        <div className="rounded-2xl border border-pink-200/80 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#6E4A6F]">
            <span>คะแนนความเครียดเฉลี่ย</span>
            <TrendingUp className="h-4 w-4 text-pink-500" />
          </div>
          <div className="font-mono-tabular mt-2 text-3xl font-bold text-pink-600">
            {isInitialLoading ? '—' : averageOverallScore.toFixed(2)}
            <span className="ml-1.5 text-sm font-medium text-[#6E4A6F]">/ 15</span>
          </div>
          <p className="mt-1 text-xs text-[#6E4A6F]">คะแนนเฉลี่ยรวมทุกครั้ง</p>
        </div>

        <div className="rounded-2xl border border-pink-200/80 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#6E4A6F]">
            <span>สัดส่วน ปวส. / วทบ.</span>
            <GraduationCap className="h-4 w-4 text-pink-500" />
          </div>
          <div className="font-mono-tabular mt-2 text-2xl font-bold text-[#2A1526]">
            {isInitialLoading
              ? '—'
              : `${courseStats[0]?.percentage.toFixed(0) ?? 0}% / ${
                  courseStats[1]?.percentage.toFixed(0) ?? 0
                }%`}
          </div>
          <p className="mt-1 text-xs text-[#6E4A6F]">เทียบจำนวนนักศึกษาทั้งหมด</p>
        </div>
      </div>

      {/* 3 Breakdown Panels: Course, Gender, Stress Level */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Panel 1: Course Breakdown */}
        <div className="rounded-2xl border border-pink-200/80 bg-white p-6">
          <h3 className="text-base font-bold text-[#2A1526]">
            1. สถิติแยกตามหลักสูตร
          </h3>
          <p className="mt-0.5 text-xs text-[#6E4A6F]">
            เปรียบเทียบ ปวส.เวชระเบียน และ วทบ.เวชระเบียน
          </p>

          <div className="mt-5 space-y-4">
            {courseStats.map((item) => (
              <div key={item.label}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold text-[#2A1526]">{item.label}</span>
                  <span className="font-mono-tabular text-xs font-semibold text-[#4A2B4B]">
                    {item.count} คน ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-pink-50">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${item.barClass}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Gender Breakdown */}
        <div className="rounded-2xl border border-pink-200/80 bg-white p-6">
          <h3 className="text-base font-bold text-[#2A1526]">
            2. สถิติแยกตามเพศ (ชาย / หญิง)
          </h3>
          <p className="mt-0.5 text-xs text-[#6E4A6F]">
            วิเคราะห์จากคำนำหน้าชื่อ (prefix) ของสมาชิก
          </p>

          <div className="mt-5 space-y-4">
            {genderStats.map((item) => (
              <div key={item.label}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold text-[#2A1526]">{item.label}</span>
                  <span className="font-mono-tabular text-xs font-semibold text-[#4A2B4B]">
                    {item.count} คน ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-pink-50">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${item.barClass}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3: Stress Level Breakdown */}
        <div className="rounded-2xl border border-pink-200/80 bg-white p-6">
          <h3 className="text-base font-bold text-[#2A1526]">
            3. สถิติแยกตามระดับความเครียด
          </h3>
          <p className="mt-0.5 text-xs text-[#6E4A6F]">
            จำแนกตามเกณฑ์คะแนนรวม ST-5 (0–15 คะแนน)
          </p>

          <div className="mt-5 space-y-3.5">
            {stressLevelStats.map((item) => (
              <div key={item.label}>
                <div className="flex items-baseline justify-between gap-2 text-xs sm:text-sm">
                  <span className="font-semibold text-[#2A1526]">{item.label}</span>
                  <span className="font-mono-tabular shrink-0 text-xs font-semibold text-[#4A2B4B]">
                    {item.count} ครั้ง ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-pink-50">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${item.barClass}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel 4: Weekly Stress Trend Chart */}
      <div className="mt-6 rounded-2xl border border-pink-200/80 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-[#2A1526]">
              4. กราฟสรุปผลแนวโน้มความเครียดในแต่ละสัปดาห์ (Weekly Stress Trend Chart)
            </h3>
            <p className="mt-0.5 text-xs text-[#6E4A6F]">
              แสดงคะแนนความเครียดเฉลี่ย (เส้นสีชมพูเข้ม) และจำนวนผู้ประเมินรายสัปดาห์ (แท่งสีชมพูอ่อน)
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-pink-100 bg-[#FFF9FB] p-1 self-start sm:self-auto">
            {(
              [
                { key: 'both', label: 'แสดงทั้งคู่' },
                { key: 'avgScore', label: 'คะแนนเฉลี่ย' },
                { key: 'count', label: 'จำนวนผู้ประเมิน' },
              ] as const
            ).map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setChartMode(mode.key)}
                className={`h-8 rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  chartMode === mode.key
                    ? 'bg-pink-600 text-white'
                    : 'text-[#6E4A6F] hover:text-pink-700'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {isInitialLoading ? (
          <div className="mt-6 h-64 animate-pulse rounded-xl bg-pink-50" />
        ) : weeklyTrend.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-pink-200 bg-[#FFF9FB] px-6 py-12 text-center">
            <p className="text-sm font-semibold text-[#2A1526]">
              ยังไม่มีข้อมูลการประเมินรายสัปดาห์สำหรับเงื่อนไขนี้
            </p>
            <p className="mt-1 text-xs text-[#6E4A6F]">
              เมื่อนักศึกษาทำแบบประเมิน ST-5 และบันทึกลงชีท ASSESSMENT_LOG กราฟแนวโน้มรายสัปดาห์จะแสดงที่นี่โดยอัตโนมัติ
            </p>
          </div>
        ) : (
          <div className="mt-5">
            {/* Interactive Hover Summary Bar */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FFF5F9] px-4 py-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2 font-medium text-[#2A1526]">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-pink-600" />
                  คะแนนเฉลี่ย ST-5 (0–15)
                </span>
                <span className="inline-flex items-center gap-2 font-medium text-[#2A1526]">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-pink-200" />
                  จำนวนผู้ประเมิน (ครั้ง)
                </span>
              </div>
              <div className="font-mono-tabular font-semibold text-pink-700">
                {activeWeek
                  ? `สัปดาห์ ${activeWeek.weekLabel} · เฉลี่ย ${activeWeek.avgScore.toFixed(
                      2
                    )} คะแนน · ${activeWeek.count} ครั้ง`
                  : `แสดง ${weeklyTrend.length} สัปดาห์ล่าสุด (วางเมาส์บนกราฟเพื่อดูค่าละเอียด)`}
              </div>
            </div>

            {/* Responsive SVG Chart */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="h-64 w-full min-w-[540px]"
                role="img"
                aria-label="กราฟสรุปผลแนวโน้มความเครียดในแต่ละสัปดาห์"
              >
                {/* Horizontal grid lines for 0, 5, 10, 15 score */}
                {[0, 5, 10, 15].map((tick) => {
                  const y = getScoreY(tick);
                  return (
                    <g key={tick}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={svgWidth - padRight}
                        y2={y}
                        stroke="#FDE2EE"
                        strokeWidth="1"
                      />
                      <text
                        x={padLeft - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-[#6E4A6F] text-[11px] font-mono"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}

                {/* Right axis max count label */}
                <text
                  x={svgWidth - padRight + 8}
                  y={padTop + 10}
                  textAnchor="start"
                  className="fill-[#9C7B9D] text-[10px] font-mono"
                >
                  {maxWeeklyCount} ครั้ง
                </text>

                {/* Bars for weekly assessment count */}
                {(chartMode === 'both' || chartMode === 'count') &&
                  weeklyTrend.map((w, idx) => {
                    const xCenter = getPointX(idx, weeklyTrend.length);
                    const barWidth = Math.min(34, plotWidth / weeklyTrend.length / 2.2);
                    const barH = getCountBarHeight(w.count);
                    const yBar = padTop + plotHeight - barH;
                    const isHovered = hoveredWeekIdx === idx;
                    return (
                      <g key={`bar-${w.weekKey}`}>
                        <rect
                          x={xCenter - barWidth / 2}
                          y={yBar}
                          width={barWidth}
                          height={barH}
                          rx={6}
                          fill={isHovered ? '#F472B6' : '#FBCFE8'}
                          className="transition-colors duration-150"
                        />
                        {chartMode === 'count' && (
                          <text
                            x={xCenter}
                            y={yBar - 6}
                            textAnchor="middle"
                            className="fill-[#9D174D] text-[11px] font-semibold font-mono"
                          >
                            {w.count}
                          </text>
                        )}
                      </g>
                    );
                  })}

                {/* Line & Data Nodes for weekly average stress score */}
                {(chartMode === 'both' || chartMode === 'avgScore') && (
                  <>
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#DB2777"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {weeklyTrend.map((w, idx) => {
                      const x = getPointX(idx, weeklyTrend.length);
                      const y = getScoreY(w.avgScore);
                      const isHovered = hoveredWeekIdx === idx;
                      return (
                        <g key={`node-${w.weekKey}`}>
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 7 : 5}
                            fill="#FFFFFF"
                            stroke="#DB2777"
                            strokeWidth="3"
                          />
                          <text
                            x={x}
                            y={y - 11}
                            textAnchor="middle"
                            className="fill-[#2A1526] text-[11px] font-bold font-mono"
                          >
                            {w.avgScore.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {/* X-Axis Labels & Invisible Hover Hit Columns */}
                {weeklyTrend.map((w, idx) => {
                  const xCenter = getPointX(idx, weeklyTrend.length);
                  const colWidth = plotWidth / weeklyTrend.length;
                  return (
                    <g key={`x-${w.weekKey}`}>
                      <text
                        x={xCenter}
                        y={svgHeight - 14}
                        textAnchor="middle"
                        className="fill-[#5C3A5D] text-[11px]"
                      >
                        {w.weekLabel}
                      </text>
                      <rect
                        x={xCenter - colWidth / 2}
                        y={padTop}
                        width={colWidth}
                        height={plotHeight + 28}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredWeekIdx(idx)}
                        onMouseLeave={() => setHoveredWeekIdx(null)}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

import React, { useMemo } from 'react';
import { ClipboardList, Mail, PlusCircle, RefreshCw, User } from 'lucide-react';
import {
  AssessmentLog,
  Member,
  formatThaiDateTime,
  interpretStressScore,
  parseDateTimeSafe,
} from '../types/st5';

interface PersonalHistoryViewProps {
  member: Member;
  allLogs: AssessmentLog[];
  isLoading: boolean;
  onRefresh: () => void;
  onStartNewAssessment: () => void;
}

export const PersonalHistoryView: React.FC<PersonalHistoryViewProps> = ({
  member,
  allLogs,
  isLoading,
  onRefresh,
  onStartNewAssessment,
}) => {
  // Strictly filter logs belonging to the logged-in student and sort latest on top
  const personalLogs = useMemo(() => {
    return allLogs
      .filter((log) => log.st_id.trim() === member.st_id.trim())
      .slice()
      .sort((a, b) => {
        const da = parseDateTimeSafe(a.date_time)?.getTime() ?? 0;
        const db = parseDateTimeSafe(b.date_time)?.getTime() ?? 0;
        if (db !== da) return db - da;
        return b.log_id.localeCompare(a.log_id);
      });
  }, [allLogs, member.st_id]);

  const latestLog = personalLogs[0] ?? null;
  const averageScore = useMemo(() => {
    if (personalLogs.length === 0) return 0;
    const sum = personalLogs.reduce((acc, item) => acc + item.total_score, 0);
    return sum / personalLogs.length;
  }, [personalLogs]);

  // Reverse chronological order for left-to-right trend chart (oldest -> newest)
  const chronologicalLogs = useMemo(() => {
    return personalLogs.slice(0, 12).reverse();
  }, [personalLogs]);

  return (
    <section className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Student Profile Header Card */}
      <div className="rounded-2xl border border-pink-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-600 text-white">
              <User className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-medium text-pink-700">
                ข้อมูลนักศึกษาและประวัติการประเมินส่วนตัว
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#2A1526]">
                {member.prefix}
                {member.name} {member.lname}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#5C3A5D]">
                <span className="font-mono-tabular">รหัสนักศึกษา: {member.st_id}</span>
                <span aria-hidden="true">·</span>
                <span>{member.course}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-pink-500" />
                  {member.email || '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 text-xs font-semibold text-[#4A2B4B] transition-colors hover:bg-pink-50 disabled:opacity-60 whitespace-nowrap"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>รีเฟรชข้อมูล</span>
            </button>
            <button
              type="button"
              onClick={onStartNewAssessment}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-pink-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-pink-700 whitespace-nowrap"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>ทำแบบประเมินใหม่</span>
            </button>
          </div>
        </div>

        {/* Personal KPI Strip */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-pink-100 pt-6 sm:grid-cols-3">
          <div className="rounded-xl bg-[#FFF5F9] px-4 py-3.5">
            <div className="text-xs font-medium text-[#6E4A6F]">จำนวนครั้งที่ประเมิน</div>
            <div className="font-mono-tabular mt-1 text-2xl font-bold text-[#2A1526]">
              {personalLogs.length} <span className="text-sm font-medium text-[#6E4A6F]">ครั้ง</span>
            </div>
          </div>

          <div className="rounded-xl bg-[#FFF5F9] px-4 py-3.5">
            <div className="text-xs font-medium text-[#6E4A6F]">คะแนนเฉลี่ยส่วนตัว</div>
            <div className="font-mono-tabular mt-1 text-2xl font-bold text-[#2A1526]">
              {averageScore.toFixed(1)}{' '}
              <span className="text-sm font-medium text-[#6E4A6F]">/ 15 คะแนน</span>
            </div>
          </div>

          <div className="rounded-xl bg-[#FFF5F9] px-4 py-3.5">
            <div className="text-xs font-medium text-[#6E4A6F]">ผลการประเมินครั้งล่าสุด</div>
            {latestLog ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl" role="img" aria-label={latestLog.result_text}>
                  {interpretStressScore(latestLog.total_score).emoji}
                </span>
                <div>
                  <div className="font-mono-tabular text-base font-bold text-pink-700">
                    {latestLog.total_score}/15 · {latestLog.result_text}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-1 text-base font-semibold text-[#6E4A6F]">ยังไม่มีประวัติ</div>
            )}
          </div>
        </div>
      </div>

      {/* Personal Trend Mini-Chart (when >= 2 logs) */}
      {chronologicalLogs.length >= 2 && (
        <div className="mt-6 rounded-2xl border border-pink-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#2A1526]">
                แนวโน้มคะแนนความเครียดส่วนตัว (12 ครั้งล่าสุด)
              </h3>
              <p className="text-xs text-[#6E4A6F]">
                เรียงลำดับจากครั้งเก่าไปหาครั้งล่าสุด (คะแนน 0–15)
              </p>
            </div>
          </div>
          <div className="mt-4 flex h-36 items-end gap-2 sm:gap-3">
            {chronologicalLogs.map((item) => {
              const pct = Math.max(8, Math.round((item.total_score / 15) * 100));
              const info = interpretStressScore(item.total_score);
              return (
                <div
                  key={item.log_id}
                  className="group flex flex-1 flex-col items-center justify-end gap-1.5 h-full"
                  title={`${formatThaiDateTime(item.date_time)} — ${item.total_score}/15 (${item.result_text})`}
                >
                  <span className="font-mono-tabular text-[11px] font-bold text-[#2A1526]">
                    {item.total_score}
                  </span>
                  <div className="flex w-full max-w-[36px] flex-1 items-end rounded-lg bg-pink-50 p-0.5">
                    <div
                      className={`w-full rounded-md transition-all ${info.accentBarClass}`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="max-w-full truncate font-mono-tabular text-[10px] text-[#6E4A6F]">
                    {item.date_time.slice(5, 10) || item.log_id.slice(-4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal History Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-pink-200 bg-white">
        <div className="flex items-center justify-between border-b border-pink-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="h-5 w-5 text-pink-600" />
            <h3 className="text-base font-bold text-[#2A1526]">
              รายการประวัติย้อนหลัง (เรียงจากล่าสุดอยู่บนสุด)
            </h3>
          </div>
          <span className="font-mono-tabular text-xs font-medium text-[#6E4A6F]">
            ทั้งหมด {personalLogs.length} รายการ
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-11 animate-pulse rounded-xl bg-pink-50" />
            ))}
          </div>
        ) : personalLogs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-base font-semibold text-[#2A1526]">
              ยังไม่มีประวัติการทำแบบประเมินสำหรับรหัส {member.st_id}
            </p>
            <p className="mt-1 text-sm text-[#6E4A6F]">
              เริ่มต้นประเมินความสุขและความเครียดครั้งแรกของคุณได้เลย
            </p>
            <button
              type="button"
              onClick={onStartNewAssessment}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-pink-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-pink-700"
            >
              <PlusCircle className="h-4 w-4" />
              <span>เริ่มทำแบบประเมิน ST-5</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-pink-100 bg-[#FFF9FB] text-xs font-semibold text-[#6E4A6F]">
                  <th className="px-5 py-3.5 whitespace-nowrap">วันที่และเวลา</th>
                  <th className="px-3 py-3.5 text-right whitespace-nowrap">ข้อ 1</th>
                  <th className="px-3 py-3.5 text-right whitespace-nowrap">ข้อ 2</th>
                  <th className="px-3 py-3.5 text-right whitespace-nowrap">ข้อ 3</th>
                  <th className="px-3 py-3.5 text-right whitespace-nowrap">ข้อ 4</th>
                  <th className="px-3 py-3.5 text-right whitespace-nowrap">ข้อ 5</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">คะแนนรวม</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">ผลการประเมิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-100">
                {personalLogs.map((log, idx) => {
                  const info = interpretStressScore(log.total_score);
                  return (
                    <tr
                      key={log.log_id}
                      className="transition-colors hover:bg-pink-50/40"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-mono-tabular text-xs font-medium text-[#2A1526]">
                          {formatThaiDateTime(log.date_time)}
                        </div>
                        <div className="font-mono-tabular text-[11px] text-[#8E698F]">
                          {log.log_id}
                          {idx === 0 ? ' · ล่าสุด' : ''}
                        </div>
                      </td>
                      <td className="font-mono-tabular px-3 py-3.5 text-right text-[#4A2B4B]">
                        {log.q1}
                      </td>
                      <td className="font-mono-tabular px-3 py-3.5 text-right text-[#4A2B4B]">
                        {log.q2}
                      </td>
                      <td className="font-mono-tabular px-3 py-3.5 text-right text-[#4A2B4B]">
                        {log.q3}
                      </td>
                      <td className="font-mono-tabular px-3 py-3.5 text-right text-[#4A2B4B]">
                        {log.q4}
                      </td>
                      <td className="font-mono-tabular px-3 py-3.5 text-right text-[#4A2B4B]">
                        {log.q5}
                      </td>
                      <td className="font-mono-tabular px-4 py-3.5 text-right font-bold text-pink-700">
                        {log.total_score} / 15
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${info.badgeColorClass}`}
                        >
                          <span aria-hidden="true">{info.emoji}</span>
                          <span>{log.result_text}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

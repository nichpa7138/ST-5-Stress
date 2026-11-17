import React, { useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  History,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  AssessmentLog,
  Member,
  ST5_QUESTIONS,
  ST5_RATING_CHOICES,
  formatCurrentDateTime,
  formatThaiDateTime,
  interpretStressScore,
} from '../types/st5';

interface AssessmentViewProps {
  member: Member;
  savedResult: AssessmentLog | null;
  onRequestSaveAssessment: (log: AssessmentLog) => void;
  onResetResult: () => void;
  onGoToHistory: () => void;
}

type ScoreMap = Partial<Record<'q1' | 'q2' | 'q3' | 'q4' | 'q5', 0 | 1 | 2 | 3>>;

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  member,
  savedResult,
  onRequestSaveAssessment,
  onResetResult,
  onGoToHistory,
}) => {
  const [scores, setScores] = useState<ScoreMap>({});
  const [formError, setFormError] = useState<string | null>(null);

  const answeredCount = ST5_QUESTIONS.filter((q) => scores[q.id] !== undefined).length;
  const allAnswered = answeredCount === ST5_QUESTIONS.length;

  const handleSelect = (qId: 'q1' | 'q2' | 'q3' | 'q4' | 'q5', value: 0 | 1 | 2 | 3) => {
    setScores((prev) => ({ ...prev, [qId]: value }));
    if (formError) setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) {
      setFormError('กรุณาตอบคำถามให้ครบทั้ง 5 ข้อก่อนประมวลผลคะแนน');
      return;
    }

    const q1 = scores.q1 ?? 0;
    const q2 = scores.q2 ?? 0;
    const q3 = scores.q3 ?? 0;
    const q4 = scores.q4 ?? 0;
    const q5 = scores.q5 ?? 0;
    const totalScore = q1 + q2 + q3 + q4 + q5;
    const interpretation = interpretStressScore(totalScore);

    const logId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `ST5-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
        : `ST5-${Date.now()}`;

    const newLog: AssessmentLog = {
      log_id: logId,
      st_id: member.st_id,
      date_time: formatCurrentDateTime(),
      q1,
      q2,
      q3,
      q4,
      q5,
      total_score: totalScore,
      result_text: interpretation.resultText,
    };

    onRequestSaveAssessment(newLog);
  };

  const handleRecalculate = () => {
    setScores({});
    setFormError(null);
    onResetResult();
  };

  if (savedResult) {
    const info = interpretStressScore(savedResult.total_score);
    const scorePct = Math.min(100, Math.round((savedResult.total_score / 15) * 100));

    return (
      <section className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-pink-200 bg-white p-6 sm:p-10">
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pink-100 pb-5">
            <div>
              <p className="text-xs font-medium text-pink-700">
                ผลการประเมินความเครียด ST-5 · บันทึกลง Google Sheets เรียบร้อยแล้ว
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#2A1526]">
                {member.prefix}
                {member.name} {member.lname}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6E4A6F]">
                <span className="font-mono-tabular">รหัส {member.st_id}</span>
                <span aria-hidden="true">·</span>
                <span>{member.course}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{formatThaiDateTime(savedResult.date_time)}</span>
              </div>
            </div>
            <div className="font-mono-tabular text-xs text-[#6E4A6F]">
              อ้างอิง: {savedResult.log_id}
            </div>
          </div>

          {/* Emoji + Score Showcase */}
          <div className="mt-8 grid grid-cols-1 items-center gap-8 md:grid-cols-12">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-pink-100 bg-[#FFF5F9] p-8 text-center md:col-span-5">
              <div
                className="select-none text-8xl leading-none sm:text-9xl"
                role="img"
                aria-label={info.resultText}
              >
                {info.emoji}
              </div>
              <p className="mt-4 text-sm font-semibold text-[#4A2B4B]">
                {info.emojiCaption}
              </p>
            </div>

            <div className="md:col-span-7">
              <div className="flex items-baseline gap-3">
                <span className="font-mono-tabular text-5xl font-bold tracking-tight text-pink-600 sm:text-6xl">
                  {savedResult.total_score}
                </span>
                <span className="font-mono-tabular text-xl font-semibold text-[#6E4A6F]">
                  / 15 คะแนน
                </span>
              </div>

              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-sm font-bold ${info.badgeColorClass}`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{info.resultText}</span>
                </span>
                <p className="mt-2.5 text-base font-semibold text-[#2A1526]">
                  {info.happinessText}
                </p>
              </div>

              {/* Score Threshold Meter */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-medium text-[#6E4A6F] tabular-nums">
                  <span>0 (น้อย)</span>
                  <span>5–7 (ปานกลาง)</span>
                  <span>8–9 (มาก)</span>
                  <span>10–15 (มากที่สุด)</span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-pink-100">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${info.accentBarClass}`}
                    style={{ width: `${Math.max(6, scorePct)}%` }}
                  />
                </div>
              </div>

              {/* Per-Question Breakdown */}
              <div className="mt-6 grid grid-cols-5 gap-2 border-t border-pink-100 pt-4 text-center">
                {(['q1', 'q2', 'q3', 'q4', 'q5'] as const).map((key, i) => (
                  <div key={key} className="rounded-xl bg-[#FFF9FB] px-2 py-2.5">
                    <div className="text-[11px] font-medium text-[#6E4A6F]">ข้อ {i + 1}</div>
                    <div className="font-mono-tabular mt-0.5 text-base font-bold text-[#2A1526]">
                      {savedResult[key]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mental Health Advice */}
          <div className={`mt-8 rounded-2xl border p-6 ${info.surfaceTintClass}`}>
            <h3 className="flex items-center gap-2 text-base font-bold text-[#2A1526]">
              <Sparkles className="h-4 w-4 text-pink-600" />
              <span>{info.adviceTitle}</span>
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-[#3B1E3D]">
              {info.adviceList.map((tip, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="font-mono-tabular mt-0.5 text-xs font-bold text-pink-700">
                    {index + 1}.
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Required Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-pink-100 pt-6">
            <button
              type="button"
              onClick={handleRecalculate}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-pink-200 bg-white px-5 text-sm font-semibold text-[#4A2B4B] transition-colors hover:bg-pink-50 focus-visible:outline-2 focus-visible:outline-pink-600 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-4 w-4 text-pink-600" />
              <span>คำนวณใหม่</span>
            </button>
            <button
              type="button"
              onClick={onGoToHistory}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-pink-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-pink-700 focus-visible:outline-2 focus-visible:outline-pink-600 whitespace-nowrap shrink-0"
            >
              <History className="h-4 w-4" />
              <span>ดูประวัติย้อนหลัง</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-pink-200 bg-white p-6 sm:p-8">
        {/* Top Student Context & Progress */}
        <div className="flex flex-col gap-4 border-b border-pink-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-pink-700">
              <span>แบบประเมินความเครียด ST-5 (กรมสุขภาพจิต)</span>
              <span aria-hidden="true">·</span>
              <span>{member.course}</span>
            </div>
            <h2 className="mt-1.5 text-2xl font-bold text-[#2A1526]">
              สวัสดี {member.prefix}
              {member.name} {member.lname}
            </h2>
            <p className="mt-1 text-sm text-[#6E4A6F]">
              โปรดเลือกคำตอบที่ตรงกับความรู้สึกหรืออาการของท่านมากที่สุดในช่วง 2–4 สัปดาห์ที่ผ่านมา
            </p>
          </div>

          <div className="shrink-0 text-left sm:text-right">
            <div className="font-mono-tabular text-sm font-bold text-pink-600">
              ตอบแล้ว {answeredCount} / 5 ข้อ
            </div>
            <div className="mt-1.5 h-2 w-44 overflow-hidden rounded-full bg-pink-100">
              <div
                className="h-full rounded-full bg-pink-600 transition-all duration-200"
                style={{ width: `${(answeredCount / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 5 Questions Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {ST5_QUESTIONS.map((q) => {
            const currentVal = scores[q.id];
            return (
              <fieldset
                key={q.id}
                className="rounded-2xl border border-pink-100 bg-[#FFFDFE] p-5 transition-colors focus-within:border-pink-300"
              >
                <legend className="sr-only">
                  ข้อที่ {q.number} {q.title}
                </legend>
                <div className="flex items-start gap-3">
                  <span className="font-mono-tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-xs font-bold text-pink-700">
                    {q.number}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#2A1526]">{q.title}</h3>
                    <p className="mt-0.5 text-xs text-[#6E4A6F]">{q.subtitle}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {ST5_RATING_CHOICES.map((choice) => {
                    const isSelected = currentVal === choice.value;
                    return (
                      <button
                        key={choice.value}
                        type="button"
                        onClick={() => handleSelect(q.id, choice.value)}
                        aria-pressed={isSelected}
                        className={`flex min-h-[56px] flex-col items-start justify-center rounded-xl border px-4 py-2.5 text-left transition-all focus-visible:outline-2 focus-visible:outline-pink-600 ${
                          isSelected
                            ? 'border-pink-600 bg-pink-600 text-white shadow-sm'
                            : 'border-pink-200/80 bg-white text-[#2A1526] hover:border-pink-400 hover:bg-pink-50/60'
                        }`}
                      >
                        <span className="text-sm font-semibold">{choice.label}</span>
                        <span
                          className={`mt-0.5 text-xs tabular-nums ${
                            isSelected ? 'text-pink-100' : 'text-[#6E4A6F]'
                          }`}
                        >
                          {choice.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
            >
              {formError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-pink-100 pt-6">
            <button
              type="button"
              onClick={() => {
                setScores({});
                setFormError(null);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-pink-200 bg-white px-5 text-sm font-semibold text-[#4A2B4B] transition-colors hover:bg-pink-50 whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4 text-pink-600" />
              <span>ล้างคำตอบทั้งหมด</span>
            </button>

            <button
              type="submit"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-pink-600 px-7 text-sm font-semibold text-white transition-colors hover:bg-pink-700 focus-visible:outline-2 focus-visible:outline-pink-600 whitespace-nowrap"
            >
              <ClipboardCheck className="h-4 w-4" />
              <span>ประเมินผลและบันทึกข้อมูล</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import {
  clearCachedToken,
  getAccessToken,
  googleSignIn,
  initAuth,
} from './services/googleAuth';
import {
  SheetsApiError,
  SpreadsheetMetadata,
  appendAssessmentLog,
  appendMember,
  ensureSheetStructure,
  fetchAssessmentLogs,
  fetchMembers,
  fetchPublicRealtimeData,
  fetchSpreadsheetMetadata,
} from './services/sheetsApi';
import { AssessmentLog, Member, SPREADSHEET_ID } from './types/st5';
import { LoginSection } from './components/LoginSection';
import { OverviewDashboard } from './components/OverviewDashboard';
import { AssessmentView } from './components/AssessmentView';
import { PersonalHistoryView } from './components/PersonalHistoryView';
import {
  ConfirmMutationModal,
  MutationDetailItem,
} from './components/ConfirmMutationModal';

type ActiveView = 'home' | 'assessment' | 'history' | 'dashboard';

type PendingMutation =
  | {
      type: 'register_member';
      member: Member;
    }
  | {
      type: 'save_assessment';
      log: AssessmentLog;
    };

const REALTIME_POLL_INTERVAL_MS = 15000;

export default function App() {
  const [metadata, setMetadata] = useState<SpreadsheetMetadata | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [assessmentLogs, setAssessmentLogs] = useState<AssessmentLog[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [savedResult, setSavedResult] = useState<AssessmentLog | null>(null);

  const [pendingMutation, setPendingMutation] = useState<PendingMutation | null>(null);
  const [isSubmittingMutation, setIsSubmittingMutation] = useState<boolean>(false);

  const loadSheetsData = useCallback(async (silent = false) => {
    const token = getAccessToken();

    if (!silent) {
      setIsLoadingData(true);
    }
    setDataError(null);

    try {
      if (token) {
        const meta = await fetchSpreadsheetMetadata(token);
        setMetadata(meta);

        const [loadedMembers, loadedLogs] = await Promise.all([
          meta.memberSheetName ? fetchMembers(token, meta.memberSheetName) : Promise.resolve([]),
          meta.assessmentSheetName
            ? fetchAssessmentLogs(token, meta.assessmentSheetName)
            : Promise.resolve([]),
        ]);

        setMembers(loadedMembers);
        setAssessmentLogs(loadedLogs);
      } else {
        const realtime = await fetchPublicRealtimeData();
        setMembers(realtime.members);
        setAssessmentLogs(realtime.assessmentLogs);
      }
    } catch (err) {
      if (err instanceof SheetsApiError && err.status === 401) {
        clearCachedToken();
        try {
          const realtime = await fetchPublicRealtimeData();
          setMembers(realtime.members);
          setAssessmentLogs(realtime.assessmentLogs);
          return;
        } catch (fallbackErr) {
          const fallbackMsg =
            fallbackErr instanceof Error
              ? fallbackErr.message
              : 'ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้';
          setDataError(fallbackMsg);
          return;
        }
      }
      const message =
        err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้';
      setDataError(message);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Initialize auth listener and immediately start automatic real-time Google Sheets sync
  useEffect(() => {
    const unsubscribe = initAuth(
      () => {
        void loadSheetsData(true);
      },
      () => {
        void loadSheetsData(true);
      }
    );

    void loadSheetsData(false);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadSheetsData(true);
      }
    }, REALTIME_POLL_INTERVAL_MS);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void loadSheetsData(true);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      unsubscribe();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [loadSheetsData]);

  const handleStudentLogin = (member: Member) => {
    setCurrentMember(member);
    setSavedResult(null);
    setActiveView('assessment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStudentLogout = () => {
    setCurrentMember(null);
    setSavedResult(null);
    setActiveView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmMutation = async () => {
    if (!pendingMutation) return;

    setIsSubmittingMutation(true);
    setDataError(null);

    try {
      let token = getAccessToken();
      if (!token) {
        const authResult = await googleSignIn();
        token = authResult.accessToken;
      }

      if (pendingMutation.type === 'register_member') {
        let activeMeta = metadata ?? (await fetchSpreadsheetMetadata(token));
        if (!activeMeta.memberSheetName) {
          activeMeta = await ensureSheetStructure(token, activeMeta);
          setMetadata(activeMeta);
        }
        await appendMember(
          token,
          pendingMutation.member,
          activeMeta.memberSheetName || 'MEMBER'
        );
        await loadSheetsData(true);
        setCurrentMember(pendingMutation.member);
        setSavedResult(null);
        setActiveView('assessment');
      } else if (pendingMutation.type === 'save_assessment') {
        let activeMeta = metadata ?? (await fetchSpreadsheetMetadata(token));
        if (!activeMeta.assessmentSheetName) {
          activeMeta = await ensureSheetStructure(token, activeMeta);
          setMetadata(activeMeta);
        }
        await appendAssessmentLog(
          token,
          pendingMutation.log,
          activeMeta.assessmentSheetName || 'ASSESSMENT_LOG'
        );
        setSavedResult(pendingMutation.log);
        await loadSheetsData(true);
      }

      setPendingMutation(null);
    } catch (err) {
      if (err instanceof SheetsApiError && err.status === 401) {
        clearCachedToken();
      }
      const message =
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลง Google Sheets';
      setDataError(message);
      setPendingMutation(null);
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  const hasWriteToken = Boolean(getAccessToken());

  let modalTitle = '';
  let modalDesc = '';
  let modalConfirmLabel = 'ยืนยันบันทึกข้อมูล';
  let modalDetails: MutationDetailItem[] = [];

  if (pendingMutation?.type === 'register_member') {
    const m = pendingMutation.member;
    modalTitle = 'ยืนยันการลงทะเบียนสมาชิกใหม่';
    modalDesc = 'ระบบจะเพิ่มข้อมูลนักศึกษารายนี้ลงในชีท MEMBER ของ Google Sheets';
    modalConfirmLabel = 'ยืนยันเพิ่มสมาชิก';
    modalDetails = [
      { label: 'Google Sheet ID', value: SPREADSHEET_ID },
      { label: 'รหัสนักศึกษา', value: m.st_id },
      { label: 'ชื่อ - นามสกุล', value: `${m.prefix}${m.name} ${m.lname}` },
      { label: 'หลักสูตร', value: m.course },
      { label: 'วันเกิด (Password)', value: m.dob },
      { label: 'อีเมล', value: m.email },
    ];
  } else if (pendingMutation?.type === 'save_assessment') {
    const l = pendingMutation.log;
    modalTitle = 'ยืนยันการบันทึกผลการประเมิน ST-5';
    modalDesc =
      'ระบบจะบันทึกคะแนนประเมินทั้ง 5 ข้อและผลการแปลระดับความเครียดลงในชีท ASSESSMENT_LOG';
    modalConfirmLabel = 'ยืนยันบันทึกผล';
    modalDetails = [
      { label: 'รหัสนักศึกษา', value: l.st_id },
      { label: 'วันเวลาที่ประเมิน', value: l.date_time },
      { label: 'คะแนนรวม', value: `${l.total_score} / 15 คะแนน` },
      { label: 'ผลการประเมิน', value: l.result_text },
    ];
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF9FB] text-[#2A1526]">
      {/* Clean 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-pink-200/70 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveView(currentMember ? 'assessment' : 'home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-lg font-bold tracking-tight text-pink-600 whitespace-nowrap shrink-0"
          >
            ST-5 Wellness
          </a>

          {/* Zone 2: Clean Single-line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5C3A5D]">
            {currentMember ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveView('assessment')}
                  className={`transition-colors hover:text-pink-700 hover:underline underline-offset-4 whitespace-nowrap shrink-0 ${
                    activeView === 'assessment' ? 'font-bold text-pink-700 underline' : ''
                  }`}
                >
                  ทำแบบประเมิน ST-5
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('history')}
                  className={`transition-colors hover:text-pink-700 hover:underline underline-offset-4 whitespace-nowrap shrink-0 ${
                    activeView === 'history' ? 'font-bold text-pink-700 underline' : ''
                  }`}
                >
                  ประวัติย้อนหลัง
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('dashboard')}
                  className={`transition-colors hover:text-pink-700 hover:underline underline-offset-4 whitespace-nowrap shrink-0 ${
                    activeView === 'dashboard' ? 'font-bold text-pink-700 underline' : ''
                  }`}
                >
                  สถิติภาพรวม
                </button>
              </>
            ) : (
              <>
                <a
                  href="#login-section"
                  className="transition-colors hover:text-pink-700 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                >
                  เข้าสู่ระบบนักศึกษา
                </a>
                <a
                  href="#overview-dashboard"
                  className="transition-colors hover:text-pink-700 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                >
                  สถิติภาพรวม
                </a>
                <a
                  href="#st5-criteria"
                  className="transition-colors hover:text-pink-700 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                >
                  เกณฑ์การแปลผล
                </a>
              </>
            )}
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            {currentMember ? (
              <button
                type="button"
                onClick={handleStudentLogout}
                className="h-10 rounded-xl bg-pink-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-pink-700 focus-visible:outline-2 focus-visible:outline-pink-600 whitespace-nowrap shrink-0"
              >
                ออกจากระบบ
              </button>
            ) : (
              <a
                href="#login-section"
                onClick={() => {
                  const el = document.getElementById('login-st-id');
                  el?.focus();
                }}
                className="inline-flex h-10 items-center rounded-xl bg-pink-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-pink-700 focus-visible:outline-2 focus-visible:outline-pink-600 whitespace-nowrap shrink-0"
              >
                เข้าสู่ระบบ ST-5
              </a>
            )}
          </div>
        </div>

        {/* Mobile Sub-Nav when Student is Logged In */}
        {currentMember && (
          <div className="flex items-center gap-2 overflow-x-auto border-t border-pink-100 px-4 py-2 md:hidden">
            <button
              type="button"
              onClick={() => setActiveView('assessment')}
              className={`h-8 rounded-lg px-3 text-xs font-semibold whitespace-nowrap shrink-0 ${
                activeView === 'assessment'
                  ? 'bg-pink-600 text-white'
                  : 'text-[#5C3A5D] hover:bg-pink-50'
              }`}
            >
              ทำแบบประเมิน ST-5
            </button>
            <button
              type="button"
              onClick={() => setActiveView('history')}
              className={`h-8 rounded-lg px-3 text-xs font-semibold whitespace-nowrap shrink-0 ${
                activeView === 'history'
                  ? 'bg-pink-600 text-white'
                  : 'text-[#5C3A5D] hover:bg-pink-50'
              }`}
            >
              ประวัติย้อนหลัง
            </button>
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className={`h-8 rounded-lg px-3 text-xs font-semibold whitespace-nowrap shrink-0 ${
                activeView === 'dashboard'
                  ? 'bg-pink-600 text-white'
                  : 'text-[#5C3A5D] hover:bg-pink-50'
              }`}
            >
              สถิติภาพรวม
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main id="top" className="flex-1">
        {!currentMember ? (
          <>
            <LoginSection
              members={members}
              isLoadingData={isLoadingData}
              onStudentLogin={handleStudentLogin}
              onRequestRegisterMember={(member) =>
                setPendingMutation({ type: 'register_member', member })
              }
            />

            {/* Overview Dashboard Placed Directly Below Login Box */}
            <OverviewDashboard
              members={members}
              assessmentLogs={assessmentLogs}
              isLoading={isLoadingData}
              errorMessage={dataError}
              onRefresh={() => void loadSheetsData(false)}
            />

            {/* ST-5 Scoring Reference Strip */}
            <section
              id="st5-criteria"
              className="mx-auto w-full max-w-[1200px] px-4 pb-12 sm:px-6 lg:px-8"
            >
              <div className="rounded-2xl border border-pink-200/80 bg-white p-6 sm:p-8">
                <h2 className="text-lg font-bold text-[#2A1526]">
                  เกณฑ์การแปลผลระดับความเครียด (ST-5)
                </h2>
                <p className="mt-1 text-sm text-[#6E4A6F]">
                  คำนวณจากผลรวมคะแนนคำถามทั้ง 5 ข้อ (0–3 คะแนนต่อข้อ รวมเต็ม 15 คะแนน)
                </p>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tabular text-sm font-bold text-emerald-800">
                        0 – 4 คะแนน
                      </span>
                      <span className="text-2xl" aria-hidden="true">
                        😄
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-[#2A1526]">
                      ความเครียดน้อย
                    </div>
                  </div>
                  <div className="rounded-xl border border-pink-200 bg-pink-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tabular text-sm font-bold text-pink-800">
                        5 – 7 คะแนน
                      </span>
                      <span className="text-2xl" aria-hidden="true">
                        🙂
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-[#2A1526]">
                      ความเครียดปานกลาง
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tabular text-sm font-bold text-amber-800">
                        8 – 9 คะแนน
                      </span>
                      <span className="text-2xl" aria-hidden="true">
                        😟
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-[#2A1526]">
                      ความเครียดมาก
                    </div>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tabular text-sm font-bold text-rose-800">
                        10 – 15 คะแนน
                      </span>
                      <span className="text-2xl" aria-hidden="true">
                        😰
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-[#2A1526]">
                      ความเครียดมากที่สุด
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            {dataError && (
              <div className="mx-auto mt-6 max-w-[1100px] px-4 sm:px-6 lg:px-8">
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
                >
                  {dataError}
                </div>
              </div>
            )}

            {activeView === 'assessment' && (
              <AssessmentView
                member={currentMember}
                savedResult={savedResult}
                onRequestSaveAssessment={(log) =>
                  setPendingMutation({ type: 'save_assessment', log })
                }
                onResetResult={() => setSavedResult(null)}
                onGoToHistory={() => setActiveView('history')}
              />
            )}

            {activeView === 'history' && (
              <PersonalHistoryView
                member={currentMember}
                allLogs={assessmentLogs}
                isLoading={isLoadingData}
                onRefresh={() => void loadSheetsData(false)}
                onStartNewAssessment={() => {
                  setSavedResult(null);
                  setActiveView('assessment');
                }}
              />
            )}

            {activeView === 'dashboard' && (
              <OverviewDashboard
                members={members}
                assessmentLogs={assessmentLogs}
                isLoading={isLoadingData}
                errorMessage={dataError}
                onRefresh={() => void loadSheetsData(false)}
              />
            )}
          </>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-pink-200/60 bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-[#6E4A6F] sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <span>
            ระบบประเมินตนเองเพื่อวัดระดับความสุขและความเครียด (ST-5) · กรมสุขภาพจิต
          </span>
          <span>สายด่วนสุขภาพจิต โทร. 1323 (ตลอด 24 ชั่วโมง)</span>
        </div>
      </footer>

      {/* Explicit Confirmation Dialog Before Writing to Google Sheets */}
      <ConfirmMutationModal
        open={pendingMutation !== null}
        title={modalTitle}
        description={modalDesc}
        details={modalDetails}
        confirmLabel={modalConfirmLabel}
        needsGoogleWriteAuth={!hasWriteToken}
        isSubmitting={isSubmittingMutation}
        onConfirm={() => void handleConfirmMutation()}
        onCancel={() => {
          if (!isSubmittingMutation) {
            setPendingMutation(null);
          }
        }}
      />
    </div>
  );
}

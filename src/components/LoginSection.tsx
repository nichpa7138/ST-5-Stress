import React, { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  HeartHandshake,
  Lock,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import {
  COURSES,
  Member,
  PREFIX_OPTIONS,
} from '../types/st5';

interface LoginSectionProps {
  members: Member[];
  isLoadingData: boolean;
  onStudentLogin: (member: Member) => void;
  onRequestRegisterMember: (newMember: Member) => void;
}

export const LoginSection: React.FC<LoginSectionProps> = ({
  members,
  isLoadingData,
  onStudentLogin,
  onRequestRegisterMember,
}) => {
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginId, setLoginId] = useState('');
  const [loginDob, setLoginDob] = useState('');
  const [showDob, setShowDob] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regId, setRegId] = useState('');
  const [regPrefix, setRegPrefix] = useState<string>(PREFIX_OPTIONS[1]);
  const [regName, setRegName] = useState('');
  const [regLname, setRegLname] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCourse, setRegCourse] = useState<string>(COURSES[0]);
  const [regError, setRegError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanId = loginId.trim();
    const cleanDob = loginDob.trim();

    if (!cleanId) {
      setLoginError('กรุณากรอกรหัสนักศึกษา');
      return;
    }
    if (!/^\d{8}$/.test(cleanDob)) {
      setLoginError('กรุณากรอกวันเดือนปีเกิดเป็นตัวเลข 8 หลัก รูปแบบ ววดดปปปป (พ.ศ.) เช่น 29102534');
      return;
    }

    const found = members.find((m) => m.st_id.trim() === cleanId);
    if (!found) {
      setLoginError(`ไม่พบรหัสนักศึกษา "${cleanId}" ในชีท MEMBER กรุณาตรวจสอบหรือลงทะเบียนสมาชิกใหม่`);
      return;
    }

    if (found.dob.trim() !== cleanDob) {
      setLoginError('รหัสผ่าน (วันเดือนปีเกิด ววดดปปปป) ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    onStudentLogin(found);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const cleanId = regId.trim();
    const cleanName = regName.trim();
    const cleanLname = regLname.trim();
    const cleanDob = regDob.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanId) {
      setRegError('กรุณากรอกรหัสนักศึกษา (ห้ามเว้นว่าง)');
      return;
    }
    if (members.some((m) => m.st_id.trim() === cleanId)) {
      setRegError(`รหัสนักศึกษา "${cleanId}" มีอยู่ในระบบแล้ว ห้ามซ้ำ`);
      return;
    }
    if (!cleanName || !cleanLname) {
      setRegError('กรุณากรอกชื่อและนามสกุลภาษาไทยให้ครบถ้วน');
      return;
    }
    if (!/^\d{8}$/.test(cleanDob)) {
      setRegError('วันเดือนปีเกิดต้องเป็นตัวเลข 8 หลัก รูปแบบ ววดดปปปป (พ.ศ.) เช่น 29102534');
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setRegError('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }

    onRequestRegisterMember({
      st_id: cleanId,
      prefix: regPrefix,
      name: cleanName,
      lname: cleanLname,
      dob: cleanDob,
      email: cleanEmail,
      course: regCourse,
    });
  };

  return (
    <section
      id="login-section"
      className="mx-auto w-full max-w-[1200px] px-4 pt-8 pb-6 sm:px-6 lg:px-8"
    >
      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        {/* Left Editorial Column */}
        <div className="flex flex-col justify-between rounded-2xl border border-pink-200/80 bg-white p-6 sm:p-8 lg:col-span-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-pink-700">
              <span>กรมสุขภาพจิต ST-5</span>
              <span aria-hidden="true">·</span>
              <span>สาขาวิชาเวชระเบียน</span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#2A1526] sm:text-4xl [text-wrap:balance]">
              ระบบประเมินตนเองเพื่อวัดระดับความสุขและความเครียด (ST-5)
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5C3A5D]">
              เครื่องมือประเมินภาวะความเครียด 5 ข้อสำหรับนักศึกษาหลักสูตร ปวส.เวชระเบียน และ วทบ.เวชระเบียน
              พร้อมแปรผลระดับความสุข คำแนะนำดูแลสุขภาพใจ และบันทึกประวัติย้อนหลังรายบุคคลลงฐานข้อมูล Google Sheets อย่างเป็นระบบ
            </p>

            {/* 3-Step Flow Overview */}
            <div className="mt-8 divide-y divide-pink-100 border-t border-b border-pink-100">
              <div className="flex items-start gap-4 py-3.5">
                <span className="font-mono-tabular mt-0.5 text-sm font-semibold text-pink-600">
                  01.
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#2A1526]">
                    เข้าสู่ระบบด้วยรหัสนักศึกษาและวันเกิด (พ.ศ.)
                  </p>
                  <p className="mt-0.5 text-xs text-[#6E4A6F]">
                    ตรวจสอบสิทธิ์จากตารางสมาชิก MEMBER และดึงข้อมูลประวัติเฉพาะบุคคล
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 py-3.5">
                <span className="font-mono-tabular mt-0.5 text-sm font-semibold text-pink-600">
                  02.
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#2A1526]">
                    ประเมินอาการ 5 ด้าน (คะแนนเต็ม 15 คะแนน)
                  </p>
                  <p className="mt-0.5 text-xs text-[#6E4A6F]">
                    แปรผล 4 ระดับความเครียด พร้อมคำแนะนำและ Emoji สื่ออารมณ์ทันที
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 py-3.5">
                <span className="font-mono-tabular mt-0.5 text-sm font-semibold text-pink-600">
                  03.
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#2A1526]">
                    ดูแดชบอร์ดสถิติภาพรวมด้านล่างได้ทันที
                  </p>
                  <p className="mt-0.5 text-xs text-[#6E4A6F]">
                    สรุปร้อยละแยกตามหลักสูตร เพศ ระดับความเครียด และแนวโน้มรายสัปดาห์
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Student Login / Registration Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-pink-200 bg-white p-6 sm:p-8 lg:col-span-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-600 text-white">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2A1526]">
                    เข้าสู่ระบบนักศึกษา
                  </h2>
                  <p className="text-xs text-[#6E4A6F]">
                    ยืนยันตัวตนจากตารางข้อมูลสมาชิก (MEMBER)
                  </p>
                </div>
              </div>

              {/* Segmented control: Login vs Register */}
              <div className="flex items-center gap-1 rounded-xl bg-[#FFF5F9] p-1 border border-pink-100">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('login');
                    setLoginError(null);
                  }}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    authTab === 'login'
                      ? 'bg-pink-600 text-white'
                      : 'text-[#6E4A6F] hover:text-pink-700'
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('register');
                    setRegError(null);
                  }}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    authTab === 'register'
                      ? 'bg-pink-600 text-white'
                      : 'text-[#6E4A6F] hover:text-pink-700'
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  ลงทะเบียนใหม่
                </button>
              </div>
            </div>

            {authTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="login-st-id"
                    className="block text-sm font-semibold text-[#2A1526]"
                  >
                    รหัสนักศึกษา (Username)
                  </label>
                  <input
                    id="login-st-id"
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="เช่น 64010001"
                    autoComplete="username"
                    className="mt-1.5 h-12 w-full rounded-xl border border-pink-200 bg-[#FFFDFE] px-4 font-mono-tabular text-sm text-[#2A1526] placeholder:font-sans placeholder:text-[#9C7B9D] focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-dob"
                    className="block text-sm font-semibold text-[#2A1526]"
                  >
                    วันเดือนปีเกิด 8 หลัก พ.ศ. (Password)
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="login-dob"
                      type={showDob ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={8}
                      value={loginDob}
                      onChange={(e) => setLoginDob(e.target.value.replace(/\D/g, ''))}
                      placeholder="รูปแบบ ววดดปปปป เช่น 29102534"
                      autoComplete="current-password"
                      className="h-12 w-full rounded-xl border border-pink-200 bg-[#FFFDFE] pr-12 pl-4 font-mono-tabular text-sm text-[#2A1526] placeholder:font-sans placeholder:text-[#9C7B9D] focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDob((v) => !v)}
                      aria-label={showDob ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#6E4A6F] hover:bg-pink-50 hover:text-pink-700"
                    >
                      {showDob ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#6E4A6F]">
                    <Lock className="h-3.5 w-3.5 text-pink-500" />
                    <span>ใช้วันเดือนปีเกิด พ.ศ. 8 หลัก (ววดดปปปป) จากชีท MEMBER</span>
                  </p>
                </div>

                {loginError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
                  >
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoadingData && members.length === 0}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-pink-700 focus-visible:outline-2 focus-visible:outline-pink-600 disabled:opacity-60 whitespace-nowrap"
                >
                  <span>เข้าสู่ระบบและทำแบบประเมิน ST-5</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="reg-st-id"
                      className="block text-xs font-semibold text-[#2A1526]"
                    >
                      รหัสนักศึกษา (st_id) *
                    </label>
                    <input
                      id="reg-st-id"
                      type="text"
                      value={regId}
                      onChange={(e) => setRegId(e.target.value)}
                      placeholder="เช่น 67010012"
                      className="mt-1 h-11 w-full rounded-xl border border-pink-200 bg-[#FFFDFE] px-3.5 font-mono-tabular text-sm text-[#2A1526] focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-prefix"
                      className="block text-xs font-semibold text-[#2A1526]"
                    >
                      คำนำหน้าชื่อ (prefix) *
                    </label>
                    <select
                      id="reg-prefix"
                      value={regPrefix}
                      onChange={(e) => setRegPrefix(e.target.value)}
                      className="mt-1 h-11 w-full rounded-xl border border-pink-200 bg-[#FFFDFE] px-3.5 text-sm text-[#2A1526] focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    >
                      {PREFIX_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-xs font-semibold text-[#2A1526]"
                    >
                      ชื่อภาษาไทย (name) *
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="ไม่ต้องใส่คำนำหน้า"
                      className="mt-1 h-11 w-full rounded-xl border border-pink-200 bg-[#FFFDFE] px-3.5 text-sm text-[#2A1526] focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-lname"
                      className="block text-xs font-semibold text-[#2A1526]"
                    >
                      นามสกุลภาษาไทย (lname) *
                    </label>
                    <input
                      id="reg-lname"
                      type="text"
                      value={regLname}
                      onChange={(e) => setRegLname(e.target.value)}
                      placeholder="นามสกุลภาษาไทย"
                      className="mt-1 h-11 w-full rounded-xl border border-pink-200 bg-[#FFFDFE] px-3.5 text-sm text-[#2A1526] focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="reg-dob"
                      className="block text-xs font-semibold text-[#2A1526]"
                    >
                      วันเกิด ววดดปปปป พ.ศ. (dob) *
                    </label>
                    <input
                      id="reg-dob"
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      value={regDob}
                      onChange={(e) => setRegDob(e.target.value.replace(/\D/g, ''))}
                      placeholder="เช่น 29102546"
                      className="mt-1 h-11 w-full rounded-xl border border-pink-200 bg-[#FFFDFE] px-3.5 font-mono-tabular text-sm text-[#2A1526] focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-course"
                      className="block text-xs font-semibold text-[#2A1526]"
                    >
                      หลักสูตร (course) *
                    </label>
                    <select
                      id="reg-course"
                      value={regCourse}
                      onChange={(e) => setRegCourse(e.target.value)}
                      className="mt-1 h-11 w-full rounded-xl border border-pink-200 bg-[#FFFDFE] px-3.5 text-sm text-[#2A1526] focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    >
                      {COURSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-[#2A1526]"
                  >
                    อีเมล (email) *
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="student@example.ac.th"
                    className="mt-1 h-11 w-full rounded-xl border border-pink-200 bg-[#FFFDFE] px-3.5 text-sm text-[#2A1526] focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>

                {regError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
                  >
                    {regError}
                  </div>
                )}

                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-pink-700 focus-visible:outline-2 focus-visible:outline-pink-600 whitespace-nowrap"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>บันทึกสมาชิกใหม่ลง Google Sheets</span>
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 border-t border-pink-100 pt-4 text-xs text-[#6E4A6F]">
            <span>หมายเหตุ:</span>{' '}
            <span>
              ข้อมูลการประเมินทั้งหมดเชื่อมโยงด้วยรหัสนักศึกษา (Foreign Key: st_id) และจัดเก็บอย่างปลอดภัยในบัญชี Google Sheets ของหน่วยงาน
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

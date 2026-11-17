import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface MutationDetailItem {
  label: string;
  value: string;
}

interface ConfirmMutationModalProps {
  open: boolean;
  title: string;
  description: string;
  details: MutationDetailItem[];
  confirmLabel: string;
  needsGoogleWriteAuth?: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmMutationModal: React.FC<ConfirmMutationModalProps> = ({
  open,
  title,
  description,
  details,
  confirmLabel,
  needsGoogleWriteAuth = false,
  isSubmitting,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A1526]/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-mutation-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-pink-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="confirm-mutation-title"
                className="text-lg font-bold text-[#2A1526]"
              >
                {title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[#6E4A6F]">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="ปิดหน้าต่างยืนยัน"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6E4A6F] transition-colors hover:bg-pink-50 hover:text-pink-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {details.length > 0 && (
          <div className="mt-5 divide-y divide-pink-100 rounded-xl border border-pink-100 bg-[#FFF9FB]">
            {details.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
              >
                <span className="text-[#6E4A6F]">{item.label}</span>
                <span className="font-medium text-[#2A1526] tabular-nums text-right">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {needsGoogleWriteAuth && (
          <p className="mt-4 rounded-xl border border-pink-100 bg-pink-50/70 px-4 py-3 text-xs leading-relaxed text-pink-900">
            เมื่อกดยืนยัน ระบบจะเปิดหน้าต่างยืนยันสิทธิ์บัญชี Google ของคุณเพื่อบันทึกข้อมูลแถวใหม่ลงใน Google Sheets โดยตรง
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-11 rounded-xl border border-pink-200 bg-white px-5 text-sm font-semibold text-[#4A2B4B] transition-colors hover:bg-pink-50 focus-visible:outline-2 focus-visible:outline-pink-600 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-pink-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-pink-700 focus-visible:outline-2 focus-visible:outline-pink-600 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSubmitting ? 'กำลังบันทึกข้อมูล...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

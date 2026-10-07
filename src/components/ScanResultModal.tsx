import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, RotateCcw, Bus, MapPin, User, Calendar, Clock, Award, Printer } from 'lucide-react';
import { ScanResult } from '../types';

interface ScanResultModalProps {
  result: ScanResult | null;
  onClose: () => void;
  onViewAttendance: () => void;
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  result,
  onClose,
  onViewAttendance,
}) => {
  useEffect(() => {
    if (result && result.success) {
      try {
        confetti({
          particleCount: 55,
          spread: 60,
          origin: { y: 0.65 },
          colors: result.scan_type === 'boarding' ? ['#2563eb', '#60a5fa', '#93c5fd'] : ['#16a34a', '#4ade80', '#bbf7d0'],
        });
      } catch {
        // confetti fallback
      }
    }
  }, [result]);

  if (!result) return null;

  const isSuccess = result.success;
  const isBoarding = result.scan_type === 'boarding';
  const isDropping = result.scan_type === 'dropping';
  const isCompleted = result.scan_type === 'completed';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Accent Bar */}
        <div
          className={`h-3 w-full ${
            !isSuccess
              ? 'bg-red-500'
              : isBoarding
              ? 'bg-amber-500'
              : isDropping
              ? 'bg-green-600'
              : 'bg-blue-600'
          }`}
        />

        <div className="p-6 sm:p-8">
          {/* Status Icon */}
          <div className="flex justify-center mb-4">
            {!isSuccess ? (
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center ring-8 ring-red-50 animate-bounce">
                <XCircle className="w-9 h-9" />
              </div>
            ) : isBoarding ? (
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center ring-8 ring-amber-50">
                <Bus className="w-9 h-9 animate-pulse" />
              </div>
            ) : isDropping ? (
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50">
                <CheckCircle2 className="w-9 h-9" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center ring-8 ring-blue-50">
                <AlertTriangle className="w-9 h-9" />
              </div>
            )}
          </div>

          {/* Title & Message */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {result.title}
            </h2>
            <p
              className={`mt-1.5 text-sm sm:text-base font-medium ${
                !isSuccess
                  ? 'text-red-600'
                  : isBoarding
                  ? 'text-amber-700'
                  : isDropping
                  ? 'text-emerald-700'
                  : 'text-slate-600'
              }`}
            >
              {result.message}
            </p>

            {/* Status Pill */}
            {result.scan_type && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-xs">
                {isBoarding && (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    STATUS: BOARDED (IN TRANSIT)
                  </span>
                )}
                {isDropping && (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    STATUS: TRIP COMPLETED
                  </span>
                )}
                {isCompleted && (
                  <span className="bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    ATTENDANCE ALREADY FINISHED
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Student Details Card if found */}
          {result.student && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 mb-6 text-slate-800 text-sm shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {result.student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {result.student.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Reg: {result.student.register_no} • {result.student.department} ({result.student.year} Year)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                    {result.student.bus_number}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">Pickup Stop</span>
                    <span className="font-medium text-slate-800">{result.student.pickup_at}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-semibold">Drop Location</span>
                    <span className="font-medium text-slate-800">{result.student.drop_at}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-slate-500 text-xs">NFC Card: </span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded text-xs">
                      {result.student.nfc_id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-slate-500 text-xs">Scan Time: </span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {result.scan_time || 'Just now'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons matching result.html */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm focus:ring-4 focus:ring-blue-100"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Scan Next</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onViewAttendance();
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors border border-slate-200"
            >
              <span>View Attendance</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {result.student && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Annapoorana Engineering College Bus Gate 1</span>
              <button
                onClick={handlePrint}
                className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

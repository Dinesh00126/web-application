import React, { useState, useEffect, useRef } from 'react';
import { Radio, Smartphone, Volume2, VolumeX, CheckCircle, Clock, Bus, ShieldAlert, Sparkles, UserCheck, ArrowRight } from 'lucide-react';
import { db } from '../services/db';
import { sound } from '../utils/audio';
import { ScanResult, Student } from '../types';

interface ScannerViewProps {
  onScanResult: (result: ScanResult) => void;
  students: Student[];
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onScanResult, students }) => {
  const [nfcIdInput, setNfcIdInput] = useState('');
  const [selectedBus, setSelectedBus] = useState<string>('AUTO');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isWebNfcScanning, setIsWebNfcScanning] = useState(false);
  const [webNfcStatus, setWebNfcStatus] = useState<string | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const todaySummary = db.getTodaySummary();

  const handlePerformScan = (nfcCode: string) => {
    if (!nfcCode || !nfcCode.trim()) {
      inputRef.current?.focus();
      return;
    }

    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 800);

    const busOverride = selectedBus === 'AUTO' ? undefined : selectedBus;
    const result = db.scanNfc(nfcCode, busOverride);

    // Audio cue
    if (soundEnabled) {
      if (!result.success) {
        sound.playErrorSound();
      } else if (result.scan_type === 'boarding') {
        sound.playBoardingSound();
      } else if (result.scan_type === 'dropping') {
        sound.playDroppingSound();
      } else {
        sound.playWarningSound();
      }
    }

    onScanResult(result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePerformScan(nfcIdInput);
  };

  // Hardware Web NFC API (Supported in Chrome on Android)
  const toggleWebNfc = async () => {
    if (isWebNfcScanning) {
      setIsWebNfcScanning(false);
      setWebNfcStatus('NFC hardware listener stopped.');
      return;
    }

    if (!('NDEFReader' in window)) {
      setWebNfcStatus('Web NFC hardware is only supported on Android devices running Chrome with NFC enabled. Use simulated cards or manual input below.');
      return;
    }

    try {
      // @ts-expect-error - Web NFC types
      const ndef = new window.NDEFReader();
      await ndef.scan();
      setIsWebNfcScanning(true);
      setWebNfcStatus('Ready! Hold your student NFC card or sticker near the phone back.');

      // @ts-expect-error - Web NFC types
      ndef.addEventListener('reading', ({ serialNumber, message }) => {
        let scannedText = serialNumber || '';
        if (message && message.records) {
          for (const record of message.records) {
            if (record.recordType === 'text') {
              const textDecoder = new TextDecoder(record.encoding || 'utf-8');
              scannedText = textDecoder.decode(record.data);
            }
          }
        }
        if (scannedText) {
          setNfcIdInput(scannedText);
          handlePerformScan(scannedText);
        }
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'NFC permission denied or error.';
      setWebNfcStatus(`NFC error: ${errorMsg}`);
      setIsWebNfcScanning(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live RFID/NFC Bus Terminal v2.4
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
          NFC Bus Attendance System
        </h1>
        <p className="mt-3 text-slate-600 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Tap or enter the student's NFC card to automatically log boarding when entering the bus and dropping when reaching the college.
        </p>

        {/* Real-time stats bar */}
        <div className="mt-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-xs text-slate-500 block font-medium">Present Today</span>
            <span className="text-2xl font-bold text-blue-600">{todaySummary.total_present}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-xs">
            <span className="text-xs text-amber-700 block font-medium">On Bus</span>
            <span className="text-2xl font-bold text-amber-600">{todaySummary.boarded_count}</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-xs">
            <span className="text-xs text-emerald-700 block font-medium">Dropped Off</span>
            <span className="text-2xl font-bold text-emerald-600">{todaySummary.completed_count}</span>
          </div>
        </div>
      </div>

      {/* Main Scanner Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10 relative overflow-hidden transition-all">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

        {/* Top Controls: Sound Toggle & Terminal Gate */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
            <Bus className="w-4 h-4 text-blue-600" />
            <span>Bus Terminal:</span>
            <select
              value={selectedBus}
              onChange={(e) => setSelectedBus(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="AUTO">Auto (Student Assigned Bus)</option>
              {db.getAllBusNumbers().map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title={soundEnabled ? 'Mute scanner beeps' : 'Enable sound beeps'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>Sound {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Animated NFC Wave Pad */}
        <div className="text-center mb-6">
          <div
            onClick={() => inputRef.current?.focus()}
            className={`cursor-pointer mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-500 text-white flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              isPulsing ? 'ring-8 ring-blue-300 ring-offset-4 animate-pulse' : 'ring-4 ring-blue-100'
            }`}
          >
            <Radio className={`w-12 h-12 sm:w-14 sm:h-14 ${isPulsing ? 'animate-bounce' : 'animate-pulse'}`} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-4">
            📡 NFC Card Reader
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Scan physical NFC card or select any test badge below
          </p>
        </div>

        {/* Manual Input Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              name="nfc_id"
              id="nfc_id"
              value={nfcIdInput}
              onChange={(e) => setNfcIdInput(e.target.value)}
              placeholder="Enter NFC ID (e.g. NFC001)"
              className="w-full pl-4 pr-28 py-3.5 sm:py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 font-mono text-base sm:text-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner"
              autoComplete="off"
              required
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Scan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Mobile Real Web NFC Trigger */}
        <div className="max-w-md mx-auto mb-8 text-center">
          <button
            type="button"
            onClick={toggleWebNfc}
            className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all border ${
              isWebNfcScanning
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>{isWebNfcScanning ? '🔴 NFC Listener Active (Tap Card)' : '📱 Enable Android Mobile NFC Sensor'}</span>
          </button>
          {webNfcStatus && (
            <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
              {webNfcStatus}
            </p>
          )}
        </div>

        {/* Interactive Quick Test Badges matching the prompt's buttons */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
              ⚡ One-Tap Student NFC Badges
            </h3>
            <span className="text-[11px] text-blue-600 font-medium">Click to instantly tap</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {students.slice(0, 4).map((student) => {
              // Check current student attendance status
              const records = db.getAttendanceRecords();
              const today = db.getTodaySummary();
              const todayRecord = records.find(
                (r) => r.student_id === student.student_id && r.attendance_date === new Date().toISOString().slice(0, 10)
              );
              const currentStatus = todayRecord ? todayRecord.status : 'NOT_SCANNED';

              return (
                <button
                  key={student.student_id}
                  type="button"
                  onClick={() => {
                    setNfcIdInput(student.nfc_id);
                    handlePerformScan(student.nfc_id);
                  }}
                  className="group p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 text-left transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-xs cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                      {student.name.charAt(0)}
                    </span>
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {student.nfc_id}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                    {student.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {student.department} • {student.bus_number}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Today:</span>
                    {currentStatus === 'NOT_SCANNED' && (
                      <span className="text-slate-400 font-semibold">Not Scanned</span>
                    )}
                    {currentStatus === 'BOARDED' && (
                      <span className="text-amber-600 font-bold">🟡 Boarded</span>
                    )}
                    {currentStatus === 'COMPLETED' && (
                      <span className="text-emerald-600 font-bold">🟢 Completed</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Test unregistered card */}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setNfcIdInput('NFC999');
                handlePerformScan('NFC999');
              }}
              style={{ backgroundColor: '#fef2f2' }}
              className="text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 bg-[#fef2f2] hover:bg-red-100/80 px-2.5 py-1 rounded-lg border border-red-200 transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Simulate Unregistered Card (NFC999)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guide Card explaining the 3-Step Scan Logic */}
      <div className="mt-8 bg-blue-50/70 border border-blue-100 rounded-2xl p-4 sm:p-6 text-slate-700">
        <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          How the Smart NFC Bus Attendance Workflow Works:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
            <div className="font-bold text-blue-800 mb-1">1st Tap: Morning Boarding</div>
            <p className="text-slate-600 text-xs leading-relaxed">
              When student steps on the bus at their pickup point, records boarding time and marks status as <strong>BOARDED</strong>.
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
            <div className="font-bold text-emerald-800 mb-1">2nd Tap: College Arrival</div>
            <p className="text-slate-600 text-xs leading-relaxed">
              When student disembarks at Annapoorana Engineering College, logs dropping time and marks status as <strong>COMPLETED</strong>.
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
            <div className="font-bold text-purple-800 mb-1">3rd Tap: Safety Verification</div>
            <p className="text-slate-600 text-xs leading-relaxed">
              If tapped again, alerts operator that daily attendance is already finalized without duplicate database entries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

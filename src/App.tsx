import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ScannerView } from './components/ScannerView';
import { ScanResultModal } from './components/ScanResultModal';
import { AttendanceView } from './components/AttendanceView';
import { StudentsView } from './components/StudentsView';
import { FleetView } from './components/FleetView';
import { ShareModal } from './components/ShareModal';
import { PythonBackendModal } from './components/PythonBackendModal';
import { api } from './services/api';
import { sound } from './utils/audio';
import { ScanResult, Student } from './types';
import { db } from './services/db';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'attendance' | 'students' | 'fleet'>('scanner');
  const [students, setStudents] = useState<Student[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let mounted = true;
    api.getStudents().then((data) => {
      if (mounted) setStudents(data);
    });
    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleResetData = async () => {
    await api.resetDatabase();
    handleRefresh();
  };

  const handleScanResult = (result: ScanResult) => {
    setScanResult(result);
    handleRefresh();
  };

  const handleSimulateScan = async (nfcId: string) => {
    const result = await api.scanNfc(nfcId);
    if (!result.success) {
      sound.playErrorSound();
    } else if (result.scan_type === 'boarding') {
      sound.playBoardingSound();
    } else if (result.scan_type === 'dropping') {
      sound.playDroppingSound();
    } else {
      sound.playWarningSound();
    }
    setScanResult(result);
    handleRefresh();
  };

  const todaySummary = db.getTodaySummary();

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 flex flex-col font-sans pb-20 md:pb-8 selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetData}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        totalPresent={todaySummary.total_present}
      />

      {/* Main App Content */}
      <main className="flex-1">
        {activeTab === 'scanner' && (
          <ScannerView
            onScanResult={handleScanResult}
            students={students}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            students={students}
            onRefresh={handleRefresh}
            onSimulateScan={handleSimulateScan}
          />
        )}

        {activeTab === 'fleet' && (
          <FleetView
            onSimulateScan={handleSimulateScan}
            onRefresh={handleRefresh}
          />
        )}
      </main>

      {/* Scan Result Modal (matches result.html) */}
      <ScanResultModal
        result={scanResult}
        onClose={() => setScanResult(null)}
        onViewAttendance={() => setActiveTab('attendance')}
      />

      {/* Share / Open on Phone QR Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      {/* Python Flask Backend & MySQL Viewer Modal */}
      <PythonBackendModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">🚌 Annapoorana Engineering College</span>
            <span>• Bus Transport NFC Management</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPythonModalOpen(true)}
              className="text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Python Backend: Active</span>
            </button>
            <div className="text-slate-400">
              Database: <span className="font-mono text-slate-600 font-semibold">college_db</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

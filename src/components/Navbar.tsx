import React, { useState, useEffect } from 'react';
import { Bus, Radio, Users, ClipboardList, RotateCcw, Menu, X, Smartphone, Clock, QrCode, Terminal } from 'lucide-react';
import { db } from '../services/db';

interface NavbarProps {
  activeTab: 'scanner' | 'attendance' | 'students' | 'fleet';
  setActiveTab: (tab: 'scanner' | 'attendance' | 'students' | 'fleet') => void;
  onResetData: () => void;
  onOpenShare: () => void;
  onOpenPythonModal: () => void;
  totalPresent: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onResetData,
  onOpenShare,
  onOpenPythonModal,
  totalPresent,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  interface NavItem {
    id: 'scanner' | 'attendance' | 'students' | 'fleet';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | null;
  }

  const navItems: NavItem[] = [
    { id: 'scanner', label: 'NFC Scanner', icon: Radio },
    { id: 'attendance', label: 'Attendance', icon: ClipboardList, badge: totalPresent > 0 ? totalPresent : null },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'fleet', label: 'Buses & Routes', icon: Bus },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#172554] text-white shadow-md border-b border-blue-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => setActiveTab('scanner')}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-2xl group-hover:bg-blue-600/50 transition-colors shadow-inner">
                🚌
              </div>
              <div>
                <span className="text-lg sm:text-2xl font-bold tracking-tight text-white block">
                  College Bus NFC
                </span>
                <span className="text-[11px] sm:text-xs text-blue-200 block font-normal -mt-0.5">
                  Annapoorana Engineering College
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/40'
                        : 'text-blue-100 hover:text-white hover:bg-blue-900/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-blue-400/30 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Top Right Info & Reset */}
            <div className="hidden sm:flex items-center space-x-2">
              <button
                onClick={onOpenPythonModal}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 font-medium transition-colors text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer"
                title="View Python Flask Backend Program & MySQL Schema"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Python Backend</span>
              </button>

              <button
                onClick={onOpenShare}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer"
                title="Open on phone with QR code or link"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Open on Phone</span>
              </button>

              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/60 text-xs font-mono text-blue-200">
                <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>{currentTime}</span>
              </div>

              <button
                onClick={() => {
                  if (confirm('Reset database to default original student records?')) {
                    onResetData();
                  }
                }}
                title="Reset sample database"
                className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-900/60 transition-colors text-xs flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-xs">Reset DB</span>
              </button>
            </div>

            {/* Mobile Actions: Share & Hamburger */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={onOpenShare}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                title="Open on phone or other devices"
              >
                <QrCode className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-white hover:bg-blue-900/70 focus:outline-none"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-blue-900 bg-[#121d42] px-4 pt-3 pb-4 space-y-1">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-blue-800/60 text-xs text-blue-300">
              <button
                onClick={() => {
                  onOpenPythonModal();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-amber-300 hover:text-white flex items-center space-x-1.5 bg-amber-500/20 border border-amber-400/30 px-2.5 py-1 rounded"
              >
                <Terminal className="w-3 h-3 text-amber-400" />
                <span>Python Backend</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Reset database to default student records?')) {
                    onResetData();
                    setMobileMenuOpen(false);
                  }
                }}
                className="text-xs text-blue-300 hover:text-white flex items-center space-x-1 bg-blue-900/40 px-2.5 py-1 rounded"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset DB</span>
              </button>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-blue-100 hover:bg-blue-900/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Floating Bottom Navigation Bar for Mobile Phones */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-1 px-2 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative ${
                isActive
                  ? 'text-blue-600 font-semibold scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded-full bg-blue-600 text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

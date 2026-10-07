import React, { useState } from 'react';
import { Download, Printer, Search, Filter, Calendar, Bus, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { db, getTodayDateString } from '../services/db';
import { AttendanceRecord } from '../types';

interface AttendanceViewProps {
  onRefresh: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBus, setSelectedBus] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  const todaySummary = db.getTodaySummary();

  const records = db.getAttendanceRecords({
    date: selectedDate || undefined,
    bus: selectedBus,
    status: selectedStatus,
    search: searchTerm,
  });

  const exportCSV = () => {
    if (records.length === 0) {
      alert('No attendance records to export.');
      return;
    }

    const headers = [
      'Register No',
      'Name',
      'Department',
      'Year',
      'NFC ID',
      'Bus Number',
      'Date',
      'Pickup Point',
      'Drop Point',
      'Boarding Time',
      'Dropping Time',
      'Status',
    ];

    const rows = records.map((r) => [
      `"${r.register_no}"`,
      `"${r.name}"`,
      `"${r.department}"`,
      r.year,
      `"${r.nfc_id}"`,
      `"${r.bus_number}"`,
      r.attendance_date,
      `"${r.pickup_at}"`,
      `"${r.drop_at}"`,
      `"${r.boarding_time || '-'}"`,
      `"${r.dropping_time || '-'}"`,
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `college_bus_attendance_${selectedDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this attendance entry?')) {
      db.deleteAttendanceRecord(id);
      onRefresh();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>📋 Bus Attendance Records</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time boarding & dropping logs for Annapoorana Engineering College bus routes
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-300 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards matching summary-card in attendance.html */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
            {todaySummary.total_present}
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{todaySummary.total_present}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total Present Today
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{todaySummary.boarded_count}</div>
            <div className="text-xs font-medium text-amber-700/80 uppercase tracking-wide">
              Currently Boarded (In Transit)
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{todaySummary.completed_count}</div>
            <div className="text-xs font-medium text-emerald-700/80 uppercase tracking-wide">
              Trips Completed (At College)
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search name, reg no, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Picker */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Bus Filter */}
          <div className="relative">
            <Bus className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <select
              value={selectedBus}
              onChange={(e) => setSelectedBus(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Buses</option>
              {db.getAllBusNumbers().map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="BOARDED">BOARDED (In Transit)</option>
              <option value="COMPLETED">COMPLETED (Dropped)</option>
            </select>
          </div>
        </div>

        {/* Clear filter indicator */}
        {(searchTerm || selectedBus !== 'ALL' || selectedStatus !== 'ALL') && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Filtering: Showing {records.length} matches</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBus('ALL');
                setSelectedStatus('ALL');
                setSelectedDate(getTodayDateString());
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Desktop Table View (matching table-container in attendance.html) */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-[#172554] text-white text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3.5">Register No</th>
                <th className="px-4 py-3.5">Name</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Bus</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Pickup Point</th>
                <th className="px-4 py-3.5">Drop Point</th>
                <th className="px-4 py-3.5">Boarding Time</th>
                <th className="px-4 py-3.5">Dropping Time</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-3 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length > 0 ? (
                records.map((record) => (
                  <tr key={record.attendance_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{record.register_no}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{record.name}</td>
                    <td className="px-4 py-3 text-slate-600">{record.department}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {record.bus_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{record.attendance_date}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={record.pickup_at}>
                      {record.pickup_at}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={record.drop_at}>
                      {record.drop_at}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-800">
                      {record.boarding_time || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-800">
                      {record.dropping_time || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {record.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          COMPLETED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          BOARDED
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleDelete(record.attendance_id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No attendance records found for this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Layout for Phones & Tablets */}
      <div className="lg:hidden space-y-3">
        {records.length > 0 ? (
          records.map((record) => (
            <div
              key={record.attendance_id}
              className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-base">{record.name}</span>
                    <span className="font-mono text-xs text-slate-500">({record.register_no})</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {record.department} • Year {record.year}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                    {record.bus_number}
                  </span>
                  {record.status === 'COMPLETED' ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      COMPLETED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      BOARDED
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Boarding</span>
                  <span className="font-mono font-medium text-slate-800">{record.boarding_time || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Dropping</span>
                  <span className="font-mono font-medium text-slate-800">{record.dropping_time || '-'}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pickup Point</span>
                  <span className="font-medium text-slate-800">{record.pickup_at}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Date: {record.attendance_date}</span>
                <button
                  onClick={() => handleDelete(record.attendance_id)}
                  className="text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No attendance records found.
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { UserPlus, Search, Edit2, Trash2, CreditCard, X, Check, Bus, MapPin, Award, QrCode } from 'lucide-react';
import { db } from '../services/db';
import { Student } from '../types';

interface StudentsViewProps {
  students: Student[];
  onRefresh: () => void;
  onSimulateScan: (nfcId: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onRefresh,
  onSimulateScan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewCardStudent, setViewCardStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    register_no: '',
    name: '',
    department: 'AI&DS',
    year: 2,
    nfc_id: '',
    bus_number: 'BUS-01',
    pickup_at: '',
    drop_at: 'Annapoorana Engineering College',
  });
  const [formError, setFormError] = useState('');

  const departments = ['ALL', ...Array.from(new Set(students.map((s) => s.department)))];
  const allBuses = db.getAllBusNumbers();

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.register_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nfc_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.pickup_at.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const openAddModal = () => {
    // Generate next default NFC code
    const existingNfcNumbers = students
      .map((s) => {
        const match = s.nfc_id.match(/NFC(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existingNfcNumbers.length > 0 ? Math.max(...existingNfcNumbers) + 1 : 5;
    const nextNfc = `NFC${String(nextNum).padStart(3, '0')}`;

    setFormData({
      register_no: `24AD${String(students.length + 1).padStart(3, '0')}`,
      name: '',
      department: 'AI&DS',
      year: 2,
      nfc_id: nextNfc,
      bus_number: 'BUS-01',
      pickup_at: 'Salem New Bus Stand',
      drop_at: 'Annapoorana Engineering College',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      register_no: student.register_no,
      name: student.name,
      department: student.department,
      year: student.year,
      nfc_id: student.nfc_id,
      bus_number: student.bus_number,
      pickup_at: student.pickup_at,
      drop_at: student.drop_at,
    });
    setFormError('');
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (editingStudent) {
      const res = db.updateStudent({
        ...editingStudent,
        ...formData,
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to update student');
        return;
      }
      setEditingStudent(null);
    } else {
      const res = db.addStudent(formData);
      if (!res.success) {
        setFormError(res.error || 'Failed to add student');
        return;
      }
      setIsAddModalOpen(false);
    }

    onRefresh();
  };

  const handleDelete = (student: Student) => {
    if (confirm(`Remove student ${student.name} (${student.register_no})?`)) {
      db.deleteStudent(student.student_id);
      onRefresh();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Title & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>👨‍🎓 Registered Students</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Student directory, assigned buses, pickup points, and linked NFC RFID credentials
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, reg no, NFC ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Department:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View (matching students.html exactly) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-[#172554] text-white text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3.5">Register No</th>
                <th className="px-4 py-3.5">Name</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Year</th>
                <th className="px-4 py-3.5">NFC ID</th>
                <th className="px-4 py-3.5">Bus</th>
                <th className="px-4 py-3.5">Pickup</th>
                <th className="px-4 py-3.5">Drop</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.student_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{student.register_no}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          {student.name.charAt(0)}
                        </span>
                        <span>{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {student.department}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{student.year}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {student.nfc_id}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">{student.bus_number}</td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={student.pickup_at}>
                      {student.pickup_at}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={student.drop_at}>
                      {student.drop_at}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setViewCardStudent(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Digital NFC Bus Pass"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSimulateScan(student.nfc_id)}
                          className="px-2 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-xs"
                          title="Simulate Card Tap"
                        >
                          Tap
                        </button>
                        <button
                          onClick={() => openEditModal(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit Student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-slate-400">
                    No students match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Grid View */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredStudents.map((student) => (
          <div
            key={student.student_id}
            className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{student.name}</h3>
                  <div className="font-mono text-xs text-slate-500">
                    {student.register_no} • {student.department}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                {student.bus_number}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Year</span>
                <span className="font-medium text-slate-800">{student.year} Year</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">NFC Card ID</span>
                <span className="font-mono font-bold text-blue-600">{student.nfc_id}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pickup</span>
                <span className="font-medium text-slate-800">{student.pickup_at}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => onSimulateScan(student.nfc_id)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white flex items-center gap-1 shadow-xs"
              >
                <span>📡 Tap NFC Card</span>
              </button>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setViewCardStudent(student)}
                  className="p-1.5 text-slate-500 hover:text-blue-600"
                  title="View Card"
                >
                  <CreditCard className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEditModal(student)}
                  className="p-1.5 text-slate-500 hover:text-amber-600"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(student)}
                  className="p-1.5 text-slate-500 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Student Modal */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingStudent ? 'Edit Student Details' : 'Register New Student'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dinesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Register No</label>
                  <input
                    type="text"
                    required
                    placeholder="24AD005"
                    value={formData.register_no}
                    onChange={(e) => setFormData({ ...formData, register_no: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NFC ID Card</label>
                  <input
                    type="text"
                    required
                    placeholder="NFC005"
                    value={formData.nfc_id}
                    onChange={(e) => setFormData({ ...formData, nfc_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AI&DS">AI&DS</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bus Number</label>
                  <select
                    value={formData.bus_number}
                    onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    {allBuses.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pickup Stop</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hasthampatti"
                    value={formData.pickup_at}
                    onChange={(e) => setFormData({ ...formData, pickup_at: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Drop Destination</label>
                <input
                  type="text"
                  required
                  value={formData.drop_at}
                  onChange={(e) => setFormData({ ...formData, drop_at: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-colors"
                >
                  {editingStudent ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Student RFID Bus Pass Card Modal */}
      {viewCardStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 relative overflow-hidden">
            <button
              onClick={() => setViewCardStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Smart NFC Card Artwork */}
            <div className="bg-gradient-to-br from-[#172554] via-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden mb-5">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-[10px] tracking-wider uppercase text-blue-200 font-semibold">
                    Annapoorana Eng. College
                  </div>
                  <div className="text-sm font-bold tracking-tight">Smart Bus Pass</div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <CreditCard className="w-4 h-4 text-amber-300" />
                </div>
              </div>

              {/* Chip & RFID wave */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-7 rounded bg-amber-300/80 border border-amber-400 flex items-center justify-center shadow-inner">
                  <div className="w-6 h-4 border border-amber-600/40 rounded-xs" />
                </div>
                <Award className="w-5 h-5 text-blue-300" />
              </div>

              <div className="space-y-1">
                <div className="text-lg font-bold tracking-wide">{viewCardStudent.name}</div>
                <div className="text-xs text-blue-200 font-mono">
                  {viewCardStudent.register_no} • {viewCardStudent.department}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-blue-300 block">NFC ID</span>
                  <span className="font-mono font-bold tracking-wider">{viewCardStudent.nfc_id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-blue-300 block">ROUTE BUS</span>
                  <span className="font-bold text-amber-300">{viewCardStudent.bus_number}</span>
                </div>
              </div>
            </div>

            {/* Pass Details */}
            <div className="space-y-2 text-xs text-slate-600 mb-5">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Boarding Point:</span>
                <span className="font-semibold text-slate-800">{viewCardStudent.pickup_at}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">College Destination:</span>
                <span className="font-semibold text-slate-800">{viewCardStudent.drop_at}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Card Status:</span>
                <span className="text-emerald-600 font-bold">Active RFID Credential</span>
              </div>
            </div>

            <button
              onClick={() => {
                setViewCardStudent(null);
                onSimulateScan(viewCardStudent.nfc_id);
              }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Tap This Card On Bus Reader</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

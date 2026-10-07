import { Student, AttendanceRecord, ScanResult, BusRoute } from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'college_bus_nfc_students_v1',
  ATTENDANCE: 'college_bus_nfc_attendance_v1',
  BUSES: 'college_bus_nfc_buses_v1',
};

// Initial bus routes
const INITIAL_BUSES: BusRoute[] = [
  {
    busNumber: 'BUS-01',
    routeName: 'Salem Central & Ammapet Route',
    driverName: 'Murugan (Driver #04)',
    capacity: 40,
    stops: [
      'Salem New Bus Stand (07:30 AM)',
      'Hasthampatti (07:45 AM)',
      'Ammapet (08:00 AM)',
      'Annapoorana Engineering College (08:30 AM)',
    ],
  },
  {
    busNumber: 'BUS-02',
    routeName: 'Fairlands & Meyyanur Route',
    driverName: 'Selvam (Driver #07)',
    capacity: 35,
    stops: [
      'Fairlands (07:40 AM)',
      'New Fairlands Corner (07:55 AM)',
      'Annapoorana Engineering College (08:30 AM)',
    ],
  },
];

// Initial students from MySQL insert statement
const INITIAL_STUDENTS: Student[] = [
  {
    student_id: 1,
    register_no: '24AD001',
    name: 'Dinesh',
    department: 'AI&DS',
    year: 2,
    nfc_id: 'NFC001',
    bus_number: 'BUS-01',
    pickup_at: 'Salem New Bus Stand',
    drop_at: 'Annapoorana Engineering College',
  },
  {
    student_id: 2,
    register_no: '24AD002',
    name: 'Arun',
    department: 'CSE',
    year: 2,
    nfc_id: 'NFC002',
    bus_number: 'BUS-01',
    pickup_at: 'Hasthampatti',
    drop_at: 'Annapoorana Engineering College',
  },
  {
    student_id: 3,
    register_no: '24AD003',
    name: 'Kumar',
    department: 'ECE',
    year: 2,
    nfc_id: 'NFC003',
    bus_number: 'BUS-02',
    pickup_at: 'Fairlands',
    drop_at: 'Annapoorana Engineering College',
  },
  {
    student_id: 4,
    register_no: '24AD004',
    name: 'Ravi',
    department: 'AI&DS',
    year: 2,
    nfc_id: 'NFC004',
    bus_number: 'BUS-01',
    pickup_at: 'Ammapet',
    drop_at: 'Annapoorana Engineering College',
  },
];

// Seed attendance records for demonstration of past / today
const getInitialAttendance = (): AttendanceRecord[] => {
  const todayStr = getTodayDateString();
  return [
    {
      attendance_id: 1,
      student_id: 3, // Kumar
      bus_number: 'BUS-02',
      attendance_date: todayStr,
      boarding_time: '07:45:12',
      dropping_time: '08:32:45',
      status: 'COMPLETED',
      register_no: '24AD003',
      name: 'Kumar',
      department: 'ECE',
      year: 2,
      nfc_id: 'NFC003',
      pickup_at: 'Fairlands',
      drop_at: 'Annapoorana Engineering College',
    },
  ];
};

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

class DatabaseService {
  private students: Student[] = [];
  private attendance: AttendanceRecord[] = [];
  private buses: BusRoute[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (storedStudents) {
        this.students = JSON.parse(storedStudents);
      } else {
        this.students = [...INITIAL_STUDENTS];
        this.saveStudents();
      }

      const storedAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (storedAttendance) {
        this.attendance = JSON.parse(storedAttendance);
      } else {
        this.attendance = getInitialAttendance();
        this.saveAttendance();
      }

      const storedBuses = localStorage.getItem(STORAGE_KEYS.BUSES);
      if (storedBuses) {
        this.buses = JSON.parse(storedBuses);
      } else {
        this.buses = [...INITIAL_BUSES];
        this.saveBuses();
      }
    } catch {
      this.students = [...INITIAL_STUDENTS];
      this.attendance = getInitialAttendance();
      this.buses = [...INITIAL_BUSES];
    }
  }

  private saveStudents() {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
    } catch {
      // ignore
    }
  }

  private saveAttendance() {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(this.attendance));
    } catch {
      // ignore
    }
  }

  private saveBuses() {
    try {
      localStorage.setItem(STORAGE_KEYS.BUSES, JSON.stringify(this.buses));
    } catch {
      // ignore
    }
  }

  public resetDatabase() {
    this.students = [...INITIAL_STUDENTS];
    this.attendance = getInitialAttendance();
    this.buses = [...INITIAL_BUSES];
    this.saveStudents();
    this.saveAttendance();
    this.saveBuses();
  }

  // -----------------------------------
  // STUDENTS METHODS
  // -----------------------------------
  public getStudents(): Student[] {
    return [...this.students];
  }

  public getStudentById(student_id: number): Student | undefined {
    return this.students.find((s) => s.student_id === student_id);
  }

  public getStudentByNfc(nfc_id: string): Student | undefined {
    const cleanId = nfc_id.trim().toUpperCase();
    return this.students.find((s) => s.nfc_id.toUpperCase() === cleanId);
  }

  public addStudent(newStudent: Omit<Student, 'student_id'>): { success: boolean; error?: string; student?: Student } {
    // Validate uniqueness
    const regExists = this.students.some(
      (s) => s.register_no.toUpperCase() === newStudent.register_no.trim().toUpperCase()
    );
    if (regExists) {
      return { success: false, error: `Register No ${newStudent.register_no} already exists.` };
    }

    const nfcExists = this.students.some(
      (s) => s.nfc_id.toUpperCase() === newStudent.nfc_id.trim().toUpperCase()
    );
    if (nfcExists) {
      return { success: false, error: `NFC ID ${newStudent.nfc_id} is already assigned to another student.` };
    }

    const nextId = this.students.length > 0 ? Math.max(...this.students.map((s) => s.student_id)) + 1 : 1;
    const student: Student = {
      ...newStudent,
      student_id: nextId,
      register_no: newStudent.register_no.trim().toUpperCase(),
      nfc_id: newStudent.nfc_id.trim().toUpperCase(),
    };

    this.students.push(student);
    this.saveStudents();
    return { success: true, student };
  }

  public updateStudent(updatedStudent: Student): { success: boolean; error?: string } {
    const index = this.students.findIndex((s) => s.student_id === updatedStudent.student_id);
    if (index === -1) {
      return { success: false, error: 'Student not found.' };
    }

    // Check duplicate register_no or nfc_id with other students
    const duplicateReg = this.students.some(
      (s) => s.student_id !== updatedStudent.student_id && s.register_no.toUpperCase() === updatedStudent.register_no.trim().toUpperCase()
    );
    if (duplicateReg) {
      return { success: false, error: 'Register No already used by another student.' };
    }

    const duplicateNfc = this.students.some(
      (s) => s.student_id !== updatedStudent.student_id && s.nfc_id.toUpperCase() === updatedStudent.nfc_id.trim().toUpperCase()
    );
    if (duplicateNfc) {
      return { success: false, error: 'NFC ID already used by another student.' };
    }

    this.students[index] = {
      ...updatedStudent,
      register_no: updatedStudent.register_no.trim().toUpperCase(),
      nfc_id: updatedStudent.nfc_id.trim().toUpperCase(),
    };
    this.saveStudents();
    return { success: true };
  }

  public deleteStudent(student_id: number): boolean {
    const initialLen = this.students.length;
    this.students = this.students.filter((s) => s.student_id !== student_id);
    if (this.students.length !== initialLen) {
      this.saveStudents();
      return true;
    }
    return false;
  }

  // -----------------------------------
  // NFC SCAN (EXACT PYTHON FLASK LOGIC)
  // -----------------------------------
  public scanNfc(rawNfcId: string, customBusNumber?: string): ScanResult {
    const nfc_id = rawNfcId ? rawNfcId.trim() : '';

    // 1. Find student using NFC ID
    const student = this.getStudentByNfc(nfc_id);

    // NFC not registered
    if (!student) {
      return {
        success: false,
        title: 'NFC Card Not Registered',
        message: 'This NFC card is not registered.',
      };
    }

    const today = getTodayDateString();
    const currentTime = getCurrentTimeString();
    const busNumberToUse = customBusNumber || student.bus_number;

    // 2. Check today's attendance for student
    const existingIndex = this.attendance.findIndex(
      (a) => a.student_id === student.student_id && a.attendance_date === today
    );

    // FIRST SCAN - BOARDING
    if (existingIndex === -1) {
      const nextAttendanceId =
        this.attendance.length > 0 ? Math.max(...this.attendance.map((a) => a.attendance_id)) + 1 : 1;

      const newRecord: AttendanceRecord = {
        attendance_id: nextAttendanceId,
        student_id: student.student_id,
        bus_number: busNumberToUse,
        attendance_date: today,
        boarding_time: currentTime,
        dropping_time: null,
        status: 'BOARDED',
        register_no: student.register_no,
        name: student.name,
        department: student.department,
        year: student.year,
        nfc_id: student.nfc_id,
        pickup_at: student.pickup_at,
        drop_at: student.drop_at,
      };

      this.attendance.unshift(newRecord);
      this.saveAttendance();

      return {
        success: true,
        title: 'NFC Scan Successful',
        message: 'Student boarding recorded successfully.',
        student,
        scan_type: 'boarding',
        scan_time: currentTime,
        attendanceRecord: newRecord,
      };
    }

    const existingRecord = this.attendance[existingIndex];

    // SECOND SCAN - DROPPING
    if (!existingRecord.dropping_time) {
      const updatedRecord: AttendanceRecord = {
        ...existingRecord,
        dropping_time: currentTime,
        status: 'COMPLETED',
      };

      this.attendance[existingIndex] = updatedRecord;
      this.saveAttendance();

      return {
        success: true,
        title: 'NFC Scan Successful',
        message: 'Student dropping recorded successfully.',
        student,
        scan_type: 'dropping',
        scan_time: currentTime,
        attendanceRecord: updatedRecord,
      };
    }

    // THIRD SCAN - ALREADY COMPLETED
    return {
      success: true,
      title: 'NFC Scan Successful',
      message: 'Attendance already completed for today.',
      student,
      scan_type: 'completed',
      scan_time: currentTime,
      attendanceRecord: existingRecord,
    };
  }

  // -----------------------------------
  // ATTENDANCE METHODS
  // -----------------------------------
  public getAttendanceRecords(filters?: {
    date?: string;
    bus?: string;
    status?: string;
    search?: string;
  }): AttendanceRecord[] {
    let result = [...this.attendance];

    // Always keep latest records sorted by date DESC, boarding_time DESC
    result.sort((a, b) => {
      if (a.attendance_date !== b.attendance_date) {
        return b.attendance_date.localeCompare(a.attendance_date);
      }
      return (b.boarding_time || '').localeCompare(a.boarding_time || '');
    });

    if (filters?.date) {
      result = result.filter((r) => r.attendance_date === filters.date);
    }

    if (filters?.bus && filters.bus !== 'ALL') {
      result = result.filter((r) => r.bus_number === filters.bus);
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((r) => r.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.register_no.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.nfc_id.toLowerCase().includes(q) ||
          r.bus_number.toLowerCase().includes(q)
      );
    }

    return result;
  }

  public getTodaySummary(): { total_present: number; boarded_count: number; completed_count: number } {
    const today = getTodayDateString();
    const todayRecords = this.attendance.filter((r) => r.attendance_date === today);

    const boarded_count = todayRecords.filter((r) => r.status === 'BOARDED').length;
    const completed_count = todayRecords.filter((r) => r.status === 'COMPLETED').length;
    const total_present = boarded_count + completed_count;

    return {
      total_present,
      boarded_count,
      completed_count,
    };
  }

  public deleteAttendanceRecord(attendance_id: number): boolean {
    const prevLen = this.attendance.length;
    this.attendance = this.attendance.filter((a) => a.attendance_id !== attendance_id);
    if (this.attendance.length !== prevLen) {
      this.saveAttendance();
      return true;
    }
    return false;
  }

  // -----------------------------------
  // BUS ROUTES CRUD METHODS
  // -----------------------------------
  public getBusRoutes(): BusRoute[] {
    return [...this.buses];
  }

  public getBusRoute(busNumber: string): BusRoute | undefined {
    return this.buses.find((b) => b.busNumber.toUpperCase() === busNumber.trim().toUpperCase());
  }

  public getAllBusNumbers(): string[] {
    const fromRoutes = this.buses.map((b) => b.busNumber);
    const fromStudents = this.students.map((s) => s.bus_number);
    return Array.from(new Set([...fromRoutes, ...fromStudents])).sort();
  }

  public addBusRoute(route: BusRoute): { success: boolean; error?: string } {
    const cleanBusNum = route.busNumber.trim().toUpperCase();
    if (!cleanBusNum) {
      return { success: false, error: 'Bus Number cannot be empty.' };
    }

    const exists = this.buses.some((b) => b.busNumber.toUpperCase() === cleanBusNum);
    if (exists) {
      return { success: false, error: `Bus number ${cleanBusNum} already exists.` };
    }

    const newRoute: BusRoute = {
      ...route,
      busNumber: cleanBusNum,
      routeName: route.routeName.trim() || `Route ${cleanBusNum}`,
      driverName: route.driverName.trim() || 'Assigned Driver',
      capacity: Number(route.capacity) || 40,
      stops: route.stops && route.stops.length > 0 ? route.stops : ['Salem Stand', 'Annapoorana Engineering College'],
    };

    this.buses.push(newRoute);
    this.saveBuses();
    return { success: true };
  }

  public updateBusRoute(originalBusNumber: string, updated: BusRoute): { success: boolean; error?: string } {
    const cleanOriginal = originalBusNumber.trim().toUpperCase();
    const cleanNew = updated.busNumber.trim().toUpperCase();

    const index = this.buses.findIndex((b) => b.busNumber.toUpperCase() === cleanOriginal);
    if (index === -1) {
      return { success: false, error: `Bus ${originalBusNumber} not found.` };
    }

    // Check duplicate if bus number changed
    if (cleanOriginal !== cleanNew) {
      const exists = this.buses.some((b) => b.busNumber.toUpperCase() === cleanNew);
      if (exists) {
        return { success: false, error: `Bus number ${cleanNew} already exists.` };
      }

      // Update student assignments who were on this bus
      this.students = this.students.map((s) => {
        if (s.bus_number.toUpperCase() === cleanOriginal) {
          return { ...s, bus_number: cleanNew };
        }
        return s;
      });
      this.saveStudents();

      // Update today's attendance logs with the updated bus number
      this.attendance = this.attendance.map((a) => {
        if (a.bus_number.toUpperCase() === cleanOriginal) {
          return { ...a, bus_number: cleanNew };
        }
        return a;
      });
      this.saveAttendance();
    }

    this.buses[index] = {
      ...updated,
      busNumber: cleanNew,
      routeName: updated.routeName.trim() || `Route ${cleanNew}`,
      driverName: updated.driverName.trim() || 'Assigned Driver',
      capacity: Number(updated.capacity) || 40,
      stops: updated.stops && updated.stops.length > 0 ? updated.stops : ['Pickup Stop', 'Annapoorana Engineering College'],
    };

    this.saveBuses();
    return { success: true };
  }

  public deleteBusRoute(busNumber: string): { success: boolean; error?: string } {
    const cleanBusNum = busNumber.trim().toUpperCase();
    const assignedCount = this.students.filter((s) => s.bus_number.toUpperCase() === cleanBusNum).length;
    if (assignedCount > 0) {
      return {
        success: false,
        error: `Cannot delete ${cleanBusNum}: ${assignedCount} student(s) are currently assigned to this bus. Reassign them first.`,
      };
    }

    const prevLen = this.buses.length;
    this.buses = this.buses.filter((b) => b.busNumber.toUpperCase() !== cleanBusNum);
    if (this.buses.length !== prevLen) {
      this.saveBuses();
      return { success: true };
    }
    return { success: false, error: 'Bus not found.' };
  }

  public getBusFleetStats() {
    const busList = this.getAllBusNumbers();
    const today = getTodayDateString();

    return busList.map((busNum) => {
      const routeInfo = this.getBusRoute(busNum) || {
        busNumber: busNum,
        routeName: `${busNum} Campus Route`,
        driverName: 'Assigned Driver',
        capacity: 40,
        stops: ['Pickup Points', 'Annapoorana Engineering College'],
      };

      const assignedStudents = this.students.filter((s) => s.bus_number.toUpperCase() === busNum.toUpperCase());
      const todayLogs = this.attendance.filter(
        (a) => a.bus_number.toUpperCase() === busNum.toUpperCase() && a.attendance_date === today
      );
      const boarded = todayLogs.filter((a) => a.status === 'BOARDED').length;
      const completed = todayLogs.filter((a) => a.status === 'COMPLETED').length;

      return {
        busNumber: busNum,
        routeInfo,
        totalAssigned: assignedStudents.length,
        boardedToday: boarded,
        completedToday: completed,
        totalPresent: boarded + completed,
        students: assignedStudents,
      };
    });
  }
}

export const db = new DatabaseService();

export interface Student {
  student_id: number;
  register_no: string;
  name: string;
  department: string;
  year: number;
  nfc_id: string;
  bus_number: string;
  pickup_at: string;
  drop_at: string;
}

export type AttendanceStatus = 'BOARDED' | 'COMPLETED';

export interface AttendanceRecord {
  attendance_id: number;
  student_id: number;
  bus_number: string;
  attendance_date: string; // YYYY-MM-DD
  boarding_time: string | null; // HH:MM:SS
  dropping_time: string | null; // HH:MM:SS
  status: AttendanceStatus;
  
  // Joined student details (matches the SQL JOIN query in Flask)
  register_no: string;
  name: string;
  department: string;
  year: number;
  nfc_id: string;
  pickup_at: string;
  drop_at: string;
}

export interface ScanResult {
  success: boolean;
  title: string;
  message: string;
  student?: Student;
  scan_type?: 'boarding' | 'dropping' | 'completed';
  scan_time?: string;
  attendanceRecord?: AttendanceRecord;
}

export interface BusRoute {
  busNumber: string;
  routeName: string;
  driverName: string;
  capacity: number;
  stops: string[];
}


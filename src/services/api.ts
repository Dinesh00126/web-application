import { Student, AttendanceRecord, ScanResult, BusRoute } from '../types';
import { db } from './db';

class BackendApiService {
  private isServerAvailable: boolean = true;

  async scanNfc(nfc_id: string, bus_number?: string): Promise<ScanResult> {
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nfc_id, bus_number }),
      });
      if (response.ok) {
        const data = await response.json();
        // Also sync local storage
        db.scanNfc(nfc_id, bus_number);
        return data;
      }
    } catch (err) {
      console.warn('Backend API unavailable, using local store', err);
    }
    return db.scanNfc(nfc_id, bus_number);
  }

  async getAttendance(): Promise<{
    records: AttendanceRecord[];
    total_present: number;
    boarded_count: number;
    completed_count: number;
  }> {
    try {
      const response = await fetch('/api/attendance');
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch {
      // fallback
    }
    const records = db.getAttendanceRecords();
    const summary = db.getTodaySummary();
    return {
      records,
      ...summary,
    };
  }

  async getStudents(): Promise<Student[]> {
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.students)) {
          return data.students;
        }
      }
    } catch {
      // fallback
    }
    return db.getStudents();
  }

  async addStudent(newStudent: Omit<Student, 'student_id'>): Promise<{ success: boolean; error?: string; student?: Student }> {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
      const data = await response.json();
      db.addStudent(newStudent);
      return data;
    } catch {
      return db.addStudent(newStudent);
    }
  }

  async updateStudent(student: Student): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/students/${student.student_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });
      const data = await response.json();
      db.updateStudent(student);
      return data;
    } catch {
      return db.updateStudent(student);
    }
  }

  async deleteStudent(studentId: number): Promise<boolean> {
    try {
      await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    return db.deleteStudent(studentId);
  }

  async deleteAttendanceRecord(attendanceId: number): Promise<boolean> {
    try {
      await fetch(`/api/attendance/${attendanceId}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    return db.deleteAttendanceRecord(attendanceId);
  }

  async getBuses(): Promise<BusRoute[]> {
    try {
      const res = await fetch('/api/buses');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.buses)) {
          return data.buses;
        }
      }
    } catch {
      // fallback
    }
    return db.getBusRoutes();
  }

  async addBus(route: BusRoute): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(route),
      });
      const data = await res.json();
      db.addBusRoute(route);
      return data;
    } catch {
      return db.addBusRoute(route);
    }
  }

  async updateBus(originalBusNo: string, route: BusRoute): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/buses/${originalBusNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(route),
      });
      const data = await res.json();
      db.updateBusRoute(originalBusNo, route);
      return data;
    } catch {
      return db.updateBusRoute(originalBusNo, route);
    }
  }

  async deleteBus(busNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/buses/${busNumber}`, { method: 'DELETE' });
      const data = await res.json();
      db.deleteBusRoute(busNumber);
      return data;
    } catch {
      return db.deleteBusRoute(busNumber);
    }
  }

  async resetDatabase(): Promise<void> {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch {
      // ignore
    }
    db.resetDatabase();
  }

  async getPythonBackendCode(): Promise<string> {
    try {
      const res = await fetch('/api/python-code');
      if (res.ok) {
        const data = await res.json();
        return data.pythonCode || '';
      }
    } catch {
      // ignore
    }
    return '';
  }
}

export const api = new BackendApiService();

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data file for persistent backend storage
const DB_FILE = path.join(__dirname, 'college_db_data.json');

interface Student {
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

interface AttendanceRecord {
  attendance_id: number;
  student_id: number;
  bus_number: string;
  attendance_date: string;
  boarding_time: string | null;
  dropping_time: string | null;
  status: 'BOARDED' | 'COMPLETED';
  register_no: string;
  name: string;
  department: string;
  year: number;
  nfc_id: string;
  pickup_at: string;
  drop_at: string;
}

interface BusRoute {
  busNumber: string;
  routeName: string;
  driverName: string;
  capacity: number;
  stops: string[];
}

interface DbStore {
  students: Student[];
  attendance: AttendanceRecord[];
  buses: BusRoute[];
}

const DEFAULT_STORE: DbStore = {
  students: [
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
  ],
  attendance: [
    {
      attendance_id: 1,
      student_id: 3,
      bus_number: 'BUS-02',
      attendance_date: new Date().toISOString().slice(0, 10),
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
  ],
  buses: [
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
  ],
};

function readDb(): DbStore {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB_FILE', err);
  }
  writeDb(DEFAULT_STORE);
  return DEFAULT_STORE;
}

function writeDb(store: DbStore) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB_FILE', err);
  }
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// ----------------------------------------------------
// BACKEND API ROUTES (Direct translation of Python Flask)
// ----------------------------------------------------

// NFC SCAN: Exact replica of Python @app.route("/scan", methods=["POST"])
app.post(['/api/scan', '/scan'], (req: Request, res: Response) => {
  const nfc_id = (req.body.nfc_id || '').trim();
  const customBus = req.body.bus_number;

  const db = readDb();

  // Find student using NFC ID
  const student = db.students.find(
    (s) => s.nfc_id.toUpperCase() === nfc_id.toUpperCase()
  );

  // NFC not registered
  if (!student) {
    return res.status(200).json({
      success: false,
      title: 'NFC Card Not Registered',
      message: 'This NFC card is not registered.',
    });
  }

  const today = getTodayString();
  const currentTime = getCurrentTimeString();
  const busNumber = customBus || student.bus_number;

  // Check today's attendance
  const attendanceIndex = db.attendance.findIndex(
    (a) => a.student_id === student.student_id && a.attendance_date === today
  );

  // 1. FIRST SCAN - BOARDING
  if (attendanceIndex === -1) {
    const nextId =
      db.attendance.length > 0
        ? Math.max(...db.attendance.map((a) => a.attendance_id)) + 1
        : 1;

    const newRecord: AttendanceRecord = {
      attendance_id: nextId,
      student_id: student.student_id,
      bus_number: busNumber,
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

    db.attendance.unshift(newRecord);
    writeDb(db);

    return res.json({
      success: true,
      title: 'NFC Scan Successful',
      message: 'Student boarding recorded successfully.',
      student,
      scan_type: 'boarding',
      scan_time: currentTime,
      attendanceRecord: newRecord,
    });
  }

  const attendance = db.attendance[attendanceIndex];

  // 2. SECOND SCAN - DROPPING
  if (!attendance.dropping_time) {
    attendance.dropping_time = currentTime;
    attendance.status = 'COMPLETED';
    writeDb(db);

    return res.json({
      success: true,
      title: 'NFC Scan Successful',
      message: 'Student dropping recorded successfully.',
      student,
      scan_type: 'dropping',
      scan_time: currentTime,
      attendanceRecord: attendance,
    });
  }

  // 3. THIRD SCAN - ALREADY COMPLETED
  return res.json({
    success: true,
    title: 'NFC Scan Successful',
    message: 'Attendance already completed for today.',
    student,
    scan_type: 'completed',
    scan_time: currentTime,
    attendanceRecord: attendance,
  });
});

// ATTENDANCE PAGE & API: Exact replica of Python @app.route("/attendance")
app.get(['/api/attendance', '/attendance'], (req: Request, res: Response) => {
  const db = readDb();
  const today = getTodayString();

  const total_present = db.attendance.filter(
    (a) => a.attendance_date === today && (a.status === 'BOARDED' || a.status === 'COMPLETED')
  ).length;

  const boarded_count = db.attendance.filter(
    (a) => a.attendance_date === today && a.status === 'BOARDED'
  ).length;

  const completed_count = db.attendance.filter(
    (a) => a.attendance_date === today && a.status === 'COMPLETED'
  ).length;

  res.json({
    records: db.attendance,
    total_present,
    boarded_count,
    completed_count,
  });
});

// STUDENTS PAGE & API: Exact replica of Python @app.route("/students")
app.get(['/api/students', '/students'], (_req: Request, res: Response) => {
  const db = readDb();
  res.json({
    students: db.students,
  });
});

// ADD STUDENT
app.post('/api/students', (req: Request, res: Response) => {
  const db = readDb();
  const { register_no, name, department, year, nfc_id, bus_number, pickup_at, drop_at } = req.body;

  if (!register_no || !name || !nfc_id) {
    return res.status(400).json({ success: false, error: 'Register No, Name, and NFC ID are required.' });
  }

  const regExists = db.students.some(
    (s) => s.register_no.toUpperCase() === register_no.trim().toUpperCase()
  );
  if (regExists) {
    return res.status(400).json({ success: false, error: `Register No ${register_no} already exists.` });
  }

  const nfcExists = db.students.some(
    (s) => s.nfc_id.toUpperCase() === nfc_id.trim().toUpperCase()
  );
  if (nfcExists) {
    return res.status(400).json({ success: false, error: `NFC ID ${nfc_id} is already assigned.` });
  }

  const nextId = db.students.length > 0 ? Math.max(...db.students.map((s) => s.student_id)) + 1 : 1;
  const newStudent: Student = {
    student_id: nextId,
    register_no: register_no.trim().toUpperCase(),
    name: name.trim(),
    department: department || 'AI&DS',
    year: Number(year) || 2,
    nfc_id: nfc_id.trim().toUpperCase(),
    bus_number: bus_number || 'BUS-01',
    pickup_at: pickup_at || '',
    drop_at: drop_at || 'Annapoorana Engineering College',
  };

  db.students.push(newStudent);
  writeDb(db);
  res.json({ success: true, student: newStudent });
});

// UPDATE STUDENT
app.put('/api/students/:id', (req: Request, res: Response) => {
  const db = readDb();
  const id = Number(req.params.id);
  const student = db.students.find((s) => s.student_id === id);
  if (!student) {
    return res.status(404).json({ success: false, error: 'Student not found.' });
  }

  Object.assign(student, req.body);
  writeDb(db);
  res.json({ success: true, student });
});

// DELETE STUDENT
app.delete('/api/students/:id', (req: Request, res: Response) => {
  const db = readDb();
  const id = Number(req.params.id);
  db.students = db.students.filter((s) => s.student_id !== id);
  writeDb(db);
  res.json({ success: true });
});

// DELETE ATTENDANCE RECORD
app.delete('/api/attendance/:id', (req: Request, res: Response) => {
  const db = readDb();
  const id = Number(req.params.id);
  db.attendance = db.attendance.filter((a) => a.attendance_id !== id);
  writeDb(db);
  res.json({ success: true });
});

// BUS FLEET & ROUTES API
app.get('/api/buses', (_req: Request, res: Response) => {
  const db = readDb();
  res.json({ buses: db.buses });
});

app.post('/api/buses', (req: Request, res: Response) => {
  const db = readDb();
  const { busNumber, routeName, driverName, capacity, stops } = req.body;
  if (!busNumber) {
    return res.status(400).json({ success: false, error: 'Bus Number required.' });
  }

  const exists = db.buses.some((b) => b.busNumber.toUpperCase() === busNumber.trim().toUpperCase());
  if (exists) {
    return res.status(400).json({ success: false, error: `Bus ${busNumber} already exists.` });
  }

  const newRoute: BusRoute = {
    busNumber: busNumber.trim().toUpperCase(),
    routeName: routeName || `${busNumber} Route`,
    driverName: driverName || 'Assigned Driver',
    capacity: Number(capacity) || 40,
    stops: stops || ['Salem Stand', 'Annapoorana Engineering College'],
  };

  db.buses.push(newRoute);
  writeDb(db);
  res.json({ success: true, bus: newRoute });
});

app.put('/api/buses/:busNumber', (req: Request, res: Response) => {
  const db = readDb();
  const targetBusNo = req.params.busNumber.toUpperCase();
  const index = db.buses.findIndex((b) => b.busNumber.toUpperCase() === targetBusNo);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Bus not found.' });
  }

  const updated: BusRoute = {
    ...db.buses[index],
    ...req.body,
    busNumber: req.body.busNumber ? req.body.busNumber.toUpperCase() : targetBusNo,
  };

  db.buses[index] = updated;
  writeDb(db);
  res.json({ success: true, bus: updated });
});

app.delete('/api/buses/:busNumber', (req: Request, res: Response) => {
  const db = readDb();
  const targetBusNo = req.params.busNumber.toUpperCase();
  db.buses = db.buses.filter((b) => b.busNumber.toUpperCase() !== targetBusNo);
  writeDb(db);
  res.json({ success: true });
});

// RESET DB
app.post('/api/reset', (_req: Request, res: Response) => {
  writeDb(DEFAULT_STORE);
  res.json({ success: true, message: 'Database reset to default seed.' });
});

// PYTHON CODE & FLASK INSTRUCTIONS ENDPOINT
app.get('/api/python-code', (_req: Request, res: Response) => {
  const pythonPath = path.join(__dirname, 'app.py');
  let pythonCode = '';
  if (fs.existsSync(pythonPath)) {
    pythonCode = fs.readFileSync(pythonPath, 'utf-8');
  }
  res.json({
    pythonCode,
    status: 'online',
    framework: 'Python Flask / Express Hybrid',
  });
});

// ----------------------------------------------------
// VITE SPA MIDDLEWARE / PRODUCTION STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

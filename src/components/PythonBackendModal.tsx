import React, { useState } from 'react';
import { Terminal, Copy, Check, Download, FileCode, Database, Server, X, ExternalLink, Play } from 'lucide-react';

interface PythonBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonBackendModal: React.FC<PythonBackendModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'python' | 'sql' | 'guide'>('python');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonCode = `# ==============================================================================
# Annapoorana Engineering College - Bus NFC Attendance System
# Backend: Python Flask + MySQL Connector
# ==============================================================================

from flask import Flask, request, jsonify, render_template
import mysql.connector
from datetime import date, datetime
import os

app = Flask(__name__)

# -----------------------------------
# DATABASE CONNECTION
# -----------------------------------
def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get("MYSQL_HOST", "localhost"),
        user=os.environ.get("MYSQL_USER", "root"),
        password=os.environ.get("MYSQL_PASSWORD", "YOUR_MYSQL_PASSWORD"),
        database=os.environ.get("MYSQL_DATABASE", "college_db")
    )


# -----------------------------------
# HOME PAGE
# -----------------------------------
@app.route("/")
def home():
    return render_template("index.html")


# -----------------------------------
# NFC SCAN ROUTE (CORE ATTENDANCE LOGIC)
# -----------------------------------
@app.route("/scan", methods=["POST"])
@app.route("/api/scan", methods=["POST"])
def scan_nfc():
    if request.is_json:
        nfc_id = request.json.get("nfc_id", "").strip()
        custom_bus = request.json.get("bus_number")
    else:
        nfc_id = request.form.get("nfc_id", "").strip()
        custom_bus = request.form.get("bus_number")

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # 1. Find student using NFC ID
    cursor.execute(
        "SELECT * FROM students WHERE UPPER(nfc_id) = UPPER(%s)",
        (nfc_id,)
    )
    student = cursor.fetchone()

    # NFC not registered
    if student is None:
        cursor.close()
        db.close()
        res = {
            "success": False,
            "title": "NFC Card Not Registered",
            "message": "This NFC card is not registered."
        }
        return jsonify(res) if request.is_json else render_template("result.html", **res)

    today = date.today()
    bus_number = custom_bus if custom_bus else student["bus_number"]

    # 2. Check today's attendance
    cursor.execute(
        """
        SELECT * FROM bus_attendance
        WHERE student_id = %s AND attendance_date = %s
        """,
        (student["student_id"], today)
    )
    attendance = cursor.fetchone()
    current_time = datetime.now().time()

    # FIRST SCAN - BOARDING
    if attendance is None:
        cursor.execute(
            """
            INSERT INTO bus_attendance
            (student_id, bus_number, attendance_date, boarding_time, dropping_time, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (student["student_id"], bus_number, today, current_time, None, "BOARDED")
        )
        db.commit()
        message = "Student boarding recorded successfully."
        result_type = "boarding"

    # SECOND SCAN - DROPPING
    elif attendance["dropping_time"] is None:
        cursor.execute(
            """
            UPDATE bus_attendance
            SET dropping_time = %s, status = %s
            WHERE attendance_id = %s
            """,
            (current_time, "COMPLETED", attendance["attendance_id"])
        )
        db.commit()
        message = "Student dropping recorded successfully."
        result_type = "dropping"

    # THIRD SCAN - VERIFICATION
    else:
        message = "Attendance already completed for today."
        result_type = "completed"

    cursor.close()
    db.close()

    result = {
        "success": True,
        "title": "NFC Scan Successful",
        "message": message,
        "student": student,
        "scan_type": result_type,
        "scan_time": str(current_time)
    }

    if request.is_json or request.path.startswith("/api/"):
        return jsonify(result), 200

    return render_template("result.html", **result)


# -----------------------------------
# ATTENDANCE PAGE & API
# -----------------------------------
@app.route("/attendance")
@app.route("/api/attendance")
def attendance():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            a.attendance_id, s.register_no, s.name, s.department, s.year,
            s.nfc_id, a.bus_number, a.attendance_date, s.pickup_at, s.drop_at,
            a.boarding_time, a.dropping_time, a.status
        FROM bus_attendance a
        JOIN students s ON a.student_id = s.student_id
        ORDER BY a.attendance_date DESC, a.boarding_time DESC
        """
    )
    records = cursor.fetchall()

    cursor.execute(
        """
        SELECT COUNT(*) AS total_present
        FROM bus_attendance
        WHERE attendance_date = %s AND status IN ('BOARDED', 'COMPLETED')
        """,
        (date.today(),)
    )
    summary = cursor.fetchone()

    cursor.close()
    db.close()

    if request.is_json or request.path.startswith("/api/"):
        return jsonify({
            "records": records,
            "total_present": summary["total_present"] if summary else 0
        })

    return render_template("attendance.html", records=records, total_present=summary["total_present"])


# -----------------------------------
# STUDENTS PAGE & API
# -----------------------------------
@app.route("/students")
@app.route("/api/students")
def students():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM students ORDER BY student_id")
    student_list = cursor.fetchall()
    cursor.close()
    db.close()

    if request.is_json or request.path.startswith("/api/"):
        return jsonify({"students": student_list})

    return render_template("students.html", students=student_list)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)`;

  const sqlCode = `-- MySQL Database Script
CREATE DATABASE IF NOT EXISTS college_db;
USE college_db;

DROP TABLE IF EXISTS bus_attendance;
DROP TABLE IF EXISTS students;

CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    register_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    nfc_id VARCHAR(50) UNIQUE NOT NULL,
    bus_number VARCHAR(20) NOT NULL,
    pickup_at VARCHAR(100),
    drop_at VARCHAR(100)
);

INSERT INTO students (register_no, name, department, year, nfc_id, bus_number, pickup_at, drop_at)
VALUES
('24AD001', 'Dinesh', 'AI&DS', 2, 'NFC001', 'BUS-01', 'Salem New Bus Stand', 'Annapoorana Engineering College'),
('24AD002', 'Arun', 'CSE', 2, 'NFC002', 'BUS-01', 'Hasthampatti', 'Annapoorana Engineering College'),
('24AD003', 'Kumar', 'ECE', 2, 'NFC003', 'BUS-02', 'Fairlands', 'Annapoorana Engineering College'),
('24AD004', 'Ravi', 'AI&DS', 2, 'NFC004', 'BUS-01', 'Ammapet', 'Annapoorana Engineering College');

CREATE TABLE bus_attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    bus_number VARCHAR(20) NOT NULL,
    attendance_date DATE NOT NULL,
    boarding_time TIME,
    dropping_time TIME,
    status VARCHAR(20),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);`;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-blue-600 text-white flex items-center justify-center shadow-sm">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Python Flask Backend & Database
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Active Full-Stack API
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Full Python Flask program with MySQL schema ready for local or server execution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-slate-100 py-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'python'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>app.py (Flask)</span>
            </button>

            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'sql'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>college_db.sql</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'guide'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Run Instructions</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                handleCopy(activeTab === 'python' ? pythonCode : activeTab === 'sql' ? sqlCode : '')
              }
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() =>
                handleDownload(
                  activeTab === 'python' ? 'app.py' : 'college_db.sql',
                  activeTab === 'python' ? pythonCode : sqlCode
                )
              }
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto py-3">
          {activeTab === 'python' && (
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{pythonCode}</code>
            </pre>
          )}

          {activeTab === 'sql' && (
            <pre className="bg-slate-900 text-emerald-300 p-4 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{sqlCode}</code>
            </pre>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-blue-600" />
                  How to Run the Python Flask Backend on Your Computer:
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 text-xs mt-2">
                  <li>Install Python 3 and MySQL server on your machine.</li>
                  <li>Import the database schema: <code className="bg-white px-1 py-0.5 rounded border border-blue-200 font-mono">mysql -u root -p &lt; college_db.sql</code></li>
                  <li>Install required Python packages:
                    <pre className="bg-slate-900 text-emerald-300 p-2 rounded-lg font-mono text-xs mt-1">pip install flask mysql-connector-python</pre>
                  </li>
                  <li>Start the Python backend server:
                    <pre className="bg-slate-900 text-emerald-300 p-2 rounded-lg font-mono text-xs mt-1">python app.py</pre>
                  </li>
                  <li>Your Python backend will be running at <strong>http://localhost:5000</strong> with all NFC routes enabled!</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-2">Backend REST API Endpoints:</h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-bold">POST</span>
                    <span className="text-slate-800">/api/scan</span>
                    <span className="text-slate-500">- Boarding & Dropping logic with NFC ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">GET</span>
                    <span className="text-slate-800">/api/attendance</span>
                    <span className="text-slate-500">- Attendance history & today's counts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">GET</span>
                    <span className="text-slate-800">/api/students</span>
                    <span className="text-slate-500">- List of registered students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white px-2 py-0.5 rounded font-bold">POST</span>
                    <span className="text-slate-800">/api/students</span>
                    <span className="text-slate-500">- Register new student with NFC ID</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

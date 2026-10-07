# ==============================================================================
# Annapoorana Engineering College - Bus NFC Attendance System
# Backend: Python Flask + MySQL Connector
# ==============================================================================

from flask import Flask, request, jsonify, render_template
import mysql.connector
from datetime import date, datetime
import os

app = Flask(__name__)

# -----------------------------------
# DATABASE CONFIGURATION
# -----------------------------------
DB_CONFIG = {
    "host": os.environ.get("MYSQL_HOST", "localhost"),
    "user": os.environ.get("MYSQL_USER", "root"),
    "password": os.environ.get("MYSQL_PASSWORD", "YOUR_MYSQL_PASSWORD"),
    "database": os.environ.get("MYSQL_DATABASE", "college_db"),
}

def get_db_connection():
    """Create and return a connection to MySQL database."""
    return mysql.connector.connect(**DB_CONFIG)


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
    # Support both Form submit and JSON API payload
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
        """
        SELECT *
        FROM students
        WHERE UPPER(nfc_id) = UPPER(%s)
        """,
        (nfc_id,)
    )
    student = cursor.fetchone()

    # NFC not registered
    if student is None:
        cursor.close()
        db.close()
        response_data = {
            "success": False,
            "title": "NFC Card Not Registered",
            "message": "This NFC card is not registered."
        }
        if request.is_json or request.path.startswith("/api/"):
            return jsonify(response_data), 200
        return render_template("result.html", **response_data)

    today = date.today()
    bus_number_to_record = custom_bus if custom_bus else student["bus_number"]

    # 2. Check today's attendance for student
    cursor.execute(
        """
        SELECT *
        FROM bus_attendance
        WHERE student_id = %s
        AND attendance_date = %s
        """,
        (student["student_id"], today)
    )
    attendance = cursor.fetchone()
    current_time = datetime.now().time()

    # -----------------------------------
    # FIRST SCAN - BOARDING
    # -----------------------------------
    if attendance is None:
        cursor.execute(
            """
            INSERT INTO bus_attendance
            (
                student_id,
                bus_number,
                attendance_date,
                boarding_time,
                dropping_time,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                student["student_id"],
                bus_number_to_record,
                today,
                current_time,
                None,
                "BOARDED"
            )
        )
        db.commit()
        message = "Student boarding recorded successfully."
        result_type = "boarding"

    # -----------------------------------
    # SECOND SCAN - DROPPING
    # -----------------------------------
    elif attendance["dropping_time"] is None:
        cursor.execute(
            """
            UPDATE bus_attendance
            SET dropping_time = %s,
                status = %s
            WHERE attendance_id = %s
            """,
            (
                current_time,
                "COMPLETED",
                attendance["attendance_id"]
            )
        )
        db.commit()
        message = "Student dropping recorded successfully."
        result_type = "dropping"

    # -----------------------------------
    # THIRD SCAN - VERIFICATION
    # -----------------------------------
    else:
        message = "Attendance already completed for today."
        result_type = "completed"

    cursor.close()
    db.close()

    result_payload = {
        "success": True,
        "title": "NFC Scan Successful",
        "message": message,
        "student": student,
        "scan_type": result_type,
        "scan_time": str(current_time)
    }

    if request.is_json or request.path.startswith("/api/"):
        return jsonify(result_payload), 200

    return render_template(
        "result.html",
        **result_payload
    )


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
            a.attendance_id,
            s.register_no,
            s.name,
            s.department,
            s.year,
            s.nfc_id,
            a.bus_number,
            a.attendance_date,
            s.pickup_at,
            s.drop_at,
            a.boarding_time,
            a.dropping_time,
            a.status
        FROM bus_attendance a
        JOIN students s ON a.student_id = s.student_id
        ORDER BY
            a.attendance_date DESC,
            a.boarding_time DESC
        """
    )
    records = cursor.fetchall()

    # Total present students today
    cursor.execute(
        """
        SELECT COUNT(*) AS total_present
        FROM bus_attendance
        WHERE attendance_date = %s
        AND status IN ('BOARDED', 'COMPLETED')
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

    return render_template(
        "attendance.html",
        records=records,
        total_present=summary["total_present"] if summary else 0
    )


# -----------------------------------
# STUDENTS PAGE & API
# -----------------------------------
@app.route("/students")
@app.route("/api/students", methods=["GET"])
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


# -----------------------------------
# REGISTER NEW STUDENT API
# -----------------------------------
@app.route("/api/students", methods=["POST"])
def add_student():
    data = request.json or request.form
    register_no = data.get("register_no", "").strip()
    name = data.get("name", "").strip()
    department = data.get("department", "AI&DS")
    year = int(data.get("year", 2))
    nfc_id = data.get("nfc_id", "").strip()
    bus_number = data.get("bus_number", "BUS-01")
    pickup_at = data.get("pickup_at", "")
    drop_at = data.get("drop_at", "Annapoorana Engineering College")

    db = get_db_connection()
    cursor = db.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO students
            (register_no, name, department, year, nfc_id, bus_number, pickup_at, drop_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (register_no, name, department, year, nfc_id, bus_number, pickup_at, drop_at)
        )
        db.commit()
        new_id = cursor.lastrowid
        cursor.close()
        db.close()
        return jsonify({"success": True, "student_id": new_id}), 201
    except mysql.connector.Error as err:
        cursor.close()
        db.close()
        return jsonify({"success": False, "error": str(err)}), 400


# -----------------------------------
# RUN FLASK APP
# -----------------------------------
if __name__ == "__main__":
    print("🚌 Starting College Bus NFC Attendance System on port 5000...")
    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )

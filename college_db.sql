-- ==============================================================================
-- Annapoorana Engineering College - Bus NFC Database Schema
-- Database: college_db
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS college_db;
USE college_db;

DROP TABLE IF EXISTS bus_attendance;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS buses;

-- 1. Buses Table
CREATE TABLE buses (
    bus_id INT AUTO_INCREMENT PRIMARY KEY,
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    route_name VARCHAR(100) NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    capacity INT DEFAULT 40
);

INSERT INTO buses (bus_number, route_name, driver_name, capacity) VALUES
('BUS-01', 'Salem Central & Ammapet Route', 'Murugan (Driver #04)', 40),
('BUS-02', 'Fairlands & Meyyanur Route', 'Selvam (Driver #07)', 35);

-- 2. Students Table
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

INSERT INTO students (
    register_no,
    name,
    department,
    year,
    nfc_id,
    bus_number,
    pickup_at,
    drop_at
)
VALUES
('24AD001', 'Dinesh', 'AI&DS', 2, 'NFC001', 'BUS-01', 'Salem New Bus Stand', 'Annapoorana Engineering College'),
('24AD002', 'Arun', 'CSE', 2, 'NFC002', 'BUS-01', 'Hasthampatti', 'Annapoorana Engineering College'),
('24AD003', 'Kumar', 'ECE', 2, 'NFC003', 'BUS-02', 'Fairlands', 'Annapoorana Engineering College'),
('24AD004', 'Ravi', 'AI&DS', 2, 'NFC004', 'BUS-01', 'Ammapet', 'Annapoorana Engineering College');

-- 3. Bus Attendance Table
CREATE TABLE bus_attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    bus_number VARCHAR(20) NOT NULL,
    attendance_date DATE NOT NULL,
    boarding_time TIME,
    dropping_time TIME,
    status VARCHAR(20),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Sample initial attendance log
INSERT INTO bus_attendance (student_id, bus_number, attendance_date, boarding_time, dropping_time, status)
VALUES (3, 'BUS-02', CURDATE(), '07:45:12', '08:32:45', 'COMPLETED');

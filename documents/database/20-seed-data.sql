-- 20-seed-data.sql

-- 1. Insert Departments
INSERT INTO "Department" ("id", "name", "code", "status") VALUES
('a1111111-1111-1111-1111-111111111111', 'Computer Science and Engineering', 'CSE', 'ACTIVE'),
('b2222222-2222-2222-2222-222222222222', 'Electronics and Communication Engineering', 'ECE', 'ACTIVE'),
('c3333333-3333-3333-3333-333333333333', 'Mechanical Engineering', 'ME', 'ACTIVE');

-- 2. Insert Admin User (Password is bcrypt of 'password123')
INSERT INTO "User" ("id", "email", "passwordHash", "role", "status") VALUES
('d4444444-4444-4444-4444-444444444444', 'admin@campus.edu', '$2a$10$P2N2D.iEee1oJ.P/J2x4oOc/vW5W95.QG3yS.qJbL8K.m/N05X94K', 'ADMIN', 'ACTIVE');

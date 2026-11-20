import { env } from '../../backend/src/config/env.js';
import pool, { withTransaction } from '../../backend/src/config/db.js';
import { createSupabaseAdmin } from '../../backend/src/config/supabase.js';

const USERS = [
  { email: 'admin@campuscore.test', fullName: 'Amira Hassan', roles: ['admin'] },
  { email: 'k.mostafa@campuscore.test', fullName: 'Dr. Karim Mostafa', roles: ['lecturer'],
    staff: { employeeNumber: 'EMP-1001', department: 'Computer Science', academicTitle: 'Associate Professor' } },
  { email: 'l.nabil@campuscore.test', fullName: 'Dr. Laila Nabil', roles: ['lecturer', 'admin'],
    staff: { employeeNumber: 'EMP-1002', department: 'Computer Science', academicTitle: 'Professor' } },
  { email: 'o.fathy@campuscore.test', fullName: 'Omar Fathy', roles: ['lab_teacher'],
    staff: { employeeNumber: 'EMP-2001', department: 'Computer Science', academicTitle: 'Teaching Assistant' } },
  { email: 'n.adel@campuscore.test', fullName: 'Nour Adel', roles: ['lab_teacher'],
    staff: { employeeNumber: 'EMP-2002', department: 'Computer Science', academicTitle: 'Teaching Assistant' } },
  { email: 'student1@campuscore.test', fullName: 'Youssef Ali', roles: ['student'],
    student: { universityId: '20230001', major: 'Computer Science', academicYear: 3 } },
  { email: 'student2@campuscore.test', fullName: 'Mariam Samir', roles: ['student'],
    student: { universityId: '20230002', major: 'Computer Science', academicYear: 3 } },
  { email: 'student4@campuscore.test', fullName: 'Salma Ibrahim', roles: ['student'],
    student: { universityId: '20230004', major: 'Computer Science', academicYear: 3 } },
  { email: 'student5@campuscore.test', fullName: 'Hassan Mahmoud', roles: ['student'],
    student: { universityId: '20230005', major: 'Computer Engineering', academicYear: 3 } },
  { email: 'student6@campuscore.test', fullName: 'Farida Khaled', roles: ['student'],
    student: { universityId: '20220006', major: 'Computer Science', academicYear: 4 } },
  { email: 'student3@campuscore.test', fullName: 'Ahmed Tarek', roles: ['student'],
    student: { universityId: '20240003', major: 'Information Systems', academicYear: 2 } },
];

const SEMESTERS = [
  { name: 'Spring 2026', startDate: '2026-02-07', endDate: '2026-06-05' },
  { name: 'Fall 2026', startDate: '2026-09-19', endDate: '2027-01-15' },
];

const COURSES = [
  { semester: 'Fall 2026', code: 'CS301', title: 'Information Security',
    description: 'Principles of confidentiality, integrity and availability; cryptography basics; secure software design.',
    lectures: { L1: 'k.mostafa@campuscore.test' },
    labs: { 'Lab A': 'o.fathy@campuscore.test', 'Lab B': 'n.adel@campuscore.test' } },
  { semester: 'Fall 2026', code: 'CS305', title: 'Database Systems',
    description: 'Relational modelling, SQL, normalization, transactions and indexing.',
    lectures: { L1: 'l.nabil@campuscore.test', L2: 'k.mostafa@campuscore.test' },
    labs: { 'Lab A': 'n.adel@campuscore.test', 'Lab B': 'o.fathy@campuscore.test' } },
  { semester: 'Fall 2026', code: 'CS310', title: 'Web Application Development',
    description: 'Building full-stack web applications with React, Node.js and PostgreSQL.',
    lectures: { L1: 'l.nabil@campuscore.test' },
    labs: { 'Lab A': 'o.fathy@campuscore.test' } },
  { semester: 'Fall 2026', code: 'MATH201', title: 'Discrete Mathematics',
    description: 'Logic, sets, relations, combinatorics and graph theory.',
    lectures: { L1: 'k.mostafa@campuscore.test' },
    labs: {} },
  { semester: 'Spring 2026', code: 'CS201', title: 'Data Structures',
    description: 'Lists, stacks, queues, trees, hashing and graphs.',
    lectures: { L1: 'k.mostafa@campuscore.test' },
    labs: { 'Lab A': 'n.adel@campuscore.test' } },
];

const ASSIGNMENTS = [
  { semester: 'Fall 2026', course: 'CS301', type: 'lecture', section: 'L1', createdBy: 'k.mostafa@campuscore.test',
    title: 'Assignment 1 – Threat modelling', dueInDays: 14,
    instructions: 'Produce a STRIDE threat model for a university LMS. Submit one PDF (max 10 MB).' },
  { semester: 'Fall 2026', course: 'CS301', type: 'lecture', section: 'L1', createdBy: 'k.mostafa@campuscore.test',
    title: 'Assignment 0 – Security reflection', dueInDays: -7,
    instructions: 'One page on a recent security incident and what could have prevented it.' },
  { semester: 'Fall 2026', course: 'CS301', type: 'lab', section: 'Lab A', createdBy: 'o.fathy@campuscore.test',
    title: 'Lab 1 – Packet capture', dueInDays: 7,
    instructions: 'Capture an HTTP and an HTTPS session and explain the differences. Submit your report as PDF.' },
  { semester: 'Fall 2026', course: 'CS305', type: 'lecture', section: 'L1', createdBy: 'l.nabil@campuscore.test',
    title: 'ER diagram for a library system', dueInDays: 21,
    instructions: 'Design the ER diagram and the relational schema (3NF).' },
];

const ANNOUNCEMENTS = [
  { semester: 'Fall 2026', course: 'CS301', postedBy: 'k.mostafa@campuscore.test',
    title: 'Welcome to Information Security',
    message: 'Welcome! Lecture slides are posted every Sunday. Office hours: Tuesday 12:00–14:00.' },
  { semester: 'Fall 2026', course: 'CS301', labSection: 'Lab A', postedBy: 'o.fathy@campuscore.test',
    title: 'Lab A: bring your laptop',
    message: 'Next lab uses Wireshark. Please install it before the session.' },
];

const ENROLLMENTS = [
  { student: 'student1@campuscore.test', semester: 'Fall 2026', course: 'CS301', lecture: 'L1', lab: 'Lab A' },
  { student: 'student1@campuscore.test', semester: 'Fall 2026', course: 'CS305', lecture: 'L1', lab: 'Lab B' },
  { student: 'student1@campuscore.test', semester: 'Fall 2026', course: 'CS310', lecture: 'L1', lab: 'Lab A' },
  { student: 'student1@campuscore.test', semester: 'Fall 2026', course: 'MATH201', lecture: 'L1', lab: null },
  { student: 'student1@campuscore.test', semester: 'Spring 2026', course: 'CS201', lecture: 'L1', lab: 'Lab A', status: 'completed' },
  { student: 'student2@campuscore.test', semester: 'Fall 2026', course: 'CS301', lecture: 'L1', lab: 'Lab B' },
  { student: 'student2@campuscore.test', semester: 'Fall 2026', course: 'CS305', lecture: 'L2', lab: 'Lab A' },
  { student: 'student4@campuscore.test', semester: 'Fall 2026', course: 'CS301', lecture: 'L1', lab: 'Lab A' },
  { student: 'student4@campuscore.test', semester: 'Fall 2026', course: 'MATH201', lecture: 'L1', lab: null },
  { student: 'student5@campuscore.test', semester: 'Fall 2026', course: 'CS301', lecture: 'L1', lab: 'Lab B' },
  { student: 'student5@campuscore.test', semester: 'Fall 2026', course: 'CS305', lecture: 'L2', lab: 'Lab B' },
  { student: 'student6@campuscore.test', semester: 'Fall 2026', course: 'CS301', lecture: 'L1', lab: null },
  { student: 'student6@campuscore.test', semester: 'Fall 2026', course: 'CS310', lecture: 'L1', lab: 'Lab A' },
  { student: 'student6@campuscore.test', semester: 'Fall 2026', course: 'CS305', lecture: 'L1', lab: 'Lab A', status: 'dropped' },
];

async function ensureAuthUsers(emails, password) {
  const supabase = createSupabaseAdmin();
  const existing = new Map();
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Supabase listUsers failed: ${error.message}`);
    data.users.forEach((u) => existing.set(u.email.toLowerCase(), u.id));
    if (data.users.length < 1000) break;
  }

  const ids = new Map();
  for (const email of emails) {
    if (existing.has(email)) {
      ids.set(email, existing.get(email));
      console.log(`  auth   exists   ${email}`);
      continue;
    }
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw new Error(`Supabase createUser failed for ${email}: ${error.message}`);
    ids.set(email, data.user.id);
    console.log(`  auth   created  ${email}`);
  }
  return ids;
}

async function insertOrGet(client, insertSql, insertParams, selectSql, selectParams) {
  const inserted = await client.query(insertSql, insertParams);
  if (inserted.rows[0]) return Object.values(inserted.rows[0])[0];
  const found = await client.query(selectSql, selectParams);
  return Object.values(found.rows[0])[0];
}

async function seedAppData(client, authIds) {
  const roleIds = new Map(
    (await client.query('SELECT role_id, role_name FROM roles')).rows.map((r) => [r.role_name, r.role_id]),
  );
  const userIds = new Map();
  const staffIds = new Map();
  const studentIds = new Map();

  for (const u of USERS) {
    const userId = await insertOrGet(
      client,
      `INSERT INTO users (auth_user_id, full_name, email) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING RETURNING user_id`,
      [authIds.get(u.email), u.fullName, u.email],
      'SELECT user_id FROM users WHERE lower(email) = lower($1)',
      [u.email],
    );
    userIds.set(u.email, userId);

    for (const role of u.roles) {
      await client.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, roleIds.get(role)],
      );
    }
    if (u.staff) {
      staffIds.set(u.email, await insertOrGet(
        client,
        `INSERT INTO staff (user_id, employee_number, department, academic_title) VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING RETURNING staff_id`,
        [userId, u.staff.employeeNumber, u.staff.department, u.staff.academicTitle],
        'SELECT staff_id FROM staff WHERE user_id = $1',
        [userId],
      ));
    }
    if (u.student) {
      studentIds.set(u.email, await insertOrGet(
        client,
        `INSERT INTO students (user_id, university_id, major, academic_year) VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING RETURNING student_id`,
        [userId, u.student.universityId, u.student.major, u.student.academicYear],
        'SELECT student_id FROM students WHERE user_id = $1',
        [userId],
      ));
    }
  }
  console.log(`  data   ${USERS.length} users with roles and profiles`);

  const semesterIds = new Map();
  for (const s of SEMESTERS) {
    semesterIds.set(s.name, await insertOrGet(
      client,
      `INSERT INTO semesters (name, start_date, end_date) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING RETURNING semester_id`,
      [s.name, s.startDate, s.endDate],
      'SELECT semester_id FROM semesters WHERE name = $1',
      [s.name],
    ));
  }

  const courseIds = new Map();
  const lectureIds = new Map();
  const labIds = new Map();
  for (const c of COURSES) {
    const semesterId = semesterIds.get(c.semester);
    const courseId = await insertOrGet(
      client,
      `INSERT INTO courses (semester_id, course_code, title, description) VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING RETURNING course_id`,
      [semesterId, c.code, c.title, c.description],
      'SELECT course_id FROM courses WHERE semester_id = $1 AND course_code = $2',
      [semesterId, c.code],
    );
    const key = `${c.semester}|${c.code}`;
    courseIds.set(key, courseId);

    for (const [name, lecturer] of Object.entries(c.lectures)) {
      lectureIds.set(`${key}|${name}`, await insertOrGet(
        client,
        `INSERT INTO lecture_sections (course_id, lecturer_staff_id, section_name) VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING RETURNING lecture_section_id`,
        [courseId, staffIds.get(lecturer), name],
        'SELECT lecture_section_id FROM lecture_sections WHERE course_id = $1 AND section_name = $2',
        [courseId, name],
      ));
    }
    for (const [name, teacher] of Object.entries(c.labs)) {
      labIds.set(`${key}|${name}`, await insertOrGet(
        client,
        `INSERT INTO lab_sections (course_id, lab_teacher_staff_id, section_name) VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING RETURNING lab_section_id`,
        [courseId, staffIds.get(teacher), name],
        'SELECT lab_section_id FROM lab_sections WHERE course_id = $1 AND section_name = $2',
        [courseId, name],
      ));
    }
  }
  console.log(`  data   ${SEMESTERS.length} semesters, ${COURSES.length} courses with sections`);

  for (const e of ENROLLMENTS) {
    const key = `${e.semester}|${e.course}`;
    await client.query(
      `INSERT INTO enrollments (student_id, course_id, lecture_section_id, lab_section_id, status)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
      [
        studentIds.get(e.student),
        courseIds.get(key),
        lectureIds.get(`${key}|${e.lecture}`),
        e.lab ? labIds.get(`${key}|${e.lab}`) : null,
        e.status ?? 'active',
      ],
    );
  }
  console.log(`  data   ${ENROLLMENTS.length} enrollments`);

  for (const a of ASSIGNMENTS) {
    const key = `${a.semester}|${a.course}`;
    const sectionId = a.type === 'lab' ? labIds.get(`${key}|${a.section}`) : lectureIds.get(`${key}|${a.section}`);
    await client.query(
      `INSERT INTO assignments (course_id, lecture_section_id, lab_section_id, created_by, title, instructions, assignment_type, due_at)
       SELECT $1::int, $2::int, $3::int, $4::int, $5::text, $6::text, $7::text,
              date_trunc('hour', now()) + make_interval(days => $8::int)
        WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE course_id = $1::int AND title = $5::text)`,
      [
        courseIds.get(key),
        a.type === 'lecture' ? sectionId : null,
        a.type === 'lab' ? sectionId : null,
        staffIds.get(a.createdBy),
        a.title,
        a.instructions,
        a.type,
        a.dueInDays,
      ],
    );
  }
  for (const n of ANNOUNCEMENTS) {
    const key = `${n.semester}|${n.course}`;
    const lectureSectionId = n.lectureSection ? lectureIds.get(`${key}|${n.lectureSection}`) : null;
    const labSectionId = n.labSection ? labIds.get(`${key}|${n.labSection}`) : null;
    await client.query(
      `INSERT INTO announcements (course_id, lecture_section_id, lab_section_id, posted_by, title, message)
       SELECT $1::int, $2::int, $3::int, $4::int, $5::text, $6::text
        WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE course_id = $1::int AND title = $5::text)`,
      [courseIds.get(key), lectureSectionId, labSectionId, staffIds.get(n.postedBy), n.title, n.message],
    );
  }
  console.log(`  data   ${ASSIGNMENTS.length} assignments, ${ANNOUNCEMENTS.length} announcements`);
}

async function seed() {
  if (env.isProduction) throw new Error('Refusing to seed test data with NODE_ENV=production.');
  const password = process.env.SEED_DEFAULT_PASSWORD || '';
  if (password.length < 10) {
    throw new Error('Set SEED_DEFAULT_PASSWORD (at least 10 characters) in backend/.env for the test accounts.');
  }

  const emails = USERS.map((u) => u.email.toLowerCase());
  const authIds = await ensureAuthUsers(emails, password);
  await withTransaction((client) => seedAppData(client, authIds));
}

seed()
  .then(() => console.log('Seed complete.'))
  .catch((err) => {
    console.error(`Seed failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

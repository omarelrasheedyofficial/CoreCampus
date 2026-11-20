CREATE TABLE users (
  user_id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auth_user_id  UUID        NOT NULL UNIQUE,
  full_name     VARCHAR(150) NOT NULL CHECK (length(trim(full_name)) > 0),
  email         VARCHAR(255) NOT NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email));

DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    ALTER TABLE users
      ADD CONSTRAINT users_auth_user_fk FOREIGN KEY (auth_user_id) REFERENCES auth.users (id);
  END IF;
END $$;

CREATE TABLE roles (
  role_id    SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role_name  VARCHAR(30) NOT NULL UNIQUE
);
INSERT INTO roles (role_name) VALUES ('student'), ('lecturer'), ('lab_teacher'), ('admin');

CREATE TABLE user_roles (
  user_id  INTEGER  NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  role_id  SMALLINT NOT NULL REFERENCES roles (role_id) ON DELETE RESTRICT,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE staff (
  staff_id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          INTEGER NOT NULL UNIQUE REFERENCES users (user_id) ON DELETE RESTRICT,
  employee_number  VARCHAR(30) NOT NULL UNIQUE,
  phone_number     VARCHAR(30),
  department       VARCHAR(120),
  academic_title   VARCHAR(60)
);

CREATE TABLE students (
  student_id     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        INTEGER NOT NULL UNIQUE REFERENCES users (user_id) ON DELETE RESTRICT,
  university_id  VARCHAR(30) NOT NULL UNIQUE,
  phone_number   VARCHAR(30),
  major          VARCHAR(120),
  academic_year  SMALLINT CHECK (academic_year BETWEEN 1 AND 7)
);

CREATE TABLE semesters (
  semester_id  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         VARCHAR(60) NOT NULL UNIQUE,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  CONSTRAINT semesters_dates_check CHECK (end_date > start_date)
);

CREATE TABLE courses (
  course_id    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  semester_id  INTEGER NOT NULL REFERENCES semesters (semester_id) ON DELETE RESTRICT,
  course_code  VARCHAR(20)  NOT NULL,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  is_archived  BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT courses_code_per_semester_unique UNIQUE (semester_id, course_code)
);

CREATE TABLE lecture_sections (
  lecture_section_id  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id           INTEGER NOT NULL REFERENCES courses (course_id) ON DELETE RESTRICT,
  lecturer_staff_id   INTEGER REFERENCES staff (staff_id) ON DELETE RESTRICT,
  section_name        VARCHAR(50) NOT NULL,
  CONSTRAINT lecture_sections_name_unique UNIQUE (course_id, section_name),
  CONSTRAINT lecture_sections_id_course_unique UNIQUE (lecture_section_id, course_id)
);

CREATE TABLE lab_sections (
  lab_section_id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id             INTEGER NOT NULL REFERENCES courses (course_id) ON DELETE RESTRICT,
  lab_teacher_staff_id  INTEGER REFERENCES staff (staff_id) ON DELETE RESTRICT,
  section_name          VARCHAR(50) NOT NULL,
  CONSTRAINT lab_sections_name_unique UNIQUE (course_id, section_name),
  CONSTRAINT lab_sections_id_course_unique UNIQUE (lab_section_id, course_id)
);

CREATE TABLE enrollments (
  enrollment_id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id          INTEGER NOT NULL REFERENCES students (student_id) ON DELETE RESTRICT,
  course_id           INTEGER NOT NULL REFERENCES courses (course_id) ON DELETE RESTRICT,
  lecture_section_id  INTEGER NOT NULL,
  lab_section_id      INTEGER,
  status              VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'dropped', 'completed')),
  enrolled_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT enrollments_student_course_unique UNIQUE (student_id, course_id),
  CONSTRAINT enrollments_lecture_section_fk FOREIGN KEY (lecture_section_id, course_id)
    REFERENCES lecture_sections (lecture_section_id, course_id),
  CONSTRAINT enrollments_lab_section_fk FOREIGN KEY (lab_section_id, course_id)
    REFERENCES lab_sections (lab_section_id, course_id)
);

CREATE TABLE course_materials (
  material_id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id           INTEGER NOT NULL REFERENCES courses (course_id) ON DELETE RESTRICT,
  lecture_section_id  INTEGER,
  lab_section_id      INTEGER,
  uploaded_by         INTEGER NOT NULL REFERENCES staff (staff_id) ON DELETE RESTRICT,
  title               VARCHAR(200) NOT NULL,
  storage_key         TEXT NOT NULL UNIQUE,
  original_filename   VARCHAR(255) NOT NULL,
  mime_type           VARCHAR(100) NOT NULL,
  file_size           BIGINT NOT NULL CHECK (file_size > 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_materials_one_section CHECK (lecture_section_id IS NULL OR lab_section_id IS NULL),
  CONSTRAINT course_materials_lecture_section_fk FOREIGN KEY (lecture_section_id, course_id)
    REFERENCES lecture_sections (lecture_section_id, course_id),
  CONSTRAINT course_materials_lab_section_fk FOREIGN KEY (lab_section_id, course_id)
    REFERENCES lab_sections (lab_section_id, course_id)
);

CREATE TABLE assignments (
  assignment_id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id           INTEGER NOT NULL REFERENCES courses (course_id) ON DELETE RESTRICT,
  lecture_section_id  INTEGER,
  lab_section_id      INTEGER,
  created_by          INTEGER NOT NULL REFERENCES staff (staff_id) ON DELETE RESTRICT,
  title               VARCHAR(200) NOT NULL,
  instructions        TEXT,
  assignment_type     VARCHAR(10) NOT NULL CHECK (assignment_type IN ('lecture', 'lab')),
  due_at              TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT assignments_type_section_check CHECK (
    (assignment_type = 'lecture' AND lab_section_id IS NULL) OR
    (assignment_type = 'lab' AND lecture_section_id IS NULL)
  ),
  CONSTRAINT assignments_lecture_section_fk FOREIGN KEY (lecture_section_id, course_id)
    REFERENCES lecture_sections (lecture_section_id, course_id),
  CONSTRAINT assignments_lab_section_fk FOREIGN KEY (lab_section_id, course_id)
    REFERENCES lab_sections (lab_section_id, course_id)
);

CREATE TABLE submissions (
  submission_id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  assignment_id       INTEGER NOT NULL REFERENCES assignments (assignment_id) ON DELETE RESTRICT,
  student_id          INTEGER NOT NULL REFERENCES students (student_id) ON DELETE RESTRICT,
  graded_by_staff_id  INTEGER REFERENCES staff (staff_id) ON DELETE RESTRICT,
  storage_key         TEXT NOT NULL UNIQUE,
  original_filename   VARCHAR(255) NOT NULL,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  grade               NUMERIC(5, 2) CHECK (grade BETWEEN 0 AND 100),
  feedback            TEXT,
  graded_at           TIMESTAMPTZ,
  CONSTRAINT submissions_assignment_student_unique UNIQUE (assignment_id, student_id),
  CONSTRAINT submissions_grading_consistency CHECK (
    (grade IS NULL AND graded_by_staff_id IS NULL AND graded_at IS NULL) OR
    (grade IS NOT NULL AND graded_by_staff_id IS NOT NULL AND graded_at IS NOT NULL)
  )
);

CREATE TABLE announcements (
  announcement_id     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id           INTEGER NOT NULL REFERENCES courses (course_id) ON DELETE RESTRICT,
  lecture_section_id  INTEGER,
  lab_section_id      INTEGER,
  posted_by           INTEGER NOT NULL REFERENCES staff (staff_id) ON DELETE RESTRICT,
  title               VARCHAR(200) NOT NULL,
  message             TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT announcements_one_section CHECK (lecture_section_id IS NULL OR lab_section_id IS NULL),
  CONSTRAINT announcements_lecture_section_fk FOREIGN KEY (lecture_section_id, course_id)
    REFERENCES lecture_sections (lecture_section_id, course_id),
  CONSTRAINT announcements_lab_section_fk FOREIGN KEY (lab_section_id, course_id)
    REFERENCES lab_sections (lab_section_id, course_id)
);

CREATE TABLE audit_logs (
  log_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      INTEGER REFERENCES users (user_id) ON DELETE SET NULL,
  event_type   VARCHAR(60) NOT NULL,
  entity_type  VARCHAR(60),
  entity_id    VARCHAR(60),
  details      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX courses_semester_idx            ON courses (semester_id);
CREATE INDEX lecture_sections_lecturer_idx   ON lecture_sections (lecturer_staff_id);
CREATE INDEX lab_sections_teacher_idx        ON lab_sections (lab_teacher_staff_id);
CREATE INDEX enrollments_course_idx          ON enrollments (course_id);
CREATE INDEX course_materials_course_idx     ON course_materials (course_id);
CREATE INDEX assignments_course_idx          ON assignments (course_id);
CREATE INDEX submissions_student_idx         ON submissions (student_id);
CREATE INDEX announcements_course_idx        ON announcements (course_id);
CREATE INDEX audit_logs_user_idx             ON audit_logs (user_id);
CREATE INDEX audit_logs_created_idx          ON audit_logs (created_at);

ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff            ENABLE ROW LEVEL SECURITY;
ALTER TABLE students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters        ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_sections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;

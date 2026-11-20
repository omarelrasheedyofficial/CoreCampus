-- Older manually configured databases omitted the PDF metadata used by the portals.
-- Existing columns and records are preserved. If legacy rows lack metadata, this
-- fails atomically so their real metadata can be supplied before retrying.
ALTER TABLE course_materials
  ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255) NOT NULL,
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100) NOT NULL,
  ADD COLUMN IF NOT EXISTS file_size BIGINT NOT NULL CHECK (file_size > 0);

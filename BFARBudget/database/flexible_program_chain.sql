-- ============================================================
--  BFAR E-Budget — Flexible Program Chain Migration
--  Allows Sub-Categories to link directly to a Program
--  without needing a Project Category.
--
--  Run this in MySQL before dotnet run.
-- ============================================================

USE bfar_ebudget;

-- 1. Make project_category_id nullable (optional)
ALTER TABLE project_sub_category
  MODIFY COLUMN project_category_id INT NULL;

-- 2. Add program_id column so Sub-Categories can link
--    directly to a Program when no Category exists
ALTER TABLE project_sub_category
  ADD COLUMN program_id INT NULL AFTER project_category_id,
  ADD CONSTRAINT fk_psub_program
    FOREIGN KEY (program_id) REFERENCES program (id)
    ON UPDATE CASCADE ON DELETE SET NULL;

-- 3. Backfill program_id for existing sub-categories
--    that already have a project_category_id
UPDATE project_sub_category ps
INNER JOIN project_category pc ON pc.id = ps.project_category_id
SET ps.program_id = pc.program_id
WHERE ps.program_id IS NULL;

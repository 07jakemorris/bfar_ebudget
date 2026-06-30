-- ============================================================
--  BFAR E-Budget — Allotments Table
--  Run AFTER bfar_schema.sql and fund_migration.sql
-- ============================================================

USE bfar_ebudget;

CREATE TABLE IF NOT EXISTS allotments (
  id                INT             NOT NULL AUTO_INCREMENT,
  rc_id             INT             NOT NULL,
  fund_id           INT             NOT NULL,
  expense_class_id  INT             NOT NULL,
  fiscal_year       VARCHAR(4)      NOT NULL,
  amount            DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_allotment (rc_id, fund_id, expense_class_id, fiscal_year),
  CONSTRAINT fk_allot_rc
    FOREIGN KEY (rc_id)            REFERENCES responsibility_center (id),
  CONSTRAINT fk_allot_fund
    FOREIGN KEY (fund_id)          REFERENCES fund (id),
  CONSTRAINT fk_allot_class
    FOREIGN KEY (expense_class_id) REFERENCES expense_class (id)
) ENGINE=InnoDB;

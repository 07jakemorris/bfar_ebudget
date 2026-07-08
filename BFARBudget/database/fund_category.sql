-- ============================================================
--  BFAR E-Budget — Fund Category Migration
--  Run this AFTER the initial bfar_schema.sql
-- ============================================================

USE bfar_ebudget;

-- ------------------------------------------------------------
-- 1. FUND TABLE
--    Stores all 6 columns; dropdown shows only fund_category.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fund (
  id                   INT          NOT NULL AUTO_INCREMENT,
  fund_cluster         VARCHAR(100) NOT NULL,
  financing_source     VARCHAR(150) NOT NULL,
  authorization_code   VARCHAR(150) NOT NULL,
  fund_category        VARCHAR(200) NOT NULL,
  full_funding_source  VARCHAR(50)  NOT NULL,
  is_active            TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fund_category (fund_category)
) ENGINE=InnoDB;

-- Sample seed data
INSERT INTO fund
  (fund_cluster, financing_source, authorization_code, fund_category, full_funding_source)
VALUES
  (
    '01000000 - Regular Agency Fund',
    '01100000 - General Fund',
    '01101000 - New General Appropriations',
    '01101101 - Specific Budget of the Agency (Current)',
    '01101101'
  ),
  (
    '01000000 - Regular Agency Fund',
    '01100000 - General Fund',
    '01101000 - New General Appropriations',
    '01101102 - Specific Budget of the Agency (Continuing)',
    '01101102'
  ),
  (
    '01000000 - Regular Agency Fund',
    '01100000 - General Fund',
    '01102000 - Automatic Appropriations',
    '01102101 - Retirement and Life Insurance Premiums',
    '01102101'
  ),
  (
    '02000000 - Foreign-Assisted Projects Fund',
    '01200000 - Grants',
    '01201000 - Grants',
    '01201101 - Foreign Grants (Current)',
    '01201101'
  ),
  (
    '05000000 - Special Purpose Fund',
    '01500000 - Special Accounts',
    '01501000 - Internally Generated Funds',
    '01501101 - Special Account in the General Fund (Current)',
    '01501101'
  );


-- ------------------------------------------------------------
-- 2. ALTER obligations TABLE — add fund columns
-- ------------------------------------------------------------

ALTER TABLE obligations
  ADD COLUMN fund_id                INT          NULL AFTER sub_account_code_id,
  ADD COLUMN fund_cluster           VARCHAR(100) NULL AFTER fund_id,
  ADD COLUMN financing_source       VARCHAR(150) NULL AFTER fund_cluster,
  ADD COLUMN authorization_code     VARCHAR(150) NULL AFTER financing_source,
  ADD COLUMN fund_category          VARCHAR(200) NULL AFTER authorization_code,
  ADD COLUMN full_funding_source    VARCHAR(50)  NULL AFTER fund_category,
  ADD CONSTRAINT fk_obl_fund
    FOREIGN KEY (fund_id) REFERENCES fund (id)
    ON UPDATE CASCADE ON DELETE SET NULL;

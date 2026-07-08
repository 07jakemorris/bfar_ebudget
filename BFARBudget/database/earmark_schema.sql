-- ============================================================
--  BFAR E-Budget — Earmarking Schema
--  Run AFTER bfar_schema.sql and fund_migration.sql
-- ============================================================

USE bfar_ebudget;

CREATE TABLE IF NOT EXISTS earmarks (
  id                   INT             NOT NULL AUTO_INCREMENT,
  pr_no                VARCHAR(30)     NOT NULL,
  earmarked_date       DATE            NOT NULL,
  payee                VARCHAR(200)    NOT NULL,
  creditor_type        ENUM('Internal','External') NOT NULL DEFAULT 'Internal',
  quarter              ENUM('Q1','Q2','Q3','Q4')   NOT NULL,
  rc_id                INT             NOT NULL,
  signatory_id         INT             NOT NULL,
  purpose              TEXT            NOT NULL,
  activity_level_id    INT             NOT NULL,
  account_code_id      INT             NOT NULL,
  sub_account_code_id  INT             NULL,
  fund_id              INT             NULL,
  fund_cluster         VARCHAR(100)    NULL,
  financing_source     VARCHAR(150)    NULL,
  authorization_code   VARCHAR(150)    NULL,
  fund_category        VARCHAR(200)    NULL,
  full_funding_source  VARCHAR(50)     NULL,
  amount               DECIMAL(15,2)   NOT NULL,
  remarks              VARCHAR(500)    NULL,
  status               ENUM('Pending','Released','Cancelled') NOT NULL DEFAULT 'Pending',
  created_by           VARCHAR(100)    NULL,
  created_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_pr_no (pr_no),
  CONSTRAINT fk_em_rc
    FOREIGN KEY (rc_id)              REFERENCES responsibility_center (id),
  CONSTRAINT fk_em_signatory
    FOREIGN KEY (signatory_id)       REFERENCES signatory (id),
  CONSTRAINT fk_em_activity
    FOREIGN KEY (activity_level_id)  REFERENCES activity_level (id),
  CONSTRAINT fk_em_acct
    FOREIGN KEY (account_code_id)    REFERENCES account_code (id),
  CONSTRAINT fk_em_subacct
    FOREIGN KEY (sub_account_code_id) REFERENCES sub_account_code (id),
  CONSTRAINT fk_em_fund
    FOREIGN KEY (fund_id)            REFERENCES fund (id) ON DELETE SET NULL
) ENGINE=InnoDB;

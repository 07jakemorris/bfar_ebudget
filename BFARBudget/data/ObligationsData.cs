using MySql.Data.MySqlClient;

namespace BFAR.EBudget.Data
{
    public class ObligationsData
    {
        private readonly string _connStr;

        public ObligationsData(string connectionString)
        {
            _connStr = connectionString;
        }

        // ── Generic helper ────────────────────────────────────────────────────
        private List<DropdownItem> GetItems(string sql, MySqlParameter[]? parameters = null)
        {
            var list = new List<DropdownItem>();
            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(sql, conn);
            if (parameters != null) cmd.Parameters.AddRange(parameters);
            conn.Open();
            using var rdr = cmd.ExecuteReader();
            while (rdr.Read())
                list.Add(new DropdownItem(rdr.GetValue(0).ToString()!, rdr.GetValue(1).ToString()!));
            return list;
        }

        // ── Static dropdowns ─────────────────────────────────────────────────
        public List<DropdownItem> GetExpenseClasses() =>
            GetItems("SELECT id, name FROM expense_class WHERE is_active = 1 ORDER BY name");

        public List<DropdownItem> GetPrograms() =>
            GetItems("SELECT id, name FROM program WHERE is_active = 1 ORDER BY name");

        public List<DropdownItem> GetResponsibilityCenters() =>
            GetItems("SELECT id, CONCAT(code, ' – ', name) FROM responsibility_center WHERE is_active = 1 ORDER BY name");

        // Fund categories — value = id, text = fund_category label only
        public List<DropdownItem> GetFundCategories() =>
            GetItems("SELECT id, fund_category FROM fund WHERE is_active = 1 ORDER BY fund_category");

        // ── Fund detail by id (all 6 columns) ────────────────────────────────
        public FundDetail? GetFundDetail(int fundId)
        {
            const string sql = @"
                SELECT id, fund_cluster, financing_source,
                       authorization_code, fund_category, full_funding_source
                FROM   fund WHERE id = @id LIMIT 1";

            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", fundId);
            conn.Open();
            using var rdr = cmd.ExecuteReader();
            if (!rdr.Read()) return null;
            return new FundDetail
            {
                Id                 = rdr.GetInt32("id"),
                FundCluster        = rdr.GetString("fund_cluster"),
                FinancingSource    = rdr.GetString("financing_source"),
                AuthorizationCode  = rdr.GetString("authorization_code"),
                FundCategory       = rdr.GetString("fund_category"),
                FullFundingSource  = rdr.GetString("full_funding_source")
            };
        }

        // ── Cascade dropdowns ─────────────────────────────────────────────────
        public List<DropdownItem> GetExpenseTypes(int expenseClassId) =>
            GetItems("SELECT id, name FROM expense_type WHERE expense_class_id = @id AND is_active = 1 ORDER BY name",
                new[] { new MySqlParameter("@id", expenseClassId) });

        public List<DropdownItem> GetAccountCodes(int expenseTypeId) =>
            GetItems("SELECT id, CONCAT(code, ' – ', description) FROM account_code WHERE expense_type_id = @id AND is_active = 1 ORDER BY code",
                new[] { new MySqlParameter("@id", expenseTypeId) });

        public List<DropdownItem> GetSubAccountCodes(int accountCodeId) =>
            GetItems("SELECT id, CONCAT(code, ' – ', description) FROM sub_account_code WHERE account_code_id = @id AND is_active = 1 ORDER BY code",
                new[] { new MySqlParameter("@id", accountCodeId) });

        public List<DropdownItem> GetProjectCategories(int programId) =>
            GetItems("SELECT id, name FROM project_category WHERE program_id = @id AND is_active = 1 ORDER BY name",
                new[] { new MySqlParameter("@id", programId) });

        public List<DropdownItem> GetProjectSubCategories(int categoryId) =>
            GetItems("SELECT id, name FROM project_sub_category WHERE project_category_id = @id AND is_active = 1 ORDER BY name",
                new[] { new MySqlParameter("@id", categoryId) });

        // Direct link: Program → Sub-Category (when no Project Category exists)
        public List<DropdownItem> GetProjectSubCategoriesByProgram(int programId) =>
            GetItems("SELECT id, name FROM project_sub_category WHERE program_id = @id AND (project_category_id IS NULL OR project_category_id = 0) AND is_active = 1 ORDER BY name",
                new[] { new MySqlParameter("@id", programId) });

        public List<DropdownItem> GetActivityLevels(int subCategoryId) =>
            GetItems("SELECT id, name FROM activity_level WHERE project_sub_category_id = @id AND is_active = 1 ORDER BY name",
                new[] { new MySqlParameter("@id", subCategoryId) });

        public List<DropdownItem> GetSignatories(int rcId) =>
            GetItems("SELECT id, CONCAT(name, ' – ', position) FROM signatory WHERE rc_id = @id AND is_active = 1 ORDER BY name",
                new[] { new MySqlParameter("@id", rcId) });

        // ── Get full obligation detail for ORS print ─────────────────────────
        // Shared SELECT used by both single-record lookup (by id) and
        // grouped lookup (by ors_no, for consolidated/multi-line ORS printing).
        private const string ObligationDetailSql = @"
                SELECT  o.id, o.ors_no, DATE_FORMAT(o.ors_date,'%m/%d/%Y') AS ors_date,
                        o.payee, o.particulars, o.amount, o.status,
                        rc.code  AS rc_code,  rc.name  AS rc_name,
                        s.name   AS sig_name, s.position AS sig_pos,
                        o.fund_cluster, o.financing_source, o.authorization_code,
                        o.fund_category, o.full_funding_source,
                        p.id     AS program_id,       p.name  AS program_name,
                        pc.id    AS project_cat_id,    pc.name AS project_cat_name,
                        psc.id   AS project_subcat_id, psc.name AS project_subcat_name,
                        ec.id    AS expense_class_id,
                        ec.code  AS expense_class_code, ec.name AS expense_class_name,
                        ac.code  AS account_code,       ac.description AS account_desc,
                        sac.code AS sub_account_code,   sac.description AS sub_account_desc
                FROM    obligations o
                LEFT JOIN responsibility_center rc  ON rc.id  = o.rc_id
                LEFT JOIN signatory              s   ON s.id   = o.signatory_id
                LEFT JOIN account_code           ac  ON ac.id  = o.account_code_id
                LEFT JOIN expense_type           et  ON et.id  = ac.expense_type_id
                LEFT JOIN expense_class          ec  ON ec.id  = et.expense_class_id
                LEFT JOIN sub_account_code       sac ON sac.id = o.sub_account_code_id
                LEFT JOIN activity_level         al  ON al.id  = o.activity_level_id
                LEFT JOIN project_sub_category   psc ON psc.id = al.project_sub_category_id
                LEFT JOIN project_category       pc  ON pc.id  = NULLIF(psc.project_category_id, 0)
                LEFT JOIN program                p   ON p.id   = COALESCE(pc.program_id, psc.program_id)";

        private static ObligationDetail MapObligationDetail(MySqlDataReader rdr)
        {
            return new ObligationDetail
            {
                Id                 = rdr.GetInt32(rdr.GetOrdinal("id")),
                OrsNo              = rdr.GetValue(rdr.GetOrdinal("ors_no")).ToString() ?? "",
                OrsDate            = rdr.GetValue(rdr.GetOrdinal("ors_date")).ToString() ?? "",
                Payee              = rdr.GetValue(rdr.GetOrdinal("payee")).ToString() ?? "",
                Particulars        = rdr.GetValue(rdr.GetOrdinal("particulars")).ToString() ?? "",
                Amount             = rdr.GetDecimal(rdr.GetOrdinal("amount")),
                Status             = rdr.GetValue(rdr.GetOrdinal("status")).ToString() ?? "",
                RcCode             = rdr.IsDBNull(rdr.GetOrdinal("rc_code"))  ? "" : rdr.GetValue(rdr.GetOrdinal("rc_code")).ToString()!,
                RcName             = rdr.IsDBNull(rdr.GetOrdinal("rc_name"))  ? "" : rdr.GetValue(rdr.GetOrdinal("rc_name")).ToString()!,
                SignatoryName      = rdr.IsDBNull(rdr.GetOrdinal("sig_name")) ? "" : rdr.GetValue(rdr.GetOrdinal("sig_name")).ToString()!,
                SignatoryPosition  = rdr.IsDBNull(rdr.GetOrdinal("sig_pos"))  ? "" : rdr.GetValue(rdr.GetOrdinal("sig_pos")).ToString()!,
                FundCluster        = rdr.IsDBNull(rdr.GetOrdinal("fund_cluster"))       ? "" : rdr.GetValue(rdr.GetOrdinal("fund_cluster")).ToString()!,
                FinancingSource    = rdr.IsDBNull(rdr.GetOrdinal("financing_source"))   ? "" : rdr.GetValue(rdr.GetOrdinal("financing_source")).ToString()!,
                AuthorizationCode  = rdr.IsDBNull(rdr.GetOrdinal("authorization_code")) ? "" : rdr.GetValue(rdr.GetOrdinal("authorization_code")).ToString()!,
                FundCategory       = rdr.IsDBNull(rdr.GetOrdinal("fund_category"))      ? "" : rdr.GetValue(rdr.GetOrdinal("fund_category")).ToString()!,
                FullFundingSource  = rdr.IsDBNull(rdr.GetOrdinal("full_funding_source")) ? "" : rdr.GetValue(rdr.GetOrdinal("full_funding_source")).ToString()!,

                ProgramId          = rdr.IsDBNull(rdr.GetOrdinal("program_id")) ? (int?)null : rdr.GetInt32(rdr.GetOrdinal("program_id")),
                ProgramName        = rdr.IsDBNull(rdr.GetOrdinal("program_name")) ? "" : rdr.GetValue(rdr.GetOrdinal("program_name")).ToString()!,

                ProjectCategoryId   = rdr.IsDBNull(rdr.GetOrdinal("project_cat_id")) ? (int?)null : rdr.GetInt32(rdr.GetOrdinal("project_cat_id")),
                ProjectCategoryName = rdr.IsDBNull(rdr.GetOrdinal("project_cat_name")) ? "" : rdr.GetValue(rdr.GetOrdinal("project_cat_name")).ToString()!,

                ProjectSubCategoryId   = rdr.IsDBNull(rdr.GetOrdinal("project_subcat_id")) ? (int?)null : rdr.GetInt32(rdr.GetOrdinal("project_subcat_id")),
                ProjectSubCategoryName = rdr.IsDBNull(rdr.GetOrdinal("project_subcat_name")) ? "" : rdr.GetValue(rdr.GetOrdinal("project_subcat_name")).ToString()!,

                ExpenseClassId     = rdr.IsDBNull(rdr.GetOrdinal("expense_class_id")) ? (int?)null : rdr.GetInt32(rdr.GetOrdinal("expense_class_id")),
                ExpenseClassCode   = rdr.IsDBNull(rdr.GetOrdinal("expense_class_code")) ? "" : rdr.GetValue(rdr.GetOrdinal("expense_class_code")).ToString()!,
                ExpenseClassName   = rdr.IsDBNull(rdr.GetOrdinal("expense_class_name")) ? "" : rdr.GetValue(rdr.GetOrdinal("expense_class_name")).ToString()!,

                AccountCode        = rdr.IsDBNull(rdr.GetOrdinal("account_code"))   ? "" : rdr.GetValue(rdr.GetOrdinal("account_code")).ToString()!,
                AccountDesc        = rdr.IsDBNull(rdr.GetOrdinal("account_desc"))   ? "" : rdr.GetValue(rdr.GetOrdinal("account_desc")).ToString()!,
                SubAccountCode     = rdr.IsDBNull(rdr.GetOrdinal("sub_account_code")) ? "" : rdr.GetValue(rdr.GetOrdinal("sub_account_code")).ToString()!,
                SubAccountDesc     = rdr.IsDBNull(rdr.GetOrdinal("sub_account_desc")) ? "" : rdr.GetValue(rdr.GetOrdinal("sub_account_desc")).ToString()!,
            };
        }

        public ObligationDetail? GetObligationDetail(int id)
        {
            string sql = ObligationDetailSql + " WHERE o.id = @id LIMIT 1";

            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            conn.Open();
            using var rdr = cmd.ExecuteReader();
            if (!rdr.Read()) return null;

            return MapObligationDetail(rdr);
        }

        // Returns every obligation row sharing the given ORS/BURS number,
        // ordered earliest-first (by id — the auto-increment column
        // reflects creation order). Used for consolidated ORS printing:
        // one ORS number can span several Responsibility Centers, and/or
        // one RC can carry several account codes, each stored as its own
        // row in `obligations`.
        public List<ObligationDetail> GetObligationsByOrsNo(string orsNo)
        {
            string sql = ObligationDetailSql + " WHERE o.ors_no = @orsNo ORDER BY o.id ASC";

            var results = new List<ObligationDetail>();
            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@orsNo", orsNo);
            conn.Open();
            using var rdr = cmd.ExecuteReader();
            while (rdr.Read())
            {
                results.Add(MapObligationDetail(rdr));
            }
            return results;
        }

        // ── Save obligation ───────────────────────────────────────────────────
        public int SaveObligation(ObligationModel model)
        {
            const string sql = @"
                INSERT INTO obligations
                    (ors_no, ors_date, payee, creditor_type, quarter,
                     rc_id, signatory_id, particulars,
                     activity_level_id, account_code_id, sub_account_code_id,
                     fund_id, fund_cluster, financing_source,
                     authorization_code, fund_category, full_funding_source,
                     amount, status, created_by)
                VALUES
                    (@ors_no, @ors_date, @payee, @creditor_type, @quarter,
                     @rc_id, @signatory_id, @particulars,
                     @activity_level_id, @account_code_id, @sub_account_code_id,
                     @fund_id, @fund_cluster, @financing_source,
                     @authorization_code, @fund_category, @full_funding_source,
                     @amount, 'Pending', @created_by);
                SELECT LAST_INSERT_ID();";

            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(sql, conn);

            cmd.Parameters.AddWithValue("@ors_no",             model.OrsNo);
            cmd.Parameters.AddWithValue("@ors_date",           model.OrsDate);
            cmd.Parameters.AddWithValue("@payee",              model.Payee);
            cmd.Parameters.AddWithValue("@creditor_type",      model.CreditorType);
            cmd.Parameters.AddWithValue("@quarter",            model.Quarter);
            cmd.Parameters.AddWithValue("@rc_id",              model.RcId);
            cmd.Parameters.AddWithValue("@signatory_id",       model.SignatoryId);
            cmd.Parameters.AddWithValue("@particulars",        model.Particulars);
            // Fund columns — must come before activity/account to match INSERT order
            cmd.Parameters.AddWithValue("@fund_id",
                model.FundId.HasValue ? (object)model.FundId.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@fund_cluster",        model.FundCluster        ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@financing_source",    model.FinancingSource    ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@authorization_code",  model.AuthorizationCode  ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@fund_category",       model.FundCategory       ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@full_funding_source", model.FullFundingSource  ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@activity_level_id",  model.ActivityLevelId);
            cmd.Parameters.AddWithValue("@account_code_id",    model.AccountCodeId);
            cmd.Parameters.AddWithValue("@sub_account_code_id",
                model.SubAccountCodeId.HasValue ? (object)model.SubAccountCodeId.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@amount",             model.Amount);
            cmd.Parameters.AddWithValue("@created_by",         model.CreatedBy ?? "system");

            conn.Open();
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        // ── Next ORS number ───────────────────────────────────────────────────
        public string GetNextOrsNumber()
        {
            var now       = DateTime.Now;
            string prefix = $"{now:yy}-{now:MM}-";

            const string sql = @"
                SELECT ors_no FROM obligations
                WHERE ors_no LIKE @prefix
                ORDER BY ors_no DESC LIMIT 1";

            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@prefix", prefix + "%");
            conn.Open();

            var latest  = cmd.ExecuteScalar() as string;
            int nextSeq = 1;

            if (!string.IsNullOrEmpty(latest))
            {
                var parts = latest.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out int lastSeq))
                    nextSeq = lastSeq + 1;
            }

            return $"{prefix}{nextSeq:D4}";
        }

        // ── Get obligations list ──────────────────────────────────────────────
        public List<ObligationRecord> GetObligations()
        {
            const string sql = @"
                SELECT  o.id,
                        o.ors_no,
                        DATE_FORMAT(o.ors_date, '%Y-%m-%d') AS ors_date,
                        rc.name                             AS rc_name,
                        LEFT(o.particulars, 60)             AS particulars_short,
                        o.amount,
                        o.status,
                        COALESCE(o.fund_category, '')       AS fund_category
                FROM    obligations o
                INNER JOIN responsibility_center rc ON rc.id = o.rc_id
                ORDER BY o.created_at DESC
                LIMIT 100";

            var list = new List<ObligationRecord>();
            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(sql, conn);
            conn.Open();
            using var rdr = cmd.ExecuteReader();
            while (rdr.Read())
            {
                list.Add(new ObligationRecord
                {
                    Id               = rdr.GetInt32("id"),
                    OrsNo            = rdr.GetString("ors_no"),
                    OrsDate          = rdr.GetString("ors_date"),
                    RcName           = rdr.GetString("rc_name"),
                    ParticularsShort = rdr.GetString("particulars_short"),
                    Amount           = rdr.GetDecimal("amount"),
                    Status           = rdr.GetString("status"),
                    FundCategory     = rdr.GetString("fund_category")
                });
            }
            return list;
        }

        // ── Delete obligation ─────────────────────────────────────────────────
        public void DeleteObligation(int id)
        {
            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand("DELETE FROM obligations WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", id);
            conn.Open();
            cmd.ExecuteNonQuery();
        }
    }

    // ── Models ────────────────────────────────────────────────────────────────

    public record DropdownItem(string Value, string Text);

    public class ObligationDetail
    {
        public int     Id                { get; set; }
        public string  OrsNo             { get; set; } = "";
        public string  OrsDate           { get; set; } = "";
        public string  Payee             { get; set; } = "";
        public string  Particulars       { get; set; } = "";
        public decimal Amount            { get; set; }
        public string  Status            { get; set; } = "";
        public string  RcCode            { get; set; } = "";
        public string  RcName            { get; set; } = "";
        public string  SignatoryName     { get; set; } = "";
        public string  SignatoryPosition { get; set; } = "";
        public string  FundCluster       { get; set; } = "";
        public string  FinancingSource   { get; set; } = "";
        public string  AuthorizationCode { get; set; } = "";
        public string  FundCategory      { get; set; } = "";
        public string  FullFundingSource { get; set; } = "";

        // Program / Project hierarchy (resolved from obligations.activity_level_id)
        // NOTE: these tables have no separate "code" column — their `name`
        // field already stores the full "310100000000 - Fisheries..." string.
        public int?    ProgramId              { get; set; }
        public string  ProgramName            { get; set; } = "";
        public int?    ProjectCategoryId      { get; set; }
        public string  ProjectCategoryName    { get; set; } = "";
        public int?    ProjectSubCategoryId   { get; set; }
        public string  ProjectSubCategoryName { get; set; } = "";

        public int?    ExpenseClassId    { get; set; }
        public string  ExpenseClassCode  { get; set; } = "";
        public string  ExpenseClassName  { get; set; } = "";
        public string  AccountCode       { get; set; } = "";
        public string  AccountDesc       { get; set; } = "";
        public string  SubAccountCode    { get; set; } = "";
        public string  SubAccountDesc    { get; set; } = "";
    }

    public class FundDetail
    {
        public int    Id                { get; set; }
        public string FundCluster       { get; set; } = "";
        public string FinancingSource   { get; set; } = "";
        public string AuthorizationCode { get; set; } = "";
        public string FundCategory      { get; set; } = "";
        public string FullFundingSource { get; set; } = "";
    }

    public class ObligationModel
    {
        public string   OrsNo             { get; set; } = "";
        public DateTime OrsDate           { get; set; }
        public string   Payee             { get; set; } = "";
        public string   CreditorType      { get; set; } = "Internal";
        public string   Quarter           { get; set; } = "";
        public int      RcId              { get; set; }
        public int      SignatoryId       { get; set; }
        public string   Particulars       { get; set; } = "";
        public int      ActivityLevelId   { get; set; }
        public int      AccountCodeId     { get; set; }
        public int?     SubAccountCodeId  { get; set; }
        // Fund fields
        public int?     FundId            { get; set; }
        public string?  FundCluster       { get; set; }
        public string?  FinancingSource   { get; set; }
        public string?  AuthorizationCode { get; set; }
        public string?  FundCategory      { get; set; }
        public string?  FullFundingSource { get; set; }
        public decimal  Amount            { get; set; }
        public string?  CreatedBy         { get; set; }
    }

    public class ObligationRecord
    {
        public int     Id               { get; set; }
        public string  OrsNo            { get; set; } = "";
        public string  OrsDate          { get; set; } = "";
        public string  RcName           { get; set; } = "";
        public string  ParticularsShort { get; set; } = "";
        public decimal Amount           { get; set; }
        public string  Status           { get; set; } = "";
        public string  FundCategory     { get; set; } = "";
    }
}

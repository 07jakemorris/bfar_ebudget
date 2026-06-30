using MySql.Data.MySqlClient;

namespace BFAR.EBudget.Data
{
    public class ObligationsData
    {
        public static string department_code = "05-000-00-00000 - Department of Agriculture";
        public static string agency_code = "05-003-00-00000 - Bureau of Fisheries and Aquatic Resources";
        public static string operating_unit = "05-003-03-00000 - Regional Offices";
        public static string lower_level_unit = "05-003-03-00008 - Region VIII";
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
                     department_code, agency_code, operating_unit, lower_level_unit,
                     amount, status, created_by)
                VALUES
                    (@ors_no, @ors_date, @payee, @creditor_type, @quarter,
                     @rc_id, @signatory_id, @particulars,
                     @activity_level_id, @account_code_id, @sub_account_code_id,
                     @fund_id, @fund_cluster, @financing_source,
                     @authorization_code, @fund_category, @full_funding_source,
                     @department_code, @agency_code, @operating_unit, @lower_level_unit,
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
            cmd.Parameters.AddWithValue("@department_code", department_code);
            cmd.Parameters.AddWithValue("@agency_code", agency_code);
            cmd.Parameters.AddWithValue("@operating_unit", operating_unit);
            cmd.Parameters.AddWithValue("@lower_level_unit", lower_level_unit);
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

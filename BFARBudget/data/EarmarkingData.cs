using MySql.Data.MySqlClient;

namespace BFAR.EBudget.Data
{
    public class EarmarkingData
    {
        public static string department_code = "05-000-00-00000 - Department of Agriculture";
        public static string agency_code = "05-003-00-00000 - Bureau of Fisheries and Aquatic Resources";
        public static string operating_unit = "05-003-03-00000 - Regional Offices";
        public static string lower_level_unit = "05-003-03-00008 - Region VIII";
        private readonly string _connStr;

        public EarmarkingData(string connectionString)
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

        // ── PR number format hint ─────────────────────────────────────────────
        public string GetPrNumberFormat()
        {
            var now = DateTime.Now;
            return $"{now:yy}-{now:MM}-";
        }

        // ── Save earmark ──────────────────────────────────────────────────────
        public int SaveEarmark(EarmarkModel model)
        {
            const string sql = @"
                INSERT INTO earmarks
                    (pr_no, earmarked_date,
                     rc_id, signatory_id, purpose,
                     activity_level_id, account_code_id, sub_account_code_id,
                     fund_id, fund_cluster, financing_source,
                     authorization_code, fund_category, full_funding_source,
                     department_code, agency_code, operating_unit, lower_level_unit,
                     amount, remarks, status, created_by)
                VALUES
                    (@pr_no, @earmarked_date,
                     @rc_id, @signatory_id, @purpose,
                     @activity_level_id, @account_code_id, @sub_account_code_id,
                     @fund_id, @fund_cluster, @financing_source,
                     @authorization_code, @fund_category, @full_funding_source,
                     @department_code, @agency_code, @operating_unit, @lower_level_unit,
                     @amount, @remarks, 'Pending', @created_by);
                SELECT LAST_INSERT_ID();";

            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(sql, conn);

            cmd.Parameters.AddWithValue("@pr_no",              model.PrNo);
            cmd.Parameters.AddWithValue("@earmarked_date",     model.EarmarkedDate);
            cmd.Parameters.AddWithValue("@rc_id",              model.RcId);
            cmd.Parameters.AddWithValue("@signatory_id",       model.SignatoryId);
            cmd.Parameters.AddWithValue("@purpose",            model.Purpose);
            cmd.Parameters.AddWithValue("@activity_level_id",  model.ActivityLevelId);
            cmd.Parameters.AddWithValue("@account_code_id",    model.AccountCodeId);
            cmd.Parameters.AddWithValue("@sub_account_code_id",
                model.SubAccountCodeId.HasValue ? (object)model.SubAccountCodeId.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@fund_id",
                model.FundId.HasValue ? (object)model.FundId.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@fund_cluster",        model.FundCluster       ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@financing_source",    model.FinancingSource   ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@authorization_code",  model.AuthorizationCode ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@fund_category",       model.FundCategory      ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@full_funding_source", model.FullFundingSource ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@department_code", department_code);
            cmd.Parameters.AddWithValue("@agency_code", agency_code);
            cmd.Parameters.AddWithValue("@operating_unit", operating_unit);
            cmd.Parameters.AddWithValue("@lower_level_unit", lower_level_unit);
            cmd.Parameters.AddWithValue("@amount",             model.Amount);
            cmd.Parameters.AddWithValue("@remarks",            model.Remarks ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@created_by",         model.CreatedBy ?? "system");

            conn.Open();
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        // ── Release earmark ───────────────────────────────────────────────────
        public void ReleaseEarmark(int id)
        {
            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(
                "UPDATE earmarks SET status = 'Released' WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", id);
            conn.Open();
            cmd.ExecuteNonQuery();
        }

        // ── Cancel earmark ────────────────────────────────────────────────────
        public void CancelEarmark(int id)
        {
            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(
                "UPDATE earmarks SET status = 'Cancelled' WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", id);
            conn.Open();
            cmd.ExecuteNonQuery();
        }

        // ── Delete earmark ────────────────────────────────────────────────────
        public void DeleteEarmark(int id)
        {
            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(
                "DELETE FROM earmarks WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", id);
            conn.Open();
            cmd.ExecuteNonQuery();
        }

        // ── Get earmarks list ─────────────────────────────────────────────────
        public List<EarmarkRecord> GetEarmarks()
        {
            const string sql = @"
                SELECT  e.id,
                        e.pr_no,
                        DATE_FORMAT(e.earmarked_date, '%Y-%m-%d') AS earmarked_date,
                        rc.name                                    AS rc_name,
                        LEFT(e.purpose, 60)                        AS purpose_short,
                        e.amount,
                        e.status,
                        COALESCE(e.fund_category, '')              AS fund_category,
                        COALESCE(e.remarks, '')                    AS remarks
                FROM    earmarks e
                INNER JOIN responsibility_center rc ON rc.id = e.rc_id
                ORDER BY e.created_at DESC
                LIMIT 100";

            var list = new List<EarmarkRecord>();
            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(sql, conn);
            conn.Open();
            using var rdr = cmd.ExecuteReader();
            while (rdr.Read())
            {
                list.Add(new EarmarkRecord
                {
                    Id            = rdr.GetInt32("id"),
                    PrNo          = rdr.GetString("pr_no"),
                    EarmarkedDate = rdr.GetString("earmarked_date"),
                    RcName        = rdr.GetString("rc_name"),
                    PurposeShort  = rdr.GetString("purpose_short"),
                    Amount        = rdr.GetDecimal("amount"),
                    Status        = rdr.GetString("status"),
                    FundCategory  = rdr.GetString("fund_category"),
                    Remarks       = rdr.GetString("remarks")
                });
            }
            return list;
        }

        // ── Summary stats ─────────────────────────────────────────────────────
        public EarmarkSummary GetSummary()
        {
            const string sql = @"
                SELECT
                    COALESCE(SUM(CASE WHEN status IN ('Pending','Released') THEN amount ELSE 0 END), 0) AS total,
                    COALESCE(SUM(CASE WHEN status = 'Released'              THEN amount ELSE 0 END), 0) AS released,
                    COALESCE(SUM(CASE WHEN status = 'Pending'               THEN amount ELSE 0 END), 0) AS pending
                FROM earmarks";

            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(sql, conn);
            conn.Open();
            using var rdr = cmd.ExecuteReader();
            rdr.Read();
            return new EarmarkSummary
            {
                Total    = rdr.GetDecimal("total"),
                Released = rdr.GetDecimal("released"),
                Pending  = rdr.GetDecimal("pending")
            };
        }

        // ── Fund detail ───────────────────────────────────────────────────────
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
                //Id                = rdr.GetInt32("id"),
                FundCluster       = rdr.GetString("fund_cluster"),
                FinancingSource   = rdr.GetString("financing_source"),
                AuthorizationCode = rdr.GetString("authorization_code"),
                FundCategory      = rdr.GetString("fund_category"),
                FullFundingSource = rdr.GetString("full_funding_source")
            };
        }
    }

    // ── Models ────────────────────────────────────────────────────────────────

    public class EarmarkModel
    {
        public string   PrNo             { get; set; } = "";
        public DateTime EarmarkedDate    { get; set; }       // renamed from PrDate
        public int      RcId             { get; set; }
        public int      SignatoryId      { get; set; }
        public string   Purpose          { get; set; } = "";
        public int      ActivityLevelId  { get; set; }
        public int      AccountCodeId    { get; set; }
        public int?     SubAccountCodeId { get; set; }
        public int?     FundId           { get; set; }
        public string?  FundCluster      { get; set; }
        public string?  FinancingSource  { get; set; }
        public string?  AuthorizationCode{ get; set; }
        public string?  FundCategory     { get; set; }
        public string?  FullFundingSource{ get; set; }
        public decimal  Amount           { get; set; }
        public string?  Remarks          { get; set; }       // target_date removed
        public string?  CreatedBy        { get; set; }
    }

    public class EarmarkRecord
    {
        public int     Id            { get; set; }
        public string  PrNo          { get; set; } = "";
        public string  EarmarkedDate { get; set; } = "";     // renamed from PrDate
        public string  RcName        { get; set; } = "";
        public string  PurposeShort  { get; set; } = "";
        public decimal Amount        { get; set; }
        public string  Status        { get; set; } = "";
        public string  FundCategory  { get; set; } = "";
        public string  Remarks       { get; set; } = "";
    }

    public class EarmarkSummary
    {
        public decimal Total    { get; set; }
        public decimal Released { get; set; }
        public decimal Pending  { get; set; }
    }
}

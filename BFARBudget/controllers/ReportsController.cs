using BFAR.EBudget.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MySql.Data.MySqlClient;

namespace BFAR.EBudget.Controllers
{
    /// <summary>
    /// Budget Reports API
    /// Base route: /api/reports
    /// </summary>
    [ApiController]
    [Route("api/reports")]
    public class ReportsController : ControllerBase
    {
        private readonly string _connStr;

        public ReportsController(IConfiguration config)
        {
            _connStr = config.GetConnectionString("BFARConn")
                       ?? throw new InvalidOperationException("BFARConn missing.");
        }

        private MySqlConnection Conn() => new MySqlConnection(_connStr);

        // ── GET /api/reports/fund-categories ──────────────────────────────────
        [HttpGet("fund-categories")]
        public IActionResult GetFundCategoriesForFilter()
        {
            try
            {
                var list = new List<object>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "SELECT id, fund_category FROM fund WHERE is_active = 1 ORDER BY fund_category", conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(new {
                        id   = rdr.GetInt32(0),
                        name = rdr.GetValue(1).ToString()
                    });
                return Ok(list);
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        // ── GET /api/reports/tree ──────────────────────────────────────────────
        // Returns the full hierarchical SAAODB tree:
        // Fund Cluster → Financing Source → Authorization Code → Fund Category
        //   → Expense Class → Account Code (with all 6 value columns)
        [HttpGet("tree")]
        public IActionResult GetTree(
            [FromQuery] string? fundId = null,
            [FromQuery] string? rcId   = null,
            [FromQuery] string? classId = null,
            [FromQuery] string? fiscalYear = null)
        {
            try
            {
                // ── 1. Get all relevant funds (filtered or all) ───────────────
                var fundFilter = (!string.IsNullOrWhiteSpace(fundId) && fundId != "all")
                    ? "WHERE f.id = @fundId" : "WHERE f.is_active = 1";

                var funds = new List<(int id, string cluster, string financing, string auth, string category)>();
                using (var conn = Conn())
                {
                    conn.Open();
                    using var cmd = new MySqlCommand($@"
                        SELECT f.id, f.fund_cluster, f.financing_source, f.authorization_code, f.fund_category
                        FROM   fund f
                        {fundFilter}
                        ORDER BY f.fund_cluster, f.financing_source, f.authorization_code, f.fund_category", conn);
                    if (!string.IsNullOrWhiteSpace(fundId) && fundId != "all")
                        cmd.Parameters.AddWithValue("@fundId", fundId);

                    using var rdr = cmd.ExecuteReader();
                    while (rdr.Read())
                        funds.Add((
                            rdr.GetInt32(0),
                            rdr.GetValue(1).ToString() ?? "",
                            rdr.GetValue(2).ToString() ?? "",
                            rdr.GetValue(3).ToString() ?? "",
                            rdr.GetValue(4).ToString() ?? ""
                        ));
                }

                // ── 2. Build the nested tree ───────────────────────────────────
                // Group: cluster -> financing -> authorization -> [fund nodes]
                var clusters = new List<object>();

                var byCluster = funds.GroupBy(f => f.cluster);
                foreach (var clusterGroup in byCluster)
                {
                    var financingNodes = new List<object>();
                    var byFinancing = clusterGroup.GroupBy(f => f.financing);

                    foreach (var financingGroup in byFinancing)
                    {
                        var authNodes = new List<object>();
                        var byAuth = financingGroup.GroupBy(f => f.auth);

                        foreach (var authGroup in byAuth)
                        {
                            var fundCategoryNodes = new List<object>();

                            foreach (var fund in authGroup)
                            {
                                var expenseClasses = GetExpenseClassNodes(fund.id, rcId, classId, fiscalYear);
                                var totals = SumTotals(expenseClasses);

                                fundCategoryNodes.Add(new
                                {
                                    label = fund.category,
                                    allotment    = totals.allotment,
                                    obligations  = totals.obligations,
                                    disbursements = totals.disbursements,
                                    unpaid       = totals.unpaid,
                                    unobligated  = totals.allotment - totals.obligations,
                                    earmarks     = totals.earmarks,
                                    expenseClasses
                                });
                            }

                            var authTotals = SumNodeTotals(fundCategoryNodes);
                            authNodes.Add(new
                            {
                                label = authGroup.Key,
                                allotment = authTotals.allotment, obligations = authTotals.obligations,
                                disbursements = authTotals.disbursements, unpaid = authTotals.unpaid,
                                unobligated = authTotals.unobligated, earmarks = authTotals.earmarks,
                                fundCategories = fundCategoryNodes
                            });
                        }

                        var finTotals = SumNodeTotals(authNodes);
                        financingNodes.Add(new
                        {
                            label = financingGroup.Key,
                            allotment = finTotals.allotment, obligations = finTotals.obligations,
                            disbursements = finTotals.disbursements, unpaid = finTotals.unpaid,
                            unobligated = finTotals.unobligated, earmarks = finTotals.earmarks,
                            authorizations = authNodes
                        });
                    }

                    var clusterTotals = SumNodeTotals(financingNodes);
                    clusters.Add(new
                    {
                        label = clusterGroup.Key,
                        allotment = clusterTotals.allotment, obligations = clusterTotals.obligations,
                        disbursements = clusterTotals.disbursements, unpaid = clusterTotals.unpaid,
                        unobligated = clusterTotals.unobligated, earmarks = clusterTotals.earmarks,
                        financingSources = financingNodes
                    });
                }

                return Ok(clusters);
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        // ── Helper: expense class + account code nodes for one fund ──────────
        private List<object> GetExpenseClassNodes(int fundId, string? rcId, string? classId, string? fiscalYear)
        {
            string rcFilter    = (!string.IsNullOrWhiteSpace(rcId) && rcId != "all") ? $"AND a.rc_id = {int.Parse(rcId)}" : "";
            string classFilter = (!string.IsNullOrWhiteSpace(classId) && classId != "all") ? $"AND a.expense_class_id = {int.Parse(classId)}" : "";
            string fyFilter    = (!string.IsNullOrWhiteSpace(fiscalYear) && fiscalYear != "all") ? $"AND a.fiscal_year = '{fiscalYear.Replace("'", "")}'" : "";

            string sql = $@"
                SELECT ec.id, ec.code, ec.name,
                       ac.id AS acct_id, ac.code AS acct_code, ac.description AS acct_desc,
                       COALESCE(a.amount, 0) AS allotment
                FROM   allotments a
                INNER JOIN expense_class ec ON ec.id = a.expense_class_id
                LEFT  JOIN account_code  ac ON ac.id = a.account_code_id
                WHERE  a.fund_id = {fundId} {rcFilter} {classFilter} {fyFilter}
                ORDER BY ec.name, ac.code";

            var rows = new List<(int ecId, string ecCode, string ecName, int? acctId, string acctCode, string acctDesc, decimal allotment)>();
            using (var conn = Conn())
            {
                conn.Open();
                using var cmd = new MySqlCommand(sql, conn);
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    rows.Add((
                        rdr.GetInt32(0),
                        rdr.GetValue(1).ToString() ?? "",
                        rdr.GetValue(2).ToString() ?? "",
                        rdr.IsDBNull(3) ? (int?)null : rdr.GetInt32(3),
                        rdr.IsDBNull(4) ? "" : rdr.GetValue(4).ToString() ?? "",
                        rdr.IsDBNull(5) ? "" : rdr.GetValue(5).ToString() ?? "",
                        rdr.GetDecimal(6)
                    ));
            }

            var classNodes = new List<object>();
            var byClass = rows.GroupBy(r => new { r.ecId, r.ecCode, r.ecName });

            foreach (var cls in byClass)
            {
                var acctNodes = new List<object>();
                foreach (var r in cls)
                {
                    if (r.acctId == null) continue;

                    var fig = GetObligationFigures(r.acctId.Value, rcId, fiscalYear);
                    acctNodes.Add(new
                    {
                        label         = $"{r.acctCode} - {r.acctDesc}",
                        accountCodeId = r.acctId,
                        allotment     = r.allotment,
                        obligations   = fig.obligations,
                        disbursements = fig.disbursements,
                        unpaid        = fig.unpaid,
                        unobligated   = r.allotment - fig.obligations,
                        earmarks      = fig.earmarks
                    });
                }

                decimal clsAllot = acctNodes.Sum(n => (decimal)n.GetType().GetProperty("allotment")!.GetValue(n)!);
                decimal clsObl   = acctNodes.Sum(n => (decimal)n.GetType().GetProperty("obligations")!.GetValue(n)!);
                decimal clsDisb  = acctNodes.Sum(n => (decimal)n.GetType().GetProperty("disbursements")!.GetValue(n)!);
                decimal clsUnpaid = acctNodes.Sum(n => (decimal)n.GetType().GetProperty("unpaid")!.GetValue(n)!);
                decimal clsEm    = acctNodes.Sum(n => (decimal)n.GetType().GetProperty("earmarks")!.GetValue(n)!);

                classNodes.Add(new
                {
                    label = $"{cls.Key.ecCode} - {cls.Key.ecName}",
                    expenseClassId = cls.Key.ecId,
                    allotment = clsAllot, obligations = clsObl, disbursements = clsDisb,
                    unpaid = clsUnpaid, unobligated = clsAllot - clsObl, earmarks = clsEm,
                    accountCodes = acctNodes
                });
            }

            return classNodes;
        }

        // ── Helper: obligation/disbursement/earmark figures per account code ──
        private (decimal obligations, decimal disbursements, decimal unpaid, decimal earmarks)
            GetObligationFigures(int accountCodeId, string? rcId, string? fiscalYear)
        {
            string rcFilterO  = (!string.IsNullOrWhiteSpace(rcId) && rcId != "all") ? $"AND o.rc_id = {int.Parse(rcId)}" : "";
            string fyFilterO  = (!string.IsNullOrWhiteSpace(fiscalYear) && fiscalYear != "all") ? $"AND YEAR(o.ors_date) = {int.Parse(fiscalYear)}" : "";
            string rcFilterE  = (!string.IsNullOrWhiteSpace(rcId) && rcId != "all") ? $"AND e.rc_id = {int.Parse(rcId)}" : "";
            string fyFilterE  = (!string.IsNullOrWhiteSpace(fiscalYear) && fiscalYear != "all") ? $"AND YEAR(e.earmarked_date) = {int.Parse(fiscalYear)}" : "";

            decimal obl = RunScalar($@"
                SELECT COALESCE(SUM(amount),0) FROM obligations o
                WHERE o.account_code_id = {accountCodeId} {rcFilterO} {fyFilterO}");

            decimal disb = RunScalar($@"
                SELECT COALESCE(SUM(amount),0) FROM obligations o
                WHERE o.account_code_id = {accountCodeId} AND o.status = 'Posted' {rcFilterO} {fyFilterO}");

            decimal unpaid = RunScalar($@"
                SELECT COALESCE(SUM(amount),0) FROM obligations o
                WHERE o.account_code_id = {accountCodeId} AND o.status = 'Pending' {rcFilterO} {fyFilterO}");

            decimal em = RunScalar($@"
                SELECT COALESCE(SUM(amount),0) FROM earmarks e
                WHERE e.account_code_id = {accountCodeId} AND e.status = 'Pending' {rcFilterE} {fyFilterE}");

            return (obl, disb, unpaid, em);
        }

        // ── Helper: sum totals from a list of expense class nodes ────────────
        private (decimal allotment, decimal obligations, decimal disbursements, decimal unpaid, decimal earmarks)
            SumTotals(List<object> expenseClassNodes)
        {
            decimal allot = 0, obl = 0, disb = 0, unpaid = 0, em = 0;
            foreach (var node in expenseClassNodes)
            {
                var t = node.GetType();
                allot  += (decimal)t.GetProperty("allotment")!.GetValue(node)!;
                obl    += (decimal)t.GetProperty("obligations")!.GetValue(node)!;
                disb   += (decimal)t.GetProperty("disbursements")!.GetValue(node)!;
                unpaid += (decimal)t.GetProperty("unpaid")!.GetValue(node)!;
                em     += (decimal)t.GetProperty("earmarks")!.GetValue(node)!;
            }
            return (allot, obl, disb, unpaid, em);
        }

        // ── Helper: sum totals from any node list with allotment/obligations/etc ──
        private (decimal allotment, decimal obligations, decimal disbursements, decimal unpaid, decimal unobligated, decimal earmarks)
            SumNodeTotals(List<object> nodes)
        {
            decimal allot = 0, obl = 0, disb = 0, unpaid = 0, em = 0;
            foreach (var node in nodes)
            {
                var t = node.GetType();
                allot  += (decimal)t.GetProperty("allotment")!.GetValue(node)!;
                obl    += (decimal)t.GetProperty("obligations")!.GetValue(node)!;
                disb   += (decimal)t.GetProperty("disbursements")!.GetValue(node)!;
                unpaid += (decimal)t.GetProperty("unpaid")!.GetValue(node)!;
                em     += (decimal)t.GetProperty("earmarks")!.GetValue(node)!;
            }
            return (allot, obl, disb, unpaid, allot - obl, em);
        }

        // ── GET /api/reports/fiscal-years ─────────────────────────────────────
        // Returns distinct fiscal years from obligations + earmarks + allotments
        [HttpGet("fiscal-years")]
        public IActionResult GetFiscalYears()
        {
            try
            {
                const string sql = @"
                    SELECT DISTINCT fiscal_year AS fy FROM allotments
                    UNION
                    SELECT DISTINCT YEAR(ors_date) FROM obligations
                    UNION
                    SELECT DISTINCT YEAR(earmarked_date) FROM earmarks
                    ORDER BY fy DESC";

                var list = new List<string>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(sql, conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(rdr.GetValue(0).ToString() ?? "");
                return Ok(list.Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().OrderByDescending(x => x).ToList());
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        // ── GET /api/reports/summary ──────────────────────────────────────────
        // Returns SAAODB summary filtered by RC, expense class, fiscal year
        // All filters are optional — omit or pass "all" to include all
        [HttpGet("summary")]
        public IActionResult GetSummary(
            [FromQuery] string? rcId       = null,
            [FromQuery] string? classId    = null,
            [FromQuery] string? fiscalYear = null)
        {
            try
            {
                // ── Allotment per RC + Expense Class ──────────────────────────
                var allotWhere  = new List<string>();
                var allotParams = new List<MySqlParameter>();

                if (!string.IsNullOrWhiteSpace(rcId) && rcId != "all")
                {
                    allotWhere.Add("a.rc_id = @rcId");
                    allotParams.Add(new MySqlParameter("@rcId", rcId));
                }
                if (!string.IsNullOrWhiteSpace(classId) && classId != "all")
                {
                    allotWhere.Add("a.expense_class_id = @classId");
                    allotParams.Add(new MySqlParameter("@classId", classId));
                }
                if (!string.IsNullOrWhiteSpace(fiscalYear) && fiscalYear != "all")
                {
                    allotWhere.Add("a.fiscal_year = @fy");
                    allotParams.Add(new MySqlParameter("@fy", fiscalYear));
                }

                string allotFilter = allotWhere.Count > 0 ? "WHERE " + string.Join(" AND ", allotWhere) : "";

                // ── Obligation filters ────────────────────────────────────────
                var oblWhere  = new List<string>();
                var oblParams = new List<MySqlParameter>();

                if (!string.IsNullOrWhiteSpace(rcId) && rcId != "all")
                {
                    oblWhere.Add("o.rc_id = @rcId");
                    oblParams.Add(new MySqlParameter("@rcId", rcId));
                }
                if (!string.IsNullOrWhiteSpace(classId) && classId != "all")
                {
                    // Join to account_code → expense_type → expense_class
                    oblWhere.Add("EXISTS (SELECT 1 FROM account_code ac INNER JOIN expense_type et ON et.id = ac.expense_type_id WHERE ac.id = o.account_code_id AND et.expense_class_id = @classId)");
                    oblParams.Add(new MySqlParameter("@classId", classId));
                }
                if (!string.IsNullOrWhiteSpace(fiscalYear) && fiscalYear != "all")
                {
                    oblWhere.Add("YEAR(o.ors_date) = @fy");
                    oblParams.Add(new MySqlParameter("@fy", fiscalYear));
                }

                string oblFilter = oblWhere.Count > 0 ? "WHERE " + string.Join(" AND ", oblWhere) : "";

                // ── Earmark filters ───────────────────────────────────────────
                var emWhere  = new List<string>();
                var emParams = new List<MySqlParameter>();

                if (!string.IsNullOrWhiteSpace(rcId) && rcId != "all")
                {
                    emWhere.Add("e.rc_id = @rcId");
                    emParams.Add(new MySqlParameter("@rcId", rcId));
                }
                if (!string.IsNullOrWhiteSpace(classId) && classId != "all")
                {
                    emWhere.Add("EXISTS (SELECT 1 FROM account_code ac INNER JOIN expense_type et ON et.id = ac.expense_type_id WHERE ac.id = e.account_code_id AND et.expense_class_id = @classId)");
                    emParams.Add(new MySqlParameter("@classId", classId));
                }
                if (!string.IsNullOrWhiteSpace(fiscalYear) && fiscalYear != "all")
                {
                    emWhere.Add("YEAR(e.earmarked_date) = @fy");
                    emParams.Add(new MySqlParameter("@fy", fiscalYear));
                }

                string emFilter = emWhere.Count > 0 ? "WHERE " + string.Join(" AND ", emWhere) : "";

                using var conn = Conn();
                conn.Open();

                // 1. Total Allotment
                decimal totalAllotment = QueryScalar(conn,
                    $"SELECT COALESCE(SUM(a.amount),0) FROM allotments a {allotFilter}",
                    allotParams);

                // 2. Total Obligations
                decimal totalObligations = QueryScalar(conn,
                    $"SELECT COALESCE(SUM(o.amount),0) FROM obligations o {oblFilter}",
                    oblParams);

                // 3. Posted (disbursed) obligations
                decimal disbursements = QueryScalar(conn,
                    $"SELECT COALESCE(SUM(o.amount),0) FROM obligations o {(oblFilter.Length > 0 ? oblFilter + " AND" : "WHERE")} o.status = 'Posted'",
                    oblParams);

                // 4. Pending/unpaid obligations
                decimal unpaid = QueryScalar(conn,
                    $"SELECT COALESCE(SUM(o.amount),0) FROM obligations o {(oblFilter.Length > 0 ? oblFilter + " AND" : "WHERE")} o.status = 'Pending'",
                    oblParams);

                // 5. Total Earmarks (pending only)
                decimal totalEarmarks = QueryScalar(conn,
                    $"SELECT COALESCE(SUM(e.amount),0) FROM earmarks e {(emFilter.Length > 0 ? emFilter + " AND" : "WHERE")} e.status = 'Pending'",
                    emParams);

                // 6. Unobligated balance
                decimal unobligated = totalAllotment - totalObligations;

                // ── Per-RC breakdown ──────────────────────────────────────────
                var breakdown = GetRCBreakdown(conn, rcId, classId, fiscalYear);

                // ── Per-expense-class breakdown ───────────────────────────────
                var byClass = GetClassBreakdown(conn, rcId, classId, fiscalYear);

                return Ok(new
                {
                    totalAllotment,
                    totalObligations,
                    disbursements,
                    unpaid,
                    totalEarmarks,
                    unobligated,
                    utilizationPct = totalAllotment > 0
                        ? Math.Round((totalObligations / totalAllotment) * 100, 2) : 0,
                    breakdown,
                    byClass
                });
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        // ── Helper: run scalar query ──────────────────────────────────────────
        private static decimal QueryScalar(MySqlConnection conn, string sql, List<MySqlParameter> parms)
        {
            using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddRange(parms.Select(p => new MySqlParameter(p.ParameterName, p.Value)).ToArray());
            var result = cmd.ExecuteScalar();
            return result == null || result == DBNull.Value ? 0 : Convert.ToDecimal(result);
        }

        // ── Per-RC breakdown ──────────────────────────────────────────────────
        private List<object> GetRCBreakdown(MySqlConnection conn,
            string? rcId, string? classId, string? fiscalYear)
        {
            var rcFilter    = (!string.IsNullOrWhiteSpace(rcId) && rcId != "all") ? "AND a.rc_id = @rcId" : "";
            var classFilter = (!string.IsNullOrWhiteSpace(classId) && classId != "all") ? "AND a.expense_class_id = @classId" : "";
            var fyFilter    = (!string.IsNullOrWhiteSpace(fiscalYear) && fiscalYear != "all") ? "AND a.fiscal_year = @fy" : "";

            string sql = $@"
                SELECT rc.id, rc.name,
                       COALESCE(SUM(a.amount), 0) AS allotment
                FROM   responsibility_center rc
                LEFT JOIN allotments a ON a.rc_id = rc.id {rcFilter} {classFilter} {fyFilter}
                GROUP BY rc.id, rc.name
                ORDER BY rc.name";

            var list = new List<object>();
            using var cmd = new MySqlCommand(sql, conn);
            if (!string.IsNullOrWhiteSpace(rcId) && rcId != "all") cmd.Parameters.AddWithValue("@rcId", rcId);
            if (!string.IsNullOrWhiteSpace(classId) && classId != "all") cmd.Parameters.AddWithValue("@classId", classId);
            if (!string.IsNullOrWhiteSpace(fiscalYear) && fiscalYear != "all") cmd.Parameters.AddWithValue("@fy", fiscalYear);

            using var rdr = cmd.ExecuteReader();
            while (rdr.Read())
            {
                int    id        = rdr.GetInt32(0);
                string name      = rdr.GetValue(1).ToString() ?? "";
                decimal allot    = rdr.GetDecimal(2);
                list.Add(new { id, name, allotment = allot });
            }
            return list;
        }

        // ── Per-expense-class breakdown ───────────────────────────────────────
        private List<object> GetClassBreakdown(MySqlConnection conn,
            string? rcId, string? classId, string? fiscalYear)
        {
            var rcFilter    = (!string.IsNullOrWhiteSpace(rcId) && rcId != "all") ? "AND a.rc_id = @rcId" : "";
            var classFilter = (!string.IsNullOrWhiteSpace(classId) && classId != "all") ? "AND a.expense_class_id = @classId" : "";
            var fyFilter    = (!string.IsNullOrWhiteSpace(fiscalYear) && fiscalYear != "all") ? "AND a.fiscal_year = @fy" : "";

            string sql = $@"
                SELECT ec.id, ec.code, ec.name,
                       COALESCE(SUM(a.amount), 0) AS allotment
                FROM   expense_class ec
                LEFT JOIN allotments a ON a.expense_class_id = ec.id {rcFilter} {classFilter} {fyFilter}
                WHERE  ec.is_active = 1
                GROUP BY ec.id, ec.code, ec.name
                ORDER BY ec.name";

            // Read all rows into memory first before closing the reader
            var rows = new List<(int id, string code, string name, decimal allotment)>();
            using var cmd = new MySqlCommand(sql, conn);
            if (!string.IsNullOrWhiteSpace(rcId)       && rcId != "all")       cmd.Parameters.AddWithValue("@rcId",    rcId);
            if (!string.IsNullOrWhiteSpace(classId)    && classId != "all")    cmd.Parameters.AddWithValue("@classId", classId);
            if (!string.IsNullOrWhiteSpace(fiscalYear) && fiscalYear != "all") cmd.Parameters.AddWithValue("@fy",      fiscalYear);

            using (var rdr = cmd.ExecuteReader())
            {
                while (rdr.Read())
                    rows.Add((
                        rdr.GetInt32(0),
                        rdr.GetValue(1).ToString() ?? "",
                        rdr.GetValue(2).ToString() ?? "",
                        rdr.GetDecimal(3)
                    ));
            } // reader closed here

            // Now run the sub-queries using SEPARATE connections (no open reader conflict)
            var list = new List<object>();
            foreach (var row in rows)
            {
                string oblBase = $@"
                    SELECT COALESCE(SUM(o.amount),0)
                    FROM   obligations o
                    INNER JOIN account_code ac ON ac.id = o.account_code_id
                    INNER JOIN expense_type et ON et.id = ac.expense_type_id
                    WHERE  et.expense_class_id = {row.id}
                    {(!string.IsNullOrWhiteSpace(rcId) && rcId != "all" ? $"AND o.rc_id = {rcId}" : "")}
                    {(!string.IsNullOrWhiteSpace(fiscalYear) && fiscalYear != "all" ? $"AND YEAR(o.ors_date) = {fiscalYear}" : "")}";

                string emBase = $@"
                    SELECT COALESCE(SUM(e.amount),0)
                    FROM   earmarks e
                    INNER JOIN account_code ac ON ac.id = e.account_code_id
                    INNER JOIN expense_type et ON et.id = ac.expense_type_id
                    WHERE  et.expense_class_id = {row.id}
                    AND    e.status = 'Pending'
                    {(!string.IsNullOrWhiteSpace(rcId) && rcId != "all" ? $"AND e.rc_id = {rcId}" : "")}
                    {(!string.IsNullOrWhiteSpace(fiscalYear) && fiscalYear != "all" ? $"AND YEAR(e.earmarked_date) = {fiscalYear}" : "")}";

                // Each uses its OWN connection
                decimal obl   = RunScalar(oblBase);
                decimal disb  = RunScalar(oblBase.Replace("COALESCE(SUM(o.amount),0)", "COALESCE(SUM(o.amount),0)").Replace("WHERE  et.expense_class_id", "AND o.status = 'Posted'\n                    --WHERE  et.expense_class_id").Replace("\n                    --WHERE", "\n                    WHERE"));
                decimal unpaid = RunScalar(oblBase + " AND o.status = 'Pending'");
                disb  = RunScalar(oblBase + " AND o.status = 'Posted'");
                decimal em    = RunScalar(emBase);

                list.Add(new {
                    id            = row.id,
                    code          = row.code,
                    name          = row.name,
                    allotment     = row.allotment,
                    obligations   = obl,
                    disbursements = disb,
                    unpaid        = unpaid,
                    earmarks      = em,
                    unobligated   = row.allotment - obl
                });
            }
            return list;
        }

        // Runs a scalar query on a FRESH connection each time
        private decimal RunScalar(string sql)
        {
            using var conn = Conn();
            using var cmd  = new MySqlCommand(sql, conn);
            conn.Open();
            var result = cmd.ExecuteScalar();
            return result == null || result == DBNull.Value ? 0 : Convert.ToDecimal(result);
        }
    }
}

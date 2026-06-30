using BFAR.EBudget.Auth;
using BFAR.EBudget.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MySql.Data.MySqlClient;
using System.Text.Json.Serialization;

namespace BFAR.EBudget.Controllers
{
    /// <summary>
    /// Full CRUD for Manage Data page.
    /// Base route: /api/manage
    /// </summary>
    [ApiController]
    [Route("api/manage")]
    public class ManageController : ControllerBase
    {
        private readonly string _connStr;
        private readonly AuthData _authData;

        public ManageController(IConfiguration config, AuthData authData)
        {
            _connStr  = config.GetConnectionString("BFARConn")
                        ?? throw new InvalidOperationException("BFARConn missing.");
            _authData = authData;
        }

        // ── helpers ──────────────────────────────────────────────────────────
        private MySqlConnection Conn() => new MySqlConnection(_connStr);

        // ════════════════════════════════════════════════════════════════════
        // RESPONSIBILITY CENTERS
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("responsibility-centers")]
        public IActionResult GetRCs()
        {
            try
            {
                const string sql = @"
                    SELECT rc.id, rc.code, rc.name,
                           COALESCE(rc.is_active, 1) AS is_active,
                           COUNT(s.id)               AS signatory_count
                    FROM   responsibility_center rc
                    LEFT JOIN signatory s ON s.rc_id = rc.id
                    GROUP BY rc.id, rc.code, rc.name, rc.is_active
                    ORDER BY rc.name";

                var list = new List<object>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(sql, conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(new {
                        id             = rdr.GetInt32(rdr.GetOrdinal("id")),
                        code           = rdr.GetValue(rdr.GetOrdinal("code")).ToString(),
                        name           = rdr.GetValue(rdr.GetOrdinal("name")).ToString(),
                        isActive       = rdr.GetValue(rdr.GetOrdinal("is_active")).ToString() == "1",
                        signatoryCount = rdr.GetInt32(rdr.GetOrdinal("signatory_count"))
                    });
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("responsibility-centers")]
        public IActionResult AddRC([FromBody] System.Text.Json.JsonElement body)
        {
            string code = body.TryGetProperty("code", out var c) ? c.GetString() ?? "" : "";
            string name = body.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
                return BadRequest(new { error = "Code and Name are required." });

            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "INSERT INTO responsibility_center (code, name) VALUES (@c, @n)", conn);
                cmd.Parameters.AddWithValue("@c", code.ToUpper());
                cmd.Parameters.AddWithValue("@n", name);
                conn.Open();
                cmd.ExecuteNonQuery();
                return Ok(new { message = $"RC '{code}' added." });
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                return Conflict(new { error = $"RC code '{code}' already exists." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("responsibility-centers/{id}")]
        public IActionResult DeleteRC(int id)
        {
            using var conn = Conn();
            conn.Open();
            using var cmd = new MySqlCommand(
                "DELETE FROM responsibility_center WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", id);
            cmd.ExecuteNonQuery();
            return Ok(new { message = "RC deleted." });
        }

        // ════════════════════════════════════════════════════════════════════
        // SIGNATORIES
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("signatories")]
        public IActionResult GetSignatories()
        {
            try
            {
                const string sql = @"
                    SELECT s.id, s.name, s.position, rc.name AS rc_name
                    FROM   signatory s
                    INNER JOIN responsibility_center rc ON rc.id = s.rc_id
                    ORDER BY rc.name, s.name";

                var list = new List<object>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(sql, conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(new {
                        id       = rdr.GetInt32(rdr.GetOrdinal("id")),
                        name     = rdr.GetValue(rdr.GetOrdinal("name")).ToString(),
                        position = rdr.GetValue(rdr.GetOrdinal("position")).ToString(),
                        rcName   = rdr.GetValue(rdr.GetOrdinal("rc_name")).ToString()
                    });
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("signatories")]
        public IActionResult AddSignatory([FromBody] System.Text.Json.JsonElement body)
        {
            int    rcId     = body.TryGetProperty("rcId",     out var r) ? r.GetInt32() : 0;
            string name     = body.TryGetProperty("name",     out var n) ? n.GetString() ?? "" : "";
            string position = body.TryGetProperty("position", out var p) ? p.GetString() ?? "" : "";
            if (rcId <= 0 || string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(position))
                return BadRequest(new { error = "All signatory fields are required." });

            using var conn = Conn();
            using var cmd  = new MySqlCommand(
                "INSERT INTO signatory (rc_id, name, position) VALUES (@r, @n, @p)", conn);
            cmd.Parameters.AddWithValue("@r", rcId);
            cmd.Parameters.AddWithValue("@n", name);
            cmd.Parameters.AddWithValue("@p", position);
            conn.Open(); cmd.ExecuteNonQuery();
            return Ok(new { message = $"Signatory '{name}' added." });
        }

        [HttpDelete("signatories/{id}")]
        public IActionResult DeleteSignatory(int id)
        {
            using var conn = Conn();
            using var cmd  = new MySqlCommand(
                "UPDATE signatory SET is_active = 0 WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", id);
            conn.Open(); cmd.ExecuteNonQuery();
            return Ok(new { message = "Signatory removed." });
        }

        // ════════════════════════════════════════════════════════════════════
        // FUND CATEGORIES
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("funds")]
        public IActionResult GetFunds()
        {
            try
            {
                const string sql = @"
                    SELECT id, fund_cluster, financing_source, authorization_code,
                           fund_category, full_funding_source
                    FROM   fund WHERE is_active = 1 ORDER BY fund_category";

                var list = new List<object>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(sql, conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(new {
                        id                = rdr.GetInt32(rdr.GetOrdinal("id")),
                        fundCluster       = rdr.GetValue(rdr.GetOrdinal("fund_cluster")).ToString(),
                        financingSource   = rdr.GetValue(rdr.GetOrdinal("financing_source")).ToString(),
                        authorizationCode = rdr.GetValue(rdr.GetOrdinal("authorization_code")).ToString(),
                        fundCategory      = rdr.GetValue(rdr.GetOrdinal("fund_category")).ToString(),
                        fullFundingSource = rdr.GetValue(rdr.GetOrdinal("full_funding_source")).ToString()
                    });
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("funds")]
        public IActionResult AddFund([FromBody] System.Text.Json.JsonElement body)
        {
            string cluster  = body.TryGetProperty("fundCluster",       out var a) ? a.GetString() ?? "" : "";
            string fin      = body.TryGetProperty("financingSource",   out var b) ? b.GetString() ?? "" : "";
            string auth     = body.TryGetProperty("authorizationCode", out var c) ? c.GetString() ?? "" : "";
            string cat      = body.TryGetProperty("fundCategory",      out var d) ? d.GetString() ?? "" : "";
            string full     = body.TryGetProperty("fullFundingSource", out var e) ? e.GetString() ?? "" : "";

            if (new[] { cluster, fin, auth, cat, full }.Any(string.IsNullOrWhiteSpace))
                return BadRequest(new { error = "All fund fields are required." });

            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(@"
                    INSERT INTO fund (fund_cluster, financing_source, authorization_code,
                                     fund_category, full_funding_source)
                    VALUES (@a, @b, @c, @d, @e)", conn);
                cmd.Parameters.AddWithValue("@a", cluster);
                cmd.Parameters.AddWithValue("@b", fin);
                cmd.Parameters.AddWithValue("@c", auth);
                cmd.Parameters.AddWithValue("@d", cat);
                cmd.Parameters.AddWithValue("@e", full);
                conn.Open(); cmd.ExecuteNonQuery();
                return Ok(new { message = "Fund Category added." });
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            { return Conflict(new { error = "This Fund Category already exists." }); }
        }

        [HttpDelete("funds/{id}")]
        public IActionResult DeleteFund(int id)
        {
            using var conn = Conn();
            using var cmd  = new MySqlCommand(
                "UPDATE fund SET is_active = 0 WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", id);
            conn.Open(); cmd.ExecuteNonQuery();
            return Ok(new { message = "Fund Category removed." });
        }

        // ════════════════════════════════════════════════════════════════════
        // EXPENSE CLASSES
        // ════════════════════════════════════════════════════════════════════

        [HttpPost("expense-classes")]
        public IActionResult AddExpenseClass([FromBody] System.Text.Json.JsonElement body)
        {
            string code = body.TryGetProperty("code", out var c) ? c.GetString() ?? "" : "";
            string name = body.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
            if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
                return BadRequest(new { error = "Code and Name are required." });

            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "INSERT INTO expense_class (code, name) VALUES (@c, @n)", conn);
                cmd.Parameters.AddWithValue("@c", code.ToUpper());
                cmd.Parameters.AddWithValue("@n", name);
                conn.Open(); cmd.ExecuteNonQuery();
                return Ok(new { message = $"Expense Class '{code}' added." });
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            { return Conflict(new { error = $"Expense Class '{code}' already exists." }); }
        }

        [HttpDelete("expense-classes/{id}")]
        public IActionResult DeleteExpenseClass(int id)
        {
            using var conn = Conn();
            using var cmd  = new MySqlCommand(
                "UPDATE expense_class SET is_active = 0 WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", id);
            conn.Open(); cmd.ExecuteNonQuery();
            return Ok(new { message = "Expense Class removed." });
        }

        // ════════════════════════════════════════════════════════════════════
        // EXPENSE TYPES
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("expense-types")]
        public IActionResult GetExpenseTypes()
        {
            try
            {
                const string sql = @"
                    SELECT et.id, et.name, ec.name AS class_name
                    FROM   expense_type et
                    INNER JOIN expense_class ec ON ec.id = et.expense_class_id
                    WHERE  et.is_active = 1 ORDER BY ec.name, et.name";

                var list = new List<object>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(sql, conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(new {
                        id        = rdr.GetInt32(rdr.GetOrdinal("id")),
                        name      = rdr.GetValue(rdr.GetOrdinal("name")).ToString(),
                        className = rdr.GetValue(rdr.GetOrdinal("class_name")).ToString()
                    });
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("expense-types")]
        public IActionResult AddExpenseType([FromBody] System.Text.Json.JsonElement body)
        {
            int    classId = body.TryGetProperty("expenseClassId", out var c) ? c.GetInt32() : 0;
            string name    = body.TryGetProperty("name",           out var n) ? n.GetString() ?? "" : "";
            if (classId <= 0 || string.IsNullOrWhiteSpace(name))
                return BadRequest(new { error = "Expense Class and Name are required." });

            using var conn = Conn();
            using var cmd  = new MySqlCommand(
                "INSERT INTO expense_type (expense_class_id, name) VALUES (@c, @n)", conn);
            cmd.Parameters.AddWithValue("@c", classId);
            cmd.Parameters.AddWithValue("@n", name);
            conn.Open(); cmd.ExecuteNonQuery();
            return Ok(new { message = $"Expense Type '{name}' added." });
        }

        [HttpDelete("expense-types/{id}")]
        public IActionResult DeleteExpenseType(int id)
        {
            using var conn = Conn();
            using var cmd  = new MySqlCommand(
                "UPDATE expense_type SET is_active = 0 WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", id);
            conn.Open(); cmd.ExecuteNonQuery();
            return Ok(new { message = "Expense Type removed." });
        }

        // ════════════════════════════════════════════════════════════════════
        // ACCOUNT CODES
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("account-codes")]
        public IActionResult GetAccountCodes()
        {
            try
            {
                const string sql = @"
                    SELECT ac.id, ac.code, ac.description, et.name AS type_name
                    FROM   account_code ac
                    INNER JOIN expense_type et ON et.id = ac.expense_type_id
                    WHERE  ac.is_active = 1 ORDER BY ac.code";

                var list = new List<object>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(sql, conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(new {
                        id          = rdr.GetInt32(rdr.GetOrdinal("id")),
                        code        = rdr.GetValue(rdr.GetOrdinal("code")).ToString(),
                        description = rdr.GetValue(rdr.GetOrdinal("description")).ToString(),
                        typeName    = rdr.GetValue(rdr.GetOrdinal("type_name")).ToString()
                    });
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("account-codes")]
        public IActionResult AddAccountCode([FromBody] System.Text.Json.JsonElement body)
        {
            int    typeId = body.TryGetProperty("expenseTypeId", out var t) ? t.GetInt32() : 0;
            string code   = body.TryGetProperty("code",          out var c) ? c.GetString() ?? "" : "";
            string desc   = body.TryGetProperty("description",   out var d) ? d.GetString() ?? "" : "";
            if (typeId <= 0 || string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(desc))
                return BadRequest(new { error = "All account code fields are required." });

            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "INSERT INTO account_code (expense_type_id, code, description) VALUES (@t, @c, @d)", conn);
                cmd.Parameters.AddWithValue("@t", typeId);
                cmd.Parameters.AddWithValue("@c", code);
                cmd.Parameters.AddWithValue("@d", desc);
                conn.Open(); cmd.ExecuteNonQuery();
                return Ok(new { message = $"Account Code '{code}' added." });
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            { return Conflict(new { error = $"Account Code '{code}' already exists." }); }
        }

        [HttpDelete("account-codes/{id}")]
        public IActionResult DeleteAccountCode(int id)
        {
            using var conn = Conn();
            using var cmd  = new MySqlCommand(
                "UPDATE account_code SET is_active = 0 WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", id);
            conn.Open(); cmd.ExecuteNonQuery();
            return Ok(new { message = "Account Code removed." });
        }

        // ════════════════════════════════════════════════════════════════════
        // SUB ACCOUNT CODES
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("sub-account-codes")]
        public IActionResult GetSubAccountCodes()
        {
            try
            {
                const string sql = @"
                    SELECT s.id, s.code, s.description,
                           CONCAT(ac.code, ' – ', ac.description) AS account_code
                    FROM   sub_account_code s
                    INNER JOIN account_code ac ON ac.id = s.account_code_id
                    WHERE  s.is_active = 1
                    ORDER BY ac.code, s.code";

                var list = new List<object>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(sql, conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(new {
                        id          = rdr.GetInt32(rdr.GetOrdinal("id")),
                        code        = rdr.GetValue(rdr.GetOrdinal("code")).ToString(),
                        description = rdr.GetValue(rdr.GetOrdinal("description")).ToString(),
                        accountCode = rdr.GetValue(rdr.GetOrdinal("account_code")).ToString()
                    });
                return Ok(list);
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        [HttpPost("sub-account-codes")]
        public IActionResult AddSubAccountCode([FromBody] System.Text.Json.JsonElement body)
        {
            int    acctId = body.TryGetProperty("accountCodeId", out var a) ? a.GetInt32()    : 0;
            string code   = body.TryGetProperty("code",          out var c) ? c.GetString() ?? "" : "";
            string desc   = body.TryGetProperty("description",   out var d) ? d.GetString() ?? "" : "";
            if (acctId <= 0 || string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(desc))
                return BadRequest(new { error = "All sub-account code fields are required." });

            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "INSERT INTO sub_account_code (account_code_id, code, description) VALUES (@a, @c, @d)", conn);
                cmd.Parameters.AddWithValue("@a", acctId);
                cmd.Parameters.AddWithValue("@c", code);
                cmd.Parameters.AddWithValue("@d", desc);
                conn.Open(); cmd.ExecuteNonQuery();
                return Ok(new { message = $"Sub-Account Code '{code}' added." });
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            { return Conflict(new { error = $"Sub-Account Code '{code}' already exists for this account code." }); }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        [HttpDelete("sub-account-codes/{id}")]
        public IActionResult DeleteSubAccountCode(int id)
        {
            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "UPDATE sub_account_code SET is_active = 0 WHERE id = @id", conn);
                cmd.Parameters.AddWithValue("@id", id);
                conn.Open(); cmd.ExecuteNonQuery();
                return Ok(new { message = "Sub-Account Code removed." });
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        // ════════════════════════════════════════════════════════════════════
        // PROGRAMS / PROJECTS
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("programs")]
        public IActionResult GetPrograms()
        {
            try
            {
                var list = new List<object>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "SELECT id, name FROM program WHERE is_active = 1 ORDER BY name", conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(new {
                        id   = rdr.GetInt32(rdr.GetOrdinal("id")),
                        name = rdr.GetValue(rdr.GetOrdinal("name")).ToString()
                    });
                return Ok(list);
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        [HttpPost("programs")]
        public IActionResult AddProgram([FromBody] System.Text.Json.JsonElement body)
        {
            string name = body.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { error = "Program name is required." });
            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "INSERT INTO program (name) VALUES (@n)", conn);
                cmd.Parameters.AddWithValue("@n", name);
                conn.Open(); cmd.ExecuteNonQuery();
                return Ok(new { message = $"Program '{name}' added." });
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        [HttpDelete("programs/{id}")]
        public IActionResult DeleteProgram(int id)
        {
            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "UPDATE program SET is_active = 0 WHERE id = @id", conn);
                cmd.Parameters.AddWithValue("@id", id);
                conn.Open(); cmd.ExecuteNonQuery();
                return Ok(new { message = "Program removed." });
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        // ════════════════════════════════════════════════════════════════════
        // PROJECT CATEGORIES
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("project-categories")]
        public IActionResult GetProjectCategories()
        {
            try
            {
                const string sql = @"
                    SELECT pc.id, pc.name, pc.program_id, p.name AS program_name
                    FROM   project_category pc
                    INNER JOIN program p ON p.id = pc.program_id
                    WHERE  pc.is_active = 1
                    ORDER BY p.name, pc.name";

                var list = new List<object>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(sql, conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(new {
                        id          = rdr.GetInt32(rdr.GetOrdinal("id")),
                        name        = rdr.GetValue(rdr.GetOrdinal("name")).ToString(),
                        programId   = rdr.GetInt32(rdr.GetOrdinal("program_id")),
                        programName = rdr.GetValue(rdr.GetOrdinal("program_name")).ToString()
                    });
                return Ok(list);
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        [HttpPost("project-categories")]
        public IActionResult AddProjectCategory([FromBody] System.Text.Json.JsonElement body)
        {
            int    progId = body.TryGetProperty("programId", out var p) ? p.GetInt32()    : 0;
            string name   = body.TryGetProperty("name",      out var n) ? n.GetString() ?? "" : "";
            if (progId <= 0 || string.IsNullOrWhiteSpace(name))
                return BadRequest(new { error = "Program and Category Name are required." });
            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "INSERT INTO project_category (program_id, name) VALUES (@p, @n)", conn);
                cmd.Parameters.AddWithValue("@p", progId);
                cmd.Parameters.AddWithValue("@n", name);
                conn.Open(); cmd.ExecuteNonQuery();
                return Ok(new { message = $"Project Category '{name}' added." });
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        [HttpDelete("project-categories/{id}")]
        public IActionResult DeleteProjectCategory(int id)
        {
            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "UPDATE project_category SET is_active = 0 WHERE id = @id", conn);
                cmd.Parameters.AddWithValue("@id", id);
                conn.Open(); cmd.ExecuteNonQuery();
                return Ok(new { message = "Project Category removed." });
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        // ════════════════════════════════════════════════════════════════════
        // PROJECT SUB-CATEGORIES
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("project-sub-categories")]
        public IActionResult GetProjectSubCategories()
        {
            try
            {
                const string sql = @"
                    SELECT ps.id, ps.name,
                           pc.name     AS category_name,
                           COALESCE(p2.name, p1.name) AS program_name
                    FROM   project_sub_category ps
                    LEFT  JOIN project_category pc ON pc.id  = ps.project_category_id
                    LEFT  JOIN program          p1 ON p1.id  = ps.program_id
                    LEFT  JOIN program          p2 ON p2.id  = pc.program_id
                    WHERE  ps.is_active = 1
                    ORDER BY program_name, category_name, ps.name";

                var list = new List<object>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(sql, conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(new {
                        id              = rdr.GetInt32(rdr.GetOrdinal("id")),
                        name            = rdr.GetValue(rdr.GetOrdinal("name")).ToString(),
                        categoryName    = rdr.IsDBNull(rdr.GetOrdinal("category_name"))
                                          ? "" : rdr.GetValue(rdr.GetOrdinal("category_name")).ToString(),
                        programName     = rdr.IsDBNull(rdr.GetOrdinal("program_name"))
                                          ? "" : rdr.GetValue(rdr.GetOrdinal("program_name")).ToString()
                    });
                return Ok(list);
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        [HttpPost("project-sub-categories")]
        public IActionResult AddProjectSubCategory([FromBody] System.Text.Json.JsonElement body)
        {
            string name   = body.TryGetProperty("name",      out var n) ? n.GetString() ?? "" : "";
            int    progId = body.TryGetProperty("programId", out var p) ? p.GetInt32()        : 0;
            int?   catId  = body.TryGetProperty("projectCategoryId", out var c) && c.ValueKind != System.Text.Json.JsonValueKind.Null
                            ? c.GetInt32() : (int?)null;

            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { error = "Sub-Category Name is required." });
            if (progId <= 0)
                return BadRequest(new { error = "Program is required." });

            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "INSERT INTO project_sub_category (project_category_id, program_id, name) VALUES (@c, @p, @n)", conn);
                cmd.Parameters.AddWithValue("@c", catId.HasValue ? (object)catId.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("@p", progId);
                cmd.Parameters.AddWithValue("@n", name);
                conn.Open(); cmd.ExecuteNonQuery();
                return Ok(new { message = $"Sub-Category '{name}' added." });
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        [HttpDelete("project-sub-categories/{id}")]
        public IActionResult DeleteProjectSubCategory(int id)
        {
            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "UPDATE project_sub_category SET is_active = 0 WHERE id = @id", conn);
                cmd.Parameters.AddWithValue("@id", id);
                conn.Open(); cmd.ExecuteNonQuery();
                return Ok(new { message = "Sub-Category removed." });
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        // ════════════════════════════════════════════════════════════════════
        // ACTIVITY LEVELS
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("activity-levels")]
        public IActionResult GetActivityLevels()
        {
            try
            {
                const string sql = @"
                    SELECT al.id, al.name, ps.name AS sub_category_name
                    FROM   activity_level al
                    INNER JOIN project_sub_category ps ON ps.id = al.project_sub_category_id
                    WHERE  al.is_active = 1
                    ORDER BY ps.name, al.name";

                var list = new List<object>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(sql, conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(new {
                        id              = rdr.GetInt32(rdr.GetOrdinal("id")),
                        name            = rdr.GetValue(rdr.GetOrdinal("name")).ToString(),
                        subCategoryName = rdr.GetValue(rdr.GetOrdinal("sub_category_name")).ToString()
                    });
                return Ok(list);
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        [HttpPost("activity-levels")]
        public IActionResult AddActivityLevel([FromBody] System.Text.Json.JsonElement body)
        {
            int    subId = body.TryGetProperty("projectSubCategoryId", out var s) ? s.GetInt32()    : 0;
            string name  = body.TryGetProperty("name",                 out var n) ? n.GetString() ?? "" : "";
            if (subId <= 0 || string.IsNullOrWhiteSpace(name))
                return BadRequest(new { error = "Sub-Category and Activity Level Name are required." });
            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "INSERT INTO activity_level (project_sub_category_id, name) VALUES (@s, @n)", conn);
                cmd.Parameters.AddWithValue("@s", subId);
                cmd.Parameters.AddWithValue("@n", name);
                conn.Open(); cmd.ExecuteNonQuery();
                return Ok(new { message = $"Activity Level '{name}' added." });
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        [HttpDelete("activity-levels/{id}")]
        public IActionResult DeleteActivityLevel(int id)
        {
            try
            {
                using var conn = Conn();
                using var cmd  = new MySqlCommand(
                    "UPDATE activity_level SET is_active = 0 WHERE id = @id", conn);
                cmd.Parameters.AddWithValue("@id", id);
                conn.Open(); cmd.ExecuteNonQuery();
                return Ok(new { message = "Activity Level removed." });
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        // ════════════════════════════════════════════════════════════════════
        // ALLOTMENTS
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("allotments")]
        public IActionResult GetAllotments()
        {
            try
            {
                const string sql = @"
                    SELECT a.id, rc.name AS rc_name, f.fund_category,
                           ec.name AS expense_class_name,
                           CONCAT(ac.code, ' – ', ac.description) AS account_code,
                           a.fiscal_year, a.amount
                    FROM   allotments a
                    INNER JOIN responsibility_center rc ON rc.id = a.rc_id
                    INNER JOIN fund                  f  ON f.id  = a.fund_id
                    INNER JOIN expense_class         ec ON ec.id = a.expense_class_id
                    LEFT  JOIN account_code          ac ON ac.id = a.account_code_id
                    ORDER BY a.fiscal_year DESC, rc.name";

                var list = new List<object>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(sql, conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(new {
                        id               = rdr.GetInt32(rdr.GetOrdinal("id")),
                        rcName           = rdr.GetValue(rdr.GetOrdinal("rc_name")).ToString(),
                        fundCategory     = rdr.GetValue(rdr.GetOrdinal("fund_category")).ToString(),
                        expenseClassName = rdr.GetValue(rdr.GetOrdinal("expense_class_name")).ToString(),
                        accountCode      = rdr.IsDBNull(rdr.GetOrdinal("account_code"))
                                            ? "" : rdr.GetValue(rdr.GetOrdinal("account_code")).ToString(),
                        fiscalYear       = rdr.GetValue(rdr.GetOrdinal("fiscal_year")).ToString(),
                        amount           = rdr.GetDecimal(rdr.GetOrdinal("amount"))
                    });
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("allotments")]
        public IActionResult SaveAllotments([FromBody] System.Text.Json.JsonElement body)
        {
            string fy      = body.TryGetProperty("fiscalYear",     out var f)  ? f.GetString() ?? "" : "";
            int    fundId  = body.TryGetProperty("fundId",         out var fi) ? fi.GetInt32() : 0;
            int    classId = body.TryGetProperty("expenseClassId", out var ec) ? ec.GetInt32() : 0;
            int    acctId  = body.TryGetProperty("accountCodeId",  out var ac) ? ac.GetInt32() : 0;

            if (string.IsNullOrWhiteSpace(fy) || fundId <= 0 || classId <= 0 || acctId <= 0)
                return BadRequest(new { error = "Fiscal Year, Fund, Expense Class, and Account Code are required." });

            var entries = new List<(int rcId, decimal amount)>();
            if (body.TryGetProperty("entries", out var arr))
            {
                foreach (var e in arr.EnumerateArray())
                {
                    int     rcId   = e.TryGetProperty("rcId",   out var r) ? r.GetInt32()     : 0;
                    decimal amount = e.TryGetProperty("amount", out var a) ? (decimal)a.GetDouble() : 0;
                    if (rcId > 0 && amount > 0) entries.Add((rcId, amount));
                }
            }

            if (entries.Count == 0)
                return BadRequest(new { error = "No valid allotment entries provided." });

            try
            {
                using var conn = Conn();
                conn.Open();
                int saved = 0;
                foreach (var (rcId, amount) in entries)
                {
                    using var cmd = new MySqlCommand(@"
                        INSERT INTO allotments (rc_id, fund_id, expense_class_id, account_code_id, fiscal_year, amount)
                        VALUES (@r, @f, @e, @ac, @y, @a)
                        ON DUPLICATE KEY UPDATE amount = @a", conn);
                    cmd.Parameters.AddWithValue("@r",  rcId);
                    cmd.Parameters.AddWithValue("@f",  fundId);
                    cmd.Parameters.AddWithValue("@e",  classId);
                    cmd.Parameters.AddWithValue("@ac", acctId);
                    cmd.Parameters.AddWithValue("@y",  fy);
                    cmd.Parameters.AddWithValue("@a",  amount);
                    cmd.ExecuteNonQuery();
                    saved++;
                }

                return Ok(new { message = $"{saved} allotment(s) saved for FY {fy}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("allotments/{id}")]
        public IActionResult DeleteAllotment(int id)
        {
            using var conn = Conn();
            using var cmd  = new MySqlCommand("DELETE FROM allotments WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", id);
            conn.Open(); cmd.ExecuteNonQuery();
            return Ok(new { message = "Allotment deleted." });
        }

        // ════════════════════════════════════════════════════════════════════
        // USERS
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("users")]
        public IActionResult GetUsers()
        {
            try
            {
                const string sql = @"
                    SELECT id, username, full_name, email, role, is_active
                    FROM   users ORDER BY full_name";

                var list = new List<object>();
                using var conn = Conn();
                using var cmd  = new MySqlCommand(sql, conn);
                conn.Open();
                using var rdr = cmd.ExecuteReader();
                while (rdr.Read())
                    list.Add(new {
                        id       = rdr.GetInt32(rdr.GetOrdinal("id")),
                        username = rdr.GetValue(rdr.GetOrdinal("username")).ToString(),
                        fullName = rdr.GetValue(rdr.GetOrdinal("full_name")).ToString(),
                        email    = rdr.IsDBNull(rdr.GetOrdinal("email")) ? "" : rdr.GetValue(rdr.GetOrdinal("email")).ToString(),
                        role     = rdr.GetValue(rdr.GetOrdinal("role")).ToString(),
                        isActive = rdr.GetInt32(rdr.GetOrdinal("is_active")) == 1
                    });
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("users")]
        public IActionResult AddUser([FromBody] System.Text.Json.JsonElement body)
        {
            string fullName = body.TryGetProperty("fullName", out var fn) ? fn.GetString() ?? "" : "";
            string username = body.TryGetProperty("username", out var un) ? un.GetString() ?? "" : "";
            string password = body.TryGetProperty("password", out var pw) ? pw.GetString() ?? "" : "";
            string role     = body.TryGetProperty("role",     out var r)  ? r.GetString()  ?? "staff" : "staff";

            if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return BadRequest(new { error = "Full name, username and password are required." });

            // Hash the password with BCrypt before storing
            string hash = Auth.AuthHelper.HashPassword(password);

            try
            {
                _authData.CreateUser(username, hash, fullName, "", role);
                return Ok(new { message = $"User '{username}' created." });
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            { return Conflict(new { error = $"Username '{username}' already exists." }); }
        }

        [HttpDelete("users/{id}")]
        public IActionResult DeleteUser(int id)
        {
            using var conn = Conn();
            using var cmd  = new MySqlCommand(
                "UPDATE users SET is_active = 0 WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", id);
            conn.Open(); cmd.ExecuteNonQuery();
            return Ok(new { message = "User deactivated." });
        }
    }
}

using BFAR.EBudget.Data;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace BFAR.EBudget.Controllers
{
    [ApiController]
    [Route("api/obligations")]
    public class ObligationsController : ControllerBase
    {
        private readonly ObligationsData _db;

        public ObligationsController(ObligationsData db)
        {
            _db = db;
        }

        // GET /api/obligations/next-ors-number
        [HttpGet("next-ors-number")]
        public IActionResult GetNextOrsNumber()
        {
            try
            {
                string nextNo = _db.GetNextOrsNumber();
                return Ok(new { orsNo = nextNo });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET /api/obligations/next-line-no?orsNo=26-06-0001
        // Returns the next available line number for a given ORS No.
        // Used when consolidating multiple account codes under one PR.
        [HttpGet("next-line-no")]
        public IActionResult GetNextLineNo([FromQuery] string orsNo)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(orsNo))
                    return BadRequest(new { error = "orsNo is required." });

                int lineNo = _db.GetNextLineNo(orsNo);
                return Ok(new { orsNo = orsNo, lineNo = lineNo });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET /api/obligations/{id} — full detail for ORS print
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            try
            {
                var detail = _db.GetObligationDetail(id);
                if (detail == null) return NotFound(new { error = "Obligation not found." });
                return Ok(detail);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET /api/obligations/by-ors-no/26-07-0001
        // Returns every obligation row sharing this ORS/BURS number, ordered
        // by line_no. Used by the print page for consolidated obligations
        // (multiple Responsibility Centers, and/or multiple account codes,
        // filed under one ORS number).
        [HttpGet("by-ors-no/{orsNo}")]
        public IActionResult GetByOrsNo(string orsNo)
        {
            try
            {
                var records = _db.GetObligationsByOrsNo(orsNo);
                if (records == null || records.Count == 0)
                    return NotFound(new { error = $"No obligations found for ORS No. '{orsNo}'." });
                return Ok(records);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET /api/obligations
        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                var records = _db.GetObligations();
                return Ok(records);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // POST /api/obligations
        [HttpPost]
        public IActionResult Save([FromBody] ObligationModel model)
        {
            // ── Validation ────────────────────────────────────────────────────
            if (string.IsNullOrWhiteSpace(model.OrsNo))
                return BadRequest(new { error = "ORS/BURS No. is required." });

            if (string.IsNullOrWhiteSpace(model.Payee))
                return BadRequest(new { error = "Payee is required." });

            if (string.IsNullOrWhiteSpace(model.Quarter))
                return BadRequest(new { error = "Quarter is required." });

            if (model.RcId <= 0)
                return BadRequest(new { error = "Responsibility Center is required." });

            if (model.SignatoryId <= 0)
                return BadRequest(new { error = "Signatory is required." });

            if (string.IsNullOrWhiteSpace(model.Particulars))
                return BadRequest(new { error = "Particulars is required." });

            if (model.ActivityLevelId <= 0)
                return BadRequest(new { error = "Activity Level is required." });

            if (model.AccountCodeId <= 0)
                return BadRequest(new { error = "Account Code is required." });

            if (model.Amount <= 0)
                return BadRequest(new { error = "Amount must be greater than zero." });

            // ── Auto-assign line_no if not provided ───────────────────────────
            // For a new ORS No., line_no = 1.
            // For a consolidated PR (same ORS No., different account code),
            // line_no auto-increments.
            if (model.LineNo <= 0)
                model.LineNo = _db.GetNextLineNo(model.OrsNo);

            // ── Resolve fund detail ───────────────────────────────────────────
            if (model.FundId.HasValue && model.FundId.Value > 0)
            {
                var fund = _db.GetFundDetail(model.FundId.Value);
                if (fund == null)
                    return BadRequest(new { error = "Selected Fund Category not found." });

                model.FundCluster       = fund.FundCluster;
                model.FinancingSource   = fund.FinancingSource;
                model.AuthorizationCode = fund.AuthorizationCode;
                model.FundCategory      = fund.FundCategory;
                model.FullFundingSource = fund.FullFundingSource;
            }
            else
            {
                return BadRequest(new { error = "Fund Category is required." });
            }

            // ── Save ──────────────────────────────────────────────────────────
            try
            {
                int newId = _db.SaveObligation(model);
                return Ok(new
                {
                    id      = newId,
                    lineNo  = model.LineNo,
                    message = $"Obligation {model.OrsNo} Line {model.LineNo} saved successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // DELETE /api/obligations/{id}
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                _db.DeleteObligation(id);
                return Ok(new { message = "Obligation deleted." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}

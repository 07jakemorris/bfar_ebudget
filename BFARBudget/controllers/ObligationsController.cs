using BFAR.EBudget.Data;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace BFAR.EBudget.Controllers
{
    /// <summary>
    /// Handles saving, listing, and deleting obligation records.
    /// Base route: /api/obligations
    /// </summary>
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
        // Called on form open and after every successful save.
        // Returns: { "orsNo": "26-06-1506" }
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
            // ── Server-side validation ───────────────────────────────────────
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

            // ── Resolve fund detail from DB using fundId ─────────────────────
            // JS only sends fundId. We look up all 6 columns here so the
            // model has them populated before SaveObligation() is called.
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

            // ── Save ─────────────────────────────────────────────────────────
            try
            {
                int newId = _db.SaveObligation(model);
                return Ok(new { id = newId, message = $"Obligation {model.OrsNo} saved successfully." });
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                return Conflict(new { error = $"ORS/BURS No. '{model.OrsNo}' already exists." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // DELETE /api/obligations/5
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

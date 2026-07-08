using BFAR.EBudget.Data;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace BFAR.EBudget.Controllers
{
    /// <summary>
    /// Handles earmarking CRUD + release/cancel actions.
    /// Base route: /api/earmarks
    /// </summary>
    [ApiController]
    [Route("api/earmarks")]
    public class EarmarkingController : ControllerBase
    {
        private readonly EarmarkingData _db;

        public EarmarkingController(EarmarkingData db)
        {
            _db = db;
        }

        // GET /api/earmarks/pr-format
        // Returns the suggested PR number prefix for this month e.g. { "prefix": "26-06-" }
        [HttpGet("pr-format")]
        public IActionResult GetPrFormat()
        {
            return Ok(new { prefix = _db.GetPrNumberFormat() });
        }

        // GET /api/earmarks
        [HttpGet]
        public IActionResult GetAll()
        {
            try { return Ok(_db.GetEarmarks()); }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        // GET /api/earmarks/summary
        [HttpGet("summary")]
        public IActionResult GetSummary()
        {
            try { return Ok(_db.GetSummary()); }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        // POST /api/earmarks
        [HttpPost]
        public IActionResult Save([FromBody] EarmarkModel model)
        {
            // ── Validation ────────────────────────────────────────────────────
            if (string.IsNullOrWhiteSpace(model.PrNo))
                return BadRequest(new { error = "PR No. is required." });

            if (model.RcId <= 0)
                return BadRequest(new { error = "Responsibility Center is required." });

            if (model.SignatoryId <= 0)
                return BadRequest(new { error = "Signatory is required." });

            if (string.IsNullOrWhiteSpace(model.Purpose))
                return BadRequest(new { error = "Purpose / Description is required." });

            if (model.ActivityLevelId <= 0)
                return BadRequest(new { error = "Activity Level is required." });

            if (model.AccountCodeId <= 0)
                return BadRequest(new { error = "Account Code is required." });

            if (model.Amount <= 0)
                return BadRequest(new { error = "Amount must be greater than zero." });

            // ── Resolve fund detail from DB ───────────────────────────────────
            if (model.FundId.HasValue && model.FundId.Value > 0)
            {
                var fund = _db.GetFundDetail(model.FundId.Value);
                if (fund == null)
                    return BadRequest(new { error = "Selected Fund Category not found." });

                model.FundCluster        = fund.FundCluster;
                model.FinancingSource    = fund.FinancingSource;
                model.AuthorizationCode  = fund.AuthorizationCode;
                model.FundCategory       = fund.FundCategory;
                model.FullFundingSource  = fund.FullFundingSource;
            }
            else
            {
                return BadRequest(new { error = "Fund Category is required." });
            }

            // ── Save ──────────────────────────────────────────────────────────
            try
            {
                int newId = _db.SaveEarmark(model);
                return Ok(new { id = newId, message = $"Earmark {model.PrNo} saved successfully." });
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                return Conflict(new { error = $"PR No. '{model.PrNo}' already exists." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PATCH /api/earmarks/5/release
        [HttpPatch("{id}/release")]
        public IActionResult Release(int id)
        {
            try
            {
                _db.ReleaseEarmark(id);
                return Ok(new { message = "Earmark released successfully." });
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        // PATCH /api/earmarks/5/cancel
        [HttpPatch("{id}/cancel")]
        public IActionResult Cancel(int id)
        {
            try
            {
                _db.CancelEarmark(id);
                return Ok(new { message = "Earmark cancelled." });
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }

        // DELETE /api/earmarks/5
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                _db.DeleteEarmark(id);
                return Ok(new { message = "Earmark deleted." });
            }
            catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
        }
    }
}

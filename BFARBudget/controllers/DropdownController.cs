using BFAR.EBudget.Data;
using Microsoft.AspNetCore.Mvc;

namespace BFAR.EBudget.Controllers
{
    [ApiController]
    [Route("api/dropdown")]
    public class DropdownController : ControllerBase
    {
        private readonly ObligationsData _db;
        public DropdownController(ObligationsData db) { _db = db; }

        // ── Static ───────────────────────────────────────────────────────────
        [HttpGet("expense-classes")]
        public IActionResult GetExpenseClasses() => Ok(_db.GetExpenseClasses());

        [HttpGet("programs")]
        public IActionResult GetPrograms() => Ok(_db.GetPrograms());

        [HttpGet("responsibility-centers")]
        public IActionResult GetResponsibilityCenters() => Ok(_db.GetResponsibilityCenters());

        [HttpGet("fund-categories")]
        public IActionResult GetFundCategories() => Ok(_db.GetFundCategories());

        // GET /api/dropdown/fund-detail/3
        // Returns all 6 columns for the selected fund — called when user picks a fund category
        [HttpGet("fund-detail/{id}")]
        public IActionResult GetFundDetail(int id)
        {
            var detail = _db.GetFundDetail(id);
            if (detail == null) return NotFound(new { error = "Fund not found." });
            return Ok(detail);
        }

        // ── Cascade ──────────────────────────────────────────────────────────
        [HttpGet("expense-types")]
        public IActionResult GetExpenseTypes([FromQuery] int parentId)
        {
            if (parentId <= 0) return BadRequest("parentId is required.");
            return Ok(_db.GetExpenseTypes(parentId));
        }

        [HttpGet("account-codes")]
        public IActionResult GetAccountCodes([FromQuery] int parentId)
        {
            if (parentId <= 0) return BadRequest("parentId is required.");
            return Ok(_db.GetAccountCodes(parentId));
        }

        [HttpGet("sub-account-codes")]
        public IActionResult GetSubAccountCodes([FromQuery] int parentId)
        {
            if (parentId <= 0) return BadRequest("parentId is required.");
            return Ok(_db.GetSubAccountCodes(parentId));
        }

        [HttpGet("project-categories")]
        public IActionResult GetProjectCategories([FromQuery] int parentId)
        {
            if (parentId <= 0) return BadRequest("parentId is required.");
            return Ok(_db.GetProjectCategories(parentId));
        }

        // Program → Project Sub-Category (direct, no category)
        // OR Project Category → Project Sub-Category
        [HttpGet("project-sub-categories")]
        public IActionResult GetProjectSubCategories([FromQuery] int parentId)
        {
            if (parentId <= 0) return BadRequest("parentId is required.");
            // parentId could be a project_category_id OR program_id
            // Try category first, fall back to program
            var results = _db.GetProjectSubCategories(parentId);
            if (results.Count == 0)
                results = _db.GetProjectSubCategoriesByProgram(parentId);
            return Ok(results);
        }

        [HttpGet("activity-levels")]
        public IActionResult GetActivityLevels([FromQuery] int parentId)
        {
            if (parentId <= 0) return BadRequest("parentId is required.");
            return Ok(_db.GetActivityLevels(parentId));
        }

        [HttpGet("signatories")]
        public IActionResult GetSignatories([FromQuery] int parentId)
        {
            if (parentId <= 0) return BadRequest("parentId is required.");
            return Ok(_db.GetSignatories(parentId));
        }
    }
}

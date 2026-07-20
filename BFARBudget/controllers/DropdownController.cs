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

        // Project Category → Project Sub-Category (normal case).
        // NOTE: parentId here is always a project_category_id. Do NOT pass a
        // program_id into this endpoint — category IDs and program IDs share
        // the same numeric space and can coincidentally collide (e.g.
        // program_id=5 matching an unrelated project_category.id=5), which
        // would silently return the wrong sub-categories. Some programs
        // (e.g. GAS, STO) have no categories at all and link straight to a
        // sub-category — use project-sub-categories-by-program for those.
        [HttpGet("project-sub-categories")]
        public IActionResult GetProjectSubCategories([FromQuery] int parentId)
        {
            if (parentId <= 0) return BadRequest("parentId is required.");
            return Ok(_db.GetProjectSubCategories(parentId));
        }

        // Program → Project Sub-Category (direct link, used only when the
        // program has no project categories at all).
        [HttpGet("project-sub-categories-by-program")]
        public IActionResult GetProjectSubCategoriesByProgram([FromQuery] int parentId)
        {
            if (parentId <= 0) return BadRequest("parentId is required.");
            return Ok(_db.GetProjectSubCategoriesByProgram(parentId));
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

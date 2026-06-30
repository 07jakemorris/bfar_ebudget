using BFAR.EBudget.Auth;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;

namespace BFAR.EBudget.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthData _db;

        public AuthController(AuthData db)
        {
            _db = db;
        }

        // ── POST /api/auth/login ──────────────────────────────────────────────
        [HttpPost("login")]
        public IActionResult Login([FromBody] System.Text.Json.JsonElement body)
        {
            // Read fields directly from JSON — bypasses model binding issues entirely
            string username = "";
            string password = "";
            string role     = "staff";

            try
            {
                if (body.TryGetProperty("username", out var u)) username = u.GetString() ?? "";
                if (body.TryGetProperty("password", out var p)) password = p.GetString() ?? "";
                if (body.TryGetProperty("role",     out var r)) role     = r.GetString() ?? "staff";
            }
            catch
            {
                return BadRequest(new { error = "Malformed request body." });
            }

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return BadRequest(new { error = "Username and password are required." });

            var user = _db.GetUserByUsername(username.Trim());

            if (user == null || !user.IsActive)
                return Unauthorized(new { error = "Invalid username or password." });

            if (user.Role != role)
            {
                string expected = user.Role == "admin" ? "Budget Admin" : "Budget Staff";
                return Unauthorized(new
                {
                    error = $"This account is a {expected} account. Please select the correct role."
                });
            }

            bool passwordOk = AuthHelper.VerifyPassword(password, user.PasswordHash);

            if (!passwordOk)
                return Unauthorized(new { error = "Invalid username or password." });

            _db.UpdateLastLogin(user.Id);

            return Ok(new
            {
                username = user.Username,
                fullName = user.FullName,
                role     = user.Role,
                message  = $"Welcome, {user.FullName}!"
            });
        }

        // ── POST /api/auth/debug-login ────────────────────────────────────────
        // TEMPORARY: Shows exactly what happens at each step.
        // Remove after login is working.
        [HttpPost("debug-login")]
        public IActionResult DebugLogin([FromBody] System.Text.Json.JsonElement body)
        {
            string username = "";
            string password = "";
            string role     = "staff";

            if (body.TryGetProperty("username", out var u)) username = u.GetString() ?? "";
            if (body.TryGetProperty("password", out var p)) password = p.GetString() ?? "";
            if (body.TryGetProperty("role",     out var r)) role     = r.GetString() ?? "staff";

            var user = _db.GetUserByUsername(username.Trim());

            if (user == null)
                return Ok(new {
                    step    = "USER_LOOKUP",
                    result  = "NOT FOUND",
                    message = $"No user found with username '{username}'. Check your users table."
                });

            bool passwordOk = AuthHelper.VerifyPassword(password, user.PasswordHash);

            return Ok(new {
                step          = "ALL_CHECKS",
                usernameFound = true,
                isActive      = user.IsActive,
                roleInDb      = user.Role,
                roleReceived  = role,
                roleMatch     = user.Role == role,
                passwordMatch = passwordOk,
                hashPreview   = user.PasswordHash.Length > 10
                                ? user.PasswordHash[..10] + "..."
                                : "too short"
            });
        }

        // ── POST /api/auth/setup ──────────────────────────────────────────────
        [HttpPost("setup")]
        public IActionResult Setup([FromBody] SetupRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.AdminPassword) ||
                string.IsNullOrWhiteSpace(req.StaffPassword))
                return BadRequest(new { error = "Both adminPassword and staffPassword are required." });

            string adminHash = AuthHelper.HashPassword(req.AdminPassword);
            string staffHash = AuthHelper.HashPassword(req.StaffPassword);

            _db.SetupUserPassword("budget_admin", adminHash);
            _db.SetupUserPassword("budget_staff", staffHash);

            return Ok(new { message = "Passwords set successfully. DISABLE THIS ENDPOINT NOW." });
        }

        // ── GET /api/auth/hash-password?password=xxx ──────────────────────────
        [HttpGet("hash-password")]
        public IActionResult HashPassword([FromQuery] string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                return BadRequest(new { error = "password query param is required." });

            string hash = AuthHelper.HashPassword(password);
            return Ok(new { password, hash });
        }
    }

    // ── Request models ────────────────────────────────────────────────────────

    public class LoginRequest
    {
        // JsonPropertyName ensures binding works regardless of C# naming conventions
        [JsonPropertyName("username")]
        public string Username { get; set; } = "";

        [JsonPropertyName("password")]
        public string Password { get; set; } = "";

        [JsonPropertyName("role")]
        public string Role { get; set; } = "staff";
    }

    public class SetupRequest
    {
        [JsonPropertyName("adminPassword")]
        public string AdminPassword { get; set; } = "";

        [JsonPropertyName("staffPassword")]
        public string StaffPassword { get; set; } = "";
    }
}

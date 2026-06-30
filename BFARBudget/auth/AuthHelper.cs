using BCrypt.Net;

namespace BFAR.EBudget.Auth
{
    /// <summary>
    /// Password hashing and verification using BCrypt.
    ///
    /// BCrypt automatically:
    ///   - Generates a random salt for every hash
    ///   - Embeds the salt inside the hash string
    ///   - Uses a work factor (cost) to slow down brute-force attacks
    ///
    /// The flow:
    ///   Frontend  → SHA-256 hash of raw password  → sends to API
    ///   Backend   → BCrypt.Verify(sha256Hash, storedBCryptHash)
    ///
    /// This double-hashing means:
    ///   1. Raw password never travels over the wire
    ///   2. Even if DB is leaked, BCrypt makes cracking extremely slow
    /// </summary>
    public static class AuthHelper
    {
        // Work factor: 12 is a good balance of security vs speed (~300ms per hash)
        // Increase to 13 or 14 for higher security on faster servers
        private const int WorkFactor = 12;

        /// <summary>
        /// Hashes a password (or SHA-256 pre-hash) with BCrypt + random salt.
        /// Store the result in the database.
        /// </summary>
        public static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
        }

        /// <summary>
        /// Verifies a plain-text or pre-hashed password against a stored BCrypt hash.
        /// Returns true if they match, false otherwise.
        /// Never throws — always returns false on any error.
        /// </summary>
        public static bool VerifyPassword(string inputPassword, string storedHash)
        {
            try
            {
                return BCrypt.Net.BCrypt.Verify(inputPassword, storedHash);
            }
            catch
            {
                return false;
            }
        }
    }
}

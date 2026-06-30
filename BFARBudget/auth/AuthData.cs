using MySql.Data.MySqlClient;

namespace BFAR.EBudget.Auth
{
    public class AuthData
    {
        private readonly string _connStr;

        public AuthData(string connectionString)
        {
            _connStr = connectionString;
        }

        public UserRecord? GetUserByUsername(string username)
        {
            const string sql = @"
                SELECT id, username, password_hash, full_name, email, role, is_active
                FROM   users
                WHERE  username = @username
                LIMIT  1";

            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@username", username);
            conn.Open();

            using var rdr = cmd.ExecuteReader();
            if (!rdr.Read()) return null;

            // Use column index via GetOrdinal to avoid CS1503
            int colId       = rdr.GetOrdinal("id");
            int colUsername = rdr.GetOrdinal("username");
            int colHash     = rdr.GetOrdinal("password_hash");
            int colName     = rdr.GetOrdinal("full_name");
            int colEmail    = rdr.GetOrdinal("email");
            int colRole     = rdr.GetOrdinal("role");
            int colActive   = rdr.GetOrdinal("is_active");

            return new UserRecord
            {
                Id           = rdr.GetInt32(colId),
                Username     = rdr.GetString(colUsername),
                PasswordHash = rdr.GetString(colHash),
                FullName     = rdr.GetString(colName),
                Email        = rdr.IsDBNull(colEmail) ? "" : rdr.GetString(colEmail),
                Role         = rdr.GetString(colRole),
                IsActive     = rdr.GetInt32(colActive) == 1
            };
        }

        public void UpdateLastLogin(int userId)
        {
            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(
                "UPDATE users SET last_login = NOW() WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("@id", userId);
            conn.Open();
            cmd.ExecuteNonQuery();
        }

        public void SetupUserPassword(string username, string bcryptHash)
        {
            const string sql = @"
                UPDATE users
                SET    password_hash = @hash,
                       updated_at    = NOW()
                WHERE  username      = @username";

            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@hash",     bcryptHash);
            cmd.Parameters.AddWithValue("@username", username);
            conn.Open();
            cmd.ExecuteNonQuery();
        }

        public int CreateUser(string username, string bcryptHash,
                              string fullName, string email, string role)
        {
            const string sql = @"
                INSERT INTO users (username, password_hash, full_name, email, role)
                VALUES (@username, @hash, @fullName, @email, @role);
                SELECT LAST_INSERT_ID();";

            using var conn = new MySqlConnection(_connStr);
            using var cmd  = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@username", username);
            cmd.Parameters.AddWithValue("@hash",     bcryptHash);
            cmd.Parameters.AddWithValue("@fullName", fullName);
            cmd.Parameters.AddWithValue("@email",    email);
            cmd.Parameters.AddWithValue("@role",     role);
            conn.Open();
            return Convert.ToInt32(cmd.ExecuteScalar());
        }
    }

    public class UserRecord
    {
        public int    Id           { get; set; }
        public string Username     { get; set; } = "";
        public string PasswordHash { get; set; } = "";
        public string FullName     { get; set; } = "";
        public string Email        { get; set; } = "";
        public string Role         { get; set; } = "staff";
        public bool   IsActive     { get; set; } = true;
    }
}

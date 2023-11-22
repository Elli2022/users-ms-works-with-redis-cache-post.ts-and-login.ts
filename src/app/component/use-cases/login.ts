const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const redisClient = require("../../libs/redisClient");

export default function createLogin({ findDocuments, logger }) {
  return Object.freeze({ login });

  async function login({ username, password, dbConfig }) {
    try {
      logger.info("[LOGIN][USE-CASE] Login process - START!");
      logger.info(
        `[LOGIN][USE-CASE] Attempting login for username: ${username}`
      );

      // Hämtar användaren från databasen
      const query = { username };
      const users = await findDocuments({ query, dbConfig });
      const user = users[0];

      // Kontrollerar om användaren hittades
      if (!user) {
        logger.warn("[LOGIN][USE-CASE] User not found in database");
        throw new Error("Användaren hittades inte.");
      }

      // Hashar det inskickade lösenordet
      const hashedPassword = crypto
        .createHash("md5")
        .update(password)
        .digest("hex");

      // Jämför det hashade lösenordet med det lagrade lösenordet
      if (hashedPassword !== user.password) {
        logger.warn("[LOGIN][USE-CASE] Incorrect password");
        throw new Error("Felaktigt lösenord.");
      }

      // Skapar JWT-token
      const token = jwt.sign({ userId: user._id }, "din_jwt_secret", {
        expiresIn: "1h",
      });
      logger.info("[LOGIN][USE-CASE] Login successful. Token generated.");

      // Cachar JWT-token i Redis
      await cacheToken(username, token);

      return token;
    } catch (error) {
      logger.error(`[LOGIN][USE-CASE] Error: ${error.message}`);
      throw error;
    }
  }

  async function cacheToken(username, token) {
    const cacheKey = `token:${username}`;
    try {
      await redisClient.setEx(cacheKey, 3600, token);
      logger.info(`Token for ${username} cached in Redis.`);
    } catch (error) {
      logger.error(`Redis error while setting token cache: ${error}`);
    }
  }
}

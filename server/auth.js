import jwt from "jsonwebtoken";

const SECRET = "DEV_ONLY_CHANGE_ME";

export function signToken(user) {
  return jwt.sign(
    {
      uid: user.id,
      role: String(user.role || "").toUpperCase(),
      username: user.username,
    },
    SECRET,
    { expiresIn: "8h" }
  );
}

export function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "NO_TOKEN" });

  try {
    req.user = jwt.verify(token, SECRET);
    // نرمال‌سازی نقش برای تمام ریکوئست‌ها
    if (req.user?.role) req.user.role = String(req.user.role).toUpperCase();
    next();
  } catch {
    res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

export function requireRole(...roles) {
  const allowed = new Set(roles.map(r => String(r).toUpperCase()));

  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "NO_AUTH" });

    const role = String(req.user.role || "").toUpperCase();
    if (!allowed.has(role)) return res.status(403).json({ error: "FORBIDDEN" });

    next();
  };
}

import jwt from "jsonwebtoken";

const SECRET = "DEV_ONLY_CHANGE_ME";

export function signToken(user) {
  return jwt.sign(
    { uid: user.id, role: user.role, username: user.username },
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
    next();
  } catch {
    res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "NO_AUTH" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "FORBIDDEN" });
    next();
  };
}

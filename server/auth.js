import jwt from "jsonwebtoken";

const SECRET = "DEV_ONLY_CHANGE_ME";

function normRole(r) {
  return String(r || "").trim().toUpperCase();
}

export function signToken(user) {
  return jwt.sign(
    { uid: user.id, role: normRole(user.role), username: user.username },
    SECRET,
    { expiresIn: "8h" }
  );
}

export function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "NO_TOKEN" });
  try {
    const payload = jwt.verify(token, SECRET);
    payload.role = normRole(payload.role); // normalize just in case
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

export function requireRole(...roles) {
  const allowed = roles.map(normRole);
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "NO_AUTH" });
    const r = normRole(req.user.role);
    if (!allowed.includes(r)) return res.status(403).json({ error: "FORBIDDEN" });
    next();
  };
}

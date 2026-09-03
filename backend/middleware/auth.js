export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.header('x-demo-role') || 'farmer';
    if (!roles.includes(role)) return res.status(403).json({ message: 'You do not have access to this action.' });
    req.user = { id: req.header('x-demo-user-id') || 'farmer-1', role };
    next();
  };
}

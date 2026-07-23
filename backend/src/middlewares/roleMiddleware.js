export const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !roles.includes(req.user.role)) {
        res.status(403);
        throw new Error("You are not allowed to perform this action");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

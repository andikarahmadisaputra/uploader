module.exports = (req, res, next) => {
  if (!Array.isArray(req.session.user.Roles)) {
    req.session.flash = { error: ["Unauthorized access"] };
    return res.redirect("/");
  }

  const hasAdmin = req.session.user.Roles.some((role) => role.name === "admin");
  if (!hasAdmin) {
    req.session.flash = { error: ["Unauthorized access"] };
    return res.redirect("/");
  }

  next();
};

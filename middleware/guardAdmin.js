module.exports = (req, res, next) => {
  const hasAdmin = req.session.auth.roles.some((role) => role === "admin");
  if (!hasAdmin) {
    req.session.flash = { error: ["Unauthorized access"] };
    return res.redirect("/");
  }

  next();
};

module.exports = (req, res, next) => {
  if (req.session.user) {
    req.session.flash = {
      error: [
        "You are already logged in. Please log out first to switch accounts.",
      ],
    };
    return res.redirect("/");
  }
  next();
};

module.exports = async (req, res, next) => {
  console.log("Checking auth middleware at:", req.originalUrl);
  if (!req.session.auth) {
    req.session.flash = { error: ["Please login first!"] };
    return res.redirect("/login");
  } else {
    res.locals.auth = req.session.auth;
    next();
  }
};

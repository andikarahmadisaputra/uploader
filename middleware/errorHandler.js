const logger = require("../helpers/winston");

const errorHandler = (err, req, res, next) => {
  logger.error("Something went wrong", {
    message: err.message,
    stack: err.stack,
    userId: req.user ? req.user.id : "unknown",
    path: req.originalUrl,
  });

  req.session.flash = { error: ["Something went wrong"] };
  res.redirect("/");
};

module.exports = errorHandler;

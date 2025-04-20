const { User, Role, File } = require("../models/index");
module.exports = async (req, res, next) => {
  console.log("Checking auth middleware at:", req.originalUrl);
  if (!req.session.user) {
    req.session.flash = { error: ["Please login first!"] };
    return res.redirect("/login");
  } else {
    const user = await User.findOne({
      include: [
        { model: Role, as: "Roles" },
        { model: File, as: "OwnedFile" },
        {
          model: File,
          as: "SharedFile",
          include: {
            model: User,
            as: "Owner",
            attributes: { exclude: ["username", "password"] },
          },
        },
      ],
      where: {
        id: req.session.user.id,
      },
    });
    user.OwnedFile?.sort((a, b) => a.name.localeCompare(b.name));
    user.SharedFile?.sort((a, b) => a.name.localeCompare(b.name));
    req.session.user = user;
    res.locals.user = user;
    next();
  }
};

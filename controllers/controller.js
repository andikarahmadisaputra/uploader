const { User, Role, File } = require("../models/index");
const {
  loginSchema,
  editUserSchema,
  passwordUserSchema,
} = require("../validation/schema");
const { comparePassword } = require("../helpers/bcrypt");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
class Controller {
  static async home(req, res, next) {
    try {
      const auth = req.session.auth;
      res.render("home", { auth });
    } catch (error) {
      next(error);
    }
  }

  static async getLogin(req, res, next) {
    try {
      res.render("login");
    } catch (error) {
      next(error);
    }
  }

  static async postLogin(req, res, next) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        req.session.flash = { error: ["Invalid username or password"] };
        return res.redirect("/login");
      }

      const { error, value } = loginSchema.validate(req.body);

      if (error) {
        const messages = error.details.map((err) => err.message);
        req.session.flash = { error: messages };
        return res.redirect("/login");
      }

      const { username, password } = req.body;

      const user = await User.findOne({
        include: {
          model: Role,
          as: "Roles",
        },
        where: {
          username,
        },
      });

      if (!user) {
        req.session.flash = { error: ["Username is not registered"] };
        return res.redirect("/login");
      }

      const isValidPassword = await comparePassword(password, user.password);

      if (!isValidPassword) {
        req.session.flash = { error: ["Invalid password"] };
        return res.redirect("/login");
      }

      const isActive = user.status === "active";
      if (!isActive) {
        req.session.flash = { error: ["User is inactive"] };
        return res.redirect("/login");
      }

      req.session.auth = {
        id: user.id,
        roles: Array.isArray(user.Roles) ? user.Roles.map((el) => el.name) : [],
      };

      req.session.flash = { success: `Welcome ${user.name}` };
      res.redirect("/");
    } catch (error) {
      next(error);
    }
  }

  static async getLogout(req, res, next) {
    try {
      delete req.session.auth;
      req.session.flash = { success: "Logout successful" };
      res.redirect("/login");
    } catch (error) {
      next(error);
    }
  }

  static async getOwnedFile(req, res, next) {
    try {
      const { search = "" } = req.query;

      let options = {
        where: {
          UserId: req.session.auth.id,
        },
        order: [["name", "asc"]],
      };

      if (search) {
        options.where.name = {
          [Op.like]: `%${search}%`,
        };
      }

      const ownedFiles = await File.findAll(options);

      res.render("owned", { ownedFiles });
    } catch (error) {
      next(error);
    }
  }

  static async postUploadOwnedFile(req, res, next) {
    try {
      if (!req.file || !req.file.filename || !req.file.originalname) {
        req.session.flash = { error: ["No file uploaded"] };
        return res.redirect("/owned");
      }

      await File.create({
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        UserId: req.session.auth.id,
      });

      req.session.flash = {
        success: `${req.file.originalname} uploaded successfully`,
      };
      res.redirect("/owned");
    } catch (error) {
      next(error);
    }
  }

  static async getDownloadOwnedFile(req, res, next) {
    try {
      if (!req.params.id || isNaN(req.params.id)) {
        req.session.flash = { error: ["Id file not valid"] };
        return res.redirect("/owned");
      }

      const file = await File.findOne({
        where: {
          id: req.params.id,
          UserId: req.session.auth.id,
        },
      });

      if (!file) {
        req.session.flash = { error: ["File not found"] };
        return res.redirect("/owned");
      }

      const filePath = path.join(__dirname, "..", file.url);
      if (!fs.existsSync(filePath)) {
        req.session.flash = { error: ["File not found"] };
        return res.redirect("/owned");
      }

      res.download(filePath);
    } catch (error) {
      next(error);
    }
  }

  static async getDeleteOwnedFile(req, res, next) {
    try {
      if (!req.params.id || isNaN(req.params.id)) {
        req.session.flash = { error: ["Id file not valid"] };
        return res.redirect("/owned");
      }

      const file = await File.findOne({
        where: {
          id: req.params.id,
          UserId: req.session.auth.id,
        },
      });

      if (!file) {
        req.session.flash = { error: ["File not found"] };
        return res.redirect("/owned");
      }

      const filePath = path.join(__dirname, "..", file.url);
      if (!fs.existsSync(filePath)) {
        req.session.flash = { error: ["File not found"] };
        return res.redirect("/owned");
      }

      fs.unlink(filePath, (err) => {
        if (err) {
          req.session.flash = { error: ["Failed to delete file"] };
          return redirect("/owned");
        }
      });
      await file.destroy();

      req.session.flash = { success: `${file.name} deleted successfully` };
      res.redirect("/owned");
    } catch (error) {
      next(error);
    }
  }

  static async getShareOwnedFile(req, res, next) {
    try {
      if (!req.params.id || isNaN(req.params.id)) {
        req.session.flash = { error: ["Id file not valid"] };
        return res.redirect("/owned");
      }

      const file = await File.findOne({
        attributes: ["id", "name"],
        include: {
          model: User,
          as: "SharedWith",
          attributes: ["id"],
        },
        where: {
          id: req.params.id,
          UserId: req.session.auth.id,
        },
      });

      if (!file) {
        req.session.flash = { error: ["File not found"] };
        return res.redirect("/owned");
      }

      const users = await User.findAll({
        attributes: ["id", "name"],
        where: {
          id: {
            [Op.ne]: req.session.auth.id,
          },
        },
      });

      res.render("share", { file, users });
    } catch (error) {
      next(error);
    }
  }

  static async postShareOwnedFile(req, res, next) {
    try {
      if (!req.params.id || isNaN(req.params.id)) {
        req.session.flash = { error: ["Id file not valid"] };
        return res.redirect("/owned");
      }

      const file = await File.findOne({
        where: {
          id: req.params.id,
          UserId: req.session.auth.id,
        },
      });

      if (!file) {
        req.session.flash = { error: ["File not found"] };
        return res.redirect("/owned");
      }

      const users = [].concat(req.body.user || []);

      await file.setSharedWith(users);

      res.redirect("/owned");
    } catch (error) {
      next(error);
    }
  }

  static async getSharedFile(req, res, next) {
    try {
      const { search = "" } = req.query;
      let options = {
        include: [
          {
            model: User,
            as: "Owner",
            attributes: ["name"],
          },
          {
            model: User,
            as: "SharedWith",
            attributes: ["id"],
            where: {
              id: req.session.auth.id,
            },
          },
        ],
        order: [["name", "ASC"]],
      };

      if (search) {
        options.where = {
          name: {
            [Op.like]: `%${search}%`,
          },
        };
      }

      const sharedFiles = await File.findAll(options);

      res.render("shared", { sharedFiles });
    } catch (error) {
      next(error);
    }
  }

  static async getDownloadSharedFile(req, res, next) {
    try {
      if (!req.params.id || isNaN(req.params.id)) {
        req.session.flash = { error: ["Id file not valid"] };
        return res.redirect("/shared");
      }

      const file = await File.findOne({
        include: {
          model: User,
          as: "SharedWith",
          attributes: ["id"],
          where: {
            id: req.session.auth.id,
          },
        },
        where: {
          id: req.params.id,
        },
      });

      if (!file) {
        req.session.flash = { error: ["File not found"] };
        return res.redirect("/shared");
      }

      const filePath = path.join(__dirname, "..", file.url);
      if (!fs.existsSync(filePath)) {
        req.session.flash = { error: ["File not found"] };
        return res.redirect("/shared");
      }

      res.download(filePath);
    } catch (error) {
      next(error);
    }
  }

  static async getChangeProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.session.auth.id);
      if (!user) {
        req.session.flash = { error: ["User not found"] };
        return res.redirect("/");
      }

      res.render("profile", { user });
    } catch (error) {
      next(error);
    }
  }

  static async postChangeProfile(req, res, next) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        req.session.flash = { error: "Req body is required" };
        res.redirect("/change-profile");
      }

      const { error, value } = editUserSchema.validate(req.body);

      if (error) {
        const messages = error.details.map((err) => err.message);
        req.session.flash = { error: messages };
        return res.redirect("/change-profile");
      }

      const { name, username, gender } = req.body;

      const user = await User.findByPk(req.session.auth.id);
      if (!user) {
        req.session.flash = { error: ["User not found"] };
        return res.redirect("/");
      }

      const existing = await User.findOne({
        attributes: ["username"],
        where: {
          username,
          id: {
            [Op.ne]: user.id,
          },
        },
      });
      if (existing) {
        req.session.flash = { error: ["Username already taken"] };
        return res.redirect("/change-profile");
      }

      await user.update({
        name,
        username,
        gender,
      });

      req.session.flash = { success: "User updated successfully" };
      res.redirect("/");
    } catch (error) {
      next(error);
    }
  }
  static async getChangePassword(req, res, next) {
    try {
      res.render("password");
    } catch (error) {
      next(error);
    }
  }
  static async postChangePassword(req, res, next) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        req.session.flash = { error: "Req body is required" };
        res.redirect("/change-profile");
      }

      const { error, value } = passwordUserSchema.validate(req.body);

      if (error) {
        const messages = error.details.map((err) => err.message);
        req.session.flash = { error: messages };
        return res.redirect("/change-password");
      }

      const { password } = req.body;

      const user = await User.findByPk(req.session.auth.id);
      if (!user) {
        req.session.flash = { error: ["User not found"] };
        return res.redirect("/");
      }

      await user.update({ password });

      req.session.flash = { success: "Password updated successfully" };
      res.redirect("/");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = Controller;

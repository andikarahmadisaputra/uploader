const { User, File } = require("../models/index");
const { loginSchema } = require("../validation/schema");
const { comparePassword } = require("../helpers/bcrypt");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
class Controller {
  static async home(req, res, next) {
    try {
      res.render("home");
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
        req.session.flash = { error: "Invalid username or password" };
        res.redirect("/login");
      }

      const { error, value } = loginSchema.validate(req.body);

      if (error) {
        const messages = error.details.map((err) => err.message);
        req.session.flash = { error: messages };
        return res.redirect("/login");
      }

      const { username, password } = req.body;

      const user = await User.findOne({
        where: {
          username,
        },
      });

      if (!user) {
        req.session.flash = { error: ["Username is not registered"] };
        return res.redirect("/login");
      }

      const isValidPassword = comparePassword(password, user.password);

      if (!isValidPassword) {
        req.session.flash = { error: ["Invalid password"] };
        return res.redirect("/login");
      }

      const isActive = user.status === "active";
      if (!isActive) {
        req.session.flash = { error: ["User is inactive"] };
        return res.redirect("/login");
      }

      req.session.user = user;

      req.session.flash = { success: `Welcome ${user.name}` };
      res.redirect("/");
    } catch (error) {
      next(error);
    }
  }

  static async getLogout(req, res, next) {
    try {
      delete req.session.user;
      req.session.flash = { success: "Logout successful" };
      res.redirect("/login");
    } catch (error) {
      next(error);
    }
  }

  static async getOwnedFile(req, res, next) {
    try {
      const { search = "" } = req.query;
      res.render("owned", { search });
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
        UserId: req.session.user.id,
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
          UserId: req.session.user.id,
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
          UserId: req.session.user.id,
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
        include: {
          model: User,
          as: "SharedWith",
        },
        where: {
          id: req.params.id,
          UserId: req.session.user.id,
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
            [Op.ne]: req.session.user.id,
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
          UserId: req.session.user.id,
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
      res.render("shared", { search });
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
          where: {
            id: req.session.user.id,
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
}

module.exports = Controller;

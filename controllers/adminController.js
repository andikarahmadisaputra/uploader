const { User, Role, File } = require("../models/index");
const { createUserSchema } = require("../validation/schema");
const { Op, fn, col } = require("sequelize");
const fs = require("fs").promises;
const path = require("path");
class AdminController {
  static async getManageUser(req, res, next) {
    try {
      const { search = "" } = req.query;

      let options = {
        attributes: {
          exclude: ["username", "password", "updatedAt"],
          include: [
            [fn("COUNT", col("OwnedFile.id")), "ownedFileCount"],
            [fn("COUNT", col("SharedFile.id")), "sharedFileCount"],
          ],
        },
        include: [
          {
            model: File,
            as: "OwnedFile",
            attributes: [],
            required: false,
          },
          {
            model: File,
            as: "SharedFile",
            attributes: [],
            required: false,
          },
          {
            model: Role,
            as: "Roles",
            attributes: ["name"],
          },
        ],
        group: [
          "User.id",
          "Roles.id",
          "Roles->UserRoles.RoleId",
          "Roles->UserRoles.UserId",
        ],
        order: [["name", "ASC"]],
        subQuery: false,
      };

      if (search) {
        options.where = {
          name: {
            [Op.iLike]: `%${search}%`,
          },
        };
      }

      const users = await User.findAll(options);

      res.render("user", { users });
    } catch (error) {
      next(error);
    }
  }

  static async getDetailUser(req, res, next) {
    try {
      if (!req.params.id || isNaN(req.params.id)) {
        req.session.flash = { error: ["User ID is not valid"] };
        return res.redirect("/owned");
      }

      const userDetail = await User.findOne({
        attributes: { exclude: ["password"] },
        include: [
          { model: Role, as: "Roles" },
          { model: File, as: "OwnedFile" },
          {
            model: File,
            as: "SharedFile",
            include: {
              model: User,
              as: "Owner",
              attributes: { exclude: ["username", "password", "updatedAt"] },
            },
          },
        ],
        where: {
          id: req.params.id,
        },
      });

      res.render("detail", { userDetail });
    } catch (error) {
      next(error);
    }
  }

  static async getAddUser(req, res, next) {
    try {
      res.render("addUser");
    } catch (error) {
      next(error);
    }
  }

  static async postAddUser(req, res, next) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        req.session.flash = { error: "Req body is required" };
        res.redirect("/admin/manage-user/add");
      }

      const { error, value } = createUserSchema.validate(req.body);

      if (error) {
        const messages = error.details.map((err) => err.message);
        req.session.flash = { error: messages };
        return res.redirect("/admin/manage-user/add");
      }

      const { username, password, name, gender } = req.body;

      const existing = await User.findOne({
        attributes: ["username"],
        where: { username },
      });
      if (existing) {
        req.session.flash = { error: ["Username already taken"] };
        return res.redirect("/admin/manage-user/add");
      }

      const user = await User.create({
        username,
        password,
        name,
        gender,
        status: "active",
      });

      user.addRoles([2]);

      req.session.flash = { success: `User ${user.name} created successfully` };
      res.redirect("/admin/manage-user");
    } catch (error) {
      next(error);
    }
  }

  static async getActivatedUser(req, res, next) {
    try {
      if (!req.params.id || isNaN(req.params.id)) {
        req.session.flash = { error: ["User ID is not valid"] };
        return res.redirect("/admin/manage-user");
      }

      const user = await User.findByPk(req.params.id);
      if (!user) {
        req.session.flash = { error: ["User not found"] };
        return res.redirect("/admin/manage-user");
      }

      if (user.status === "active") {
        req.session.flash = { error: ["User already active"] };
        return res.redirect("/admin/manage-user");
      }

      await user.update({ status: "active" });

      req.session.flash = {
        success: `User ${user.name} activated successfully`,
      };
      res.redirect("/admin/manage-user");
    } catch (error) {
      next(error);
    }
  }
  static async getInactivatedUser(req, res, next) {
    try {
      if (!req.params.id || isNaN(req.params.id)) {
        req.session.flash = { error: ["User ID is not valid"] };
        return res.redirect("/admin/manage-user");
      }

      if (req.params.id == req.session.auth.id) {
        req.session.flash = { error: ["You can not inactivated yourself"] };
        return res.redirect("/admin/manage-user");
      }

      const user = await User.findByPk(req.params.id);
      if (!user) {
        req.session.flash = { error: ["User not found"] };
        return res.redirect("/admin/manage-user");
      }

      if (user.status === "inactive") {
        req.session.flash = { error: ["User already inactive"] };
        return res.redirect("/admin/manage-user");
      }

      await user.update({ status: "inactive" });

      req.session.flash = {
        success: `User ${user.name} inactivated successfully`,
      };
      res.redirect("/admin/manage-user");
    } catch (error) {
      next(error);
    }
  }
  static async getDeleteUser(req, res, next) {
    try {
      if (!req.params.id || isNaN(req.params.id)) {
        req.session.flash = { error: ["User ID is not valid"] };
        return res.redirect("/admin/manage-user");
      }

      if (req.params.id == req.session.auth.id) {
        req.session.flash = { error: ["You can not delete yourself"] };
        return res.redirect("/admin/manage-user");
      }

      const user = await User.findOne({
        include: [{ model: File, as: "OwnedFile" }],
        where: {
          id: req.params.id,
          status: "inactive",
        },
      });

      if (!user) {
        req.session.flash = { error: ["User not found"] };
        return res.redirect("/admin/manage-user");
      }

      if (Array.isArray(user.OwnedFile)) {
        for (const file of user.OwnedFile) {
          const filePath = path.join(__dirname, "..", file.url);

          await fs.unlink(filePath);
        }
      }

      await user.destroy();

      req.session.flash = {
        success: `User ${user.name} include files deleted successfully`,
      };
      res.redirect("/admin/manage-user");
    } catch (error) {
      next(error);
    }
  }

  static async getResetPasswordUser(req, res, next) {
    try {
      if (!req.params.id || isNaN(req.params.id)) {
        req.session.flash = { error: ["User ID is not valid"] };
        return res.redirect("/admin/manage-user");
      }

      const user = await User.findByPk(req.params.id);
      if (!user) {
        req.session.flash = { error: ["User not found"] };
        return res.redirect("/admin/manage-user");
      }

      await user.update({ password: "password" });

      req.session.flash = { success: "Password reset successfully" };
      res.redirect("/admin/manage-user");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;

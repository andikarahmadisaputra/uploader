"use strict";
const { hashPassword } = require("../helpers/bcrypt");
const { Model } = require("sequelize");
const { formatDate } = require("../helpers/helper");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.belongsToMany(models.Role, {
        through: "UserRoles",
        foreignKey: "UserId",
        otherKey: "RoleId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        as: "Roles",
      });
      User.belongsToMany(models.File, {
        through: "UserFiles",
        foreignKey: "UserId",
        otherKey: "FileId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        as: "SharedFile",
      });
      User.hasMany(models.File, {
        foreignKey: "UserId",
        as: "OwnedFile",
        onDelete: "CASCADE",
      });
    }

    get createdDate() {
      return formatDate(this.createdAt);
    }
  }
  User.init(
    {
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Username required!",
          },
          notEmpty: {
            msg: "Username required!",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Password required!",
          },
          notEmpty: {
            msg: "Password required!",
          },
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Name required!",
          },
          notEmpty: {
            msg: "Name required!",
          },
        },
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Gender required!",
          },
          notEmpty: {
            msg: "Gender required!",
          },
          isIn: {
            args: [["male", "female"]],
            msg: "Gender must be male or female",
          },
        },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Status required!",
          },
          notEmpty: {
            msg: "Status required!",
          },
          isIn: {
            args: [["active", "inactive"]],
            msg: "Status must be active or inactive",
          },
        },
      },
    },
    {
      hooks: {
        beforeCreate: async (instance, options) => {
          instance.password = await hashPassword(instance.password);
        },
        beforeUpdate: async (instance, options) => {
          instance.password = await hashPassword(instance.password);
        },
      },
      sequelize,
      modelName: "User",
    }
  );
  return User;
};

"use strict";
const { Model } = require("sequelize");
const { formatDate } = require("../helpers/helper");
module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      File.belongsToMany(models.User, {
        through: "UserFiles",
        foreignKey: "FileId",
        otherKey: "UserId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        as: "SharedWith",
      });
      File.belongsTo(models.User, {
        foreignKey: "UserId",
        as: "Owner",
      });
    }

    get createdDate() {
      return formatDate(this.createdAt);
    }
  }
  File.init(
    {
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
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "URL required!",
          },
          notEmpty: {
            msg: "URL required!",
          },
        },
      },
      UserId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "cascade",
        onUpdate: "cascade",
      },
    },
    {
      sequelize,
      modelName: "File",
    }
  );
  return File;
};

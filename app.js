if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const router = require("./routes/index");
const { sequelize } = require("./models");
const path = require("path");

const app = express();
const port = process.env.PORT || 8080;

app.set("view engine", "ejs");

const sessionStore = new SequelizeStore({
  db: sequelize,
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "rahasia-super-aman",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: false,
    },
  })
);

sessionStore.sync();

app.use((req, res, next) => {
  res.locals.success_msg = req.session.flash?.success;
  res.locals.error_msg = req.session.flash?.error;
  delete req.session.flash;
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", router);

sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Database connected");
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Unable to connect to the database:", err);
  });

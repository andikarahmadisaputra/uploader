const router = require("express").Router();
const routerAdmin = require("./admin");
const Controller = require("../controllers/controller");
const isNotAuth = require("../middleware/isNotAuth");
const authentication = require("../middleware/authentication");
const guardAdmin = require("../middleware/guardAdmin");
const errorHandler = require("../middleware/errorHandler");
const upload = require("../middleware/multer");

router.get("/login", isNotAuth, Controller.getLogin);
router.post("/login", isNotAuth, Controller.postLogin);

router.get("/favicon.ico", (req, res) => res.status(204).end());

router.use(authentication);

router.get("/logout", Controller.getLogout);

router.get("/", Controller.home);
router.get("/owned", Controller.getOwnedFile);
router.post("/upload", upload.single("file"), Controller.postUploadOwnedFile);
router.get("/owned/:id/download", Controller.getDownloadOwnedFile);
router.get("/owned/:id/delete", Controller.getDeleteOwnedFile);
router.get("/owned/:id/share", Controller.getShareOwnedFile);
router.post("/owned/:id/share", Controller.postShareOwnedFile);
router.get("/shared", Controller.getSharedFile);
router.get("/shared/:id/download", Controller.getDownloadSharedFile);

router.use("/admin", guardAdmin, routerAdmin);

router.use(errorHandler);

module.exports = router;

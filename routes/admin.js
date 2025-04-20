const router = require("express").Router();
const AdminController = require("../controllers/adminController");

router.get("/manage-user", AdminController.getManageUser);
router.get("/manage-user/add", AdminController.getAddUser);
router.post("/manage-user/add", AdminController.postAddUser);
router.get("/manage-user/:id/detail", AdminController.getDetailUser);
router.get("/manage-user/:id/active", AdminController.getActivatedUser);
router.get("/manage-user/:id/inactive", AdminController.getInactivatedUser);
router.get("/manage-user/:id/delete", AdminController.getDeleteUser);

module.exports = router;

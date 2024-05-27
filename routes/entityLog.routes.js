const { Router } = require("express");
var authMiddleware = require("../Middleware/AuthMiddleware");
const router = Router();
const entityLog = require("../controllers/entityLog.controller");

router.get(
    "/get_snlist_LogById/:_id",
    entityLog.getEntityLogById
);
router.post(
    "/createEntityLogForFamousPerson",
    entityLog.createEntityLogForFamousPerson
);

module.exports = router;
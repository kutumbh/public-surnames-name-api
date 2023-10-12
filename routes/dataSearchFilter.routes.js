
const { Router } = require("express");
var authMiddleware = require("../Middleware/AuthMiddleware");
const router = Router();
const dataSearchController = require("../controllers/dataSearchFilter.controller");

router.post(
  "/get_snlist_filterData",
  dataSearchController.getSearchFilterData
);
router.post(
  "/get_snanalytics_count",
  dataSearchController.getCountsOfSurname
);
module.exports = router;

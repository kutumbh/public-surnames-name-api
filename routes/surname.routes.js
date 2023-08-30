const { Router } = require("express");
const router = Router();
var authMiddleware = require("../Middleware/AuthMiddleware");

const surnameController = require("../controllers/surname.controller");
router.post(
    "/createSurname",authMiddleware.Validate,
    surnameController.createSurname
);

router.put(
    "/updateSurname/:_id", authMiddleware.Validate,
    surnameController.updateSurname
);
router.put(
    "/updateSurnameForm/:_id",
    surnameController.updateSurnameForm
);
router.delete("/deleteSurname/:_id", authMiddleware.Validate,
surnameController.deleteSurname
);
router.get("/getAllSurnameDownload", surnameController.getAllSurnameDownload
);
router.post('/fileuploadSurname/:id/:excelfile',surnameController.fileuploading);
router.post('/getDropDownMasterInSurname',surnameController.getDropDownMasterInSurname);
router.post('/getSurnameFilter',surnameController.getSurnameFilter);
router.get('/getSurnameById/:_id',surnameController.getSurnameById);
router.post('/updateSurnameStatusVerified',surnameController.updateSurnameStatusVerified);
router.get('/countAndUpdatedSurnames',surnameController.countAndUpdatedSurnames);
router.get('/getDropDownMasterInReligion',surnameController.getDropDownMasterInReligion);
router.get('/getDropDownMasterInScript',surnameController.getDropDownMasterInScript);
router.get('/getDropDownMasterInweekOfYear',surnameController.getDropDownMasterInweekOfYear);

module.exports = router;
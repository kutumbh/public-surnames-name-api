const { Router } = require("express");
const router = Router();
var authMiddleware = require("../Middleware/AuthMiddleware");

const surnameController = require("../controllers/surname.controller");
// router.post(
//     "/createSurname",authMiddleware.Validate,
//     surnameController.createSurname
// );
router.post(
    "/createSurname",
    surnameController.createSurname
);
router.get(
    "/getAllSurnames",
    surnameController.getAllSurname
);
router.put(
    "/updateSurname/:_id", authMiddleware.Validate,
    surnameController.updateSurname
);
router.put(
    "/updateSurnameForm/:_id",
    surnameController.updateSurnameForm
);
// router.delete("/deleteSurname/:_id", authMiddleware.Validate,
// surnameController.deleteSurname
// );
router.delete("/deleteSurname/:_id",
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
router.get('/get_snlist_DropDownReligion',surnameController.getDropDownMasterInReligion);
router.get('/get_snlist_DropDownScript',surnameController.getDropDownMasterInScript);
router.get('/get_snlist_DropDownweekOfYear',surnameController.getDropDownMasterInweekOfYear);
router.get('/get_snlist_DropDownAssignTo',surnameController.getDropDownMasterInAssignTo);
router.get('/getTranslations',surnameController.getTranslations);
router.put('/updateSurnameAssignTo/:ecode',surnameController.updateSurnameAssignTo)
router.post('/get_snlist_distribution',surnameController.getSurnameDetails);
router.put('/updateSurnameStatus/:_id',surnameController.updateSurnameStatus)
module.exports = router;
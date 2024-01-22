const { Router } = require("express");
const router = Router();
var authMiddleware = require("../Middleware/AuthMiddleware");

const nameController = require("../controllers/name.controller");
router.post(
    "/createnames",
    nameController.createNames
);
router.get(
    "/getAllNames",
    nameController.getAllNames
);
router.put(
    "/updateNames/:_id", authMiddleware.Validate,
    nameController.updateNames
);
router.put(
    "/updateNameForm/:_id",
    nameController.updateNameForm
);
router.delete("/deleteName/:_id", authMiddleware.Validate,
    nameController.deleteName);

router.post("/createMultiplenames/:userId",
    // authMiddleware.Validate,
    nameController.createMultiplenames
);
router.get("/getAllNamesDownload",
    // authMiddleware.Validate,
    nameController.getAllNamesDownload
);
router.post('/nameAndsurnamesUploads',nameController.nameAndsurnamesUploads);
router.post('/changeTranslietrationNameAndSurname',nameController.changeTranslietrationNameAndSurname);
// router.post("/validateNamesData", nameController.validateNamesData);
router.post('/getNamesFilter', nameController.getNamesFilter);
router.get('/getNamesById/:_id', nameController.getNamesById);
router.get('/getAllTags', nameController.getAllTags);
router.post('/updateNameStatusVerified', nameController.updateNameStatusVerified);
router.post('/getNames', nameController.getNames);
router.put(
    "/updateNameForm/:_id",
    nameController.updateNameForm
);

module.exports = router;
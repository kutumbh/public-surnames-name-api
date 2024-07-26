const surnamesModel = require("../models/surname.model");
const EntityLogModel = require("../models/entityLog.model");
const religionModel = require("../models/religion.model");
const communityModel = require("../models/community.model");
const scriptModel = require("../models/script.model");
const pdUser = require("../models/pdUser.model");
const surnameDetailsModel = require("../models/surnamedetails.model");
const mongoose = require("mongoose");
const ObjectsToCsv = require("objects-to-csv");
const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const mime = require("mime");
const ITEM_PER_PAGE = 10;
const _ = require("lodash");
require("dotenv").config();
const s3 = new aws.S3();

// create a surnamedata
exports.createSurname = async ({ body }, res) => {
  try {
    // const name = new namesModel(body)
    const surnames = await surnamesModel.findOne({ surname: body.surname });
    console.log(surnames);
    if (surnames) {
      res.status(404).send({
        message: "Data Already Present",
      });
    } else {
      const surnames = new surnamesModel(body);
      if (surnames) {
        await surnames.save();
        res.status(201).send(surnames);
      } else {
        res.status(404).send({
          message: "Data found!",
        });
      }
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

//api to get all surnames
// exports.getAllSurname = async(req, res) => {
//     try {
//         const where = getSearchParams(req.query);
//         console.log('where:', where)
//         const surname = await surnamesModel.find(where)
//             .sort({ surname: 1 })
//         if (surname) {
//             surname.forEach(async(data) => {
//                     if (data.translations === null) {
//                         data.translations = []
//                     }
//                     else{
//                         const result = surname.filter((n, i) => {
//                             let data = n
//                             data.translations = n.translations.filter(t => {
//                                 if (t.lang === req.query.language)
//                                     return t
//                             })
//                             return data;
//                         })
//                     }
//                 })

//                 // const result = surname.filter((n, i) => {
//                 //     let data = n
//                 //     data.translations = n.translations.filter(t => {
//                 //         if (t.lang === req.query.language)
//                 //             return t
//                 //     })
//                 //     return data;
//                 // })
//             res.status(200).send(surname)
//         } else {
//             res.status(404).send({ message: 'No Data found' })
//         }
//     } catch (e) {
//         res.status(400).send(e.toString())
//     }
// }

const getSearchParams = (query) => {
  let where = {};
  console.log("query:", query);
  let surname = new RegExp(query.Surname, "i");
  // if status is done
  if (query.status == "Done") {
    where = {
      surname: { $regex: surname },
      "translations.lang": query.language,
    };
  }
  // if status is pending
  if (query.status == "Pending") {
    where = {
      surname: { $regex: surname },
      "translations.lang": { $ne: query.language },
    };
  }
  // if status is all
  if (query.status == "All") {
    where = {
      surname: { $regex: surname },
    };
  }
  return where;
};

// ////////////////   API For Update Translations field    ////////////////////
exports.updateSurname = async ({ params, body }, res) => {
  try {
    const _id = params._id;
    const language = body.language;
    const value = body.value;
    let updateSurname;
    // const updateSurname = await surnamesModel.update({ _id: _id }, { $set: { translations:[{lang:language,value:value}] } })
    const surname = await surnamesModel.findOne({
      _id: _id,
      "translations.lang": language,
    });
    console.log("names:", surname);
    if (surname) {
      updateSurname = await surnamesModel.update(
        { _id: _id, "translations.lang": language },
        {
          $set: {
            "translations.$.value": value,
          },
        }
      );
    } else {
      updateSurname = await surnamesModel.update(
        {
          _id: _id,
          translations: {
            $not: {
              $elemMatch: {
                lang: language,
              },
            },
          },
        },
        {
          $addToSet: {
            translations: { lang: language, value: value },
          },
        }
      );
    }
    if (updateSurname) {
      res.status(200).send({ message: "Translations Updated!", updateSurname });
    } else {
      res.status(404).send({
        message: "Data found!",
      });
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.updateSurnameForm = async ({ params, body }, res) => {
  try {
    const _id = params._id;
    console.log("id:", _id);
    if (body.action === "save") {
      const data = {
        surname: body.surname,
        surnameType: body.type,
        value:body.value,
        community: body.community,
        religion: body.religion,
        kuldevtaFamilyDeity: body.kuldevtaFamilyDeity,
        gotra: body.gotra,
        script: body.script,
        alternative: body.alternative,
        meaning: body.meaning,
        history: body.history,
        wikiUrl: body.wikiUrl,
        sStatus: body.sStatus,
        assignTo: body.assignTo,
        isPublished: body.isPublished,
      };

      const updatedData = await surnamesModel.findByIdAndUpdate(
        { _id: _id },
        data,
        { new: true }
      );

      if (!updatedData) {
        return res.status(404).send({ message: "No Data found" });
      }

      const updatedWeekData = await surnamesModel.updateOne({ _id: _id }, [
        {
          $addFields: {
            yearPart: { $year: "$updatedAt" },
            weekPart: { $week: "$updatedAt" },
          },
        },
        {
          $addFields: {
            weekOfYear: {
              $concat: [{ $toString: "$yearPart" }, { $toString: "$weekPart" }],
            },
          },
        },
        {
          $addFields: {
            weekOfYearInt: { $toInt: "$weekOfYear" },
          },
        },
        {
          $set: {
            weekOfYear: "$weekOfYearInt",
          },
        },
        {
          $unset: ["yearPart", "weekPart", "weekOfYearInt"],
        },
      ]);

      res.status(200).send({ updatedData });
    }
    // Action: Submit
    else if (body.action === "submit") {
      // Update in the surnamesModel collection
      const data = {
        surname: body.surname,
        community: body.community,
        religion: body.religion,
        surnameType: body.type,
        value:body.value,
        kuldevtaFamilyDeity: body.kuldevtaFamilyDeity,
        gotra: body.gotra,
        script: body.script,
        alternative: body.alternative,
        meaning: body.meaning,
        history: body.history,
        wikiUrl: body.wikiUrl,
        sStatus: body.sStatus,
        assignTo: body.assignTo,
        isPublished: body.isPublished,
        modifiedBy: body.modifiedBy,
      };

      const updatedData = await surnamesModel.findByIdAndUpdate(
        { _id: _id },
        data,
        { new: true }
      );

      if (!updatedData) {
        return res.status(404).send({ message: "No Data found" });
      }
      const updatedWeekData = await surnamesModel.updateOne({ _id: _id }, [
        {
          $addFields: {
            yearPart: { $year: "$updatedAt" },
            weekPart: { $week: "$updatedAt" },
          },
        },
        {
          $addFields: {
            weekOfYear: {
              $concat: [{ $toString: "$yearPart" }, { $toString: "$weekPart" }],
            },
          },
        },
        {
          $addFields: {
            weekOfYearInt: { $toInt: "$weekOfYear" },
          },
        },
        {
          $set: {
            weekOfYear: "$weekOfYearInt",
          },
        },
        {
          $unset: ["yearPart", "weekPart", "weekOfYearInt"],
        },
      ]);

      // Create a new record in the EntityLog collection
      if (body.saveData === true) {
        const newEntityLogEntry = new EntityLogModel({
          refURL: body.refURL,
          comment: body.comment,
          surnameId: _id,
          modifiedBy: body.modifiedBy,
        });
        const createdEntityLogEntry = await newEntityLogEntry.save();

        res.status(200).send({ updatedData, createdEntityLogEntry });
      } else {
        res.status(200).send({ updatedData });
      }
    } else {
      res.status(400).send({ message: "Invalid action" });
    }
  } catch (e) {
    console.error(e);
    res.status(400).send(e);
  }
};

exports.deleteSurname = async (req, res) => {
  try {
    const _id = req.params._id;
    console.log("Delete Surname id", _id);
    const surname = await surnamesModel.findByIdAndDelete({ _id: _id });
    if (surname) {
      res
        .status(201)
        .send({ message: "Surname Deleted Successfully" });
    } else {
      res.status(404).send({
        message: "Data not found!",
      });
    }
  } catch (e) {
    console.log(e)
    res.status(400).send(e);
  }
};
exports.getAllSurnameDownload = async (req, res) => {
  try {
    const where = getSearchParams(req.query);
    console.log("where:", where);
    const surnameData = await surnamesModel.find(where).sort({ surname: 1 });
    // console.log(surnameData)
    let filterArray = [];
    _.forEach(surnameData, async function (value) {
      let filterData = {};
      filterData.surname = value.surname;
      filterData.gender = value.gender;
      filterData.meaning = value.meaning;
      filterArray.push(filterData);
    });
    const csv = new ObjectsToCsv(filterArray);
    // Return the CSV file as string:
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).send({
      message:
        "Error -> Can NOT complete a paging + filtering + sorting request!",
      error: error.message,
    });
  }
};
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "video/mp4" ||
    file.mimetype === "video/x-msvideo" ||
    file.mimetype === "audio/mpeg" ||
    file.mimetype === "audio/mid" ||
    file.mimetype === "audio/mp4" ||
    file.mimetype === "video/3gp" ||
    file.mimetype === "text/csv"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, upload valid file only!"), false);
  }
};
function getSignedUrl(data) {
  try {
    console.log("data", data);
    // const contentDisposition = 'attachment; filename=\"' + name + '\"';
    //var key = urlParse.parse(data).pathname
    var key = data.replace(
      "https://kutumbh-repository.s3.ap-south-1.amazonaws.com/",
      ""
    );
    // key = key.replace('/', '')
    console.log("key", key);
    // ---profileImage/601d1e9896de4d014aab42a2/siblings@4x-100.jpg/1613390261646_siblings@4x-100.jpg
    var url = s3.getSignedUrl("getObject", {
      Bucket: "kutumbh-repository",
      Key: key,
      // Key: 'general/1601018967848.png',
      // ResponseContentDisposition: contentDisposition,
      // Expires: 7200 //2 hours
      Expires: 604800, // Expire 7 days   //on
    });
    return url;
  } catch (e) {
    console.log("Error", e.toString());
    return e;
  }
}
exports.fileuploading = async (req, res) => {
  // router.post('/image-upload/:id/:profilepicname', (req, res) => {
  try {
    const { section = "general" } = req.query;
    const upload = multer({
      fileFilter,
      // limits: {fileSize: 1024*5},
      storage: multerS3({
        // acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        s3,
        // limits: {fileSize: 1024*5},
        contentLength: 50000000, //50 MB file size
        //process.env.BUCKET_NAME,
        bucket: function (req, file, cb) {
          const queryParams = req.params;
          // console.log("imageupload", queryParams, req)
          var bktName =
            process.env.AWS_BUCKET_NAME +
            "/" +
            "master_excel" +
            "/" +
            queryParams.id +
            "/" +
            queryParams.excelfile;

          console.log("bktName", process.env.AWS_BUCKET_NAME);
          cb(null, bktName);
        },
        metadata(req, file, cb) {
          cb(null, { fieldName: file.fieldname });
        },
        key(req, file, cb) {
          const filename = Date.now().toString() + "_" + file.originalname; //+ '.' + mime.getExtension(file.mimetype);
          cb(null, filename);
        },
      }),
    });
    const singleUpload = upload.single("file");
    singleUpload(req, res, async (err) => {
      try {
        if (err) {
          return res.status(422).send({
            errors: [{ title: "Media Upload Error", detail: err.message }],
          });
        }
        if (req.file && req.file.location) {
          var key = req.file.key.split(".").slice(0, -1).join(".");
          console.log("req.file", req.file);
          //   const updateImage = await user.updateOne({ _id: req.params.id }, { profilepic: req.file.location }, { upsert: true });
          // console.log(updateImage);
          return res.json({
            fileUrl: getSignedUrl(req.file.location),
            key: key,
          });
        } else {
          return res.status(422).send("Error");
        }
      } catch (e) {
        res.status(400).send(e);
      }
    });
  } catch (e) {
    res.status(400).send(e);
  }
};

//***********api to get all surnames************

exports.getAllSurname = async (req, res) => {
  try {
    const where = getSearchParamss(req.query);
    console.log("where:", where);
    const surname = await surnamesModel.find(where).sort({ surname: 1 });
    if (surname) {
      surname.forEach(async (data) => {
        if (data.translations === null) {
          data.translations = [];
        } else {
          const result = surname.filter((n, i) => {
            let data = n;
            data.translations = n.translations.filter((t) => {
              if (t.lang === req.query.language) return t;
            });
            return data;
          });
        }
      });

      // const result = surname.filter((n, i) => {
      //     let data = n
      //     data.translations = n.translations.filter(t => {
      //         if (t.lang === req.query.language)
      //             return t
      //     })
      //     return data;
      // })
      res.status(200).send(surname);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e.toString());
  }
};

const getSearchParamss = (query) => {
  let where = {};
  console.log("query:", query);
  let surname = new RegExp(query.Surname, "i");
  let range = query.range ? query.range : null;
  // let range1 = query.range.toUpperCase();
  console.log(range);

  // if status is done
  if (query.status == "Done") {
    where = {
      surname: { $regex: surname },
      "translations.lang": query.language,
    };
  }
  // if status is pending
  if (query.status == "Pending") {
    where = {
      surname: { $regex: surname },
      "translations.lang": { $ne: query.language },
    };
  }
  // if status is all
  if (query.status == "All" && surname != null) {
    where = {
      surname: { $regex: surname },
    };
  }

  if (query.status == "Done" && range != null) {
    where = {
      surname: { $regex: "^[" + [range1] + "]" },
      "translations.lang": query.language,
    };
  }
  // if status is pending

  if (query.status == "Pending" && range != null) {
    where = {
      surname: { $regex: "^[" + [range1] + "]" },
      "translations.lang": { $ne: query.language },
    };
  }

  // if status is all
  if (query.status == "All" && range != null) {
    where = {
      // 'surname': { '$regex': '^[A-D a-d]'},
      surname: { $regex: "^[" + [range] + "]" },
    };
  }

  return where;
};
exports.getSurnameFilter = async (req, res) => {
  try {
    var getSurname;
    let surname = req.body.surname;
    let options = req.body.options;
    let optionsData = req.body.optionsData;
    let status = req.body.status;
    let languageCode = req.body.languageCode;
    let surnameStatus = req.body.surnameStatus;
    let translationsValue = req.body.translationsValue;

    // **********option for all filters*****************
    if (options === "All" && status === "Summary") {
      if (_.isEmpty(surname)) {
        const script = await surnamesModel.count({ script: { $ne: [] } });
        // aggregate([
        //     { $unwind: "$script" }, { $group: { _id: "$script", totalCount: { $sum: 1 } } }])
        const gotra = await surnamesModel.count({ gotra: { $ne: [] } });
        // aggregate([
        //     { $unwind: "$gotra" }, { $group: { _id: "$gotra", totalCount: { $sum: 1 } } }])
        const community = await surnamesModel.count({ community: { $ne: [] } });
        // aggregate([
        //     { $unwind: "$community" }, { $group: { _id: "$community", totalCount: { $sum: 1 } } }])
        const religion = await surnamesModel.count({ religion: { $ne: [] } });
        // aggregate([
        //     { $unwind: "$religion" }, { $group: { _id: "$religion", totalCount: { $sum: 1 } } }])
        const kuldevtaFamilyDeity = await surnamesModel.count({
          kuldevtaFamilyDeity: { $ne: [] },
        });
        // aggregate([
        //     { $unwind: "$kuldevtaFamilyDeity" }, { $group: { _id: "$kuldevtaFamilyDeity", totalCount: { $sum: 1 } } }])
        const translations = await surnamesModel.count({
          translations: { $ne: [] },
        });
        // const translations = await surnamesModel.aggregate([
        //     {
        //         $facet: {
        //             "Hindi": [
        //                 { $match: { "translations.lang": { $eq: "HI" } } },
        //                 { "$sortByCount": "$Hindi" }

        //             ],
        //             "Gujarati": [
        //                 { $match: { "translations.lang": { $eq: "GU" } } },
        //                 { "$sortByCount": "$Gujarati" }

        //             ],
        //             "Marathi": [
        //                 { $match: { "translations.lang": { $eq: "MR" } } },
        //                 { "$sortByCount": "$Marathi" }

        //             ],
        //             "Punjabi": [
        //                 { $match: { "translations.lang": { $eq: "PA" } } },
        //                 { "$sortByCount": "$Punjabi" }

        //             ],
        //             "SINDHI": [
        //                 { $match: { "translations.lang": { $eq: "SD" } } },
        //                 { "$sortByCount": "$SINDHI" }

        //             ],
        //             "TAMIL": [
        //                 { $match: { "translations.lang": { $eq: "TA" } } },
        //                 { "$sortByCount": "$TAMIL" }

        //             ],
        //             "BENGALI": [
        //                 { $match: { "translations.lang": { $eq: "BN" } } },
        //                 { "$sortByCount": "$TAMIL" }

        //             ],
        //             "TELGU": [
        //                 { $match: { "translations.lang": { $eq: "TLG" } } },
        //                 { "$sortByCount": "$TELGU" }

        //             ],
        //         }
        //     }
        // ])
        if (script) {
          res
            .status(200)
            .send([
              { option: { name: "script", script } },
              { option: { name: "gotra", gotra } },
              { option: { name: "community", community } },
              { option: { name: "religion", religion } },
              { option: { name: "kuldevtaFamilyDeity", kuldevtaFamilyDeity } },
              { option: { name: "translations", translations } },
            ]);
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    } else if (options === "All" && status !== "All") {
      if (!req.body.surname) {
        getSurname = await surnamesModel.find({
          sStatus: status,
        });
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "New";
          } else if (value.sStatus === "SS") {
            value.sStatus = "Submitted";
          } else if (value.sStatus === "SV") {
            value.sStatus = "To be Verified";
          }
        });
      } else {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel.find({
            surname: { $regex: "^[" + [surname] + "]" },
            sStatus: status,
          });
        } else {
          getSurname = await surnamesModel.find({
            surname: { $regex: surname },
            sStatus: status,
          });
        }
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "New";
          } else if (value.sStatus === "SS") {
            value.sStatus = "Submitted";
          } else if (value.sStatus === "SV") {
            value.sStatus = "To be Verified";
          }
        });
      }

      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (options === "All" && status === "All") {
      if (!req.body.surname) {
        getSurname = await surnamesModel.find().limit(1000);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "New";
          } else if (value.sStatus === "SS") {
            value.sStatus = "Submitted";
          } else if (value.sStatus === "SV") {
            value.sStatus = "To be Verified";
          }
        });
      } else {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel
            .find({
              surname: { $regex: "^[" + [surname] + "]" },
            })
            .limit(1000);
        } else {
          getSurname = await surnamesModel
            .find({
              surname: { $regex: surname },
              sStatus: {},
            })
            .limit(1000);
        }
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "New";
          } else if (value.sStatus === "SS") {
            value.sStatus = "Submitted";
          } else if (value.sStatus === "SV") {
            value.sStatus = "To be Verified";
          }
        });
      }
      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }

    // -*****************Mother Toung filters***************
    else if (options === "Script" && status === "All") {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel
          .find({
            script: optionsData,
            sStatus: { $ne: "SI" },
          })
          .limit(100);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "New";
          } else if (value.sStatus === "SS") {
            value.sStatus = "Submitted";
          } else if (value.sStatus === "SV") {
            value.sStatus = "To be Verified";
          }
        });
      } else {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel
            .find({
              $and: [
                { surname: { $regex: "^[" + [surname] + "]" } },
                { script: optionsData },
                { sStatus: { $ne: "SI" } },
              ],
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "New";
            } else if (value.sStatus === "SS") {
              value.sStatus = "Submitted";
            } else if (value.sStatus === "SV") {
              value.sStatus = "To be Verified";
            }
          });
        } else {
          getSurname = await surnamesModel
            .find({
              $and: [
                { surname: { $regex: surname } },
                { script: optionsData },
                { sStatus: { $ne: "SI" } },
              ],
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "New";
            } else if (value.sStatus === "SS") {
              value.sStatus = "Submitted";
            } else if (value.sStatus === "SV") {
              value.sStatus = "To be Verified";
            }
          });
        }
      }

      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (options === "Script" && status === "Summary") {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel.aggregate([
          { $unwind: "$script" },
          { $group: { _id: "$script", totalCount: { $sum: 1 } } },
        ]);
        // let totalSurnames = { totalCount:getSurname };
        console.log(getSurname);
        if (getSurname) {
          res.status(200).send([{ option: { name: "script", getSurname } }]);
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    } else if (
      options === "Script" &&
      status === "Exception Report" &&
      _.isEmpty(surname)
    ) {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel.find({ script: { $eq: [] } });
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "New";
          } else if (value.sStatus === "SS") {
            value.sStatus = "Submitted";
          } else if (value.sStatus === "SV") {
            value.sStatus = "To be Verified";
          }
        });
        // let totalSurnames = { totalCount:getSurname };
        console.log(getSurname);
        if (getSurname) {
          res.status(200).send({ getSurname });
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    } else if (
      options === "Script" &&
      status === "Exception Report" &&
      !_.isEmpty(surname)
    ) {
      if (surname.indexOf("-") > -1) {
        getSurname = await surnamesModel
          .find({
            script: { $eq: [] },
            surname: { $regex: "^[" + [surname] + "]" },
          })
          .limit(1000);
      } else {
        getSurname = await surnamesModel
          .find({ script: { $eq: [] } })
          .limit(1000);
      }
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
      });
      // let totalSurnames = { totalCount:getSurname };
      console.log(getSurname);
      if (getSurname) {
        res.status(200).send({ getSurname });
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (
      options === "Script" &&
      status === "Non Master" &&
      _.isEmpty(surname)
    ) {
      getSurname = await surnamesModel.aggregate([
        { $unwind: "$script" },
        {
          $lookup: {
            from: "scripts",
            localField: "script",
            foreignField: "name",
            as: "script_info",
          },
        },
        {
          $match: {
            "script_info.0": { $exists: false },
            script: { $ne: null },
          },
        },
        // {
        //     $group: {
        //         _id: "$_id"
        //     }
        // },
        // {
        //     $lookup:

        //     {
        //         from: "surnames",
        //         localField: "_id",
        //         foreignField: "_id",
        //         as: "finalData"
        //     }
        // },
        // { $unwind: "$finalData" },
      ]);
      console.log(getSurname);
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
      });
      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (
      options === "Script" &&
      status === "Non Master" &&
      !_.isEmpty(surname)
    ) {
      if (surname.indexOf("-") > -1) {
        getSurname = await surnamesModel.aggregate([
          { $unwind: "$script" },
          {
            $lookup: {
              from: "scripts",
              localField: "script",
              foreignField: "name",
              as: "script_info",
            },
          },
          {
            $match: {
              "script_info.0": { $exists: false },
              script: { $ne: null },
            },
          },
          // {
          //     $group: {
          //         _id: "$_id"
          //     }
          // },
          // {
          //     $lookup:

          //     {
          //         from: "surnames",
          //         localField: "_id",
          //         foreignField: "_id",
          //         as: "finalData"
          //     }
          // },
          // { $unwind: "$finalData" },
          { $match: { surname: { $regex: "^[" + [surname] + "]" } } },
        ]);
      } else {
        getSurname = await surnamesModel.aggregate([
          {
            $unwind: "$script",
          },
          {
            $lookup: {
              from: "scripts",
              localField: "script",
              foreignField: "name",
              as: "script_info",
            },
          },
          {
            $match: {
              "script_info.0": { $exists: false },
              script: { $ne: null },
            },
          },
          // {
          //     $group: {
          //         _id: "$_id"
          //     }
          // },
          // {
          //     $lookup:
          //     {
          //         from: "surnames",
          //         localField: "_id",
          //         foreignField: "_id",
          //         as: "finalData"
          //     }
          // },
          // { $unwind: "$finalData" }
        ]); // let totalSurnames = { totalCount:getSurname };
      }
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
      });
      console.log(getSurname);
      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    // *********Community filters ************
    else if (
      options === "Community" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) &&
      status === "All"
    ) {
      if (!req.body.surname) {
        getSurname = await surnamesModel
          .find({
            $and: [{ community: optionsData }, { sStatus: { $ne: "SI" } }],
          })
          .limit(1000);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "New";
          } else if (value.sStatus === "SS") {
            value.sStatus = "Submitted";
          } else if (value.sStatus === "SV") {
            value.sStatus = "To be Verified";
          }
        });
      } else {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel
            .find({
              $and: [
                { surname: { $regex: "^[" + [surname] + "]" } },
                { community: optionsData },
                { sStatus: { $ne: "SI" } },
              ],
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "New";
            } else if (value.sStatus === "SS") {
              value.sStatus = "Submitted";
            } else if (value.sStatus === "SV") {
              value.sStatus = "To be Verified";
            }
          });
        } else {
          getSurname = await surnamesModel
            .find({
              $and: [
                { surname: { $regex: surname } },
                { community: optionsData },
                { sStatus: { $ne: "SI" } },
              ],
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "New";
            } else if (value.sStatus === "SS") {
              value.sStatus = "Submitted";
            } else if (value.sStatus === "SV") {
              value.sStatus = "To be Verified";
            }
          });
        }
      }

      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (options === "Community" && status === "Summary") {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel.aggregate([
          { $unwind: "$community" },
          { $group: { _id: "$community", totalCount: { $sum: 1 } } },
        ]);
        // let totalSurnames = { totalCount:getSurname };
        console.log(getSurname);
        if (getSurname) {
          res.status(200).send([{ option: { name: "community", getSurname } }]);
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    } else if (
      options === "Community" &&
      status === "Exception Report" &&
      _.isEmpty(surname)
    ) {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel.find({ community: { $eq: [] } });
        // let totalSurnames = { totalCount:getSurname };
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "New";
          } else if (value.sStatus === "SS") {
            value.sStatus = "Submitted";
          } else if (value.sStatus === "SV") {
            value.sStatus = "To be Verified";
          }
        });
        console.log(getSurname);
        if (getSurname) {
          res.status(200).send(getSurname);
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    } else if (
      options === "Community" &&
      status === "Exception Report" &&
      !_.isEmpty(surname)
    ) {
      if (surname.indexOf("-") > -1) {
        getSurname = await surnamesModel
          .find({
            community: { $eq: [] },
            surname: { $regex: "^[" + [surname] + "]" },
          })
          .limit(1000);
      } else {
        getSurname = await surnamesModel
          .find({ community: { $eq: [] } })
          .limit(1000);
      }
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
      });
      console.log(getSurname);
      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (
      options === "Community" &&
      status === "Non Master" &&
      _.isEmpty(surname)
    ) {
      getSurname = await surnamesModel.aggregate([
        {
          $unwind: "$community",
        },
        {
          $lookup: {
            from: "communities",
            localField: "community",
            foreignField: "name",
            as: "community_info",
          },
        },
        {
          $match: {
            "community_info.0": { $exists: false },
            community: { $ne: null },
          },
        },
        // {
        //     $group: {
        //         _id: "$_id"
        //     }
        // },
        // {
        //     $lookup:
        //     {
        //         from: "surnames",
        //         localField: "_id",
        //         foreignField: "_id",
        //         as: "finalData"
        //     }
        // },
        // { $unwind: "$finalData" }
      ]); // let totalSurnames = { totalCount:getSurname };
      console.log(getSurname);
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
      });
      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (
      options === "Community" &&
      status === "Non Master" &&
      !_.isEmpty(surname)
    ) {
      if (surname.indexOf("-") > -1) {
        getSurname = await surnamesModel.aggregate([
          {
            $unwind: "$community",
          },
          {
            $lookup: {
              from: "communities",
              localField: "community",
              foreignField: "name",
              as: "community_info",
            },
          },
          {
            $match: {
              "community_info.0": { $exists: false },
              community: { $ne: null },
            },
          },
          // {
          //     $group: {
          //         _id: "$_id"
          //     }
          // },
          // {
          //     $lookup:
          //     {
          //         from: "surnames",
          //         localField: "_id",
          //         foreignField: "_id",
          //         as: "finalData"
          //     }
          // },
          // { $unwind: "$finalData" },
          { $match: { surname: { $regex: "^[" + [surname] + "]" } } },
        ]); // let totalSurnames = { totalCount:getSurname };
        console.log(getSurname);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "New";
          } else if (value.sStatus === "SS") {
            value.sStatus = "Submitted";
          } else if (value.sStatus === "SV") {
            value.sStatus = "To be Verified";
          }
        });
        if (getSurname) {
          res.status(200).send(getSurname);
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      } else {
        getSurname = await surnamesModel.aggregate([
          {
            $unwind: "$community",
          },
          {
            $lookup: {
              from: "communities",
              localField: "community",
              foreignField: "name",
              as: "community_info",
            },
          },
          {
            $match: {
              "community_info.0": { $exists: false },
              community: { $ne: null },
            },
          },
          // {
          //     $group: {
          //         _id: "$_id"
          //     }
          // },
          // {
          //     $lookup:
          //     {
          //         from: "surnames",
          //         localField: "_id",
          //         foreignField: "_id",
          //         as: "finalData"
          //     }
          // },
          // { $unwind: "$finalData" },
        ]);
        // let totalSurnames = { totalCount:getSurname }
      }
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
      });
      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    // -***********Religion filters***********
    else if (
      options === "Religion" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) &&
      status == "All"
    ) {
      if (!req.body.surname) {
        getSurname = await surnamesModel
          .find({
            $and: [{ religion: optionsData }, { sStatus: { $ne: "SI" } }],
          })
          .limit(1000);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "New";
          } else if (value.sStatus === "SS") {
            value.sStatus = "Submitted";
          } else if (value.sStatus === "SV") {
            value.sStatus = "To be Verified";
          }
        });
      } else {
        if (surname.indexOf("-") > -1) {
          getnames = await surnamesModel
            .find({
              $and: [
                { surname: { $regex: "^[" + [surname] + "]" } },
                { religion: optionsData },
                { sStatus: { $ne: "SI" } },
              ],
            })
            .limit(100);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "New";
            } else if (value.sStatus === "SS") {
              value.sStatus = "Submitted";
            } else if (value.sStatus === "SV") {
              value.sStatus = "To be Verified";
            }
          });
        } else {
          getnames = await surnamesModel
            .find({
              $and: [
                { surname: { $regex: surname } },
                { religion: optionsData },
                { sStatus: { $ne: "SI" } },
              ],
            })
            .limit(100);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "New";
            } else if (value.sStatus === "SS") {
              value.sStatus = "Submitted";
            } else if (value.sStatus === "SV") {
              value.sStatus = "To be Verified";
            }
          });
        }
      }

      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (options === "Religion" && status === "Summary") {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel.aggregate([
          { $unwind: "$religion" },
          { $group: { _id: "$religion", totalCount: { $sum: 1 } } },
        ]); // let totalSurnames = { totalCount:getSurname };
        console.log(getSurname);
        if (getSurname) {
          res.status(200).send([{ option: { name: "religion", getSurname } }]);
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    } else if (
      options === "Religion" &&
      status === "Exception Report" &&
      _.isEmpty(surname)
    ) {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel.find({ religion: { $eq: [] } });
        // let totalSurnames = { totalCount:getSurname };
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "New";
          } else if (value.sStatus === "SS") {
            value.sStatus = "Submitted";
          } else if (value.sStatus === "SV") {
            value.sStatus = "To be Verified";
          }
        });
        console.log(getSurname);
        if (getSurname) {
          res.status(200).send({ getSurname });
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    } else if (
      options === "Religion" &&
      status === "Exception Report" &&
      !_.isEmpty(surname)
    ) {
      if (surname.indexOf("-") > -1) {
        getSurname = await surnamesModel
          .find({
            religion: { $eq: [] },
            surname: { $regex: "^[" + [surname] + "]" },
          })
          .limit(1000);
      } else {
        getSurname = await surnamesModel
          .find({ religion: { $eq: [] } })
          .limit(1000);
      }
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
      });

      console.log(getSurname);
      if (getSurname) {
        res.status(200).send({ getSurname });
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (
      options === "Religion" &&
      status === "Non Master" &&
      _.isEmpty(surname)
    ) {
      getSurname = await surnamesModel.aggregate([
        {
          $unwind: "$religion",
        },
        {
          $lookup: {
            from: "religions",
            localField: "religion",
            foreignField: "name",
            as: "religion_info",
          },
        },
        {
          $match: {
            "religion_info.0": { $exists: false },
            religion: { $ne: null },
          },
        },
        // {
        //     $group: {
        //         _id: "$_id"
        //     }
        // },
        // {
        //     $lookup:
        //     {
        //         from: "surnames",
        //         localField: "_id",
        //         foreignField: "_id",
        //         as: "finalData"
        //     }
        // },
        // { $unwind: "$finalData" }
      ]);
      // let totalSurnames = { totalCount:getSurname };
      console.log(getSurname);
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
      });
      if (getSurname) {
        res.status(200).send({ getSurname });
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (
      options === "Religion" &&
      status === "Non Master" &&
      !_.isEmpty(surname)
    ) {
      if (surname.indexOf("-") > -1) {
        getSurname = await surnamesModel.aggregate([
          {
            $unwind: "$religion",
          },
          {
            $lookup: {
              from: "religions",
              localField: "religion",
              foreignField: "name",
              as: "religion_info",
            },
          },
          {
            $match: {
              "religion_info.0": { $exists: false },
              religion: { $ne: null },
            },
          },
          // {
          //     $group: {
          //         _id: "$_id"
          //     }
          // },
          // {
          //     $lookup:
          //     {
          //         from: "surnames",
          //         localField: "_id",
          //         foreignField: "_id",
          //         as: "finalData"
          //     }
          // },
          // { $unwind: "$finalData" },
          { $match: { surname: { $regex: "^[" + [surname] + "]" } } },
        ]);

        console.log(getSurname);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "New";
          } else if (value.sStatus === "SS") {
            value.sStatus = "Submitted";
          } else if (value.sStatus === "SV") {
            value.sStatus = "To be Verified";
          }
        });
        if (getSurname) {
          res.status(200).send({ getSurname });
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        } // let totalSurnames = { totalCount:getSurname };
      } else {
        getSurname = await surnamesModel.aggregate([
          {
            $unwind: "$religion",
          },
          {
            $lookup: {
              from: "religions",
              localField: "religion",
              foreignField: "name",
              as: "religion_info",
            },
          },
          {
            $match: {
              "religion_info.0": { $exists: false },
              religion: { $ne: null },
            },
          },
          // {
          //     $group: {
          //         _id: "$_id"
          //     }
          // },
          // {
          //     $lookup:
          //     {
          //         from: "surnames",
          //         localField: "_id",
          //         foreignField: "_id",
          //         as: "finalData"
          //     }
          // },
          // { $unwind: "$finalData" },
        ]);
      }
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
      });
      if (getSurname) {
        res.status(200).send({ getSurname });
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    //**********kuldevtaFamilyDeity filters************* */
    else if (
      options === "Kuldevta" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) &&
      status === "All"
    ) {
      if (!req.body.surname) {
        getSurname = await surnamesModel
          .find({
            $and: [
              { kuldevtaFamilyDeity: optionsData },
              { sStatus: { $ne: "SI" } },
            ],
          })
          .limit(1000);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
        });
      } else {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel
            .find({
              $and: [
                { surname: { $regex: "^[" + [surname] + "]" } },
                { kuldevtaFamilyDeity: optionsData },
                { sStatus: { $ne: "SI" } },
              ],
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
          });
        } else {
          getSurname = await surnamesModel
            .find({
              $and: [
                { surname: { $regex: surname } },
                { kuldevtaFamilyDeity: optionsData },
                { sStatus: { $ne: "SI" } },
              ],
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
          });
        }
      }

      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (options === "Kuldevta" && status === "Summary") {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel.aggregate([
          { $unwind: "$kuldevtaFamilyDeity" },
          { $group: { _id: "$kuldevtaFamilyDeity", totalCount: { $sum: 1 } } },
        ]); // let totalSurnames = { totalCount:getSurname };
        console.log(getSurname);
        if (getSurname) {
          res
            .status(200)
            .send([{ option: { name: "kuldevtaFamilyDeity", getSurname } }]);
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    } else if (
      options === "Kuldevta" &&
      status === "Exception Report" &&
      _.isEmpty(surname)
    ) {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel.find({
          kuldevtaFamilyDeity: { $eq: [] },
        });
        // let totalSurnames = { totalCount:getSurname };
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
        });
        console.log(getSurname);
        if (getSurname) {
          res.status(200).send({ getSurname });
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    } else if (
      options === "Kuldevta" &&
      status === "Exception Report" &&
      !_.isEmpty(surname)
    ) {
      if (surname.indexOf("-") > -1) {
        getSurname = await surnamesModel
          .find({
            kuldevtaFamilyDeity: { $eq: [] },
            surname: { $regex: "^[" + [surname] + "]" },
          })
          .limit(1000);
      } else {
        getSurname = await surnamesModel
          .find({ kuldevtaFamilyDeity: { $eq: [] } })
          .limit(1000);
      }
      // let totalSurnames = { totalCount:getSurname };
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
      });
      console.log(getSurname);
      if (getSurname) {
        res.status(200).send({ getSurname });
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (
      options === "Kuldevta" &&
      status === "Non Master" &&
      _.isEmpty(surname)
    ) {
      getSurname = await surnamesModel.aggregate([
        {
          $unwind: "$kuldevtaFamilyDeity",
        },
        {
          $lookup: {
            from: "kuldevtas",
            localField: "kuldevtaFamilyDeity",
            foreignField: "name",
            as: "kuldevtaFamilyDeity_info",
          },
        },
        {
          $match: {
            "kuldevtaFamilyDeity_info.0": { $exists: false },
            kuldevtaFamilyDeity: { $ne: null },
          },
        },
        // {
        //     $group: {
        //         _id: "$_id"
        //     }
        // },
        // {
        //     $lookup:
        //     {
        //         from: "surnames",
        //         localField: "_id",
        //         foreignField: "_id",
        //         as: "finalData"
        //     }
        // },
        // { $unwind: "$finalData" }
      ]); // let totalSurnames = { totalCount:getSurname };
      console.log(getSurname);
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
      });
      if (getSurname) {
        res.status(200).send({ getSurname });
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (
      options === "Kuldevta" &&
      status === "Non Master" &&
      !_.isEmpty(surname)
    ) {
      if (surname.indexOf("-") > -1) {
        getSurname = await surnamesModel.aggregate([
          {
            $unwind: "$kuldevtaFamilyDeity",
          },
          {
            $lookup: {
              from: "kuldevtas",
              localField: "kuldevtaFamilyDeity",
              foreignField: "name",
              as: "kuldevtaFamilyDeity_info",
            },
          },
          {
            $match: {
              "kuldevtaFamilyDeity_info.0": { $exists: false },
              kuldevtaFamilyDeity: { $ne: null },
            },
          },
          // {
          //     $group: {
          //         _id: "$_id"
          //     }
          // },
          // {
          //     $lookup:
          //     {
          //         from: "surnames",
          //         localField: "_id",
          //         foreignField: "_id",
          //         as: "finalData"
          //     }
          // },
          // { $unwind: "$finalData" },
        ]); // let totalSurnames = { totalCount:getSurname };
        console.log(getSurname);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
        });
        if (getSurname) {
          res.status(200).send({ getSurname });
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      } else {
        getSurname = await surnamesModel.aggregate([
          {
            $unwind: "$kuldevtaFamilyDeity",
          },
          {
            $lookup: {
              from: "kuldevtas",
              localField: "kuldevtaFamilyDeity",
              foreignField: "name",
              as: "kuldevtaFamilyDeity_info",
            },
          },
          {
            $match: {
              "kuldevtaFamilyDeity_info.0": { $exists: false },
              kuldevtaFamilyDeity: { $ne: null },
            },
          },
          // {
          //     $group: {
          //         _id: "$_id"
          //     }
          // },
          // {
          //     $lookup:
          //     {
          //         from: "surnames",
          //         localField: "_id",
          //         foreignField: "_id",
          //         as: "finalData"
          //     }
          // },
          // { $unwind: "$finalData" },
          { $match: { surname: { $regex: "^[" + [surname] + "]" } } },
        ]); // let totalSurnames = { totalCount:getSurname };
        console.log(getSurname);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
        });
        if (getSurname) {
          res.status(200).send({ getSurname });
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    }
    //***********Gotra*************** */
    else if (
      options === "Gotra" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) &&
      status === "All"
    ) {
      if (!req.body.surname) {
        getSurname = await surnamesModel
          .find({
            $and: [{ gotra: optionsData }, { sStatus: { $ne: "SI" } }],
          })
          .limit(1000);
        // let totalSurnames = { totalCount:getSurname };
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
        });
      } else {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel
            .find({
              $and: [
                { surname: { $regex: "^[" + [surname] + "]" } },
                { gotra: optionsData },
                { sStatus: { $ne: "SI" } },
              ],
            })
            .limit(1000);
          // let totalSurnames = { totalCount:getSurname };
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
          });
        } else {
          getSurname = await surnamesModel
            .find({
              $and: [
                { surname: { $regex: surname } },
                { gotra: optionsData },
                { sStatus: { $ne: "SI" } },
              ],
            })
            .limit(1000);
          // let totalSurnames = { totalCount:getSurname };
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
          });
        }
      }

      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (options === "Gotra" && status === "Summary") {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel.aggregate([
          { $unwind: "$gotra" },
          { $group: { _id: "$gotra", totalCount: { $sum: 1 } } },
        ]);
        console.log(getSurname);
        if (getSurname) {
          res.status(200).send([{ option: { name: "gotra", getSurname } }]);
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    } else if (
      options === "Gotra" &&
      status === "Exception Report" &&
      _.isEmpty(surname)
    ) {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel.find({ gotra: { $eq: [] } });
        // let totalSurnames = { totalCount:getSurname };
        // let totalSurnames = { totalCount:getSurname };
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
        });
        console.log(getSurname);
        if (getSurname) {
          res.status(200).send({ getSurname });
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    } else if (
      options === "Gotra" &&
      status === "Exception Report" &&
      !_.isEmpty(surname)
    ) {
      if (surname.indexOf("-") > -1) {
        getSurname = await surnamesModel
          .find({
            gotra: { $eq: [] },
            surname: { $regex: "^[" + [surname] + "]" },
          })
          .limit(1000);
      } else {
        getSurname = await surnamesModel
          .find({ gotra: { $eq: [] } })
          .limit(1000);
      }
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
      });
      console.log(getSurname);
      if (getSurname) {
        res.status(200).send({ getSurname });
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (
      options === "Gotra" &&
      status === "Non Master" &&
      _.isEmpty(surname)
    ) {
      getSurname = await surnamesModel.aggregate([
        {
          $unwind: "$gotra",
        },
        {
          $lookup: {
            from: "gotras",
            localField: "gotra",
            foreignField: "name",
            as: "gotra_info",
          },
        },
        {
          $match: {
            "gotra_info.0": { $exists: false },
            gotra: { $ne: null },
          },
        },
        // {
        //     $group: {
        //         _id: "$_id"
        //     }
        // },
        // {
        //     $lookup:
        //     {
        //         from: "surnames",
        //         localField: "_id",
        //         foreignField: "_id",
        //         as: "finalData"
        //     }
        // },
        // { $unwind: "$finalData" }
      ]); // let totalSurnames = { totalCount:getSurname };
      console.log(getSurname);
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
      });
      if (getSurname) {
        res.status(200).send({ getSurname });
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (
      options === "Gotra" &&
      status === "Non Master" &&
      !_.isEmpty(surname)
    ) {
      if (surname.indexOf("-") > -1) {
        getSurname = await surnamesModel.aggregate([
          {
            $unwind: "$gotra",
          },
          {
            $lookup: {
              from: "gotras",
              localField: "gotra",
              foreignField: "name",
              as: "gotra_info",
            },
          },
          {
            $match: {
              "gotra_info.0": { $exists: false },
              gotra: { $ne: null },
            },
          },
          // {
          //     $group: {
          //         _id: "$_id"
          //     }
          // },
          // {
          //     $lookup:
          //     {
          //         from: "surnames",
          //         localField: "_id",
          //         foreignField: "_id",
          //         as: "finalData"
          //     }
          // },
          // { $unwind: "$finalData" },
          { $match: { surname: { $regex: "^[" + [surname] + "]" } } },
        ]); // let totalSurnames = { totalCount:getSurname };
        console.log(getSurname);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
        });
        if (getSurname) {
          res.status(200).send({ getSurname });
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      } else {
        getSurname = await surnamesModel.aggregate([
          {
            $unwind: "$gotra",
          },
          {
            $lookup: {
              from: "gotras",
              localField: "gotra",
              foreignField: "name",
              as: "gotra_info",
            },
          },
          {
            $match: {
              "gotra_info.0": { $exists: false },
              gotra: { $ne: null },
            },
          },
          // {
          //     $group: {
          //         _id: "$_id"
          //     }
          // },
          // {
          //     $lookup:
          //     {
          //         from: "surnames",
          //         localField: "_id",
          //         foreignField: "_id",
          //         as: "finalData"
          //     }
          // },
          // { $unwind: "$finalData" }
        ]); // let totalSurnames = { totalCount:getSurname };
        console.log(getSurname);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
        });
        if (getSurname) {
          res.status(200).send({ getSurname });
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    }
    //*********************Mother Toung single conditions check -------------------- */
    else if (options === "Script" && status !== "All") {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel.find({
          script: optionsData,
          sStatus: status,
        });
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
          console.log(value);
        });
      } else {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel.find({
            $and: [
              { surname: { $regex: "^[" + [surname] + "]" } },
              { script: optionsData },
              { sStatus: status },
            ],
          });
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
            console.log(value);
          });
        } else {
          getSurname = await surnamesModel.find({
            $and: [
              { surname: { $regex: surname } },
              { script: optionsData },
              { sStatus: status },
            ],
          });
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
            console.log(value);
          });
        }
      }

      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    // *********Community filters single conditions check************
    else if (
      options === "Community" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) &&
      status !== "All"
    ) {
      if (!req.body.surname) {
        getSurname = await surnamesModel.find({
          $and: [{ community: optionsData }, { sStatus: status }],
        });
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
          console.log(value);
        });
      } else {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel.find({
            $and: [
              { surname: { $regex: "^[" + [surname] + "]" } },
              { community: optionsData },
              { sStatus: status },
            ],
          });
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
            console.log(value);
          });
        } else {
          getSurname = await surnamesModel.find({
            $and: [
              { surname: { $regex: surname } },
              { community: optionsData },
              { sStatus: status },
            ],
          });
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
            console.log(value);
          });
        }
      }

      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    // -***********Religion filters single conditions check ***********
    else if (
      options === "Religion" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) &&
      status !== "All"
    ) {
      if (!req.body.surname) {
        getSurname = await surnamesModel.find({
          $and: [{ religion: optionsData }, { sStatus: status }],
        });
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
        });
      } else {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel.find({
            $and: [
              { surname: { $regex: "^[" + [surname] + "]" } },
              { religion: optionsData },
              { sStatus: status },
            ],
          });
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
          });
        } else {
          getSurname = await surnamesModel.find({
            $and: [
              { surname: { $regex: surname } },
              { religion: optionsData },
              { sStatus: status },
            ],
          });
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
          });
        }
      }

      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    //**********kuldevtaFamilyDeity filters single conditions check************* */
    else if (
      options === "Kuldevta" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) &&
      status !== "All"
    ) {
      if (!req.body.surname) {
        getSurname = await surnamesModel.find({
          $and: [{ kuldevtaFamilyDeity: optionsData }, { sStatus: status }],
        });
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
          console.log(value);
        });
      } else {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel.find({
            $and: [
              { surname: { $regex: "^[" + [surname] + "]" } },
              { kuldevtaFamilyDeity: optionsData },
              { sStatus: status },
            ],
          });
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
            console.log(value);
          });
        } else {
          getSurname = await surnamesModel.find({
            $and: [
              { surname: { $regex: surname } },
              { kuldevtaFamilyDeity: optionsData },
              { sStatus: status },
            ],
          });
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
            console.log(value);
          });
        }
      }

      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    //**********Gotra filters single conditions check************* */
    else if (
      options === "Gotra" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) &&
      status !== "All"
    ) {
      if (!req.body.surname) {
        getSurname = await surnamesModel
          .find({
            $and: [{ gotra: optionsData }, { sStatus: status }],
          })
          .limit(1000);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
          console.log(value);
        });
      } else {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel
            .find({
              $and: [
                { surname: { $regex: "^[" + [surname] + "]" } },
                { gotra: optionsData },
                { sStatus: status },
              ],
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
            console.log(value);
          });
        } else {
          getSurname = await surnamesModel
            .find({
              $and: [
                { surname: { $regex: surname } },
                { gotra: optionsData },
                { sStatus: status },
              ],
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
            console.log(value);
          });
        }
      }

      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    // *********translation filters****************
    if (options === "Transliterations" && status === "Summary") {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel.aggregate([
          { $unwind: "$translations" },
          { $group: { _id: "$translations.lang", count: { $sum: 1 } } },
          { $project: { count: 1 } },
        ]);
        _.forEach(getSurname, function (value) {
          if (value._id === "HI") {
            value._id = "HINDI";
          } else if (value._id === "GU") {
            value._id = "GUJARATI";
          } else if (value._id === "MR") {
            value._id = "MARATHI";
          } else if (value._id === "PA") {
            value._id = "PUNJABI";
          } else if (value._id === "SD") {
            value._id = "SINDHI";
          } else if (value._id === "TA") {
            value._id = "TAMIL";
          } else if (value._id === "BN") {
            value._id = "BENGALI";
          } else if (value._id === "TLG") {
            value._id = "TELUGU";
          }
          console.log(value);
        });
        //     {
        //         $facet: {
        //             "Hindi": [
        //                 { $match: { "translations.lang": { $eq: "HI" } } },
        //                 { "$sortByCount": "$Hindi" }
        //             ],
        //             "Gujarati": [
        //                 { $match: { "translations.lang": { $eq: "GU" } } },
        //                 { "$sortByCount": "$Gujarati" }
        //             ],
        //             "Marathi": [
        //                 { $match: { "translations.lang": { $eq: "MR" } } },
        //                 { "$sortByCount": "$Marathi" }

        //             ],
        //             "Punjabi": [
        //                 { $match: { "translations.lang": { $eq: "PA" } } },
        //                 { "$sortByCount": "$Punjabi" }
        //             ],
        //             "SINDHI": [
        //                 { $match: { "translations.lang": { $eq: "SD" } } },
        //                 { "$sortByCount": "$SINDHI" }
        //             ],
        //             "TAMIL": [
        //                 { $match: { "translations.lang": { $eq: "TA" } } },
        //                 { "$sortByCount": "$TAMIL" }
        //             ],
        //             "BENGALI": [
        //                 { $match: { "translations.lang": { $eq: "BN" } } },
        //                 { "$sortByCount": "$TAMIL" }
        //             ],
        //             "TELGU": [
        //                 { $match: { "translations.lang": { $eq: "TLG" } } },
        //                 { "$sortByCount": "$TELGU" }
        //             ],
        //         }
        //     }
        // ])
        console.log(getSurname);
        if (getSurname) {
          res
            .status(200)
            .send([{ option: { name: "translations", getSurname } }]);
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    } else if (
      options === "Transliterations" &&
      status === "Exception Report"
    ) {
      if (_.isEmpty(surname)) {
        getSurname = await surnamesModel.find({ translations: { $eq: [] } });
        // let totalSurnames = { totalCount:getSurname };
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
        });
        console.log(getSurname);
        if (getSurname) {
          res.status(200).send({ getSurname });
        } else {
          res.status(404).send({
            message: "No Data Found!",
          });
        }
      }
    } else if (options === "Transliterations") {
      if (status === "Done" && _.isEmpty(surname)) {
        getSurname = await surnamesModel
          .find({
            "translations.lang": optionsData,
          })
          .limit(1000);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
        });
      } else if (status === "Pending" && _.isEmpty(surname)) {
        getSurname = await surnamesModel
          .find({
            "translations.lang": { $ne: optionsData },
          })
          .limit(1000);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
        });
      } else if (status === "All" && _.isEmpty(surname)) {
        getSurname = await surnamesModel
          .find({
            $or: [
              { "translations.lang": { $ne: optionsData } },
              { "translations.lang": optionsData },
            ],
          })
          .limit(1000);
        _.forEach(getSurname, function (value) {
          if (value.sStatus === "SN") {
            value.sStatus = "Surname New";
          } else if (value.sStatus === "SE") {
            value.sStatus = "Surname Entry";
          } else if (value.sStatus === "SV") {
            value.sStatus = "Surname Verified";
          } else if (value.sStatus === "SI") {
            value.sStatus = "Surname Invalid";
          } else if (value.sStatus === "SP") {
            value.sStatus = "Surname Published";
          }
        });
      } else if (status === "All" && !_.isEmpty(surname)) {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel
            .find({
              $or: [
                { "translations.lang": optionsData },
                { "translations.lang": { $ne: optionsData } },
              ],
              surname: { $regex: "^[" + [surname] + "]" },
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
          });
        } else {
          getSurname = await surnamesModel
            .find({
              $or: [
                { "translations.lang": optionsData },
                { "translations.lang": { $ne: optionsData } },
              ],
              surname: { $regex: surname },
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
          });
        }
      } else if (status == "Pending" && !_.isEmpty(surname)) {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel
            .find({
              "translations.lang": { $ne: optionsData },
              surname: { $regex: "^[" + [surname] + "]" },
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
          });
        } else {
          getSurname = await surnamesModel
            .find({
              "translations.lang": { $ne: optionsData },
              surname: { $regex: surname },
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
          });
        }
      } else if (status == "Done" && !_.isEmpty(surname)) {
        if (surname.indexOf("-") > -1) {
          getSurname = await surnamesModel
            .find({
              "translations.lang": { $ne: optionsData },
              surname: { $regex: "^[" + [surname] + "]" },
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
          });
        } else {
          getSurname = await surnamesModel
            .find({
              "translations.lang": { $ne: optionsData },
              surname: { $regex: surname },
            })
            .limit(1000);
          _.forEach(getSurname, function (value) {
            if (value.sStatus === "SN") {
              value.sStatus = "Surname New";
            } else if (value.sStatus === "SE") {
              value.sStatus = "Surname Entry";
            } else if (value.sStatus === "SV") {
              value.sStatus = "Surname Verified";
            } else if (value.sStatus === "SI") {
              value.sStatus = "Surname Invalid";
            } else if (value.sStatus === "SP") {
              value.sStatus = "Surname Published";
            }
          });
        }
      }

      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    // **********only surname****************/
    else if (
      !_.isEmpty(surname) &&
      _.isEmpty(options) &&
      _.isEmpty(status) &&
      _.isEmpty(optionsData)
    ) {
      if (surname.indexOf("-") > -1) {
        getSurname = await surnamesModel.find({
          surname: { $regex: "^[" + [surname] + "]" },
        });
      } else {
        getSurname = await surnamesModel.find({
          surname: { $regex: surname },
        });
      }
      _.forEach(getSurname, function (value) {
        if (value.sStatus === "SN") {
          value.sStatus = "New";
        } else if (value.sStatus === "SS") {
          value.sStatus = "Submitted";
        } else if (value.sStatus === "SV") {
          value.sStatus = "To be Verified";
        }
        console.log(value);
      });

      if (getSurname) {
        res.status(200).send(getSurname);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }

    // if (translationsValue === "translations" && _.isEmpty(optionsData) && _.isEmpty(options) && _.isEmpty(surnameStatus)) {
    //     if (status == "Done") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "translations.lang": languageCode }
    //             ]
    //         }, { surname: 1, meaning: 1, translations: 1 })
    //     }
    //     else if (status == "Pending") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "translations": { $eq: [] } }
    //             ]
    //         }, { surname: 1, meaning: 1, translations: 1 })
    //     }
    //     else if (status == "Both") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //             ]
    //         }, { surname: 1, meaning: 1, translations: 1 })
    //     }

    //     if (getSurname) {
    //         res.status(200).send(getSurname)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
    // else if (surnameStatus === "All" && _.isEmpty(translationsValue) && _.isEmpty(optionsData) && _.isEmpty(options) && _.isEmpty(status) && _.isEmpty(languageCode)) {
    //     getSurname = await surnamesModel.find({ "surname": { "$regex": surname } }, { surname: 1, meaning: 1, translations: 1, sStatus: 1 })
    //     if (getSurname) {
    //         res.status(200).send(getSurname)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
    // else if (options === "kuldevtaFamilyDeity" && _.isNull(optionsData)) {
    //     getSurname = await surnamesModel.find({
    //         "$and":
    //             [
    //                 { "surname": { "$regex": surname } },
    //                 { "kuldevtaFamilyDeity": { $exists: true, $ne: [] } }
    //             ]
    //     })
    //     if (getSurname) {
    //         res.status(200).send(getSurname)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
    // else if (options === "kuldevtaFamilyDeity" && !_.isNull(optionsData)) {
    //     if (status == "Done") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "kuldevtaFamilyDeity": optionsData },
    //                 { "translations.lang": languageCode }
    //             ]
    //         })
    //     }
    //     else if (status == "Pending") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "kuldevtaFamilyDeity": optionsData },
    //                 { "translations": { $eq: [] } }
    //             ]
    //         })
    //     }
    //     else if (status == "Both") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "kuldevtaFamilyDeity": optionsData }
    //             ]
    //         })
    //     }

    //     if (getSurname) {
    //         res.status(200).send(getSurname)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
    // else if (options === "gotra" && _.isNull(optionsData)) {
    //     getSurname = await surnamesModel.find({
    //         "$and":
    //             [
    //                 { "surname": { "$regex": surname } },
    //                 { "gotra": { $exists: true, $ne: [] } }
    //             ]
    //     })
    //     if (getSurname) {
    //         res.status(200).send(getSurname)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
    // else if (options === "gotra" && !_.isNull(optionsData)) {
    //     if (status == "Done") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "gotra": optionsData },
    //                 { "translations.lang": languageCode }
    //             ]
    //         })
    //     }
    //     else if (status == "Pending") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "gotra": optionsData },
    //                 { "translations": { $eq: [] } }
    //             ]
    //         })
    //     }
    //     else if (status == "Both") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "gotra": optionsData }
    //             ]
    //         })
    //     }

    //     if (getSurname) {
    //         res.status(200).send(getSurname)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
    // else if (options === "religion" && _.isNull(optionsData)) {
    //     getSurname = await surnamesModel.find({
    //         "$and":
    //             [
    //                 { "surname": { "$regex": surname } },
    //                 { "religion": { $exists: true, $ne: [] } }
    //             ]
    //     })
    //     if (getSurname) {
    //         res.status(200).send(getSurname)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
    // else if (options === "religion" && !_.isNull(optionsData)) {
    //     if (status == "Done") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "religion": optionsData },
    //                 { "translations.lang": languageCode }
    //             ]
    //         })
    //     }
    //     else if (status == "Pending") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "religion": optionsData },
    //                 { "translations": { $eq: [] } }
    //             ]
    //         })
    //     }
    //     else if (status == "Both") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "religion": optionsData }
    //             ]
    //         })
    //     }

    //     if (getSurname) {
    //         res.status(200).send(getSurname)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
    // else if (options === "community" && _.isNull(optionsData)) {
    //     getSurname = await surnamesModel.find({
    //         "$and":
    //             [
    //                 { "surname": { "$regex": surname } },
    //                 { "community": { $exists: true, $ne: [] } }
    //             ]
    //     })
    //     if (getSurname) {
    //         res.status(200).send(getSurname)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
    // else if (options === "community" && !_.isNull(optionsData)) {
    //     if (status == "Done") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "community": optionsData },
    //                 { "translations.lang": languageCode }
    //             ]
    //         })
    //     }
    //     else if (status == "Pending") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "community": optionsData },
    //                 { "translations": { $eq: [] } }
    //             ]
    //         })
    //     }
    //     else if (status == "Both") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "community": optionsData }
    //             ]
    //         })
    //     }
    //     if (getSurname) {
    //         res.status(200).send(getSurname)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
    // else if (options === "script" && _.isNull(optionsData)) {
    //     getSurname = await surnamesModel.find({
    //         "$and":
    //             [
    //                 { "surname": { "$regex": surname } },
    //                 { "script": { $exists: true, $ne: [] } }
    //             ]
    //     }, { surname: 1, meaning: 1, translations: 1 });
    //     if (getSurname) {
    //         res.status(200).send(getSurname)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
    // else if (options === "script" && !_.isNull(optionsData)) {
    //     if (status == "Done") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "script": optionsData },
    //                 { "translations.lang": languageCode }
    //             ]
    //         })
    //     }
    //     else if (status == "Pending") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "script": optionsData },
    //                 { "translations": { $eq: [] } }
    //             ]
    //         })
    //     }
    //     else if (status == "Both") {
    //         getSurname = await surnamesModel.find({
    //             "$and": [
    //                 { "surname": { "$regex": surname } },
    //                 { "script": optionsData }
    //             ]
    //         })
    //     }
    //     if (getSurname) {
    //         res.status(200).send(getSurname)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
  } catch (e) {
    res.status(400).send(e);
  }
};

exports.getDropDownMasterInSurname = async (req, res) => {
  try {
    let options = req.body.options;
    if (options === "religion") {
      const getReligion = await religionModel.find().sort({ name: 1 });
      if (getReligion) {
        res.status(200).send(getReligion);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (options === "community") {
      const getCommunity = await communityModel.find().sort({ name: 1 });
      if (getCommunity) {
        res.status(200).send(getCommunity);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (options === "script") {
      const getScript = await scriptModel.find().sort({ name: 1 });
      if (getScript) {
        res.status(200).send(getScript);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

exports.getSurnameById = async (req, res) => {
  try {
    const surname = req.params.surname;
    const getSurname = await surnamesModel
      .findOne({ surname: surname })
      .populate("assignTo")
      .populate("modifiedBy");

    if (getSurname) {
      // Modify the sStatus property
      if (getSurname.sStatus === "SN") {
        getSurname.sStatus = "New";
      } else if (getSurname.sStatus === "SV") {
        getSurname.sStatus = "For Review";
      } else if (getSurname.sStatus === "SS") {
        getSurname.sStatus = "Verified";
      }else if(getSurname.sStatus === "ST"){
        getSurname.sStatus = "Content Updation";
      }

      if (getSurname.isPublished === "Y") {
        getSurname.isPublished = "Published";
      } else if (getSurname.isPublished === "N") {
        getSurname.isPublished = "Not Published";
      } else if (getSurname.isPublished === "B") {
        getSurname.isPublished = "Block";
      }
      res.status(201).send(getSurname);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
};

exports.updateSurnameStatusVerified = async (req, res) => {
  try {
    const _id = req.body._id;
    const sStatus = req.body.sStatus;
    console.log("_id:", _id);
    const surname = await surnamesModel.update(
      { _id: _id },
      { $set: { sStatus: sStatus } }
    );
    if (surname) {
      res.status(200).send({ message: "Surname Status Updated" });
    } else {
      res.status(404).send({
        message: "Data found!",
      });
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.countAndUpdatedSurnames = async (req, res) => {
  try {
    const getSurname = await surnamesModel.find({}).count();
    let totalSurnames = { totalCount: getSurname };
    const updatesurname = await surnamesModel
      .find({ $expr: { $ne: ["$createdAt", "$updatedAt"] } })
      .count();
    let updatedSurnames = { totalCount: updatesurname };
    if (totalSurnames) {
      res.status(200).send({ totalSurnames, updatedSurnames });
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

exports.getDropDownMasterInReligion = async (req, res) => {
  try {
    const getReligion = await surnamesModel.find().distinct("religion");
    if (getReligion) {
      res.status(200).send(getReligion);
    } else {
      res.status(404).send({
        message: "No Data Found!",
      });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};
exports.getDropDownMasterInScript = async (req, res) => {
  try {
    const getScript = await surnamesModel.find().distinct("script");
    if (getScript) {
      res.status(200).send(getScript);
    } else {
      res.status(404).send({
        message: "No Data Found!",
      });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};
exports.getDropDownMasterInweekOfYear = async (req, res) => {
  try {
    const getweekOfYear = await surnamesModel.find().distinct("weekOfYear");
    if (getweekOfYear) {
      res.status(200).send(getweekOfYear);
    } else {
      res.status(404).send({
        message: "No Data Found!",
      });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};
exports.getTranslations = async (req, res) => {
  try {
    const getTranslations = await surnamesModel.find().distinct("translations");
    if (getTranslations) {
      res.status(200).send(getTranslations);
    } else {
      res.status(404).send({
        message: "No Data Found!",
      });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};
exports.getDropDownMasterInAssignTo = async (req, res) => {
  try {
    // Find distinct 'assignTo' values
    const distinctAssignToValues = await surnamesModel.distinct("assignTo");
    console.log(distinctAssignToValues);

    let users = [];

    if (distinctAssignToValues.includes(null)) {
      users.push(null);
    }
    if (distinctAssignToValues !== null) {
      users = users.concat(
        await pdUser.find({ _id: { $in: distinctAssignToValues } })
      );
    }
    console.log(users);

    if (users.length > 0) {
      res.status(200).send(users);
    } else {
      res.status(404).send({
        message: "No User Data Found!",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
};

exports.getSurnameDetails = async (req, res) => {
  try {
    const lastName = req.body.lastName;

    const data = await surnameDetailsModel.find({ lastName: lastName });

    if (data.length === 0) {
      res.status(404).send({
        message: `No data found for lastName: ${lastName}`,
      });
    } else {
      const count = data[0].count;
      const placeData = data[0].place;
      const categoryData = data[0].categoryCount;

      placeData.sort(
        (firstItem, secondItem) => secondItem.count - firstItem.count
      );
      categoryData.sort(
        (firstItem, secondItem) => secondItem.count - firstItem.count
      );
      // Filter and process placeData to get state-wise counts
      const stateCounts = placeData.map((place) => {
        return {
          state: place._id,
          count: place.count,
        };
      });

      // Process categoryData to get source-wise counts
      const sourceCounts = categoryData.map((category) => {
        return {
          source: category._id,
          count: category.count,
        };
      });

      res.status(200).json({ count, stateCounts, sourceCounts });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e.message });
  }
};
exports.updateSurnameAssignTo = async ({ params, body }, res) => {
  try {
    const ecode = params.ecode;

    const data = {
      sStatus: body.sStatus,
      assignTo: body.assignTo,
    };

    const updatedData = await surnamesModel.findOneAndUpdate(
      { surname: ecode },
      data,
      { new: true }
    );

    if (!updatedData) {
      return res.status(404).send({ message: "No Data found" });
    }

    res.status(200).send({ updatedData });
  } catch (e) {
    // Action: Submit
    console.error(e);
    res.status(400).send(e);
  }
};

exports.updateSurnameStatus = async ({ params, body }, res) => {
  try {
    const id = params._id;
    const updatedData = await surnamesModel.findByIdAndUpdate(
      { _id: id },
      body,
      { new: true }
    );

    if (!updatedData) {
      return res.status(404).send({ message: "No Data found" });
    }
    const updatedWeekData = await surnamesModel.findByIdAndUpdate({ _id: id }, [
      {
        $addFields: {
          yearPart: { $year: "$updatedAt" },
          weekPart: { $week: "$updatedAt" },
        },
      },
      {
        $addFields: {
          weekOfYear: {
            $concat: [{ $toString: "$yearPart" }, { $toString: "$weekPart" }],
          },
        },
      },
      {
        $addFields: {
          weekOfYearInt: { $toInt: "$weekOfYear" },
        },
      },
      {
        $set: {
          weekOfYear: "$weekOfYearInt",
        },
      },
      {
        $unset: ["yearPart", "weekPart", "weekOfYearInt"],
      },
    ]);

    res.status(200).send({ updatedData });
  } catch (e) {
    // Action: Submit
    console.error(e);
    res.status(400).send(e);
  }
};

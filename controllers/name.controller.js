const namesModel = require("../models/name.model");
const surnamesModel = require("../models/surname.model");
const filesModel = require("../models/reposFiles.model");
const personsModel = require("../models/reposPersons.model");
const ObjectsToCsv = require("objects-to-csv");
const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const mime = require("mime");
const mongoose = require("mongoose");
const ITEM_PER_PAGE = 10;
const _ = require("lodash");
require("dotenv").config();
const s3 = new aws.S3();


exports.getNames = async(req, res) => {
  try {
      const name  = req.body.name;
      if (name.indexOf('-') > -1) {
        const rangeData = _.split(name, '-')
        console.log("--",rangeData[0], rangeData[1], rangeData[2])
        const community = await namesModel.count({name: { $regex: "^[" + [name] + "]" }})
        console.log(community)
          res.status(201).send(community)
      } else {
          res.status(404).send({
              message: "No Data Found!"
          })
      }
  } catch (e) {
      res.status(400).send(e)
  }
}

exports.createNames = async ({ body }, res) => {
  try {
    // const name = new namesModel(body)
    const name = await namesModel.findOne({ name: body.Name });
    console.log(name);
    if (name) {
      res.status(404).send({
        message: "Data Already Present, Please Update Translation field!",
      });
    } else {
      const name = new namesModel(body);
      if (name) {
        await name.save();
        res.status(201).send(name);
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

//api to get all Names
// exports.getAllNames = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page);
//         const limit = parseInt(req.query.limit)
//         const offset = page ? page * limit : 0;
//         const id = req.body.id;
//         const where = getSearchParams(req.query);
//         console.log('where:', where)
//         const name = await namesModel.find(where)
//             .sort({ name: 1 })
//         // .skip(offset) // Always apply 'skip' before 'limit'
//         // .limit(limit)
//         // .select("-__v"); // This is your 'page size'
//         // console.log(Name)
//         if (name) {
//             // let numOfNames = await NamesDataMode l.countDocuments();
//             const result = name.filter((n, i) => {
//                 let data = n
//                 data.translations = n.translations.filter(t => {
//                     if (t.lang === req.query.language)
//                         return t
//                 })
//                 return data;
//             })

//             // res.status(200).json({
//             //     "message": "Paginating is completed! parameters: page = " + page + ", limit = " + limit,
//             //     "totalPages": Math.ceil(numOfNames / limit),
//             //     "totalItems": numOfNames,
//             //     "maxRowlimit": limit,
//             //     "currentPageSize": Name.length,
//             //     "results": result
//             // });
//             res.status(200).send(name)
//         } else {
//             res.status(404).send({ message: 'No Data found' })
//         }

//     } catch (error) {
//         res.status(500).send({
//             message: "Error -> Can NOT complete a paging + filtering + sorting request!",
//             error: error.message,
//         });
//     }
// }

const getSearchParams = (query) => {
  let where = {};
  console.log("query:", query);
  let name = new RegExp(query.Name, "i");
  // if status is done
  if (query.status == "Done") {
    where = {
      name: { $regex: name },
      "translations.lang": query.language,
    };
  }
  // if status is pending
  if (query.status == "Pending") {
    where = {
      name: { $regex: name },
      "translations.lang": { $ne: query.language },
    };
  }
  // if status is all
  if (query.status == "All") {
    where = {
      name: { $regex: name },
    };
  }
  return where;
};

// ////////////////   API For Update Translations field /////////////////////
exports.updateNames = async ({ params, body }, res) => {
  try {
    const _id = params._id;
    const language = body.language;
    const value = body.value;
    let updateNames;
    // const updateNames = await namesModel.update({ _id: _id }, { $set: { translations:[{lang:language,value:value}] } })
    const names = await namesModel.findOne({
      _id: _id,
      "translations.lang": language,
    });
    console.log("names:", names);
    if (names) {
      updateNames = await namesModel.update(
        { _id: _id, "translations.lang": language },
        {
          $set: {
            "translations.$.value": value,
          },
        }
      );
    } else {
      updateNames = await namesModel.update(
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
    if (updateNames) {
      res.status(200).send({ message: "Translations Updated!", updateNames });
    } else {
      res.status(404).send({
        message: "Data found!",
      });
    }
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.updateNameForm = async ({ params, body }, res) => {
  try {
    console.log("---" + body);
    const _id = params._id;
    console.log("id:" + _id);
    const updateNameData = await namesModel.findByIdAndUpdate(
      { _id: _id },
      body,
      { new: true }
    );
    if (updateNameData) {
      res.status(201).send(updateNameData);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

exports.deleteName = async (req, res) => {
  try {
    const _id = req.params._id;
    console.log("Delete Names id", _id);
    const names = await namesModel.remove({ _id: _id });
    if (names) {
      res.status(201).send({ message: "Name Deleted Successfully", names });
    } else {
      res.status(404).send({
        message: "Data not found!",
      });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

exports.createMultiplenames = async (req, res) => {
  // const names = await insertMany([names]);
  const createdBy = req.params.userId;
  // console.log("createdBy:", createdBy)
  let names = req.body.names;
  let surnames = req.body.surnames;

  names = names.map((e) => {
    return {
      name: e.name.toUpperCase(),
      gender: e.gender,
      createdBy: createdBy,
    };
  });
  surnames = surnames.map((e) => {
    return { surname: e.surname.toUpperCase(), createdBy: createdBy };
  });
  console.log(names);
  try {
    const nameResult = await namesModel.insertMany(names);
    const surnameResult = await surnamesModel.insertMany(surnames);
    if (nameResult || surnameResult) {
      console.log("nameResult:", nameResult, "surnameResult:", surnameResult);
      res
        .status(200)
        .send({ message: "Names and surnames inserted successfully" });
    } else {
      res.status(404).send({
        message: "Data Already Present",
      });
    }
  } catch (e) {
    res.status(409).send(e.toString());
  }
};

exports.getAllNamesDownload = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const offset = page ? page * limit : 0;
    const id = req.body.id;
    let fromDate = req.body.fromDate;
    let toDate = req.body.toDate;
    const where = getSearchParams(req.query);
    console.log("where:", where);
    const nameData = await namesModel.find().sort({ name: 1 });
    // console.log(nameData)
    let filterArray = [];
    _.forEach(nameData, async function (value) {
      let filterData = {};
      filterData.name = value.name;
      filterData.gender = value.gender;
      filterData.meaning = value.meaning;
      filterArray.push(filterData);
    });
    const csv = new ObjectsToCsv(filterArray);
    // Return the CSV file as string:
    res.status(200).send(csv);
    // console.log(await csv.toString());
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
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, upload valid file only!"), false);
  }
};
function getSignedUrl(data) {
  try {
    console.log("data", data);
    var key = data.replace(
      "https://dev-kutumbh-masters.s3.ap-south-1.amazonaws.com/",
      ""
    );
    // key = key.replace('/', '')
    console.log("key", key);
    var url = s3.getSignedUrl("getObject", {
      Bucket: "dev-kutumbh-masters",
      Key: key,
      Expires: 604800, // Expire 7 days   //on
    });
    return url;
  } catch (e) {
    console.log("Error", e.toString());
    return e;
  }
}
exports.nameAndsurnamesUploads = async (req, res) => {
  try {
    const { section = "general" } = req.query;
    const upload = multer({
      fileFilter,
      storage: multerS3({
        contentType: multerS3.AUTO_CONTENT_TYPE,
        s3,
        contentLength: 50000000, //50 MB file size
        //process.env.BUCKET_NAME,
        bucket: function (req, file, cb) {
          const queryParams = req.query;
          if (queryParams.main_Option == "newMasters") {
            let bucketName =
              queryParams.fileName === "names"
                ? "newMasterNames"
                : "newMasterSurnames";
            var bktName = process.env.AWS_BUCKET_NAME_MASTER + "/" + bucketName;
          } else if (queryParams.main_Option == "translitration") {
            var bktName =
              process.env.AWS_BUCKET_NAME_MASTER +
              "/" +
              "translitration" +
              "/" +
              queryParams.fileName;
          }
          console.log("bktName", process.env.AWS_BUCKET_NAME_MASTER);
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

//*****************api to get all Names******************

exports.getAllNames = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const offset = page ? page * limit : 0;
    const id = req.body.id;
    const where = getSearchParamss(req.query);
    console.log("where:", where);
    const name = await namesModel
      .find(where)

      .sort({ name: 1 });
    // .skip(offset) // Always apply 'skip' before 'limit'
    // .limit(limit)
    // .select("-__v"); // This is your 'page size'
    // console.log(Name)
    if (name) {
      // let numOfNames = await NamesDataMode l.countDocuments();
      const result = name.filter((n, i) => {
        let data = n;
        data.translations = n.translations.filter((t) => {
          if (t.lang === req.query.language) s;
          return t;
        });
        return data;
      });

      // res.status(200).json({
      //     "message": "Paginating is completed! parameters: page = " + page + ", limit = " + limit,
      //     "totalPages": Math.ceil(numOfNames / limit),
      //     "totalItems": numOfNames,
      //     "maxRowlimit": limit,
      //     "currentPageSize": Name.length,
      //     "results": result
      // });
      res.status(200).send(name);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (error) {
    res.status(500).send({
      message:
        "Error -> Can NOT complete a paging + filtering + sorting request!",
      error: error.message,
    });
  }
};

const getSearchParamss = (query) => {
  let where = {};
  console.log("query:", query);
  let name = new RegExp(query.Name, "i");

  let range = query.range ? query.range : null;
  // let range1 = query.range.toUpperCase() ;
  console.log(range);

  // if status is done
  if (query.status == "Done" && name != null) {
    where = {
      name: { $regex: name },
      "translations.lang": query.language,
    };
  }
  // if status is pending
  if (query.status == "Pending" && name != null) {
    where = {
      name: { $regex: name },
      "translations.lang": { $ne: query.language },
    };
  }
  // if status is all
  if (query.status == "All" && name != null) {
    where = {
      name: { $regex: name },
    };
  }

  if (query.status == "Done" && range != null) {
    where = {
      name: { $regex: "^[" + [range] + "]" },
      "translations.lang": query.language,
    };
  }
  // if status is pending

  if (query.status == "Pending" && range != null) {
    where = {
      name: { $regex: "^[" + [range] + "]" },
      "translations.lang": { $ne: query.language },
    };
  }
  // if status is all
  if (query.status == "All" && range != null) {
    where = {
      // 'name': { '$regex': '^[A-D a-d]'},
      name: { $regex: "^[" + [range] + "]" },
    };
  }

  return where;
};

exports.changeTranslietrationNameAndSurname = async (req, res) => {
  try {
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let downloadNewName = req.body.downloadNewName;
    let language = req.body.language;
    let NamesArray = [];
    if (downloadNewName === "DNN") {
      NamesArray = await downloadRegionalName(
        downloadNewName,
        language,
        startDate,
        endDate
      );
    } else if (downloadNewName === "DNS") {
      NamesArray = await downloadRegionalSurname(
        downloadNewName,
        language,
        startDate,
        endDate
      );
    }
    if (NamesArray) {
      res.status(200).send({
        result: NamesArray,
      });
    } else {
      res.status(200).send({
        "Data valid": "download data",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e.toString());
  }
};

async function downloadRegionalName(
  downloadNewName,
  language,
  startDate,
  endDate
) {
  if (!_.isEmpty(downloadNewName)) {
    var downloadRegionalName = await filesModel.aggregate([
      {
        $match: {
          language: language,
        },
      },
      {
        $lookup: {
          from: "persons", // person table name
          localField: "_id", // name of files table field
          foreignField: "fileId", // name of files table field
          as: "inventory_data", // alias for person table
        },
      },
      { $unwind: "$inventory_data" },
      {
        $match: {
          $and: [
            {
              "inventory_data.createdAt": {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
            { "inventory_data.name": { $ne: null } },
          ],
        },
      },
      {
        $project: {
          "inventory_data.fileId": 1,
          "inventory_data.name": 1,
          "inventory_data.regionalName": 1,
          "inventory_data.sex": 1,
        },
      },
    ]);
  }
  return downloadRegionalName;
}

async function downloadRegionalSurname(
  downloadNewName,
  language,
  startDate,
  endDate
) {
  if (!_.isEmpty(downloadNewName)) {
    var downloadRegionalSurname = await filesModel.aggregate([
      {
        $match: {
          language: language,
        },
      },
      {
        $lookup: {
          from: "persons", // person table name
          localField: "_id", // name of files table field
          foreignField: "fileId", // name of files table field
          as: "inventory_data", // alias for person table
        },
      },
      { $unwind: "$inventory_data" },
      {
        $match: {
          $and: [
            {
              "inventory_data.createdAt": {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
            { "inventory_data.lastName": { $ne: null } },
          ],
        },
      },
      {
        $project: {
          "inventory_data.fileId": 1,
          "inventory_data.lastName": 1,
          "inventory_data.regionalLastName": 1,
        },
      },
    ]);
  }
  return downloadRegionalSurname;
}
exports.getNamesFilter = async (req, res) => {
  try {
    var getnames;
    let name = req.body.name;
    let options = req.body.options; // relegion
    let optionsData = req.body.optionsData; // hindu
    let status = req.body.status; // done,pending,all // 5 all status
    let languageCode = req.body.languageCode;
    let nameStatus = req.body.nameStatus;
    let translationsValue = req.body.translationsValue;
    // if (translationsValue === "translations" && _.isEmpty(optionsData) && _.isEmpty(options) && _.isEmpty(nameStatus)) {
    //     if (status == "Done") {
    //         getnames = await namesModel.find({
    //             "$and": [
    //                 { "name": { "$regex": name } },
    //                 { "translations.lang": languageCode }
    //             ]
    //         }, { name: 1, meaning: 1, translations: 1 })
    //     }
    //     else if (status == "Pending") {
    //         getnames = await namesModel.find({
    //             "$and": [
    //                 { "name": { "$regex": name } },
    //                 { "translations": { $eq: [] } }
    //             ]
    //         }, { name: 1, meaning: 1, translations: 1 })
    //     }
    //     else if (status == "Both") {
    //         getnames = await namesModel.find({
    //             "$and": [
    //                 { "name": { "$regex": name } },
    //             ]
    //         }, { name: 1, meaning: 1, translations: 1 })
    //     }

    //     if (getnames) {
    //         res.status(200).send(getnames)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
    // *************** Translation filters *******************
     if (options === "Transliterations" && status === "Summary") {
      if (_.isEmpty(name)) {
         // aggregate([
        //   { $unwind: "$translations" }, { $group: { _id: "$translations", totalCount: { $sum: 1 } } }])
        getnames = await namesModel.aggregate( [
          { $unwind: "$translations" },
          { $group: { "_id": "$translations.lang", "count": { $sum: 1 } } },
          { $project: { "count": 1 } }
          ]);
          _.forEach(getnames, function (value) {
              if (value._id === "HI") {
                  value._id = "HINDI"
              } else if (value._id === "GU") {
                  value._id = "GUJARATI"
              } else if (value._id === "MR") {
                  value._id = "MARATHI"
              } else if (value._id === "PA") {
                  value._id = "PUNJABI"
              } else if (value._id === "SD") {
                  value._id = "SINDHI"
              } else if (value._id === "TA") {
                  value._id = "TAMIL"
              } else if (value._id === "BN") {
                  value._id = "BENGALI"
              } else if (value._id === "TLG") {
                  value._id = "TELUGU"
              }
              console.log(value);
          });
          console.log(getnames)
          if (getnames) {
              res.status(200).send([{ option: { "name": "translations", getnames } }])
          } else {
              res.status(404).send({
                  message: "No Data Found!"
              })
          }
      }
  }
  else if (options === "Transliterations" && status === "Exception Report" && _.isEmpty(name)) {
    if (_.isEmpty(name)) {
      getnames = await namesModel.find({ "translations": { $eq: [] } }).limit(1000);
        // let totalSurnames = { totalCount:getSurname };
        _.forEach(getnames, function(value) {
        if(value.nStatus === "NN"){
          value.nStatus = "Name New"
      } else if(value.nStatus === "NE"){
          value.nStatus = "Name Entry"
      } else if(value.nStatus === "NV"){
          value.nStatus = "Name Verified"
      } else if(value.nStatus === "NI"){
          value.nStatus = "Name Invalid"
      } else if(value.nStatus === "NP"){
          value.nStatus = "Name Published"
      }
    });
        console.log(getnames)
        if (getnames) {
            res.status(200).send({getnames})
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    }
}
else if (options === "Transliterations" && status === "Exception Report" && !_.isEmpty(name)) {
  if(name.indexOf('-') > -1){
    getnames = await namesModel.find({ "translations": { $eq: [] },
    name: { "$regex": "^[" + [name] + "]" }
  }).limit(1000);
  }
  else {
    getnames = await namesModel.find({ "translations": { $eq: [] } }).limit(1000);
  }
      // let totalSurnames = { totalCount:getSurname };
      _.forEach(getnames, function(value) {
      if(value.nStatus === "NN"){
        value.nStatus = "Name New"
    } else if(value.nStatus === "NE"){
        value.nStatus = "Name Entry"
    } else if(value.nStatus === "NV"){
        value.nStatus = "Name Verified"
    } else if(value.nStatus === "NI"){
        value.nStatus = "Name Invalid"
    } else if(value.nStatus === "NP"){
        value.nStatus = "Name Published"
    }
  });
      console.log(getnames)
      if (getnames) {
          res.status(200).send({getnames})
      } else {
          res.status(404).send({
              message: "No Data Found!"
          })
  }
}
   else if (options === "Transliterations") {
      if (status == "Done" && _.isEmpty(name)) {
        getnames = await namesModel.find({
          "translations.lang": optionsData,
        }).limit(1000);
      } else if (status == "Pending" && _.isEmpty(name)) {
        getnames = await namesModel.find({
          "translations.lang": { $ne: optionsData },
        }).limit(1000);
      } else if (status == "All" && _.isEmpty(name)) {
        getnames = await namesModel.find({
          $or: [
            { "translations.lang": { $ne: optionsData } },
            { "translations.lang": optionsData },
          ],
        }).limit(1000);
      } else if (status == "All" && !_.isEmpty(name)) {
        if(name.indexOf('-') > -1){
          getnames = await namesModel.find({
            $or: [
              { "translations.lang": optionsData },
              { "translations.lang": { $ne: optionsData } },
            ],
            name: { $regex: "^[" + [name] + "]" },
          }).limit(1000);
        }else{
        getnames = await namesModel.find({
          $or: [
            { "translations.lang": optionsData },
            { "translations.lang": { $ne: optionsData } },
          ],
          name: { $regex: name },
        }).limit(1000);
       }
      } else if (status == "Pending" && !_.isEmpty(name)) {
        if(name.indexOf('-') > -1){
        getnames = await namesModel.find({
          "translations.lang": { $ne: optionsData },
          name: { $regex: "^[" + [name] + "]" },
        });
      } else {
        getnames = await namesModel.find({
          "translations.lang": { $ne: optionsData },
          name: { $regex: name },
        });
      }
    }
       else if (status == "Done" && !_.isEmpty(name)) {
         if(name.indexOf('-') > -1){
          getnames = await namesModel.find({
            "translations.lang": optionsData,
            name: { $regex: "^[" + [name] + "]" },
           });
         }
         else{
        getnames = await namesModel.find({
          "translations.lang": optionsData,
          name: { $regex: name },
        });
      }
      }

      if (getnames) {
        res.status(200).send(getnames);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    } else if (
      nameStatus === "All" &&
      _.isEmpty(translationsValue) &&
      _.isEmpty(optionsData) &&
      _.isEmpty(options) &&
      _.isEmpty(status) &&
      _.isEmpty(languageCode)
    ) {
      getnames = await namesModel.find(
        { name: { $regex: name } },
        { name: 1, meaning: 1, translations: 1, nStatus: 1 }
      );
      _.forEach(getnames, function(value) {
        if(value.nStatus === "NN"){
          value.nStatus = "Name New"
      } else if(value.nStatus === "NE"){
          value.nStatus = "Name Entry"
      } else if(value.nStatus === "NV"){
          value.nStatus = "Name Verified"
      } else if(value.nStatus === "NI"){
          value.nStatus = "Name Invalid"
      } else if(value.nStatus === "NP"){
          value.nStatus = "Name Published"
      }
    });
      if (getnames) {
        res.status(200).send(getnames);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    //     else if (options === "tags" && !_.isNull(optionsData && !_.isNull(status))) {
    //         getnames = await namesModel.find({
    //             "$and": [
    //                 { "tags": optionsData },
    //                 {"nStatus":status}
    //             ]
    //         })

    //     if (getnames) {
    //         res.status(200).send(getnames)
    //     } else {
    //         res.status(404).send({
    //             message: "No Data Found!"
    //         })
    //     }
    // }
    //************for Tags filter ************************* */
    else if (options === "Tags" && status === "Summary") {
      if (_.isEmpty(name)) {
        getnames = await namesModel.aggregate([
          { $unwind: "$tags" }, { $group: { _id: "$tags", totalCount: { $sum: 1 } } }])
          console.log(getnames)
          if (getnames) {
              res.status(200).send([{ option: { "name": "tags", getnames } }])
          } else {
              res.status(404).send({
                  message: "No Data Found!"
              })
          }
      }
  }
  else if (options === "Tags" && status === "Exception Report" && _.isEmpty(name)) {
    if (_.isEmpty(name)) {
      getnames = await namesModel.find({ "tags": { $eq: [] } }).limit(1000);
        // let totalSurnames = { totalCount:getSurname };
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
        console.log(getnames)
        if (getnames) {
            res.status(200).send({getnames})
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    }
}
else if (options === "Tags" && status === "Exception Report" && !_.isEmpty(name)) {
  if(name.indexOf('-') > -1){
    getnames = await namesModel.find({ "tags": { $eq: [] },
   name: { "$regex": "^[" + [name] + "]" }
  }).limit(1000);
  }
  else {
    getnames = await namesModel.find({ "tags": { $eq: [] } }).limit(1000);
  }
      // let totalSurnames = { totalCount:getSurname };
      _.forEach(getnames, function(value) {
        if(value.nStatus === "NN"){
          value.nStatus = "Name New"
      } else if(value.nStatus === "NE"){
          value.nStatus = "Name Entry"
      } else if(value.nStatus === "NV"){
          value.nStatus = "Name Verified"
      } else if(value.nStatus === "NI"){
          value.nStatus = "Name Invalid"
      } else if(value.nStatus === "NP"){
          value.nStatus = "Name Published"
      }
    });
      console.log(getnames)
      if (getnames) {
          res.status(200).send({getnames})
      } else {
          res.status(404).send({
              message: "No Data Found!"
          })
      
  }
}
    else if (
      options === "Tags" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) && status !== "All"
    ) {
      if (!req.body.name) {
        getnames = await namesModel.find({
          $and: [{ tags: optionsData }, { nStatus: status }],
        });
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      }
       else {
        if (name.indexOf('-') > -1) {
          const rangeData = _.split(name, '-')
          console.log("--",rangeData[0], rangeData[2])
          getnames = await namesModel.find({$and: [{name: { $regex: "^[" + [name] + "]" }},
            {tags: optionsData }, { nStatus: status }]
          }).limit(1000);
          // console.log(getnames)
            res.status(201).send(getnames)
        } 
        else{
          getnames = await namesModel.find({
            $and: [
              { name: { $regex: name } },
              { tags: optionsData },
              { nStatus: status },
            ],
          }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
    }
  }
      if (getnames) {
        res.status(200).send(getnames);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    else if (
      options === "Tags" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) && status === "All"
    ) {
      if (!req.body.name) {
        getnames = await namesModel.find({
          $and: [{ tags: optionsData }, { nStatus: { $ne: "NI" } }],
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      } else {
        if (name.indexOf('-') > -1) {
          const rangeData = _.split(name, '-')
          console.log("--",rangeData[0], rangeData[2])
          getnames = await namesModel.find({
            $and: [
              {name: { $regex: "^[" + [name] + "]" }},
              { tags: optionsData },
             { nStatus: { $ne: "NI" } },
           ],
         }).limit(1000);
         _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
          // console.log(getnames)
          //   res.status(201).send(getnames)
        }
   else {      
       getnames = await namesModel.find({
     $and: [
      { name: { $regex: name } },
      { tags: optionsData },
      { nStatus: { $ne: "NI" } },
    ],
  })
      _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      }
    }
      if (getnames) {
        res.status(200).send(getnames);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }

    //************ for religion filters ****************
    else if (options === "Religion" && status === "Summary") {
      if (_.isEmpty(name)) {
        getnames = await namesModel.aggregate([
          { $unwind: "$religion" }, { $group: { _id: "$religion", totalCount: { $sum: 1 } } }])
          console.log(getnames)
          if (getnames) {
              res.status(200).send([{ option: { "name": "religion", getnames } }])
          } else {
              res.status(404).send({
                  message: "No Data Found!"
              })
          }
      }
  }
  else if (options === "Religion" && status === "Exception Report" && _.isEmpty(name)) {
    if (_.isEmpty(name)) {
      getnames = await namesModel.find({ "religion": { $eq: [] } }).limit(1000);
        // let totalSurnames = { totalCount:getSurname };
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
        console.log(getnames)
        if (getnames) {
            res.status(200).send({getnames})
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    }
}
else if (options === "Religion" && status === "Exception Report" && !_.isEmpty(name)) {
  if(name.indexOf('-') > -1){
    getnames = await namesModel.find({ "religion": { $eq: [] }, 
    name: { "$regex": "^[" + [name] + "]" }
  }).limit(1000);
  }
  else {
    getnames = await namesModel.find({ "religion": { $eq: [] } }).limit(1000);
  }
      // let totalSurnames = { totalCount:getSurname };
      _.forEach(getnames, function(value) {
        if(value.nStatus === "NN"){
          value.nStatus = "Name New"
      } else if(value.nStatus === "NE"){
          value.nStatus = "Name Entry"
      } else if(value.nStatus === "NV"){
          value.nStatus = "Name Verified"
      } else if(value.nStatus === "NI"){
          value.nStatus = "Name Invalid"
      } else if(value.nStatus === "NP"){
          value.nStatus = "Name Published"
      }
    });
      console.log(getnames)
      if (getnames) {
          res.status(200).send({getnames})
      } else {
          res.status(404).send({
              message: "No Data Found!"
          })
  }
}
else if (options === "Religion" && status === "Non Master" && _.isEmpty(name)) {
  if (_.isEmpty(name)) {
    getnames = await namesModel.aggregate([
          {
              $unwind: "$religion"
          },
          {
              $lookup:
              {
                  from: "religions",
                  localField: "religion",
                  foreignField: "name",
                  as: "religion_info"
              }
          },
          {
            $match: {
                "religion_info.0": { $exists: false },"religion": {$ne:null}
            }
        },
          // {
          //     $group: {
          //         _id: "$_id"
          //     }
          // },
          // {
          //     $lookup:
          //     {
          //         from: "names",
          //         localField: "_id",
          //         foreignField: "_id",
          //         as: "finalData"
          //     }
          // },
          // { $unwind: "$finalData" }
      ]);                // let totalSurnames = { totalCount:getSurname };
      console.log(getnames)
      _.forEach(getnames, function (value) {
        if (value.nStatus === "NN") {
            value.nStatus = "Name New"
        } else if (value.nStatus === "NE") {
            value.nStatus = "Name Entry"
        } else if (value.nStatus === "NV") {
            value.nStatus = "Name Verified"
        } else if (value.nStatus === "NI") {
            value.nStatus = "Name Invalid"
        } else if (value.nStatus === "NP") {
            value.nStatus = "Name Published"
        }
    });
      if (getnames) {
          res.status(200).send({ getnames })
      } else {
          res.status(404).send({
              message: "No Data Found!"
          })
      }
  }
}
else if (options === "Religion" && status === "Non Master" && !_.isEmpty(name)) {
  if(name.indexOf('-') > -1){
    getnames = await namesModel.aggregate([
      {
          $unwind: "$religion"
      },
      {
          $lookup:
          {
              from: "religions",
              localField: "religion",
              foreignField: "name",
              as: "religion_info"
          }
      },
      {
        $match: {
            "religion_info.0": { $exists: false },"religion": {$ne:null}
        }
    },
      // {
      //     $group: {
      //         _id: "$_id"
      //     }
      // },
      // {
      //     $lookup:
      //     {
      //         from: "names",
      //         localField: "_id",
      //         foreignField: "_id",
      //         as: "finalData"
      //     }
      // },
      // { $unwind: "$finalData" },
      { $match: { "name": { "$regex": "^[" + [name] + "]" } } }
  ]); 
}
else{
  getnames = await namesModel.aggregate([
    {
        $unwind: "$religion"
    },
    {
        $lookup:
        {
            from: "religions",
            localField: "religion",
            foreignField: "name",
            as: "religion_info"
        }
    },
    {
      $match: {
          "religion_info.0": { $exists: false },"religion": {$ne:null}
      }
  },
    // {
    //     $group: {
    //         _id: "$_id"
    //     }
    // },
    // {
    //     $lookup:
    //     {
    //         from: "names",
    //         localField: "_id",
    //         foreignField: "_id",
    //         as: "finalData"
    //     }
    // },
    // { $unwind: "$finalData" }
]);  
}
  _.forEach(getnames, function (value) {
    if (value.nStatus === "NN") {
        value.nStatus = "Name New"
    } else if (value.nStatus === "NE") {
        value.nStatus = "Name Entry"
    } else if (value.nStatus === "NV") {
        value.nStatus = "Name Verified"
    } else if (value.nStatus === "NI") {
        value.nStatus = "Name Invalid"
    } else if (value.nStatus === "NP") {
        value.nStatus = "Name Published"
    }
});
console.log(getnames)
if (getnames) {
    res.status(200).send({ getnames })
} else {
    res.status(404).send({
        message: "No Data Found!"
    })
}            // let totalSurnames = { totalCount:getSurname };

}
    else if (options === "religion" && _.isNull(optionsData) && status !== "All") {
      getnames = await namesModel.find({
        $and: [
          { name: { $regex: name } },
          { religion: { $exists: true, $ne: [] } },
        ],
      }).limit(1000);
      _.forEach(getnames, function(value) {
        if(value.nStatus === "NN"){
          value.nStatus = "Name New"
      } else if(value.nStatus === "NE"){
          value.nStatus = "Name Entry"
      } else if(value.nStatus === "NV"){
          value.nStatus = "Name Verified"
      } else if(value.nStatus === "NI"){
          value.nStatus = "Name Invalid"
      } else if(value.nStatus === "NP"){
          value.nStatus = "Name Published"
      }
    });
      if (getnames) {
        res.status(200).send(getnames);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    else if (
      options === "Religion" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) && status !== "All"
    ) {
      if (!req.body.name) {
        getnames = await namesModel.find({
          $and: [{ religion: optionsData }, { nStatus: status }],
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      } 
      else {
        if (name.indexOf('-') > -1) {
          const rangeData = _.split(name, '-')
          console.log("--",rangeData[0], rangeData[2])
          getnames = await namesModel.find({$and: [{name: { $regex: "^[" + [name] + "]" }},
            {religion: optionsData }, { nStatus: status }]
          })
          // console.log(getnames)
            res.status(201).send(getnames)
        } 
        else{
          getnames = await namesModel.find({
            $and: [
              { name: { $regex: name } },
              { religion: optionsData },
              { nStatus: status },
            ],
          }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
    }
      }

      if (getnames) {
        res.status(200).send(getnames);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    else if (
      options === "Religion" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) && status === "All"
    ) {
      if (!req.body.name) {
        getnames = await namesModel.find({
          $and: [{ religion: optionsData }, { nStatus: { $ne: "NI" } }],
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      } else {
        if (name.indexOf('-') > -1) {
          const rangeData = _.split(name, '-')
          console.log("--",rangeData[0], rangeData[2])
          getnames = await namesModel.find({
            $and: [
              {name: { $regex: "^[" + [name] + "]" }},
              { religion: optionsData },
             { nStatus: { $ne: "NI" } },
           ],
         })
          console.log(getnames)
            res.status(201).send(getnames)
        }
   else {      
       getnames = await namesModel.find({
     $and: [
      { name: { $regex: name } },
      { religion: optionsData },
      { nStatus: { $ne: "NI" } },
    ],
  }).limit(1000);
      _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      }
      }

      if (getnames) {
        res.status(200).send(getnames);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    //******************for gender filter************* */
    else if (options === "Gender" && status === "Summary") {
      if (_.isEmpty(name)) {
        getnames = await namesModel.aggregate([
          { $unwind: "$gender" }, { $group: { _id: "$gender", totalCount: { $sum: 1 } } }])
          console.log(getnames)
          if (getnames) {
              res.status(200).send([{ option: { "name": "gender", getnames } }])
          } else {
              res.status(404).send({
                  message: "No Data Found!"
              })
          }
      }
  }
  else if (options === "Gender" && status === "Exception Report" && _.isEmpty(name)) {
    if (_.isEmpty(name)) {
      getnames = await namesModel.find({ "gender": { $eq: [] } }).limit(1000);
        // let totalSurnames = { totalCount:getSurname };
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
        console.log(getnames)
        if (getnames) {
            res.status(200).send({getnames})
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    }
}
else if (options === "Gender" && status === "Exception Report" && !_.isEmpty(name)) {
 if(name.indexOf('-') > -1){
  getnames = await namesModel.find({ "gender": { $eq: [] },
  name: { "$regex": "^[" + [name] + "]" }
}).limit(1000);
 }
 else {
    getnames = await namesModel.find({ "gender": { $eq: [] } }).limit(1000);
 }
      // let totalSurnames = { totalCount:getSurname };
      _.forEach(getnames, function(value) {
        if(value.nStatus === "NN"){
          value.nStatus = "Name New"
      } else if(value.nStatus === "NE"){
          value.nStatus = "Name Entry"
      } else if(value.nStatus === "NV"){
          value.nStatus = "Name Verified"
      } else if(value.nStatus === "NI"){
          value.nStatus = "Name Invalid"
      } else if(value.nStatus === "NP"){
          value.nStatus = "Name Published"
      }
    });
      console.log(getnames)
      if (getnames) {
          res.status(200).send({getnames})
      } else {
          res.status(404).send({
              message: "No Data Found!"
          })
  }
}
    else if (
      options === "Gender" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) && status !== "All"
    ) {
      if (!req.body.name && optionsData === "Male") {
        getnames = await namesModel.find({
          gender: ["M"],
          nStatus: status,
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      } else if (!req.body.name && optionsData === "Female") {
        getnames = await namesModel.find({
          gender: ["F"],
          nStatus: status,
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      } else if (!req.body.name && optionsData === "Both") {
        getnames = await namesModel.find({
          gender: ["M", "F"],
          nStatus: status,
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      } else if (req.body.name && optionsData === "Male") {
        if (name.indexOf('-') > -1) {
          const rangeData = _.split(name, '-')
          console.log("--",rangeData[0], rangeData[2])
          getnames = await namesModel.find({$and: [{name: { $regex: "^[" + [name] + "]" }},
            {gender: ["M"] }, { nStatus: status }]
          }).limit(1000);
          _.forEach(getnames, function(value) {
            if(value.nStatus === "NN"){
              value.nStatus = "Name New"
          } else if(value.nStatus === "NE"){
              value.nStatus = "Name Entry"
          } else if(value.nStatus === "NV"){
              value.nStatus = "Name Verified"
          } else if(value.nStatus === "NI"){
              value.nStatus = "Name Invalid"
          } else if(value.nStatus === "NP"){
              value.nStatus = "Name Published"
          }
        });
          // console.log(getnames)
            res.status(201).send(getnames)
        }
        else {
          getnames = await namesModel.find({
            name: { $regex: name },
            gender: ["M"],
            nStatus: status,
          }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      if (getnames) {
        res.status(200).send(getnames);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
      } else if (req.body.name && optionsData === "Female") {
        if (name.indexOf('-') > -1) {
          const rangeData = _.split(name, '-')
          console.log("--",rangeData[0], rangeData[2])
          getnames = await namesModel.find({$and: [{name: { $regex: "^[" + [name] + "]" }},
            {gender: ["F"] }, { nStatus: status }]
          }).limit(1000);
          _.forEach(getnames, function(value) {
            if(value.nStatus === "NN"){
              value.nStatus = "Name New"
          } else if(value.nStatus === "NE"){
              value.nStatus = "Name Entry"
          } else if(value.nStatus === "NV"){
              value.nStatus = "Name Verified"
          } else if(value.nStatus === "NI"){
              value.nStatus = "Name Invalid"
          } else if(value.nStatus === "NP"){
              value.nStatus = "Name Published"
          }
        });
          // console.log(getnames)
            res.status(201).send(getnames)
        }
        else{
          getnames = await namesModel.find({
            name: { $regex: name },
            gender: ["F"],
            nStatus: status,
          }).limit(1000);
          _.forEach(getnames, function(value) {
            if(value.nStatus === "NN"){
              value.nStatus = "Name New"
          } else if(value.nStatus === "NE"){
              value.nStatus = "Name Entry"
          } else if(value.nStatus === "NV"){
              value.nStatus = "Name Verified"
          } else if(value.nStatus === "NI"){
              value.nStatus = "Name Invalid"
          } else if(value.nStatus === "NP"){
              value.nStatus = "Name Published"
          }
        });
        }
      } else if (req.body.name && optionsData === "Both") {
        if (name.indexOf('-') > -1) {
          const rangeData = _.split(name, '-')
          console.log("--",rangeData[0], rangeData[2])
          getnames = await namesModel.find({$and: [{name: { $regex: "^[" + [name] + "]" }},
            {gender: ["M", "F"] }, { nStatus: status }]
          }).limit(1000);
        }
          _.forEach(getnames, function(value) {
            if(value.nStatus === "NN"){
              value.nStatus = "Name New"
          } else if(value.nStatus === "NE"){
              value.nStatus = "Name Entry"
          } else if(value.nStatus === "NV"){
              value.nStatus = "Name Verified"
          } else if(value.nStatus === "NI"){
              value.nStatus = "Name Invalid"
          } else if(value.nStatus === "NP"){
              value.nStatus = "Name Published"
          }
        });
      } 
      else {
        getnames = await namesModel.find({
          gender: { $nq: null },
          name: { $regex: name },
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
    }
      if (getnames) {
        res.status(200).send(getnames);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    else if (
      options === "Gender" &&
      !_.isNull(optionsData) &&
      !_.isNull(status) && status === "All"
    ) {
      if (!req.body.name && optionsData === "Male") {
        getnames = await namesModel.find({
          gender: ["M"],
          nStatus: { $ne: "NI" },
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      } else if (!req.body.name && optionsData === "Female") {
        getnames = await namesModel.find({
          gender: ["F"],
          nStatus: { $ne: "NI" },
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      } else if (!req.body.name && optionsData === "Both") {
        getnames = await namesModel.find({
          gender: ["M", "F"],
          nStatus: { $ne: "NI" },
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      } else if (req.body.name && optionsData === "Male") {
        if (name.indexOf('-') > -1) {
          const rangeData = _.split(name, '-')
          console.log("--",rangeData[0], rangeData[2])
          getnames = await namesModel.find({$and: [{name: { $regex: "^[" + [name] + "]" }},
            {gender: ["M"] }, { nStatus: {$ne: "NI"} }]
          }).limit(1000);
          _.forEach(getnames, function(value) {
            if(value.nStatus === "NN"){
              value.nStatus = "Name New"
          } else if(value.nStatus === "NE"){
              value.nStatus = "Name Entry"
          } else if(value.nStatus === "NV"){
              value.nStatus = "Name Verified"
          } else if(value.nStatus === "NI"){
              value.nStatus = "Name Invalid"
          } else if(value.nStatus === "NP"){
              value.nStatus = "Name Published"
          }
        });
          // console.log(getnames)
            // res.status(201).send(getnames)
        }
        else{
        getnames = await namesModel.find({
          name: { $regex: name },
          gender: ["M"],
          nStatus: { $ne: "NI" },
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
    }
      } else if (req.body.name && optionsData === "Female") {
        if (name.indexOf('-') > -1) {
          const rangeData = _.split(name, '-')
          console.log("--",rangeData[0], rangeData[2])
          getnames = await namesModel.find({$and: [{name: { $regex: "^[" + [name] + "]" }},
            {gender: ["F"] }, { nStatus: {$ne: "NI"} }]
          })
          _.forEach(getnames, function(value) {
            if(value.nStatus === "NN"){
              value.nStatus = "Name New"
          } else if(value.nStatus === "NE"){
              value.nStatus = "Name Entry"
          } else if(value.nStatus === "NV"){
              value.nStatus = "Name Verified"
          } else if(value.nStatus === "NI"){
              value.nStatus = "Name Invalid"
          } else if(value.nStatus === "NP"){
              value.nStatus = "Name Published"
          }
        });
          // console.log(getnames)
        }
        else {
        getnames = await namesModel.find({
          name: { $regex: name },
          gender: ["F"],
          nStatus: { $ne: "NI" },
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
    }
      } else if (req.body.name && optionsData === "Both") {
        if (name.indexOf('-') > -1) {
          const rangeData = _.split(name, '-')
          console.log("--",rangeData[0], rangeData[2])
          getnames = await namesModel.find({$and: [{name: { $regex: "^[" + [name] + "]" }},
            {gender: ["M","F"] }, { nStatus: {$ne: "NI"} }]
          })
          _.forEach(getnames, function(value) {
            if(value.nStatus === "NN"){
              value.nStatus = "Name New"
          } else if(value.nStatus === "NE"){
              value.nStatus = "Name Entry"
          } else if(value.nStatus === "NV"){
              value.nStatus = "Name Verified"
          } else if(value.nStatus === "NI"){
              value.nStatus = "Name Invalid"
          } else if(value.nStatus === "NP"){
              value.nStatus = "Name Published"
          }
        });
      }
        else {
        getnames = await namesModel.find({
          gender: ["M", "F"],
          nStatus: { $ne: "NI" },
          name:{$regex:name}
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      } 
    }
      if (getnames) {
        res.status(200).send(getnames);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }

    //************for all filters****************** */
   else if (options === "All" && status === "Summary") {
      if (_.isEmpty(name)) {
          const gender = await namesModel.count({gender:{$ne:[]}})
          // aggregate([
          //   { $unwind: "$gender" }, { $group: { _id: "$gender", totalCount: { $sum: 1 } } }])
          const tags = await namesModel.count({tags:{$ne:[]}})
          // aggregate([
          //   { $unwind: "$tags" }, { $group: { _id: "$tags", totalCount: { $sum: 1 } } }])
          const religion = await namesModel.count({religion:{$ne:[]}})
          // aggregate([
          //   { $unwind: "$religion" }, { $group: { _id: "$religion", totalCount: { $sum: 1 } } }])
          const translations = await namesModel.count({translations:{$ne:[]}})
          // aggregate([
          //   {
          //     $facet: {
          //       "Hindi": [
          //         { $match: { "translations.lang": { $eq: "HI" } } },
          //         { "$sortByCount": "$Hindi" }
  
          //       ],
          //       "Gujarati": [
          //         { $match: { "translations.lang": { $eq: "GU" } } },
          //         { "$sortByCount": "$Gujarati" }
  
          //       ],
          //       "Marathi": [
          //         { $match: { "translations.lang": { $eq: "MR" } } },
          //         { "$sortByCount": "$Marathi" }
  
          //       ],
          //       "Punjabi": [
          //         { $match: { "translations.lang": { $eq: "PA" } } },
          //         { "$sortByCount": "$Punjabi" }
  
          //       ],
          //       "SINDHI": [
          //         { $match: { "translations.lang": { $eq: "SD" } } },
          //         { "$sortByCount": "$SINDHI" }
  
          //       ],
          //       "TAMIL": [
          //         { $match: { "translations.lang": { $eq: "TA" } } },
          //         { "$sortByCount": "$TAMIL" }
  
          //       ],
          //       "BENGALI": [
          //         { $match: { "translations.lang": { $eq: "BN" } } },
          //         { "$sortByCount": "$TAMIL" }
  
          //       ],
          //       "TELGU": [
          //         { $match: { "translations.lang": { $eq: "TLG" } } },
          //         { "$sortByCount": "$TELGU" }
  
          //       ],
          //     }
          //   }
          // ])
          if (gender) {
              res.status(200).send([
                {option: { "name": "gender", gender}},
                {option: { "name": "tags", tags}},
                {option: { "name": "religion", religion}},
                {option: { "name": "translations", translations}}
              ])
          } else {
              res.status(404).send({
                  message: "No Data Found!"
              })
          }
      }
  }
    else if (options === "All" && !_.isNull(optionsData) && !_.isNull(status) && status !== "All") {
      if (!req.body.name) {
        getnames = await namesModel.find({
          nStatus: status,
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      } else {
        getnames = await namesModel.find({
          name: { $regex: name },
          nStatus: status,
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      }

      if (getnames) {
        res.status(200).send(getnames);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    else if (options === "All" && !_.isNull(optionsData) && !_.isNull(status) && status === "All") {
      if (!req.body.name) {
        getnames = await namesModel.find({
          nStatus: { $ne: "NI" },
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      } else {
        if(name.indexOf('-') > -1){
          getnames = await namesModel.find({
            name: { "$regex": "^[" + [name] + "]" },
            nStatus: { $ne: "NI" },
          }).limit(1000);
          _.forEach(getnames, function(value) {
            if(value.nStatus === "NN"){
              value.nStatus = "Name New"
          } else if(value.nStatus === "NE"){
              value.nStatus = "Name Entry"
          } else if(value.nStatus === "NV"){
              value.nStatus = "Name Verified"
          } else if(value.nStatus === "NI"){
              value.nStatus = "Name Invalid"
          } else if(value.nStatus === "NP"){
              value.nStatus = "Name Published"
          }
        });
        }
        else {
        getnames = await namesModel.find({
          name: { $regex: name },
          nStatus: { $ne: "NI" },
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
    }
      }

      if (getnames) {
        res.status(200).send(getnames);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }
    // **********only name****************/
    else if (
      !_.isEmpty(name) &&
      _.isEmpty(options) &&
      _.isEmpty(status) &&
      _.isEmpty(optionsData)
    ) {
      if(name.indexOf('-') > -1){
        getnames = await namesModel.find({
          name: { "$regex": "^[" + [name] + "]" },
        }).limit(1000);
        _.forEach(getnames, function(value) {
          if(value.nStatus === "NN"){
            value.nStatus = "Name New"
        } else if(value.nStatus === "NE"){
            value.nStatus = "Name Entry"
        } else if(value.nStatus === "NV"){
            value.nStatus = "Name Verified"
        } else if(value.nStatus === "NI"){
            value.nStatus = "Name Invalid"
        } else if(value.nStatus === "NP"){
            value.nStatus = "Name Published"
        }
      });
      } else {
      getnames = await namesModel.find({
        name: { $regex: name },
      }).limit(1000);
      _.forEach(getnames, function(value) {
        if(value.nStatus === "NN"){
          value.nStatus = "Name New"
      } else if(value.nStatus === "NE"){
          value.nStatus = "Name Entry"
      } else if(value.nStatus === "NV"){
          value.nStatus = "Name Verified"
      } else if(value.nStatus === "NI"){
          value.nStatus = "Name Invalid"
      } else if(value.nStatus === "NP"){
          value.nStatus = "Name Published"
      }
    });
  }
      if (getnames) {
        res.status(200).send(getnames);
      } else {
        res.status(404).send({
          message: "No Data Found!",
        });
      }
    }

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
exports.getNamesById = async (req, res) => {
  try {
    const _id = req.params._id;
    console.log("id:", _id);
    const getName = await namesModel.findOne({ _id: _id });
    console.log(getName);
    if (getName) {
      res.status(201).send(getName);
    } else {
      res.status(404).send({ message: "No Data found" });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

//  all tags list
exports.getAllTags = async (req, res) => {
  try {
    let namesArray = [];
    let count = 0;
    const getName = await namesModel.distinct("tags").sort();
    res.status(200).send(getName);
  } catch (e) {
    //     _.forEach(getName, async function (value) {
    //         namesArray.push(value.tags)
    //         count++;
    //         if (getName.length == count) {
    //             const finalData = _.flatten(namesArray)
    //             // res.status(200).send(finalData)
    //         }
    //     })
    // }

    res.status(400).send(e);
  }
};
exports.updateNameStatusVerified = async (req, res) => {
    try {
      const _id = req.body._id;
      const nStatus = req.body.nStatus;
      console.log("_id:", _id);
      const name = await namesModel.update(
        { _id: _id },
        { $set: { nStatus: nStatus } }
      );
      if (name) {
        res.status(200).send({ message: "Name Status Updated" });
      } else {
        res.status(404).send({
          message: "Data found!",
        });
      }
    } catch (e) {
      res.status(400).json(e.message);
    }
  };

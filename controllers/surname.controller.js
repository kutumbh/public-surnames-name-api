const surnamesModel = require('../models/surname.model');
const religionModel = require('../models/religion.model')
const communityModel = require('../models/community.model')
const scriptModel = require('../models/script.model')
const mongoose = require('mongoose')
const ObjectsToCsv = require('objects-to-csv');
const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const mime = require('mime')
const ITEM_PER_PAGE = 10;
const _ = require('lodash');
require("dotenv").config();
const s3 = new aws.S3()


// create a surnamedata
exports.createSurname = async ({ body }, res) => {
    try {
        // const name = new namesModel(body)
        const surnames = await surnamesModel.findOne({ surname: body.Surname });
        console.log(surnames)
        if (surnames) {
            res.status(404).send({
                message: 'Data Already Present, Please Update Translation field!'
            })
        } else {
            const surnames = new surnamesModel(body)
            if (surnames) {
                await surnames.save()
                res.status(201).send(surnames)
            } else {
                res.status(404).send({
                    message: 'Data found!'
                })
            }
        }

    } catch (e) {
        res.status(400).send(e)
    }
}


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
    let where = {}
    console.log('query:', query)
    let surname = new RegExp(query.Surname, "i");
    // if status is done
    if (query.status == 'Done') {
        where = {
            'surname': { '$regex': surname },
            'translations.lang': query.language
        }
    }
    // if status is pending
    if (query.status == 'Pending') {
        where = {
            'surname': { '$regex': surname },
            'translations.lang': { $ne: query.language }
        }
    }
    // if status is all 
    if (query.status == 'All') {
        where = {
            'surname': { '$regex': surname }
        }
    }
    return where;
}

// ////////////////   API For Update Translations field    ////////////////////
exports.updateSurname = async ({ params, body }, res) => {
    try {
        const _id = params._id;
        const language = body.language;
        const value = body.value;
        let updateSurname;
        // const updateSurname = await surnamesModel.update({ _id: _id }, { $set: { translations:[{lang:language,value:value}] } })
        const surname = await surnamesModel.findOne({ _id: _id, 'translations.lang': language });
        console.log("names:", surname)
        if (surname) {
            updateSurname = await surnamesModel.update({ _id: _id, 'translations.lang': language }, {
                $set: {
                    "translations.$.value": value
                }
            })
        } else {
            updateSurname = await surnamesModel.update({
                _id: _id,
                translations: {
                    "$not": {
                        "$elemMatch": {
                            "lang": language
                        }
                    }
                }
            }, {
                $addToSet: {
                    translations: { lang: language, value: value }
                }
            })
        }
        if (updateSurname) {
            res.status(200).send({ "message": "Translations Updated!", updateSurname });
        } else {
            res.status(404).send({
                message: 'Data found!'
            })
        }
    } catch (e) {
        res.status(400).json(e.message)
    }
}

exports.updateSurnameForm = async ({ params, body }, res) => {
    try {
        console.log(body)
        const _id = params._id;
        console.log("id:", _id)
        const updateSurnameData = await surnamesModel.findByIdAndUpdate({ _id: _id }, body, { new: true })
        console.log(updateSurnameData)
        if (updateSurnameData) {
            res.status(201).send(updateSurnameData)
        } else {
            res.status(404).send({ message: 'No Data found' })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

exports.deleteSurname = async (req, res) => {
    try {
        const _id = req.params._id;
        console.log("Delete Surname id", _id)
        const surname = await surnamesModel.remove({ _id: _id })
        if (surname) {
            res.status(201).send({ "message": "Surname Deleted Successfully", surname })
        } else {
            res.status(404).send({
                message: 'Data not found!'
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}
exports.getAllSurnameDownload = async (req, res) => {
    try {
        const where = getSearchParams(req.query);
        console.log('where:', where)
        const surnameData = await surnamesModel.find(where).sort({ surname: 1 })
        // console.log(surnameData)
        let filterArray = [];
        _.forEach(surnameData, async function (value) {
            let filterData = {}
            filterData.surname = value.surname;
            filterData.gender = value.gender;
            filterData.meaning = value.meaning;
            filterArray.push(filterData)
        })
        const csv = new ObjectsToCsv(filterArray);
        // Return the CSV file as string:
        res.status(200).send(csv)

    } catch (error) {
        res.status(500).send({
            message: "Error -> Can NOT complete a paging + filtering + sorting request!",
            error: error.message,
        });
    }
}
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'
        || file.mimetype === 'video/mp4' || file.mimetype === 'video/x-msvideo'
        || file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mid' || file.mimetype === 'audio/mp4'
        || file.mimetype === 'video/3gp' || file.mimetype === 'text/csv') {
        cb(null, true)
    } else {
        cb(new Error('Invalid file type, upload valid file only!'), false)
    }
}
function getSignedUrl(data) {
    try {
        console.log("data", data)
        // const contentDisposition = 'attachment; filename=\"' + name + '\"';
        //var key = urlParse.parse(data).pathname
        var key = data.replace('https://kutumbh-repository.s3.ap-south-1.amazonaws.com/', '')
        // key = key.replace('/', '')
        console.log("key", key)
        // ---profileImage/601d1e9896de4d014aab42a2/siblings@4x-100.jpg/1613390261646_siblings@4x-100.jpg
        var url = s3.getSignedUrl("getObject", {
            Bucket: 'kutumbh-repository',
            Key: key,
            // Key: 'general/1601018967848.png',
            // ResponseContentDisposition: contentDisposition,
            // Expires: 7200 //2 hours
            Expires: 604800 // Expire 7 days   //on 

        })
        return url
    } catch (e) {
        console.log("Error", e.toString())
        return e
    }
}
exports.fileuploading = async (req, res) => {
    // router.post('/image-upload/:id/:profilepicname', (req, res) => {
    try {
        const { section = 'general' } = req.query
        const upload = multer({
            fileFilter,
            // limits: {fileSize: 1024*5},
            storage: multerS3({
                // acl: 'public-read',
                contentType: multerS3.AUTO_CONTENT_TYPE,
                s3,
                // limits: {fileSize: 1024*5},
                contentLength: 50000000, //50 MB file size
                bucket: //process.env.BUCKET_NAME,
                    function (req, file, cb) {
                        const queryParams = req.params;
                        // console.log("imageupload", queryParams, req)
                        var bktName = process.env.AWS_BUCKET_NAME + "/" + "master_excel" + "/" + queryParams.id + "/" + queryParams.excelfile

                        console.log("bktName", process.env.AWS_BUCKET_NAME);
                        cb(null, bktName)
                    },
                metadata(req, file, cb) {
                    cb(null, { fieldName: file.fieldname })
                },
                key(req, file, cb) {
                    const filename = Date.now().toString() + '_' + file.originalname //+ '.' + mime.getExtension(file.mimetype);
                    cb(null, filename)
                }
            })
        })
        const singleUpload = upload.single('file')
        singleUpload(req, res, async (err) => {
            try {
                if (err) {
                    return res.status(422).send({
                        errors: [{ title: 'Media Upload Error', detail: err.message }]
                    })
                }
                if (req.file && req.file.location) {
                    var key = req.file.key.split('.').slice(0, -1).join('.')
                    console.log("req.file", req.file)
                    //   const updateImage = await user.updateOne({ _id: req.params.id }, { profilepic: req.file.location }, { upsert: true });
                    // console.log(updateImage);
                    return res.json({ fileUrl: getSignedUrl(req.file.location), key: key })
                } else {
                    return res.status(422).send('Error')
                }
            } catch (e) {
                res.status(400).send(e)
            }
        })
    } catch (e) {
        res.status(400).send(e)
    }
}

//***********api to get all surnames************

exports.getAllSurname = async (req, res) => {
    try {
        const where = getSearchParamss(req.query);
        console.log('where:', where)
        const surname = await surnamesModel.find(where)
            .sort({ surname: 1 })
        if (surname) {
            surname.forEach(async (data) => {
                if (data.translations === null) {
                    data.translations = []
                }
                else {
                    const result = surname.filter((n, i) => {
                        let data = n
                        data.translations = n.translations.filter(t => {
                            if (t.lang === req.query.language)
                                return t
                        })
                        return data;
                    })
                }
            })

            // const result = surname.filter((n, i) => {
            //     let data = n
            //     data.translations = n.translations.filter(t => {
            //         if (t.lang === req.query.language)
            //             return t
            //     })
            //     return data;
            // })
            res.status(200).send(surname)
        } else {
            res.status(404).send({ message: 'No Data found' })
        }
    } catch (e) {
        res.status(400).send(e.toString())
    }
}

const getSearchParamss = (query) => {
    let where = {}
    console.log('query:', query)
    let surname = new RegExp(query.Surname, "i");
    let range = query.range ? query.range : null;
    // let range1 = query.range.toUpperCase();
    console.log(range);



    // if status is done
    if (query.status == 'Done') {
        where = {
            'surname': { '$regex': surname },
            'translations.lang': query.language
        }
    }
    // if status is pending
    if (query.status == 'Pending') {
        where = {
            'surname': { '$regex': surname },
            'translations.lang': { $ne: query.language }
        }
    }
    // if status is all 
    if (query.status == 'All' && surname != null) {
        where = {
            'surname': { '$regex': surname }
        }
    }



    if (query.status == 'Done' && range != null) {
        where = {
            'surname': { '$regex': ("^[" + [range1] + "]") },
            'translations.lang': query.language
        }
    }
    // if status is pending 



    if (query.status == 'Pending' && range != null) {
        where = {
            'surname': { '$regex': ("^[" + [range1] + "]") },
            'translations.lang': { $ne: query.language }
        }
    }

    // if status is all 
    if (query.status == 'All' && range != null) {

        where = {
            // 'surname': { '$regex': '^[A-D a-d]'},
            'surname': { '$regex': ("^[" + [range] + "]") },
        }
    }


    return where;
}

exports.getDropDownMasterInSurname = async (req, res) => {
    try {
        let options = req.body.options;
        if (options === "religion") {
            const getReligion = await religionModel.find().sort({ name: 1 });
            if (getReligion) {
                res.status(200).send(getReligion)
            } else {
                res.status(404).send({
                    message: "No Data Found!"
                })
            }
        }
        else if (options === "community") {
            const getCommunity = await communityModel.find().sort({ name: 1 });
            if (getCommunity) {
                res.status(200).send(getCommunity)
            } else {
                res.status(404).send({
                    message: "No Data Found!"
                })
            }
        }
        else if (options === "script") {
            const getScript = await scriptModel.find().sort({ name: 1 });
            if (getScript) {
                res.status(200).send(getScript)
            } else {
                res.status(404).send({
                    message: "No Data Found!"
                })
            }
        }
    }
    catch (e) {
        res.status(400).send(e);
    }
}

exports.getSurnameById = async (req, res) => {
    try {
        const _id = req.params._id;
        console.log("id:", _id)
        const getSurname = await surnamesModel.findOne({ _id: _id })
        console.log(getSurname)
        if (getSurname) {
            res.status(201).send(getSurname)
        } else {
            res.status(404).send({ message: 'No Data found' })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

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
        const getSurname = await surnamesModel.find({}).count()
        let totalSurnames = { totalCount: getSurname };
        const updatesurname = await surnamesModel.find({ "$expr": { "$ne": ["$createdAt", "$updatedAt"] } }).count()
        let updatedSurnames = { totalCount: updatesurname }
        if (totalSurnames) {
            res.status(200).send({ totalSurnames, updatedSurnames })
        } else {
            res.status(404).send({ message: 'No Data found' })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}

exports.getDropDownMasterInReligion = async (req, res) => {
    try {     
            const getReligion = await surnamesModel.find().distinct('religion');
            if (getReligion) {
                res.status(200).send(getReligion)
            } else {
                res.status(404).send({
                    message: "No Data Found!"
                })
            }
        }
    catch (e) {
        res.status(400).send(e);
    }
}
exports.getDropDownMasterInScript = async (req, res) => {
    try {     
            const getScript = await surnamesModel.find().distinct('script');
            if (getScript) {
                res.status(200).send(getScript)
            } else {
                res.status(404).send({
                    message: "No Data Found!"
                })
            }
        }   
    catch (e) {
        res.status(400).send(e);
    }
}
exports.getDropDownMasterInweekOfYear = async (req, res) => {
    try {     
            const getweekOfYear = await surnamesModel.find().distinct('weekOfYear');
            if (getweekOfYear) {
                res.status(200).send(getweekOfYear)
            } else {
                res.status(404).send({
                    message: "No Data Found!"
                })
            }
        }   
    catch (e) {
        res.status(400).send(e);
    }
}

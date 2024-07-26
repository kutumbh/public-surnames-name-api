const surnamesModel = require("../models/surname.model");
const surnameDetailsModel=require("../models/surnamedetails.model");
const surnamesstates1Model=require("../models/surnamesstates1.model");
const religionModel = require("../models/religion.model");
const communityModel = require("../models/community.model");
const scriptModel = require("../models/script.model");
const mongoose = require("mongoose");
const ObjectsToCsv = require("objects-to-csv");
const multer = require("multer");
const multerS3 = require("multer-s3");
const mime = require("mime");
const ITEM_PER_PAGE = 10;
const _ = require("lodash");
require("dotenv").config();

// 
// exports.getSearchFilterData = async (req, res) => {
//   try {
//     const religions = req.body.religion || [];
//     const scripts = req.body.script || [];
//     const searchText = req.body.searchText || "";
//     const sStatuss = req.body.sStatus || [];
//     const assignTo = req.body.assignTo || [];
//     const weekOfYear = req.body.weekOfYear || null;
//     const page = parseInt(req.query.page) || 1; // Get the page number from the request
//     const pageSize = parseInt(req.query.pageSize) || 50;

//     const matchConditions = {};
//     if (religions.length > 0) {
//       matchConditions.religion = { $in: religions };
//     }
//     if (scripts.length > 0) {
//       matchConditions.script = { $in: scripts };
//     }
//     if (sStatuss.length > 0) {
//       matchConditions.sStatus = { $in: sStatuss };
//     }
//     if (assignTo.length > 0) {
//       const assignToIds = assignTo.map((id) => mongoose.Types.ObjectId(id));
//       matchConditions.assignTo = { $in: assignToIds };
//     }
//     if (weekOfYear !== null) {
//       matchConditions.weekOfYear = weekOfYear;
//     }

//     const searchQuery = searchText.trim();

//     if (
//       Object.keys(matchConditions).length === 0 && // No filter options provided
//       searchQuery === "" // No search query provided
//     ) {
//       // Respond with an empty array
//       return res.status(200).send([]);
//     }

//     const filteredUsers = await surnamesModel.aggregate([
//       {
//         $match: {
//           $or: [
//             {
//               $or: [
//                 { community: { $regex: searchQuery, $options: "i" } },
//                 { surname: { $regex: searchQuery, $options: "i" } },
//                 { meaning: { $regex: searchQuery, $options: "i" } },
//               ],
//               ...matchConditions,
//             },
//           ],
//         },
//       },
//         {
//           $lookup: {
//             from: "pdUsers",
//             localField: "assignTo",
//             foreignField: "_id",
//             as: "assignTo",
//           },
//         },
//         {
//           $skip: (page - 1) * pageSize,
//         },
//         {
//           $limit: pageSize,
//         },
      
        
//     ]);
//     const totalCount = await surnamesModel.countDocuments(matchConditions);

//     const totalPages = Math.ceil(totalCount / pageSize);
//     res.status(200).send({
//       totalCount,
//       totalPages,
//       filteredUsers, // Your paginated data
//     });
//   } catch (e) {
//     res.status(400).send(e);
//   }
// };

exports.getSearchFilterData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    const religions = req.body.religion || [];
    const scripts = req.body.script || [];
    const searchText = req.body.searchText.toUpperCase() || "";
    const sStatuss = req.body.sStatus || [];
    const assignTo = req.body.assignTo || [];
    const weekOfYear = req.body.weekOfYear || [];
    const dynamic_search=req.body.dynamic_search||""
    if (
      religions.length === 0 &&
      scripts.length === 0 &&
      searchText === "" &&
      sStatuss.length === 0 &&
      assignTo.length === 0 &&
      weekOfYear.length=== 0&&
      dynamic_search === ""
    ) {
      const responseObj = {
        totalItems: 0,
        data: [], // You can include other data properties as needed
      }
      // Send an empty response with a status code of 200
      return res.status(200).json(responseObj);
    };
    

    const aggregationPipeline=[];
    const statematchCondition = {};
    if (searchText!=="") {
      aggregationPipeline.unshift({        
        $search: {
          index: "fuzzy3",
          compound: {
            should: [
              {
                autocomplete: {
                  query: searchText,
                  path: "surname",
                },
              },
              {
                autocomplete: {
                  query: searchText,
                  path: "alternative",
                },
              }
            ],
          },
        }
      } )
      // aggregationPipeline.push({
      //   $match: {
      //         $or: [
      //           { surname: searchText },
      //           { alternative: { $in: [searchText] } }
      //         ]
      //       }})
    
    
      // aggregationPipeline.push({
      // $match: {
      //       $or: [
      //         { surname: searchText },
      //         { alternative: { $in: [searchText] } }
      //       ]
      //     }})
    
    }
  let sortField = null;
    const matchConditions = {};
    if (religions.length > 0) {
      //aggregationPipeline.push({ $unwind: "$religion" });
      matchConditions.religion = { $in: religions};
    }
    if (scripts.length > 0) {
      //aggregationPipeline.push({ $unwind: "$script" });
      matchConditions.script = { $in: scripts };
    }
    if (sStatuss.length > 0) {
      if(sStatuss.includes("SN")||sStatuss.includes("SV")||sStatuss.includes("SS")||sStatuss.includes("ST")){
      matchConditions.sStatus = { $in: sStatuss };
      }
      if(sStatuss.includes('Y')||sStatuss.includes('N')||sStatuss.includes('B')){
        matchConditions.isPublished={$in:sStatuss}
      }
    
    }
    if (assignTo.length > 0) {
      if (assignTo.includes(null)) {
        // Handle the case where "null" is selected
        matchConditions.assignTo = { $in: [null, ...assignTo.filter(id => id !== null).map(id => mongoose.Types.ObjectId(id))] };
      } else {
        // Handle the case where specific values are selected
        const assignToIds = assignTo.map((id) => mongoose.Types.ObjectId(id));
        matchConditions.assignTo = { $in: assignToIds };
      }
    }
    if (weekOfYear.length>0) {
      matchConditions.weekOfYear = { $in: weekOfYear };
    }
    aggregationPipeline.push(
      {$match:matchConditions},      
    );
    if (dynamic_search !== "") {
      
      const operatorMapping = {
        ">": "$gt",
        ">=": "$gte",
        "<": "$lt",
        "<=": "$lte",
        "start": "start",
        "=": "=",
        "Ends": "Ends",
        "length>":"length>",
        "length<":"length<",
        "contains":"contains",
        
      };
    
      const cleanedDynamicSearch = dynamic_search.replace(/^"|"$/g, "");
    
      const conditions = cleanedDynamicSearch.split(",").filter(Boolean);
      

conditions.forEach((condition) => {
  let [field, operator, value] = condition.split(/\s*(=|>=|<=|<|>|length>|length<|start|Ends|contains)\s*/);
  if (field && operator && value && operatorMapping[operator]) {
    const matchCondition = {};
    

    if (operator === "start") {
      matchCondition[field] = {
        $regex: `^${value}`,
        $options: "i",
      };
    }  
    if (operator === '='&& field !== 'state' && field !== 'place count') {
      if (!isNaN(parseFloat(value))) {
        matchCondition[field] = parseFloat(value);
      } else {
        matchCondition[field] = { $regex: new RegExp(`^${value}$`, 'i') };
      }
    } 
     if (operator === 'Ends') {
      matchCondition[field] = { $regex: new RegExp(`${value}$`, 'i') };
    } 
     if (operator === "length>") {
      const lengthMatch = {
        $match: {
          [field]: { $exists: true },
          $expr: { $gt: [{ $strLenCP: `$${field}` }, parseFloat(value)] },
        },
      };
      aggregationPipeline.push(lengthMatch);
    } 
    if (operator === "length<") {
      const lengthMatch = {
        $match: {
          [field]: { $exists: true },
          $expr: { $lt: [{ $strLenCP: `$${field}` }, parseFloat(value)] },
        },
      };
      aggregationPipeline.push(lengthMatch);
    } 
    if (operator === '>' && field !== 'state' && field !== 'place count') {
      matchCondition[field] = { $gt: parseFloat(value) };
      sortField = field;
    } 
     if (operator === '<' && field !== 'state' && field !== 'place count') {
      matchCondition[field] = { $lt: parseFloat(value) };
      sortField = field;
    } 
     if (operator === '>=' && field !== 'state') {
      matchCondition[field] = { $gte: parseFloat(value) };
      sortField = field;
    }
     if (operator === '<=' && field !== 'state') {
      matchCondition[field] = { $lte: parseFloat(value) };
      sortField = field;
    } 
    if (operator === 'contains') {
      matchCondition[field] = { $regex: new RegExp(`${value}`, 'i') };
    } 
     if (field === 'state') {
      if (operator === '=') {
        statematchCondition['states.stateCode'] = { $regex: new RegExp(`${value}`, 'i') };
      }
    }
     if (field === 'place count') {
      if (operator === '>') {
        statematchCondition['place.count'] = { $gt: parseFloat(value) };
      } else if (operator === '<') {
        statematchCondition['place.count'] = { $lt: parseFloat(value) };
      }
    }

    if (Object.keys(matchCondition).length > 0) {
      aggregationPipeline.push({
        $match: matchCondition,
      });
    }
  }
});
    } 
    if (Object.keys(statematchCondition).length > 0){
      const surnameFilter = await surnamesstates1Model.aggregate([
        {
          $match: statematchCondition,
        },
        {
          $project: {
            _id: 0,
            surname: 1,
          },
        },
      ]).limit(10000)
      // console.log('surname print',surnameFilter)
      if (surnameFilter.length > 0) {
        const matchedLastNames = surnameFilter.map((entry) => entry.surname);     
        // console.log(matchedLastNames) 
        aggregationPipeline.push({
          $match: {
            surname: { $in: matchedLastNames }
          }
        });
      }
    }
    if (sortField === "pd_count") {
      aggregationPipeline.push({
        $sort: {
          pd_count: -1,
        },
      });
    }
    const countPipeline = [
      ...aggregationPipeline, 
      {
        $count: "totalCount"
      }
    ];
            aggregationPipeline.push({
              $lookup: {
                from: "pdUsers", // The name of the collection to join
                localField: "assignTo", // The field from your current collection
                foreignField: "_id", // The field from the "pdUsers" collection
                as: "assignTo", // The name of the output array
              },
            });
            if(sortField !== "pd_count"){
            aggregationPipeline.push({     
              $sort: {surname: 1 }})
            }
            aggregationPipeline.push({
              $project: {
                _id:1,
                community: 1,
                gotra: 1,
                religion: 1,
                script: 1,
                surname: 1,
                rank:1,
                sStatus: 1,          
                weekOfYear: 1,
                assignTo: {
                  _id: "$assignTo._id",
                  fname: "$assignTo.fname"
                },
                pd_count:1,
                updatedAt:1,
                isPublished:1
              },
            });
            
            const [countResult] = await surnamesModel.aggregate(countPipeline).allowDiskUse(true);;
            
            const totalCount = countResult ? countResult.totalCount : 0;
            const skip = (page - 1) * itemsPerPage;
            aggregationPipeline.push({ $skip: skip });
            aggregationPipeline.push({ $limit: itemsPerPage });
            const filteredUsers = await surnamesModel.aggregate(aggregationPipeline)



            const totalPages = Math.ceil(totalCount / itemsPerPage);
            res.status(200).send({filteredUsers,
              totalPages: totalPages,
              totalItems:totalCount ,
            });
  } catch (e) {
    console.log(e)
    res.status(400).send(e);
  }
};

exports.getCountsOfSurname = async (req, res) => {
  try {
    const script = req.body.script||[];
    const religion = req.body.religion||[];
    const assignTo = req.body.assignTo||[];
    const sStatus = req.body.sStatus||[];
    const weekOfYear=req.body.weekOfYear||[];
    const searchText = req.body.searchText.toUpperCase() || "";
    const dynamic_search=req.body.dynamic_search||""
    
    if (
      religion.length === 0 &&
      script.length === 0 &&
      searchText === "" &&
      sStatus.length === 0 &&
      assignTo.length === 0 &&
      weekOfYear.length=== 0&&
      dynamic_search === ""
    ) {
      // Send an empty response with a status code of 200
      return res.status(200).send([]);
    }
    const aggregationPipeline=[];
    const statematchCondition = {};
    const matchConditions = {};
    if (searchText!=="") {
      aggregationPipeline.unshift({
          $search: {
              index: "fuzzy3",
              compound: {
                should: [
                   {
                    autocomplete: {
                      query: searchText,
                      path: "surname", },
                      // fuzzy: {
                      //   prefixLength: 1,
                      //   maxEdits: 1,
                      //   maxExpansions: 256,
                      // },
                  },
                  // {
                  //   autocomplete: {
                  //     query: searchText,
                  //     path: "community", }
                  // }
                ]
              }
          }
      });
      aggregationPipeline.push({
        
        $match: {
          $or: [
            { surname: searchText },
            { alternative: { $in: [searchText] } }
          ]
        }
      })
  }
    if (religion.length > 0) {
      aggregationPipeline.push({ $unwind: "$religion" });
      matchConditions.religion = { $in: religion};
    }
    if (script.length > 0) {
      aggregationPipeline.push({ $unwind: "$script" });
      matchConditions.script = { $in: script };
    }
    if (sStatus.length > 0) {
      matchConditions.sStatus = { $in: sStatus };
    }
    if (assignTo.length > 0) {
      const assignToIds = assignTo.map((id) => mongoose.Types.ObjectId(id));
      matchConditions.assignTo = { $in: assignToIds };
    }
    if (weekOfYear.length>0) {
      matchConditions.weekOfYear = { $in: weekOfYear };
    }
    aggregationPipeline.push(
      {$match:matchConditions},      
    );
    if (dynamic_search !== "") {
      
      const operatorMapping = {
        ">": "$gt",
        ">=": "$gte",
        "<": "$lt",
        "<=": "$lte",
        "start": "start",
        "=": "=",
        "Ends": "Ends",
        "length>":"length>",
        "length<":"length<",
        "contains":"contains",
        
      };
    
      const cleanedDynamicSearch = dynamic_search.replace(/^"|"$/g, "");
    
      const conditions = cleanedDynamicSearch.split(",").filter(Boolean);
      

conditions.forEach((condition) => {
  let [field, operator, value] = condition.split(/\s*(=|>=|<=|<|>|length>|length<|start|Ends|contains)\s*/);
  if (field && operator && value && operatorMapping[operator]) {
    console.log(field, operator, value)
    const matchCondition = {};
    

    if (operator === "start") {
      matchCondition[field] = {
        $regex: `^${value}`,
        $options: "i",
      };
    }  
    if (operator === '='&& field !== 'state' && field !== 'place count') {
      if (!isNaN(parseFloat(value))) {
        matchCondition[field] = parseFloat(value);
      } else {
        matchCondition[field] = { $regex: new RegExp(`^${value}$`, 'i') };
      }
    } 
     if (operator === 'Ends') {
      matchCondition[field] = { $regex: new RegExp(`${value}$`, 'i') };
    } 
     if (operator === "length>") {
      const lengthMatch = {
        $match: {
          [field]: { $exists: true },
          $expr: { $gt: [{ $strLenCP: `$${field}` }, parseFloat(value)] },
        },
      };
      aggregationPipeline.push(lengthMatch);
    } 
    if (operator === "length<") {
      const lengthMatch = {
        $match: {
          [field]: { $exists: true },
          $expr: { $lt: [{ $strLenCP: `$${field}` }, parseFloat(value)] },
        },
      };
      aggregationPipeline.push(lengthMatch);
    } 
    if (operator === '>' && field !== 'state' && field !== 'place count') {
      matchCondition[field] = { $gt: parseFloat(value) };
      sortField = field;
    } 
     if (operator === '<' && field !== 'state' && field !== 'place count') {
      matchCondition[field] = { $lt: parseFloat(value) };
      sortField = field;
    } 
     if (operator === '>=' && field !== 'state') {
      matchCondition[field] = { $gte: parseFloat(value) };
      sortField = field;
    }
     if (operator === '<=' && field !== 'state') {
      matchCondition[field] = { $lte: parseFloat(value) };
      sortField = field;
    } 
    if (operator === 'contains') {
      matchCondition[field] = { $regex: new RegExp(`${value}`, 'i') };
    } 
     if (field === 'state') {
      if (operator === '=') {
        statematchCondition['place._id'] = { $regex: new RegExp(`${value}`, 'i') };
      }
    }
     if (field === 'place count') {
      if (operator === '>') {
        statematchCondition['place.count'] = { $gt: parseFloat(value) };
      } else if (operator === '<') {
        statematchCondition['place.count'] = { $lt: parseFloat(value) };
      }
    }

    if (Object.keys(matchCondition).length > 0) {
      aggregationPipeline.push({
        $match: matchCondition,
      });
    }
  }
});
    } 
    if (Object.keys(statematchCondition).length > 0){
      const surnameFilter = await surnameDetailsModel.aggregate([
        {
          $match: statematchCondition,
        },
        {
          $project: {
            _id: 0,
            lastName: 1,
          },
        },
      ])
      if (surnameFilter.length > 0) {
        const matchedLastNames = surnameFilter.map((entry) => entry.lastName);      
        aggregationPipeline.push({
          $match: {
            surname: { $in: matchedLastNames }
          }
        });
      }
    }
    const groupStage = {
      $group: {
        _id: {},
        count: { $sum: 1 },
        pd_count: { $sum: "$pd_count" },
      },
    };

    if (religion.length > 0) {
      groupStage.$group._id.religion = "$religion";
    }

    if (script.length > 0) {
      groupStage.$group._id.script = "$script";
    }
    if (assignTo.length > 0) {
      aggregationPipeline.push({$lookup: {
        from: "pdUsers", 
        localField: "assignTo", 
        foreignField: "_id", 
        as: "assignTo", 
      },});
      groupStage.$group._id.assignTo = "$assignTo.fname";
    }
    if (sStatus.length > 0) {
      groupStage.$group._id.sStatus = "$sStatus";
    }
    if (weekOfYear.length > 0) {
      groupStage.$group._id.weekOfYear= "$weekOfYear";
    }

    aggregationPipeline.push(groupStage);

    // Perform the MongoDB aggregation
    const result = await surnamesModel.aggregate(aggregationPipeline);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
};



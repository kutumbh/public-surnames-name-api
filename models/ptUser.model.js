const mongoose = require('mongoose')
const Schema = mongoose.Schema
const marriageDetailsSchema = new Schema({
  spouseId: { // This is the new field to reference the newUser model (the spouse)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'newUser', // This assumes your user model is named 'newUser'
    //default: null
  },
  maidenName: {
    type: String
    //default: null
  },
  marraigeDate: { // Note: Check the spelling, it should be 'marriageDate'
    type: Date
    //default: null
  },
  linkYourSpouse: {
    type: String
    //default: null
  },
  location_of_wedding: { // Consider using camelCase for consistency: locationOfWedding
    type: mongoose.Schema.Types.Mixed,
    //default: null
    // Include other fields as necessary
  },
  relationship : {
    type: String
  },
  MD_Flag_N: {
    type: Number
  },
});
const userSchema = new Schema(
  {
    cognitousername: {
      type: String,
      default: null
    },
    smsCount: { type: Number, default: 0 },
    updatedSmsCountDate: { type: Date, default: Date.now },
    deviceInfo: {
      appVersion: {
        type: String,
        default: null
      },
      platForm: {
        type: String,

        default: null
      },

      osVersion: {
        type: String,

        default: null
      },

      model: {
        type: String,

        default: null
      },

      operatingSystem: {
        type: String,

        default: null
      },
      deviceToken: {
        type: String,

        default: null
      }
    },
    userType:{
      type:String,
      default:"PP"
    },
    userStatus:{
      type:String,
      default:"N"
    },
    userCategory:{
      type:String
    },
    RecordStatus:{
      type:String,
      default:"FN"
    },
    tagline:{
      type:String
    },
    description:{
      type:String
    },
    email: {
      type: String,
      trim: true
      // unique : true
    },
    assignTo:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: "pdUser",
    }],
    countryISO:{
      type:String,
    },
    countryCode: {
      type: Number,
      trim: true
    },
    mobileNo: {
      type: Number,
      trim: true
      // default: null
    },

    BD_Flag: {
      type: Number
    },
    MD_Flag: {
      type: Number
    },

    DD_Flag: {
      type: Number
    },
    groupType: {
      groupType1: {
        type: String,
        default: 'PU'
      },
      groupType2: {
        type: Number,
        default: 3
      }
    },

    personalDetails: {
      name: {
        type: String,
        trim: true
        // required: true
      },
      middlename: {
        type: String,
        trim: true
      },
      lastname: {
        type: String,
        trim: true
        //  required: true
      },
      gender: {
        type: String,
        default: null
      },
      relationStatus: {
        type: String,
        default: null
      },
      profilepic: {
        type: String,
        default: null
      },
      livingStatus: {
        type: String,
        default: null
      }
    },
    location: {
      currentlocation: {
        type: mongoose.Schema.Types.Mixed,
        default: null
        // place_id: String,
        // lat: Number,
        // lon: Number,
        // address: String,
        // district: String,
        // city: String,
        // state: String,
        // pincode: Number,
        // country: String,
        // country_code: String
      },
      previous_locations: [
        {
          type: mongoose.Schema.Types.Mixed,
          default: null
          // place_id: String,
          // lat: Number,
          // lon: Number,
          // address: String,
          // district: String,
          // city: String,
          // state: String,
          // pincode: Number,
          // country: String,
          // country_code: String
        }
      ],
      placeOfBirth: {
        type: mongoose.Schema.Types.Mixed,
        default: null
        // place_id: String,
        // lat: Number,
        // lon: Number,
        // address: String,
        // district: String,
        // city: String,
        // state: String,
        // pincode: Number,
        // country: String,
        // country_code: String
      },
      placeOfDeath: {
        type: mongoose.Schema.Types.Mixed,
        default: null
        // place_id: String,
        // lat: Number,
        // lon: Number,
        // address: String,
        // district: String,
        // city: String,
        // state: String,
        // pincode: Number,
        // country: String,
        // country_code: String
      }
    },

    birthDetails: {
      dob: {
        type: Date,
        default: null
      },
      dod: {
        type: Date,
        default: null
      }
    },
    // marriageDetails: {
    //   maidenName: {
    //     type: String,
    //     default: null
    //   },
    //   marraigeDate: {
    //     type: Date,
    //     default: null
    //   },
    //   linkYourSpouse: {
    //     type: String,
    //     default: null
    //   },
    //   location_of_wedding: {
    //     type: mongoose.Schema.Types.Mixed,
    //     default: null
    //     // place_id: String,
    //     // lat: Number,
    //     // lon: Number,
    //     // address: String,
    //     // district: String,
    //     // city: String,
    //     // state: String,
    //     // pincode: Number,
    //     // country: String,
    //     // country_code: String
    //   }
    // },
    marriageDetails: [marriageDetailsSchema], // Update this line to use the schema as an array
    medicalDetails: {
      bloodgroup: {
        type: String
      },
      chronic_condition: [
        {
          name: String
        }
      ],
      allergies: [
        {
          name: String
        }
      ],
      illnesses: [
        {
          name: String
        }
      ],
      preExistingConditions: [
        {
          name: String
        }
      ]
    },
    moreInfo: {
      community: {
        type: String,
        default: null
      },
      subcommunity: {
        type: String,
        default: null
      },
      religion: {
        type: String,
        default: null
      },
      motherTounge: {
        type: String,
        default: null
      },
      gothra: {
        type: String,
        default: null
      },
      deity: {
        type: String,
        default: null
      },
      priestName: {
        type: String,
        default: null
      },
      ancestorVillage: {
        type: String,
        default: null
      }
    },

    workDetails: [
      {
        isPresentlyWorking: {
          type: Boolean,
          default: false
        },
        company_name: {
          type: String,
          default: null
        },
        dateOfFrom: {
          type: Date
        },
        dateOfTo: {
          type: Date
        },
        company_role: {
          type: String,
          default: null
        },
        fromDate: {
          type: Date
        },
        toDate: {
          type: Date
        },
        address: {
          type: String
        },
        FD_Flag: {
          type: Number
        },
        TD_Flag: {
          type: Number
        },
        location: {
          type: mongoose.Schema.Types.Mixed,
          default: null
          // place_id: String,
          // lat: Number,
          // lon: Number,
          // address: String,
          // district: String,
          // city: String,
          // state: String,
          // pincode: Number,
          // country: String,
          // country_code: String
        }
      }
    ],

    educationDetails: {
      college: [
        {
          isPresentlyStudying: {
            type: Boolean,
            default: false
          },
          name: {
            type: String
          },
          address: {
            type: String
          },
          location: {
            type: mongoose.Schema.Types.Mixed,
            default: null
            // place_id: String,
            // lat: Number,
            // lon: Number,
            // address: String,
            // district: String,
            // city: String,
            // state: String,
            // pincode: Number,
            // country: String,
            // country_code: String
          },
          dateOfFrom: {
            type: Date
          },
          dateOfTo: {
            type: Date
          },
          fromDate: {
            type: Date
          },
          toDate: {
            type: Date
          },
          degree: {
            type: String
          },
          FD_Flag: {
            type: Number
          },
          TD_Flag: {
            type: Number
          }
        }
      ],
      //Not using
      school: [
        {
          isPresentlyStudying: {
            type: Boolean,
            default: false
          },
          name: {
            type: String
          },
          location: {
            place_id: String,
            lat: Number,
            lon: Number,
            address: String,
            district: String,
            city: String,
            state: String,
            pincode: Number,
            country: String,
            country_code: String
          },

          fromDate: {
            type: Date
          },
          toDate: {
            type: Date
          },
          degree: {
            type: String
          },
          FD_Flag: {
            type: Number
          },
          TD_Flag: {
            type: Number
          }
        }
      ]
    },
    sociallinks: [
      {
        account: String,
        link: String
      }
    ],

    other: [
      {
        account: String,
        link: String
      }
    ],
    signup: {
      hasEmail: {
        type: Boolean
      },
      hasMobile: {
        type: Boolean
      },
      hasGoogle: {
        type: Boolean
      },
      hasFacebook: {
        type: Boolean
      }
    },
    weekOfYear:{
      type:Number,
    },

    treeIdin: [{ type: mongoose.Schema.Types.ObjectId, ref: 'pdTree' }],
    parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ptUser' }],
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ptUser' }],
    husbands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ptUser' }],
    wifes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ptUser' }],
    siblings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ptUser' }],
    // linkedGroup: [{ type: mongoose.Schema.Types.ObjectId, ref: 'group' }]
  },
  { timestamps: true }
)
module.exports = mongoose.model('PTUser', userSchema ,'PTUsers')
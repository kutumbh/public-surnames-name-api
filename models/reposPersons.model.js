const mongoose = require("mongoose");
const personsSchema = new mongoose.Schema(
  {
    fileId: {
      type: String,
      trim: true,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      // required: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      // required: true,
    },
    originName: {
      type: String,
      trim: true,
      //  required: false,
    },
    spouse: {
      type: String,
      trim: true,
    },
    birthOfPlace: {
      type: String,
      trim: true,
    },
    deathOfPlace: {
      type: String,
      trim: true,
    },
    dateOfDeath: {
      type: Date,
      default: null,
      trim: true,
      // required: false,
    },
    dateOfBirth: {
      type: Date,
      // default: null,
      trim: true,
      // required: false,
    },
    age: {
      type: Number,
      trim: true,
    },
    sex: {
      type: String,
      trim: true,
    },
    refno: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      trim: true,
      //  required: true,
    },
    regionalName: {
      type: String,
      trim: true,
      // required: false,
    },
    regionalMiddleName: {
      type: String,
      trim: true,
      // required: false,
    },
    regionalLastName: {
      type: String,
      trim: true,
      // required: false,
    },
    regionalPlaceOfBirth: {
      type: String,
      trim: true,
      // required: false,
    },
    regionalPlaceOfDeath: {
      type: String,
      trim: true,
      // required: false,
    },
    caste: {
      type: String,
      trim: true,
    },
    nextOfKin: {
      type: String,
      trim: true,
    },
    policeStation: {
      type: String,
      trim: true,
    },
    employer: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    arrival: {
      type: String,
      trim: true,
    },
    place: {
      // type: String,
      // trim: true,
      place_id: String,
      lat: Number,
      lon: Number,
      address: String,
      district: String,
      city: String,
      state: String,
      pincode: Number,
      country: String,
      country_code: String,
    },
    contactNo: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    education: {
      type: String,
      trim: true,
    },
    regionalSpouseName: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    BD_Flag: {
      type: Number,
    },
    DD_Flag: {
      type: Number,
    },
    spouseType: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      //required: true,
    },
    partialFlag: {
      type: String,
      trim: true
    }
    // fileSourceDateInPerson: {
    //   type: Number,
    //   trim: true,
    // },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("persons", personsSchema);

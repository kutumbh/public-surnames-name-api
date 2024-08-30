const EntityLogModel = require('../models/entityLog.model')

exports.getEntityLogById = async(req, res) => {
    try {
        const _id = req.params._id;
        const getEntityLogById  = await EntityLogModel.find({$or: [
            { surnameId: _id },
            { nameId: _id },
            { FamousPersonId: _id }
          ]}).populate({
            path: 'modifiedBy',
            model: 'pdUser',
            select: 'fname lname'
        }).sort({createdAt:-1})
        if (getEntityLogById) {
            res.status(200).send(getEntityLogById)
        } else {
            res.status(404).send({
                message: "No Data Found!"
            })
        }
    } catch (e) {
        res.status(400).send(e)
    }
}
exports.createEntityLogForFamousPerson =async(req,res)=>{
    try{
        const newEntityLogEntry = new EntityLogModel(req.body);
        const createdEntityLogEntry = await newEntityLogEntry.save();
        res.status(200).send(createdEntityLogEntry);

    }catch(error){
        console.log(error)
        res.status(400).send(error);
    }
}


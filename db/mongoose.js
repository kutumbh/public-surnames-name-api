const mongoose = require('mongoose')
var pm2 = require('pm2');
mongoose.Promise = Promise

mongoose.connection.on('connected', () => {
    console.log('MongoDB: Connection Established')
})

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB: Connection Reestablished')
})

mongoose.connection.on('disconnected', () => {
    pm2.reload("all", function(err) {

        console.log(err)

    })
    console.log('MongoDB: Connection Disconnected')
})

mongoose.connection.on('close', () => {
    console.log('MongoDB: Connection Closed')
})

mongoose.connection.on('error', error => {
    console.error('MongoDB Error: ' + error)
})

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://kutumbh:kutumbh123@kutumbh-shard-00-00.nvfjg.mongodb.net:27017,kutumbh-shard-00-01.nvfjg.mongodb.net:27017,kutumbh-shard-00-02.nvfjg.mongodb.net:27017/kutumbh-test?ssl=true&replicaSet=atlas-bj8tuw-shard-0&authSource=admin&retryWrites=true&w=majority";


const run = async() => {
    try {
        await mongoose.connect(MONGODB_URL, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        })
    } catch (error) {
        console.error(error)
    }
}

try {
    run()
} catch (error) {
    console.error(error)
}
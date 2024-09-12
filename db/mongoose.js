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

const MONGODB_URL = process.env.MONGODB_URL || "mongodb+srv://data-ingestion-G:data-ingestion-G@imeuswe-data.xvw0h.mongodb.net/kutumbh?retryWrites=true&w=majority"


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
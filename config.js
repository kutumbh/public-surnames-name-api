var config = {};
config.aws = {};
config.aws.region = process.env.AWS_REGION;
config.aws.cognito = {
    pool_id: process.env.AWS_POOL_ID,
    client_id: process.env.AWS_CLIENT_ID
};

module.exports = config;
console.log("Middleware Loaded");
const userModel = require("../models/user.model");
// pull aws config from env file
// 
const poolData = {
  UserPoolId: config.aws.cognito.pool_id,
  ClientId: config.aws.cognito.client_id,
};
const pool_region = config.aws.region;

exports.Validate = function (req, res, next) {
  var token = req.headers["authorization"];
  request(
    {
      url: `https://cognito-idp.${pool_region}.amazonaws.com/${poolData.UserPoolId}/.well-known/jwks.json`,
      json: true,
    },
    function (error, response, body) {
      if (!error && response.statusCode === 200) {
        pems = {};
        var keys = body["keys"];
        for (var i = 0; i < keys.length; i++) {
          var key_id = keys[i].kid;
          var modulus = keys[i].n;
          var exponent = keys[i].e;
          var key_type = keys[i].kty;
          var jwk = { kty: key_type, n: modulus, e: exponent };
          var pem = jwkToPem(jwk);
          pems[key_id] = pem;
        }
        var decodedJwt = jwt.decode(token, { complete: true });
        if (!decodedJwt) {
          console.log("Not a valid JWT Token");
          res.status(401);
          return res.send("Invalid Token");
        }
        var kid = decodedJwt.header.kid;
        var pem = pems[kid];
        if (!pem) {
          console.log("Invalid Token");
          res.status(401);
          return res.send("Invalid Token");
        }
        jwt.verify(token, pem, async function (err, payload) {
          if (err) {
            console.log("Invalid Token.");
            res.status(401);
            return res.send("Invalid Token");
          } else {
            console.log("Valid Token");
            console.log("payload :", payload);
            const userdetails = await userModel.findOne({
              aws_id: payload.username,
            });
            req.validUser = userdetails;

            console.log("req.validUser :", req.validUser);

            return next();
          }
        });
      } else {
        console.log("Error! Unable to download JWKs");
        res.status(500);
        return res.send("Error! Unable to download JWKs");
      }
    }
  );
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const request = require('request');
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
const authenticate = function (callback) {
    let options = {
        uri: 'https://accept.paymobsolutions.com/api/auth/tokens',
        method: 'POST',
        json: {
            "username": "Chimpin",
            "password": "FootPrints1234",
            "expiration": "36000" // expiration in seconds Defaults to 1 hour
        }
    };
    request(options, callback);
};
const createOrder = function (authenticationToken, amount, callback) {
    let options = {
        uri: 'https://accept.paymobsolutions.com/api/ecommerce/orders?token=' + authenticationToken,
        method: 'POST',
        json: {
            "amount_cents": amount
        }
    };
    request(options, callback);
};
exports.pay = functions.https.onCall((data, context) => {
    if (data.amount) {
        authenticate((error, response, body) => {
            if (!error && response.statusCode == 201) {
                //here put what you want to do with the request
                //  servicesResponse.send(response.body.token);
                createOrder(response.body.token, data.amount, (createOrderError, createOrderResponse, createOrderBody) => {
                    if (!createOrderError && createOrderResponse.id) {
                        return { "orderId": createOrderResponse.id };
                    }
                    else {
                        throw new functions.https.HttpsError('cancelled', error);
                    }
                });
            }
            else {
                throw new functions.https.HttpsError('cancelled', error);
            }
        });
    }
    else {
        throw new functions.https.HttpsError('invalid-argument', "Request must contain payment amount in cents", "Request must contain payment amount in cents");
    }
});
//# sourceMappingURL=index.js.map
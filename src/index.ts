import * as functions from 'firebase-functions';
const request = require('request');

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//

const authenticate = function (callback: (error, response, body) => void) {
    const options = {
        uri: 'https://accept.paymobsolutions.com/api/auth/tokens',
        method: 'POST',
        json: {
            "username": "Chimpin",
            "password": "FootPrints1234",
            "expiration": "36000"
        }
    };
    request(options, callback);
}
const createOrder = function (authenticationToken: string, amount: number, callback: (error, response, body) => void) {
    const options = {
        uri: 'https://accept.paymobsolutions.com/api/ecommerce/orders?token=' + authenticationToken,
        method: 'POST',
        json: {
            "amount_cents": amount
        }
    };
    request(options, callback);
}

const createPaymentToken = function (authenticationToken: string, amount: number, orderId: string, callback: (error, response, body) => void) {
    const options = {
        uri: 'https://accept.paymobsolutions.com/api/acceptance/payment_keys?token=' + authenticationToken,
        method: 'POST',
        json: {
            "amount_cents": amount,
            "expiration": 36000,
            "order_id": orderId,
            "currency": "EGP",
            "integration_id": "930" // this is constant and is taken from accept account portal 
        }
    };
    request(options, callback);

}

export const pay = functions.https.onCall((data, context) => {
    const promise = new Promise((resolve, reject) => {
        if (data && data.amount) {
            authenticate((error, response, body) => {
                if (!error && response.statusCode == 201) {
                    //here put what you want to do with the request
                    //  servicesResponse.send(response.body.token);
                    createOrder(response.body.token, data.amount, (createOrderError, createOrderResponse, createOrderBody) => {
                        if (!createOrderError && createOrderResponse.statusCode == 201) {
                            // return { "orderId": createOrderResponse.body.id };
                            console.log("Create order result");
                            console.log(createOrderResponse.body.id);
                            createPaymentToken(response.body.token, data.amount, createOrderResponse.body.id, (paymentTokenErr, paymentTokenRes, paymentTokenBody) => {
                                if (!paymentTokenErr && paymentTokenRes.statusCode == 201) {
                                    console.log("Create payment token result");
                                    console.log(paymentTokenRes.body.token);
                                    resolve(paymentTokenRes.body.token);
                                }
                                else {
                                    reject(new functions.https.HttpsError('cancelled', error ? error : "Error in creating payment Token", error ? error : "Error in creating payment Token"));
                                }
                            });
                        }
                        else {
                            reject(new functions.https.HttpsError('cancelled', error ? error : "Error in creating order", error ? error : "Error in creating order"));
                        }
                    });
                }
                else {
                    reject(new functions.https.HttpsError('cancelled', error ? error : "Error in making authentication request", error ? error : "Error in making authentication request"));
                }
            });
        }
        else {
            reject(new functions.https.HttpsError('invalid-argument', "Request must contain payment amount in cents", "Request must contain payment amount in cents"));
        }
    });
    return promise;

});

export const payHttps = functions.https.onRequest((req, res) => {
    if (req && req.body && req.body.amount) {

        authenticate((error, response, body) => {
            if (!error && response.statusCode == 201) {
                //here put what you want to do with the request
                //  servicesResponse.send(response.body.token);
                createOrder(response.body.token, req.body.amount, (createOrderError, createOrderResponse, createOrderBody) => {
                    if (!createOrderError && createOrderResponse.statusCode == 201) {
                        // res.send({ "orderId": createOrderResponse.body.id });
                        createPaymentToken(response.body.token, req.body.amount, createOrderResponse.body.id, (paymentTokenErr, paymentTokenRes, paymentTokenBody) => {
                            if (!paymentTokenErr && paymentTokenRes.statusCode == 201) {
                                res.send({ "paymentToken": paymentTokenRes.body.token });
                            }
                            else {
                                res.statusCode = 505;
                                if (error) {
                                    res.statusMessage = error;
                                    res.send(error);
                                    console.error(error);
                                }
                                else {
                                    res.end();
                                }
                            }
                        });
                    }
                    else {
                        // throw new functions.https.HttpsError('cancelled', error);
                        res.statusCode = 505;
                        if (error) {
                            res.statusMessage = error;
                            console.error(error);
                            res.send(error);
                        }
                        else {
                            res.end();
                        }
                    }

                });

            }
            else {
                // throw new functions.https.HttpsError('cancelled', error);
                res.statusCode = 505;
                if (error) {
                    res.statusMessage = error;
                    console.error(error);
                    res.send(error);
                }
                else {
                    res.end();
                }
            }
        });
    }
    else {
        res.statusCode = 400;
        res.statusMessage = "Request must contain payment amount in cents";
        res.send("Request must contain payment amount in cents");
        // throw new functions.https.HttpsError('invalid-argument', "Request must contain payment amount in cents", "Request must contain payment amount in cents");
    }
});

export const paymentSucessCallback = functions.https.onRequest((req, res) => {
    if (req && req.params) {
        console.log("Success Payment callback");
        console.log(req.params);
    }
});
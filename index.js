
/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/

'use strict';

const Alexa = require('alexa-sdk');
const request = require('request');

const APP_ID = process.env.APP_ID;
const QUANDL_KEY = process.env.QUANDL_KEY;
var dateNow = new Date();
var dateNowYear = dateNow.getFullYear();
var dateNowMonth = dateNow.getMonth();
var currentMonthDate = dateNowYear + "-" + dateNowMonth + "-01";

const handlers = {
    'LaunchRequest': function () {
        this.emit('GetFact');
    },
    'GetFedRatePrediction': function () {
        this.emit('GetFedRateTrend');
    },
    'GetFedRate': function() {
        this.emit('GetQuandlFedRate');  
    },
    'GetThirtyYearFixed': function(){
        this.emit('Get30YearFixedRate');
    },
    'GetFifteenYearFixed': function(){
        this.emit('Get15YearFixedRate');
    },
    'Get5YearArm': function(){
        this.emit('Get5YearArmRate');
    },
    'GetFedRateTrend': function() {
        var t = this;
        var d = new Date();
        d.setMonth(d.getMonth() - 6);
        var dateYear = d.getFullYear();
        var month = d.getMonth();
        var day = "01";
        var newDate = dateYear + "-" + month + "-" + day;
        request("https://www.quandl.com/api/v3/datasets/FRED/FEDFUNDS.json?api_key="+QUANDL_KEY+"&start_date="+newDate, function(error, response, body){
            if(!error && response.statusCode == 200) {
                // calculate linear fit
                var jsonBody = JSON.parse(body);
                var n = jsonBody.dataset.data.length;
                var sumX = 0;
                var sumY = 0;
                var sumXtimesY = 0;
                var sumXsquared = 0;
                var reversedData = jsonBody.dataset.data;
                reversedData.reverse();
                for (var i = 0; i < reversedData.length; i++) {
                    var pair = reversedData[i];
                    sumX += (i+1);
                    sumY += pair[1];
                    sumXtimesY += ((i+1)*pair[1]);
                    sumXsquared += Math.pow((i+1), 2);
                }
                var a = n * sumXtimesY;
                var b = sumX * sumY;
                var c = n * sumXsquared;
                var d = Math.pow(sumX, 2);
                var slope = (a-b)/(c-d);
                // form output based on slope
                // TODO: gather news and get sentiment to add to predictive index
                if(slope < 0) {
                    const output = "Based on six month trends, the fed appears to be preparing to lower rates.";
                    t.emit(':tellWithCard', output, 'Rate Prediction', 'Down');
                } else {
                    const output = "Based on six month trends, the fed appears to be preparing to raise rates.";
                    t.emit(':tellWithCard', output, 'Rate Prediction', 'Up');
                }
            } else {
                console.log(error);
            }
        });
    },
    'GetQuandlFedRate': function() {
        var t = this;
        request('https://www.quandl.com/api/v3/datasets/FRED/FEDFUNDS.json?api_key='+QUANDL_KEY+'&start_date='+currentMonthDate, function(error, response, body){
            if(!error && response.statusCode == 200) {
                var jsonBody = JSON.parse(body);
                var latestRate = jsonBody.dataset.data[0][1];
                const output = "The current effective fed rate is around "+latestRate+" percent.";
                t.emit(':tellWithCard', output, 'Effective Federal Reserve Rate', latestRate+"%");
            } else {
                console.log(error);
            }
        });
    },
    'Get30YearFixedRate': function() {
        var t = this;
        request('https://www.quandl.com/api/v3/datasets/FMAC/FIX30YR.json?api_key='+QUANDL_KEY+'&start_date='+currentMonthDate, function(error, response, body){
            if(!error && response.statusCode == 200) {
                var jsonBody = JSON.parse(body);
                var latestRate = jsonBody.dataset.data[0][1];
                const output = "The current 30 year fixed rate, as reported by freddie mac, is around "+latestRate+" percent.";
                t.emit(':tellWithCard', output, '30 Year Fixed Mortgage Rate', latestRate+"%");
            }
        });
    },
    'Get15YearFixedRate': function() {
        var t = this;
        request('https://www.quandl.com/api/v3/datasets/FMAC/FIX15YR.json?api_key='+QUANDL_KEY+'&start_date='+currentMonthDate, function(error, response, body){
            if(!error && response.statusCode == 200) {
                var jsonBody = JSON.parse(body);
                var latestRate = jsonBody.dataset.data[0][1];
                const output = "The current 15 year fixed rate, as reported by freddie mac, is around "+latestRate+" percent.";
                t.emit(':tellWithCard', output, '15 Year Fixed Mortgage Rate', latestRate+"%");
            }
        });
    },
    'Get5YearArmRate': function() {
        var t = this;
        request('https://www.quandl.com/api/v3/datasets/FMAC/ARM5YR.json?api_key='+QUANDL_KEY+'&start_date='+currentMonthDate, function(error, response, body){
            if(!error && response.statusCode == 200) {
                var jsonBody = JSON.parse(body);
                var latestRate = jsonBody.dataset.data[0][1];
                const output = "The current 5 year adjustable rate, as reported by freddie mac, is around "+latestRate+" percent.";
                t.emit(':tellWithCard', output, '5 Year Adjustable Rate Mortage', latestRate+"%");
            }
        });
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    // alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};


const request = require("request");
const BFX = require("bitfinex-api-node");

const API_KEY = '';
const API_SECRET = '';

const bfx = new BFX(
{
    apiKey: API_KEY,
    apiSecret: API_SECRET,

    ws:
    {
        transform: true,
        version: 2,
        autoReconnect: true,
        seqAudit: true,
        packetWDDelay: 10 * 1000
    }
})
const bws = bfx.ws();

function BfxTrade(pairs)
{
    this.initialAmount = 10;
    this.reserve = {};
    this.prices={};

    bws.on('open', function()
    {
        for (var pair of pairs)
        {
            bws.subscribeTicker("t" + pair);
        }
    });

    bws.open();

    setInterval(function()
    {
        console.log("Restarting websockets");
        bws.close;
        bws.open;
    },  60 * 60 * 1000);
}

BfxTrade.prototype.getPrices = function()
{
    var self = this;
    bws.on('ticker', function (pair, data)
    {
        bws.onmessage = (msg) => console.log(msg.data);
        bws.on('error', console.error);
        
        if (!self.prices.hasOwnProperty(pair))
        {
            self.prices[pair] = {lastPrice: -Infinity, highPrice: -Infinity, lowPrice: Infinity};
        }

        console.log(data);

        self.prices[pair]["lastPrice"] = data["lastPrice"];
        if (data["lastPrice"] > self.prices[pair]["highPrice"])
        {
            self.prices[pair]["highPrice"] = data["lastPrice"];
        }
        if (data["lastPrice"] < self.prices[pair]["lowPrice"])
        {
            self.prices[pair]["lowPrice"] = data["lastPrice"];
        }

        console.log(pair, data['lastPrice'], self.prices[pair]['lowPrice'], self.prices[pair]['highPrice']);
        
    }).setMaxListeners(Infinity);
}

BfxTrade.prototype.resetPrices = function(pair)
{
    this.prices[pair]["highPrice"] = -Infinity;
    this.prices[pair]["lowPrice"] = Infinity;
}

BfxTrade.prototype.testTrade = function(pair, price, amount, type, action, callback)
{
    switch(type)
    {
        case 'buy':
        {
            if (action == 'long')
            {
                this.initialAmount -= 1.002 * price * amount;
            } 
            else
            {
                this.initialAmount += 0.998 * (2 * this.reserve[pair] - price * amount);
            }
            return callback();
        }
        case 'sell':
        {
            if (action == 'long')
            {
                this.initialAmount += 0.998 * price * amount;
            }
            else
            {
                this.reserve[pair] = price * amount;
                this.initialAmount -= 1.002 * this.reserve[pair];
            }
            return callback();
        }
    }
}

BfxTrade.prototype.getHistData = function(pair, callback)
{
    var body = [];
        
    var currentDate = Date.now() / 1000;
    var startDate = (1800 - currentDate % 1800 + currentDate - 301 * 1800) * 1000;
    var url = "https://api.bitfinex.com/v2/candles/trade:30m:t" + pair + "/hist?limit=300&start=" + startDate + "sort=1";

    request ({url:url, method : "GET", timeout : 15000}, function(err, response, body)
    {
        if (!err)
        {
            return callback(pair, JSON.parse(body));
        }
        else
        {
            console.log(err.toString());
        }
    })
}


bws.on('error', console.error);

module.exports = BfxTrade;
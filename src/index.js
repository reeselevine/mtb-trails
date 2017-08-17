var Alexa = require('alexa-sdk');
var googleMapsClient = require('@google/maps').createClient({
  key: 'Google Maps API key here'
});
var https = require('https');

var states = {
    SEARCHMODE: '_SEARCHMODE',
    TRAILINFO: '_TRAILINFO',
};

var welcomeMessage = "Welcome to MTB Trails. You can ask for trails near a city name and get more information about those trails.";

var welcomeRemprompt = "Ask me for trails near any city";

var helpMessage = "Here is something you can ask me: Find me trails near Boulder, Colorado. After that, you can say: give me more information about trail number two. You can also say: Tell me about a place with cool trails. What do you want to do?";

var goodbyeMessage = "Thanks for using MTB trails. See you out on the bike!";

var noCityErrorMessage = "Sorry, I didn't recognize that city name. Please try again.";

var cityConversionErrorMessage = "Something went wrong while looking for trails. Please try again.";

var numberOfTrails = 3;

var ouput = "";

var alexa;

var newSessionHandlers = {
  'LaunchRequest': function () {
      this.handler.state = states.SEARCHMODE;
      this.emit(':ask', welcomeMessage, welcomeReprompt);
  },
  'AMAZON.StopIntent': function () {
      this.emit(':tell', goodbyeMessage);
  },
  'AMAZON.CancelIntent': function () {
      this.emit(':tell', goodbyeMessage);
  },
  'SessionEndedRequest': function () {
      this.emit('AMAZON.StopIntent');
  },
  'Unhandled': function () {
      this.emit(':ask', helpMessage, welcomeReprompt);
  }
};

var searchHandlers = Alexa.CreateStateHandler(states.SEARCHMODE, {
  'getTrailsIntent': function () {
      var city = '';
      var lat = 0;
      var lng = 0;
      if (this.event.request.slots.city) {
          if (this.event.request.intent.slots.city.value) {
              city = this.event.request.intent.slots.city.value;
          }
      }

      if (city) {
        googleMapsClient.geocode({
          address: city
        }, function(err, response) {
          if (!err) {
            lat = response.json.results.geometry.location.lat; 
            lng = response.json.results.geometry.location.lng;
          }
        });

        if (lat != 0 && lng != 0) {
          var loc = [lat, lng];
          httpsGet(loc, function (response) {
            var responseData = JSON.parse(response);
            var cardContent = "Data provided by MTB Project\n\n";

            if (responseData == null) {
              output = "There was a problem getting trail data. Please try again.";
            } else {
              output = "There are " + responseData.trails.length + " trails near " + city + ".";
              if (responseData.trails.length > numberOfTrails) {
                output += " Here are the top " + numberOfTrails + ".";
              }
              output += " See your Alexa app for more information and trails.";
              
              for (var i = 0; i < responseData.trails.length; i++) {
                if (i < numberOfTrails) {
                  var name = responseData.trails[i].name;
                  var summary = responseData.trails[i].summary;
                  var difficulty = responseData.trails[i].difficulty;

                  output += name + ". " + summary + " Difficulty: " + difficulty + ";";
                }
                cardContent += name + "\n" + summary + "\n" + "Difficulty: " + difficulty + "\n\n"; 
              }
              
            }
            var cardTitle = city + " Trails";
            alexa.emit(':tellWithCard', output, cardTitle, cardContent);
          } 
        } else {
          this.emit(':ask', cityConversionErrorMessage);
        }
      } else {
        this.emit(':ask', noCityErrorMessage);
      }
  },

  'AMAZON.YesIntent': function () {
      this.emit(':ask', helpMessage, helpMessage);
  },
  'AMAZON.NoIntent': function () {
      this.emit(':ask', helpMessage, helpMessage);
  },
  'AMAZON.StopIntent': function () {
      this.emit(':tell', goodbyeMessage);
  },
  'AMAZON.HelpIntent': function () {
      this.emit(':ask', helpMessage, helpMessage);
  },
  'AMAZON.RepeatIntent': function () {
      this.emit(':ask', output, helpMessage);
  },
  'AMAZON.CancelIntent': function () {
      this.emit(':tell', goodbyeMessage);
  },
  'SessionEndedRequest': function () {
      this.emit('AMAZON.StopIntent');
  },
  'Unhandled': function () {
      this.emit(':ask', helpMessage, welcomeRemprompt);
  }
});

var trailInfoHandlers = Alexa.CreateStateHandler(states.TRAILINFO, {
  'AMAZON.YesIntent': function () {
      this.emit(':ask', helpMessage, helpMessage);
  },
  'AMAZON.NoIntent': function () {
      this.emit(':ask', helpMessage, helpMessage);
  },
  'AMAZON.StopIntent': function () {
      this.emit(':tell', goodbyeMessage);
  },
  'AMAZON.HelpIntent': function () {
      this.emit(':ask', helpMessage, helpMessage);
  },
  'AMAZON.RepeatIntent': function () {
      this.emit(':ask', output, helpMessage);
  },
  'AMAZON.CancelIntent': function () {
      this.emit(':tell', goodbyeMessage);
  },
  'SessionEndedRequest': function () {
      this.emit('AMAZON.StopIntent');
  },
  'Unhandled': function () {
      this.emit(':ask', helpMessage, welcomeRemprompt);
  }
});

function httpsGet(query, callback) {
  var options = {
    host: 'https://www.mtbproject.com',
    path: '/data/get-trails?lat=' + query[0] + '&lon=' + query[1] + '&key=' + "MTB Project API key here",
    method: 'GET'
 
    var req = https.request(options, (res) => {
      var body = '';
      res.on('data', (d) => {
        body += d;
      });
      res.on('end', function () {
        callback(body);
      });
    });
    req.end();
    req.on('error', (e) => {
      console.error(e);
    });
  };
}




exports.handler = function (event, context, callback) {
  alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(newSessionHandlers, searchHandlers, trailInfoHandlers);
  alexa.execute(); 
};

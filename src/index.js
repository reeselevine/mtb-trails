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

var welcomeReprompt = "Ask me for trails near any city";

var helpMessage = "Here is something you can ask me: Find me trails near Boulder, Colorado. After that, you can say: give me more information about trail number two. What do you want to do?";

var goodbyeMessage = "Thanks for using MTB trails. See you out on the bike!";

var noCityErrorMessage = "Sorry, I didn't recognize that city name. Please try again.";

var cityConversionErrorMessage = "Something went wrong while looking for trails. Please try again.";

var noTrailErrorMessage = "What trail was that? Please try again.";

var trailsMoreInfoMessage = "You can tell me a number for more information. For example, open number one.";

var hearMoreMessage = "Would you like to hear about another trail?";

var numberOfTrails = 3;

var output = "";

var responseData;

var city;

var alexa;

var newSessionHandlers = {
  'LaunchRequest': function () {
      this.handler.state = states.SEARCHMODE;
      this.emit(':ask', welcomeMessage, welcomeReprompt);
  },
  'getTrailsIntent': function () {
      this.handler.state = states.SEARCHMODE;
      this.emitWithState('getTrailsIntent');
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
      this.handler.state = states.TRAILINFO;
      city = '';
      var lat = 0;
      var lng = 0;
      if (this.event.request.intent.slots.city) {
          if (this.event.request.intent.slots.city.value) {
              city = this.event.request.intent.slots.city.value;
          }
      }

      if (city) {
        googleMapsClient.geocode({
          address: city
        }, function(err, response) {
          if (!err) {
            console.log(response.json.results);
            console.log(response.json.results[0].geometry);
            lat = parseFloat(response.json.results[0].geometry.location.lat); 
            lng = parseFloat(response.json.results[0].geometry.location.lng);
          } else {
            console.error(err);
          }
          if (lat != 0 && lng != 0) {
            var loc = [lat, lng];
            console.log(loc);
            httpsGet(loc, function (response) {
              responseData = JSON.parse(response);
              var cardContent = "Data provided by MTB Project\n\n";

              if (responseData == null) {
                output = "There was a problem getting trail data. Please try again.";
              } else {
                output = "There are " + responseData.trails.length + " trails near " + city + ".";
                if (responseData.trails.length > numberOfTrails) {
                  output += " Here are the top " + numberOfTrails + ".";
                }
                output += " See your Alexa app for more information and more trails. ";
              
                for (var i = 0; i < responseData.trails.length; i++) {
                  if (i < numberOfTrails) {
                    var name = responseData.trails[i].name;
                    var summary = responseData.trails[i].summary;
                    var difficulty = responseData.trails[i].difficulty;
                    var index = i + 1;
                    output += "Trail " + index + ";";

                    output += name + ". " + summary + " Difficulty: " + difficulty + ";";
                  }
                  cardContent += name + "\n" + summary + "\n" + "Difficulty: " + difficulty + "\n\n"; 
                }
              
              }
              var cardTitle = city + " Trails";
              output += "\n" + trailsMoreInfoMessage; 
              output = output.replace(/&/, 'and');
              alexa.emit(':askWithCard', output, trailsMoreInfoMessage, cardTitle, cardContent);
            }); 
          } else {
            alexa.emit(':ask', cityConversionErrorMessage);
          }
        });
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
      this.emit(':ask', helpMessage, welcomeReprompt);
  }
});

var trailInfoHandlers = Alexa.CreateStateHandler(states.TRAILINFO, {
  'getTrailsIntent': function () {
    this.handler.state = states.SEARCHMODE;
    this.emitWithState('getTrailsIntent');
  },  
  'getMoreInfoIntent': function () {
    var trail = 0;
    if (this.event.request.intent.slots.trail) {
      if (this.event.request.intent.slots.trail.value) {
        trail = this.event.request.intent.slots.trail.value;
      }
    }

    if (trail > 0 && trail <= responseData.trails.length) {
      var selectedTrail = responseData.trails[parseInt(trail) - 1];  
      output = selectedTrail.name + ". " + selectedTrail.summary + ';';
      output += " It has " + selectedTrail.stars + " stars and a difficulty rating of " + selectedTrail.difficulty + ". ";
      output += "It is " + selectedTrail.length + " miles long, has " + selectedTrail.ascent + " feet of climbing, and reaches a high point of " + selectedTrail.high + " feet.  ";
      output += hearMoreMessage;
      output = output.replace(/&/, 'and');
      this.emit(':ask', output, hearMoreMessage);
    } else {
      this.emit(':ask', noTrailErrorMessage, trailsMoreInfoMessage); 
    }
  },
  'AMAZON.YesIntent': function () {
      this.emit(':ask', trailsMoreInfoMessage, trailsMoreInfoMessage);
  },
  'AMAZON.NoIntent': function () {
      this.emit(':tell', goodbyeMessage);
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
      this.emit(':ask', helpMessage, welcomeReprompt);
  }
});

function httpsGet(query, callback) {
  var options = {
    host: 'www.mtbproject.com',
    path: '/data/get-trails?lat=' + query[0] + '&lon=' + query[1] + '&key=MTB Project API key here',
    method: 'GET'
  };
 
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
}

exports.handler = function (event, context, callback) {
  alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(newSessionHandlers, searchHandlers, trailInfoHandlers);
  alexa.execute(); 
};

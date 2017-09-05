var Alexa = require('alexa-sdk');
var googleMapsClient = require('@google/maps').createClient({
  key: 'Google Maps API key here'



});
var https = require('https');

var states = {
    SEARCHMODE: '_SEARCHMODE',
    TRAILINFO: '_TRAILINFO',
};

var MTBProjectAPIKey = 'MTB Project API key here';

var welcomeMessage = "Welcome to MTB Trails. Ask me for trails near any city. The default search distance is 30 miles. You can change it by saying: Change distance to 10 miles, or any number between 1 and 200."

var welcomeReprompt = "Ask me for trails near any city";

var trailsHelpMessage = "Here are some things you can say to me: Change distance to 15 miles. Find me trails near Boulder, Colorado. After that, you can say: give me more information about trail number two, or what are the conditions of trail two. What do you want to do?";

var trailsMoreInfoHelpMessage = "You can tell me a number for more information. For example, open number one, or what are the conditions of number one.";

var goodbyeMessage = "Thanks for using MTB trails. See you out on the bike!";

var noCityErrorMessage = "Sorry, I didn't recognize that city name. Please try again.";

var cityConversionErrorMessage = "Something went wrong while looking for trails. Please try again.";

var noTrailErrorMessage = "What trail was that? Please try again.";

var nullResponseMessage = "There was a problem getting trail data. Please try again.";

var hearMoreMessage = "Would you like to hear about another trail?";

var numberOfTrails = 3;

var output = "";

var responseData;

var city;

var maxDistance = 30;

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
      maxDistance = 30;
      this.emit(':tell', goodbyeMessage);
  },
  'AMAZON.CancelIntent': function () {
      maxDistance = 30;
      this.emit(':tell', goodbyeMessage);
  },
  'SessionEndedRequest': function () {
      maxDistance = 30;
      this.emit('AMAZON.StopIntent');
  },
  'Unhandled': function () {
      this.emit(':ask', trailsHelpMessage, welcomeReprompt);
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
            httpsGetTrails(loc, function (response) {
              responseData = JSON.parse(response);

              var cardContent = "Data provided by MTB Project\n\n";

              if (responseData == null) {
                output = nullResponseMessage;
	      } else if (responseData.trails.length == 0) {
		output = "I have no data on trails near " + city + ". I'm sorry.";
              } else {
		output = "Here are the top " + Math.min(numberOfTrails, responseData.trails.length) + " trails near " + city + ".";
                if (responseData.trails.length > numberOfTrails) {
		  output += " See your Alexa app for information on all " + responseData.trails.length + " trails. ";
                }
              
                for (var i = 0; i < responseData.trails.length; i++) {
                  var name = responseData.trails[i].name;
                  var summary = responseData.trails[i].summary;
                  var difficulty = responseData.trails[i].difficulty;
                  if (i < numberOfTrails) {
                    var index = i + 1;
                    output += "Trail " + index + ";";
                    output += name + ". " + summary + " Difficulty: " + difficulty + ";";
                  }
                  cardContent += name + "\n" + summary + "\n" + "Difficulty: " + difficulty + "\n\n"; 
                }

                output += "Tell me a trail number for more information."
                output = output.replace(/&/, 'and');
              }

              var cardTitle = city + " Trails";
              alexa.emit(':askWithCard', output, trailsMoreInfoHelpMessage, cardTitle, cardContent);
            }); 
          } else {
            alexa.emit(':ask', cityConversionErrorMessage);
          }
        });
      } else {
        this.emit(':ask', noCityErrorMessage);
      }
  },
  'changeDistanceIntent': function () {
    var distance = 0;
    if (this.event.request.intent.slots.distance) {
      if (this.event.request.intent.slots.distance.value) {
        distance = this.event.request.intent.slots.distance.value;
      }
    }

    if (distance > 0 && distance <= 200) {
      maxDistance = distance;
      this.emit(':ask', "The search distance was changed to " + maxDistance + " miles.", trailsHelpMessage);
    } else {
      this.emit(':ask', "Sorry, the distance you specified is not valid.");
    }
  },
  'AMAZON.YesIntent': function () {
      this.emit(':ask', trailsHelpMessage, trailsHelpMessage);
  },
  'AMAZON.NoIntent': function () {
      this.emit(':ask', trailsHelpMessage, trailsHelpMessage);
  },
  'AMAZON.StopIntent': function () {
      maxDistance = 30;
      this.emit(':tell', goodbyeMessage);
  },
  'AMAZON.HelpIntent': function () {
      this.emit(':ask', trailsHelpMessage, trailsHelpMessage);
  },
  'AMAZON.RepeatIntent': function () {
      this.emit(':ask', output, trailsHelpMessage);
  },
  'AMAZON.CancelIntent': function () {
      maxDistance = 30;
      this.emit(':tell', goodbyeMessage);
  },
  'SessionEndedRequest': function () {
      this.emit('AMAZON.StopIntent');
  },
  'Unhandled': function () {
      this.emit(':ask', trailsHelpMessage, welcomeReprompt);
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
  'getConditionsIntent': function () {
    var trail = 0;
    if (this.event.request.intent.slots.trail) {
      if (this.event.request.intent.slots.trail.value) {
        trail = this.event.request.intent.slots.trail.value;
      }
    }

    if (trail > 0 && trail <= responseData.trails.length) {
      var id = responseData.trails[trail - 1].id;
      httpsGetConditions(id, function (response) {
        var trailCondition = JSON.parse(response);
        if (trailCondition == null) {
          output = nullResponseMessage;
        } else {
          output = 'As of ' + trailCondition["0"].conditionDate + ', ' + trailCondition["0"].name + ' has a condition of ' + trailCondition["0"].conditionStatus + '. ';
          output += hearMoreMessage;
          alexa.emit(':ask', output, hearMoreMessage);
        }
      });
    } else {
      this.emit(':ask', noTrailErrorMessage, trailsMoreInfoMessage);
    }
  },
  'changeDistanceIntent': function () {
    this.handler.state = states.SEARCHMODE;
    var distance = 0;
    if (this.event.request.intent.slots.distance) {
      if (this.event.request.intent.slots.distance.value) {
        distance = this.event.request.intent.slots.distance.value;
      }
    }

    if (distance > 0 && distance <= 200) {
      maxDistance = distance;
      this.emit(':ask', "The search distance was changed to " + maxDistance + " miles.", trailsHelpMessage);
    } else {
      this.emit(':ask', "Sorry, the distance you specified is not valid.");
    }
  },
  'AMAZON.YesIntent': function () {
      this.emit(':ask', trailsMoreInfoMessage, trailsMoreInfoMessage);
  },
  'AMAZON.NoIntent': function () {
      this.handler.state = states.SEARCHMODE;
      this.emit(':ask', welcomeReprompt, welcomeReprompt);
  },
  'AMAZON.StopIntent': function () {
      maxDistance = 30;
      this.emit(':tell', goodbyeMessage);
  },
  'AMAZON.HelpIntent': function () {
      this.emit(':ask', trailsMoreInfoHelpMessage, trailsMoreInfoHelpMessage);
  },
  'AMAZON.RepeatIntent': function () {
      this.emit(':ask', output, trailsMoreInfoHelpMessage);
  },
  'AMAZON.CancelIntent': function () {
      maxDistance = 30;
      this.emit(':tell', goodbyeMessage);
  },
  'SessionEndedRequest': function () {
      this.emit('AMAZON.StopIntent');
  },
  'Unhandled': function () {
      this.emit(':ask', trailsMoreInfoHelpMessage, welcomeReprompt);
  }
});

function httpsGetTrails(query, callback) {
  var options = {
    host: 'www.mtbproject.com',
    path: '/data/get-trails?lat=' + query[0] + '&lon=' + query[1] + '&maxDistance=' + maxDistance + '&key=' + MTBProjectAPIKey,
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

function httpsGetConditions(query, callback) {
  var options = {
    host: 'www.mtbproject.com',
    path: '/data/get-conditions?ids=' + query + '&key=' + MTBProjectAPIKey,
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

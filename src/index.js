var Alexa = require('alexa-sdk');
var http = require('http');

var states = {
    SEARCHMODE: '_SEARCHMODE',
    TRAILINFO: '_TRAILINFO',
};

var welcomeMessage = "Welcome to MTB Trails. You can ask for trails near a city name and get more information about those trails.";

var welcomeRemprompt = "Ask me for trails near any city";

var helpMessage = "Here is something you can ask me: Find me trails near Boulder, Colorado. After that, you can say: give me more information about trail number two. You can also say: Tell me about a place with cool trails. What do you want to do?";

var goodbyeMessage = "Thanks for using MTB trails. See you on the mountain!";

var ouput = "";

var alexa;

var newSessionHandlers = {
  'LaunchRequest': function () {
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




exports.handler = function (event, context, callback) {
  alexa = Alexa.handler(event, context, callback);
  alexa.registerHandlers(newSessionHandlers, searchHandlers, trailInfoHandlers);
  alexa.execute(); 
};

# MTB Trails

This is an Alexa skill which allows users to query MTB Project's database and get information about trails near any city in the world.
It works using the Google Maps Geocoding API to convert city names into latitudes and longitudes, which can then be passed directly into MTB Project's API.

To start, tell Alexa to open MTB Trails. Then, ask for trails near a city. Currently, the search is limited to ten results due to limitations in the MTB
Project API, and the radius is set to 30 miles, which is the default.

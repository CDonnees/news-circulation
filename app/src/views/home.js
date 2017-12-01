'use strict';

angular.module('app.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'src/views/home.html'
  , controller: 'HomeController'
  })
}])

.controller('HomeController', function(
	$scope,
	$location,
	$timeout,
	$routeParams
) {

	// Generate dummy data
	var data = {}
	data.datapoints = []
	data.agents = []
	var i
	for (i=100; i>0; i--) {
		var d = {}
		d.entity_id = i
		d.entity_type = "dummy generated item"
		d.media_type = "generated"
		d.platform = "dummy"
		d.timestamp = Date.now() - Math.round(Math.random() * 1000)
		d.case = "Fake data"
		d.agent_id = Math.round(Math.random() * 100)
		d.visibility_score = Math.random() * 100
		d.as_true = Math.random() > 0.5
		data.datapoints.push(d)
	}
	for (i=100; i>0; i--) {
		var agent = {}
		agent.id = i
		// agent.visibility_score = Math.random()*100
		agent.name = "Fake Agent "+i
		data.agents.push(agent)
	}

	// Settings
	data.settings = {}
	data.settings.timeResolution = 10
	data.settings.decay = 0.8

	// Stats
	data.stats = {}
	data.stats.extent = d3.extent(data.datapoints, function(d){return d.timestamp})

	// Crunch the data to produce the curves
	data.asTrue = []
	data.asFalse = []
	var t
	var timeRange = []
	var timeIndex = {}
	for (t = data.stats.extent[0]; t<=data.stats.extent[1]; t+=data.settings.timeResolution) {
		timeRange.push(t)
		timeIndex[t] = {asTrue:0, asFalse:0}
	}
	var timeScale = d3.scaleQuantize()
		.domain(data.stats.extent)
		.range(timeRange)
	
	data.datapoints.forEach(function(d){
		if (d.as_true === true) {
			timeIndex[timeScale(d.timestamp)].asTrue += d.visibility_score
		} else if (d.as_true === false) {
			timeIndex[timeScale(d.timestamp)].asFalse += d.visibility_score
		}
	})

	for (t in timeIndex) {
		data.asTrue.push({timestamp: +t, volume: timeIndex[t].asTrue})
		data.asFalse.push({timestamp: +t, volume: timeIndex[t].asFalse})
	}

	$scope.data = data

})

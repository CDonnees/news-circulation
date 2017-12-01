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

	$scope.data
	$scope.files = [
		'11Mohamed SaouANDmacronmohamedfaux.json',
		'22testtoto.json'
	]

	// initData(buildDummyData())

	d3.json("data/"+$scope.files[0], function(json){
		$timeout(function(){
			initData(json)
		})
	})

	function buildDummyData() {
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
		for (i=100; i>=0; i--) {
			var agent = {}
			agent.id = i
			agent.visibility_score = Math.random()*100
			agent.name = "Fake Agent "+i
			data.agents.push(agent)
		}

		return data
	}

	function initData(data) {
		// Clean and consolidate
		var parseTime = d3.timeParse("%d/%m/%Y %H:%M:%S");
		data.datapoints.forEach(function(d){
			if (d.as_true === "true" || d.as_true === "vrai") {
				d.as_true = true
			}
			if (d.as_true === "false" || d.as_true === "faux") {
				d.as_true = false
			}
			d.visibility_score = 10 + 0.9 * (+d.visibility_score)
			d.timestamp = +parseTime(d.date)
		})
		data.agents.forEach(function(agent){
			agent.visibility_score = 1+agent.visibility_score
		})

		// Settings
		data.settings = {}
		data.settings.visibilityResolution = 5
		data.settings.visibilitySpaceRatio = 1
		data.settings.timeResolutionLength = 10000000
		data.settings.inertia = 0.9
		data.settings.timeSpaceRatio = 0.00000005

		// Stats
		data.stats = {}
		data.stats.timeExtent = d3.extent(data.datapoints, function(d){ return d.timestamp })
		data.stats.agentVisibilityExtent = d3.extent(data.agents, function(d){ return d.visibility_score })

		/*// Agent index
		data.agentIndex = {}
		data.agents.forEach(function(agent){
			data.agentIndex[agent.id] = agent
		})*/

		// Crunch the data to produce the curves
		data.asTrue = []
		data.asFalse = []
		var t
		var timeRange = []
		var timeIndex = {}
		for (t = data.stats.timeExtent[0]; t<=data.stats.timeExtent[1]; t+=data.settings.timeResolutionLength) {
			timeRange.push(t)
			timeIndex[t] = {asTrue:0, asFalse:0}
		}
		var timeScale = d3.scaleQuantize()
			.domain(data.stats.timeExtent)
			.range(timeRange)
		
		data.datapoints.forEach(function(d){
			var lane
			if (d.as_true) {
				lane = "asTrue"
			} else {
				lane = "asFalse"
			}
			var currentTimestamp = d.timestamp
			var currentVisibility = d.visibility_score
			while(currentTimestamp < data.stats.timeExtent[1] && currentVisibility > 0.5) {
				timeIndex[timeScale(currentTimestamp)][lane] += currentVisibility
				currentTimestamp += data.settings.timeResolutionLength
				currentVisibility *= data.settings.inertia
			}
		})

		for (t in timeIndex) {
			data.asTrue.push({timestamp: +t, volume: timeIndex[t].asTrue})
			data.asFalse.push({timestamp: +t, volume: timeIndex[t].asFalse})
		}

		// Crunch the visibility space(s)
		/*var visibilityRange = []
		for (i=0; i<=data.stats.agentVisibilityExtent[1]; i += data.stats.agentVisibilityExtent[1]/data.settings.visibilityResolution){
			visibilityRange.push(i)
		}
		var visibilityScale = d3.scaleQuantize()
			.domain([0, data.stats.agentVisibilityExtent[1]])
			.range(visibilityRange)*/

		$scope.data = data
		console.log('END INIT: $scope.data', $scope.data)
	}


})

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
	
	d3.json("data/offshore.json", function(json){
		var data = {}
		data.retweets = []
		data.originalsIndex = {}
		json.hits.hits.map(function(d){return d._source})
			.forEach(function(d){
				var rt
				try { rt = d.retweeted_status.id_str }
				catch(e){}
				if (rt) {
					data.retweets.push(d)
				} else {
					data.originalsIndex[d.id_str] = d
				}
			})
		d3.csv("data/offshore.csv", function(csv){
			csv.forEach(function(d){
				d.status = d['Circulated as claim or as debunk or undecided'].toLowerCase()

				// HOTFIXES
				if (d.tweet_id == "8.55094E+17") {
					d.tweet_id = "855094219882496000"
				}
				if (d.tweet_id == "8.60165E+17") {
					d.tweet_id = "860164730564096000"
				}
				if (d.tweet_id == "8.601E+17") {
					d.tweet_id = "860100448749056000"
				}
				if (d.tweet_id == "8.59892E+17") {
					d.tweet_id = "859892194957824000"
				}
				if (d.tweet_id == "8.60225E+17") {
					d.tweet_id = "860224838287360000"
				}

				var original = data.originalsIndex[d.tweet_id]
				if (original) {
					original.csv = d
				} else {
					console.log('TWEET NOT FOUND (1):', d.tweet_id)
				}

			})
			// Build datapoints
			data.datapoints = []
			data.retweets.forEach(function(d){
				var original = data.originalsIndex[d.retweeted_status.id_str]
				if (original) {
					d.csv = original.csv
					data.datapoints.push(d)
				} else {
					// console.log('TWEET NOT FOUND (2):', d.retweeted_status.id_str)
				}
			})
			$timeout(function(){
				initData(data)
			})
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
		console.log('data', data)
		// Clean and consolidate
		var parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S.000Z");
		data.datapoints = data.datapoints
			.filter(function(d){
				return d.csv.status == "claim" || d.csv.status == "debunk"
			})
			.map(function(d){
				d.as_true = d.csv.status == "claim"
				d.visibility_score = 1//+d.csv.retweet_count
				d.timestamp = +parseTime(d.ca)
				return d
			})
		console.log('Datapoints', data.datapoints)

		// Settings
		data.settings = {}
		data.settings.visibilityResolution = 20
		data.settings.visibilitySpaceRatio = 0.6
		data.settings.timeResolutionLength = 1000000
		data.settings.inertia = 0.8
		data.settings.timeSpaceRatio = 0.000003
		data.settings.colors = {
			asTrueOpaque: "#f5cc00",
			asFalseOpaque: "#4db8c0",
			asTrue: "rgba(245, 204, 0, 0.2)",
			asFalse: "rgba(77, 184, 192, 0.2)"

		}

		// Stats
		data.stats = {}
		data.stats.timeExtent = d3.extent(data.datapoints, function(d){ return d.timestamp })
		data.stats.visibilityExtent = d3.extent(data.datapoints, function(d){ return d.visibility_score })

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
		var visibilityRange = []
		var i
		for (i=0; i<=data.stats.visibilityExtent[1]; i += data.stats.visibilityExtent[1]/data.settings.visibilityResolution){
			visibilityRange.push(i)
		}
		var visibilityScale = d3.scaleQuantize()
			.domain([0, data.stats.visibilityExtent[1]])
			.range(visibilityRange)

		$scope.data = data
		console.log('END INIT: $scope.data', $scope.data)
	}


})

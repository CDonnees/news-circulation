'use strict';

/* Services */

angular.module('app.directives', [])

	.directive('showerCurve', function(
    $timeout
  ){
    return {
      restrict: 'A',
      scope: {
        data: '='
      },
      link: function($scope, el, attrs) {

        el.html('<div>LOADING</div>')

        $scope.$watch('data', redraw)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        // Data: timestamp in undecided out discovered in_uncrawled in_untagged total
        function redraw() {
          if ($scope.data !== undefined){

            $timeout(function(){
              el.html('');

              window.el = el[0]
              // Setup: dimensions
              var margin = {top: 128, right: 0, bottom: 8, left: 0};
              var width = el[0].offsetWidth - margin.left - margin.right;
              var height = $scope.data.settings.timeSpaceRatio * ($scope.data.stats.timeExtent[1] - $scope.data.stats.timeExtent[0])

              // While loading redraw may trigger before element being properly sized
              if (width <= 0 || height <= 0) {
                $timeout(redraw, 250)
                return
              }



             	var parseTime = d3.timeParse("%Q") // Or %s
             	var unifiedMax = Math.max(d3.max($scope.data.asTrue, function(d){return d.volume}), d3.max($scope.data.asFalse, function(d){return d.volume}))
              var xAsTrue = d3.scaleLinear()
							    .rangeRound([0, width/2])
							    .domain([0, unifiedMax])
							    // .domain([0, d3.max($scope.data.asTrue, function(d){return d.volume})])

              var xAsFalse = d3.scaleLinear()
							    .rangeRound([width, width/2])
							    .domain([0, unifiedMax])
							    // .domain([0, d3.max($scope.data.asFalse, function(d){return d.volume})])

							var y = d3.scaleTime()
							    .rangeRound([0, height])
							    .domain(d3.extent($scope.data.asTrue, function(d){return d.timestamp}))

							var areaAsTrue = d3.area()
    							.y(function(d){ return y(d.timestamp) })
    							.x0(xAsTrue(0))
    							.x1(function(d){ return xAsTrue(d.volume) })

							var areaAsFalse = d3.area()
    							.y(function(d){ return y(d.timestamp) })
    							.x0(xAsFalse(0))
    							.x1(function(d){ return xAsFalse(d.volume) })

              // Setup: SVG container
              var svg = d3.select(el[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)

              var g = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

              g.append("path")
					      .datum($scope.data.asTrue)
					      .attr("fill", $scope.data.settings.colors.asTrueOpaque)
					      .attr("d", areaAsTrue);

					    g.append("path")
					      .datum($scope.data.asFalse)
					      .attr("fill", $scope.data.settings.colors.asFalseOpaque)
					      .attr("d", areaAsFalse);

					    g.append("g")
					      .attr("transform", "translate(" + (width/2) + ",0)")
					      .call(
					      	d3.axisLeft(y)
					      		.ticks($scope.data.settings.timeTicks)
					      )

            })
          }
        }

      }
    }
  })

	.directive('visibilitySpace', function(
    $timeout
  ){
    return {
      restrict: 'A',
      scope: {
        data: '='
      },
      link: function($scope, el, attrs) {

        el.html('<div>LOADING</div>')

        $scope.$watch('data', redraw)

        window.addEventListener('resize', redraw)
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        // Data: timestamp in undecided out discovered in_uncrawled in_untagged total
        function redraw() {
          if ($scope.data !== undefined){
            $timeout(function(){
              el.html('');

              window.el = el[0]
              // Setup: dimensions
              var margin = {top: 128, right: 64, bottom: 8, left: 64};
              var width = el[0].offsetWidth - margin.left - margin.right;
              var height = $scope.data.settings.timeSpaceRatio * ($scope.data.stats.timeExtent[1] - $scope.data.stats.timeExtent[0])

              // While loading redraw may trigger before element being properly sized
              if (width <= 0 || height <= 0) {
                $timeout(redraw, 250)
                return
              }

              var parseTime = d3.timeParse("%Q") // Or %s

              var xAsTrue = d3.scaleLinear()
							    .rangeRound([0, 0.8 * width])
							    .domain([0, $scope.data.stats.visibilityExtent[1]])
              var xAsFalse = d3.scaleLinear()
							    .rangeRound([width, 0.2 * width])
							    .domain([0, $scope.data.stats.visibilityExtent[1]])

              var y = d3.scaleTime()
							    .rangeRound([0, height])
							    .domain(d3.extent($scope.data.asTrue, function(d){return d.timestamp}))

              // Setup: SVG container
              var svg = d3.select(el[0]).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)

              var g = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

              g.selectAll(".dot")
					      .data($scope.data.datapoints)
					    .enter().append("circle")
					      .attr("class", "dot")
					      .attr("r", 4)
					      // .attr("r", function(d){ return $scope.data.settings.visibilitySpaceRatio * Math.sqrt(d.visibility_score) })
					      .attr("cx", function(d) { 
					      	if (d.as_true) {
						      	return xAsTrue(d.visibility_score)
					      	} else {
						      	return xAsFalse(d.visibility_score)
					      	}
					      })
					      .attr("cy", function(d) { return y(d.timestamp) })
					      .style("fill", function(d){
					      	if (d.as_true) {
					      		return $scope.data.settings.colors.asTrue
					      	} else {
					      		return $scope.data.settings.colors.asFalse
					      	}
					      })
					      .on("mouseover", function(d) {
					      	console.log(d.visibility_score)
				        })

				       g.append("g")
					      .call(
					      	d3.axisLeft(y)
					      		.ticks($scope.data.settings.timeTicks)
					      )
				       g.append("g")
				       	.attr("transform", "translate(" + width + ",0)")
					      .call(
					      	d3.axisRight(y)
					      		.ticks($scope.data.settings.timeTicks)
					      )
            })
          }
        }

      }
    }
  })
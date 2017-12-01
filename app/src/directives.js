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
              var margin = {top: 128, right: 32, bottom: 8, left: 32};
              var width = el[0].offsetWidth - margin.left - margin.right;
              var height = $scope.data.settings.timeSpaceRatio * ($scope.data.stats.extent[1] - $scope.data.stats.extent[0])

              // While loading redraw may trigger before element being properly sized
              if (width <= 0 || height <= 0) {
                $timeout(redraw, 250)
                return
              }

              console.log($scope.data)

              var parseTime = d3.timeParse("%Q") // Or %s

              var xAsTrue = d3.scaleLinear()
							    .rangeRound([0, width/2])
							    .domain([0, d3.max($scope.data.asTrue, function(d){return d.volume})])

              var xAsFalse = d3.scaleLinear()
							    .rangeRound([width, width/2])
							    .domain([0, d3.max($scope.data.asFalse, function(d){return d.volume})])

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
					      .attr("fill", "steelblue")
					      .attr("d", areaAsTrue);

					    g.append("path")
					      .datum($scope.data.asFalse)
					      .attr("fill", "steelblue")
					      .attr("d", areaAsFalse);

            })
          }
        }

      }
    }
  })

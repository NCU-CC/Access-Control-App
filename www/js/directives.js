angular.module('app.directives', [])

.directive('autoFocus', ['$timeout', function($timeout){
   return {
      restrict: 'A',
      link : function($scope, $element) {
         $timeout(function() {
            $element[0].focus();
         }, 800);
      }
   }
}]);


angular.module('app.controllers', [])
  
.controller('entitiesCtrl', function($scope, $stateParams, ionicMaterialInk, ionicMaterialMotion) {
   console.log($stateParams);
   $scope.entities = [
      { name: 'I202' },
      { name: 'I002' },
      { name: 'I216' },
      { name: 'I210' }
   ];
   ionicMaterialInk.displayEffect();
   ionicMaterialMotion.ripple();
})
   
.controller('usersCtrl', function($scope, ionicMaterialInk, ionicMaterialMotion) {
   $scope.users = [
      { name: 'Tatsujin' },
      { name: 'Paul' }
   ];
   ionicMaterialInk.displayEffect();
   ionicMaterialMotion.ripple();
})
    

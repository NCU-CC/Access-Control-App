angular.module('app.controllers', ['app.services'])
  
.controller('entitiesCtrl', function($scope, $ionicPopup, Material, DoorClient) {
   $scope.showAuthToken = function(entity) {
      DoorClient.postAuthToken(entity.id, function(data) {
         $ionicPopup.show({
            title: 'Your code is...',
            template: data.token,
            scope: $scope,
            buttons: [
               {
                  text: '<b>OK</b>',
                  type: 'button-positive'
               }
            ]
         })
         Material.de();
      });
   };
   $scope.open = function(entity) {
      $ionicPopup.show({
         title: `Open ${entity.name}?`,
         scope: $scope,
         buttons: [
            {text: 'Cancel'},
            {
               text: 'OK',
               type: 'button-positive',
               onTap: function(e) {
                  $scope.showAuthToken(entity);
               }
            }
         ],
      });
      Material.de();
   };
   DoorClient.getUserEntities(function(data) {
      $scope.entities = data.content;
      Material.de();
   });
})

.controller('usersCtrl', function($scope, Material, DoorClient, $timeout) {
   DoorClient.getUsers(function(data) {
      $scope.users = data.content;
      Material.de();
   });
})

.controller('sideMenuCtrl', function($scope, Material, DoorClient) {
   DoorClient.getWhoAmI(function(user) {
      $scope.user = user;
   });
});
    

angular.module('app.controllers', ['app.services'])

.controller('sideMenuCtrl', function($scope, $ionicPopup, Material, AccessControl, OAuth, DoorClient) {
   $scope.logout = function() {
      $ionicPopup.show({
         title: 'Log out?',
         scope: $scope,
         buttons: [
            {text: 'No'},
            {
               text: 'Yes',
               type: 'button-positive',
               onTap: function(e) {
                  OAuth.logout();
                  AccessControl.initialize();
               }
            }
         ]
      });
      Material.de();
   };
   DoorClient.getWhoAmI(function(user) {
      $scope.user = user;
   });
})
  
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
            {text: 'No'},
            {
               text: 'Yes',
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
      Material.rede();
   });
})

.controller('usersCtrl', function($scope, $rootScope, $state, $ionicListDelegate, $ionicPopup, Material, DoorClient) {
   $scope.edit = function(user) {
      $rootScope.editUser = user;
      $ionicListDelegate.closeOptionButtons();
      $state.go('^.editUser');
   };
   $scope.remove = function(index) {
      $ionicPopup.show({
         title: `Remove ${$scope.users[index].description}?`,
         scope: $scope,
         buttons: [
            {text: 'No'},
            {
               text: 'Yes',
               type: 'button-positive',
               onTap: function(e) {
                  DoorClient.deleteUser($scope.users[index].id);
                  $scope.users.splice(index, 1);
               }
            }
         ]
      });
      $ionicListDelegate.closeOptionButtons();
   };
   $rootScope.showUsers = function(){
      DoorClient.getUsers(function(data) {
         $scope.users = data.content;
         Material.rede();
      });
   };
   $rootScope.showUsers();
})

.controller('createUserCtrl', function($scope, $rootScope, Material, DoorClient) {
   $scope.newUser = {};
   $scope.createUser = function(user) {
      DoorClient.postUser(user, function() {
         $rootScope.showUsers();
      });
   };
   Material.de();
})

.controller('editUserCtrl', function($scope, $rootScope, Material, DoorClient) {
   $scope.editUser = $rootScope.editUser;
   $scope.save = function(user) {
      DoorClient.putUser(user, function() {
         $rootScope.showUsers();
      });
   };
   Material.de();
});

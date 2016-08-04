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
         title: 'Open ' + entity.name + '?',
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
   $scope.refresh = function() {
      $scope.show(function() {
         $scope.$broadcast('scroll.refreshComplete');
      });
   };
   $scope.show = function(callback) {
      DoorClient.getMyEntities(function(data) {
         $scope.entities = data.content;
         if (typeof callback === 'function')
            callback();
         Material.rede();
      });
   };
   $scope.show();
})

.controller('usersCtrl', function($scope, $rootScope, $state, $ionicListDelegate, $ionicPopup, Material, DoorClient) {
   $scope.manage = function(user) {
      $rootScope.manageUser = angular.copy(user);
      $ionicListDelegate.closeOptionButtons();
      $state.go('^.manageUser');
   };
   $scope.edit = function(user) {
      $rootScope.editUser = angular.copy(user);
      $ionicListDelegate.closeOptionButtons();
      $state.go('^.editUser');
   };
   $scope.remove = function(index) {
      $ionicPopup.show({
         title: 'Remove ' + $scope.users[index].description + '?',
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
   $scope.refresh = function() {
      $rootScope.showUsers(function() {
         $scope.$broadcast('scroll.refreshComplete');
      });
   };
   $rootScope.showUsers = function(callback){
      DoorClient.getUsers(function(data) {
         $scope.users = data.content;
         if (typeof callback === 'function')
            callback();
         Material.rede();
      });
   };
   $rootScope.showUsers();
})

.controller('createUserCtrl', function($scope, $rootScope, Material, DoorClient) {
   $scope.newUser = {
      id: '',
      description: '',
      type: 'common'
   };
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
})

.controller('manageUserCtrl', function($scope, $rootScope, Material, DoorClient) {
   $scope.manageUser = $rootScope.manageUser;
   $scope.update = function(entity) {
      if (entity.authorized) {
         DoorClient.postAuthorization($scope.manageUser, entity, function() {
            window.plugins.toast.showShortBottom(entity.name + ' has been authorized.');
         });
      } else {
         DoorClient.deleteAuthorization($scope.manageUser, entity, function() {
            window.plugins.toast.showShortBottom(entity.name + ' has been deauthorized.');
         });
      }
   };
   DoorClient.getEntities(function(data) {
      $scope.entities = {};
      angular.forEach(data.content, function(entity) {
         entity.authorized = false;
         $scope.entities[entity.id] = entity;
      })
      DoorClient.getUserEntities($scope.manageUser, function(data) {
         angular.forEach(data.content, function(entity) {
            if (typeof $scope.entities[entity.id] !== 'undefined')
               $scope.entities[entity.id].authorized = true;
         });
         Material.rede();
      });
   });
});

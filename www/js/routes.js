angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('accessControl.entities', {
    url: '/entities',
    views: {
      'ac': {
        templateUrl: 'templates/entities.html',
        controller: 'entitiesCtrl'
      }
    }
  })

  .state('accessControl.users', {
    url: '/users',
    views: {
      'ac': {
        templateUrl: 'templates/users.html',
        controller: 'usersCtrl'
      }
    }
  })

  .state('accessControl', {
    url: '/ac',
    templateUrl: 'templates/accessControl.html',
    controller: 'sideMenuCtrl',
    abstract:true
  });

  $urlRouterProvider.otherwise('/ac/entities');

});
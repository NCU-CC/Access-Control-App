angular.module('app.services', [])

.service('AccessControl', ['OAuth', 'DoorClient', function(OAuth, DoorClient) {
   this.initialize = function() {
      OAuth.configure(window.config.oauth).getAccessToken(function(accessToken) {
         DoorClient.configure({
            baseUrl: window.config.doorUrl,
            accessToken: accessToken
         });
      });
   };
}])

.service('OAuth', ['$http', function($http){
   const codeRegex = /code=([^#&]*)(?:$|[#&])/
   const errorRegex = /error=([^#&]*)(?:$|[#&])/

   var config;
   var tokenData;
   var requiredKeys = [
     'authorizeUrl',
     'tokenUrl',
     'clientId',
     'clientSecret',
     'scopes'
   ];

   this.configure = function(params) {
      config = params;
      angular.forEach(requiredKeys, (key) => {
         if (! config[key]) {
            throw new Error(`Missing parameter: ${key}.`);
         }
      });
      return this;
   };

   this.logout = function() {
      tokenData = null;
      localStorage.removeItem('tokenData');
   }

   this.authorize = function() {
      var scopeQueryString = 'scope=' + config.scopes[0];
      for (var i = 1; i < config.scopes.length; ++i)
         scopeQueryString += '+' + config.scopes[i];
      window.open(config.authorizeUrl + '?response_type=code&' + scopeQueryString + '&client_id=' + config.clientId);
      ionic.Platform.exitApp();
   }

   this.refreshToken = function(callback) {
      // Todo: Implement refresh token.
   }

   this.getAccessToken = function(callback) {
      window.plugins.webintent.getUri(function(uri){
         var error = errorRegex.exec(uri);
         if (error !== null && error[1] == 'access_denied') {
            ionic.Platform.exitApp();
            return;
         }
         var code = codeRegex.exec(uri)
         if (code === null) {
            if (typeof localStorage.tokenData === "undefined" ) {
               this.authorize();
            } else {
               tokenData = JSON.parse(localStorage.tokenData);
               if (new Date().getTime() / 1000 > tokenData.expiredAt - 60) {
                  refreshToken(callback);
               } else {
                  callback(tokenData.accessToken);
               }
            }
         } else {
            $http({
               method: 'POST',
               url: config.tokenUrl,
               data: `grant_type=authorization_code&code=${code[1]}&client_id=${config.clientId}&client_secret=${config.clientSecret}`,
               headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function(response) {
               console.log(response);
               tokenData = {
                  accessToken: response.data.access_token,
                  refreshToken: response.data.refresh_token,
                  expiredAt: response.data.expires_in + new Date().getTime() / 1000
               };
               localStorage.tokenData = JSON.stringify(tokenData);
               callback(tokenData.accessToken);
            }, function(response) {
               console.log(response);
            });
         }
      }.bind(this))
   }
}])

.service('DoorClient', ['$http', function($http) {
   var accessToken;
   var baseUrl;
   var queue = [];
   var user;
   var whoAmICallbacks = [];

   this.configure = function(params) {
      baseUrl = params.baseUrl;
      accessToken = params.accessToken;
      this.execQueue();
   };

   this.enqueue = function(method, path, callback, params) {
      queue.push({
         method: method,
         path: path,
         callback: callback,
         params: params
      });
   };

   this.execQueue = function() {
      angular.forEach(queue, function(request) {
         this.request(request.method, request.path, request.callback, request.params);
      }.bind(this));
      queue = null;
   };

   this.getUsers = function(callback) {
      this.request('GET', '/users', callback);
   };

   this.getUserEntities = function(callback) {
      this.getWhoAmI(function(user) {
         this.request('GET', `/users/${user.id}/authorized_entities`, callback);
      }.bind(this));
   };

   this.getEntities = function(callback) {
      this.request('GET', '/entities', callback);
   };

   this.postAuthToken = function(id, callback) {
      this.request('POST', `/entities/${id}/authorization_tokens`, callback, '');
   };

   this.getWhoAmI = function(callback) {
      if (typeof user === 'undefined') {
         whoAmICallbacks.push(callback);
         if (whoAmICallbacks.length == 1) {
            this.request('GET', '/whoami', function(data) {
               user = {
                  type: data.type,
                  id: data.uid,
                  description: data.description
               };
               angular.forEach(whoAmICallbacks, function(callback) {
                  callback(user);
               });
            });
         }
      } else
         callback(user);
   };

   this.request = function(method, path, callback, params) {
      if (typeof baseUrl === 'undefined') {
         this.enqueue(method, path, callback, params);
      } else {
         $http({
            method: method,
            url: baseUrl + path,
            data: params,
            headers: {Authorization: `Bearer ${accessToken}`}
         }).then(function(response) {
            console.log(response);
            callback(response.data);
         }, function(response) {
            console.log(response);
         });
      }
   };
}])

.service('Material', ['$timeout', 'ionicMaterialInk', 'ionicMaterialMotion', function($timeout, ionicMaterialInk, ionicMaterialMotion) {
   this.reset = function() {
      var inClass = document.querySelectorAll('.in');
      for (var i = 0; i < inClass.length; i++) {
         inClass[i].classList.remove('in');
         inClass[i].removeAttribute('style');
      }
      var done = document.querySelectorAll('.done');
      for (var j = 0; j < done.length; j++) {
         done[j].classList.remove('done');
         done[j].removeAttribute('style');
      }
   }
   this.de = function() {
      $timeout(function() {
         ionicMaterialInk.displayEffect();
      }, 0);
   }
   this.rede = function() {
      this.reset();
      $timeout(function() {
         ionicMaterialInk.displayEffect();
         ionicMaterialMotion.ripple();
      }, 0);
   };
}]);

angular.module('app.services', [])

.service('AccessControl', ['OAuth', 'DoorClient', 'NFCIntent', 'NFCBeam', function(OAuth, DoorClient, NFCIntent, NFCBeam) {
   this.initialize = function() {
      NFCIntent.registerListener();
      OAuth.configure(window.config.oauth).getAccessToken(function(accessToken) {
         DoorClient.configure({
            baseUrl: window.config.doorUrl,
            accessToken: accessToken
         });
         NFCBeam.tokenReady();
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
     'redirectUri',
     'scopes'
   ];

   this.configure = function(params) {
      config = params;
      angular.forEach(requiredKeys, function(key) {
         if (! config[key]) {
            throw new Error('Missing parameter: ' + key + '.');
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
      window.open(config.authorizeUrl + '?response_type=code&' + scopeQueryString + '&client_id=' + config.clientId + '&redirect_uri=' + config.redirectUri);
      ionic.Platform.exitApp();
   }

   this.refreshToken = function(callback) {
      $http({
         method: 'POST',
         url: config.tokenUrl,
         data: 'grant_type=refresh_token&refresh_token=' + tokenData.refreshToken,
         headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      }).then(function(response) {
         console.log(response);
         tokenData.accessToken = response.data.access_token;
         tokenData.refreshToken = response.data.refresh_token;
         tokenData.expiredAt = response.data.expires_in + new Date().getTime() / 1000;
         localStorage.tokenData = JSON.stringify(tokenData);
         callback(tokenData.accessToken);
      }, function(response) {
         console.log(response);
      });
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
                  this.refreshToken(callback);
               } else {
                  callback(tokenData.accessToken);
               }
            }
         } else {
            $http({
               method: 'POST',
               url: config.tokenUrl,
               data: 'grant_type=authorization_code&code=' + code[1] + '&client_id=' + config.clientId + '&client_secret=' + config.clientSecret + '&redirect_uri=' + config.redirectUri,
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

   this.getUsers = function(callback, page) {
      this.request('GET', '/users' + (typeof page === 'undefined' ? '' : '?page=' + page), callback);
   };

   this.postUser = function(user, callback) {
      this.request('POST', '/users', callback, {
         id: user.id,
         description: user.description,
         type: user.type
      });
   };

   this.getMyEntities = function(callback) {
      this.getWhoAmI(function(user) {
         this.getUserEntities(user, callback)
      }.bind(this));
   };

   this.getUserEntities = function(user, callback) {
      this.request('GET', '/users/' + user.id + '/entities?authorized=true', callback);
   };

   this.putUser = function(user, callback) {
      this.request('PUT', '/users/' + user.id, callback, {
         description: user.description,
         type: user.type
      });
   }

   this.deleteUser = function(id, callback) {
      this.request('DELETE', '/users/' + id, callback);
   };

   this.getEntities = function(callback) {
      this.request('GET', '/entities', callback);
   };

   this.postAuthorization = function(user, entity, callback) {
      this.request('POST', '/authorizations', callback, {
         authorizeeId: user.id,
         entityId: entity.id
      });
   };

   this.deleteAuthorization = function(user, entity, callback) {
      this.request('DELETE', '/authorizations?authorizee_id=' + user.id + '&entity_id=' + entity.id, callback);
   };

   this.postAuthToken = function(id, callback) {
      this.request('POST', '/entities/' + id + '/authorization_tokens', callback, '');
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
                  if (typeof callback === 'function')
                     callback(user);
               });
            });
         }
      } else if (typeof callback === 'function')
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
            headers: {Authorization: 'Bearer ' + accessToken}
         }).then(function(response) {
            console.log(response);
            if (typeof callback === 'function')
               callback(response.data);
         }, function(response) {
            window.plugins.toast.showShortBottom('Something went wrong.');
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
         ionicMaterialMotion.ripple();
      }, 0);
   }
   this.rede = function() {
      this.reset();
      $timeout(function() {
         ionicMaterialInk.displayEffect();
         ionicMaterialMotion.ripple();
      }, 0);
   };
}])

.service('NFCIntent', ['NFCBeam', function(NFCBeam) {
  this.registerListener = function () {
    window.nfc.enabled(function() {
      window.nfc.addMimeTypeListener("text/entity/id", function(nfcEvent) {
        var nfctag = nfcEvent.tag;
        var ndefMessage = nfctag.ndefMessage;
        NFCBeam.saveEntityUUID(window.nfc.bytesToString(ndefMessage[0].payload));
      }, null, null);
    }, null);
  };
}])

.service('NFCBeam', ['DoorClient', 'Material', function(DoorClient, Material) {
  var tokenIsReady = false;
  var entityUUID;

  this.tokenReady = function () {
    tokenIsReady = true;
    if (typeof entityUUID != 'undefined' && entityUUID != "") {
      this.beamBack();
    }
  };

  this.saveEntityUUID = function (uuid) {
    entityUUID = uuid;
    if (tokenIsReady) {
      this.beamBack();
    }
  };

  this.beamBack = function () {
    DoorClient.postAuthToken(entityUUID, function(data) {
      window.plugins.toast.showShortBottom('Get code ' + data.token);
      var message = [ window.ndef.textRecord(data.token) ];
      window.nfc.share(message, null, null);
    });
  };
}]);

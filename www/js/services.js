angular.module('app.services', [])

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
      this.config = params;
      angular.forEach(requiredKeys, (key) => {
         if (! this.config[key]) {
            throw new Error(`Missing parameter: ${key}.`);
         }
      });
      return this;
   };

   this.authorize = function() {
      var scopeQueryString = 'scope=' + this.config.scopes[0];
      for (var i = 1; i < this.config.scopes.length; ++i)
         scopeQueryString += '+' + this.config.scopes[i];
      window.open(this.config.authorizeUrl + '?response_type=code&' + scopeQueryString + '&client_id=' + this.config.clientId);
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
               this.tokenData = JSON.parse(localStorage.tokenData);
               if (new Date().getTime() / 1000 > this.tokenData.expiredAt - 60) {
                  this.refreshToken(callback);
               } else {
                  callback(this.tokenData.accessToken);
               }
            }
         } else {
            $http({
               method: 'POST',
               url: this.config.tokenUrl,
               data: `grant_type=authorization_code&code=${code[1]}&client_id=${this.config.clientId}&client_secret=${this.config.clientSecret}`,
               headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(function(response) {
               console.log(response.data);
               this.tokenData = {
                  accessToken: response.data.access_token,
                  refreshToken: response.data.refresh_token,
                  expiredAt: response.data.expires_in + new Date().getTime() / 1000
               };
               localStorage.tokenData = JSON.stringify(this.tokenData);
               callback(this.tokenData.accessToken);
            }, function(response) {
               console.log(response.data);
            });
         }
      }.bind(this))
   }
}]);

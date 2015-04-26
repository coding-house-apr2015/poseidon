'use strict';

angular.module('poseidon')
.factory('User', function($rootScope){

  function User(){
  }

  User.register = function(user){
    return $rootScope.afAuth.$createUser(user);
  };

  User.login = function(user){
    return $rootScope.afAuth.$authWithPassword(user);
  };

  User.logout = function(){
    return $rootScope.afAuth.$unauth();
  };

  return User;
});

'use strict';

angular.module('poseidon')
.controller('NavCtrl', function($rootScope, $scope, $state, User){

  $scope.afAuth.$onAuth(function(data){
    if(data){
      $rootScope.activeUser = data;
    }else{
      $rootScope.activeUser = null;
    }

    $state.go('home');
  });

  $scope.logout = function(){
    User.logout();
  };
});

(function() {
  'use strict';

  // Declare app level module which depends on views, and components
  angular.module('cumulus', [
    'ngRoute',
    'cumulus.addFiles',
    'cumulus.filesList',
    'cumulus.version'
  ]).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.otherwise({redirectTo: '/filesList'});
  }]);
})();

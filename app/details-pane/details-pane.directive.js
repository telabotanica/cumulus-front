(function() {
  'use strict';

  angular.module('cumulus.details', [])

  .directive('detailsPane', ['config', function(config) {
    var DetailsPaneController = function($rootScope) {
      var vm = this;

      $rootScope.$on('showFileDetails', function(event, details) {
        vm.details = details;
      });
    };

    var path = config.ressourcesPath;

    return {
      restrict: 'E',
      controller: DetailsPaneController,
      controllerAs: 'detailsPaneCtrl',
      templateUrl: path + 'details-pane/details-pane.html'
    }
  }])
})();

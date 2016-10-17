(function() {
  'use strict';

  angular.module('cumulus.details')

  .directive('detailsPaneData', ['config', function(config) {

    var path = config.ressourcesPath;

    return {
      restrict: 'E',
      templateUrl: path + 'details-pane/data-cell.html',
      scope: {
        datasource: '=',
        dataname: '='
      }
    };
  }])
})();

(function() {
  'use strict';

  angular.module('cumulus.details')

  .directive('detailsPaneData', ['configService', function(configService) {

    var path = configService.getConfig();

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

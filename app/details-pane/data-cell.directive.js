(function() {
  'use strict';

  angular.module('cumulus.details')

  .directive('detailsPaneData', ['configService', function(configService) {

    var path = configService.getConfig('path');

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

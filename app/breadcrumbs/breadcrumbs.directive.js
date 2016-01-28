(function() {
  'use strict';

  angular.module('cumulus.breadcrumbs')

  .directive('breadcrumbs', function() {
    var CrumbsController = function($rootScope) {
      var vm = this;

      vm.openFolder = function(folderPath) {
        $rootScope.$broadcast('openAbsoluteFolder', folderPath);
      };
    };

    return {
      controller: CrumbsController,
      controllerAs: 'crumbsCtrl',
      restrict: 'E',
      scope: {
        crumbs: '=crumbs'
      },
      templateUrl: 'breadcrumbs/breadcrumb.html'
    };
  })
})();

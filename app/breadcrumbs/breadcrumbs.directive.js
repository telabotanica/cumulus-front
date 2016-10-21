(function() {
  'use strict';

  angular.module('cumulus.breadcrumbs', [])

  .directive('breadcrumbs', ['config', function(config) {
    var CrumbsController = function($rootScope, breadcrumbsService) {
      var vm = this;

      vm.openFolder = function(folderPath) {
        $rootScope.$broadcast('openAbsoluteFolder', folderPath);
      };

      vm.refresh = function() {
        vm.crumbs = [];
        vm.crumbs.push({
          'name': 'Accueil',
          'path': config.abstractionPath
        });
        var path = breadcrumbsService.getCurrentPathCrumbs();
        if (path.length > 0) {
          for (var i = (1 + config.abstractionPathLength); i<path.length; i++) {
            vm.crumbs.push({
              name: path[i],
              path: path.slice(0, i+1).join('/')
            });
          }
        }
      };

      vm.refresh();

      $rootScope.$on('refreshBreadcrumbs', function() {
        vm.refresh();
      });
    };

    var path = config.ressourcesPath;

    return {
      controller: CrumbsController,
      controllerAs: 'crumbsCtrl',
      restrict: 'E',
      templateUrl: path + 'breadcrumbs/breadcrumb.html'
    };
  }])
})();

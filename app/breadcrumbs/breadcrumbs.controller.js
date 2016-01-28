(function() {
  'use strict';

  angular.module('cumulus.breadcrumbs', [])

  .controller('BreadcrumbsController', ['$rootScope', 'breadcrumbsService',
    function($rootScope, breadcrumbsService) {
      var vm = this;

      vm.refresh = function() {
        vm.crumbs = [];
        vm.crumbs.push({
          'name': 'Root',
          'path': ''
        });
        var path = breadcrumbsService.getCurrentPathCrumbs();
        if (path.length > 0) {
          for (var i=1; i<path.length; i++) {
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
    }
  ])
})();

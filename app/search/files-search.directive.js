(function() {
  'use strict';

  angular.module('cumulus.search', [])

  .directive('filesearch', function() {
    var FileSearchController = function($rootScope, $scope) {
      var vm = this;

      $scope.$watch('isSearchOpen', function(newValue, oldValue) {
        if (newValue === false && oldValue === true) {
          vm.closeSearch();
        }
      });

      vm.closeSearch = function() {
        $rootScope.$broadcast('searchClosed');
        $rootScope.nbSearchResults = 0;
        $scope.searchQuery = '';
        $scope.isSearchOpen = false;
      }

      vm.search = function(query) {
        $rootScope.$broadcast('fileSearch', query);
      };
    };

    return {
      restrict: 'E',
      controller: FileSearchController,
      controllerAs: 'fileSearchCtrl',
      scope: {
        isSearchOpen: '=isSearchOpen',
        searchQuery: '=searchQuery'
      },
      templateUrl: 'file-search.html'
    };
  })
})();

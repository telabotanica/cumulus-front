(function() {
  'use strict';

  angular.module('cumulus.breadcrumbs')

  .factory('breadcrumbsService', function() {
    var crumbs = [];
    var service = {
      addCrumb: function(crumb) {
        crumbs.push(crumb);
      },
      setCurrentPathCrumbs: function(crumbsArray) {
        crumbs = crumbsArray;
      },
      getCurrentPathCrumbs: function() {
        return angular.copy(crumbs);
      }
    };

    return service;
  })
})();

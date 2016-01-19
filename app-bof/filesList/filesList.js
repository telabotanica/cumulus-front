(function() {
  'use strict';

  angular.module('cumulus.filesList', ['ngRoute'])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/filesList', {
      templateUrl: 'filesList/filesList.html',
      controller: 'FilesListController',
      controllerAs: 'filesList'
    });
  }])

  .controller('FilesListController', ['$http', function($http) {
    var vm = this,
      currentPath = '';

    vm.openFolder = openFolder;
    vm.backFolder = backFolder;

    function openFolder(targetFolder, absolute) {
      currentPath = absolute ? targetFolder : currentPath += '/' + targetFolder;
      console.log(currentPath);

      $http.get('http://files.cumulus.dev/by-path' + currentPath).success(function(data) {
        vm.files = data.results;
      });

      $http.get('http://files.cumulus.dev/get-folders' + currentPath).success(function(data) {
        vm.folders = data;
      });
    };

    function backFolder() {
      var regexpt = /.*(\/\w+)$/;
      var result = regexpt.exec(currentPath)
      if (result) {
        var previousFolder = currentPath.replace(result[1], '');
        vm.openAbsoluteFolder(previousFolder, true);
      }
    }

    function openAbsoluteFolder(targetFolder) {
      vm.openFolder(targetFolder, true);
    }

    vm.openAbsoluteFolder(currentPath, true);
  }])

  .filter('formatByte', function() {
    return function (size, useBinary) {
      var base, prefixes;

      if (useBinary) {
        base = 1024;
        prefixes = ['Ko','Mo','Go','To','Po','Eo','Zo','Yo'];
      } else {
        base = 1000;
        prefixes = ['k','M','G','T','P','E','Z','Y'];
      }

      var exp = Math.log(size) / Math.log(base) | 0;
      return (size / Math.pow(base, exp)).toFixed(1) + ' ' +
        ((exp > 0) ? prefixes[exp - 1] + 'B' : 'Bytes');
      };
  });
})();

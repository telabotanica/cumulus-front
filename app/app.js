(function() {
  'use strict';

  // Declare app level module which depends on views, and components
  angular.module('cumulus', ['ngFileUpload', 'ngContextMenu'])

  .factory('BreadcrumbsService', function() {
    var crumbs = [];
    return {
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
  })

  .controller('BreadcrumbsController', ['$scope', 'BreadcrumbsService',
    function($scope, BreadcrumbsService) {
      var vm = this;

      vm.refresh = function() {
        vm.crumbs = [];
        vm.crumbs.push({
          'name': 'Root',
          'path': ''
        });
        var path = BreadcrumbsService.getCurrentPathCrumbs();
        if (path.length > 0) {
          for (var i=1; i<path.length; i++) {
            vm.crumbs.push({
              'name': path[i],
              'path': path.slice(0, i+1).join('/')
            });
          }
        }
      };

      vm.refresh();

      $scope.$on('refreshBreadcrumbs', function() {
        vm.refresh();
      });
    }
  ])

  .directive('filemenu', function() {
    // Runs during compile
    return {
      restrict: 'E',
      templateUrl: 'file-menu.html'
    };
  })

  .directive('breadcrumbs', ['BreadcrumbsService',
    function(BreadcrumbsService) {
      var CrumbsController = function($rootScope) {
        var vm = this;

        vm.openFolder = function(folderPath) {
          $rootScope.$broadcast('openFolder', folderPath);
        }
      };
      // Runs during compile
      return {
        controller: CrumbsController,
        controllerAs: 'crumbsCtrl',
        restrict: 'E',
        scope: {
          crumbs: '=crumbs'
        },
        templateUrl: 'breadcrumb.html'
      };
    }
  ])

  .controller('addFilesCtrl', ['$scope', '$rootScope', 'Upload', '$timeout', 'BreadcrumbsService',
    function($scope, $rootScope, Upload, $timeout, BreadcrumbsService) {
      $scope.$watch('files', function() {
        $scope.upload($scope.files);
      });

      $scope.upload = function(files) {
        if (files && files.length) {
          var crumbsArray = BreadcrumbsService.getCurrentPathCrumbs(),
            currentPath,
            baseUrl;

          currentPath = crumbsArray.slice(1, crumbsArray.length).join('/');
          baseUrl = 'http://files.cumulus.dev/' + currentPath;

          console.log(baseUrl);

          for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (!file.$error) {
              Upload.upload({
                url: baseUrl + '/' + file.name,
                method: 'POST',
                data: {
                  file: file
                }
              }).progress(function(evt) {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                $scope.log = 'progress: ' + progressPercentage + '% ' +
                            evt.config.data.file.name + '\n' + $scope.log;
              }).success(function(data, status, headers, config) {
                $rootScope.$broadcast('openFolder', '/' + currentPath);
                $timeout(function() {
                    $scope.log = 'file: ' + config.data.file.name + ', Response: ' + JSON.stringify(data) + '\n' + $scope.log;
                });
              });
            }
          }
        }
      };
    }
  ])

  .controller('FilesListController', ['$http', 'BreadcrumbsService', '$scope',
    function($http, BreadcrumbsService, $scope) {
      var vm = this;

      vm.currentPathArray = [];
      vm.currentPath = '';

      vm.openFolder = openFolder;
      vm.backFolder = backFolder;
      vm.openAbsoluteFolder = openAbsoluteFolder;

      function openFolder(targetFolder, absolute) {
        vm.currentPath = absolute ? targetFolder : vm.currentPath += '/' + targetFolder;
        if (!absolute) {
          vm.currentPathArray.push(targetFolder);
          BreadcrumbsService.addCrumb(targetFolder);
        } else {
          vm.currentPathArray = targetFolder.split('/');
          BreadcrumbsService.setCurrentPathCrumbs(angular.copy(vm.currentPathArray));
        }

        $scope.$broadcast('refreshBreadcrumbs');

        $http.get('http://files.cumulus.dev/by-path' + vm.currentPath).success(function(data) {
          vm.files = data.results;
        });

        $http.get('http://files.cumulus.dev/get-folders' + vm.currentPath).success(function(folders) {
          var searchAndDestroy = function(folders) {
            var cleanFolders = [];
            for (var index in folders) {
              var folder = folders[index];
                if (folder['folder'] !== '/' && folder['name'] !== '') {

                  cleanFolders.push(folder);
                }
            }
            return cleanFolders;
          }
          vm.folders = searchAndDestroy(folders);
        });
      };

      function backFolder() {
        var regexpt = /.*(\/\w+)$/;
        var result = regexpt.exec(vm.currentPath)
        if (result) {
          var previousFolder = vm.currentPath.replace(result[1], '');
          vm.openAbsoluteFolder(previousFolder, true);
        }
      }

      function openAbsoluteFolder(targetFolder) {
        vm.openFolder(targetFolder, true);
      }

      $scope.$on('openFolder', function(event, path) {
        vm.openAbsoluteFolder(path, true);
      });

      vm.openAbsoluteFolder(vm.currentPath, true);
    }
  ])

  .filter('formatByte', function() {
    return function(size, useBinary) {
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

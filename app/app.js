(function() {
  'use strict';

  angular.module('cumulus', [
    /* Shared modules */
    'cumulus.files',
    /* 3rd-party modules */
    'ngFileUpload',
    'ngContextMenu',
    'angularMoment'
  ])

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

  .controller('BreadcrumbsController', ['$rootScope', 'BreadcrumbsService',
    function($rootScope, BreadcrumbsService) {
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

      $rootScope.$on('refreshBreadcrumbs', function() {
        vm.refresh();
      });
    }
  ])

  .directive('filesearch', function() {
    var FileSearchController = function($rootScope, $scope) {
      var vm = this;

      $scope.$watch('isSearchOpen', function(newValue, oldValue) {
        if (newValue === false && oldValue === true) {
          $rootScope.$broadcast('searchClosed');
          $rootScope.nbSearchResults = 0;
        }
      });

      vm.search = function(query) {
        $rootScope.$broadcast('fileSearch', query);
      };
    };

    return {
      restrict: 'E',
      controller: FileSearchController,
      controllerAs: 'fileSearchCtrl',
      scope: {
        isSearchOpen: '=isSearchOpen'
      },
      templateUrl: 'file-search.html'
    };
  })

  .controller('FileContextMenuController', ['$rootScope', 'FilesListService' , function($rootScope, FilesListService) {
    var vm = this;

    vm.deleteFile = function(file) {
      FilesListService.deleteFile(file, function(path) {
        $rootScope.$broadcast('openAbsoluteFolder', path);
      });
    };
  }])

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
      templateUrl: 'breadcrumb.html'
    };
  })

  .controller('AddFilesController', ['$scope', '$rootScope', 'Upload', '$timeout', 'BreadcrumbsService',
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
                $rootScope.$broadcast('openAbsoluteFolder', '/' + currentPath);
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

  .controller('FilesListController', ['$http', 'BreadcrumbsService', '$rootScope', 'FilesListService',
    function($http, BreadcrumbsService, $rootScope, FilesListService) {
      var vm = this;

      vm.currentPathArray = [];
      vm.currentPath = '';

      vm.openFolder = openFolder;
      // vm.backFolder = backFolder;
      vm.openAbsoluteFolder = openAbsoluteFolder;
      vm.fileIcon = fileIcon;

      function openFolder(targetFolder, absolute) {
        vm.currentPath = absolute ? targetFolder : vm.currentPath += '/' + targetFolder;
        if (!absolute) {
          vm.currentPathArray.push(targetFolder);
          BreadcrumbsService.addCrumb(targetFolder);
        } else {
          vm.currentPathArray = targetFolder.split('/');
          BreadcrumbsService.setCurrentPathCrumbs(angular.copy(vm.currentPathArray));
        }

        $rootScope.$broadcast('refreshBreadcrumbs');

        // $http.get('http://files.cumulus.dev/by-path' + vm.currentPath).success(function(data) {
        //   vm.files = data.results;
        // });

        // $http.get('http://files.cumulus.dev/get-folders' + vm.currentPath).success(function(folders) {
        //   var searchAndDestroy = function(folders) {
        //     var cleanFolders = [];
        //     for (var index in folders) {
        //       var folder = folders[index];
        //         if (folder['folder'] !== '/' && folder['name'] !== '') {

        //           cleanFolders.push(folder);
        //         }
        //     }
        //     return cleanFolders;
        //   };
        //   vm.folders = searchAndDestroy(folders);
        // });

        vm.filesList = FilesListService.getByPath(vm.currentPath);
      };

      // function backFolder() {
      //   var regexpt = /.*(\/\w+)$/;
      //   var result = regexpt.exec(vm.currentPath);
      //   if (result) {
      //     var previousFolder = vm.currentPath.replace(result[1], '');
      //     vm.openAbsoluteFolder(previousFolder);
      //   }
      // }

      function openAbsoluteFolder(targetFolder) {
        vm.openFolder(targetFolder, true);
      }

      function fileIcon(mimetype) {
        var mediatype = mimetype.split('/');
        switch (mediatype[0]) {
          case 'image':
            return 'glyphicon glyphicon-picture';
          case 'audio':
            return 'glyphicon glyphicon-headphones';
          case 'video':
            return ' glyphicon glyphicon-facetime-video';
          case 'text':
            return 'glyphicon glyphicon-list-alt';
          default:
            return 'glyphicon glyphicon-file';
        }
      }

      $rootScope.$on('fileSearch', function(event, query) {
        FilesListService.fileSearch(query, function(data) {
          vm.filesList = data;

          $rootScope.nbSearchResults = data.files.length;
        });
      });

      $rootScope.$on('openAbsoluteFolder', function(event, path) {
        vm.openAbsoluteFolder(path);
      });

      $rootScope.$on('searchClosed', function(event) {
        vm.filesList = FilesListService.getList();
        $rootScope.$broadcast('refreshBreadcrumbs');
      });

      vm.openAbsoluteFolder(vm.currentPath);
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

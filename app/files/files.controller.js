(function() {
  'use strict';

  angular.module('cumulus.files', [])

  .controller('FilesListController', ['$http', 'breadcrumbsService', '$rootScope', 'FilesListService',
    function($http, breadcrumbsService, $rootScope, FilesListService) {
      var vm = this;

      vm.currentPathArray = [];
      vm.currentPath = '';

      vm.openFolder = openFolder;
      // vm.backFolder = backFolder;
      vm.openAbsoluteFolder = openAbsoluteFolder;
      vm.fileIcon = fileIcon;
      vm.filesList = [];
      vm.searchResultsFilesList = [];

      function openFolder(targetFolder, absolute) {
        vm.currentPath = absolute ? targetFolder : vm.currentPath += '/' + targetFolder;
        if (!absolute) {
          vm.currentPathArray.push(targetFolder);
          breadcrumbsService.addCrumb(targetFolder);
        } else {
          vm.currentPathArray = targetFolder.split('/');
          breadcrumbsService.setCurrentPathCrumbs(angular.copy(vm.currentPathArray));
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
          vm.searchResultsFilesList = data;

          $rootScope.nbSearchResults = data.files.length;
        });
      });

      $rootScope.$on('openAbsoluteFolder', function(event, path) {
        vm.openAbsoluteFolder(path);
      });

      $rootScope.$on('searchClosed', function(event) {
        console.log("closed");
        vm.filesList = FilesListService.getList();
        vm.searchResultsFilesList = [];
        $rootScope.$broadcast('refreshBreadcrumbs');
      });

      vm.openAbsoluteFolder(vm.currentPath);
    }
  ])
})();

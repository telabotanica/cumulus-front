(function() {
  'use strict';

  angular.module('cumulus.files', [])

  .controller('FilesListController', ['$http', 'breadcrumbsService', '$scope', '$rootScope', 'FilesListService', 'config', 'configService',
    function($http, breadcrumbsService, $scope, $rootScope, FilesListService, config, configService) {
      var vm = this;

      vm.currentPathArray = [];
      vm.currentPath = configService.get('projectFilesRootPath');
      vm.currentPathAbstraction = vm.currentPath.length;
      angular.forEach(vm.currentPath.split('/'), function(crumb) {
        vm.currentPathArray.push(crumb);
      });

      vm.filesList = [];
      vm.searchResultsFilesList = [];

      vm.showDetails = showDetails;
      vm.fileIcon = fileIcon;
      vm.openFolder = openFolder;
      vm.openAbsoluteFolder = openAbsoluteFolder;

      vm.downloadUrl = config.filesServiceUrl + vm.currentPath + '/';
      vm.contextMenuPrefix = configService.get('ressourcesPath');

      $scope.sortFiles = sortFiles;

      function showDetails(file) {
        $rootScope.$broadcast('showFileDetails', file);
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
      };

      function openFolder(targetFolder, absolute) {
        vm.currentPath = absolute ? targetFolder : vm.currentPath += '/' + targetFolder;
        // @todo: checker qu'on ouvre rien sous la racine parametrée
        if (!absolute) {
          vm.currentPathArray.push(targetFolder);
          breadcrumbsService.addCrumb(targetFolder);
        } else {
          vm.currentPathArray = targetFolder.split('/');
          breadcrumbsService.setCurrentPathCrumbs(angular.copy(vm.currentPathArray));
        }

        $rootScope.$broadcast('refreshBreadcrumbs');

        vm.filesList = FilesListService.getByPath(vm.currentPath);
          console.log(vm.filesList);

        if (vm.filesList.folders.length === 0 || vm.filesList.files.length === 0) {
          $rootScope.$broadcast('openFolder', '/');
        }
      }

      function openAbsoluteFolder(targetFolder) {
        vm.openFolder(targetFolder, true);
      }

      function sortFiles(column, type, direction) {
        vm.filesList = FilesListService.sortFiles(column, type, direction);
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
        vm.filesList = FilesListService.getList();
        vm.searchResultsFilesList = [];
        $rootScope.$broadcast('refreshBreadcrumbs');
      });

      vm.openAbsoluteFolder(vm.currentPath);
    }
  ])
})();

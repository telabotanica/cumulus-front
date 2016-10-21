(function() {
  'use strict';

  angular.module('cumulus.files', [])

  .controller('FilesListController', ['$http', 'breadcrumbsService', '$scope', '$rootScope', 'FilesListService', 'config', 'authService', 'ModalService',
    function($http, breadcrumbsService, $scope, $rootScope, FilesListService, config, authService, ModalService) {
      var vm = this;

      vm.currentPathArray = [];
      vm.currentPath = config.abstractionPath;
      angular.forEach(vm.currentPath.split('/'), function(crumb) {
        vm.currentPathArray.push(crumb);
      });

      vm.filesList = [];
      vm.searchResultsFilesList = [];

      // search indicator
      vm.isSearching = false;

      vm.showDetails = showDetails;
      vm.fileIcon = fileIcon;
      vm.openFolder = openFolder;
      vm.openAbsoluteFolder = openAbsoluteFolder;

      vm.downloadUrl = function() {
        return config.filesServiceUrl + vm.currentPath + '/';
      }
      vm.contextMenuPrefix = config.ressourcesPath;

      $scope.sortFiles = sortFiles;

      // // trying to recognize user
      // if (!authService.isAuthenticated()) {
      //   authService.retrieveToken().then(function(response) {
      //     authService.setCredentials(response.data);
      //   }, function(data) {
      //     console.log('error', data);
      //   });
      // }

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

        vm.filesList = FilesListService.getList();
        FilesListService.getByPath(vm.currentPath).error(function(data) {
          // If target folder is empty we go back to root
          if (targetFolder !== config.abstractionPath) {
            $rootScope.$broadcast('openAbsoluteFolder', config.abstractionPath);
          }
        });
      }

      function openAbsoluteFolder(targetFolder) {
        vm.openFolder(targetFolder, true);
      }

      function sortFiles(column, type, direction) {
        vm.filesList = FilesListService.sortFiles(column, type, direction);
      }

      $rootScope.$on('fileSearch', function(event, query) {
        vm.isSearching = true;
        FilesListService.fileSearch(query, function(data) {
          vm.searchResultsFilesList = data;
          $rootScope.nbSearchResults = data.files.length;
          vm.isSearching = false;
        }, function(error) {
          vm.isSearching = false;
        });
      });

      $rootScope.$on('openAbsoluteFolder', function(event, path) {
        vm.openAbsoluteFolder(path);
      });

      $rootScope.$on('searchClosed', function() {
        vm.filesList = FilesListService.getList();
        vm.searchResultsFilesList = [];
        $rootScope.$broadcast('refreshBreadcrumbs');
      });

      $rootScope.$on('uploadEvent:start', function() {
        ModalService.showModal({
          templateUrl: config.ressourcesPath + 'modal/upload-status.html',
          controller: function($scope, $rootScope, close) {
            var vm = this;

            vm.text = 'Uploading...';

            var unsubscribeProgressEvent = $rootScope.$on('uploadEvent:progress', function(event, text) {
              console.log('text:', text);
              vm.text = text;

              unsubscribeProgressEvent();
            });

            var unsubscribeSuccessEvent = $rootScope.$on('uploadEvent:success', function(event, folder) {
              console.log('hastoclose');
              vm.close();

              $rootScope.$broadcast('openAbsoluteFolder', folder);
              unsubscribeSuccessEvent();
            });

            vm.close = function(result) {
              close(result, 200);
            };
          },
          controllerAs: 'uploadModalCtrl',
          inputs: {
            $rootScope: $rootScope
          },
          appendElement: angular.element(document.getElementById('modal'))
        }).then(function(modal) {
          modal.element.modal();

          modal.close.then(function(userResponse) {
            console.log('userResponse', userResponse);
            if ('abort' == userResponse) {
              // emit abort signal
              $rootScope.$broadcast('uploadEvent:abort');
            }

            // @todo do that at the right place and angular way
            $('#dropzone').removeClass('dragover');
            $('#dropzone-modal').addClass('hide');
            $('#dropzone-new-folder').addClass('hide');
          });
        });
      });

      vm.openAbsoluteFolder(vm.currentPath);
    }
  ])
})();

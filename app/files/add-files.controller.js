(function() {
  'use strict';

  angular.module('cumulus.files')

  .controller('AddFilesController', ['$scope', '$rootScope', 'Upload', '$document', '$timeout', 'breadcrumbsService', 'ngToast', 'FilesListService', 'ModalService', 'configService',
    function($scope, $rootScope, Upload, $document, $timeout, breadcrumbsService, ngToast, FilesListService, ModalService, configService) {
      var vm = this;

      vm.globalDragover = false;
      vm.newFolderDragover = false;

      $scope.$watch('files', function() {
        console.log(vm.dropInNewFolder ? 'uploadNewFolder' : 'upload');

        if (vm.dropInNewFolder) {
          ModalService.showModal({
            templateUrl: configService.get('ressourcesPath') + 'modal/create-folder.html',
            controller: function($scope, files, close) {
              var vm = this;

              vm.folderName = 'Untitled folder';

              vm.close = function(result) {
                close(result, 200);
              };
            },
            controllerAs: 'newFolderModalCtrl',
            inputs: {
              files: $scope.files
            },
            appendElement: angular.element(document.getElementById('modal'))
          }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(userResponse) {
              // @todo: checker le nom du dossier
              // if (isValidFolderName(userResponse)) {} ...

              if (userResponse) {
                FilesListService.uploadFilesInFolder(userResponse, $scope.files, function() {
                  var crumbsArray = breadcrumbsService.getCurrentPathCrumbs(),
                    currentPath;

                  currentPath = crumbsArray.slice(1, crumbsArray.length).join('/');
                  $rootScope.$broadcast('openAbsoluteFolder', '/' + currentPath);
                  ngToast.create('File(s) uploaded in ' + userResponse);
                });
              }

              modal.element.modal('hide');

              $('#dropzone').removeClass('dragover');
              $('#dropzone-modal').addClass('hide');
              $('#dropzone-new-folder').addClass('hide');
            });
          });
        } else {
          FilesListService.uploadFiles($scope.files, function() {
            var crumbsArray = breadcrumbsService.getCurrentPathCrumbs(),
              currentPath;

            currentPath = crumbsArray.slice(1, crumbsArray.length).join('/');
            $rootScope.$broadcast('openAbsoluteFolder', '/' + currentPath);
            ngToast.create('File(s) uploaded');
            $('#dropzone').removeClass('dragover');
            $('#dropzone-modal').addClass('hide');
            $('#dropzone-new-folder').addClass('hide');
          });
        }
      });

      vm.handleDragEvent = function(dragEvent) {
        var dropTarget = dragEvent.target.parentElement.classList;

        switch (dropTarget[0]) {
          case 'new-folder-element':
            console.log('target: newFolder');
            vm.dropTarget = 'newFolder';
            break;
          case 'folder-element':
            // vm.dropTarget = dragEvent.target...
            // break;
          case 'file-element':
            console.log('target: currentFolder');
            vm.dropTarget = 'currentFolder';
            break;
          default:
            console.log('pouetlol gtrgtgtrdgfvjhdfi');
            vm.dropTarget = '';
            break;
        }
      };

      vm.drag = function(isDragging, dragClass, dragEvent) {
        vm.handleDragEvent(dragEvent);

        console.log('vm.dropTarget:', vm.dropTarget);
      };

      vm.resetDropContext = function(event) {
        console.log(event);
      }

      // vm.dragNewFolder = function(isDragging, dragClass, dragEvent) {
      //   console.log('dragNewFolder', isDragging);
      //   if (isDragging) {
      //     $('#dropzone').removeClass('dragover');
      //     $('#lolilol').hide();
      //     vm.dropInNewFolder = true;
      //     console.log('dropInNewFolder?', vm.dropInNewFolder);
      //   } else {
      //     $('#dropzone').addClass('dragover');
      //     $('#lolilol').show();
      //     vm.dropInNewFolder = false;
      //     console.log('dropInNewFolder?', vm.dropInNewFolder);
      //   }
      // };
    }
  ])
})();

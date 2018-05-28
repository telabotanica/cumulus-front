(function() {
  'use strict';

  angular.module('cumulus.files')

  .controller('AddFilesController', ['$scope', '$rootScope', 'Upload', '$document', '$timeout', 'breadcrumbsService', 'ngToast', 'FilesListService', 'ModalService', 'config',
    function($scope, $rootScope, Upload, $document, $timeout, breadcrumbsService, ngToast, FilesListService, ModalService, config) {
      var vm = this;

      $scope.$watch('files', function() {
        console.log(vm.dropInNewFolder ? 'uploadNewFolder' : 'upload');

        if (vm.dropInNewFolder) {
          ModalService.showModal({
            templateUrl: config.ressourcesPath + 'modal/create-folder.html',
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

              angular.element(document.getElementById('#dropzone')).removeClass('dragover');
              angular.element(document.getElementById('#dropzone-modal')).addClass('hide');
              angular.element(document.getElementById('#dropzone-new-folder')).addClass('hide');
            });
          });
        } else {
          FilesListService.uploadFiles($scope.files, function() {
            var crumbsArray = breadcrumbsService.getCurrentPathCrumbs(),
              currentPath;

            currentPath = crumbsArray.slice(1, crumbsArray.length).join('/');
            $rootScope.$broadcast('openAbsoluteFolder', '/' + currentPath);
            ngToast.create('Fichiers uploadés');
            var modalBackdrops = document.getElementsByClassName('modal-backdrop');
            Array.prototype.forEach.call(modalBackdrops, function(modalBackdrop) {
                modalBackdrop.parentNode.removeChild(modalBackdrop);
    
            });
            document.getElementById('dropzone').classList.remove("dragover");
            document.getElementById('dropzone-new-folder').classList.add("hide");
          });
        }
      });

      vm.handleDragEvent = function(dragEvent) {
        var dropTarget = dragEvent.target.parentElement.classList;

        switch (dropTarget[0]) {
          case 'new-folder-element':
            //console.log('target: newFolder');
            vm.dropTarget = 'newFolder';
            break;
          case 'folder-element':
            // vm.dropTarget = dragEvent.target...
            // break;
          case 'file-element':
            //console.log('target: currentFolder');
            vm.dropTarget = 'currentFolder';
            break;
          default:
            //console.log('pouetlol gtrgtgtrdgfvjhdfi');
            vm.dropTarget = '';
            break;
        }
      };

      vm.drag = function(isDragging, dragClass, dragEvent) {
        vm.handleDragEvent(dragEvent);

        //console.log('vm.dropTarget:', vm.dropTarget);
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

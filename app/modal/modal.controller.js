(function() {
  'use strict';

  angular.module('cumulus.modal', [])

  .controller('ContextMenuController', ['$rootScope', 'FilesListService', 'ModalService', 'ngToast',
    function($rootScope, FilesListService, ModalService, ngToast) {
      var vm = this;

      vm.deleteFileDialog = deleteFileDialog;
      vm.renameFileDialog = renameFileDialog;

      var ModalController = function($scope, subject, attachment, close) {
        var vm = this;

        switch (subject) {
          case 'delete-file':
            vm.file = attachment;
            break;
          case 'rename-file':
            vm.file = attachment;
            vm.newFileName = vm.file.name;
            break;
          case 'delete-folder':
            vm.folder = attachment;
            break;
          case 'create-folder':
          case 'rename-folder':
            vm.folder = attachment;
            vm.newFolderName = vm.folder.name;
            break;
          default:
            alert('param error, soz');
            break;
        }

        vm.subject = subject;
        vm.isModalOpened = true;

        vm.close = function(result) {
          close(result, 200);
          vm.isModalOpened = false;
        };
      };

      function openModal(subject, attachment, callback) {
        ModalService.showModal({
          templateUrl: 'modal/' + subject + '.html',
          controller: ModalController,
          controllerAs: 'modalCtrl',
          inputs: {
            subject: subject,
            attachment: attachment
          },
          appendElement: angular.element(document.getElementById('modal'))
        }).then(function(modal) {
          modal.element.modal();
          modal.close.then(function(userResponse) {
            console.log(userResponse);
            callback(userResponse);
          });
        });
      }

      function uploadInNewFolderDialog(files) {
        openModal('create-folder', files, function(newFolderName) {
          if (newFolderName && newFolderName.trim() !== '') {
            FilesListService.uploadFiles(newFolderName, function(path) {
              ngToast.create('Folder created');
              $rootScope.$broadcast('openAbsoluteFolder', path);
            });
          }
        });
      }

      function deleteFileDialog(file) {
        openModal('delete-file', file, function(deletionConfirmed) {
          if (deletionConfirmed) {
            FilesListService.deleteFile(file, function(path) {
              ngToast.create('File deleted');
              $rootScope.$broadcast('openAbsoluteFolder', path);
            });
          }
        });
      }

      function renameFileDialog(file) {
        openModal('rename-file', file, function(newFileName) {
          if (newFileName && newFileName.trim() !== '') {
            FilesListService.renameFile(file, newFileName, function(path) {
              ngToast.create('File renamed');
              $rootScope.$broadcast('openAbsoluteFolder', path);
            });
          }
        });
      }
    }
  ])
})();

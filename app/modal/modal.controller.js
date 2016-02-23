(function() {
  'use strict';

  angular.module('cumulus.modal', [])

  .controller('ContextMenuController', ['$rootScope', 'FilesListService', 'ModalService', 'ngToast',
    function($rootScope, FilesListService, ModalService, ngToast) {
      var vm = this;

      vm.deleteFileDialog = deleteFileDialog;
      vm.renameFileDialog = renameFileDialog;

      var ModalController = function($scope, file, subject, close) {
        var vm = this;

        vm.file = file;
        vm.subject = subject;
        vm.newFileName = file.name;
        vm.isModalOpened = true;

        vm.close = function(result) {
          close(result, 200);
          vm.isModalOpened = false;
        }
      };

      function openFileModal(file, subject, callback) {
        ModalService.showModal({
          templateUrl: 'modal/' + subject + '-file.html',
          controller: ModalController,
          controllerAs: 'modalCtrl',
          inputs: {
            file: file,
            subject: subject
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

      function deleteFileDialog(file) {
        openFileModal(file, 'delete', function(deletionConfirmed) {
          if (deletionConfirmed) {
            FilesListService.deleteFile(file, function(path) {
              ngToast.create('File deleted');
              $rootScope.$broadcast('openAbsoluteFolder', path);
            });
          }
        });
      }

      function renameFileDialog(file) {
        openFileModal(file, 'rename', function(newFileName) {
          if (newFileName && newFileName.trim() !== '') {
            FilesListService.renameFile(file, newFileName, function(path) {
              ngToast.create({
                content: 'File renamed',
                horizontalPosition: 'center'
              });
              $rootScope.$broadcast('openAbsoluteFolder', path);
            });
          }
        });
      }
    }
  ])
})();

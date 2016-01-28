(function() {
  'use strict';

  angular.module('cumulus.modal', [])

  .controller('FileContextMenuController', ['$rootScope', 'FilesListService', 'ModalService',
    function($rootScope, FilesListService, ModalService) {
      var vm = this;

      var ModalController = function($scope, file, subject, close) {
        var vm = this;

        vm.file = file;
        vm.subject = subject;
        $scope.newFileName = file.name;

        vm.close = function(result) {
          close(result, 200);
        }
      };

      var openFileModal = function(file, subject, callback) {
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
            callback(userResponse);
          });
        });
      };

      vm.deleteFileDialog = function(file) {
        openFileModal(file, 'delete', function(deletionConfirmed) {
          if (deletionConfirmed) {
            FilesListService.deleteFile(file, function(path) {
              $rootScope.$broadcast('openAbsoluteFolder', path);
            });
          }
        });
      };

      vm.renameFileDialog = function(file) {
        openFileModal(file, 'rename', function(newFileName) {
          if (newFileName.trim() !== '') {
            FilesListService.renameFile(file, newFileName, function(path) {
              $rootScope.$broadcast('openAbsoluteFolder', path);
            });
          }
        });
      };
    }
  ])
})();

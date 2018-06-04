(function() {
  'use strict';

  angular.module('cumulus.details', [])

  .directive('detailsPane', ['config', 'FilesListService', function(config) {
    var DetailsPaneController = function($rootScope, FilesListService) {
      var vm = this;

      // The currently selected/displayed file has been deleted, we need to
      // update the detail pane to show the 'merci de sélectionner un fichier'
      // message instead of the deleted file details.
      $rootScope.$on('fileDeleted', function(events, args){
        vm.details = {};
      });

      //@todo : put these in conf!
      vm.licences = [
        {value: 1, text: 'CC-BY-SA'},
        {value: 2, text: 'Copyright'}
      ];
      vm.permissionList = [
        {value: 1, text: 'r'},
        {value: 2, text: 'w'},
        {value: 3, text: 'wr'}
      ];

      vm.handlePartialUpdateEvent = function(fkey, propertyName, propertyValue) {
        FilesListService.partialUpdate(fkey, propertyName, propertyValue);
      };

      $rootScope.$on('showFileDetails', function(event, details) {
        vm.details = details;
      });

    };

    var path = config.ressourcesPath;

    return {
      restrict: 'E',
      controller: DetailsPaneController,
      controllerAs: 'detailsPaneCtrl',
      templateUrl: path + 'details-pane/details-pane.html'
    }
  }])
})();

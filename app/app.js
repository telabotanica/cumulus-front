(function() {
  'use strict';

  angular.module('cumulus', [
    /* Shared modules */
    'cumulus.files',
    'cumulus.breadcrumbs',
    'cumulus.search',
    'cumulus.modal',
    'cumulus.details',
    'utils.autofocus',
    'utils.click',
    'utils.config',
    /* 3rd-party modules */
    'ngFileUpload',
    'ngContextMenu',
    'angularMoment',
    'angularModalService',
    'ngToast'
  ])

  // .directive('ngRightClick', function($parse) {
  //   return function(scope, element, attrs) {
  //     var fn = $parse(attrs.ngRightClick);
  //     element.bind('contextmenu', function(event) {
  //       scope.$apply(function() {
  //           event.preventDefault();
  //           fn(scope, {$event:event});
  //       });
  //     });
  //   };
  // })

  .factory('configService', function(){
    return {
      'getConfig': getConfig
    };

    function getConfig() {
      var config = $.data('config');
      return '';
    }
  })

  .directive('sortHead', ['configService', function(configService) {
    function SortHeadController($rootScope, $scope) {
      var vm = this;

      vm.sortedColumn = 'name';

      vm.sortFiles = function(column, type, direction) {
        $scope.sortingFunction({
          column: column,
          type: type,
          direction: direction
        });

        $rootScope.$broadcast('sortedColumn', column);
      }

      $rootScope.$on('sortedColumn', function(event, column) {
        vm.sortedColumn = column;
      });
    }

    var path = configService.getConfig();

    return {
      restrict: 'E',
      templateUrl: path + 'files/sort-head.html',
      controller: SortHeadController,
      controllerAs: 'sortCtrl',
      scope: {
        displayedName: '=',
        column: '=',
        type: '=',
        direction: '=',
        sortingFunction: '&'
      }
    };
  }])

  .directive('sortChevron', function() {
    return {
      restrict: 'E',
      require: 'sortHead'
    };
  })

  .config(['ngToastProvider', function(ngToast) {
    ngToast.configure({
      horizontalPosition: 'center',
      maxNumber: 3
    });
  }])

  .filter('mimetypeIcon', function() {
    return function(mimetype) {
      if (mimetype) {
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
          case 'folder':
            return 'glyphicon glyphicon-folder-open';
          default:
            return 'glyphicon glyphicon-file';
        }
      }
    };
  })

  .filter('folderPath', function() {
    return function(path) {
      var re = /.*\/(.*)\/\w+/;
      var result = re.exec(path);
      // console.log(result); // clueless debug stuf, yuno, to demonstrate filters multiple evaluations
      return result ? result[1] : 'Root';
    }
  })

  .directive('separator', function() {
    return {
      restrict: 'E',
      template: '<div class="separator-container"><div class="separator"></div></div>'
    };
  })

  .filter('formatByte', function() {
    return function(size, useBinary) {
      var base, prefixes, exp;

      if (useBinary) {
        base = 1024;
        prefixes = ['Ko','Mo','Go','To','Po','Eo','Zo','Yo'];
      } else {
        base = 1000;
        prefixes = ['k','M','G','T','P','E','Z','Y'];
      }

      exp = Math.log(size) / Math.log(base) | 0;
      return (size / Math.pow(base, exp)).toFixed(1) + ' ' +
        ((exp > 0) ? prefixes[exp - 1] + 'B' : 'Bytes');
      };
  });
})();

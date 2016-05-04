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

  .directive('filePath', ['configService', function(configService) {
    function FilePathController($scope) {
      var displayedPath =$scope.path.replace(configService.getAbstractionPath(), '');
      if ('' === displayedPath) {
        displayedPath = '/';
      }

      this.path = displayedPath;
    }

    return {
      restrict: 'E',
      controller: FilePathController,
      controllerAs: 'filePathCtrl',
      template: '{{ filePathCtrl.path }}',
      scope: {
        path: '@'
      }
    }
  }])

  .factory('configService', function() {
    var vm = this;

    vm.config = [];
    if ('undefined' !== typeof tarace) {
      vm.config = tarace;
    }

    return {
      get: get,
      getConfig: getConfig,
      setConfig: setConfig,
      getAbstractionPathLength: getAbstractionPathLength,
      getAbstractionPath: getAbstractionPath
    };

    function get(property) { // should be named 'get'
      // en attendant de faire un truc bien genre ça : https://jsfiddle.net/e8tEX/46/
      // var config = angular.element(document.getElementById('truc')).data('config');
      return angular.isDefined(vm.config[property]) ? vm.config[property] : '' ;
    }

    function getConfig() {
      return vm.config ;
    }

    function setConfig(config) {
      vm.config = config;
    }

    // Pas sûr que ça doive rester dans ce service ->
    // Ptetr un service qui encapsule et sert exclusivement les params liés
    // aux abstractions (y'en a pas 100000 mais bon)

    /**
     * Get the files tree abstraction path length.
     *
     * @return     {number}  Abstraction path length.
     */
    function getAbstractionPathLength() {
      if (angular.isDefined(vm.config['projectFilesRootPath'])) {
        return vm.config['projectFilesRootPath'].split('/').filter(function(n) { return n !== '' }).length;
      }

      return 0;
    }

    /**
     * Get the files tree abstraction path.
     *
     * @return     {string}  Abstraction path.
     */
    function getAbstractionPath() {
      if (angular.isDefined(vm.config['projectFilesRootPath'])) {
        return vm.config['projectFilesRootPath'];
      }

      return '';
    }
  })

  // Inutile, se charge trop tard...
  // .directive('config', ['configService', function(configService) {
  //   function ConfigController($attrs) {
  //     console.log($attrs.config);
  //     if (angular.isDefined($attrs.config)) {
  //       configService.setConfig($attrs.config);
  //     }
  //   }

  //   return {
  //     restrict: 'E',
  //     controller: ConfigController
  //   }
  // }])

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

    var path = configService.get('ressourcesPath');

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

  // .directive('sortChevron', function() {
  //   return {
  //     restrict: 'E',
  //     require: 'sortHead'
  //   };
  // })

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

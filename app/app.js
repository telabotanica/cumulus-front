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

  // .directive('addFileButton', ['config', function(config) {
  //   var AddFileButtonController = function(FilesListService, breadcrumbsService, $scope, $rootScope, ngToast) {

  //     $scope.$watch('files', function() {
  //       FilesListService.uploadFiles($scope.files, function() {
  //         var crumbsArray = breadcrumbsService.getCurrentPathCrumbs(),
  //           currentPath;

  //         currentPath = crumbsArray.slice(1, crumbsArray.length).join('/');
  //         $rootScope.$broadcast('openAbsoluteFolder', '/' + currentPath);
  //         ngToast.create('File(s) uploaded');
  //       });
  //     });
  //   };

  //   var path = config.ressourcesPath;

  //   return {
  //     restrict: 'E',
  //     controller: AddFileButtonController,
  //     controllerAs: 'addFileButtonCtrl',
  //     templateUrl: path + 'breadcrumbs/breadcrumbs.html'
  //   }
  // }])

  .directive('fileLicense', ['config', function(config) {
    var FileLicenseController = function($scope) {
      this.license = $scope.license;
    };

    var path = config.ressourcesPath;

    return {
      restrict: 'E',
      controller: FileLicenseController,
      controllerAs: 'licenseCtrl',
      templateUrl: path + 'files/file-license.html',
      scope: {
        license: '@'
      }
    }
  }])

  // .factory('ServiceName', ServiceName);
  // ServiceName.$inject = ['blablabla'];
  // function ServiceName(blablabla) {}

  .factory('authInjector', ['$injector', function($injector) {
    var authInjector = {
      request: function(config) {
        var authService = $injector.get('authService'),
          filesServiceUrl = $injector.get('config').filesServiceUrl;

        if (config.url.substring(0, filesServiceUrl.length) == filesServiceUrl) {
          if (authService.isAuthenticated()) {
            config.headers['Authorization'] = authService.token();
          } else {
            authService.refreshToken().then(function(response) {
              authService.setCredentials(response.data);

              config.headers['Authorization'] = authService.token();
            }); // silent failure, @todo: handle refresh max try
          }
        }

        return config;
      }
    };

    return authInjector;
  }])

  .factory('sessionRecoverer', ['$q', '$injector', function($q, $injector) {
    var sessionRecoverer = {
      responseError: function(response) {
        if (response.status == 400) {
          var deferred = $q.defer();
          var $http = $injector.get('$http');
          var authService = $injector.get('authService');

          // Trying to recover session
          authService.refreshToken().then(function(response) {
            authService.setCredentials(response.data);
          }, function(data) {
            console.log('in sessionRecoverer error', data);
          }).then(deferred.resolve, deferred.reject);

          // If session is retored, we play the previous request again
          return deferred.promise.then(function() {
            return $http(response.config);
          })
        }

        return $q.reject(response);
      }
    }

    return sessionRecoverer;
  }])

  .config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('authInjector', 'sessionRecoverer');
  }])

  .factory('authService', ['$rootScope', '$http', 'config', function($rootScope, $http, config) {
    var vm = this;
    vm.login = '';
    vm.role = 'anonymous';
    vm.isAuthenticated = false;
    vm.token = undefined;
    vm.tokenDuration = 0;
    vm.tokenExpirationTime;

    return {
      login: login,
      logout: logout,
      isAuthorized: isAuthorized,
      refreshToken: refreshToken,
      setCredentials: setCredentials,
      clearCredentials: clearCredentials,
      refreshCredentials: refreshCredentials,
      isAuthenticated: isAuthenticated,
      token: token
    }

    /**
     * Determine if authenticated.
     * If token is expired, try to renew it
     *
     * @return     {boolean}  True if authenticated, False otherwise.
     */
    function isAuthenticated() {
      var now = new Date();
      if (vm.tokenExpirationTime && vm.tokenExpirationTime.getTime() - now.getTime() <= 0) {
        refreshCredentials();
      }

      return vm.isAuthenticated;
    }

    function token() {
      return vm.token;
    }

    /**
     * Try to log in a user
     *
     * @param      {string}  login      The user's login
     * @param      {string}  password   The user's password
     * @return     {promise}  The request promise
     */
    function login(login, password) {
      return $http.get(config.authUrl + '/login' + '?login=' + login + '&password=' + encodeURIComponent(password));
    }

    /**
     * Try to log out a user
     *
     * @return     {promise}  The request promise
     */
    function logout() {
      return $http.get(config.authUrl + '/logout').then(function(response) {
        return response.data;
      });
    }

    /**
     * Determine if current user is authorized for a given role
     *
     * @param      {(Array|string)}  authorizedRoles  The authorized roles
     * @return     {boolean}         True if authorized, False otherwise.
     */
    function isAuthorized(authorizedRoles) {
      if (!angular.isArray(authorizedRoles)) {
        authorizedRoles = [authorizedRoles];
      }

      return (vm.isAuthenticated && authorizedRoles.indexOf(vm.role) !== -1);
    }

    /**
     * Try to retrieve a logged user's token
     *
     * @return     {promise}  The request promise
     */
    function refreshToken() {
      console.log(config.tokenUrl);
      return $http.get(config.tokenUrl, { withCredentials: true });
    }

    function setCredentials(auth) {
      vm.login = auth.token.libele;
      vm.role = 'user';
      vm.isAuthenticated = true;
      vm.token = auth.token;
      vm.tokenDuration = auth.duration;

      // We set an expiration date for the token based on its duration (minus few seconds for network)
      var now = new Date();
      vm.tokenExpirationTime = new Date(now.getTime() + (vm.tokenDuration - 10) * 1000);
    }

    function clearCredentials() {
      vm.login = '';
      vm.role = 'anonymous';
      vm.isAuthenticated = false;
      vm.token = undefined;
      vm.tokenDuration = 0;
      vm.tokenExpirationTime = undefined;
    }

    function refreshCredentials() {
      refreshToken().then(function(response) {
        setCredentials(response.data);
      });
    }

    function parseToken(token) {
      var parts = token.split('.');

      return JSON.parse(atob(parts[1]));
    }
  }])

  .directive('filePath', ['config', function(config) {
    function FilePathController($scope) {
      var displayedPath = $scope.path.replace(config.abstractionPath, '');
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

  // Inutile, se charge trop tard...
  // .directive('config', ['config', function(config) {
  //   function ConfigController($attrs) {
  //     console.log($attrs.config);
  //     if (angular.isDefined($attrs.config)) {
  //       config.setConfig($attrs.config);
  //     }
  //   }

  //   return {
  //     restrict: 'E',
  //     controller: ConfigController
  //   }
  // }])

  .directive('sortHead', ['config', function(config) {
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

    var path = config.ressourcesPath;

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

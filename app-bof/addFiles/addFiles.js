(function() {
  'use strict';

  angular.module('cumulus.addFiles', ['ngRoute', 'ngFileUpload'])

  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/addFiles', {
      templateUrl: 'addFiles/addFiles.html',
      controller: 'addFilesCtrl'
    });
  }])

  .controller('addFilesCtrl', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {
    $scope.$watch('files', function () {
      $scope.upload($scope.files);
    });

    $scope.$watch('file', function () {
      if ($scope.file != null) {
        $scope.files = [$scope.file];
      }
    });

    $scope.upload = function (files) {
      if (files && files.length) {
        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          if (!file.$error) {
            Upload.upload({
              url: 'http://files.cumulus.dev/mon/' + file.name,
              method: 'POST',
              data: {
                file: file
              }
            }).progress(function (evt) {
              var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
              $scope.log = 'progress: ' + progressPercentage + '% ' +
                          evt.config.data.file.name + '\n' + $scope.log;
            }).success(function (data, status, headers, config) {
              $timeout(function() {
                  $scope.log = 'file: ' + config.data.file.name + ', Response: ' + JSON.stringify(data) + '\n' + $scope.log;
              });
            });
          }
        }
      }
    };
  }]);
})();

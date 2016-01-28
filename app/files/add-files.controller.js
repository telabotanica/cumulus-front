(function() {
  'use strict';

  angular.module('cumulus.files')

  .controller('AddFilesController', ['$scope', '$rootScope', 'Upload', '$timeout', 'breadcrumbsService',
    function($scope, $rootScope, Upload, $timeout, breadcrumbsService) {
      $scope.$watch('files', function() {
        $scope.upload($scope.files);
      });

      $scope.upload = function(files) {
        if (files && files.length) {
          var crumbsArray = breadcrumbsService.getCurrentPathCrumbs(),
            currentPath,
            baseUrl;

          currentPath = crumbsArray.slice(1, crumbsArray.length).join('/');
          baseUrl = 'http://files.cumulus.dev/' + currentPath;

          for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (!file.$error) {
              Upload.upload({
                url: baseUrl + '/' + file.name,
                method: 'POST',
                data: {
                  file: file
                }
              }).progress(function(evt) {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                $scope.log = 'progress: ' + progressPercentage + '% ' +
                            evt.config.data.file.name + '\n' + $scope.log;
              }).success(function(data, status, headers, config) {
                $rootScope.$broadcast('openAbsoluteFolder', '/' + currentPath);
                $timeout(function() {
                    $scope.log = 'file: ' + config.data.file.name + ', Response: ' + JSON.stringify(data) + '\n' + $scope.log;
                });
              });
            }
          }
        }
      };
    }
  ])
})();

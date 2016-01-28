(function() {
  'use strict';

  angular.module('cumulus.files')

  .factory('FilesListService', function($http) {
    var vm = this;
    vm.filesList = {
      'files': [],
      'folders': []
    };

    vm.rootUrl = 'http://files.cumulus.dev';

    var service = {
      getList: getList,
      getByPath: getByPath,
      fileSearch: fileSearch,
      searchAdvanced: searchAdvanced,
      filter: filter,
      deleteFile: deleteFile,
      renameFile: renameFile
    };

    return service;

    /**
     * Return current files and folders list
     * @return {Objects}
     */
    function getList() {
      return vm.filesList;
    }

    /**
     * Get files and folders for given path
     * @param  {string} path Project relative path
     * @return {Object}
     */
    function getByPath(path) {
      /* cleaning results, test env purpose */
      var searchAndDestroy = function(folders) {
        var cleanFolders = [];
        for (var index in folders) {
          var folder = folders[index];
            if (folder['folder'] !== '/' && folder['name'] !== '') {
              cleanFolders.push(folder);
            }
        }

        return cleanFolders;
      };

      $http.get(vm.rootUrl + '/by-path' + path)
        .success(function(data) {
          vm.filesList.files = data.results;
        }
      );

      $http.get(vm.rootUrl + '/get-folders' + path)
        .success(function(folders) {
          vm.filesList.folders = searchAndDestroy(folders);
        }
      );

      return vm.filesList;
    }

    /**
     * Search files using files names and keywords
     * @param  {String} query Array of searched terms
     * @return {[type]}
     */
    function fileSearch(query, updateFilesList) {
      if (query.length > 0) {
        $http.get(vm.rootUrl + '/search/' + query)
          .success(function(data) {
            updateFilesList({
              'files': data.results,
              'folders': []
            });
          }
        );
      } else {
        updateFilesList({
          files: [],
          'folders': []
        });
      }
    }

    /**
     * Advanced search, available criterias :
     * - key
     * - path
     * - name
     * - keywords
     * - groups
     * - user
     * - mimetype
     * - license
     * - creation_date
     * - min_creation_date
     * - max_creation_date
     * - last_modif_date
     * - min_last_modif_date
     * - max_last_modif_date
     * @param  {Object} query Search criterias
     * @return {Array}
     */
    function searchAdvanced(query) {
      var filterSearchCriterias = function(criterias) {
        var filteredCriterias = {},
          validCriterias = [
            'key',
            'path',
            'name',
            'keywords',
            'groups',
            'user',
            'mimetype',
            'license',
            'creation_date',
            'min_creation_date',
            'max_creation_date',
            'last_modif_date',
            'min_last_modif_date',
            'max_last_modif_date'
          ]
        ;

        for (var index in criterias) {
          if (criterias.hasOwnProperty(index) && validCriterias.indexOf(index) > -1) {
            filteredCriterias[index] = criterias[index];
          }
        }

        return filteredCriterias;
      };

      var buildSearchQuery = function(criterias) {
        var queryParams = '',
          first = true
        ;

        for (var index in criterias) {
          if (criterias.hasOwnProperty(index)) {
            queryParams += (first ? '?' : '&') + index + '=' + criterias.join(',');
            first = false;
          }
        }

        return queryParams;
      };

      query = _filterSearchCriterias(query);
      $http.get(vm.rootUrl + '/search/' + queryParams)
        .success(function(data) {
          console.log(data);
        }
      );
    }

    /**
     * Apply filters on current filesList, like CreationDateAsc, SizeDesc, ...
     * @param  {Object} filters Applied filters
     * @return {Object}
     */
    function filter(filters) {

    }

    /**
     * Delete a file from the storage
     * @param  {Object} file The file aimed to be deleted
     */
    function deleteFile(file, callback) {
      $http.delete(vm.rootUrl + file.path + '/' + file.fkey)
        .success(function(data) {
          callback(data.path);
        }
      );
    }

    /**
     * Rename a file already stored
     * @param  {Object} file The file aimed to be renamed
     */
    function renameFile(file, newFileName, callback) {
      $http.post(vm.rootUrl + '/' + file.fkey, {
          newname: newFileName
        }).success(function(data) {
          callback(data.path);
        }
      );
    }
  });
})();

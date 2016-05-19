(function() {
  'use strict';

  angular.module('cumulus.files')

  .factory('FilesListService', function(config, $http, Upload, breadcrumbsService, ngToast, configService, authService) {
    var vm = this;

    vm.filesList = {
      'files': [],
      'folders': []
    };

    var service = {
      getList: getList,
      getByPath: getByPath,
      fileSearch: fileSearch,
      searchAdvanced: searchAdvanced,
      sortFiles: sortFiles,
      deleteFile: deleteFile,
      renameFile: renameFile,
      getPathInfo: getPathInfo,
      sortFiles: sortFiles,
      uploadFiles: uploadFiles,
      uploadFilesInFolder: uploadFilesInFolder
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
     * Get user info by user ids
     *
     * @param      {array}   userIds  The user ids
     * @return     {object}  User info indexed by user id
     */
    function _getUserInfo(userIds) {
      userIds = userIds.filter(function(n) { return n != null });

      var userInfo = {};
      return $http.get(config.userInfoByIdUrl + userIds.join(',')).then(function(response) {
        // service response format is not consistent
        // has to index info if only one id is asked
        if (userIds.length == 1) {
          userInfo[response.data.id] = response.data;
        } else {
          userInfo = response.data;
        }

        return userInfo;
      });
    }

    /**
     * Replace files owner user id by user label
     *
     * @param      {Object}  files   The files
     * @return     {promise}
     */
    function _addFilesOwnerInfo(files) {
      var owners = [],
        ownersInfo = {};

      // collect owners id
      angular.forEach(files, function(file) {
        if (owners.indexOf(file.owner) == -1) {
          owners.push(file.owner);
        }
      });

      return _getUserInfo(owners).then(function(info) {
        files.map(function(file) {
          if (info.hasOwnProperty(file.owner)) {
            var ownerInfo = info[file.owner];

            if ('' != ownerInfo.intitule) {
              file.owner = ownerInfo.intitule;
            }
          }

        });

        return files;
      });
    }

    /**
     * Get files and folders for given path
     * @param  {string} path Project relative path
     * @return {Object}
     */
    function getByPath(path, callback) {
      /* cleaning results, test/root env purpose */
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

      $http.get(config.filesServiceUrl + path)
        .success(function(data) {
          _addFilesOwnerInfo(data.files.results).then(function(files) {
            vm.filesList.files = files;
          });
          vm.filesList.folders = data.folders.results;
        })
        .error(function() {
          vm.filesList.files = [];
          vm.filesList.folders = [];
        })
      ;

      // $http.get(config.filesServiceUrl + '/api/get-folders' + path)
      //   .success(function(folders) {
      //     vm.filesList.folders = searchAndDestroy(folders);
      //   })
      // ;

      return vm.filesList;
    }

    function getPathInfo(path) {
      var info = {
        files: 0,
        folders: 0
      };

      $http.get(config.filesServiceUrl + path)
        .success(function(data) {
          info.files = data.results.length;
        }
      );

      $http.get(config.filesServiceUrl + '/api/get-folders' + path)
        .success(function(folders) {
          info.folders = folders.length;
        }
      );

      return info;
    }

    /**
     * Search files using files names and keywords
     * @param  {String} query Array of searched terms
     * @return {[type]}
     */
    function fileSearch(query, updateFilesList) {
      if (query.length > 0) {
        var path = configService.getAbstractionPath();
        $http.get(config.filesServiceUrl + '/api/search/?path_recursive=true&path=' + path + '&name=' + query)
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
      $http.get(config.filesServiceUrl + '/api/search/' + queryParams)
        .success(function(data) {
          console.log(data);
        }
      );
    }

    /**
     * Sort current filesList.files
     * Example sorting params :
     *     column: 'name',
     *     type: 'text',
     *     direction: 'asc'
     *
     *  types : number, text, data
     *  direction: asc, desc
     * @param  {string} column    Sorting column name
     * @param  {string} Type      Sorting column type
     * @param  {string} direction Sorting direction
     */
    function sortFiles(column, type, direction) {
      // @from: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare#Check_browser_support_for_extended_arguments
      function localCompareSupportsLocales() {
        try {
          'foo'.localeCompare('bar', 'i');
        } catch (e) {
          return e.name === 'RangeError';
        }
        return false;
      }

      // @from: https://stackoverflow.com/questions/85815/how-to-tell-if-a-javascript-function-is-defined#85973
      function isFunction(possibleFunction) {
        return typeof(possibleFunction) === typeof(Function);
      }

      // function debugSort(list, sortedColumn) {
      //   console.log('sorted list:', list);
      //   console.log('sorted column name:', sortedColumn);
      //   angular.forEach(list, function(item, key) {
      //     console.log(item[sortedColumn]);
      //   });
      // }

      var filters = {
        column: angular.isDefined(column) ? column : 'name',
        type: angular.isDefined(type) ? type : 'text',
        direction: angular.isDefined(direction) ? direction : 'asc',
      }

      switch (filters.type) {
        case 'number':
          vm.filesList.files.sort(function(a, b) {
            return filters.direction === 'desc'
              ? b[filters.column] - a[filters.column]
              : a[filters.column] - b[filters.column]
            ;
          });
          break;

        case 'date':
          vm.filesList.files.sort(function(a, b) {
            return filters.direction === 'desc'
              ? (new Date(b[filters.column])).getTime() - (new Date(a[filters.column])).getTime()
              : (new Date(a[filters.column])).getTime() - (new Date(b[filters.column])).getTime()
            ;
          });
          break;

        case 'text':
        default:
          if (isFunction(String.prototype.localeCompare)) {
            if (localCompareSupportsLocales()) {
              vm.filesList.files.sort(function(a, b) {
                if (a[filters.column]) {
                  var order = a[filters.column].localeCompare(b[filters.column], ['fr', 'en'], { sensitivity: 'base' });
                  return filters.direction === 'desc' ? -order : order;
                }
              });
            } else {
              vm.filesList.files.sort(function(a, b) {
                if (a[filters.column]) {
                  var order = a[filters.column].localeCompare(b[filters.column]);
                  return filters.direction === 'desc' ? -order : order;
                }
              });
            }
          } else {
            vm.filesList.files.sort(function(a, b) {
              if (a[filters.column].toUpperCase() > b[filters.column].toUpperCase()) return filters.direction === 'desc' ? -1 : 1;
              if (a[filters.column].toUpperCase() < b[filters.column].toUpperCase()) return filters.direction === 'desc' ? 1 : -1;
              // return filters.direction === 'desc' ? 0 : 0;
              return 0;
            });
          }
          break;
      }

      return vm.filesList;
    }

    /**
     * Delete a file from the storage
     * @param  {Object} file The file aimed to be deleted
     */
    function deleteFile(file, callback) {
      $http.delete(config.filesServiceUrl + file.path + '/' + file.fkey)
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
      $http.post(config.filesServiceUrl + '/' + file.fkey, {
          newname: newFileName
        }).success(function(data) {
          callback(data.path);
        }
      );
    }

    function uploadFiles(files, onSuccess, onError) {
      uploadFilesInFolder('', files, onSuccess, onError);
    }

    function uploadFilesInFolder(folderName, files, onSuccess, onError) {
      if (files && files.length) {
        var crumbsArray = breadcrumbsService.getCurrentPathCrumbs(),
          currentPath,
          baseUrl;

        currentPath = crumbsArray.slice(1, crumbsArray.length).join('/');
        baseUrl = config.filesServiceUrl + (currentPath !== '' ? '/' + currentPath : currentPath);

        if (folderName && folderName.length) {
          baseUrl = baseUrl + '/' + folderName;
        }

        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          if (!file.$error) {
            Upload.upload({
              url: baseUrl + '/' + file.name,
              method: 'POST',
              data: {
                file: file,
                license: 'CC-BY-SA',
                permissions: 'wr',
                groups: configService.get('group')
              }
            }).progress(function(evt) {
              var percentCompleted;
              file.uploadStatus = 'Uploading...';

              if (evt.type == 'progress' && evt.lengthComputable) {
                percentCompleted = Math.round(evt.loaded / evt.total * 100);
                if (percentCompleted == 100) {
                    file.uploadStatus = 'Saving...';
                } else {
                    file.uploadStatus = percentCompleted + '%';
                }
              }
            }).success(function(data, status, headers, config) {
              // callback success
            }).then(onSuccess, onError);

            $('#dropzone').removeClass('dragover');
            $('#dropzone-modal').addClass('hide');
            $('#dropzone-new-folder').addClass('hide');
          }
        }
      }
    }
  });
})();

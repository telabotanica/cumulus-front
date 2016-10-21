(function() {
  'use strict';

  angular.module('cumulus.files')

  .factory('FilesListService', function($rootScope, config, $http, Upload, breadcrumbsService, ngToast, authService, $q) {
    var vm = this;

    vm.filesList = {
      'files': [],
      'folders': []
    };

    vm.oldCanceller = $q.defer();

    var service = {
      getList: getList,
      getByPath: getByPath,
      fileSearch: fileSearch,
      searchAdvanced: searchAdvanced,
      sortFiles: sortFiles,
      deleteFile: deleteFile,
      renameFile: renameFile,
      getPathInfo: getPathInfo,
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
      return $http.get(config.userInfoByIdUrl + '/' + userIds.join(',')).then(function(response) {
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
      }, function() {
        return files;
      });
    }

    /**
     * Get files and folders for given path
     *
     * @param      {string}  path    Project relative path
     * @return     {Promise}
     */
    function getByPath(path) {
      return $http.get(config.filesServiceUrl + path)
        .success(function(data) {
          _addFilesOwnerInfo(data.files.results).then(function(files) {
            vm.filesList.files = files;
          });
          vm.filesList.folders = data.folders.results;
        })
        .error(function() {
          console.log('erruer tavu lol');
          vm.filesList.files = [];
          vm.filesList.folders = [];
        })
      ;
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
    function fileSearch(query, updateFilesList, error) {
      if (query.length > 0) {
        var path = config.abstractionPath;

        // one request at a time
        vm.oldCanceller.resolve();
        var canceller = $q.defer();

        $http.get(
          config.filesServiceUrl + '/api/search/?path_recursive=true&path=' + path + '&name=' + query,
          {
            timeout: canceller.promise
          }
        )
          .success(function(data) {
            updateFilesList({
              'files': data.results,
              'folders': []
            });
          },
          error // controller error callback
        );
        // current request will be aborted next time if necessary
        vm.oldCanceller = canceller;

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
     *
     * @param      {Object}  file    The file aimed to be deleted
     * @return     {Promise}
     */
    function deleteFile(file) {
      return $http.delete(config.filesServiceUrl + file.path + '/' + file.fkey);
    }

    /**
     * Rename a file already stored
     *
     * @param      {Object}    file         The file aimed to be renamed
     * @param      {string}    newFileName  The new file name
     * @param      {Function}  callback     The callback
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


    /**
     * Upload files
     *
     * @param      {string}    folderName  The destination folder name
     * @param      {<type>}    files       The files to upload
     * @param      {Function}  onSuccess   The on success callback
     * @param      {Function}  onError     The on error callback
     */
    function uploadFilesInFolder(folderName, files, onSuccess, onError) {
      if (files && files.length) {
        var crumbsArray = breadcrumbsService.getCurrentPathCrumbs(),
          filesCount = files.length,
          destinationPath = '',
          successCount = 0,
          uploadCount = 0,
          file;

        destinationPath = crumbsArray.slice(1, crumbsArray.length).join('/');
        if (destinationPath !== '') {
          destinationPath = '/' + destinationPath;
        }
        // adding new folder target name to upload path
        if (folderName && folderName.length) {
          destinationPath = destinationPath + '/' + folderName;
        }

        $rootScope.$broadcast('uploadEvent:start');

        // Recursively called, loop on files to upload them one by one
        (function uploadFilesOneByOne(files) {

          // iterating over files to upload
          if (files && files.length) {
            file = files.shift();

            uploadCount++;

            // takes one file at a time
            if (angular.isUndefined(file.upload)) {
              // Attach all upload info to file
              file.upload = Upload.upload({
                url: config.filesServiceUrl + destinationPath + '/' + file.name,
                method: 'POST',
                data: {
                  file: file,
                  license: 'CC-BY-SA',
                  permissions: 'wr',
                  groups: config.group
                }
              })

              .progress(function(evt) {
                // computing upload progress
                var percentCompleted, fileUploadStatus;
                if (evt.type == 'progress' && evt.lengthComputable) {
                  percentCompleted = Math.round(evt.loaded / evt.total * 100);
                  if (percentCompleted == 100) {
                    fileUploadStatus = 'Saving...';
                  } else {
                    fileUploadStatus = percentCompleted + '%';
                  }

                  // formating upload progress (ex: "choucroute.wav (13/42): 666%")
                  $rootScope.$broadcast('uploadEvent:progress', (function() {
                    if (1 == filesCount) {
                      return evt.config.data.file.name + ': ' + fileUploadStatus;
                    } else {
                      return uploadCount + '/' + filesCount + ': ' + fileUploadStatus + ' - ' + evt.config.data.file.name;
                    }
                  })());
                }
              })

              .success(function(data, status, headers, config) {
                // current file upload successful, hurray!
                file.upload = { status: 'success' };
                successCount++;
              })

              .error(function(data, status, headers, config) {
                if (status >= 500) {
                  file.upload = { status: 'error', error: data.error };
                  ngToast.danger('Uhoh, something went wrong...' + (data.error ? ' "' + data.error + '"' : ''));
                }
              });

              // recursion
              // then has to be unchained to preserve orginal promise (including abort())
              file.upload.then(function() {
                console.log('then');
                uploadFilesOneByOne(files);
              });
            }
          } else {
            // Successful upload to folder event
            $rootScope.$broadcast('uploadEvent:success', destinationPath);
          }
        })(files);

        var unregisterAbortEvent = $rootScope.$on('uploadEvent:abort', function() {
          // aborting current upload
          if (angular.isDefined(file.upload)) {
            console.log('aborted file:', file);
            file.upload.abort();
          }
          // prompting user
          ngToast.warning('Upload aborted, ' + successCount + ' files uploaded.');

          unregisterAbortEvent(); //@todo: find a better way to do this
        });
      }
    }
  });
})();

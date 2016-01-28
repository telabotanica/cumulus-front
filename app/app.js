(function() {
  'use strict';

  angular.module('cumulus', [
    /* Shared modules */
    'cumulus.files',
    'cumulus.breadcrumbs',
    'cumulus.search',
    'cumulus.modal',
    /* 3rd-party modules */
    'ngFileUpload',
    'ngContextMenu',
    'angularMoment',
    'angularModalService'
  ])

  .filter('formatByte', function() {
    return function(size, useBinary) {
      var base, prefixes;

      if (useBinary) {
        base = 1024;
        prefixes = ['Ko','Mo','Go','To','Po','Eo','Zo','Yo'];
      } else {
        base = 1000;
        prefixes = ['k','M','G','T','P','E','Z','Y'];
      }

      var exp = Math.log(size) / Math.log(base) | 0;
      return (size / Math.pow(base, exp)).toFixed(1) + ' ' +
        ((exp > 0) ? prefixes[exp - 1] + 'B' : 'Bytes');
      };
  });
})();

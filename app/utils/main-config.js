(function() {
  'use strict';

  angular.module('utils.config', [])
  // Just one config set for now, if more, move it to a /config folder and
  // it's own module root, like config.main and config.pied

  .constant('config', {
    ver: '0.1',
    filesServiceUrl: 'http://files.cumulus.dev'
  });

})();

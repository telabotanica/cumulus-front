(function() {
  'use strict';

  angular.module('utils.config', [])
  // Just one config set for now, if more, move it to a /config folder and
  // it's own module root, like config.main and config.pied

  // .constant('config', function(configService) {
  //   var baseConfig = {
  //     ver: '0.1',
  //     filesServiceUrl: 'http://files.cumulus.dev',
  //     userInfoByIdUrl: 'http://annuaire.dev/service:annuaire:utilisateur/infosParIds/'
  //   };

  //   var config = angular.extend({}, baseConfig, configService.getConfig());
  //   console.log('config:', config);
  //   console.log('sercviceConfig:', configService.getConfig());

  //   return config;
  // }) // doesn't work but we need to merge base config and context config

  .constant('config', {
    ver: '0.1',
    filesServiceUrl: 'http://files.cumulus.dev',
    userInfoByIdUrl: 'http://annuaire.dev/service:annuaire:utilisateur/infosParIds/'
  });

})();

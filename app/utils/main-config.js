(function() {
  'use strict';

  angular.module('utils.config', [])

  .constant('config', (function() {
    var config = {
      ver: '0.1',
      filesServiceUrl: 'http://files.cumulus.dev',
      userInfoByIdUrl: 'http://annuaire.dev/service:annuaire:utilisateur/infosParIds/',
      abstractionPath: '/mon',
      ressourcesPath: '', // in including mode, represents the path of application root path
      group: null,
      authUrl: 'https://annuaire.dev/service:annuaire:auth',
      tokenUrl: 'https://annuaire.dev/service:annuaire:auth/identite'
    };

    console.log('papuch',JSON.parse($('#cumulus-config-holder').attr('data-config')));

    config.abstractionPathLength = config['abstractionPath'].split('/').filter(function(n) { return n !== '' }).length;

    return config;
  })());
})();

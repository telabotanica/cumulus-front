'use strict';

angular.module('cumulus.version', [
  'cumulus.version.interpolate-filter',
  'cumulus.version.version-directive'
])

.value('version', '0.1');

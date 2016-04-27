(function() {
  'use strict';

  angular.module('utils.click', [])

  .directive('selectOnClick', ['$window', function($window) {
    // From https://stackoverflow.com/questions/14995884/select-text-on-input-focus
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.on('click', function() {
          if (!$window.getSelection().toString()) {
            // Required for mobile Safari
            this.setSelectionRange(0, this.value.length)
          }
        });
      }
    };
  }]);
})();

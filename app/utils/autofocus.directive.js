/**
 * source: http://stackoverflow.com/questions/25241544/angular-bootstrap-modal-popup-autofocus-not-working/#25242611
 *
 * the HTML5 autofocus property can be finicky when it comes to dynamically
 * loaded templates and such with AngularJS. Use this directive to tame
 * this beast once and for all.
 *
 * Usage example:
 * http://plnkr.co/edit/xcEQXmxgUPosF0ZnYPIu?p=preview
 *
 * html:
 * <input type="text" focus-me="hasFocus">
 *
 * js:
 * 'hasFocus' boolean var is used to focus bound element
 */
(function () {
  'use strict';

  angular.module('utils.autofocus', [])

  .directive('focusMe', function($timeout, $parse) {
    return {
      link: function(scope, element, attrs) {
        var model = $parse(attrs.focusMe);
        scope.$watch(model, function(value) {
          if (value === true) {
            $timeout(function() {
              $(element[0]).focus(); // @todo: remove $ and do it angular way
            });
          }
        });
      }
    };
  });

})();

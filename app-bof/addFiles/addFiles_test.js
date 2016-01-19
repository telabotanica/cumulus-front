'use strict';

describe('cumulus.addFiles module', function() {

  beforeEach(module('cumulus.addFiles'));

  describe('addFiles controller', function(){

    it('should display the file upload file', inject(function($controller) {
      //spec body
      var addFilesCtrl = $controller('addFilesCtrl');
      expect(addFilesCtrl).toBeDefined();
    }));

  });
});
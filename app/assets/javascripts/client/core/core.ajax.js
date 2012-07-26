/* Ajax extension for Gamecore library
 * © Algorithmica 2010
 * */

/*********************************************************************
 *         COMMUNICATION (Client <=> Server communications)
 *********************************************************************/

Core.Ajax = new Class.Singleton({
  Extends: Core.Base,
  Implements: Options,

  options: {
    // Server parameters
    protocol: 'http',
    host: 'undefined',
    port: false,
    path: false,
    controller: 'service',

    watchedStatuses: [500], // dispatched with a $msg.sys.netStatus message

    // Ajax options
    ajax: {
      method: "POST",
      type: "json",
      traditional: false //rails needs false, grails needs true
    }
  },

  // Use the options hash to configure the right server parameters (protool, host, port, path, controller)
  initialize: function(options){
    this.parent();
    this.setOptions(options);

    if(this.options.watchedStatuses.length > 0){
      var codes = {};
      this.options.watchedStatuses.each(function(code){
        codes[code] = function(){$send($msg.sys.netStatus, code)};
      });
      jQuery.ajaxSetup({statusCode: codes});
    }
  },

  /* Makes an ajax call to the server.
   *  request: {urlFor params [,data: jsonData, success: function]}
   * example:
   *  request = {action: 'myaction', data: {param: 3}, success: callback}
   */
  call: function(request){
    var ajaxParams = $H({
      url: this.urlFor(request),
      traditional: this.options.ajax.traditional,
      type: this.options.ajax.method
    });
    if(request.data){
      ajaxParams.extend({
        data: request.data,
        dataType: this.options.ajax.type
      })
    }
    if(request.success){
      ajaxParams.extend({success: request.success})
    }
    if(request.error){
      ajaxParams.extend({error: request.error})
    }
    try{
      jQuery.ajax(ajaxParams);
    } catch(e){
      $log("Server error");
    }
  },

  /* params is a hash of url specifiers. Example:
   * {
   *  protocol: 'http',
   *  host: 'localhost',
   *  port: 8080,
   *  path: 'multi-channel-chat',
   *  controller: 'hexmap',
   *  action 'colonies'
   * }
   * Only action is required.
   */
  urlFor: function(params){
    var protocol = params.protocol || this.options.protocol;
    var server = params.host || this.options.host;
    var port = params.port || this.options.port;
    var portSpec = (port ? ':' + port : '');
    var path = params.path || this.options.path;
    var pathSpec = path ? '/' + path : '';
    var controller = params.controller || this.options.controller;
    return (protocol + '://' + server + portSpec + pathSpec + '/' + controller + '/' + params.action)
  }

});

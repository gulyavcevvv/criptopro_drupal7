(function($) {
    'use strict';
    Drupal.behaviors.criptopro = {
        attach: function(context, settings) {

          if (isEdge()) {
              ShowEdgeNotSupported();
          } else {
              var canPromise = !!window.Promise;
              if (canPromise) {
                  cadesplugin.then(function() {
                          Common_CheckForPlugIn('CertListBox');
                      },
                      function(error) {
                          document.getElementById('PluginEnabledImg').setAttribute("src", '/' + Drupal.settings.criptopro_node.path + "/img/red_dot.png");
                          document.getElementById('PlugInEnabledTxt').innerHTML = error;
                      }
                  );
              } else {
                  window.addEventListener("message", function(event) {
                          if (event.data == "cadesplugin_loaded") {
                              CheckForPlugIn_NPAPI();
                          } else if (event.data == "cadesplugin_load_error") {
                              document.getElementById('PluginEnabledImg').setAttribute("src", '/' + Drupal.settings.criptopro_node.path + "/img/red_dot.png");
                              document.getElementById('PlugInEnabledTxt').innerHTML = "Плагин не загружен";
                          }
                      },
                      false);
                  window.postMessage("cadesplugin_echo_request", "*");
              }
          }
        }
    }
})(jQuery);



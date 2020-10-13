
<div id="info_msg">
  <span id="PlugInEnabledTxt"></span>
  <img src="" width="10" height="10" id="PluginEnabledImg">
  <br/>
  <span id="PlugInVersionTxt" lang="ru"> </span>
  <span id="CSPVersionTxt" lang="ru"> </span>
  <br/>
  <span id="CSPNameTxt" lang="ru"> </span>
</div>
<br/>
<h2>Выберите сертификат, которым хотите подписать: </h2>
<select size="4" name="CertListBox" id="CertListBox" style="width:100%;resize:none;"> </select>

<div id="cert_info" style="display:none;">
  <h2>Информация о сертификате</h2>
  <p class="info_field" id="subject"></p>
  <p class="info_field" id="issuer"></p>
  <p class="info_field" id="from"></p>
  <p class="info_field" id="till"></p>
  <p class="info_field" id="provname"></p>
  <p class="info_field" id="privateKeyLink"></p>
  <p class="info_field" id="algorithm"></p>
  <p class="info_field" id="status"></p>
  <p class="info_field" id="location"></p>
</div>
<p id="SignatureTxtBox"></p>
<?php print render($form['actions']); ?>

<?php print drupal_render_children($form); ?>
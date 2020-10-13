<?php

/**
 * @file
 * Page callbacks for signing content.
 */

/**
 * Form constructor for the node signing form.
 *
 * @see criptopro_node_signature_submit()
 */
function criptopro_node_signature($form, &$form_state, $node) {
  global $user;
  $content = criptopro_node_cpsigneddata_get_content($node);
  $path = drupal_get_path('module', 'criptopro_node');
  // Prepare cancel link.
  $options = array();
  if (isset($_GET['destination'])) {
    $options = drupal_parse_url($_GET['destination']);
  }

  $form['#theme'] = array('criptopro_signature_form');
  $form['#attributes'] = array('id' => array('criptopro-node-signature'));

  // Send Drupal.settings a reference to this form element.
  $data['criptopro_node'] = array(
    'content' => $content,
    'path' => $path,
  );

  $form['#attached']['js'][] = $path . '/js/es6-promise.min.js';
  $form['#attached']['js'][] = $path . '/js/ie_eventlistner_polyfill.js';
  $form['#attached']['js'][] = $path . '/js/cadesplugin_api.js';
  $form['#attached']['js'][] = $path . '/js/code.js';

  $form['#attached']['js'][] = $path . '/js/criptopro.js';
  $form['#attached']['js'][] = array(
    'type' => 'setting',
    'data' => $data,
  );

  $form['nid'] = array('#type' => 'value', '#value' => $node->nid);
  $form['vid'] = array('#type' => 'value', '#value' => $node->vid);
  $form['signature'] = array('#type' => 'hidden', '#value' => '');
  $form['signature']['#attributes'] = array('id' => array('signature'));

  $form['actions'] = array('#type' => 'actions');
  if (($node->uid == $user->uid)) {
    $form['actions']['criptopro_signature_author'] = array(
      '#type' => 'submit',
      '#value' => t('Subscribe'),
      '#name' => 'button_signature1',
      '#submit' => array('criptopro_node_signature_submit'),
      '#attributes' => array('disabled' => array('true')),
    );
  }
  else {
    $role = variable_get('criptopro_signature_2_role_' . $node->type);
    if (user_has_role($role)) {
      $form['actions']['criptopro_signature_author'] = array(
        '#type' => 'submit',
        '#name' => 'button_signature2',
        '#value' => t('Subscribe'),
        '#submit' => array('criptopro_node_signature_submit'),
      );
    }
  }
  $form['actions']['cancel'] = array(
    '#type' => 'link',
    '#title' => t('Cancel'),
    '#href' => 'node/' . $node->nid,
    '#options' => $options,
  );

  return $form;
}

/**
 * Form constructor for the node signing form.
 *
 * @see criptopro_node_signature_submit()
 */
function criptopro_node_signature_validate($form, &$form_state) {
  $valid = FALSE;

  $node = node_load($form_state['values']['nid'], $form_state['values']['vid']);
  $content = criptopro_node_cpsigneddata_get_content($node);
  $signature = $form_state['input']['signature'];

  $valid = criptopro_node_cpsigneddata_verify($content, $signature);

  if (!$valid) {
    form_set_error('form', t('The signature is not valid.'));
  }
}

/**
 * Executes node signing.
 *
 * @see criptopro_node_signature()
 */
function criptopro_node_signature_submit($form, &$form_state) {

  $flagsave = FALSE;
  if ($form_state['clicked_button']['#name'] == 'button_signature1') {
    db_merge('criptopro_node')
      ->key(array(
        'nid' => $form_state['values']['nid'],
        'vid' => $form_state['values']['vid'],
      ))
      ->fields(array(
        'signature1' => $form_state['input']['signature'],
      ))
      ->execute();
    $flagsave = TRUE;
  }

  if ($form_state['clicked_button']['#name'] == 'button_signature2') {
    global $user;
    db_merge('criptopro_node')
      ->key(array(
        'nid' => $form_state['values']['nid'],
        'vid' => $form_state['values']['vid'],
      ))
      ->fields(array(
      'uid' => $user->uid,
      'signature2' => $form_state['input']['signature'],
    ))
    ->execute();
    $flagsave = TRUE;
  }

  if ($flagsave) {
    $node = node_load($form_state['values']['nid']);
    watchdog('content', '@type: deleted %title.', array('@type' => $node->type, '%title' => $node->title));
    drupal_set_message(t('@type %title has been signed.', array('@type' => node_type_get_name($node), '%title' => $node->title)));
  }

  $form_state['redirect'] = node_access('view', $node) ? 'node/' . $node->nid : '<front>';
}

/**
 * Signature validation function.
 *
 * @see criptopro_node_signature_validate()
 */
function criptopro_node_cpsigneddata_verify($content, $sm) {
  try {
    $sd = new CPSignedData();
    $sd->set_ContentEncoding(1);
    $sd->set_Content($content);
    $sd->VerifyCades($sm, CADES_BES, 1);

    return TRUE;
  }
  catch (Exception $e) {
    form_set_error('form', $e->getMessage());
    return FALSE;
  }
}

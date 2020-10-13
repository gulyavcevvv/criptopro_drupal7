
<div id="info_title">
  <?php print $title; ?>
</div>

<?php if (count($info) > 0 ): ?>
  <table id="info_table">
    <tbody>
    <?php foreach ($info as $key => $value): ?>
      <tr>
        <td>
            <?php print $key; ?>
        </td>
        <td>
            <?php print $value; ?>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
<?php endif; ?>

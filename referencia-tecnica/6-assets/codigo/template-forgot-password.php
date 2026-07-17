<?php
/**
 * Template Name: Recuperar contraseña
 */
$sent = false;
if ( isset($_GET['sent']) && $_GET['sent'] === '1' ) {
    $sent = true;
}
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Recuperar contraseña — <?php bloginfo('name'); ?></title>
<?php wp_head(); ?>
</head>
<body class="auth-page">

<div class="auth-split">

  <!-- ── Panel izquierdo ───────────────────────────────────── -->
  <div class="auth-panel auth-panel--left">
    <div class="auth-left-inner">

      <a href="<?php echo esc_url(home_url('/')); ?>" class="auth-logo">
        <?php if (has_custom_logo()):
          the_custom_logo();
        else: ?>
          <img src="<?php echo esc_url(get_template_directory_uri()); ?>/assets/images/logo-icon.png" alt="Clientum" width="36" height="36">
        <?php endif; ?>
        <span>Clientum</span>
      </a>

      <div class="auth-left-body">
        <h1 class="auth-headline">Recuperá el acceso<br>a tu cuenta.</h1>
        <p class="auth-tagline">Te enviamos un enlace para restablecer tu contraseña. El proceso toma menos de 2 minutos.</p>
      </div>

    </div>
  </div>

  <!-- ── Panel derecho ─────────────────────────────────────── -->
  <div class="auth-panel auth-panel--right">
    <div class="auth-form-wrap">

      <a href="<?php echo esc_url(home_url('/login')); ?>" class="auth-back-link">← Volver al login</a>

      <?php if ($sent): ?>
        <div class="auth-success-box">
          <span class="auth-success-icon">✓</span>
          <h2>¡Enlace enviado!</h2>
          <p>Revisá tu bandeja de entrada. Si no lo encontrás en 5 minutos, revisá la carpeta de spam.</p>
          <a href="<?php echo esc_url(home_url('/login')); ?>" class="auth-btn auth-btn--primary" style="margin-top:24px">Volver al login</a>
        </div>
      <?php else: ?>

        <div class="auth-form-header">
          <h2>¿Olvidaste tu contraseña?</h2>
          <p>Ingresá tu email y te enviamos un enlace para crear una nueva contraseña.</p>
        </div>

        <form class="auth-form" id="forgot-form" method="post" action="<?php echo esc_url(wp_lostpassword_url()); ?>">
          <input type="hidden" name="redirect_to" value="<?php echo esc_url(home_url('/recuperar-contrasena?sent=1')); ?>">
          <?php wp_nonce_field('retrieve_password', 'wp-forgot-pw-nonce'); ?>

          <div class="auth-field">
            <label class="auth-label" for="forgot-email">Email</label>
            <div class="auth-input-wrap">
              <span class="auth-input-icon">✉</span>
              <input class="auth-input auth-input--icon" id="forgot-email" name="user_login" type="email" placeholder="tu@empresa.com" required autocomplete="email">
            </div>
          </div>

          <div class="auth-error" id="forgot-error" style="display:none"></div>

          <button type="submit" class="auth-btn auth-btn--primary">Enviar enlace de recuperación</button>
        </form>

      <?php endif; ?>

    </div>
  </div>

</div>

<?php wp_footer(); ?>
</body>
</html>

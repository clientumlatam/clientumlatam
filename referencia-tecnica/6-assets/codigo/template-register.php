<?php
/**
 * Template Name: Registro
 */
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Crear cuenta gratis — <?php bloginfo('name'); ?></title>
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
        <h1 class="auth-headline">Comenzá gratis.<br>Resultados en una semana.</h1>
        <p class="auth-tagline">14 días de prueba completa — sin tarjeta de crédito. Configuramos todo con vos.</p>

        <ul class="auth-features">
          <li>
            <span class="auth-feat-check">✓</span>
            14 días de prueba gratis, sin compromisos
          </li>
          <li>
            <span class="auth-feat-check">✓</span>
            Onboarding guiado en español
          </li>
          <li>
            <span class="auth-feat-check">✓</span>
            Soporte por WhatsApp incluido
          </li>
          <li>
            <span class="auth-feat-check">✓</span>
            Cancelá cuando quieras
          </li>
        </ul>
      </div>

      <div class="auth-social-proof">
        <div class="auth-avatars">
          <span class="auth-avatar" style="background:#3b82f6">M</span>
          <span class="auth-avatar" style="background:#8b5cf6">S</span>
          <span class="auth-avatar" style="background:#ec4899">A</span>
          <span class="auth-avatar" style="background:#f59e0b">R</span>
        </div>
        <span class="auth-proof-text"><strong>+500 PyMEs</strong> ya automatizadas</span>
      </div>

    </div>
  </div>

  <!-- ── Panel derecho ─────────────────────────────────────── -->
  <div class="auth-panel auth-panel--right">
    <div class="auth-form-wrap">

      <div class="auth-form-header">
        <h2>Crear cuenta</h2>
        <p>Registrá tu empresa en Clientum</p>
      </div>

      <form class="auth-form" id="register-form" method="post" action="<?php echo esc_url(home_url('/registro')); ?>">
        <?php wp_nonce_field('clientum_register', 'clientum_register_nonce'); ?>

        <div class="auth-field">
          <label class="auth-label" for="reg-company">Nombre de la empresa</label>
          <input class="auth-input" id="reg-company" name="company_name" type="text" placeholder="Mi Empresa S.A." required autocomplete="organization">
        </div>

        <div class="auth-field">
          <label class="auth-label" for="reg-name">Tu nombre</label>
          <input class="auth-input" id="reg-name" name="first_name" type="text" placeholder="Juan García" required autocomplete="given-name">
        </div>

        <div class="auth-field">
          <label class="auth-label" for="reg-email">Email</label>
          <input class="auth-input" id="reg-email" name="user_email" type="email" placeholder="juan@miempresa.com" required autocomplete="email">
        </div>

        <div class="auth-field">
          <label class="auth-label" for="reg-password">Contraseña</label>
          <input class="auth-input auth-input--password" id="reg-password" name="user_pass" type="password" placeholder="Mínimo 8 caracteres" required autocomplete="new-password" minlength="8">
        </div>

        <div class="auth-error" id="register-error" style="display:none"></div>

        <button type="submit" class="auth-btn auth-btn--primary">Crear cuenta gratis</button>

        <p class="auth-switch-text">¿Ya tenés cuenta? <a href="<?php echo esc_url(home_url('/login')); ?>" class="auth-link">Iniciá sesión</a></p>

        <p class="auth-fine-print">Sin tarjeta de crédito · 14 días gratis</p>
      </form>

    </div>
  </div>

</div>

<?php wp_footer(); ?>
</body>
</html>

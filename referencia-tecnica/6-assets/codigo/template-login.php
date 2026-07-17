<?php
/**
 * Template Name: Login
 */
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Iniciar sesión — <?php bloginfo('name'); ?></title>
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
        <h1 class="auth-headline">Tu PyME, organizada<br>y automatizada.</h1>
        <p class="auth-tagline">CRM, facturación electrónica y atención al cliente por WhatsApp — todo en una sola plataforma.</p>

        <ul class="auth-features">
          <li>
            <span class="auth-feat-icon" style="background:rgba(37,211,102,.15)">💬</span>
            Chatbot WhatsApp 24/7
          </li>
          <li>
            <span class="auth-feat-icon" style="background:rgba(37,211,102,.15)">🧾</span>
            Facturación electrónica AFIP
          </li>
          <li>
            <span class="auth-feat-icon" style="background:rgba(37,211,102,.15)">📊</span>
            Pipeline de ventas y CRM
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
        <span class="auth-proof-text"><strong>+500 PyMEs</strong> confían en Clientum</span>
      </div>

    </div>
  </div>

  <!-- ── Panel derecho ─────────────────────────────────────── -->
  <div class="auth-panel auth-panel--right">
    <div class="auth-form-wrap">

      <div class="auth-form-header">
        <h2>Bienvenido de vuelta</h2>
        <p>Ingresá con tu cuenta de Clientum</p>
      </div>

      <form class="auth-form" id="login-form" method="post" action="<?php echo esc_url(wp_login_url(home_url('/app/dashboard'))); ?>">
        <?php wp_nonce_field('clientum_login', 'clientum_login_nonce'); ?>

        <div class="auth-field">
          <label class="auth-label" for="login-email">Email</label>
          <input class="auth-input" id="login-email" name="log" type="email" placeholder="tu@empresa.com" required autocomplete="email">
        </div>

        <div class="auth-field">
          <div class="auth-label-row">
            <label class="auth-label" for="login-password">Contraseña</label>
            <a href="<?php echo esc_url(home_url('/recuperar-contrasena')); ?>" class="auth-link">¿Olvidaste tu contraseña?</a>
          </div>
          <input class="auth-input auth-input--password" id="login-password" name="pwd" type="password" placeholder="••••••••" required autocomplete="current-password">
        </div>

        <div class="auth-error" id="login-error" style="display:none"></div>

        <button type="submit" class="auth-btn auth-btn--primary">Ingresar</button>

        <div class="auth-divider"><span>¿Nuevo en Clientum?</span></div>

        <a href="<?php echo esc_url(home_url('/registro')); ?>" class="auth-btn auth-btn--outline">Crear cuenta gratis</a>

        <p class="auth-fine-print">Sin tarjeta de crédito · Operativo en una semana</p>
      </form>

    </div>
  </div>

</div>

<?php wp_footer(); ?>
</body>
</html>

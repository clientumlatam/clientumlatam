Clientum — Tema WordPress
=========================
Versión: 1.0.0
Requiere WordPress: 6.0+
PHP: 8.0+

INSTALACIÓN
───────────
1. Ir a WordPress Admin → Apariencia → Temas → Agregar nuevo → Subir tema
2. Subir el archivo clientum-theme.zip
3. Activar el tema

CONFIGURACIÓN DE PÁGINAS
────────────────────────
Crear las siguientes páginas en WordPress y asignarles el template correspondiente:

| Slug de la página      | Template a asignar          |
|------------------------|-----------------------------|
| (página de inicio)     | Inicio (Home) — configurar como "Portada estática" |
| contacto               | Contacto                    |
| precios                | Precios                     |
| sobre-nosotros         | Sobre Nosotros              |
| faq                    | FAQ                         |
| recursos               | Recursos                    |
| whatsapp               | Chatbot WhatsApp            |
| crm-inteligente        | CRM Inteligente             |
| asistente-ia           | Asistente IA                |
| reportes               | Reportes Automáticos        |
| automatizacion         | Automatización              |
| portal-cliente         | Portal del Cliente          |
| servicios              | Servicios                   |
| academia               | Academia                    |
| comparativa            | Comparativa                 |
| casos-de-exito         | Casos de Éxito              |
| programa-de-socios     | Programa de Socios          |
| blog                   | Blog                        |

CONFIGURAR PORTADA
──────────────────
1. Crear una página con el slug que prefieras (ej: "Inicio")
2. Asignarle el template "Inicio (Home)"
3. Ir a Ajustes → Lectura → Portada → Seleccionar "Una página estática" y elegir esa página

FORMULARIO DE CONTACTO
──────────────────────
El formulario envía por email al admin del sitio (Ajustes → General → Email).
Los emails se envían con wp_mail(). Para producción se recomienda instalar 
el plugin WP Mail SMTP con Resend o SendGrid.

MENÚ
────
Ir a Apariencia → Menús y asignar el menú al área "Menú principal".
Los menús del header se generan automáticamente con las URLs configuradas.

LOGO PERSONALIZADO
──────────────────
Ir a Apariencia → Personalizar → Identidad del sitio → Logo.
Recomendado: imagen cuadrada 200x200px PNG con fondo transparente.

SOPORTE
───────
info@clientum.com.ar
+54 298 451-0883
clientum.com.ar


AUTH PAGES
──────────
Crear las siguientes páginas para login, registro y recuperación de contraseña:

| Slug          | Template a asignar         |
|---------------|---------------------------|
| login         | Login                     |
| registro      | Registro                  |
| recuperar-contrasena | Recuperar contraseña |

Nota: estas páginas no usan el header/footer del sitio —
tienen su propio layout split-panel (panel oscuro + formulario blanco).


PÁGINAS NUEVAS DEL ZIP web_1783091221883.zip
────────────────────────────────────────────
Crear las siguientes páginas en WordPress Admin → Páginas → Añadir nueva:

| Título                          | Slug sugerido              | Template a asignar               |
|---------------------------------|---------------------------|----------------------------------|
| Consultoría Empresarial         | consultoria-empresarial   | Consultoría Empresarial          |
| Desarrollo Web y E-Commerce     | desarrollo-web            | Desarrollo Web                   |
| ERP Personalizado               | erp-personalizado         | ERP Personalizado                |
| Implementación y Soporte        | implementacion-soporte    | Implementación y Soporte         |
| Implementación y Soporte Alt.   | implementacion-soporte-2  | Implementación y Soporte (Alternativa) |
| Integración de Tecnología       | integracion-tecnologia    | Integración de Tecnología        |
| Marketing Digital               | marketing-digital         | Marketing Digital                |
| Política de Privacidad          | politica-privacidad       | Política de Privacidad           |
| Servicios Generales             | servicios-generales       | Servicios Generales              |
| Comparativa ERP                 | comparativa-erp           | Comparativa ERP                  |
| Comparativa de Servicios        | comparativa-servicios     | Comparativa de Servicios         |
| Comparativa de Servicios Alt.   | comparativa-servicios-2   | Comparativa de Servicios (Alternativa) |
| Programa de Socios (Alt.)       | programa-socios-2         | Programa de Socios (Alternativa) |

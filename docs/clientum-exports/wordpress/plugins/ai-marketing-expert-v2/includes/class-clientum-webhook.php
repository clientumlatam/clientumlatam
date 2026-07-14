<?php
/**
 * Clientum Webhook — forwards chatbot leads to the Clientum CRM.
 *
 * Listens to the `aime_chatbot_lead_captured` action fired by
 * LeadCaptureService and POSTs the lead payload to the Clientum
 * Express webhook endpoint via wp_remote_post.
 *
 * Configuration (WordPress options — set from the plugin settings page or
 * via PHP constants / environment variables in wp-config.php):
 *
 *   Option key                  | PHP constant / env var
 *   ----------------------------|--------------------------------------
 *   aime_clientum_webhook_url   | CLIENTUM_WEBHOOK_URL
 *   aime_clientum_webhook_token | CLIENTUM_WEBHOOK_TOKEN
 *
 * Example wp-config.php:
 *   define( 'CLIENTUM_WEBHOOK_URL',   'https://your-app.vercel.app/api/webhooks/chatbot-lead' );
 *   define( 'CLIENTUM_WEBHOOK_TOKEN', 'your-crm-internal-token' );
 *
 * @package WPSpace\AiMarketingExpert
 */

namespace WPSpace\AiMarketingExpert;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ClientumWebhook {

	/** WordPress option that stores the Clientum webhook URL. */
	private const OPT_URL   = 'aime_clientum_webhook_url';

	/** WordPress option that stores the shared CRM_INTERNAL_TOKEN. */
	private const OPT_TOKEN = 'aime_clientum_webhook_token';

	/** Timeout (seconds) for the remote POST. Kept short so a slow CRM
	 *  doesn't block the chatbot response loop. */
	private const TIMEOUT = 8;

	public function __construct() {
		add_action( 'aime_chatbot_lead_captured', array( $this, 'forward_lead' ) );
	}

	/**
	 * Called by `aime_chatbot_lead_captured`.
	 *
	 * @param array $lead_data {
	 *     @type string   $email
	 *     @type string   $first_name
	 *     @type string   $source
	 *     @type int      $list_id
	 *     @type string[] $tags
	 *     @type array    $metadata  { bot_id, conversation_id, page_url }
	 * }
	 */
	public function forward_lead( array $lead_data ): void {
		$url   = $this->get_config( self::OPT_URL, 'CLIENTUM_WEBHOOK_URL' );
		$token = $this->get_config( self::OPT_TOKEN, 'CLIENTUM_WEBHOOK_TOKEN' );

		if ( ! $url || ! $token ) {
			// Integration not configured — skip silently.
			aime_log( 'Clientum webhook not configured (url or token missing). Lead not forwarded.', 'debug', 'clientum' );
			return;
		}

		$payload = wp_json_encode( array_merge(
			$lead_data,
			array( 'site_url' => get_bloginfo( 'url' ) )
		) );

		$response = wp_remote_post( $url, array(
			'timeout'     => self::TIMEOUT,
			'data_format' => 'body',
			'headers'     => array(
				'Content-Type' => 'application/json',
				'X-CRM-Token'  => $token,
			),
			'body'        => $payload,
		) );

		if ( is_wp_error( $response ) ) {
			aime_log(
				sprintf( 'Clientum webhook error: %s', $response->get_error_message() ),
				'error',
				'clientum'
			);
			return;
		}

		$code = wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 300 ) {
			aime_log(
				sprintf( 'Clientum webhook returned HTTP %d: %s', $code, wp_remote_retrieve_body( $response ) ),
				'warning',
				'clientum'
			);
			return;
		}

		aime_log(
			sprintf( 'Lead forwarded to Clientum CRM (email: %s)', $lead_data['email'] ?? '?' ),
			'info',
			'clientum'
		);
	}

	/**
	 * Read a config value from a PHP constant, then env var, then WP option.
	 *
	 * @param string $option_key  WordPress option name.
	 * @param string $constant    PHP constant / env var name.
	 * @return string
	 */
	private function get_config( string $option_key, string $constant ): string {
		if ( defined( $constant ) ) {
			return (string) constant( $constant );
		}
		$env = getenv( $constant );
		if ( $env !== false && $env !== '' ) {
			return $env;
		}
		return (string) get_option( $option_key, '' );
	}
}

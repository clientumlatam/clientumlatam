=== AI Import Products from Google Sheets for WooCommerce ===
Contributors: ditsagency
Tags: woocommerce, importer, google-sheets, sync, products
Requires at least: 6.3
Tested up to: 7.0
Stable tag: 1.0.6
Requires PHP: 8.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Streamline your WooCommerce product management with a powerful, AI-enhanced importer that connects directly to Google Sheets.

== Description ==

Streamline your WooCommerce product management with a powerful, AI-enhanced importer that connects directly to Google Sheets. This plugin is designed for store owners, developers, and agencies who need a fast, scalable, and reliable way to manage product data without manual input or complex integrations.

= Overview =

AI Import Products from Google Sheets for WooCommerce enables seamless synchronization between your Google Sheets and WooCommerce store. Instead of manually creating or updating products, you can manage all product data in a familiar spreadsheet interface and import it into your store with precision.

Enhanced with AI capabilities, the plugin goes beyond simple import tools by helping structure, optimize, and prepare your product data for better performance and consistency.

= Key Features =

* Direct Google Sheets Integration: Connect your WooCommerce store to Google Sheets and import product data in real time or on demand. No CSV exports or manual uploads required.
* AI-Powered Data Processing: Leverage AI to clean, structure, and optimize product data. Improve titles, descriptions, and formatting automatically for better SEO and consistency.
* Bulk Product Import and Update: Import unlimited products, including simple and variable products. Update existing products by SKU, ID, or other identifiers.
* Advanced Field Mapping: Map Google Sheets columns to WooCommerce fields with full flexibility, including product titles and descriptions, prices and sale prices, SKUs and stock status, categories and tags, images via URLs, and attributes and variations.
* Automated Synchronization: Schedule automatic imports to keep your store updated without manual intervention. Ideal for dynamic catalogs or frequently updated inventories.
* Error Handling and Validation: Built-in validation ensures data accuracy before import. Logs and error reports help identify and fix issues quickly.
* Developer-Friendly Architecture: Extensible and customizable for advanced use cases. Suitable for custom workflows and integrations.

= See the Plugin in Action =

Watch how to import WooCommerce products from Google Sheets using AI-powered automation:

[youtube https://youtu.be/CPiFdeVv_yY?si=y4C09q5ZIX6fKytX]

= Use Cases =

* Managing large product catalogs via Google Sheets
* Automating WooCommerce product imports
* Syncing supplier or dropshipping data
* Rapid product updates without admin panel overhead
* SEO optimization of product content at scale

= SEO Benefits =

The AI layer helps generate and refine product content, improving:

* Keyword consistency
* Product descriptions quality
* Structured data readiness
* Overall search visibility

By managing content centrally in Google Sheets, you gain full control over optimization strategies.

= Why Choose This Plugin =

Unlike traditional import tools, this solution combines automation, flexibility, and AI-driven enhancements. It reduces manual workload, minimizes errors, and accelerates product management workflows.

= Compatibility =

* WooCommerce (latest versions)
* Google Sheets API
* Works with most themes and standard WooCommerce setups

= Conclusion =

AI Import Products from Google Sheets for WooCommerce is a comprehensive solution for efficient product management. It bridges the gap between data handling and eCommerce execution, providing a scalable and intelligent workflow for modern WooCommerce stores.

== Installation ==

1. Install and activate the plugin.
2. Make sure WooCommerce is active.
3. Open the plugin settings and configure Google integration if you use Google Sheets or Drive.
4. Add your OpenAI API key only if you want AI content generation.
5. Go to Import settings and add an import configuration row.

== Privacy / External Services ==

This plugin can connect to external services:

* Google APIs (Google Sheets / Google Drive): Used to read spreadsheet data for import and, optionally, to fetch images from a Google Drive folder. This happens only when an administrator connects Google and starts an import or image sync.
* OpenAI API (Optional): If enabled, the plugin sends your prompt and selected product fields to OpenAI to generate content. You must provide your own OpenAI API key.

This plugin does not collect telemetry and does not send any data to the developer's servers.

Service privacy policies:

* Google: <a href="https://policies.google.com/privacy" target="_blank">Google Privacy Policy</a>
* OpenAI: <a href="https://openai.com/policies/privacy-policy" target="_blank">OpenAI Privacy Policy</a>

== Frequently Asked Questions ==

= Do I need to pay for OpenAI? =

Yes. OpenAI API is a commercial service. You need your own API key with a positive balance.

= Which languages are supported for AI generation? =

Any language. The output language is controlled by your prompt settings.

= Can I update only prices and stock without changing descriptions? =

Yes. After first import, updates can be limited to price, stock, or status. Content is regenerated only when status-based rules require it.

= How many products can I import? =

There are no hard limits. The plugin processes data in batches to avoid server overload.

== Screenshots ==

1. Import configuration: category, sheet URL, start row, column mapping.
2. Optional modules: sizes, images (Google Drive), markup, AI generation.
3. Import run and logs: batch progress and results.

== Changelog ==

= 1.0.6 =

* Verified compatibility with WordPress 7.0, aligned settings permissions with WooCommerce manager access, and fixed an admin notice-level issue in the import mapping screen.

= 1.0.5 =

* Updated the video block to the WordPress YouTube shortcode format, converted policy links to HTML anchors, and bumped release metadata to 1.0.5.

= 1.0.4 =

* Updated the plugin readme content based on the new product copy and bumped release metadata to 1.0.4.

= 1.0.3 =

* Added improved AI prompt variables (`{{sku}}`, normalized `{{language}}`) and refresh controls for AI content updates.

= 1.0.2 =

* Updated the plugin display name and description, and bumped the release metadata to 1.0.2.

= 1.0.1 =

* Improved import skip rules for sold items, markup with zero or missing price, and missing or invalid image folders when image sync is enabled.

= 1.0.0 =

* Initial release.

== Upgrade Notice ==

= 1.0.6 =

WordPress 7.0 compatibility release with admin permission alignment and a fix for the saved size-columns settings notice.

= 1.0.5 =

Readme formatting update with embedded video shortcode, HTML links, and 1.0.5 release metadata.

= 1.0.4 =

Updated the product page copy and release metadata for the 1.0.4 release.

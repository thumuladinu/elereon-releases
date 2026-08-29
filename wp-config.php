<?php
define('WP_CACHE', false ); // Added by AirLift

/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the website, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/documentation/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'bitnami_wordpress' );

/** Database username */
define( 'DB_USER', 'bn_wordpress' );

/** Database password */
define( 'DB_PASSWORD', '7dd9f23fc665c42af235a7e66096fe3665bae874299f5dc03e92228d3d97c7a9' );

/** Database hostname */
define( 'DB_HOST', '127.0.0.1:3306' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );


/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'AhiehjMS1aQ&F+Cj@EqdhQYo`=r;6=xb|3x]o ~@9TknKTn>.KdH3scNab*$H@-2' );
define( 'SECURE_AUTH_KEY',  ',fe)AJD(5KBcBtq:b-OF+DTGu,#QSv@du(zTlybCMXuCn|fnd)r}QjV IUY(FuN{' );
define( 'LOGGED_IN_KEY',    '~LmLB=3gE<C8ssTiH<68ft^8RRMw&Q[wVe- EYjK9[%7~g^u{o8q9&iWoB%[sG;z' );
define( 'NONCE_KEY',        '5)D4rR D}y@k-fyx)Z%rdck_E8Isk]*.X=~eoW,9> @TX~t`Z%P2@kZhA0`=.W%&' );
define( 'AUTH_SALT',        '%ct,I7g:v30Ox_P-@#5+/<N351 FRpSDW[~`l?-*Gw3QbRq4(<+EKZy`|Ph+~X-%' );
define( 'SECURE_AUTH_SALT', 'J`I3W,z+A.z9]_#?fWYK<rWXwafZ(J7e!9n*esl.mS}~Q4M !V02/.Y@Go[nfirr' );
define( 'LOGGED_IN_SALT',   '#T/?PfC/R#[>P{b1n@=to:qiJ#]A13SFO.`z#LCbl->s7X>&h3U=|[3=&-LIK^wK' );
define( 'NONCE_SALT',       '^/<#iA5Oyf#:-{q/McJzG])W6[O-)m.}<.p|>&T[~Mf*;v0eX,mt S?*4>b+OHIa' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/documentation/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', true );

/* Add any custom values between this line and the "stop editing" line. */



define( 'FS_METHOD', 'direct' );
/**
 * The WP_SITEURL and WP_HOME options are configured to access from any hostname or IP address.
 * If you want to access only from an specific domain, you can modify them. For example:
 *  define('WP_HOME','http://example.com');
 *  define('WP_SITEURL','http://example.com');
 *
 */
if ( defined( 'WP_CLI' ) ) {
	$_SERVER['HTTP_HOST'] = '127.0.0.1';
}

define( 'WP_HOME', 'http://' . $_SERVER['HTTP_HOST'] . '/' );
define( 'WP_SITEURL', 'http://' . $_SERVER['HTTP_HOST'] . '/' );
define( 'WP_AUTO_UPDATE_CORE', 'minor' );
/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';

/**
 * Disable pingback.ping xmlrpc method to prevent WordPress from participating in DDoS attacks
 * More info at: https://docs.bitnami.com/general/apps/wordpress/troubleshooting/xmlrpc-and-pingback/
 */
if ( !defined( 'WP_CLI' ) ) {
	// remove x-pingback HTTP header
	add_filter("wp_headers", function($headers) {
		unset($headers["X-Pingback"]);
		return $headers;
	});
	// disable pingbacks
	add_filter( "xmlrpc_methods", function( $methods ) {
		unset( $methods["pingback.ping"] );
		return $methods;
	});
}

define('DISALLOW_FILE_EDIT', true);
define('DISALLOW_FILE_MODS', true);
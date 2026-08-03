function load_custom_styles_for_pages() {

    if ( is_page() && !is_home() && !is_archive() && !is_single() ) {

        // プライバシーポリシーのリセットCSS
        wp_enqueue_style(
            'reset-css',
            get_stylesheet_directory_uri() . '/assets/css/privacy-act.css',
            array(),
            '1.0.0',
            'all'
        );

        // 追加したいCSS
        wp_enqueue_style(
            'custom-css',
            get_stylesheet_directory_uri() . '/assets/css/reset.css',
            array('reset-css'),
            '1.0.0',
            'all'
        );
    }
}
add_action( 'wp_enqueue_scripts', 'load_custom_styles_for_pages' );

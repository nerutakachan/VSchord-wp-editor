<?php
/**
 * Lightning Child theme functions
 *
 * @package lightning
 */

/************************************************
 * 独自CSSファイルの読み込み処理
 *
 * 主に CSS を SASS で 書きたい人用です。 素の CSS を直接書くなら style.css に記載してかまいません.
 */

// 独自のCSSファイル（assets/css/）を読み込む場合は true に変更してください.
$my_lightning_additional_css = false;

if ( $my_lightning_additional_css ) {
	// 公開画面側のCSSの読み込み.
	add_action(
		'wp_enqueue_scripts',
		function() {
			wp_enqueue_style(
				'my-lightning-custom',
				get_stylesheet_directory_uri() . '/assets/css/style.css',
				array( 'lightning-design-style' ),
				filemtime( dirname( __FILE__ ) . '/assets/css/style.css' )
			);
		}
	);
	// 編集画面側のCSSの読み込み.
	add_action(
		'enqueue_block_editor_assets',
		function() {
			wp_enqueue_style(
				'my-lightning-editor-custom',
				get_stylesheet_directory_uri() . '/assets/css/editor.css',
				array( 'wp-edit-blocks', 'lightning-gutenberg-editor' ),
				filemtime( dirname( __FILE__ ) . '/assets/css/editor.css' )
			);
		}
	);
}
/************************************************
 * プライバシーポリシー用CSSとリセットCSSを固定ページでのみ読み込み
 ************************************************/
function enqueue_privacy_and_reset_css() {
	// WooCommerceの関数が存在する場合のみ確認
	$is_wc_order_received = function_exists('is_wc_endpoint_url') && is_wc_endpoint_url('order-received');
	// 固定ページかつ、WooCommerceのサンクスページ以外の場合
	if (is_page() && ! $is_wc_order_received) {
		// プライバシーポリシー関連
		wp_enqueue_style(
			'privacy-act',
			get_stylesheet_directory_uri() . '/_g3/assets/css/privacy-act.css',
			array(),
			filemtime(get_stylesheet_directory() . '/_g3/assets/css/privacy-act.css')
		);
		// リセットCSS
		wp_enqueue_style(
			'custom-reset', // 重複を避けるため名前を変更
			get_stylesheet_directory_uri() . '/_g3/assets/css/reset.css',
			array(),
			filemtime(get_stylesheet_directory() . '/_g3/assets/css/reset.css')
		);
		// お問い合わせフォーム用
		wp_enqueue_style(
			'contact-form',
			get_stylesheet_directory_uri() . '/_g3/assets/css/contact-form.css',
			array(),
			filemtime(get_stylesheet_directory() . '/_g3/assets/css/contact-form.css')
		);
		// カスタムJavaScriptの追加
		wp_enqueue_script(
			'custom-js',
			get_stylesheet_directory_uri() . '/_g3/assets/js/custom.js',
			array(),
			filemtime(get_stylesheet_directory() . '/_g3/assets/js/custom.js'),
			true
		);
	}
}
add_action("wp_enqueue_scripts", "enqueue_privacy_and_reset_css", 11);
/************************************************
 * パンくずリスト表示制御
 ************************************************/
add_filter('lightning_is_breadcrumb', function() {
	$post_type = get_post_type();
	if ('post' === $post_type || 'product' === $post_type) {
		return true;
	} else {
		return false;
	}
});
/************************************************
 * Pタグ自動挿入を制御
 ************************************************/

// ページ読み込み時に判定を行い、条件に応じてwpautopを無効化する
add_action( 'wp', function() {
	// 投稿(post)と商品(product)「以外」のページで wpautop を無効化
	if ( ! is_singular( [ 'post', 'product' ] ) ) {
		remove_filter( 'the_content', 'wpautop' );
		remove_filter( 'the_excerpt', 'wpautop' );
	}
} );
// CF7全体の自動整形を停止（これでフォームからpタグが消えます）
add_filter('wpcf7_autop_or_not', '__return_false');
add_action('wpcf7_before_send_mail', function($contact_form, &$abort, $submission) {
		// メール設定を取得
		$mail = $contact_form->prop('mail');
		
		// メールの本文にwpautop（pタグ付与）を適用
		if (!empty($mail['body'])) {
				$mail['body'] = wpautop($mail['body']);
		}
		
		// 書き換えた設定を保存（この送信回だけに適用される）
		$contact_form->set_properties(['mail' => $mail]);
}, 10, 3);

/************************************************
 * コピーライト表記をカスタマイズ
 ************************************************/

add_filter('lightning_footerCopyRightCustom', function(){
	echo '<p>&copy;2026 有限会社 康栄綜業.</p>';
});
add_filter('lightning_footerPoweredCustom', function(){ return; });

/************************************************
* 絵文字の自動変換（SVG化）を無効にする
************************************************/
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
remove_action( 'admin_print_styles', 'print_emoji_styles' );



//ショップ運営者に投稿者権限・投稿編集権限を付与
function custom_author_capabilities() {
		$role = get_role('author');

		// 投稿・固定ページ
		$role->add_cap('edit_others_posts');
		$role->add_cap('edit_others_pages');

		// WooCommerce 基本管理
		$role->add_cap('manage_woocommerce');
		$role->add_cap('view_woocommerce_reports');

		// 商品関連
		$role->add_cap('edit_product');
		$role->add_cap('edit_products');
		$role->add_cap('publish_products');
		$role->add_cap('read_private_products');

		// 注文（shop_order）関連
		$role->add_cap('read_shop_order');
		$role->add_cap('read_private_shop_orders');
		$role->add_cap('edit_shop_order');
		$role->add_cap('edit_shop_orders');
		$role->add_cap('edit_others_shop_orders');
		$role->add_cap('publish_shop_orders');
		$role->add_cap('delete_shop_orders');
}
add_action('init', 'custom_author_capabilities');


/*=============  HTMLをショートコードにする方法  ===============*/
//少量のシンプルな出力ならそのまま文字列をreturnするのが簡単
function my_custom_html_shortcode() {
		return '<div class="my-box">ここに好きなHTMLを書く</div>';
}
add_shortcode('mybox', 'my_custom_html_shortcode');

//投稿用ショートコード
function custom_work_posts_shortcode( $atts ) {
		// ショートコードの属性（デフォルト値）
		$atts = shortcode_atts(
				array(
						'category' => '', // カテゴリースラッグ
						'posts'    => 4,  // 表示件数
				),
				$atts,
				'work_posts'
		);
		// 記事取得の条件
		$args = array(
				'post_type'      => 'post', // カスタム投稿タイプの場合は 'post' を変更してください（例：'work'）
				'posts_per_page' => intval( $atts['posts'] ),
				'post_status'    => 'publish',
		);
		// ショートコード内でカテゴリー（スラッグ）が指定されている場合
		if ( ! empty( $atts['category'] ) ) {
				$args['category_name'] = sanitize_text_field( $atts['category'] );
		}
		$query = new WP_Query( $args );
		$html = '';
		if ( $query->have_posts() ) {
				while ( $query->have_posts() ) {
						$query->the_post();
						$link  = get_permalink();
						$title = get_the_title();
						$date  = get_the_time( 'Y.m.d' ); // 2026.01.01 の形式
						// サムネイル画像（アイキャッチ）の取得
						if ( has_post_thumbnail() ) {
								// 'large' や 'medium' など適切なサイズに変更可能です
								$img_url = get_the_post_thumbnail_url( get_the_ID(), 'large' );
						} else {
								// Lightning (ExUnit) の設定からデフォルト画像URLを取得
								$vk_options = get_option( 'vk_exunit_common_options' );
								$default_img_url = isset($vk_options['default_thumbnail_url']) ? $vk_options['default_thumbnail_url'] : '';

								if ( $default_img_url ) {
									$img_url = $default_img_url;
								} else {
									// 設定も空だった場合の最終的な予備
									$img_url = '/2026-wp/wp-content/image/top/news-img_test.jpg';
								}
						}
						// カテゴリーの取得（最初の1つを表示）
						$categories = get_the_category();
						$cat_html = '';
						if ( ! empty( $categories ) ) {
								$cat      = $categories[0];
								$cat_link = esc_url( get_category_link( $cat->term_id ) );
								$cat_name = esc_html( $cat->name );
								// 指定通りタグにリンクを付与
								$cat_html = '<a href="' . $cat_link . '" style="text-decoration:none;"><span class="work-post-tag_box">' . $cat_name . '</span></a>';
						}
						// HTMLの組み立て
						$html .= '<div class="work-post-item_box">';
						// 1. 画像ボックス（画像にリンク付与）
						$html .= '<div class="work-post-img_box">';
						$html .= '<a href="' . esc_url( $link ) . '"><img src="' . esc_url( $img_url ) . '" alt="' . esc_attr( $title ) . '"></a>';
						$html .= '</div>';
						// 2. テキストボックス
						$html .= '<div class="work-post-text_box">';
						// 日付とタグ
						$html .= '<div class="work-post-data_box">';
						$html .= esc_html( $date ) . ' ';
						$html .= $cat_html;
						$html .= '</div>';
						// タイトル（タイトルにリンク付与）
						$html .= '<p><a href="' . esc_url( $link ) . '">' . esc_html( $title ) . '</a></p>';
						$html .= '</div>'; // .work-post-text_box 終了
						$html .= '</div>'; // .work-post-item_box 終了
				}
				wp_reset_postdata(); // 投稿データをリセット
		} else {
				$html .= '<p>該当する記事がありません。</p>';
		}

		return $html;
}
add_shortcode( 'work_posts', 'custom_work_posts_shortcode' );

//recruit
function recruit_html_shortcode() {
    return '';
}
add_shortcode('recruit', 'recruit_html_shortcode');
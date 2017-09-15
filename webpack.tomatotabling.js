const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const vuxLoader = require('vux-loader');
const autoprefixer = require('autoprefixer');

const webpackConfig = {
	entry: './src/tomatotabling/frontend/main.js',
	output: {
		path: path.join(__dirname, 'dist/tomatotabling/frontend'),
		filename: 'js/[name].js',
		chunkFilename: 'js/[id].js',
		publicPath: '/tomatotabling/',
	},
	resolve: {
		extensions: ['.vue', '.js', '.json'],
	},
	module: {
		rules: [{
			test: /\.font\.json/,
			use: ExtractTextPlugin.extract({
				fallback: 'style-loader',
				use: [
					'css-loader',
					{
						loader: 'fontgen-loader',
						options: {
							fileName: 'fonts/[fontname][ext]',
						},
					},
				],
			}),

		}, {
			test: /\.vue$/,
			loader: 'vue-loader',
			options: {
				postcss: [
					autoprefixer({
						browsers: ['iOS >= 7', 'Android >= 4.1'],
					})
				],
				extractCSS: true,
			},
		}, {
			test: /\.js$/,
			use: [{
				loader: 'babel-loader',
				options: {
					presets: ['es2015'],
				},
			}],
			exclude: /node_modules/,
		}, {
			test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
			loader: 'url-loader',
			query: {
				limit: 8192,
				name: 'img/[hash:12].[ext]',
			},
		}],
	},
	plugins: [
		new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
		new ExtractTextPlugin('css/app.bundle.css'),
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: './src/tomatotabling/frontend/index.html',
			inject: 'body',
			minify: {
				removeComments: true,
				collapseWhitespace: true,
				removeAttributeQuotes: true,
			},
			chunksSortMode: 'dependency',
		}),
		new HtmlWebpackPlugin({
			filename: 'export.html',
			template: './src/tomatotabling/frontend/export.html',
			inject: false,
			minify: {
				removeComments: true,
				collapseWhitespace: true,
				removeAttributeQuotes: true,
			},
		}),
		new webpack.optimize.CommonsChunkPlugin({
			name: 'vendor',
			minChunks: function (module, count) {
				return (
					module.resource &&
					/\.js$/.test(module.resource) &&
					module.resource.startsWith(path.join(__dirname, './node_modules'))
				);
			}
		}),
		new webpack.optimize.CommonsChunkPlugin({
			name: 'manifest',
			chunks: ['vendor'],
		}),
	],
};

module.exports = vuxLoader.merge(webpackConfig, {
	plugins: ['vux-ui', 'duplicate-style'],
});

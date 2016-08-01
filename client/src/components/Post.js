/* eslint-env node, browser */
'use strict';

var template = require('./Post.html');

module.exports = {
	template: template,
	name: 'Post',
	props: ['post'],
	methods: {
		postSelected: function () {
			// Note that this does not seem to work when called from an <a>
			// tag being clicked!
			this.$route.router.go({
				name: 'compose',
				params: {
					etag: this.post.etag
				}
			});
		}
	}
};

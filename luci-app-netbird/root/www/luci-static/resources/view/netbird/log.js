'use strict';
'require view';
'require fs';
'require poll';

return view.extend({
	load: function() {
		return fs.exec('/usr/libexec/netbird-luci', ['logs', '300']);
	},

	render: function(res) {
		var pre = E('pre', {
			'id': 'nb-log',
			'style': 'max-height:70vh;overflow:auto;white-space:pre-wrap;font-size:85%'
		}, (res && res.stdout) || '');

		poll.add(function() {
			return fs.exec('/usr/libexec/netbird-luci', ['logs', '300']).then(function(r) {
				var atBottom = pre.scrollTop + pre.clientHeight >= pre.scrollHeight - 20;
				pre.textContent = r.stdout || '';
				if (atBottom) pre.scrollTop = pre.scrollHeight;
			});
		}, 5);

		window.setTimeout(function() { pre.scrollTop = pre.scrollHeight; }, 0);

		return E('div', {}, [ E('h2', _('NetBird log')), pre ]);
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});

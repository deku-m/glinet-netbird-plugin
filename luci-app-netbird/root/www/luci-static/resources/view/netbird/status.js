'use strict';
'require view';
'require fs';
'require ui';
'require poll';

var HELPER = '/usr/libexec/netbird-luci';

function run(args) {
	return fs.exec(HELPER, args).then(function(res) {
		var out = (res.stdout || '').trim();
		if (res.code !== 0)
			throw new Error((res.stderr || out || _('Command failed')).trim());
		try { return JSON.parse(out); } catch (e) { return out; }
	});
}

function fmtBytes(n) {
	n = +n || 0;
	var u = ['B', 'KiB', 'MiB', 'GiB', 'TiB'], i = 0;
	while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
	return n.toFixed(i ? 1 : 0) + ' ' + u[i];
}

function fmtLatency(ns) {
	ns = +ns || 0;
	return ns ? (ns / 1e6).toFixed(1) + ' ms' : '-';
}

function badge(ok, yes, no) {
	return E('span', {
		'style': 'display:inline-block;padding:1px 8px;border-radius:9px;color:#fff;font-size:90%;background:' +
			(ok ? '#2e9e5b' : '#c0392b')
	}, ok ? yes : no);
}

function row(label, value) {
	return E('tr', { 'class': 'tr' }, [
		E('td', { 'class': 'td left', 'width': '33%' }, label),
		E('td', { 'class': 'td left' }, value)
	]);
}

return view.extend({
	jobWasRunning: false,

	load: function() {
		return run(['status']).catch(function(e) { return { error: e.message }; });
	},

	startJob: function(args, title) {
		var self = this;
		return run(args).then(function() {
			self.jobWasRunning = true;
			ui.addNotification(null, E('p', title + ' ' + _('started, progress is shown below.')), 'info');
			return self.refresh();
		}).catch(function(e) {
			ui.addNotification(null, E('p', e.message), 'danger');
		});
	},

	quick: function(args, msg) {
		var self = this;
		return run(args).then(function() {
			ui.addNotification(null, E('p', msg), 'info');
			return self.refresh();
		}).catch(function(e) {
			ui.addNotification(null, E('p', e.message), 'danger');
		});
	},

	handleInstall: function() {
		var ver = (document.getElementById('nb-version').value || 'latest').trim();
		return this.startJob(['install', ver], _('Install of NetBird'));
	},

	handleUp: function() {
		return this.startJob(['up'], _('Connect'));
	},

	handleDown: function() {
		return this.quick(['down'], _('NetBird disconnected.'));
	},

	handleStop: function() {
		return this.quick(['stop'], _('NetBird stopped and disabled at boot.'));
	},

	handleDeregister: function() {
		if (!confirm(_('Remove this router from the NetBird network? You will need a new setup key to rejoin.')))
			return;
		return this.quick(['deregister'], _('Peer deregistered.'));
	},

	renderStatus: function(d) {
		var st = d.status || {}, mg = st.management || {}, sg = st.signal || {}, peers = st.peers || {};
		var connected = !!(d.running && mg.connected && st.netbirdIp);

		return E('table', { 'class': 'table' }, [
			row(_('Binary'), d.installed ? d.version + ' (' + d.arch + ')' : badge(false, '', _('not installed'))),
			row(_('Daemon'), badge(d.running, _('running'), _('stopped'))),
			row(_('Connection'), badge(connected, _('connected'), _('not connected'))),
			row(_('Management'), (mg.url || '-') + (mg.error ? ' (' + mg.error + ')' : '')),
			row(_('Signal'), badge(!!sg.connected, _('connected'), _('disconnected'))),
			row(_('NetBird IP'), st.netbirdIp || '-'),
			row(_('FQDN'), st.fqdn || '-'),
			row(_('Interface mode'), st.netbirdIp ? (st.usesKernelInterface ? _('kernel WireGuard') : _('userspace')) : '-'),
			row(_('Peers'), peers.total != null ? peers.connected + ' / ' + peers.total + ' ' + _('connected') : '-')
		]);
	},

	renderPeers: function(d) {
		var list = (((d.status || {}).peers || {}).details) || [];
		var rows = [E('tr', { 'class': 'tr table-titles' }, [
			E('th', { 'class': 'th' }, _('Peer')),
			E('th', { 'class': 'th' }, _('IP')),
			E('th', { 'class': 'th' }, _('Status')),
			E('th', { 'class': 'th' }, _('Type')),
			E('th', { 'class': 'th' }, _('Latency')),
			E('th', { 'class': 'th' }, _('RX / TX'))
		])];

		list.sort(function(a, b) { return (a.fqdn || '').localeCompare(b.fqdn || ''); });
		list.forEach(function(p) {
			rows.push(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, p.fqdn || '-'),
				E('td', { 'class': 'td' }, p.netbirdIp || '-'),
				E('td', { 'class': 'td' }, badge(p.status === 'Connected', p.status, p.status || '-')),
				E('td', { 'class': 'td' }, p.connectionType || '-'),
				E('td', { 'class': 'td' }, fmtLatency(p.latency)),
				E('td', { 'class': 'td' }, fmtBytes(p.transferReceived) + ' / ' + fmtBytes(p.transferSent))
			]));
		});

		if (!list.length)
			rows.push(E('tr', { 'class': 'tr placeholder' }, E('td', { 'class': 'td', 'colspan': 6 }, E('em', _('No peers')))));

		return E('table', { 'class': 'table' }, rows);
	},

	renderJob: function(j) {
		if (!j || (!j.running && !j.log))
			return E('div');
		return E('div', { 'class': 'cbi-section' }, [
			E('h3', (j.running ? _('Running task: ') : _('Last task: ')) + (j.name || '')),
			E('pre', { 'style': 'max-height:260px;overflow:auto;white-space:pre-wrap' }, j.log || '')
		]);
	},

	refresh: function() {
		var self = this;
		return Promise.all([
			run(['status']).catch(function(e) { return { error: e.message }; }),
			run(['job']).catch(function() { return null; })
		]).then(function(r) {
			var d = r[0], j = r[1];
			var s = document.getElementById('nb-status'),
			    p = document.getElementById('nb-peers'),
			    jb = document.getElementById('nb-job');
			if (s) s.replaceChildren(d.error ? E('p', { 'class': 'alert-message warning' }, d.error) : self.renderStatus(d));
			if (p) p.replaceChildren(self.renderPeers(d));
			if (jb) jb.replaceChildren(self.renderJob(j));
			if (self.jobWasRunning && j && !j.running) {
				self.jobWasRunning = false;
				var ok = /DONE\s*$/.test(j.log || '');
				ui.addNotification(null, E('p', ok ? _('Task finished successfully.') : _('Task failed, see the output below.')), ok ? 'info' : 'danger');
			}
			if (j && j.running) self.jobWasRunning = true;
		});
	},

	render: function(d) {
		var self = this;

		var actions = E('div', { 'class': 'cbi-section' }, [
			E('h3', _('Actions')),
			E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:8px;align-items:center' }, [
				E('button', { 'class': 'btn cbi-button cbi-button-positive', 'click': ui.createHandlerFn(this, 'handleUp') },
					_('Connect / apply settings')),
				E('button', { 'class': 'btn cbi-button', 'click': ui.createHandlerFn(this, 'handleDown') }, _('Disconnect')),
				E('button', { 'class': 'btn cbi-button cbi-button-negative', 'click': ui.createHandlerFn(this, 'handleStop') },
					_('Stop & disable')),
				E('button', { 'class': 'btn cbi-button cbi-button-remove', 'click': ui.createHandlerFn(this, 'handleDeregister') },
					_('Deregister peer'))
			]),
			E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px' }, [
				E('input', { 'id': 'nb-version', 'class': 'cbi-input-text', 'placeholder': 'latest', 'style': 'width:10em' }),
				E('button', { 'class': 'btn cbi-button cbi-button-action', 'click': ui.createHandlerFn(this, 'handleInstall') },
					d.installed ? _('Update NetBird binary') : _('Install NetBird binary')),
				E('span', { 'class': 'cbi-value-description' },
					_('Downloads the official release from GitHub, verifies its SHA-256 checksum and installs it to /usr/bin/netbird.'))
			])
		]);

		poll.add(function() { return self.refresh(); }, 5);
		window.setTimeout(function() { self.refresh(); }, 0);

		return E('div', {}, [
			E('h2', _('NetBird')),
			E('div', { 'class': 'cbi-map-descr' },
				_('NetBird mesh VPN client. Set the management URL and setup key under Settings, then press Connect.')),
			E('div', { 'class': 'cbi-section' }, [ E('h3', _('Status')), E('div', { 'id': 'nb-status' }, d.error ? E('p', d.error) : this.renderStatus(d)) ]),
			actions,
			E('div', { 'id': 'nb-job' }),
			E('div', { 'class': 'cbi-section' }, [ E('h3', _('Peers')), E('div', { 'id': 'nb-peers' }, this.renderPeers(d)) ])
		]);
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});

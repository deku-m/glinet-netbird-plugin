'use strict';
'require view';
'require form';

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('netbird', _('NetBird settings'),
			_('After saving, go to Status and press "Connect / apply settings" so NetBird and the firewall zone pick up the new options.'));

		s = m.section(form.NamedSection, 'main', 'netbird');
		s.tab('general', _('General'));
		s.tab('network', _('Network'));
		s.tab('firewall', _('Firewall'));

		o = s.taboption('general', form.Flag, 'enabled', _('Start at boot'));
		o.rmempty = false;

		o = s.taboption('general', form.Value, 'management_url', _('Management URL'),
			_('Use https://api.netbird.io:443 for NetBird Cloud, or the URL of your self-hosted management server.'));
		o.placeholder = 'https://api.netbird.io:443';
		o.validate = function(id, v) {
			return (!v || /^https?:\/\/[^\s]+$/.test(v)) ? true : _('Must start with http:// or https://');
		};

		o = s.taboption('general', form.Value, 'setup_key', _('Setup key'),
			_('Only needed to register the router the first time.'));
		o.password = true;

		o = s.taboption('general', form.Flag, 'clear_setup_key', _('Forget setup key after registering'));
		o.default = '1';

		o = s.taboption('general', form.Value, 'hostname', _('Peer name'),
			_('Name shown in the NetBird dashboard. Empty uses the system hostname.'));
		o.datatype = 'hostname';

		o = s.taboption('general', form.ListValue, 'log_level', _('Log level'));
		['error', 'warn', 'info', 'debug', 'trace'].forEach(function(l) { o.value(l); });
		o.default = 'info';

		o = s.taboption('network', form.Value, 'wireguard_port', _('WireGuard port'));
		o.datatype = 'port';
		o.placeholder = '51820';

		o = s.taboption('network', form.Flag, 'network_monitor', _('Follow uplink changes'),
			_('Reconnect immediately when the default route changes (e.g. failover between cable, repeater and 5G/LTE). Off by default in NetBird on Linux.'));
		o.default = '1';

		o = s.taboption('network', form.Flag, 'disable_dns', _('Do not manage DNS'),
			_('Recommended on GL.iNet: dnsmasq already owns port 53. Leave on unless you forward the NetBird domain yourself.'));
		o.default = '1';

		o = s.taboption('network', form.Flag, 'disable_client_routes', _('Ignore routes from other peers'),
			_('Do not install network routes / exit nodes advertised by other peers.'));

		o = s.taboption('network', form.Flag, 'disable_server_routes', _('Do not act as routing peer'),
			_('Refuse to route traffic for networks this router is assigned as routing peer for.'));

		o = s.taboption('network', form.Flag, 'block_inbound', _('Block inbound'),
			_('Block all inbound connections from NetBird peers to this router and its LAN.'));

		o = s.taboption('network', form.Flag, 'allow_server_ssh', _('Enable NetBird SSH server'));

		o = s.taboption('network', form.Value, 'extra_args', _('Extra "netbird up" arguments'),
			_('Advanced, e.g. "--mtu 1280". Split on spaces.'));

		o = s.taboption('firewall', form.Flag, 'firewall_zone', _('Create firewall zone'),
			_('Adds interface "netbird" (wt0) and firewall zone "netbird".'));
		o.default = '1';

		o = s.taboption('firewall', form.Flag, 'lan_to_netbird', _('Allow LAN → NetBird'),
			_('LAN clients can reach NetBird peers.'));
		o.default = '1';
		o.depends('firewall_zone', '1');

		o = s.taboption('firewall', form.Flag, 'netbird_to_lan', _('Allow NetBird → LAN'),
			_('NetBird peers can reach the LAN (needed when this router is a routing peer for its LAN).'));
		o.default = '1';
		o.depends('firewall_zone', '1');

		o = s.taboption('firewall', form.Flag, 'masquerade', _('Masquerade'),
			_('NAT LAN traffic to the router\'s NetBird IP, so peers need no route back to the LAN.'));
		o.default = '1';
		o.depends('firewall_zone', '1');

		return m.render();
	}
});

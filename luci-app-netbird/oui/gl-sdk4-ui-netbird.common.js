module.exports = (function () {
  'use strict';

  // GL.iNet 4.x admin panel view for NetBird (Applications > NetBird).
  // Vue 2 render functions only: the panel provides Vue globally and loads
  // this file from /www/views/gl-sdk4-ui-netbird.common.js.gz.

  var C = {
    primary: '#2f7df6',
    green: '#21a366',
    amber: '#e8a317',
    red: '#e04a4a',
    text: '#2b2f36',
    sub: '#7b8494',
    line: '#eef0f3',
    bg: '#f6f7f9'
  };

  var CARD = {
    background: '#fff',
    borderRadius: '10px',
    padding: '18px 20px',
    marginBottom: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
  };

  function rpc(method, params) {
    return window.$rpcRequest('call', ['sid', 'netbird', method, params || {}]);
  }

  function errText(e) {
    var t;
    if (!e) t = 'Request failed';
    else if (typeof e === 'string') t = e;
    else t = e.message || e.error || JSON.stringify(e);
    // page is newer than the backend the router has loaded (nginx caches it)
    if (/method not found/i.test(t))
      t = 'The router is still running the previous version of this plugin. Reboot the router (System > Reboot) and try again.';
    return t;
  }

  function fmtBytes(n) {
    n = Number(n) || 0;
    var u = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return n.toFixed(i ? 1 : 0) + ' ' + u[i];
  }

  function fmtLatency(ns) {
    ns = Number(ns) || 0;
    return ns ? (ns / 1e6).toFixed(0) + ' ms' : '—';
  }

  function pill(h, color, text) {
    return h('span', {
      style: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
        color: color, background: color + '1a', whiteSpace: 'nowrap'
      }
    }, [
      h('span', { style: { width: '7px', height: '7px', borderRadius: '50%', background: color } }),
      text
    ]);
  }

  function btn(h, label, onClick, kind, disabled) {
    var styles = {
      primary: { background: C.primary, color: '#fff', border: '1px solid ' + C.primary },
      danger: { background: '#fff', color: C.red, border: '1px solid ' + C.red },
      plain: { background: '#fff', color: C.text, border: '1px solid #d5d9e0' }
    };
    return h('button', {
      attrs: { type: 'button', disabled: !!disabled },
      style: Object.assign({
        padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
        lineHeight: '18px'
      }, styles[kind || 'plain']),
      on: { click: function () { if (!disabled) onClick(); } }
    }, label);
  }

  function toggle(h, value, onChange, disabled) {
    return h('span', {
      attrs: { role: 'switch', 'aria-checked': value ? 'true' : 'false', tabindex: 0 },
      style: {
        position: 'relative', display: 'inline-block', width: '40px', height: '22px', flex: '0 0 auto',
        borderRadius: '11px', background: value ? C.primary : '#c9ced6',
        cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background .15s',
        opacity: disabled ? 0.5 : 1
      },
      on: {
        click: function () { if (!disabled) onChange(!value); },
        keydown: function (e) {
          if (!disabled && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); onChange(!value); }
        }
      }
    }, [h('span', {
      style: {
        position: 'absolute', top: '2px', left: value ? '20px' : '2px', width: '18px', height: '18px',
        borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 2px rgba(0,0,0,.25)'
      }
    })]);
  }

  function field(h, label, help, control) {
    return h('div', {
      style: {
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px',
        padding: '12px 0', borderBottom: '1px solid ' + C.line
      }
    }, [
      h('div', { style: { flex: '1 1 220px', minWidth: '0' } }, [
        h('div', { style: { fontSize: '14px', color: C.text } }, label),
        help ? h('div', { style: { fontSize: '12px', color: C.sub, marginTop: '3px', lineHeight: '1.45' } }, help) : null
      ]),
      h('div', { style: { flex: '1 1 260px', display: 'flex', justifyContent: 'flex-end', minWidth: '0' } }, [control])
    ]);
  }

  function input(h, value, onInput, opts) {
    opts = opts || {};
    return h('input', {
      attrs: { type: opts.type || 'text', placeholder: opts.placeholder || '', autocomplete: 'off', spellcheck: 'false' },
      domProps: { value: value },
      style: {
        width: '100%', maxWidth: '340px', boxSizing: 'border-box', padding: '8px 10px',
        border: '1px solid #d5d9e0', borderRadius: '6px', fontSize: '13px', color: C.text, background: '#fff'
      },
      on: { input: function (e) { onInput(e.target.value); } }
    });
  }

  function select(h, value, options, onChange) {
    return h('select', {
      domProps: { value: value },
      style: {
        width: '100%', maxWidth: '340px', padding: '8px 10px', border: '1px solid #d5d9e0',
        borderRadius: '6px', fontSize: '13px', background: '#fff', color: C.text
      },
      on: { change: function (e) { onChange(e.target.value); } }
    }, options.map(function (o) { return h('option', { attrs: { value: o } }, o); }));
  }

  function cardTitle(h, text, right) {
    return h('div', {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }
    }, [h('div', { style: { fontSize: '15px', fontWeight: '600', color: C.text } }, text), right || null]);
  }

  function kv(h, label, value) {
    return h('div', { style: { padding: '10px 12px', background: C.bg, borderRadius: '8px', minWidth: '0' } }, [
      h('div', { style: { fontSize: '12px', color: C.sub, marginBottom: '3px' } }, label),
      h('div', { style: { fontSize: '14px', color: C.text, fontWeight: '500', wordBreak: 'break-all' } }, value)
    ]);
  }

  var FORM_KEYS = [
    'enabled', 'management_url', 'hostname', 'wireguard_port', 'log_level', 'extra_args',
    'clear_setup_key', 'network_monitor', 'disable_dns', 'disable_client_routes', 'disable_server_routes',
    'block_inbound', 'allow_server_ssh', 'firewall_zone', 'lan_to_netbird', 'netbird_to_lan', 'masquerade'
  ];

  return {
    name: 'NetbirdView',

    data: function () {
      return {
        st: null,
        loading: true,
        loadError: null,
        form: null,
        dirty: false,
        setupKey: '',
        showAdvanced: false,
        showKey: false,
        plugin: null,
        client: null,
        clientChecking: false,
        pluginChecking: false,
        repoInput: null,
        pluginUpdated: false,
        storedKey: null,
        busy: false,
        notice: null,
        job: null,
        jobActive: false,
        version: '',
        showLog: false,
        confirmUninstall: false,
        uninstallDeregister: true,
        uninstalling: false,
        uninstalled: false,
        log: '',
        statusTimer: null,
        jobTimer: null
      };
    },

    created: function () {
      this.refresh();
      this.checkPlugin();
      this.checkClient();
      this.statusTimer = setInterval(this.pollStatus, 5000);
      document.addEventListener('visibilitychange', this.onVisible);
    },

    beforeDestroy: function () {
      clearInterval(this.statusTimer);
      clearInterval(this.jobTimer);
      document.removeEventListener('visibilitychange', this.onVisible);
    },

    computed: {
      state: function () {
        var d = this.st;
        if (!d) return { key: 'loading', color: C.sub, text: 'Loading' };
        if (!d.installed) return { key: 'missing', color: C.sub, text: 'Not installed' };
        if (!d.running) return { key: 'stopped', color: C.sub, text: 'Stopped' };
        var s = d.status || {}, m = s.management || {};
        // NetBird's own state; the fallback guess is only for clients that do not report it
        var map = {
          Connected: { key: 'connected', color: C.green, text: 'Connected' },
          Connecting: { key: 'connecting', color: C.amber, text: 'Connecting' },
          Idle: { key: 'idle', color: C.sub, text: 'Disconnected' },
          NeedsLogin: { key: 'login', color: C.amber, text: 'Needs setup key' },
          LoginFailed: { key: 'failed', color: C.red, text: 'Login failed' },
          SessionExpired: { key: 'failed', color: C.red, text: 'Session expired' }
        };
        if (map[s.daemonStatus]) return map[s.daemonStatus];
        if (m.connected && s.netbirdIp) return map.Connected;
        if (d.config && !d.config.has_setup_key && !s.netbirdIp && !m.connected) return map.NeedsLogin;
        return map.Connecting;
      }
    },

    methods: {
      say: function (type, text) {
        this.notice = { type: type, text: text };
        var self = this;
        clearTimeout(this._noticeT);
        if (type !== 'error') this._noticeT = setTimeout(function () { self.notice = null; }, 6000);
      },

      // every status call starts the netbird CLI on the router: skip it while
      // the tab is in the background and catch up as soon as it is visible
      pollStatus: function () {
        if (!document.hidden) this.refresh();
      },

      onVisible: function () {
        if (!document.hidden) this.refresh();
      },

      refresh: function () {
        var self = this;
        if (self.uninstalling || self.uninstalled) return Promise.resolve();
        return rpc('status').then(function (d) {
          self.st = d || {};
          self.loading = false;
          self.loadError = null;
          if (!self.dirty && d && d.config) self.loadForm(d.config);
          if (d && d.job_running && !self.jobActive) self.watchJob();
        }).catch(function (e) {
          self.loading = false;
          self.loadError = errText(e);
        });
      },

      loadForm: function (cfg) {
        var f = {};
        FORM_KEYS.forEach(function (k) { f[k] = cfg[k]; });
        if (!f.log_level) f.log_level = 'info';
        this.form = f;
      },

      set: function (k, v) {
        this.form[k] = v;
        this.dirty = true;
      },

      watchJob: function () {
        var self = this;
        self.jobActive = true;
        clearInterval(self.jobTimer);
        var fails = 0;
        var tick = function () {
          rpc('job').then(function (j) {
            fails = 0;
            self.job = j;
            if (j && !j.running && self.uninstalling) {
              self.finishUninstall(/DONE\s*$/.test(j.log || ''));
            } else if (j && !j.running) {
              clearInterval(self.jobTimer);
              self.jobActive = false;
              var ok = /DONE\s*$/.test(j.log || '');
              var isPlugin = /^plugin_/.test(j.name || '');
              if (j.name === 'install') self.checkClient();
              if (ok && isPlugin) { self.pluginUpdated = true; self.notice = null; }
              else self.say(ok ? 'success' : 'error', ok ? (j.name === 'install' ? 'NetBird installed.' : 'NetBird is connecting.') :
                'The task failed, see the output below.');
              self.refresh();
            }
          }).catch(function () {
            // the uninstall removes this page's backend, so lost contact means it got that far
            if (self.uninstalling && ++fails >= 2) self.finishUninstall(true);
          });
        };
        tick();
        self.jobTimer = setInterval(tick, 2000);
      },

      startJob: function (method, params) {
        var self = this;
        self.busy = true;
        return rpc(method, params).then(function (r) {
          self.busy = false;
          if (r && r.started) {
            self.job = { running: true, name: method === 'plugin_upload' ? 'plugin_install_file' : method, log: '' };
            self.watchJob();
          }
          else self.say('error', (r && r.error) || 'Could not start task');
        }).catch(function (e) { self.busy = false; self.say('error', errText(e)); });
      },

      simple: function (method, okText) {
        var self = this;
        self.busy = true;
        return rpc(method).then(function (r) {
          self.busy = false;
          if (r && r.ok === false) self.say('error', r.error || 'Failed');
          else self.say('success', okText);
          self.refresh();
        }).catch(function (e) { self.busy = false; self.say('error', errText(e)); });
      },

      save: function (connectAfter) {
        var self = this;
        var params = Object.assign({}, self.form);
        if (self.setupKey) params.setup_key = self.setupKey.trim();
        if (connectAfter) params.enabled = true;
        self.busy = true;
        return rpc('set_config', params).then(function (r) {
          self.busy = false;
          if (!r || r.ok === false) { self.say('error', (r && r.error) || 'Saving failed'); return; }
          self.dirty = false;
          self.setupKey = '';
          self.storedKey = null;
          if (r.config) self.loadForm(r.config);
          if (connectAfter) return self.startJob('up');
          self.say('success', 'Settings saved. Press Connect to apply them to NetBird.');
          self.refresh();
        }).catch(function (e) { self.busy = false; self.say('error', errText(e)); });
      },

      // Update checks answer at once; while the router looks things up in the
      // background they return {checking: true} and the page asks again.
      pollCheck: function (method, fresh, done, tries) {
        var self = this;
        tries = tries || 0;
        return rpc(method, fresh ? { fresh: true } : {}).then(function (r) {
          if (r && r.checking && tries < 15) {
            setTimeout(function () { if (!self._isDestroyed) self.pollCheck(method, false, done, tries + 1); }, 2000);
            return;
          }
          done(r && r.checking ? { error: 'The update check did not finish. Try again later.' } : r, null);
        }).catch(function (e) { done(null, e); });
      },

      checkClient: function (manual) {
        var self = this;
        self.clientChecking = true;
        self.pollCheck('client_check', !!manual, function (r, e) {
          self.clientChecking = false;
          if (e) { if (manual) self.say('error', errText(e)); return; }
          self.client = r || {};
          if (manual) {
            if (r && r.error) self.say('error', r.error);
            else if (r && !r.update_available) self.say('success', 'NetBird ' + (r.current || '') + ' is the latest version.');
          }
        });
      },

      setAutoUpdate: function (v) {
        var self = this;
        self.client = Object.assign({}, self.client || {}, { autoupdate: v });
        rpc('set_config', { client_autoupdate: v }).then(function (r) {
          if (!r || r.ok === false) { self.say('error', (r && r.error) || 'Saving failed'); self.checkClient(); return; }
          self.say('success', v ? 'NetBird will update itself every night when a new version is out.' : 'Automatic NetBird updates are off.');
        }).catch(function (e) { self.say('error', errText(e)); self.checkClient(); });
      },

      checkPlugin: function (manual) {
        var self = this;
        self.pluginChecking = true;
        self.pollCheck('plugin_check', !!manual, function (r, e) {
          self.pluginChecking = false;
          if (e) { if (manual) self.say('error', errText(e)); return; }
          self.plugin = r || {};
          if (self.repoInput === null) self.repoInput = (r && r.repo) || '';
          if (manual && r && r.repo) {
            if (r.error) self.say('error', r.error);
            else if (!r.update_available) self.say('success', 'The plugin is up to date (' + r.current + ').');
          }
        });
      },

      saveRepo: function () {
        var self = this;
        rpc('set_config', { update_repo: (self.repoInput || '').trim() }).then(function (r) {
          if (!r || r.ok === false) { self.say('error', (r && r.error) || 'Saving failed'); return; }
          self.repoInput = (r.config && r.config.update_repo) || '';
          self.checkPlugin(true);
        }).catch(function (e) { self.say('error', errText(e)); });
      },

      pickPackage: function () {
        var el = this.$refs.ipk;
        if (el) { el.value = ''; el.click(); }
      },

      uploadPackage: function (e) {
        var self = this, file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!/\.ipk$/i.test(file.name)) { self.say('error', 'Choose an .ipk file.'); return; }
        if (file.size > 4 * 1024 * 1024) { self.say('error', 'That file is too large for this plugin.'); return; }
        if (!window.confirm('Install ' + file.name + '?')) return;
        var reader = new FileReader();
        reader.onload = function () { self.sendPackage(new Uint8Array(reader.result)); };
        reader.onerror = function () { self.say('error', 'Could not read the file.'); };
        reader.readAsArrayBuffer(file);
      },

      // The panel's RPC layer refuses long strings and many characters, so the
      // file goes as lowercase hex in small chunks, one after the other.
      sendPackage: function (bytes) {
        var self = this, CHUNK = 4096;
        var total = Math.max(1, Math.ceil(bytes.length / CHUNK));
        var hexOf = function (from, to) {
          var out = '';
          for (var i = from; i < to; i++) out += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
          return out;
        };
        self.busy = true;
        var send = function (index) {
          var from = index * CHUNK, to = Math.min(bytes.length, from + CHUNK);
          self.notice = { type: 'info', text: 'Uploading package… ' + Math.round(100 * index / total) + '%' };
          return rpc('plugin_upload_chunk', { index: index, total: total, offset: from, hex: hexOf(from, to) }).then(function (r) {
            if (!r || r.ok === false) throw new Error((r && r.error) || 'Upload failed');
            if (index + 1 < total) return send(index + 1);
            self.busy = false;
            self.notice = null;
            if (r.started) { self.job = { running: true, name: 'plugin_install_file', log: '' }; self.watchJob(); }
            else self.say('error', r.error || 'Could not start installation');
          });
        };
        send(0).catch(function (e) { self.busy = false; self.say('error', errText(e)); });
      },

      // Eye button: shows what is typed; with an empty field it shows the stored key.
      toggleKey: function () {
        this.showKey = !this.showKey;
        var cfg = ((this.st || {}).config) || {};
        if (this.showKey && !this.setupKey && cfg.has_setup_key && this.storedKey === null) this.revealStoredKey();
        if (!this.showKey && !this.setupKey) this.storedKey = null;
      },

      revealStoredKey: function () {
        var self = this;
        if (self.storedKey !== null) { self.storedKey = null; return; }
        rpc('get_setup_key').then(function (r) {
          self.storedKey = (r && r.key) || '';
          if (!self.storedKey) self.say('info', 'No setup key is stored.');
        }).catch(function (e) { self.say('error', errText(e)); });
      },

      forgetKey: function () {
        var self = this;
        self.storedKey = null;
        rpc('set_config', { forget_setup_key: true }).then(function () {
          self.say('success', 'Stored setup key removed.');
          self.refresh();
        }).catch(function (e) { self.say('error', errText(e)); });
      },

      deregister: function () {
        if (!window.confirm('Remove this router from your NetBird network? You need a new setup key to join again.')) return;
        this.simple('deregister', 'Router removed from NetBird.');
      },

      stopAll: function () {
        if (!window.confirm('Stop NetBird and do not start it at boot?')) return;
        this.simple('stop', 'NetBird stopped.');
      },

      startUninstall: function () {
        var self = this;
        self.uninstalling = true;
        self.confirmUninstall = false;
        clearInterval(self.statusTimer);
        return rpc('uninstall', { deregister: self.uninstallDeregister }).then(function (r) {
          if (r && r.started) { self.job = { running: true, name: 'uninstall', log: '' }; self.watchJob(); }
          else { self.uninstalling = false; self.say('error', (r && r.error) || 'Could not start uninstall'); }
        }).catch(function (e) { self.uninstalling = false; self.say('error', errText(e)); });
      },

      finishUninstall: function (ok) {
        clearInterval(this.jobTimer);
        clearInterval(this.statusTimer);
        this.jobActive = false;
        if (ok) { this.uninstalling = false; this.uninstalled = true; this.notice = null; }
        else { this.uninstalling = false; this.say('error', 'Uninstall failed, see the output below.'); }
      },

      toggleLog: function () {
        var self = this;
        self.showLog = !self.showLog;
        if (self.showLog) {
          rpc('logs', { lines: 300 }).then(function (r) { self.log = (r && r.log) || ''; })
            .catch(function (e) { self.log = errText(e); });
        }
      },

      // ---------- render pieces ----------

      rHeader: function (h) {
        var self = this, s = self.state, d = self.st || {};
        var action = null;
        if (d.installed) {
          action = (s.key === 'connected' || s.key === 'connecting')
            ? btn(h, 'Disconnect', function () { self.simple('down', 'NetBird disconnected.'); }, 'plain', self.busy || self.jobActive)
            : btn(h, 'Connect', function () { self.dirty ? self.save(true) : self.startJob('up'); }, 'primary', self.busy || self.jobActive);
        }
        return h('div', { style: Object.assign({}, CARD, { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }) }, [
          h('div', {
            style: {
              width: '44px', height: '44px', borderRadius: '10px', background: '#f2a03d',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto'
            }
          }, [h('svg', { attrs: { viewBox: '0 0 24 24', width: 26, height: 26 } }, [
            h('path', { attrs: { fill: '#fff', d: 'M4 14.5 12 4l8 10.5-3.3.9L12 9.2l-4.7 6.2zM7.6 17.2 12 11.4l4.4 5.8L12 20z' } })
          ])]),
          h('div', { style: { flex: '1 1 200px', minWidth: '0' } }, [
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' } }, [
              h('span', { style: { fontSize: '18px', fontWeight: '600', color: C.text } }, 'NetBird'),
              pill(h, s.color, s.text)
            ]),
            h('div', { style: { fontSize: '13px', color: C.sub, marginTop: '4px' } },
              (s.key === 'connected' && d.status && d.status.netbirdIp)
                ? (d.status.netbirdIp.split('/')[0] + (d.status.fqdn ? ' · ' + d.status.fqdn : ''))
                : ({
                    idle: 'Disconnected. Press Connect to join your NetBird network again.',
                    login: 'Enter a setup key under Settings and press Save & connect.',
                    failed: 'Login was refused. Check the setup key and management URL, then connect again.'
                  })[s.key] || 'WireGuard-based mesh VPN. Connect this router to your NetBird network.')
          ]),
          action
        ]);
      },

      rNotice: function (h) {
        var n = this.notice;
        if (!n && !this.loadError) return null;
        var type = n ? n.type : 'error', text = n ? n.text : this.loadError;
        var col = type === 'error' ? C.red : (type === 'success' ? C.green : C.primary);
        return h('div', {
          style: {
            marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
            color: col, background: col + '14', border: '1px solid ' + col + '40', wordBreak: 'break-word'
          }
        }, text);
      },

      rInstall: function (h) {
        var self = this;
        return h('div', { style: CARD }, [
          cardTitle(h, 'Install NetBird'),
          h('p', { style: { fontSize: '13px', color: C.sub, margin: '4px 0 14px', lineHeight: '1.5' } },
            'Downloads the official NetBird client for this router (' + (self.st.arch || '?') +
            ') from GitHub, checks its SHA-256 checksum and installs it. Needs internet access and about 40 MB of storage.'),
          btn(h, 'Install latest version', function () { self.startJob('install', { version: 'latest' }); }, 'primary', self.busy || self.jobActive)
        ]);
      },

      rJob: function (h) {
        var j = this.job;
        if (!j || (!j.running && !j.log)) return null;
        var ok = /DONE\s*$/.test(j.log || '');
        var names = j.running ? {
          install: 'Installing NetBird…', uninstall: 'Uninstalling NetBird…', up: 'Connecting…',
          plugin_update: 'Updating plugin…', plugin_install_file: 'Installing plugin package…'
        } : ok ? {
          install: 'NetBird installed', uninstall: 'NetBird removed', up: 'Connected',
          plugin_update: 'Plugin updated', plugin_install_file: 'Plugin package installed'
        } : {
          install: 'Installation failed', uninstall: 'Uninstall failed', up: 'Connection failed',
          plugin_update: 'Plugin update failed', plugin_install_file: 'Plugin install failed'
        };
        var title = names[j.name] || (j.running ? 'Working…' : 'Task output');
        return h('div', { style: CARD }, [
          cardTitle(h, title, j.running ? pill(h, C.amber, 'Running') : btnClose(this, h)),
          h('pre', {
            style: {
              margin: '8px 0 0', padding: '10px 12px', background: '#1f2329', color: '#d7dde6',
              borderRadius: '8px', fontSize: '12px', maxHeight: '220px', overflow: 'auto', whiteSpace: 'pre-wrap'
            }
          }, j.log || 'Starting…')
        ]);

        function btnClose(self, h) {
          return h('span', {
            style: { cursor: 'pointer', color: C.sub, fontSize: '13px' },
            on: { click: function () { self.job = null; } }
          }, 'Hide');
        }
      },

      rStatus: function (h) {
        var d = this.st || {}, s = d.status || {}, m = s.management || {}, sg = s.signal || {}, p = s.peers || {};
        var items = [
          kv(h, 'NetBird IP', s.netbirdIp || '—'),
          kv(h, 'Domain name', s.fqdn || '—'),
          kv(h, 'Management', m.url ? (m.connected ? 'Connected' : 'Not connected') : '—'),
          kv(h, 'Signal', s.netbirdIp ? (sg.connected ? 'Connected' : 'Not connected') : '—'),
          kv(h, 'Peers online', p.total != null ? (p.connected + ' of ' + p.total) : '—'),
          kv(h, 'Client version', d.version || '—')
        ];
        return h('div', { style: CARD }, [
          cardTitle(h, 'Status'),
          h('div', {
            style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginTop: '10px' }
          }, items),
          (m.error && !m.connected)
            ? h('div', { style: { fontSize: '12px', color: C.red, marginTop: '10px', wordBreak: 'break-word' } }, m.error)
            : null
        ]);
      },

      rPeers: function (h) {
        var list = ((((this.st || {}).status || {}).peers || {}).details || []).slice();
        list.sort(function (a, b) {
          var ca = a.status === 'Connected' ? 0 : 1, cb = b.status === 'Connected' ? 0 : 1;
          return ca - cb || (a.fqdn || '').localeCompare(b.fqdn || '');
        });
        var rows = list.map(function (p) {
          var on = p.status === 'Connected';
          var name = (p.fqdn || p.netbirdIp || '').split('.')[0];
          return h('div', {
            style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: '1px solid ' + C.line, flexWrap: 'wrap' }
          }, [
            h('span', { style: { width: '8px', height: '8px', borderRadius: '50%', background: on ? C.green : '#c9ced6', flex: '0 0 auto' } }),
            h('div', { style: { flex: '1 1 0', minWidth: '0' } }, [
              h('div', { style: { fontSize: '14px', color: C.text, fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, name || '—'),
              h('div', { style: { fontSize: '12px', color: C.sub } }, p.netbirdIp || '')
            ]),
            h('div', { style: { fontSize: '12px', color: C.sub, textAlign: 'right', flex: '0 0 auto', marginLeft: 'auto' } }, on ? [
              h('div', {}, (p.connectionType || '') + ' · ' + fmtLatency(p.latency)),
              h('div', {}, '↓ ' + fmtBytes(p.transferReceived) + '  ↑ ' + fmtBytes(p.transferSent))
            ] : [h('div', {}, p.status || 'Offline')])
          ]);
        });
        return h('div', { style: CARD }, [
          cardTitle(h, 'Peers'),
          rows.length ? h('div', {}, rows)
            : h('div', { style: { fontSize: '13px', color: C.sub, padding: '10px 0' } }, 'No peers yet.')
        ]);
      },

      rSettings: function (h) {
        var self = this, f = self.form, cfg = ((self.st || {}).config) || {};
        if (!f) return null;
        var t = function (key, label, help, disabled) {
          return field(h, label, help, toggle(h, !!f[key], function (v) { self.set(key, v); }, disabled));
        };

        var keyHelp = cfg.has_setup_key
          ? 'A setup key is stored and will be used on the next Connect.'
          : 'Only needed the first time. Create one in the NetBird dashboard under Setup Keys.';

        var basic = [
          field(h, 'Management URL', 'NetBird Cloud: https://api.netbird.io:443. Self-hosted: your own management URL.',
            input(h, f.management_url, function (v) { self.set('management_url', v); }, { placeholder: 'https://api.netbird.io:443' })),
          field(h, 'Setup key', keyHelp,
            h('div', { style: { width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' } }, [
              h('div', { style: { position: 'relative', width: '100%' } }, [
                h('input', {
                  attrs: {
                    type: self.showKey ? 'text' : 'password', autocomplete: 'off', spellcheck: 'false',
                    placeholder: cfg.has_setup_key ? '•••••••• (stored)' : 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
                  },
                  domProps: { value: self.setupKey },
                  style: {
                    width: '100%', boxSizing: 'border-box', padding: '8px 40px 8px 10px', border: '1px solid #d5d9e0',
                    borderRadius: '6px', fontSize: '13px', color: C.text, background: '#fff',
                    fontFamily: self.showKey ? 'ui-monospace, Menlo, Consolas, monospace' : 'inherit'
                  },
                  on: { input: function (e) { self.setupKey = e.target.value; self.dirty = true; } }
                }),
                h('span', {
                  attrs: { role: 'button', tabindex: 0, title: self.showKey ? 'Hide key' : 'Show key', 'aria-label': self.showKey ? 'Hide key' : 'Show key' },
                  style: {
                    position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', width: '28px', height: '28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.sub
                  },
                  on: {
                    click: function () { self.toggleKey(); },
                    keydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.toggleKey(); } }
                  }
                }, [h('svg', { attrs: { viewBox: '0 0 24 24', width: 18, height: 18, fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' } },
                  self.showKey
                    ? [h('path', { attrs: { d: 'M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c5 0 9 4.5 10 6-.4.7-1.4 2-2.9 3.3M6.6 6.6C4.4 8 2.8 10.1 2 12c1 1.5 5 6 10 6 1.6 0 3.1-.5 4.4-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2' } })]
                    : [h('path', { attrs: { d: 'M2 12c1-1.5 5-6 10-6s9 4.5 10 6c-1 1.5-5 6-10 6S3 13.5 2 12z' } }), h('circle', { attrs: { cx: 12, cy: 12, r: 3 } })]
                )])
              ]),
              self.storedKey ? h('div', {
                style: {
                  width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '6px', background: C.bg,
                  fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: '13px', color: C.text, wordBreak: 'break-all',
                  userSelect: 'all'
                }
              }, self.storedKey) : null,
              cfg.has_setup_key ? h('div', { style: { display: 'flex', gap: '14px' } }, [
                h('a', {
                  attrs: { href: 'javascript:void(0)' }, style: { fontSize: '12px', color: C.primary },
                  on: { click: self.revealStoredKey }
                }, self.storedKey ? 'Hide stored key' : 'Show stored key'),
                h('a', {
                  attrs: { href: 'javascript:void(0)' }, style: { fontSize: '12px', color: C.primary },
                  on: { click: self.forgetKey }
                }, 'Remove stored key')
              ]) : null
            ])),
          field(h, 'Peer name', 'Name shown in the NetBird dashboard. Empty uses the router hostname.',
            input(h, f.hostname, function (v) { self.set('hostname', v); }, { placeholder: 'mudi7' })),
          t('enabled', 'Start at boot', 'Reconnect automatically after a reboot.'),
          t('network_monitor', 'Follow uplink changes', 'Reconnect right away when the router switches between cable, repeater and 5G.')
        ];

        var adv = !self.showAdvanced ? [] : [
          h('div', { style: { fontSize: '13px', fontWeight: '600', color: C.text, margin: '18px 0 2px' } }, 'Network'),
          t('disable_dns', 'Do not manage DNS', 'Recommended: the router\'s own DNS (dnsmasq) keeps port 53.'),
          t('disable_client_routes', 'Ignore routes from other peers', 'Do not use network routes or exit nodes offered by other peers.'),
          t('disable_server_routes', 'Do not act as routing peer', 'Refuse to route traffic for networks assigned to this router.'),
          t('block_inbound', 'Block inbound connections', 'Peers cannot reach this router or its LAN.'),
          t('allow_server_ssh', 'NetBird SSH server', 'Allow SSH to this router over NetBird.'),
          field(h, 'WireGuard port', null,
            input(h, f.wireguard_port, function (v) { self.set('wireguard_port', v); }, { placeholder: '51820' })),
          field(h, 'Log level', null,
            select(h, f.log_level || 'info', ['error', 'warn', 'info', 'debug', 'trace'], function (v) { self.set('log_level', v); })),
          field(h, 'Extra arguments', 'Advanced options for "netbird up", e.g. --mtu 1280',
            input(h, f.extra_args, function (v) { self.set('extra_args', v); })),
          t('clear_setup_key', 'Forget setup key after joining', 'Removes the key from the router once registration succeeded.'),
          h('div', { style: { fontSize: '13px', fontWeight: '600', color: C.text, margin: '18px 0 2px' } }, 'Firewall'),
          t('firewall_zone', 'Create firewall zone', 'Adds interface "netbird" (wt0) and a firewall zone for it.'),
          t('lan_to_netbird', 'Allow LAN → NetBird', 'Devices on this router can reach NetBird peers.', !f.firewall_zone),
          t('netbird_to_lan', 'Allow NetBird → LAN', 'Peers can reach devices on this router\'s LAN (needed as routing peer).', !f.firewall_zone),
          t('masquerade', 'Masquerade (NAT)', 'LAN traffic uses the router\'s NetBird IP, so peers need no return route.', !f.firewall_zone)
        ];

        return h('div', { style: CARD }, [
          cardTitle(h, 'Settings'),
          h('div', {}, basic),
          h('div', {
            style: { marginTop: '12px', fontSize: '13px', color: C.primary, cursor: 'pointer', userSelect: 'none' },
            on: { click: function () { self.showAdvanced = !self.showAdvanced; } }
          }, (self.showAdvanced ? '▾ ' : '▸ ') + 'Advanced settings'),
          h('div', {}, adv),
          h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', flexWrap: 'wrap' } }, [
            self.dirty ? btn(h, 'Discard', function () { self.dirty = false; self.setupKey = ''; self.loadForm(cfg); }, 'plain', self.busy) : null,
            btn(h, 'Save', function () { self.save(false); }, 'plain', self.busy || !self.dirty),
            btn(h, 'Save & connect', function () { self.save(true); }, 'primary', self.busy || self.jobActive)
          ])
        ]);
      },

      rMaintenance: function (h) {
        var self = this;
        return h('div', { style: CARD }, [
          cardTitle(h, 'Maintenance'),
          self.rClient(h),
          self.rPlugin(h),
          field(h, 'Client log', 'Last 300 lines of the NetBird log.',
            btn(h, self.showLog ? 'Hide log' : 'Show log', self.toggleLog, 'plain')),
          self.showLog ? h('pre', {
            style: {
              margin: '10px 0', padding: '10px 12px', background: '#1f2329', color: '#d7dde6', borderRadius: '8px',
              fontSize: '11px', maxHeight: '320px', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
            }
          }, self.log || 'Loading…') : null,
          h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '16px' } }, [
            btn(h, 'Stop & disable', self.stopAll, 'plain', self.busy || self.uninstalling),
            btn(h, 'Remove from network', self.deregister, 'danger', self.busy || self.uninstalling || !(self.st && self.st.running)),
            btn(h, 'Uninstall', function () { self.confirmUninstall = true; }, 'danger', self.busy || self.jobActive || self.uninstalling)
          ]),
          self.confirmUninstall ? self.rUninstallConfirm(h) : null
        ]);
      },

      rClient: function (h) {
        var self = this, cl = self.client || {};
        var busy = self.busy || self.jobActive || self.uninstalling;
        var line;
        if (self.clientChecking) line = 'Checking for a new NetBird version…';
        else if (cl.update_available) line = 'Installed ' + cl.current + ' · version ' + cl.latest + ' is available.';
        else if (cl.latest) line = 'Installed ' + (cl.current || '?') + ' · up to date.';
        else line = cl.error || 'Official release, checked against its SHA-256 checksum.';
        return h('div', {}, [
          field(h, 'NetBird client', line,
            h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' } }, [
              cl.update_available
                ? btn(h, 'Update to ' + cl.latest, function () { self.startJob('install', { version: cl.latest }); }, 'primary', busy)
                : btn(h, 'Check for updates', function () { self.checkClient(true); }, 'plain', busy || self.clientChecking)
            ])),
          field(h, 'Update NetBird automatically', 'Checks every night around 04:00 and installs a new NetBird release. Settings and registration are kept.',
            toggle(h, !!cl.autoupdate, self.setAutoUpdate, busy)),
          field(h, 'Install a specific version', 'For example to go back to an older NetBird release.',
            h('div', { style: { display: 'flex', gap: '8px', width: '100%', maxWidth: '340px' } }, [
              input(h, self.version, function (v) { self.version = v; }, { placeholder: 'e.g. 0.60.1' }),
              btn(h, 'Install', function () { self.startJob('install', { version: (self.version || 'latest').trim() }); }, 'plain', busy || !(self.version || '').trim())
            ]))
        ]);
      },

      rPlugin: function (h) {
        var self = this, pl = self.plugin || {};
        var busy = self.busy || self.jobActive || self.uninstalling;
        var verText = pl.current ? ('Version ' + pl.current) : 'Version unknown';
        var stateLine;
        if (self.pluginChecking) stateLine = 'Checking for updates…';
        else if (pl.update_available) stateLine = 'Version ' + pl.latest + ' is available.';
        else if (pl.latest) stateLine = 'Up to date.';
        else if (pl.repo && pl.error) stateLine = pl.error;
        else stateLine = 'Set an update source to check for new versions, or install a package file.';

        return h('div', {}, [
          field(h, 'NetBird plugin', verText + ' · ' + stateLine,
            h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' } }, [
              pl.update_available
                ? btn(h, 'Update to ' + pl.latest, function () {
                    if (window.confirm('Update the plugin to ' + pl.latest + '? Your settings are kept.')) self.startJob('plugin_update');
                  }, 'primary', busy)
                : btn(h, 'Check for updates', function () { self.checkPlugin(true); }, 'plain', busy || self.pluginChecking || !pl.repo),
              btn(h, 'Upload .ipk', self.pickPackage, 'plain', busy),
              h('input', {
                ref: 'ipk', attrs: { type: 'file', accept: '.ipk' }, style: { display: 'none' },
                on: { change: self.uploadPackage }
              })
            ])),
          field(h, 'Update source', 'GitHub repository with plugin releases, e.g. yourname/netbird-glinet.',
            h('div', { style: { display: 'flex', gap: '8px', width: '100%', maxWidth: '340px' } }, [
              input(h, self.repoInput || '', function (v) { self.repoInput = v; }, { placeholder: 'owner/repo' }),
              btn(h, 'Save', self.saveRepo, 'plain', busy || (self.repoInput || '') === (pl.repo || ''))
            ]))
        ]);
      },

      rUninstallConfirm: function (h) {
        var self = this;
        return h('div', {
          style: { marginTop: '16px', padding: '14px 16px', borderRadius: '8px', border: '1px solid ' + C.red + '55', background: C.red + '0d' }
        }, [
          h('div', { style: { fontSize: '14px', fontWeight: '600', color: C.text } }, 'Uninstall NetBird?'),
          h('div', { style: { fontSize: '13px', color: C.sub, margin: '6px 0 4px', lineHeight: '1.5' } },
            'Removes the NetBird client, its settings, the firewall zone and this page. This cannot be undone.'),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' } }, [
            toggle(h, self.uninstallDeregister, function (v) { self.uninstallDeregister = v; }),
            h('span', { style: { fontSize: '13px', color: C.text } }, 'Also remove this router from my NetBird network')
          ]),
          h('div', { style: { display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' } }, [
            btn(h, 'Cancel', function () { self.confirmUninstall = false; }, 'plain'),
            h('button', {
              attrs: { type: 'button' },
              style: { padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                background: C.red, color: '#fff', border: '1px solid ' + C.red, lineHeight: '18px' },
              on: { click: self.startUninstall }
            }, 'Uninstall everything')
          ])
        ]);
      }
    },

    render: function (h) {
      var d = this.st;
      var body;
      if (this.pluginUpdated) {
        return h('div', { style: { padding: '16px', maxWidth: '820px', margin: '0 auto', boxSizing: 'border-box' } }, [
          h('div', { style: Object.assign({}, CARD, { textAlign: 'center', padding: '36px 20px' }) }, [
            h('div', { style: { fontSize: '18px', fontWeight: '600', color: C.text } }, 'Plugin updated'),
            h('div', { style: { fontSize: '13px', color: C.sub, margin: '8px 0 18px', lineHeight: '1.5' } },
              'Reload the page to load the new version. NetBird was restarted and reconnects by itself.'),
            btn(h, 'Reload', function () { window.location.reload(); }, 'primary')
          ])
        ]);
      }
      if (this.uninstalled) {
        var log = (this.job && this.job.log) || '';
        body = [h('div', { style: Object.assign({}, CARD, { textAlign: 'center', padding: '36px 20px' }) }, [
          h('div', { style: { fontSize: '18px', fontWeight: '600', color: C.text } }, 'NetBird has been removed'),
          h('div', { style: { fontSize: '13px', color: C.sub, margin: '8px 0 18px', lineHeight: '1.5' } },
            /WARNING/.test(log) ? 'The router could not be removed from your NetBird network. Delete it in the NetBird dashboard.'
              : 'Reload the admin panel to hide this page.'),
          btn(h, 'Reload', function () { window.location.reload(); }, 'primary')
        ])];
        return h('div', { style: { padding: '16px', maxWidth: '820px', margin: '0 auto', boxSizing: 'border-box' } }, body);
      }
      if (this.loading) {
        body = [h('div', { style: Object.assign({}, CARD, { color: C.sub, fontSize: '13px' }) }, 'Loading NetBird status…')];
      } else if (!d || !d.installed) {
        body = [this.rHeader(h), this.rNotice(h), this.rJob(h), d ? this.rInstall(h) : null];
      } else {
        body = [this.rHeader(h), this.rNotice(h), this.rJob(h)];
        var k = this.state.key;
        if (d.running && d.status && (k === 'connected' || k === 'connecting')) body.push(this.rStatus(h), this.rPeers(h));
        body.push(this.rSettings(h), this.rMaintenance(h));
      }
      return h('div', { style: { padding: '16px', maxWidth: '820px', margin: '0 auto', boxSizing: 'border-box' } }, body);
    }
  };
})();

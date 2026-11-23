# NetBird for GL.iNet routers

Run the [NetBird](https://netbird.io) mesh VPN client on a GL.iNet router and
manage it from the router's own admin panel, under **Applications > NetBird**.

Built for GL.iNet firmware 4.x and tested on the **Mudi 7 (GL-E5800)**. The
same package also adds pages to LuCI (VPN > NetBird).

> This is a community project. It is not affiliated with or endorsed by
> GL.iNet or NetBird.

## Features

- **Install the official client** from NetBird's GitHub releases, verified
  against the published SHA-256 checksums.
- **Connect with a setup key**, to NetBird Cloud or your own management server.
  The key is passed through a temporary file, never on the command line, and is
  removed from the router after registration (optional).
- **Status and peers**: NetBird IP, domain name, management/signal state and
  every peer with P2P/relayed, latency and traffic.
- **Follows uplink changes**: reconnects right away when the router switches
  between cable, repeater, 5G or tethering.
- **Survives reboots and firmware upgrades**: starts at boot and keeps its
  registration (`/etc/netbird`) across sysupgrade.
- **Firewall zone** `netbird` (interface `wt0`) with optional LAN ↔ NetBird
  forwarding and masquerade.
- **Plugin updates** from this repository's releases, or by uploading an `.ipk`
  in the panel.
- **Uninstall** in one tap, optionally removing the router from your NetBird
  network.

## Requirements

- GL.iNet router on firmware 4.x (OpenWrt based), `aarch64`, `x86_64`,
  `armv7` or `i386`
- About 40 MB free storage for the NetBird client
- Internet access on the router for the first install

## Installation

1. Download `luci-app-netbird_<version>_all.ipk` from the
   [latest release](../../releases/latest).
2. Install it, either
   - in LuCI: **System > Software > Upload Package… > Install**
     (enable LuCI first under *System > Advanced Settings* in the GL panel), or
   - over SSH:
     ```sh
     scp -O luci-app-netbird_*_all.ipk root@192.168.8.1:/tmp/
     ssh root@192.168.8.1 'opkg install /tmp/luci-app-netbird_*_all.ipk'
     ```
3. Reload the GL admin panel and open **Applications > NetBird**.
4. Press **Install latest version**.
5. Enter a setup key (NetBird dashboard > Setup Keys) and press
   **Save & connect**.

## Updating

**Applications > NetBird > Maintenance**

- **Update to x.y.z** appears when a newer release is published here.
- **Upload .ipk** installs a downloaded package file directly.
- **Update NetBird client** updates the NetBird client itself.

Settings and the NetBird registration are kept on every update.

## Uninstalling

**Applications > NetBird > Maintenance > Uninstall** removes the client, its
registration and settings, the firewall zone and the plugin itself.

From SSH: `opkg remove luci-app-netbird`. This keeps `/usr/bin/netbird` and
`/etc/netbird`; delete those by hand if you want.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Method not found" after an update | Reboot the router (System > Reboot). |
| Page missing under Applications | Reload the admin panel; check `/usr/share/oui/menu.d/netbird.json` exists. |
| Peers show as *Relayed* on 5G | Normal behind carrier-grade NAT; traffic still flows. |
| No connection with VPN kill switch on | GL's *Block Non-VPN Traffic* can block NetBird; leave it off unless you use a VPN client. |

Logs: **Maintenance > Show log**, or `/var/log/netbird/client.log`.

To remove only the GL panel page and keep NetBird running:

```sh
rm /usr/share/oui/menu.d/netbird.json /www/views/gl-sdk4-ui-netbird.common.js.gz
```

## Development

### Making a release

On GitHub: **Releases > Draft a new release**, create a new tag such as
`v1.2.4`, and press **Publish release**. Or from a terminal:

```sh
git tag v1.2.4
git push origin v1.2.4
```

Either way the *Release* workflow checks the scripts, builds the package with
`./build.sh` and publishes `luci-app-netbird_<version>-1_all.ipk` plus
`SHA256SUMS`. Routers find new versions through
`releases/latest/download/SHA256SUMS`.

Local build: `./build.sh 1.2.4 [owner/repo]` writes to `dist/`. Builds are
reproducible.

### Layout

| Part | Source | Installed to |
| --- | --- | --- |
| GL panel page (Vue 2) | `luci-app-netbird/oui/` | `/www/views/gl-sdk4-ui-netbird.common.js.gz` |
| GL panel backend (Lua) | `root/usr/lib/oui-httpd/rpc/netbird` | same |
| GL panel menu entry | `root/usr/share/oui/menu.d/netbird.json` | same |
| Shared backend (shell) | `root/usr/libexec/netbird-luci` | same |
| Service and config | `root/etc/init.d/netbird`, `root/etc/config/netbird` | same |
| LuCI pages | `root/www/luci-static/resources/view/netbird/` | same |
| Package scripts | `luci-app-netbird/CONTROL/` | — |

## License

[MIT](LICENSE). The NetBird client is downloaded from
[netbirdio/netbird](https://github.com/netbirdio/netbird) at install time and
is licensed separately by its authors (BSD-3-Clause).

#!/bin/sh
# Builds dist/luci-app-netbird_<version>_all.ipk and dist/SHA256SUMS.
# Usage: ./build.sh <version> [owner/repo]
#   version     e.g. 1.2.0 (becomes 1.2.0-1) or 1.2.0-2
#   owner/repo  default update source baked into the package
#               (defaults to $GITHUB_REPOSITORY when run in GitHub Actions)
set -eu

ver="${1:?usage: $0 <version> [owner/repo]}"
ver="${ver#v}"
num='[0-9]+(\.[0-9]+)*'
if echo "$ver" | grep -Eq "^$num\$"; then
	ver="$ver-1"                                   # 1.2.7       -> 1.2.7-1
elif echo "$ver" | grep -Eq "^$num-[0-9]+\$"; then
	:                                              # 1.2.7-2     -> 1.2.7-2
elif echo "$ver" | grep -Eq "^$num-[A-Za-z][A-Za-z0-9.]*\$"; then
	# pre-release: 1.2.7-dev -> 1.2.7~dev-1. opkg sorts ~ before anything,
	# so the final 1.2.7-1 is seen as newer than every 1.2.7 pre-release.
	ver="${ver%%-*}~${ver#*-}-1"
else
	echo "bad version: $ver (use e.g. 1.2.7, 1.2.7-2, 1.2.7-dev or 1.2.7-beta.1)" >&2
	exit 1
fi
repo="${2:-${GITHUB_REPOSITORY:-}}"

top="$(cd "$(dirname "$0")" && pwd)"
src="$top/luci-app-netbird"
dist="$top/dist"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cp -a "$src/root" "$tmp/root"
cp -a "$src/CONTROL" "$tmp/CONTROL"
mkdir -p "$tmp/root/www/views"
gzip -9 -n -c "$src/oui/gl-sdk4-ui-netbird.common.js" > "$tmp/root/www/views/gl-sdk4-ui-netbird.common.js.gz"
if [ -n "$repo" ]; then
	mkdir -p "$tmp/root/usr/share/netbird-luci"
	echo "$repo" > "$tmp/root/usr/share/netbird-luci/update_repo"
fi
chmod 755 "$tmp/root/usr/libexec/netbird-luci" "$tmp/root/etc/init.d/netbird" \
	"$tmp/CONTROL/postinst" "$tmp/CONTROL/prerm" "$tmp/CONTROL/postrm"

size="$(du -sk "$tmp/root" | cut -f1)"
sed -i -e "s/^Version:.*/Version: $ver/" -e "s/^Installed-Size:.*/Installed-Size: $size/" "$tmp/CONTROL/control"

tarc() { tar --owner=0 --group=0 --numeric-owner --sort=name --mtime='@0' -czf "$@"; }
mkdir -p "$tmp/pkg" "$dist"
(cd "$tmp/root" && tarc "$tmp/pkg/data.tar.gz" ./)
(cd "$tmp/CONTROL" && tarc "$tmp/pkg/control.tar.gz" ./)
echo 2.0 > "$tmp/pkg/debian-binary"
# no ~ in the file name: GitHub may rewrite it in release asset names
out="luci-app-netbird_$(echo "$ver" | tr '~' '-')_all.ipk"
(cd "$tmp/pkg" && tarc "$dist/$out" ./debian-binary ./control.tar.gz ./data.tar.gz)
(cd "$dist" && sha256sum "$out" > SHA256SUMS)
echo "Built dist/$out"
cat "$dist/SHA256SUMS"

package assets

import "embed"

//go:embed hugo.toml themes.zip
var Asserts embed.FS

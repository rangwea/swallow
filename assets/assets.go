package assets

import "embed"

//go:embed hugo.toml themes.zip theme-migrations.json
var Asserts embed.FS

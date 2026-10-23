//go:build !windows

package backend

import "golang.org/x/sys/unix"

func publishDiskAvailable(dir string) (uint64, error) {
	var stat unix.Statfs_t
	if e := unix.Statfs(dir, &stat); e != nil {
		return 0, e
	}
	return stat.Bavail * uint64(stat.Bsize), nil
}

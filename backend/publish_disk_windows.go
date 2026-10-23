//go:build windows

package backend

import "golang.org/x/sys/windows"

func publishDiskAvailable(dir string) (uint64, error) {
	p, e := windows.UTF16PtrFromString(dir)
	if e != nil {
		return 0, e
	}
	var available, total, free uint64
	e = windows.GetDiskFreeSpaceEx(p, &available, &total, &free)
	return available, e
}

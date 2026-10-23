package backend

import (
	"context"
	rt "github.com/wailsapp/wails/v2/pkg/runtime"
	"sync"
	"sync/atomic"
)

var writingGuard struct {
	sync.Mutex
	revision int64
	active   bool
}
var closeAllowed atomic.Bool

// Binding calls can arrive out of order (including React StrictMode cleanup).
func (a *App) WritingGuard(revision int64, active bool) {
	writingGuard.Lock()
	defer writingGuard.Unlock()
	if revision > writingGuard.revision {
		writingGuard.revision = revision
		writingGuard.active = active
	}
}
func (a *App) BeforeClose(ctx context.Context) bool {
	if closeAllowed.Swap(false) {
		return false
	}
	writingGuard.Lock()
	active := writingGuard.active
	writingGuard.Unlock()
	if !active {
		return false
	}
	rt.EventsEmit(ctx, "writing:close")
	return true
}
func (a *App) WritingCloseReady() { closeAllowed.Store(true); rt.Quit(a.ctx) }

package backend

import (
	"context"
	rt "github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) PublishExit() {
	publisher.Lock()
	if publisher.cancel != nil {
		publisher.cancel()
	}
	publisher.Unlock()
	go func() {
		publisher.workers.Wait()
		writingGuard.Lock()
		editing := writingGuard.active
		writingGuard.Unlock()
		if editing {
			rt.EventsEmit(a.ctx, "writing:close")
		} else {
			closeAllowed.Store(true)
			rt.Quit(a.ctx)
		}
	}()
}
func publishingBeforeClose(ctx context.Context) bool {
	publisher.Lock()
	id := publisher.active
	publisher.Unlock()
	if id == "" {
		return false
	}
	rt.EventsEmit(ctx, "publishing:close", id)
	return true
}

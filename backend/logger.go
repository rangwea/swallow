package backend

import (
	"fmt"
	"os"
	"path"
	"runtime"
	"sync"
	"time"
)

// Logger 日志管理器
type Logger struct {
	logDir      string
	currentFile *os.File
	currentDate string
	mutex       sync.Mutex
}

var Log *Logger

// LogLevel 日志级别
type LogLevel string

const (
	LogLevelDebug LogLevel = "DEBUG"
	LogLevelInfo  LogLevel = "INFO"
	LogLevelWarn  LogLevel = "WARN"
	LogLevelError LogLevel = "ERROR"
	LogLevelFatal LogLevel = "FATAL"
)

// InitLogger 初始化日志系统
func InitLogger() error {
	logDir := path.Join(AppHome, "logs")

	// 创建日志目录
	if err := os.MkdirAll(logDir, os.ModePerm); err != nil {
		return fmt.Errorf("create log directory failed: %w", err)
	}

	Log = &Logger{
		logDir: logDir,
	}

	// 打开或创建当天的日志文件
	if err := Log.rotateLogFile(); err != nil {
		return err
	}

	// 清理过期日志文件（保留最近7天）
	go Log.cleanOldLogs(7)

	Log.Info("Logger initialized successfully")
	return nil
}

// rotateLogFile 日志文件轮转
func (l *Logger) rotateLogFile() error {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	today := time.Now().Format("2006-01-02")

	// 如果日期没变且文件已打开，不需要轮转
	if l.currentDate == today && l.currentFile != nil {
		return nil
	}

	// 关闭旧文件
	if l.currentFile != nil {
		l.currentFile.Close()
	}

	// 创建新日志文件
	logPath := path.Join(l.logDir, fmt.Sprintf("swallow-%s.log", today))
	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return fmt.Errorf("open log file failed: %w", err)
	}

	l.currentFile = file
	l.currentDate = today
	return nil
}

// cleanOldLogs 清理过期日志
func (l *Logger) cleanOldLogs(keepDays int) {
	entries, err := os.ReadDir(l.logDir)
	if err != nil {
		return
	}

	cutoff := time.Now().AddDate(0, 0, -keepDays)

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		if info.ModTime().Before(cutoff) {
			os.Remove(path.Join(l.logDir, entry.Name()))
		}
	}
}

// write 写入日志
func (l *Logger) write(level LogLevel, msg string, args ...interface{}) {
	// 检查日期是否变化，需要轮转
	today := time.Now().Format("2006-01-02")
	if l.currentDate != today {
		l.rotateLogFile()
	}

	l.mutex.Lock()
	defer l.mutex.Unlock()

	if l.currentFile == nil {
		return
	}

	timestamp := time.Now().Format("2006-01-02 15:04:05.000")
	formattedMsg := msg
	if len(args) > 0 {
		formattedMsg = fmt.Sprintf(msg, args...)
	}

	logLine := fmt.Sprintf("[%s] [%s] %s\n", timestamp, level, formattedMsg)
	l.currentFile.WriteString(logLine)
}

// writeWithStack 写入带堆栈的日志
func (l *Logger) writeWithStack(level LogLevel, msg string, args ...interface{}) {
	// 检查日期是否变化，需要轮转
	today := time.Now().Format("2006-01-02")
	if l.currentDate != today {
		l.rotateLogFile()
	}

	l.mutex.Lock()
	defer l.mutex.Unlock()

	if l.currentFile == nil {
		return
	}

	timestamp := time.Now().Format("2006-01-02 15:04:05.000")
	formattedMsg := msg
	if len(args) > 0 {
		formattedMsg = fmt.Sprintf(msg, args...)
	}

	// 获取调用堆栈
	stack := getStackTrace(3) // 跳过 writeWithStack, Error/Fatal, 和调用者

	logLine := fmt.Sprintf("[%s] [%s] %s\nStack trace:\n%s\n", timestamp, level, formattedMsg, stack)
	l.currentFile.WriteString(logLine)
}

// getStackTrace 获取堆栈追踪
func getStackTrace(skip int) string {
	var stack string
	for i := skip; ; i++ {
		pc, file, line, ok := runtime.Caller(i)
		if !ok {
			break
		}
		fn := runtime.FuncForPC(pc)
		fnName := "unknown"
		if fn != nil {
			fnName = fn.Name()
		}
		stack += fmt.Sprintf("  at %s (%s:%d)\n", fnName, file, line)

		// 限制堆栈深度
		if i-skip > 20 {
			stack += "  ... (more frames omitted)\n"
			break
		}
	}
	return stack
}

// Debug 调试日志
func (l *Logger) Debug(msg string, args ...interface{}) {
	l.write(LogLevelDebug, msg, args...)
}

// Info 信息日志
func (l *Logger) Info(msg string, args ...interface{}) {
	l.write(LogLevelInfo, msg, args...)
}

// Warn 警告日志
func (l *Logger) Warn(msg string, args ...interface{}) {
	l.write(LogLevelWarn, msg, args...)
}

// Error 错误日志（带堆栈）
func (l *Logger) Error(msg string, args ...interface{}) {
	l.writeWithStack(LogLevelError, msg, args...)
}

// Fatal 致命错误日志（带堆栈）
func (l *Logger) Fatal(msg string, args ...interface{}) {
	l.writeWithStack(LogLevelFatal, msg, args...)
}

// LogError 记录错误对象
func (l *Logger) LogError(err error, context string) {
	if err == nil {
		return
	}
	l.Error("%s: %v", context, err)
}

// LogPanic 记录 panic 信息
func (l *Logger) LogPanic(r interface{}) {
	l.Fatal("Panic recovered: %v", r)
}

// GetLogDir 获取日志目录
func (l *Logger) GetLogDir() string {
	return l.logDir
}

// Close 关闭日志文件
func (l *Logger) Close() {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	if l.currentFile != nil {
		l.currentFile.Close()
		l.currentFile = nil
	}
}

// SafeGo 安全的 goroutine 包装器，捕获 panic
func SafeGo(fn func()) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				if Log != nil {
					Log.LogPanic(r)
				}
			}
		}()
		fn()
	}()
}

// SafeCall 安全调用函数，捕获 panic 并返回错误
func SafeCall(fn func() error) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("panic recovered: %v", r)
			if Log != nil {
				Log.LogPanic(r)
			}
		}
	}()
	return fn()
}

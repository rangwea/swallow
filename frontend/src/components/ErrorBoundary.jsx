import React from "react";
import { AlertTriangle, RefreshCw, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenLogDir } from "/wailsjs/go/backend/App";
import { t } from "@/lib/i18n";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // 记录错误到控制台（后端日志会通过 API 调用时记录）
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleOpenLogs = () => {
    OpenLogDir().then((result) => {
      if (result.code !== 1) {
        console.error("Failed to open log directory:", result.msg);
      }
    }).catch((err) => {
      console.error("Error opening log directory:", err);
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="max-w-md w-full space-y-6 text-center">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
            </div>

            {/* Error Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-serif font-semibold text-foreground">
                {t("errorOccurred") || "出错了"}
              </h1>
              <p className="text-muted-foreground">
                {t("errorDescription") || "应用遇到了一个错误，请尝试刷新页面"}
              </p>
            </div>

            {/* Error Details (collapsible in production) */}
            {this.state.error && (
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <p className="text-sm font-mono text-destructive break-words">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      {t("errorStack") || "查看详情"}
                    </summary>
                    <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReload} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                {t("refreshPage") || "刷新页面"}
              </Button>
              <Button
                variant="outline"
                onClick={this.handleOpenLogs}
                className="gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                {t("openLogDir") || "查看日志"}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-linear-to-br from-slate-900 to-gray-900 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-linear-to-br from-slate-800 to-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-slate-700/50">
              {/* Animated Error Icon */}
              <div className="relative inline-flex mb-6">
                {/* Outer glow */}
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>

                {/* Main icon container */}
                <div className="relative w-20 h-20 bg-linear-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                {/* Animated rings */}
                <div className="absolute -inset-2 border-2 border-red-500/30 rounded-full animate-ping"></div>
                <div className="absolute -inset-4 border-2 border-red-500/10 rounded-full animate-pulse"></div>
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-white mb-3">
                ขออภัย! เกิดข้อผิดพลาดบางอย่าง
              </h1>

              {/* Error Message */}
              <p className="text-gray-300 mb-6">
                ระบบไม่สามารถโหลดข้อมูลได้ในขณะนี้
                กรุณาลองใหม่อีกครั้งหรือติดต่อทีมสนับสนุนหากปัญหาเกิดขึ้นซ้ำ
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
                  onClick={() => window.location.reload()}
                >
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    โหลดหน้าใหม่
                  </div>
                </button>

                <button
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-gray-200 font-medium rounded-xl border border-slate-600 transition-colors duration-200"
                  onClick={() => window.history.back()}
                >
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    กลับหน้าหลัก
                  </div>
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <div className="flex items-center justify-center text-sm text-gray-400">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    รหัสข้อผิดพลาด: ERR_{Date.now().toString().slice(-6)}
                  </span>
                </div>
              </div>
            </div>

            {/* Background decorative elements */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-blue-500/30 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

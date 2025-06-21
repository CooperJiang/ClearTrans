'use client';

interface HeaderProps {
  onConfigClick: () => void;
}

export default function Header({ onConfigClick }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - 更精致的设计 */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ClearTrans</h1>
              <p className="text-sm text-gray-500">智能翻译平台</p>
            </div>
          </div>

          {/* Navigation - 简洁的Tab设计 */}
          <nav className="hidden md:flex items-center bg-gray-100/60 rounded-xl p-1 border border-gray-200/40">
            <a 
              href="#" 
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm transition-all duration-200"
            >
              文本翻译
            </a>
            <a 
              href="#" 
              className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg transition-all duration-200"
            >
              文档翻译
            </a>
            <a 
              href="#" 
              className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg transition-all duration-200"
            >
              图片翻译
            </a>
            <a 
              href="#" 
              className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg transition-all duration-200"
            >
              网页翻译
            </a>
          </nav>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            {/* Config button */}
            <button
              onClick={onConfigClick}
              className="p-2.5 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl transition-all duration-200"
              title="配置API"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* Status - 简洁的在线状态 */}
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-emerald-700">在线</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 
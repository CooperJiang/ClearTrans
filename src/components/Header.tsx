'use client';

interface HeaderProps {
  onConfigClick: () => void;
}

export default function Header({ onConfigClick }: HeaderProps) {
  return (
    <header className="bg-white subtle-border border-b">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-language text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-lg font-semibold gradient-text">ClearTrans</h1>
              <p className="text-xs text-gray-500">智能翻译平台</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-sm text-blue-600 font-medium border-b-2 border-blue-600 pb-1">
              文本翻译
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              文档翻译
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              图片翻译
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              网页翻译
            </a>
          </nav>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Config button */}
            <button
              onClick={onConfigClick}
              className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
              title="配置API"
            >
              <i className="fas fa-cog text-sm"></i>
            </button>

            {/* Status */}
            <div className="flex items-center space-x-2 bg-green-50 px-2 py-1 rounded-md">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <span className="text-xs text-green-700">在线</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 
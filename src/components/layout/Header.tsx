"use client";

import { usePathname, useRouter } from 'next/navigation';

interface HeaderProps {
  onConfigClick: () => void;
}

export default function Header({ onConfigClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navigationItems = [
    { 
      path: '/', 
      label: '文本翻译', 
      icon: 'fas fa-font',
      isActive: pathname === '/' 
    },
    { 
      path: '/document-translate', 
      label: '文档翻译', 
      icon: 'fas fa-file-alt',
      isActive: pathname === '/document-translate',
      disabled: true 
    },
    { 
      path: '/image-translate', 
      label: '图片翻译', 
      icon: 'fas fa-image',
      isActive: pathname === '/image-translate' 
    },
    { 
      path: '/web-translate', 
      label: '网页翻译', 
      icon: 'fas fa-globe',
      isActive: pathname === '/web-translate',
      disabled: true 
    }
  ];

  const handleNavigation = (path: string, disabled?: boolean) => {
    if (disabled) return;
    router.push(path);
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-language text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-lg font-semibold gradient-text">ClearTrans</h1>
              <p className="text-xs text-gray-500">智能翻译平台</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center bg-gray-100/60 rounded-xl p-1 border border-gray-200/40">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path, item.disabled)}
                disabled={item.disabled}
                className={`
                  px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2
                  ${item.isActive 
                    ? 'text-white bg-blue-600 shadow-sm' 
                    : item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
                title={item.disabled ? '即将推出' : undefined}
              >
                <i className={`${item.icon} text-xs`}></i>
                <span>{item.label}</span>
                {item.disabled && (
                  <i className="fas fa-lock text-xs ml-1 opacity-50"></i>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
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

            <a 
              href="https://github.com/CooperJiang/ClearTrans" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-2 rounded-xl transition-colors duration-200"
            >
              <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-xs font-medium text-gray-700">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

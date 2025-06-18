export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-4">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 ClearTrans • 图片处理服务由{' '}
            <a 
              href="http://pixelpunk.cc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              PixelPunk.cc
            </a>
            {' '}提供
          </p>
        </div>
      </div>
    </footer>
  );
} 
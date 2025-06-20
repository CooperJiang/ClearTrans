interface FloatingButtonsProps {
  onHistoryClick?: () => void;
}

export default function FloatingButtons({ onHistoryClick }: FloatingButtonsProps) {
  return (
    <div className="fixed right-6 bottom-6 flex flex-col space-y-3">
      <button className="bg-white main-shadow hover-lift rounded-lg p-3 text-blue-500 hover:text-blue-600 transition-all group relative">
        <i className="fas fa-file-alt text-sm"></i>
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
          文档翻译
        </div>
      </button>
      <button className="bg-white main-shadow hover-lift rounded-lg p-3 text-purple-500 hover:text-purple-600 transition-all group relative">
        <i className="fas fa-image text-sm"></i>
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
          图片翻译
        </div>
      </button>
      <button 
        className="bg-white main-shadow hover-lift rounded-lg p-3 text-green-500 hover:text-green-600 transition-all group relative"
        onClick={onHistoryClick}
      >
        <i className="fas fa-history text-sm"></i>
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
          翻译历史
        </div>
      </button>
    </div>
  );
} 
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 项目主题色
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // 自定义主题色 - 更柔和的配色方案
        theme: {
          // 主色调 - 柔和蓝色
          primary: '#4f46e5',      // 主要按钮、链接
          'primary-light': '#818cf8', // 浅色变体
          'primary-dark': '#3730a3',  // 深色变体
          
          // 选中状态 - 优雅的蓝紫色系
          selected: '#4f46e5',     // 选中文字颜色 - 深蓝紫色
          'selected-bg': '#e0e7ff', // 选中背景色 - 淡蓝紫色
          'selected-border': '#a5b4fc', // 选中边框 - 柔和紫色
          
          // 悬停状态 - 清新蓝色
          hover: '#3b82f6',        // 悬停色
          'hover-bg': '#f0f9ff',   // 悬停背景
          'hover-border': '#bae6fd', // 悬停边框
          
          // 中性色
          text: '#1f2937',         // 主要文字
          'text-light': '#6b7280', // 次要文字
          'text-muted': '#9ca3af', // 淡化文字
          
          // 背景色
          bg: '#ffffff',           // 主背景
          'bg-secondary': '#f9fafb', // 次要背景
          'bg-soft': '#f3f4f6',    // 柔和背景
          
          // 边框色
          border: '#e5e7eb',       // 默认边框
          'border-light': '#f3f4f6', // 浅色边框
        }
      },
      boxShadow: {
        'soft': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'strong': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 
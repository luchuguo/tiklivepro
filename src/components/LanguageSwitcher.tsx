import React, { useEffect } from 'react';
import '../googleTranslate.css';

function LanguageSwitcher() {
  useEffect(() => {
    // 初始化 Google 翻译
    const googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: 'zh-CN',
          includedLanguages: 'en,zh-CN', // 只包含英文和中文
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
          multilanguagePage: true
        },
        'google_translate_element'
      );
    };

    // 添加 Google 翻译脚本
    const addScript = () => {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    };

    // 将初始化函数添加到 window 对象
    (window as any).googleTranslateElementInit = googleTranslateElementInit;

    // 添加脚本
    addScript();

    // 样式应用
    const interval = setInterval(() => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (combo) {
        // 修改选项文本
        Array.from(combo.options).forEach(option => {
          if (option.value === 'zh-CN') {
            option.text = '简体中文';
          } else if (option.value === 'en') {
            option.text = 'English';
          } else if (option.value === '') {
            option.text = '选择语言';
        }
        });

        clearInterval(interval);
      }
    }, 100);
    
    return () => {
      clearInterval(interval);
      // 清理脚本
      const script = document.querySelector('script[src*="translate_a/element.js"]');
      if (script) {
        script.remove();
      }
    };
  }, []);

  return (
    <div className="language-switcher" style={{ 
      display: 'inline-block',
      marginLeft: '16px',
      position: 'relative',
      verticalAlign: 'middle'
    }}>
      <div id="google_translate_element"></div>
    </div>
  );
}

export default LanguageSwitcher; 
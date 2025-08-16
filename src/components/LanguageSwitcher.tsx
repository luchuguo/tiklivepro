import React, { useEffect } from 'react';

function LanguageSwitcher() {
  useEffect(() => {
    // 确保样式在控件加载后应用
    const interval = setInterval(() => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (combo) {
        combo.style.padding = '10px 16px';
        combo.style.border = '2px solid #e2e8f0';
        combo.style.borderRadius = '12px';
        combo.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
        combo.style.color = '#475569';
        combo.style.fontSize = '14px';
        combo.style.fontWeight = '600';
        combo.style.cursor = 'pointer';
        combo.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        combo.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
        combo.style.width = '110px';
        combo.style.height = '35px';
        combo.style.webkitAppearance = 'none';
        combo.style.appearance = 'none';
        combo.style.backgroundImage = 'url("data:image/svg+xml;utf8,<svg fill=\'none\' height=\'24\' stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M19 9l-7 7-7-7\'/></svg>")';
        combo.style.backgroundRepeat = 'no-repeat';
        combo.style.backgroundPosition = 'right 0.7em center';
        combo.style.backgroundSize = '16px';
        combo.style.overflow = 'hidden';
        combo.style.textOverflow = 'ellipsis';
        // 设置默认文字为大写Language
        if (combo.options.length > 0) {
          combo.options[0].text = 'LANGUAGE';
        }
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="language-switcher ml-2" style={{ display: 'inline-block' }}>
      <div id="google_translate_element" style={{ display: 'block', visibility: 'visible' }}></div>
    </div>
  );
}

export default LanguageSwitcher; 
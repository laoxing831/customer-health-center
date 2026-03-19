(function() {
  const checkBot = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const botPatterns = [
      'bot', 'spider', 'crawler', 'curl', 'wget', 'fetch',
      'scrape', 'pider', 'python', 'java', 'perl', 'go-http'
    ];
    const isBot = botPatterns.some(pattern => userAgent.includes(pattern));
    
    if (isBot) {
      document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><p>Access Denied</p></div>';
      throw new Error('Access denied');
    }

    if (!window.navigator.webdriver && !window.callPhantom && !window._phantom) {
      const canvas = document.createElement('canvas');
      if (canvas.width === 0 || canvas.height === 0) {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><p>Access Denied</p></div>';
        throw new Error('Access denied');
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkBot);
  } else {
    checkBot();
  }

  setTimeout(() => {
    if (!document.body) {
      window.stop();
      window.location.replace('about:blank');
    }
  }, 3000);
})();

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

createApp(App).use(router).use(ElementPlus).mount('#app')
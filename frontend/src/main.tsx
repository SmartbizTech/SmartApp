import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './style.css'

// DevExtreme theme - Material Blue Light
import 'devextreme/dist/css/dx.material.blue.light.css'

console.log('main.tsx loaded');

// Add a fallback message in case React fails to render
document.body.insertAdjacentHTML('beforeend', '<div id="fallback-message" style="display:none; padding:20px; background:yellow;">React failed to load. Check console for errors.</div>');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element #root not found!');
  document.body.innerHTML = '<h1 style="padding: 20px; color: red;">Error: Root element #root not found!</h1>';
} else {
  console.log('Root element found, rendering App');
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('App rendered successfully');
    // Hide fallback after a short delay if React renders successfully
    setTimeout(() => {
      const fallback = document.getElementById('fallback-message');
      if (fallback) fallback.remove();
    }, 100);
  } catch (error) {
    console.error('Failed to render React app:', error);
    const fallback = document.getElementById('fallback-message');
    if (fallback) {
      fallback.style.display = 'block';
      fallback.innerHTML = `<h1>Error rendering app</h1><p>${String(error)}</p>`;
    }
  }
}


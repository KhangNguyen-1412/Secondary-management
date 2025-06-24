import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Create React App đã tạo sẵn file này
import App from './App.jsx'; // Đảm bảo import từ App.jsx

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

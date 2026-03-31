import React, { useState, useEffect } from 'react';

// Список разрешенных паролей
const VALID_PASSWORDS = [
  'кузнец2024',
  'smith123',
  'blacksmith',
  'наковальня'
];

// Ключ для localStorage
const AUTH_KEY = 'blacksmith_auth';

export default function Auth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Проверяем, был ли уже ввод пароля
  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_KEY);
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (VALID_PASSWORDS.includes(password)) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, 'true');
      setError('');
    } else {
      setError('❌ Неверный пароль');
      setPassword('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setPassword('');
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #2c3e14 0%, #1e2a0e 100%)'
      }}>
        <div style={{ color: '#ffd966', fontSize: '24px' }}>⚒️ Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2c3e14 0%, #1e2a0e 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: '#fef9e6',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚒️</div>
          <h1 style={{ 
            color: '#d35400', 
            fontSize: '28px',
            marginBottom: '10px',
            fontFamily: 'Georgia, serif'
          }}>
            Кузнечные Заметки
          </h1>
          <p style={{ 
            color: '#7f8c8d', 
            marginBottom: '30px',
            fontSize: '14px'
          }}>
            Введите пароль для доступа к кузнечной книге
          </p>
          
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                border: `2px solid ${error ? '#e74c3c' : '#e0d6b5'}`,
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d35400'}
              onBlur={(e) => e.target.style.borderColor = error ? '#e74c3c' : '#e0d6b5'}
            />
            
            {error && (
              <p style={{ 
                color: '#e74c3c', 
                fontSize: '14px', 
                marginBottom: '15px',
                textAlign: 'left'
              }}>
                {error}
              </p>
            )}
            
            <button
              type="submit"
              style={{
                width: '100%',
                background: '#d35400',
                color: 'white',
                padding: '12px',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#e67e22'}
              onMouseLeave={(e) => e.target.style.background = '#d35400'}
            >
              Войти в кузницу 🔑
            </button>
          </form>
          
          <p style={{ 
            fontSize: '12px', 
            color: '#bdc3c7', 
            marginTop: '20px',
            fontStyle: 'italic'
          }}>
            Только для своих
          </p>
        </div>
      </div>
    );
  }

  // Если авторизован, показываем приложение с кнопкой выхода
  return (
    <>
      {React.cloneElement(children, { onLogout: handleLogout })}
    </>
  );
}
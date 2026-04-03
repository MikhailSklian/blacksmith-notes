import React, { useState, useEffect } from 'react';
import { horseService } from './db/database';
import HorseList from './components/HorseList';
import HorseForm from './components/HorseForm';
import './App.css';

function App({ onLogout }) {
  const [horses, setHorses] = useState([]);
  const [currentPage, setCurrentPage] = useState('list'); // 'list' или 'form'
  const [editingHorse, setEditingHorse] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Загружаем список лошадей
  useEffect(() => {
    loadHorses();
    
    // Обновляем таймеры каждую секунду
    const interval = setInterval(() => {
      loadHorses();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Слушаем статус сети
  useEffect(() => {
    window.addEventListener('online', () => setIsOffline(false));
    window.addEventListener('offline', () => setIsOffline(true));
    return () => {
      window.removeEventListener('online', () => setIsOffline(false));
      window.removeEventListener('offline', () => setIsOffline(true));
    };
  }, []);

  const loadHorses = async () => {
    const allHorses = await horseService.getAll();
    setHorses(allHorses);
  };

  const handleAddHorse = () => {
    setEditingHorse(null);
    setCurrentPage('form');
  };

  const handleEditHorse = (horse) => {
    setEditingHorse(horse);
    setCurrentPage('form');
  };

  const handleSaveHorse = async () => {
    await loadHorses();
    setCurrentPage('list');
  };

  const handleCancel = () => {
    setCurrentPage('list');
    setEditingHorse(null);
  };

  const handleDeleteHorse = async (id) => {
    if (window.confirm('Удалить эту лошадь из списка?')) {
      await horseService.delete(id);
      await loadHorses();
    }
  };

  return (
    <div className="app">
      {isOffline && (
        <div className="offline-banner">
          🔥 Оффлайн режим — все данные сохраняются на вашем устройстве
        </div>
      )}

      <header className="header">
        <h1>
          <span>🐴</span>
          Кузнец: учёт подковки
        </h1>
        <div className="header-buttons">
          {currentPage === 'list' && (
            <button className="new-horse-btn" onClick={handleAddHorse}>
              + Добавить лошадь
            </button>
          )}
          <button className="logout-btn" onClick={onLogout}>
            🚪 Выйти
          </button>
        </div>
      </header>

      {currentPage === 'list' && (
        <HorseList 
          horses={horses}
          onEdit={handleEditHorse}
          onDelete={handleDeleteHorse}
        />
      )}

      {currentPage === 'form' && (
        <HorseForm 
          horse={editingHorse}
          onSave={handleSaveHorse}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

export default App;
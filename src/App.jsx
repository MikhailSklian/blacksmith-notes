import React, { useState, useEffect } from 'react';
import { horseService } from './db/database';
import './App.css';

function App({ onLogout }) {
  const [horses, setHorses] = useState([]);
  const [currentHorse, setCurrentHorse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Для нового таймера
  const [newTimerMonths, setNewTimerMonths] = useState(0);
  const [newTimerDays, setNewTimerDays] = useState(0);
  const [newTimerHours, setNewTimerHours] = useState(1);
  
  // Текущий отображаемый таймер для выбранной лошади
  const [currentDisplayTime, setCurrentDisplayTime] = useState(null);

  // Загружаем список лошадей
  useEffect(() => {
    loadHorses();
    
    // Обновляем таймеры каждую секунду
    const interval = setInterval(() => {
      loadHorses(); // Обновляем список для актуальных таймеров
      updateCurrentDisplayTime(); // Обновляем отображение выбранной лошади
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentHorse]);

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

  const updateCurrentDisplayTime = () => {
    if (currentHorse && currentHorse.endTime) {
      const timeLeft = currentHorse.endTime - Date.now();
      if (timeLeft <= 0) {
        setCurrentDisplayTime('00 : 00 : 00 : 00');
      } else {
        setCurrentDisplayTime(formatTimeLeft(timeLeft));
      }
    }
  };

  // Форматирование времени в формат Месяцы:Дни:Часы:Минуты
  const formatTimeLeft = (ms) => {
    const totalMinutes = Math.floor(ms / (1000 * 60));
    
    // 1 месяц = 30 дней, 1 день = 24 часа, 1 час = 60 минут
    const months = Math.floor(totalMinutes / (30 * 24 * 60));
    const days = Math.floor((totalMinutes % (30 * 24 * 60)) / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    
    return `${months.toString().padStart(2, '0')} : ${days.toString().padStart(2, '0')} : ${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')}`;
  };

  // Получение времени для отображения в списке
  const getTimeLeftForHorse = (endTime) => {
    if (!endTime) return { text: '00 : 00 : 00 : 00', className: 'timer-normal' };
    const timeLeft = endTime - Date.now();
    if (timeLeft <= 0) {
      return { text: '00 : 00 : 00 : 00', className: 'timer-urgent' };
    }
    const text = formatTimeLeft(timeLeft);
    
    // Определяем класс срочности
    const totalHours = timeLeft / (1000 * 60 * 60);
    if (totalHours < 24) {
      return { text, className: 'timer-urgent' };
    } else if (totalHours < 72) { // Менее 3 дней
      return { text, className: 'timer-warning' };
    } else {
      return { text, className: 'timer-normal' };
    }
  };

  // Пересчет месяцев, дней и часов в секунды
  const getTotalSeconds = () => {
    const totalDays = (newTimerMonths * 30) + newTimerDays;
    const totalHours = (totalDays * 24) + newTimerHours;
    return totalHours * 3600;
  };

  // Ограничители для полей
  const handleMonthsChange = (value) => {
    let months = parseInt(value) || 0;
    if (months < 0) months = 0;
    if (months > 12) months = 12;
    setNewTimerMonths(months);
  };

  const handleDaysChange = (value) => {
    let days = parseInt(value) || 0;
    if (days < 0) days = 0;
    if (days > 31) days = 31;
    setNewTimerDays(days);
  };

  const handleHoursChange = (value) => {
    let hours = parseInt(value) || 0;
    if (hours < 0) hours = 0;
    if (hours > 24) hours = 24;
    setNewTimerHours(hours);
  };

  const createNewHorse = async () => {
    const totalSeconds = getTotalSeconds();
    if (totalSeconds <= 0) {
      alert('Пожалуйста, выберите время больше 0');
      return;
    }
    const newHorse = await horseService.create('Кличка лошади', '', totalSeconds);
    setCurrentHorse(newHorse);
    setIsEditing(true);
    await loadHorses();
  };

  const startTimer = async () => {
    if (currentHorse) {
      const totalSeconds = getTotalSeconds();
      if (totalSeconds <= 0) {
        alert('Пожалуйста, выберите время больше 0');
        return;
      }
      await horseService.restartTimer(currentHorse.id, totalSeconds);
      const updated = await horseService.getById(currentHorse.id);
      setCurrentHorse(updated);
      await loadHorses();
    }
  };

  const saveHorse = async () => {
    if (currentHorse) {
      await horseService.updateName(currentHorse.id, currentHorse.name);
      await horseService.updateComment(currentHorse.id, currentHorse.comment);
      setIsEditing(false);
      await loadHorses();
    }
  };

  const deleteHorse = async (id) => {
    if (window.confirm('Удалить эту лошадь из списка?')) {
      await horseService.delete(id);
      if (currentHorse?.id === id) {
        setCurrentHorse(null);
        setIsEditing(false);
      }
      await loadHorses();
    }
  };

  // Фильтрация по поиску
  const filteredHorses = searchQuery
    ? horses.filter(horse =>
        horse.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : horses;

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
          <button className="new-horse-btn" onClick={createNewHorse}>
            + Добавить лошадь
          </button>
          <button className="logout-btn" onClick={onLogout}>
            🚪 Выйти
          </button>
        </div>
      </header>

      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Поиск по кличке лошади..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="main-content">
        <div className="horses-list">
          {filteredHorses.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? '🔍 Ничего не найдено' : '🐴 Нет лошадей. Добавьте первую!'}
            </div>
          ) : (
            filteredHorses.map(horse => {
              const timerInfo = getTimeLeftForHorse(horse.endTime);
              const isExpired = horse.endTime && horse.endTime <= Date.now();
              return (
                <div
                  key={horse.id}
                  className={`horse-item ${currentHorse?.id === horse.id ? 'active' : ''} ${isExpired ? 'urgent-critical' : ''}`}
                  onClick={() => {
                    setCurrentHorse(horse);
                    setIsEditing(false);
                    // Устанавливаем значения для нового таймера из остатка времени
                    if (horse.endTime) {
                      const timeLeft = horse.endTime - Date.now();
                      if (timeLeft > 0) {
                        const totalHours = Math.floor(timeLeft / (1000 * 60 * 60));
                        const months = Math.floor(totalHours / (30 * 24));
                        const days = Math.floor((totalHours % (30 * 24)) / 24);
                        const hours = totalHours % 24;
                        setNewTimerMonths(months);
                        setNewTimerDays(days);
                        setNewTimerHours(hours);
                      }
                    }
                    updateCurrentDisplayTime();
                  }}
                >
                  <div className="horse-name">
                    {horse.name}
                  </div>
                  <div className={`horse-timer ${timerInfo.className}`}>
                    ⏱️ {timerInfo.text}
                  </div>
                  {horse.comment && (
                    <div className="horse-comment-preview">
                      💬 {horse.comment.substring(0, 60)}
                      {horse.comment.length > 60 ? '...' : ''}
                    </div>
                  )}
                  <button
                    className="delete-horse-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteHorse(horse.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="editor">
          {currentHorse ? (
            <>
              <input
                type="text"
                value={currentHorse.name || ''}
                onChange={(e) => setCurrentHorse({
                  ...currentHorse,
                  name: e.target.value
                })}
                placeholder="Кличка лошади"
                className="horse-name-input"
                disabled={!isEditing}
              />
              
              <div className="timer-section">
                <div className="timer-display">
                  {currentDisplayTime || (currentHorse.endTime ? formatTimeLeft(currentHorse.endTime - Date.now()) : '00 : 00 : 00 : 00')}
                </div>
                <div className="timer-controls">
                  <div className="timer-input-group">
                    <input
                      type="number"
                      value={newTimerMonths}
                      onChange={(e) => handleMonthsChange(e.target.value)}
                      className="timer-input"
                      min="0"
                      max="12"
                      step="1"
                    />
                    <span>мес. (0-12)</span>
                  </div>
                  <div className="timer-input-group">
                    <input
                      type="number"
                      value={newTimerDays}
                      onChange={(e) => handleDaysChange(e.target.value)}
                      className="timer-input"
                      min="0"
                      max="31"
                      step="1"
                    />
                    <span>дн. (0-31)</span>
                  </div>
                  <div className="timer-input-group">
                    <input
                      type="number"
                      value={newTimerHours}
                      onChange={(e) => handleHoursChange(e.target.value)}
                      className="timer-input"
                      min="0"
                      max="24"
                      step="1"
                    />
                    <span>ч. (0-24)</span>
                  </div>
                  <button onClick={startTimer} className="start-timer-btn">
                    ▶️ Старт
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '10px' }}>
                  * 1 месяц = 30 дней | Максимум: 12 мес. 31 дн. 24 ч.
                </div>
              </div>
              
              <textarea
                value={currentHorse.comment || ''}
                onChange={(e) => setCurrentHorse({
                  ...currentHorse,
                  comment: e.target.value
                })}
                placeholder="📝 Комментарий (особенности, характер, проблемы с копытами...)"
                className="comment-textarea"
                disabled={!isEditing}
              />
              
              <div className="editor-actions">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="edit-btn">
                    ✏️ Редактировать
                  </button>
                ) : (
                  <button onClick={saveHorse} className="save-btn">
                    💾 Сохранить изменения
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="empty-editor">
              <p>🐴 Выберите лошадь из списка</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>Или добавьте новую</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
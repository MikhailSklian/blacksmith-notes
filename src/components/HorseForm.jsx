import React, { useState, useEffect } from 'react';
import { horseService } from '../db/database';

function HorseForm({ horse, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [timerMonths, setTimerMonths] = useState(0);
  const [timerDays, setTimerDays] = useState(0);
  const [timerHours, setTimerHours] = useState(1);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (horse) {
      setName(horse.name || '');
      setComment(horse.comment || '');
      setIsEditing(true);
      
      // Если есть активный таймер, показываем его остаток
      if (horse.endTime) {
        const timeLeft = horse.endTime - Date.now();
        if (timeLeft > 0) {
          const totalHours = Math.floor(timeLeft / (1000 * 60 * 60));
          const months = Math.floor(totalHours / (30 * 24));
          const days = Math.floor((totalHours % (30 * 24)) / 24);
          const hours = totalHours % 24;
          setTimerMonths(months);
          setTimerDays(days);
          setTimerHours(hours);
        }
      }
    } else {
      setName('');
      setComment('');
      setTimerMonths(0);
      setTimerDays(0);
      setTimerHours(1);
      setIsEditing(false);
    }
  }, [horse]);

  const getTotalSeconds = () => {
    const totalDays = (timerMonths * 30) + timerDays;
    const totalHours = (totalDays * 24) + timerHours;
    return totalHours * 3600;
  };

  const handleMonthsChange = (value) => {
    let months = parseInt(value) || 0;
    if (months < 0) months = 0;
    if (months > 12) months = 12;
    setTimerMonths(months);
  };

  const handleDaysChange = (value) => {
    let days = parseInt(value) || 0;
    if (days < 0) days = 0;
    if (days > 31) days = 31;
    setTimerDays(days);
  };

  const handleHoursChange = (value) => {
    let hours = parseInt(value) || 0;
    if (hours < 0) hours = 0;
    if (hours > 24) hours = 24;
    setTimerHours(hours);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Введите кличку лошади');
      return;
    }
    
    const totalSeconds = getTotalSeconds();
    if (totalSeconds <= 0) {
      alert('Выберите время больше 0');
      return;
    }
    
    if (isEditing && horse) {
      // Обновляем существующую лошадь
      await horseService.updateName(horse.id, name);
      await horseService.updateComment(horse.id, comment);
      await horseService.restartTimer(horse.id, totalSeconds);
    } else {
      // Создаём новую лошадь
      await horseService.create(name, comment, totalSeconds);
    }
    
    onSave();
  };

  const handleDelete = async () => {
    if (horse && window.confirm('Удалить эту лошадь?')) {
      await horseService.delete(horse.id);
      onSave();
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{isEditing ? '✏️ Редактировать лошадь' : '🐴 Добавить новую лошадь'}</h2>
        <button className="cancel-btn" onClick={onCancel}>
          ✖️ Отмена
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="horse-form">
        <div className="form-group">
          <label>Кличка лошади:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введите кличку"
            className="form-input"
            autoFocus
          />
        </div>
        
        <div className="form-group">
          <label>📝 Комментарий:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Особенности, характер, проблемы с копытами..."
            className="form-textarea"
            rows="4"
          />
        </div>
        
        <div className="form-group">
          <label>⏱️ Время до следующей подковки:</label>
          <div className="timer-inputs">
            <div className="timer-input-group">
              <input
                type="number"
                value={timerMonths}
                onChange={(e) => handleMonthsChange(e.target.value)}
                className="form-input-small"
                min="0"
                max="12"
                step="1"
              />
              <span>мес. (0-12)</span>
            </div>
            <div className="timer-input-group">
              <input
                type="number"
                value={timerDays}
                onChange={(e) => handleDaysChange(e.target.value)}
                className="form-input-small"
                min="0"
                max="31"
                step="1"
              />
              <span>дн. (0-31)</span>
            </div>
            <div className="timer-input-group">
              <input
                type="number"
                value={timerHours}
                onChange={(e) => handleHoursChange(e.target.value)}
                className="form-input-small"
                min="0"
                max="24"
                step="1"
              />
              <span>ч. (0-24)</span>
            </div>
          </div>
          <div className="timer-note">
            * 1 месяц = 30 дней | Максимум: 12 мес. 31 дн. 24 ч.
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="save-btn">
            💾 {isEditing ? 'Сохранить изменения' : 'Добавить лошадь'}
          </button>
          {isEditing && (
            <button type="button" className="delete-form-btn" onClick={handleDelete}>
              🗑️ Удалить лошадь
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default HorseForm;
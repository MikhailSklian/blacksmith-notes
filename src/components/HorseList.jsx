import React, { useState } from 'react';

function HorseList({ horses, onEdit, onDelete }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Форматирование времени в формат Месяцы:Дни:Часы:Минуты
  const formatTimeLeft = (ms) => {
    if (!ms || ms <= 0) return '00 : 00 : 00 : 00';
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const months = Math.floor(totalMinutes / (30 * 24 * 60));
    const days = Math.floor((totalMinutes % (30 * 24 * 60)) / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    return `${months.toString().padStart(2, '0')} : ${days.toString().padStart(2, '0')} : ${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')}`;
  };

  const getTimeLeftForHorse = (endTime) => {
    if (!endTime) return { text: '00 : 00 : 00 : 00', className: 'timer-normal', urgency: 'normal' };
    const timeLeft = endTime - Date.now();
    if (timeLeft <= 0) {
      return { text: '00 : 00 : 00 : 00', className: 'timer-urgent', urgency: 'critical' };
    }
    
    const text = formatTimeLeft(timeLeft);
    const totalDays = timeLeft / (1000 * 60 * 60 * 24);
    
    // Новая логика цветов:
    // Меньше 3 дней (72 часа) -> красный
    // Меньше 7 дней (168 часов) -> оранжевый
    // Больше 7 дней -> зелёный
    if (totalDays < 3) {
      return { text, className: 'timer-urgent', urgency: 'critical' };
    } else if (totalDays < 7) {
      return { text, className: 'timer-warning', urgency: 'warning' };
    } else {
      return { text, className: 'timer-normal', urgency: 'normal' };
    }
  };

  const filteredHorses = searchQuery
    ? horses.filter(horse =>
        horse.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : horses;

  return (
    <div className="main-content">
      <div className="search-container">
        <input
          type="text"
          placeholder="Поиск по кличке..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="horses-list">
        {filteredHorses.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? 'Ничего не найдено' : 'Нет лошадей. Добавьте первую'}
          </div>
        ) : (
          filteredHorses.map(horse => {
            const timerInfo = getTimeLeftForHorse(horse.endTime);
            const isExpired = horse.endTime && horse.endTime <= Date.now();
            return (
              <div
                key={horse.id}
                className={`horse-item ${isExpired ? 'urgent-critical' : ''} ${timerInfo.urgency === 'critical' ? 'urgent-critical' : ''} ${timerInfo.urgency === 'warning' ? 'urgent-warning' : ''}`}
                onClick={() => onEdit(horse)}
              >
                <div className="horse-name">
                  {horse.name}
                </div>
                <div className={`horse-timer ${timerInfo.className}`}>
                  {timerInfo.text}
                </div>
                {horse.comment && (
                  <div className="horse-comment-preview">
                    {horse.comment.substring(0, 60)}
                    {horse.comment.length > 60 ? '...' : ''}
                  </div>
                )}
                <button
                  className="delete-horse-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(horse.id);
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default HorseList;
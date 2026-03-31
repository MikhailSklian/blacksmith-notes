import React, { useState, useEffect } from 'react';
import { noteService } from './db/database';
import './App.css';

// Категории для кузнеца
const CATEGORIES = ['Все', '🔨 Заказы', '⚔️ Рецепты', '💡 Идеи', '🧱 Материалы', '📅 Расписание'];

function App({ onLogout }) {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Загружаем заметки при старте и при смене категории
  useEffect(() => {
    loadNotes();
  }, [selectedCategory]);

  // Слушаем статус сети
  useEffect(() => {
    window.addEventListener('online', () => setIsOffline(false));
    window.addEventListener('offline', () => setIsOffline(true));
    return () => {
      window.removeEventListener('online', () => setIsOffline(false));
      window.removeEventListener('offline', () => setIsOffline(true));
    };
  }, []);

  const loadNotes = async () => {
    let allNotes;
    if (selectedCategory === 'Все') {
      allNotes = await noteService.getAll();
    } else {
      allNotes = await noteService.getByCategory(selectedCategory);
    }
    setNotes(allNotes);
  };

  const createNewNote = async () => {
    const newNote = await noteService.create('Новая заметка', '', '📅 Расписание');
    setCurrentNote(newNote);
    setIsEditing(true);
    await loadNotes();
  };

  const saveNote = async () => {
    if (currentNote) {
      await noteService.update(currentNote.id, {
        title: currentNote.title,
        content: currentNote.content,
        category: currentNote.category
      });
      setIsEditing(false);
      await loadNotes();
    }
  };

  const deleteNote = async (id) => {
    if (window.confirm('Удалить заметку?')) {
      await noteService.delete(id);
      if (currentNote?.id === id) {
        setCurrentNote(null);
        setIsEditing(false);
      }
      await loadNotes();
    }
  };

  // Фильтрация по поиску
  const filteredNotes = searchQuery
    ? notes.filter(note =>
        note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="app">
      {/* Оффлайн баннер */}
      {isOffline && (
        <div className="offline-banner">
          🔥 Оффлайн режим — все данные сохраняются на вашем устройстве
        </div>
      )}

      {/* Шапка */}
      <header className="header">
        <h1>
          <span>⚒️</span>
          Кузнечные Заметки
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="new-note-btn" onClick={createNewNote}>
            + Новая заметка
          </button>
          <button 
            onClick={onLogout}
            style={{
              background: '#7f8c8d',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#95a5a6'}
            onMouseLeave={(e) => e.target.style.background = '#7f8c8d'}
          >
            🚪 Выйти
          </button>
        </div>
      </header>

      {/* Поиск */}
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Поиск по заметкам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Фильтр по категориям */}
      <div className="category-filter">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="main-content">
        {/* Список заметок */}
        <div className="notes-list">
          {filteredNotes.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? '🔍 Ничего не найдено' : '📭 Нет заметок. Создайте первую!'}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                className={`note-item ${currentNote?.id === note.id ? 'active' : ''}`}
                onClick={() => {
                  setCurrentNote(note);
                  setIsEditing(false);
                }}
              >
                <div className="note-category">{note.category || '📝'}</div>
                <div className="note-title">
                  {note.title || 'Без названия'}
                </div>
                <div className="note-preview">
                  {note.content?.substring(0, 80) || 'Пустая заметка'}
                </div>
                <div className="note-date">
                  {formatDate(note.updatedAt)}
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {/* Редактор заметок */}
        <div className="editor">
          {currentNote ? (
            <>
              <input
                type="text"
                value={currentNote.title || ''}
                onChange={(e) => setCurrentNote({
                  ...currentNote,
                  title: e.target.value
                })}
                placeholder="Заголовок заметки"
                className="note-title-input"
                disabled={!isEditing}
              />
              
              <select
                value={currentNote.category || '📅 Расписание'}
                onChange={(e) => setCurrentNote({
                  ...currentNote,
                  category: e.target.value
                })}
                className="note-category-select"
                disabled={!isEditing}
              >
                {CATEGORIES.filter(c => c !== 'Все').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <textarea
                value={currentNote.content || ''}
                onChange={(e) => setCurrentNote({
                  ...currentNote,
                  content: e.target.value
                })}
                placeholder="Текст заметки..."
                className="note-content-input"
                disabled={!isEditing}
              />
              
              <div className="editor-actions">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="edit-btn">
                    ✏️ Редактировать
                  </button>
                ) : (
                  <button onClick={saveNote} className="save-btn">
                    💾 Сохранить
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="empty-editor">
              <p>⚒️ Выберите заметку или создайте новую</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>Здесь будут ваши кузнечные записи</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
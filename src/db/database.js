import Dexie from 'dexie';

// Создаем базу данных
export const db = new Dexie('BlacksmithNotes');

// Определяем структуру таблиц
db.version(1).stores({
  notes: '++id, title, content, category, createdAt, updatedAt',
  categories: '++id, name, icon'
});

// Добавляем начальные категории для кузнеца (только если их нет)
db.categories.bulkAdd([
  { name: '🔨 Заказы', icon: '🔨' },
  { name: '⚔️ Рецепты', icon: '⚔️' },
  { name: '💡 Идеи', icon: '💡' },
  { name: '🧱 Материалы', icon: '🧱' },
  { name: '📅 Расписание', icon: '📅' }
]).catch(() => {
  // Категории уже существуют - игнорируем ошибку
  console.log('Категории уже добавлены');
});

// Функции для работы с заметками
export const noteService = {
  // Получить все заметки (сортировка по дате обновления: новые сверху)
  async getAll() {
    try {
      return await db.notes.orderBy('updatedAt').reverse().toArray();
    } catch (error) {
      console.error('Ошибка при получении заметок:', error);
      return [];
    }
  },
  
  // Получить заметки по категории
  async getByCategory(category) {
    try {
      return await db.notes.where('category').equals(category).reverse().sortBy('updatedAt');
    } catch (error) {
      console.error('Ошибка при получении заметок по категории:', error);
      return [];
    }
  },
  
  // Получить заметку по id
  async getById(id) {
    try {
      return await db.notes.get(id);
    } catch (error) {
      console.error('Ошибка при получении заметки:', error);
      return null;
    }
  },
  
  // Создать новую заметку
  async create(title, content, category = '📅 Расписание') {
    try {
      const now = new Date().toISOString();
      const id = await db.notes.add({
        title: title || '',
        content: content || '',
        category: category,
        createdAt: now,
        updatedAt: now
      });
      return await db.notes.get(id);
    } catch (error) {
      console.error('Ошибка при создании заметки:', error);
      return null;
    }
  },
  
  // Обновить заметку
  async update(id, data) {
    try {
      await db.notes.update(id, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      return await db.notes.get(id);
    } catch (error) {
      console.error('Ошибка при обновлении заметки:', error);
      return null;
    }
  },
  
  // Удалить заметку
  async delete(id) {
    try {
      await db.notes.delete(id);
      return true;
    } catch (error) {
      console.error('Ошибка при удалении заметки:', error);
      return false;
    }
  },
  
  // Поиск по заметкам
  async search(query) {
    try {
      if (!query || query.trim() === '') {
        return await this.getAll();
      }
      const notes = await db.notes.toArray();
      const lowerQuery = query.toLowerCase();
      return notes.filter(note => 
        (note.title && note.title.toLowerCase().includes(lowerQuery)) ||
        (note.content && note.content.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('Ошибка при поиске:', error);
      return [];
    }
  },
  
  // Получить количество заметок
  async getCount() {
    try {
      return await db.notes.count();
    } catch (error) {
      console.error('Ошибка при подсчете заметок:', error);
      return 0;
    }
  },
  
  // Удалить все заметки (осторожно!)
  async deleteAll() {
    try {
      await db.notes.clear();
      return true;
    } catch (error) {
      console.error('Ошибка при удалении всех заметок:', error);
      return false;
    }
  }
};

// Функции для работы с категориями (если понадобятся позже)
export const categoryService = {
  // Получить все категории
  async getAll() {
    try {
      return await db.categories.toArray();
    } catch (error) {
      console.error('Ошибка при получении категорий:', error);
      return [];
    }
  },
  
  // Добавить новую категорию
  async add(name, icon = '📝') {
    try {
      const existing = await db.categories.where('name').equals(name).first();
      if (existing) {
        return existing;
      }
      const id = await db.categories.add({ name, icon });
      return await db.categories.get(id);
    } catch (error) {
      console.error('Ошибка при добавлении категории:', error);
      return null;
    }
  },
  
  // Удалить категорию
  async delete(name) {
    try {
      await db.categories.where('name').equals(name).delete();
      return true;
    } catch (error) {
      console.error('Ошибка при удалении категории:', error);
      return false;
    }
  }
};

// Экспортируем также саму базу данных для прямого доступа при необходимости
export default db;
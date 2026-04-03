import Dexie from 'dexie';

// Создаем базу данных
export const db = new Dexie('BlacksmithHorses');

// Определяем структуру таблиц
db.version(1).stores({
  horses: '++id, name, endTime, comment, isActive'
});

// Функции для работы с лошадьми
export const horseService = {
  // Получить всех лошадей с сортировкой (чем меньше осталось времени - тем выше)
  async getAll() {
    try {
      const horses = await db.horses.toArray();
      // Сортируем: сначала те, у кого меньше осталось времени
      return horses.sort((a, b) => {
        const timeLeftA = a.endTime ? a.endTime - Date.now() : Infinity;
        const timeLeftB = b.endTime ? b.endTime - Date.now() : Infinity;
        return timeLeftA - timeLeftB;
      });
    } catch (error) {
      console.error('Ошибка:', error);
      return [];
    }
  },
  
  // Получить лошадь по id
  async getById(id) {
    try {
      return await db.horses.get(id);
    } catch (error) {
      console.error('Ошибка:', error);
      return null;
    }
  },
  
  // Создать новую лошадь
  async create(name, comment, durationSeconds) {
    try {
      const now = Date.now();
      const endTime = now + (durationSeconds * 1000);
      
      const id = await db.horses.add({
        name: name || 'Безымянная лошадь',
        comment: comment || '',
        endTime: endTime,
        createdAt: now,
        isActive: true
      });
      return await db.horses.get(id);
    } catch (error) {
      console.error('Ошибка при создании:', error);
      return null;
    }
  },
  
  // Запустить таймер заново
  async restartTimer(id, durationSeconds) {
    try {
      const horse = await db.horses.get(id);
      if (!horse) return null;
      
      const now = Date.now();
      const endTime = now + (durationSeconds * 1000);
      
      await db.horses.update(id, {
        endTime: endTime,
        isActive: true
      });
      return await db.horses.get(id);
    } catch (error) {
      console.error('Ошибка при перезапуске таймера:', error);
      return null;
    }
  },
  
  // Обновить комментарий
  async updateComment(id, comment) {
    try {
      await db.horses.update(id, { comment: comment });
      return await db.horses.get(id);
    } catch (error) {
      console.error('Ошибка:', error);
      return null;
    }
  },
  
  // Обновить имя
  async updateName(id, name) {
    try {
      await db.horses.update(id, { name: name });
      return await db.horses.get(id);
    } catch (error) {
      console.error('Ошибка:', error);
      return null;
    }
  },
  
  // Удалить лошадь
  async delete(id) {
    try {
      await db.horses.delete(id);
      return true;
    } catch (error) {
      console.error('Ошибка при удалении:', error);
      return false;
    }
  },
  
  // Поиск
  async search(query) {
    try {
      if (!query || query.trim() === '') {
        return await this.getAll();
      }
      const horses = await db.horses.toArray();
      const lowerQuery = query.toLowerCase();
      return horses.filter(horse => 
        horse.name.toLowerCase().includes(lowerQuery)
      ).sort((a, b) => {
        const timeLeftA = a.endTime ? a.endTime - Date.now() : Infinity;
        const timeLeftB = b.endTime ? b.endTime - Date.now() : Infinity;
        return timeLeftA - timeLeftB;
      });
    } catch (error) {
      console.error('Ошибка при поиске:', error);
      return [];
    }
  }
};

export default db;
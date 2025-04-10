const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); 

// Раздача статических файлов из папки 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Подключаем или создаём базу данных
const db = new sqlite3.Database(path.join(__dirname, 'quiz.db'), (err) => {
  if (err) {
    console.error('Ошибка подключения к БД:', err.message);
  } else {
    console.log('Подключение к базе данных успешно выполнено');
  }
});

// Инициализация базы данных (создание таблиц и заполнение начальными данными)
const initDB = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      image TEXT NOT NULL,
      explanation TEXT NOT NULL
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      isCorrect INTEGER NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `, [], (err) => {
    if (err) {
      console.error('Ошибка создания таблицы answers:', err.message);
    }
  });

  // Если база пуста, заполняем начальными данными
  db.get("SELECT COUNT(*) AS count FROM questions", (err, row) => {
    if (err) {
      return console.error('Ошибка выборки из questions:', err.message);
    }
    if (row.count === 0) {
      console.log('Заполняем базу начальными данными...');
      // Добавляем первый вопрос
      db.run("INSERT INTO questions (text, image, explanation) VALUES (?, ?, ?)",
        ['Когда был основан университет?', 'images/gg_wp.jpg', 'Правильный ответ: 1820 год. Ай-яй, вы отчислены с ФКТИ!'], function(err) {
          if (err) return console.error(err.message);
          const questionId = this.lastID;
          const answers = [
            ['1800', 0],
            ['1820', 1],
            ['1850', 0],
            ['1900', 0]
          ];
          answers.forEach(answer => {
            db.run("INSERT INTO answers (question_id, text, isCorrect) VALUES (?, ?, ?)", [questionId, answer[0], answer[1]]);
          });
        });
      
      // Добавляем второй вопрос
      db.run("INSERT INTO questions (text, image, explanation) VALUES (?, ?, ?)",
        ['Как называется главный корпус университета?', 'images/gg_wp.jpg', 'Центральный корпус — сердце университета, где расположены основные кафедры.'], function(err) {
          if (err) return console.error(err.message);
          const questionId = this.lastID;
          const answers = [
            ['Главный дом', 0],
            ['Факультетский двор', 0],
            ['Центральный корпус', 1],
            ['Новый корпус', 0]
          ];
          answers.forEach(answer => {
            db.run("INSERT INTO answers (question_id, text, isCorrect) VALUES (?, ?, ?)", [questionId, answer[0], answer[1]]);
          });
        });
    }
  });
};

initDB();

// API маршрут для получения викторины
app.get('/api/quiz', (req, res) => {
  const sql = `
    SELECT 
      q.id as questionId,
      q.text as questionText,
      q.image as questionImage,
      q.explanation as questionExplanation,
      a.id as answerId,
      a.text as answerText,
      a.isCorrect as answerIsCorrect
    FROM questions q
    LEFT JOIN answers a ON q.id = a.question_id
    ORDER BY q.id, a.id
  `;
  db.all(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Группируем данные по вопросам
    const quiz = [];
    rows.forEach(row => {
      let question = quiz.find(q => q.id === row.questionId);
      if (!question) {
        question = {
          id: row.questionId,
          text: row.questionText,
          image: row.questionImage,
          explanation: row.questionExplanation,
          answers: []
        };
        quiz.push(question);
      }
      question.answers.push({
        id: row.answerId,
        text: row.answerText,
        isCorrect: !!row.answerIsCorrect
      });
    });
    res.json(quiz);
  });
});

// Подключаем административные маршруты
const adminRoutes = require('./adminRoutes');
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

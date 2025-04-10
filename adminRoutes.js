// adminRoutes.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Открываем подключение к той же базе, что и в server.js
const db = new sqlite3.Database(path.join(__dirname, 'quiz.db'), (err) => {
  if (err) {
    console.error('Ошибка подключения к БД:', err.message);
  }
});

// Добавление нового вопроса вместе с вариантами ответов
// Ожидается, что в теле запроса будет объект вида:
// {
//   text: "Вопрос",
//   image: "images/example.jpg",
//   explanation: "Пояснение",
//   answers: [
//     { text: "Ответ 1", isCorrect: false },
//     { text: "Ответ 2", isCorrect: true },
//     { text: "Ответ 3", isCorrect: false },
//     { text: "Ответ 4", isCorrect: false }
//   ]
// }
router.post('/question', (req, res) => {
  const { text, image, explanation, answers } = req.body;
  if (!text || !image || !explanation || !answers || !answers.length) {
    return res.status(400).json({ error: 'Неверный формат данных.' });
  }
  db.run(
    "INSERT INTO questions (text, image, explanation) VALUES (?, ?, ?)",
    [text, image, explanation],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const questionId = this.lastID;
      // Для простоты вставку ответов выполняем последовательно. 
      // (В продакшене желательно использовать транзакции.)
      answers.forEach(answer => {
        db.run(
          "INSERT INTO answers (question_id, text, isCorrect) VALUES (?, ?, ?)",
          [questionId, answer.text, answer.isCorrect ? 1 : 0],
          (err) => {
            if (err) console.error('Ошибка добавления ответа:', err.message);
          }
        );
      });
      res.json({ questionId, message: 'Вопрос успешно добавлен.' });
    }
  );
});

// Обновление существующего вопроса (без обновления вариантов ответов)
// Ожидается, что в теле запроса будут новые значения полей question: text, image, explanation.
router.put('/question/:id', (req, res) => {
  const questionId = req.params.id;
  const { text, image, explanation } = req.body;
  db.run(
    "UPDATE questions SET text = ?, image = ?, explanation = ? WHERE id = ?",
    [text, image, explanation, questionId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: true, message: 'Вопрос обновлён.' });
    }
  );
});

// Удаление вопроса вместе с вариантами ответов
router.delete('/question/:id', (req, res) => {
  const questionId = req.params.id;
  db.run("DELETE FROM questions WHERE id = ?", questionId, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // Удаляем ответы, связанные с данным вопросом
    db.run("DELETE FROM answers WHERE question_id = ?", questionId, function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ deleted: true, message: 'Вопрос и ответы удалены.' });
    });
  });
});

module.exports = router;

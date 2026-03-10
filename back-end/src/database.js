const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Inicia a conexão com o banco de dados local
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar com o banco de dados SQLite:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite com sucesso.');
    
    // Crio as tabelas manualmente com SQL puro caso elas não existam
    db.serialize(() => {
      // Tabela de Pedidos
      db.run(`
        CREATE TABLE IF NOT EXISTS Orders (
          orderId TEXT PRIMARY KEY,
          value REAL NOT NULL,
          creationDate TEXT NOT NULL
        )
      `);

      // Tabela de Itens (Sem chave primária automática, exatamente como solicitado)
      db.run(`
        CREATE TABLE IF NOT EXISTS Items (
          orderId TEXT NOT NULL,
          productId INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          FOREIGN KEY(orderId) REFERENCES Orders(orderId) ON DELETE CASCADE
        )
      `);
    });
  }
});

module.exports = db;

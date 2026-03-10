const express = require('express');
require('./database'); // Garante que a conexao e tabelas criem no inicio
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');

const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Libera o CORS para o front-end conseguir acessar a API sem erros
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/auth', authRoutes);
app.use('/order', orderRoutes);

// Inicio o servidor na porta configurada
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

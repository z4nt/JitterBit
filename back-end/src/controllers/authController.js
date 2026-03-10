const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/authMiddleware');

const authController = {
  login(req, res) {
    const { username, password } = req.body;

    // Valores manuais de administrador apenas para eu testar a conexão no momento
    if (username === 'admin' && password === 'admin') {
      const id = 1; // Representação de um ID de usuário no banco
      const token = jwt.sign({ id }, SECRET_KEY, {
        expiresIn: '1h' // Define tempo de expiração do token para 1 hora
      });

      return res.json({ auth: true, token: token });
    }

    return res.status(401).json({ error: 'Credenciais de login inválidas' });
  }
};

module.exports = authController;

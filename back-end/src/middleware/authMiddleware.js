const jwt = require('jsonwebtoken');

// Chave secreta do token, em um ambiente de produção ficaria armazenada em um arquivo .env
const SECRET_KEY = 'super_secret_key_for_jitterbit'; 

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Nenhum token fornecido' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Erro no token: formato esperado é "Bearer <token>"' });
  }

  const token = parts[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Falha ao autenticar o token' });
    }

    req.userId = decoded.id;
    next();
  });
};

module.exports = {
  authMiddleware,
  SECRET_KEY
};

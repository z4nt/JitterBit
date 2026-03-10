const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protege todas as rotas para impedir o acesso de usuários sem o token
router.use(authMiddleware);

// Cadastramento dos Endpoints do Express
router.post('/', orderController.create);
router.get('/list', orderController.list); // Necessita vir antes da rota /:id para o sistema não confundir a string com parâmetro
router.get('/:id', orderController.get);
router.put('/:id', orderController.update);
router.delete('/:id', orderController.delete);

module.exports = router;

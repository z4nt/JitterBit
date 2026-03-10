const db = require('../database');

// Função para mapear os dados do JSON em português para o formato do banco de dados
const mapPayloadToEntity = (payload) => {
  const mapped = {};
  if (payload.numeroPedido) {
    // Isola a string base para usar como ID oficial removendo os caracteres de sufixo
    mapped.orderId = payload.numeroPedido.split('-')[0];
  }
  if (payload.valorTotal !== undefined) mapped.value = payload.valorTotal;
  if (payload.dataCriacao) mapped.creationDate = new Date(payload.dataCriacao).toISOString(); // Mantem string ISO padronizada no SQLite

  if (payload.items && Array.isArray(payload.items)) {
    mapped.items = payload.items.map(item => ({
      productId: parseInt(item.idItem, 10),
      quantity: item.quantidadeItem,
      price: item.valorItem
    }));
  }
  return mapped;
};

// Como o sqlite não tem suporte nativo a Promises, criei helpers manuais em Promise para usar async/await
const dbRun = (query, params) => new Promise((resolve, reject) => {
  db.run(query, params, function (err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const dbGet = (query, params) => new Promise((resolve, reject) => {
  db.get(query, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const dbAll = (query, params) => new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

// Função auxiliar pura que busca um pedido completo pelo ID (sem tocar no Express)
const findByPk = async (orderId) => {
  const order = await dbGet('SELECT * FROM Orders WHERE orderId = ?', [orderId]);
  if (!order) return null;

  const items = await dbAll('SELECT * FROM Items WHERE orderId = ?', [orderId]);
  order.items = items || [];

  return order;
};

const orderController = {
  // Criar um novo pedido
  async create(req, res) {
    try {
      const data = mapPayloadToEntity(req.body);

      // Valida se o payload enviado gerou algum dado útil
      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'Payload mal estruturado' });
      }

      if (!data.orderId) {
        return res.status(400).json({ error: 'numeroPedido is required' });
      }

      // Verifica se o ID já existe
      const existing = await dbGet('SELECT orderId FROM Orders WHERE orderId = ?', [data.orderId]);
      if (existing) {
        return res.status(409).json({ error: 'O pedido informado já encontra-se cadastrado' });
      }

      // Inicia a inserção principal
      await dbRun('INSERT INTO Orders (orderId, value, creationDate) VALUES (?, ?, ?)', [
        data.orderId,
        data.value,
        data.creationDate
      ]);

      // Insere os itens do pedido (se vierem no payload)
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await dbRun('INSERT INTO Items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)', [
            data.orderId,
            item.productId,
            item.quantity,
            item.price
          ]);
        }
      }

      // Busca o pedido recém-criado com seus itens
      const savedOrder = await findByPk(data.orderId);
      return res.status(201).json(savedOrder);
    } catch (error) {
      console.error('Ocorreu um erro durante a criação do pedido:', error);
      return res.status(500).json({ error: 'Ocorreu um erro interno no servidor' });
    }
  },

  // Buscar as informações de um pedido em específico
  async get(req, res) {
    try {
      const { id } = req.params;
      const order = await findByPk(id);

      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      return res.json(order);
    } catch (error) {
      console.error('Falha ao tentar recuperar as informações do pedido:', error);
      return res.status(500).json({ error: 'Ocorreu um erro interno no servidor' });
    }
  },

  // Retornar a listagem completa de pedidos
  async list(req, res) {
    try {
      const orders = await dbAll('SELECT * FROM Orders', []);
      const items = await dbAll('SELECT * FROM Items', []);

      // Junta as tabelas via codigo js
      const result = orders.map(o => ({
        ...o,
        items: items.filter(i => i.orderId === o.orderId).map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price
        }))
      }));

      return res.json(result);
    } catch (error) {
      console.error('Ocorreu um erro na extração da lista de pedidos:', error);
      return res.status(500).json({ error: 'Ocorreu um erro interno no servidor' });
    }
  },

  // Atualizar os registros de um pedido
  async update(req, res) {
    try {
      const { id } = req.params;
      const order = await dbGet('SELECT orderId FROM Orders WHERE orderId = ?', [id]);

      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      const updateData = mapPayloadToEntity(req.body);

      // Valida se o payload enviado gerou algum dado útil
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Payload mal estruturado' });
      }

      // Não prevejo atualizações em chaves de identificação (orderId), mas libero os outros atributos
      if (updateData.value !== undefined) {
        await dbRun('UPDATE Orders SET value = ? WHERE orderId = ?', [updateData.value, id]);
      }
      if (updateData.creationDate) {
        await dbRun('UPDATE Orders SET creationDate = ? WHERE orderId = ?', [updateData.creationDate, id]);
      }

      // Caso o array contenha itens, descarto os do banco e injeto a nova lista de modo integral
      if (updateData.items) {
        await dbRun('DELETE FROM Items WHERE orderId = ?', [id]);
        for (const item of updateData.items) {
          await dbRun('INSERT INTO Items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)', [
            id,
            item.productId,
            item.quantity,
            item.price
          ]);
        }
      }

      const updatedOrder = await findByPk(id);
      return res.json(updatedOrder);
    } catch (error) {
      console.error('O processo de atualização do pedido falhou:', error);
      return res.status(500).json({ error: 'Ocorreu um erro interno no servidor' });
    }
  },

  // Excluir um pedido do banco de dados
  async delete(req, res) {
    try {
      const { id } = req.params;
      const deletedInfo = await dbRun('DELETE FROM Orders WHERE orderId = ?', [id]);
      const deletedInfo2 = await dbRun('DELETE FROM Items WHERE orderId = ?', [id]);
      // O campo changes do this mostra quantas linhas foram afetadas no sqlite
      if (deletedInfo.changes === 0 && deletedInfo2.changes === 0) {
        return res.status(404).json({ error: 'A requisição de exclusão falhou pelo pedido não estar cadastrado' });
      }

      return res.status(204).send(); // Status de sucesso simples desprovido de conteudo
    } catch (error) {
      console.error('Falha interna ao tentar excluir o pedido:', error);
      return res.status(500).json({ error: 'Ocorreu um erro interno no servidor' });
    }
  }
};

module.exports = orderController;

# API de Pedidos (Order API)
Olá me chamo Antoniel e esse é o meu desafio técnico para a JitterBit.

Eu utilizei IA para me auxiliar no projeto, mas consigo explicar cada linha do código.
Utilizei SQL puro por conta de limitações do ORM Sequelize.

Este módulo de Back-End foi construído em Node.js com Express e SQLite para o gerenciamento de pedidos (CRUD completo), implementando os requisitos do desafio técnico da JitterBit.

Deixei dois JSONs de exemplo para testes.

## Tecnologias Utilizadas
Node.js
Express
SQLite3 (Banco de dados em arquivo local, sem ORM)
JSON Web Token (Autenticação)

## Como Rodar o Projeto

1. Abra o terminal na pasta do projeto back-end.
2. Instale as dependências executando:
   npm install

3. Inicie o servidor em modo de desenvolvimento executando:
   npm run dev

O terminal deve exibir a porta em que a aplicação rodará (por padrão http://localhost:3000) e a conexão com o banco SQLite.

## Passo 1: Autenticação
A API exige uma camada de autenticação JWT. Para acessar os endpoints de Order, primeiro é necessário autuar via Login.

Faça uma requisição POST para /auth/login

URL: http://localhost:3000/auth/login
Method: POST
Body (JSON):
{
  "username": "admin",
  "password": "admin"
}

Esse usuário está hardcodado no código para facilitar a autenticação.

Você receberá de volta uma resposta com a sua credencial JWT ('token'). Copie esta string para usar nas instruções abaixo.

## Passo 2: Endpoints da API

Para todo acesso num endpoint de /order, deve-se incluir um Header de Autorização.
Adicione um cabeçalho na requisição:
Authorization: Bearer <seu_token_aqui>

1. Criar um Pedido
Recebe o payload em português (como solicitado). O sufixo do ID enviado pela URL (ex: "-01") será removido no registro do BD.
URL: http://localhost:3000/order
Method: POST
Body (JSON):
{
  "numeroPedido": "v10089015vdb-01",
  "valorTotal": 10000,
  "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
  "items": [
    {
      "idItem": "2434",
      "quantidadeItem": 1,
      "valorItem": 1000
    }
  ]
}

2. Listar Todos os Pedidos
URL: http://localhost:3000/order/list
Method: GET

3. Buscar um Pedido Específico
Para buscar pelo número de pedido limpo, sem sufixo adicional:
URL: http://localhost:3000/order/v10089015vdb
Method: GET

4. Atualizar um Pedido
URL: http://localhost:3000/order/v10089015vdb
Method: PUT
Body (JSON): Utilize a mesma estrutura do Create enviando os novos valores de totais e os arrays de itens, se aplicável.

5. Deletar um Pedido
URL: http://localhost:3000/order/v10089015vdb
Method: DELETE

## Estrutura do Código

src/index.js: Porta de entrada da aplicação

src/database.js: Conexão com o SQLite e criação das tabelas via SQL puro (CREATE TABLE)

src/routes/: Contém a ramificação completa de URLs para o módulo (express.Router)

src/controllers/: Lógica e persistência de criação das ordens, mapeamento dos JSONs PT -> EN

src/middleware/: Contém a lógica do validador JWT (authMiddleware.js) utilizado pelo módulo routes/

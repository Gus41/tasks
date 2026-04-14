# Task Manager API + Frontend

Aplicação fullstack para gerenciamento de tarefas com CRUD completo.

![.NET 8](https://img.shields.io/badge/.NET-8-512BD4?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-TypeScript-black?style=flat-square)
![MySQL](https://img.shields.io/badge/MySQL-Docker-4479A1?style=flat-square)

---

## Stack

| Camada       | Tecnologias                          |
|--------------|--------------------------------------|
| Backend      | C# · .NET 8 · Entity Framework Core  |
| Frontend     | Next.js · TypeScript · Tailwind CSS   |
| Banco        | MySQL (via Docker)                   |

---

## Como rodar

### 1. Subir o banco de dados

```bash
docker-compose up -d
```

### 2. Rodar o backend

```bash
cd backend/TodoApi
dotnet restore
dotnet ef database update
dotnet run
```

### 3. Variáveis de ambiente
criar um .env.local dentro de frontend/app com a url da api
NEXT_PUBLIC_API_URL=""


### 3. Rodar o frontend

```bash
cd frontend/app
npm install
npm run dev
```


---

## Endpoints da API

| Método   | Rota               | Descrição           |
|----------|--------------------|---------------------|
| `GET`    | `/api/Tasks`       | Listar tarefas       |
| `POST`   | `/api/Tasks`       | Criar tarefa         |
| `PUT`    | `/api/Tasks/{id}`  | Atualizar tarefa     |
| `DELETE` | `/api/Tasks/{id}`  | Remover tarefa       |

---

## Schema · tabela `Tasks`

| Campo         | Tipo       | Detalhes                                     |
|---------------|------------|----------------------------------------------|
| `Id`          | `int`      | PK · auto increment                          |
| `Title`       | `string`   |                                              |
| `Description` | `string`   |                                              |
| `Status`      | `enum`     | `Pending` · `InProgress` · `Completed`       |
| `Priority`    | `enum`     | `Low` · `Medium` · `High`                   |
| `CreatedAt`   | `datetime` |                                              |
| `CompletedAt` | `datetime` | nullable                                     |
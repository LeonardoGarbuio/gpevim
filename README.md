# GPEVIM - Grupo de Propriedades Eletrônicos e Vibracionais em Materiais

Website institucional do grupo de pesquisa GPEVIM, desenvolvido com HTML5, CSS3, JavaScript e Node.js.

## 📋 Descrição

Este é o website oficial do GPEVIM, um grupo de pesquisa focado em propriedades eletrônicos e vibracionais em materiais. O site inclui:

- **Páginas institucionais**: Home, Sobre, Membros, Notícias, Projetos, Materiais
- **Sistema de publicações**: Área para professores adicionarem suas publicações
- **Área administrativa**: Painel restrito para gerenciamento de conteúdo
- **Design responsivo**: Adaptável para desktop, tablet e mobile

## 🏗️ Estrutura do Projeto

```
gpevim-main/
├── index.html              # Página inicial
├── about.html              # Sobre o grupo
├── member.html             # Membros do grupo
├── news.html               # Notícias
├── projects.html           # Projetos
├── materials.html          # Materiais
├── publications.html       # Publicações (pública)
├── login.html              # Login administrativo
├── admin-panel.html        # Painel administrativo
├── css/
│   └── estilo.css          # Estilos principais
├── js/
│   ├── script.js           # Scripts do frontend
│   └── server.js           # Servidor Node.js/Express
├── img/                    # Imagens do site
├── uploads/                # Imagens enviadas pelos usuários
├── package.json            # Dependências e scripts
└── README.md               # Este arquivo
```

## 🚀 Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura semântica das páginas
- **CSS3**: Estilização responsiva e moderna
- **JavaScript**: Interatividade e funcionalidades dinâmicas

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **PostgreSQL**: Banco de dados relacional
- **Multer**: Upload de arquivos
- **pg**: Cliente PostgreSQL para Node.js

## 📦 Instalação e Configuração Local

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm (Node Package Manager)

### Passos para instalação

1. **Clone o repositório**
   ```bash
   git clone [URL_DO_REPOSITORIO]
   cd gpevim-main
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   DATABASE_URL=sua_url_do_postgresql
   NODE_ENV=development
   ```

4. **Inicie o servidor**
   ```bash
   npm start
   ```

5. **Acesse o site**
   Abra seu navegador e acesse: `http://localhost:3000`

## 🗄️ Estrutura do Banco de Dados

### Tabela: `publications`
```sql
CREATE TABLE publications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    publication_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: `admin_users`
```sql
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### Publicações
- `GET /api/publications` - Lista todas as publicações
- `POST /api/publications` - Adiciona nova publicação
- `DELETE /api/publications/:id` - Remove publicação

### Upload
- `POST /api/upload-image` - Faz upload de imagem

### Autenticação
- `POST /api/login` - Autentica usuário administrativo

## 🔐 Acesso à Área Administrativa

### Métodos de Acesso

1. **Link direto**: Acesse `http://localhost:3000/login.html` (desenvolvimento local)
2. **Link discreto**: Procure pelo link "Admin" no rodapé de qualquer página do site

### ⚠️ Configuração de Credenciais

**IMPORTANTE**: As credenciais de acesso devem ser configuradas de forma segura:

1. **Para desenvolvimento local**: Configure as credenciais no arquivo `js/server.js`
2. **Para produção**: Use variáveis de ambiente no Render ou outro provedor
3. **Nunca commite credenciais** no repositório público

### 🔒 Segurança

- Altere as credenciais padrão antes do deploy
- Use senhas fortes e únicas
- Considere implementar autenticação mais robusta para produção

## 🌐 Deploy no Render

### 1. Criar Banco de Dados PostgreSQL

1. Acesse [Render Dashboard](https://dashboard.render.com/)
2. Clique em "New" → "PostgreSQL"
3. Configure:
   - **Name**: `gpevim-database`
   - **Database**: `gpevim_db`
   - **User**: `gpevim_user`
4. Anote as credenciais fornecidas

### 2. Criar Web Service

1. No Dashboard, clique em "New" → "Web Service"
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `gpevim-website`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Configurar Variáveis de Ambiente

No seu Web Service, adicione as seguintes variáveis:

```
DATABASE_URL=postgresql://gpevim_user:SUA_SENHA_AQUI@host:5432/gpevim_db
NODE_ENV=production
ADMIN_USERNAME=seu_usuario_admin
ADMIN_PASSWORD=sua_senha_forte
```

**⚠️ IMPORTANTE**: 
- Substitua `SUA_SENHA_AQUI` pela senha real do banco de dados
- Configure `ADMIN_USERNAME` e `ADMIN_PASSWORD` com credenciais seguras
- Nunca use credenciais padrão em produção

### 4. Deploy

1. Render fará o deploy automaticamente
2. O site estará disponível em: `https://seu-app.onrender.com`

## 🔧 Funcionalidades

### Área Pública
- **Navegação responsiva**: Menu adaptável para diferentes dispositivos
- **Páginas informativas**: Sobre, membros, projetos, materiais
- **Sistema de publicações**: Visualização das publicações dos professores
- **Design moderno**: Interface limpa e profissional

### Área Administrativa
- **Login seguro**: Autenticação para acesso restrito
- **Upload de imagens**: Suporte para envio de arquivos locais
- **Gerenciamento de publicações**: Adicionar, visualizar e excluir publicações
- **Preview de imagens**: Visualização antes do envio

## 🎨 Design e UX

- **Cores da empresa**: Amarelo e preto como cores principais
- **Design responsivo**: Adaptável para todos os dispositivos
- **Acessibilidade**: Atributos ARIA e navegação por teclado
- **Performance**: Otimizado para carregamento rápido

## 🔄 Modo Híbrido

O sistema funciona em modo híbrido:
- **Com banco de dados**: Funcionalidade completa com persistência
- **Sem banco de dados**: Funciona localmente com armazenamento em memória

## 🛠️ Desenvolvimento

### Scripts Disponíveis
- `npm start`: Inicia o servidor de produção
- `npm run dev`: Inicia o servidor de desenvolvimento com nodemon

### Estrutura de Desenvolvimento
- **Frontend**: Páginas HTML estáticas com JavaScript
- **Backend**: API REST com Express.js
- **Banco**: PostgreSQL com fallback para armazenamento local

## 📝 Licença

Este projeto é propriedade do GPEVIM - Grupo de Propriedades Eletrônicos e Vibracionais em Materiais.

## 👥 Contribuição

Para contribuir com o projeto:
1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

## 🔒 Segurança e Boas Práticas

### ⚠️ Configuração de Segurança

1. **Credenciais de Banco de Dados**:
   - Use senhas fortes e únicas
   - Nunca commite credenciais no repositório
   - Use variáveis de ambiente em produção

2. **Credenciais de Administrador**:
   - Altere as credenciais padrão antes do deploy
   - Use autenticação robusta em produção
   - Considere implementar autenticação de dois fatores

3. **Upload de Arquivos**:
   - O sistema aceita apenas imagens
   - Tamanho máximo: 5MB por arquivo
   - Validação de tipo de arquivo implementada

4. **Proteção de Dados**:
   - Dados sensíveis não são expostos publicamente
   - Área administrativa protegida por autenticação
   - Logs de acesso podem ser implementados

### 🛡️ Recomendações para Produção

- Implemente HTTPS
- Configure firewall adequado
- Faça backups regulares do banco de dados
- Monitore logs de acesso
- Mantenha dependências atualizadas

## 📞 Suporte

Para dúvidas ou problemas:
- Entre em contato com a equipe do GPEVIM
- Abra uma issue no repositório

---

**GPEVIM** - Grupo de Propriedades Eletrônicos e Vibracionais em Materiais  
© 2025 - Todos os direitos reservados

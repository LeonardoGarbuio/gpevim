const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Armazenamento local para desenvolvimento
let localPublications = [];
let localMembers = [];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Configurar pasta de uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar Multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'publication-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limite
  },
  fileFilter: function (req, file, cb) {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'), false);
    }
  }
});

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(uploadsDir));

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/gpevim_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Criar tabela de publicações se não existir
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS publications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    publication_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// Criar tabela de usuários admin se não existir
const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// Criar tabela de membros se não existir
const createMembersTableQuery = `
  CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    lattes_url TEXT,
    research_topic TEXT,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// Inicializar banco de dados
async function initializeDatabase() {
  try {
    await pool.query(createTableQuery);
    await pool.query(createUsersTableQuery);
    await pool.query(createMembersTableQuery);
    
    // Inserir usuário admin padrão se não existir
    const checkAdminQuery = 'SELECT * FROM admin_users WHERE username = $1';
    const adminExists = await pool.query(checkAdminQuery, ['admin']);
    
    if (adminExists.rows.length === 0) {
      const insertAdminQuery = 'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)';
      // Senha: gpevim2025 (em produção, usar bcrypt)
      await pool.query(insertAdminQuery, ['admin', 'gpevim2025']);
      console.log('Usuário admin criado com sucesso');
    }
    
    console.log('Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
  }
}

// Rotas da API

// POST - Upload de imagem
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      filename: req.file.filename 
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

// GET - Listar todas as publicações
app.get('/api/publications', async (req, res) => {
  try {
    let publications = [];
    
    // Tentar buscar do banco de dados
    try {
      const result = await pool.query('SELECT * FROM publications ORDER BY created_at DESC');
      publications = result.rows;
      console.log('Publicações carregadas do banco de dados');
    } catch (dbError) {
      console.log('Banco de dados não disponível, usando armazenamento local');
    }
    
    // Combinar com publicações locais
    const allPublications = [...publications, ...localPublications];
    
    // Ordenar por data de criação (mais recente primeiro)
    allPublications.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    });
    
    res.json(allPublications);
  } catch (error) {
    console.error('Erro ao buscar publicações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Adicionar nova publicação
app.post('/api/publications', async (req, res) => {
  try {
    const { title, author, imageUrl, publicationUrl, description } = req.body;
    
    if (!title || !author || !imageUrl || !publicationUrl) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }
    
    const publication = {
      id: Date.now(),
      title,
      author,
      image_url: imageUrl,
      publication_url: publicationUrl,
      description,
      created_at: new Date().toISOString()
    };
    
    // Tentar salvar no banco de dados
    try {
      const query = `
        INSERT INTO publications (title, author, image_url, publication_url, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const result = await pool.query(query, [title, author, imageUrl, publicationUrl, description]);
      console.log('Publicação salva no banco de dados');
      
      // Atualizar o ID com o do banco
      publication.id = result.rows[0].id;
    } catch (dbError) {
      console.log('Banco de dados não disponível, salvando localmente');
      // Salvar localmente se o banco não estiver disponível
      localPublications.push(publication);
    }
    
    res.status(201).json(publication);
  } catch (error) {
    console.error('Erro ao adicionar publicação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Remover publicação
app.delete('/api/publications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = false;
    
    // Tentar deletar do banco de dados
    try {
      const result = await pool.query('DELETE FROM publications WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length > 0) {
        console.log('Publicação removida do banco de dados');
        deleted = true;
      }
    } catch (dbError) {
      console.log('Banco de dados não disponível, tentando remover localmente');
    }
    
    // Se não foi deletada do banco, tentar deletar localmente
    if (!deleted) {
      const localIndex = localPublications.findIndex(pub => pub.id == id);
      if (localIndex !== -1) {
        localPublications.splice(localIndex, 1);
        console.log('Publicação removida do armazenamento local');
        deleted = true;
      }
    }
    
    if (deleted) {
      res.json({ message: 'Publicação removida com sucesso' });
    } else {
      res.status(404).json({ error: 'Publicação não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao remover publicação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS PARA MEMBROS =====

// GET - Listar todos os membros
app.get('/api/members', async (req, res) => {
  try {
    let members = [];
    
    // Tentar buscar do banco de dados
    try {
      const result = await pool.query('SELECT * FROM members ORDER BY category, name');
      members = result.rows;
      console.log('Membros carregados do banco de dados');
    } catch (dbError) {
      console.log('Banco de dados não disponível, usando armazenamento local');
    }
    
    // Combinar com membros locais
    const allMembers = [...members, ...localMembers];
    
    // Ordenar por categoria e nome
    allMembers.sort((a, b) => {
      const categoryOrder = { 'coordenadores': 1, 'colaboradores': 2, 'iniciacao_cientifica': 3, 'iniciacao_cientifica_junior': 4 };
      const orderA = categoryOrder[a.category] || 5;
      const orderB = categoryOrder[b.category] || 5;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });
    
    res.json(allMembers);
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Adicionar novo membro
app.post('/api/members', async (req, res) => {
  try {
    const { name, role, imageUrl, lattesUrl, researchTopic, category } = req.body;
    
    if (!name || !role || !imageUrl || !category) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }
    
    const member = {
      id: Date.now(),
      name,
      role,
      image_url: imageUrl,
      lattes_url: lattesUrl || null,
      research_topic: researchTopic || null,
      category,
      created_at: new Date().toISOString()
    };
    
    // Tentar salvar no banco de dados
    try {
      const query = `
        INSERT INTO members (name, role, image_url, lattes_url, research_topic, category)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result = await pool.query(query, [name, role, imageUrl, lattesUrl, researchTopic, category]);
      console.log('Membro salvo no banco de dados');
      
      // Atualizar o ID com o do banco
      member.id = result.rows[0].id;
    } catch (dbError) {
      console.log('Banco de dados não disponível, salvando localmente');
      // Salvar localmente se o banco não estiver disponível
      localMembers.push(member);
    }
    
    res.status(201).json(member);
  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Remover membro
app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = false;
    
    // Tentar deletar do banco de dados
    try {
      const result = await pool.query('DELETE FROM members WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length > 0) {
        console.log('Membro removido do banco de dados');
        deleted = true;
      }
    } catch (dbError) {
      console.log('Banco de dados não disponível, tentando remover localmente');
    }
    
    // Se não foi deletado do banco, tentar deletar localmente
    if (!deleted) {
      const localIndex = localMembers.findIndex(member => member.id == id);
      if (localIndex !== -1) {
        localMembers.splice(localIndex, 1);
        console.log('Membro removido do armazenamento local');
        deleted = true;
      }
    }
    
    if (deleted) {
      res.json({ message: 'Membro removido com sucesso' });
    } else {
      res.status(404).json({ error: 'Membro não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Login admin
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Verificação local para desenvolvimento
    if (username === 'ADM' && password === 'fisica') {
      res.json({ success: true, message: 'Login realizado com sucesso' });
      return;
    }
    
    // Tentar conectar com banco se disponível
    try {
      const query = 'SELECT * FROM admin_users WHERE username = $1 AND password_hash = $2';
      const result = await pool.query(query, [username, password]);
      
      if (result.rows.length > 0) {
        res.json({ success: true, message: 'Login realizado com sucesso' });
      } else {
        res.status(401).json({ error: 'Usuário ou senha incorretos' });
      }
    } catch (dbError) {
      // Se não conseguir conectar com banco, usar verificação local
      if (username === 'ADM' && password === 'fisica') {
        res.json({ success: true, message: 'Login realizado com sucesso' });
      } else {
        res.status(401).json({ error: 'Usuário ou senha incorretos' });
      }
    }
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Rota para servir outras páginas HTML
app.get('/:page', (req, res) => {
  const page = req.params.page;
  const validPages = ['about', 'member', 'news', 'projects', 'materials', 'publications', 'login', 'admin-panel'];
  
  if (validPages.includes(page)) {
    res.sendFile(path.join(__dirname, '..', `${page}.html`));
  } else {
    res.status(404).sendFile(path.join(__dirname, '..', 'index.html'));
  }
});

// Inicializar servidor
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
  });
}

startServer().catch(console.error); 
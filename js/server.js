require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const supabase = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Configurar Multer para armazenamento em memória (para processamento com Sharp)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limite (será redimensionado)
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'), false);
    }
  }
});

// Buckets do Supabase
const MEMBERS_BUCKET = 'members-images';
const PUBLICATIONS_BUCKET = 'publications-images';
const GENERAL_BUCKET = 'general-images'; // Fallback

// Helper para upload de imagem no Supabase
async function uploadToSupabase(fileBuffer, originalName, bucketName) {
  try {
    // Redimensionar e otimizar imagem
    const processedBuffer = await sharp(fileBuffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toBuffer();

    const timestamp = Date.now();
    const cleanName = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9]/g, '');
    const fileName = `${timestamp}_${cleanName}.webp`;

    // Upload manual para o Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`public/${fileName}`, processedBuffer, {
        contentType: 'image/webp',
        upsert: false
      });

    if (error) {
      console.error(`Erro ao subir para bucket ${bucketName}:`, error.message);
      throw error;
    }

    // Gerar URL pública
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Erro no processamento da imagem:', error);
    throw error;
  }
}

// Rotas da API

// POST - Upload de imagem
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    // Usando bucket de membros como padrão por enquanto
    const imageUrl = await uploadToSupabase(req.file.buffer, req.file.originalname, MEMBERS_BUCKET);

    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: path.basename(imageUrl)
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao processar e salvar a imagem no Supabase' });
  }
});

// GET - Listar todas as publicações
app.get('/api/publications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar publicações:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do Supabase' });
  }
});

// GET - Buscar publicação específica
app.get('/api/publications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Publicação não encontrada' });

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar publicação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Adicionar nova publicação
app.post('/api/publications', async (req, res) => {
  try {
    const { title, author, imageUrl, publicationUrl, description } = req.body;

    const { data, error } = await supabase
      .from('publications')
      .insert([{ title, author, image_url: imageUrl, publication_url: publicationUrl, description }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro ao adicionar publicação:', error);
    res.status(500).json({ error: 'Erro ao salvar no banco de dados' });
  }
});

// PUT - Atualizar publicação
app.put('/api/publications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, imageUrl, publicationUrl, description } = req.body;

    const { data, error } = await supabase
      .from('publications')
      .update({ title, author, image_url: imageUrl, publication_url: publicationUrl, description, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Publicação não encontrada' });

    res.json(data[0]);
  } catch (error) {
    console.error('Erro ao atualizar publicação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Remover publicação
app.delete('/api/publications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('publications')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Publicação removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover publicação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS PARA MEMBROS =====

// GET - Listar todos os membros
app.get('/api/members', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('name');

    if (error) throw error;

    // Ordenação customizada para manter consistência com o frontend antigo
    const sortedMembers = data.sort((a, b) => {
      const categoryOrder = { 'coordenadores': 1, 'colaboradores': 2, 'iniciacao_cientifica': 3, 'iniciacao_cientifica_junior': 4 };
      const orderA = categoryOrder[a.category] || 5;
      const orderB = categoryOrder[b.category] || 5;

      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });

    res.json(sortedMembers);
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do Supabase' });
  }
});

// GET - Buscar membro específico
app.get('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Membro não encontrado' });

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar membro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Adicionar novo membro
app.post('/api/members', async (req, res) => {
  try {
    const { name, role, imageUrl, lattesUrl, researchTopic, category } = req.body;

    const { data, error } = await supabase
      .from('members')
      .insert([{ name, role, image_url: imageUrl, lattes_url: lattesUrl, research_topic: researchTopic, category }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    res.status(500).json({ error: 'Erro ao salvar no banco de dados' });
  }
});

// PUT - Atualizar membro
app.put('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, imageUrl, lattesUrl, researchTopic, category } = req.body;

    const { data, error } = await supabase
      .from('members')
      .update({ name, role, image_url: imageUrl, lattes_url: lattesUrl, research_topic: researchTopic, category, updated_at: new Date() })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Membro não encontrado' });

    res.json(data[0]);
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Remover membro
app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Membro removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Login admin
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Verificação de ambiente local hardcoded
    if (username === 'ADM' && password === 'fisica') {
      return res.json({ success: true, message: 'Login realizado com sucesso (Local)' });
    }

    // Login via Supabase
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password) // Use hash em produção
      .single();

    if (data) {
      res.json({ success: true, message: 'Login realizado com sucesso' });
    } else {
      res.status(401).json({ error: 'Usuário ou senha incorretos' });
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
  const validPages = ['about', 'member', 'news', 'projects', 'materials', 'publications', 'login', 'admin-panel', 'admin-members'];

  if (validPages.includes(page)) {
    res.sendFile(path.join(__dirname, '..', `${page}.html`));
  } else {
    // Fallback genérico para arquivos .html
    if (page.endsWith('.html')) {
      res.sendFile(path.join(__dirname, '..', page), (err) => {
        if (err) res.status(404).sendFile(path.join(__dirname, '..', 'index.html'));
      });
    } else {
      res.status(404).sendFile(path.join(__dirname, '..', 'index.html'));
    }
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Modo Supabase ativo.`);
});
require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const supabase = require('../js/supabase');

// Configurações
const DATA_FILE = path.join(__dirname, 'members_data.json'); // Arquivo JSON com os dados
const IMAGES_DIR = path.join(__dirname, '..', 'img'); // Pasta onde estão as imagens originais (ajuste conforme necessário)
const BUCKET_NAME = 'members-images';

async function resizeImage(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        // Redimensionar para no máximo 800x800, mantendo o aspecto, formato WebP com qualidade 80
        const resizedBuffer = await sharp(imageBuffer)
            .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toBuffer();

        return resizedBuffer;
    } catch (error) {
        console.error(`Erro ao redimensionar imagem ${imagePath}:`, error);
        throw error;
    }
}

async function uploadImage(filename, buffer) {
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(`public/${Date.now()}_${path.basename(filename, path.extname(filename))}.webp`, buffer, {
            contentType: 'image/webp',
            upsert: false
        });

    if (error) {
        throw error;
    }

    const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
}

async function main() {
    console.log('Iniciando script de upload de membros...');

    if (!fs.existsSync(DATA_FILE)) {
        console.error(`Arquivo de dados não encontrado: ${DATA_FILE}`);
        console.log('Crie um arquivo members_data.json com a lista de membros.');
        return;
    }

    const members = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    // Verificar se o bucket existe (opcional, pode falhar se não tiver permissão de listar)
    // O ideal é criar o bucket manualmente no dashboard do Supabase e torna-lo público.

    for (const member of members) {
        console.log(`Processando membro: ${member.name}`);

        try {
            let imageUrl = member.image_url;

            // Se for um caminho de arquivo local, fazer upload
            if (member.local_image_path) {
                const imagePath = path.isAbsolute(member.local_image_path)
                    ? member.local_image_path
                    : path.join(IMAGES_DIR, member.local_image_path);

                if (fs.existsSync(imagePath)) {
                    console.log(`  Redimensionando e enviando imagem: ${member.local_image_path}`);
                    const resizedBuffer = await resizeImage(imagePath);
                    imageUrl = await uploadImage(member.local_image_path, resizedBuffer);
                    console.log(`  Imagem enviada com sucesso: ${imageUrl}`);
                } else {
                    console.warn(`  AVISO: Imagem local não encontrada: ${imagePath}. Usando URL original.`);
                }
            }

            // Inserir no banco de dados
            const { error } = await supabase
                .from('members')
                .insert({
                    name: member.name,
                    role: member.role,
                    image_url: imageUrl,
                    lattes_url: member.lattes_url,
                    research_topic: member.research_topic,
                    category: member.category
                });

            if (error) {
                console.error(`  Erro ao inserir membro ${member.name}:`, error.message);
            } else {
                console.log(`  Membro ${member.name} inserido com sucesso!`);
            }

        } catch (err) {
            console.error(`  Erro fatal ao processar ${member.name}:`, err);
        }
    }

    console.log('Processo finalizado.');
}

main();

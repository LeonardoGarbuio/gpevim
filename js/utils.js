// Utilitários para o Frontend

/**
 * Redimensiona uma imagem no navegador usando Canvas
 * @param {File} file - Arquivo de imagem
 * @param {number} maxWidth - Largura máxima
 * @param {number} maxHeight - Altura máxima
 * @param {number} quality - Qualidade (0 a 1)
 * @returns {Promise<Blob>} - Blob da imagem redimensionada
 */
async function resizeImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;

            img.onload = function () {
                let width = img.width;
                let height = img.height;

                // Calcular novas dimensões mantendo proporção
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round(width * (maxHeight / height));
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Converter para Blob (WebP se suportado, ou JPEG)
                canvas.toBlob(function (blob) {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Erro ao converter imagem no canvas.'));
                    }
                }, 'image/webp', quality);
            };

            img.onerror = function (error) {
                reject(error);
            };
        };

        reader.onerror = function (error) {
            reject(error);
        };
    });
}

/**
 * Upload de imagem para o Supabase Storage
 * @param {Blob} fileBlob - Blob da imagem
 * @param {string} fileName - Nome original do arquivo
 * @param {string} bucket - Nome do bucket ('members-images', 'publications-images')
 * @returns {Promise<string>} - URL pública da imagem
 */
async function uploadImageToSupabase(fileBlob, fileName, bucket) {
    if (!window.supabaseClient) {
        throw new Error('Supabase Client não inicializado.');
    }

    const timestamp = Date.now();
    // Limpar nome do arquivo (remover caracteres especiais)
    const cleanName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
    const path = `public/${timestamp}_${cleanName}.webp`;

    const { data, error } = await window.supabaseClient.storage
        .from(bucket)
        .upload(path, fileBlob, {
            contentType: 'image/webp',
            upsert: false
        });

    if (error) {
        throw error;
    }

    const { data: publicUrlData } = window.supabaseClient.storage
        .from(bucket)
        .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
}

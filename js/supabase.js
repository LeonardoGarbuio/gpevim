require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Erro: SUPABASE_URL e SUPABASE_KEY são obrigatórios no arquivo .env');
    // Não vamos lançar erro aqui para permitir que o servidor inicie em modo "local" se necessário,
    // mas as funcionalidades do Supabase falharão.
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

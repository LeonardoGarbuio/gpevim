// Inicialização do cliente Supabase
// Requer que o script do Supabase (CDN) e js/config.js tenham sido carregados antes

if (typeof supabase === 'undefined') {
    console.error('Biblioteca do Supabase não encontrada! Verifique se carregou o script do CDN.');
} else if (!window.SUPABASE_CONFIG) {
    console.error('Configuração do Supabase não encontrada! Verifique se carregou js/config.js.');
} else {
    window.supabaseClient = supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
    console.log('Supabase inicializado com sucesso.');
}

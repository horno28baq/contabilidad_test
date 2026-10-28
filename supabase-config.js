// HORNO 28 - Supabase configuration
// PROYECTO DE TRABAJO (backup): dvmqltdivtvpluxvleqw
// El proyecto ORIGINAL (producción actual) es ebqdrjckswulwfdxmsdq -> NO usar este archivo allá.

window.HORNO28_SUPABASE_URL =
    'https://dvmqltdivtvpluxvleqw.supabase.co';

// Supabase Publishable Key del proyecto dvmqltdivtvpluxvleqw
// (Supabase > Project Settings > API Keys > "Publishable key", empieza con sb_publishable_)
// NUNCA pegues aquí la "secret" ni la "service_role".
window.HORNO28_SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_RBwt5WmwDU1nS4p_vpZC0w_kDmHeSzM';

// Configuration status
window.HORNO28_SUPABASE_CONFIGURED =
    Boolean(
        window.HORNO28_SUPABASE_URL &&
        window.HORNO28_SUPABASE_PUBLISHABLE_KEY &&
        window.HORNO28_SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_') &&
        !window.HORNO28_SUPABASE_PUBLISHABLE_KEY.includes('PEGA_AQUI')
    );

/**
 * DD design · public runtime config
 * Copy config.public.example.json → config.public.json and fill Supabase keys.
 */
(function (global) {
    const DEFAULTS = {
        brand: 'DD design',
        siteUrl: 'https://dd-design.com',
        legacyApp: '1.html',
        /** supabase | tencent — 迁移腾讯云时只改此项与 tencent.apiBase */
        apiProvider: 'supabase',
        supabase: { url: '', anonKey: '' },
        tencent: { apiBase: '' },
        magicLinkPath: 'p.html',
        adminPath: 'admin.html',
    };

    let cached = null;

    async function loadConfig() {
        if (cached) return cached;
        try {
            const res = await fetch('config.public.json', { cache: 'no-store' });
            if (res.ok) {
                cached = { ...DEFAULTS, ...(await res.json()) };
                return cached;
            }
        } catch (_) { /* local dev without config */ }
        cached = { ...DEFAULTS };
        return cached;
    }

    function getConfigSync() {
        return cached || { ...DEFAULTS };
    }

    global.DDConfig = { loadConfig, getConfigSync, DEFAULTS };
})(window);

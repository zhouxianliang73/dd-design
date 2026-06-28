/**
 * DD design · Supabase REST helpers (no npm — static fetch)
 */
(function (global) {
    const STATUS_LABELS = {
        inquiry: '询价',
        scheme: '方案',
        quoted: '报价',
        ordered: '下单',
        production: '生产',
        shipped: '发货',
    };

    function supabaseHeaders(anonKey, extra) {
        return {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            ...extra,
        };
    }

    async function rpc(config, fnName, body) {
        const { url, anonKey } = config.supabase || {};
        if (!url || !anonKey || url.includes('YOUR_PROJECT')) {
            throw new Error('supabase_not_configured');
        }
        const res = await fetch(`${url}/rest/v1/rpc/${fnName}`, {
            method: 'POST',
            headers: supabaseHeaders(anonKey),
            body: JSON.stringify(body || {}),
        });
        const text = await res.text();
        let data;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text;
        }
        if (!res.ok) {
            const msg = data?.message || data?.error || res.statusText;
            throw new Error(msg || 'request_failed');
        }
        return data;
    }

    async function fetchClientProject(config, token) {
        return rpc(config, 'get_client_project_bundle', { p_token: token });
    }

    async function authPassword(config, email, password) {
        const { url, anonKey } = config.supabase || {};
        const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: supabaseHeaders(anonKey),
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error_description || data.msg || 'login_failed');
        return data;
    }

    async function fetchTeamProjects(config, accessToken) {
        const { url, anonKey } = config.supabase || {};
        const res = await fetch(
            `${url}/rest/v1/projects?select=id,project_no,client_name,channel,status,access_token,invite_label,updated_at&archived=eq.false&order=updated_at.desc`,
            {
                headers: supabaseHeaders(anonKey, { Authorization: `Bearer ${accessToken}` }),
            }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'fetch_failed');
        return data;
    }

    async function createProject(config, accessToken, payload) {
        const { url, anonKey } = config.supabase || {};
        const res = await fetch(`${url}/rest/v1/rpc/create_live_project`, {
            method: 'POST',
            headers: supabaseHeaders(anonKey, { Authorization: `Bearer ${accessToken}` }),
            body: JSON.stringify({
                p_client_name: payload.clientName || '',
                p_channel: payload.channel || 'custom',
                p_invite_label: payload.inviteLabel || '',
            }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'create_failed');
        return data;
    }

    function parseMagicToken() {
        const q = new URLSearchParams(location.search);
        if (q.get('t')) return q.get('t');
        const m = location.pathname.match(/\/p\/([a-zA-Z0-9_-]+)/);
        return m ? m[1] : '';
    }

    function buildMagicLink(config, token) {
        const base = (config.siteUrl || '').replace(/\/$/, '') || location.origin;
        return `${base}/${config.magicLinkPath || 'p.html'}?t=${encodeURIComponent(token)}`;
    }

    function statusLabel(code) {
        return STATUS_LABELS[code] || code;
    }

    global.DDApi = {
        rpc,
        fetchClientProject,
        authPassword,
        fetchTeamProjects,
        createProject,
        parseMagicToken,
        buildMagicLink,
        statusLabel,
        STATUS_LABELS,
    };
})(window);

// MedControl | Cliente Supabase
(() => {
    "use strict";

    const SUPABASE_URL = "https://omeuytyjhakohihbbqjs.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_kcUFX5pNxpimKfSt9JtHWQ_jcjs4-Nb";

    if (!window.supabase) {
        console.error("SDK do Supabase não carregado.");
        return;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    async function requireUser() {
        const { data, error } = await client.auth.getUser();
        if (error || !data.user) {
            throw new Error("Faça login para acessar os dados do MedControl.");
        }
        return data.user;
    }

    function normalizeError(error) {
        console.error("[MedControl]", error);
        if (error?.code === "23505") {
            // 23505 é o código de violação de unicidade do Postgres
            if (error.message.includes("idx_unique_appointment")) {
                return new Error("Este médico já possui um paciente agendado para este mesmo dia e horário. Escolha outro horário.");
            }
            return new Error("Já existe um registro com esses dados.");
        }
        if (error?.code === "23503") {
            return new Error("Não foi possível concluir: existe um vínculo com outro registro.");
        }
        return new Error(error?.message || "Ocorreu um erro ao acessar os dados.");
    }

    async function run(query) {
        const { data, error } = await query;
        if (error) throw normalizeError(error);
        return data;
    }

    const auth = {
        async signUp(email, password) {
            return run(client.auth.signUp({ email, password }));
        },
        async signIn(email, password) {
            return run(client.auth.signInWithPassword({ email, password }));
        },
        async signOut() {
            return run(client.auth.signOut());
        },
        async currentUser() {
            const { data, error } = await client.auth.getSession();
            if (error) throw normalizeError(error);
            return data.session?.user || null;
        }
    };

    const profiles = {
        async getMeuPerfil() {
            const user = await requireUser();
            const { data, error } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
            if (error) throw normalizeError(error);
            return data; 
        },
        async listar() {
            await requireUser();
            return run(client.from("profiles").select("*").order("created_at", { ascending: false }));
        },
        async atualizarCargo(id, novoCargo) {
            await requireUser();
            return run(client.from("profiles").update({ role: novoCargo }).eq("id", id).select().maybeSingle());
        },
        async criarPerfilFallback(id, email, role) {
            await requireUser();
            return run(client.from("profiles").insert({ id, email, role }).select().maybeSingle());
        }
    };

    const patients = {
        async list(search = "") {
            await requireUser();
            let query = client.from("patients").select("*").order("full_name", { ascending: true });
            if (search.trim()) {
                const safe = search.trim().replace(/[,%()]/g, "");
                query = query.ilike("full_name", `%${safe}%`);
            }
            return run(query);
        },
        async get(id) {
            await requireUser();
            return run(client.from("patients").select("*").eq("id", id).maybeSingle());
        },
        async create(input) {
            const user = await requireUser();
            const payload = { ...input, owner_id: user.id };
            return run(client.from("patients").insert(payload).select().single());
        },
        async update(id, input) {
            await requireUser();
            return run(client.from("patients").update(input).eq("id", id).select().single());
        },
        async remove(id) {
            await requireUser();
            return run(client.from("patients").delete().eq("id", id));
        }
    };

    const appointments = {
        // Aceita filtro por paciente e por médico
        async list(patientId = null, medicoId = null) {
            await requireUser();
            let query = client.from("appointments")
                .select("*, patients(id, full_name)")
                .order("appointment_date", { ascending: false })
                .order("appointment_time", { ascending: false });
            
            if (patientId) query = query.eq("patient_id", patientId);
            if (medicoId) query = query.eq("doctor_id", medicoId); // FILTRO CORRETO AQUI
            return run(query);
        },
        async create(input) {
            await requireUser();
            // Força o status para agendado na criação, se não vier
            const payload = { ...input, status: input.status || 'agendado' };
            return run(client.from("appointments").insert(payload).select().single());
        },
        async update(id, input) {
            await requireUser();
            return run(client.from("appointments").update(input).eq("id", id).select().single());
        },
        async remove(id) {
            await requireUser();
            return run(client.from("appointments").delete().eq("id", id));
        }
    };

    const audit = {
        async list(limit = 50) {
            await requireUser();
            return run(client.from("audit_logs").select("*")
                .order("occurred_at", { ascending: false })
                .limit(Math.min(Math.max(limit, 1), 100)));
        }
    };

    window.MedControl = { client, auth, patients, appointments, audit, profiles };
})();
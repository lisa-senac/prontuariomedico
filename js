// MedControl | Cliente Supabase
// Inclua o SDK antes deste arquivo no index.html:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="js/medcontrol-api.js"></script>
//
// Configure URL e chave pública (anon/publishable) do projeto Supabase.
// Nunca coloque a chave service_role no frontend.

(() => {
  "use strict";

  const SUPABASE_URL = "COLE_AQUI_A_URL_DO_PROJETO";
  const SUPABASE_ANON_KEY = "COLE_AQUI_A_CHAVE_PUBLICA";

  if (!window.supabase) {
    console.error("SDK do Supabase não carregado.");
    return;
  }

  if (SUPABASE_URL.startsWith("COLE_AQUI") ||
      SUPABASE_ANON_KEY.startsWith("COLE_AQUI")) {
    console.warn("Configure SUPABASE_URL e SUPABASE_ANON_KEY em js/medcontrol-api.js.");
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
    if (error?.code === "23505") return new Error("Já existe um paciente com esse CPF.");
    if (error?.code === "23503") return new Error("Não foi possível concluir: existe um vínculo com outro registro.");
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
      const { data, error } = await client.auth.getUser();
      if (error) throw normalizeError(error);
      return data.user;
    }
  };

  const patients = {
    async list(search = "") {
      const user = await requireUser();
      let query = client.from("patients")
        .select("*")
        .eq("owner_id", user.id)
        .order("full_name", { ascending: true });

      if (search.trim()) {
        const safe = search.trim().replace(/[,%()]/g, "");
        query = query.ilike("full_name", `%${safe}%`);
      }
      return run(query);
    },

    async get(id) {
      const user = await requireUser();
      return run(client.from("patients")
        .select("*").eq("id", id).eq("owner_id", user.id).single());
    },

    async create(input) {
      const user = await requireUser();
      const payload = { ...input, owner_id: user.id };
      return run(client.from("patients").insert(payload).select().single());
    },

    async update(id, input) {
      const user = await requireUser();
      return run(client.from("patients").update(input)
        .eq("id", id).eq("owner_id", user.id).select().single());
    },

    async remove(id) {
      const user = await requireUser();
      return run(client.from("patients").delete()
        .eq("id", id).eq("owner_id", user.id));
    }
  };

  const appointments = {
    async list(patientId = null) {
      const user = await requireUser();
      let query = client.from("appointments")
        .select("*, patients(id, full_name)")
        .eq("owner_id", user.id)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false });
      if (patientId) query = query.eq("patient_id", patientId);
      return run(query);
    },

    async create(input) {
      const user = await requireUser();
      return run(client.from("appointments")
        .insert({ ...input, owner_id: user.id }).select().single());
    },

    async update(id, input) {
      const user = await requireUser();
      return run(client.from("appointments").update(input)
        .eq("id", id).eq("owner_id", user.id).select().single());
    },

    async remove(id) {
      const user = await requireUser();
      return run(client.from("appointments").delete()
        .eq("id", id).eq("owner_id", user.id));
    }
  };

  const audit = {
    async list(limit = 50) {
      const user = await requireUser();
      return run(client.from("audit_logs").select("*")
        .eq("owner_id", user.id)
        .order("occurred_at", { ascending: false })
        .limit(Math.min(Math.max(limit, 1), 100)));
    }
  };

  window.MedControl = { client, auth, patients, appointments, audit };
})();

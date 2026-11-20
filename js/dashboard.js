async function inicializarDashboard() {
    console.log("Dashboard inicializado.");

    try {
        // Filtra pelo ID do médico se quem estiver logado for médico
        const medicoIdParaFiltrar = window.perfilUsuarioLogado?.role === 'medico' ? window.perfilUsuarioLogado.id : null;

        const [pacientes, todosAtendimentos, perfis] = await Promise.all([
            window.MedControl.patients.list(),
            window.MedControl.appointments.list(null, medicoIdParaFiltrar),
            window.MedControl.profiles.listar()
        ]);

        // Mapeia o nome do médico pelo ID dele
        const nomesMedicos = new Map(perfis.map(p => [p.id, p.full_name || p.email]));
        const nomesPacientes = new Map(pacientes.map(p => [p.id, p.full_name]));

        // --- FILTRO IMPORTANTE AQUI ---
        // Se for médico, o dashboard mostra apenas os que ele PRECISA atender (agendados)
        // Se for atendente/admin, mostra os agendados também (ou pode mostrar todos se preferir)
        const atendimentosExibidos = todosAtendimentos.filter(a => a.status !== 'finalizado');

        document.getElementById("stat-total-pacientes").textContent = pacientes.length;
        document.getElementById("stat-total-atendimentos").textContent = todosAtendimentos.length; // Total geral
        
        // Cartão "Atendimentos Recentes" mostra apenas a fila (o que está agendado)
        document.getElementById("stat-recentes").textContent = atendimentosExibidos.length;

        // Muda o título se for médico
        const titulo = document.getElementById("titulo-tabela-inicio");
        const subtitulo = document.getElementById("subtitulo-tabela-inicio");
        if (window.perfilUsuarioLogado?.role === 'medico') {
            titulo.textContent = "Minha Fila de Atendimentos";
            subtitulo.textContent = "Pacientes agendados para você.";
        }

        const tabela = document.getElementById("dashboard-recentes-body");
        tabela.innerHTML = "";

        if (atendimentosExibidos.length === 0) {
            tabela.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nenhum paciente na sua fila.</td></tr>`;
            return;
        }

        atendimentosExibidos.slice(0, 5).forEach(atendimento => {
            let dataFmt = "—";
            if (atendimento.appointment_date) {
                const [ano, mes, dia] = atendimento.appointment_date.split("-");
                dataFmt = `${dia}/${mes}/${ano}`;
            }

            const ehPresencial = atendimento.appointment_type === "presencial";
            const classeTag = ehPresencial ? "tag presencial" : "tag online";
            const textTag = ehPresencial ? "Presencial" : "Online";

            const nomeDoMedico = nomesMedicos.get(atendimento.doctor_id) || "Não definido";
            const nomeDoPaciente = nomesPacientes.get(atendimento.patient_id) || atendimento.patients?.full_name || "Paciente não encontrado";

            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td>${nomeDoPaciente}</td>
                <td>${dataFmt}</td>
                <td><span class="${classeTag}">${textTag}</span></td>
                <td>${nomeDoMedico}</td>
                <td><span class="status completed">Agendado</span></td>
            `;
            tabela.appendChild(linha);
        });

    } catch (error) {
        console.error("Erro ao carregar o Dashboard:", error);
        document.getElementById("dashboard-recentes-body").innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--danger);">
                    Erro ao carregar dados.
                </td>
            </tr>
        `;
    }
}
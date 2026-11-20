async function inicializarAgendaMedico() {
    console.log("Módulo da Agenda Médica inicializado.");
    
    if (window.perfilUsuarioLogado?.role !== 'medico') return;

    const tabela = document.getElementById("medico-agenda-body");
    if (!tabela) return;

    try {
        const [todosAtendimentos, pacientes] = await Promise.all([
            window.MedControl.appointments.list(null, window.perfilUsuarioLogado.id),
            window.MedControl.patients.list()
        ]);

        const nomesPacientes = new Map(pacientes.map(p => [p.id, p.full_name]));
        const atendimentos = todosAtendimentos.filter(a => a.status !== 'finalizado');

        tabela.innerHTML = "";

        if (atendimentos.length === 0) {
            tabela.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">Você não tem pacientes agendados no momento.</td></tr>`;
            return;
        }

        atendimentos.forEach(atendimento => {
            const linha = document.createElement("tr");

            const colunaData = document.createElement("td");
            colunaData.textContent = formatarDataHoraAgenda(atendimento.appointment_date, atendimento.appointment_time);

            const colunaPaciente = document.createElement("td");
            colunaPaciente.textContent = nomesPacientes.get(atendimento.patient_id) || "Paciente não encontrado";

            const colunaModalidade = document.createElement("td");
            const ehPresencial = atendimento.appointment_type === "presencial";
            colunaModalidade.innerHTML = `<span class="${ehPresencial ? 'tag presencial' : 'tag online'}">${ehPresencial ? 'Presencial' : 'Online'}</span>`;

            const colunaAcao = document.createElement("td");
            const btnAtender = document.createElement("button");
            btnAtender.className = "button button-primary";
            btnAtender.textContent = "Ver Prontuário";
            btnAtender.style.padding = "6px 12px";
            btnAtender.style.fontSize = "12px";
            
            // MUDANÇA AQUI: Leva para a ficha do paciente
            btnAtender.addEventListener("click", () => {
                window.location.hash = `#prontuario?id=${atendimento.patient_id}&atendimento=${atendimento.id}`;
            });

            colunaAcao.appendChild(btnAtender);

            linha.appendChild(colunaData);
            linha.appendChild(colunaPaciente);
            linha.appendChild(colunaModalidade);
            linha.appendChild(colunaAcao);

            tabela.appendChild(linha);
        });

    } catch (error) {
        console.error("Erro ao carregar agenda:", error);
        tabela.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger);">Erro ao carregar agenda.</td></tr>`;
    }
}

function formatarDataHoraAgenda(data, horario) {
    if (!data) return "—";
    const [ano, mes, dia] = data.split("-");
    const dataFormatada = `${dia}/${mes}/${ano}`;
    return horario ? `${dataFormatada} às ${horario.substring(0, 5)}` : dataFormatada;
}
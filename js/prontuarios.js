async function inicializarProntuarios() {
    console.log("Módulo de prontuários inicializado.");

    window.addEventListener("hashchange", () => {
        if (window.location.hash.startsWith("#prontuario")) {
            carregarFichaPaciente();
        }
    });

    if (window.location.hash.startsWith("#prontuario")) {
        await carregarFichaPaciente();
    }

    const botaoExcluir = document.getElementById("excluir-prontuario");
    if (botaoExcluir) {
        botaoExcluir.addEventListener("click", excluirProntuarioSelecionado);
    }

    await carregarSelectSeguranca();
}

async function carregarFichaPaciente() {
    // Pega o ID do paciente e do atendimento da URL
    const params = new URLSearchParams(window.location.hash.split("?")[1]);
    const pacienteId = params.get("id");
    const atendimentoId = params.get("atendimento");

    const elLoading = document.getElementById("prontuario-loading");
    const elContent = document.getElementById("prontuario-content");
    const btnNovoAtendimento = document.querySelector('#prontuario .card-heading a');

    if (!pacienteId) {
        if(elLoading) elLoading.innerHTML = "<p>Nenhum paciente selecionado.</p>";
        if(elContent) elContent.style.display = "none";
        return;
    }

    try {
        if(elLoading) elLoading.style.display = "block";
        if(elContent) elContent.style.display = "none";

        const [paciente, atendimentos] = await Promise.all([
            window.MedControl.patients.get(pacienteId),
            window.MedControl.appointments.list(pacienteId)
        ]);

        // Preenche os dados básicos
        document.getElementById("prontuario-nome").textContent = paciente.full_name || "Sem nome";
        document.getElementById("prontuario-cpf").textContent = `CPF: ${paciente.cpf || "—"}`;
        
        let dataNasc = "—";
        if (paciente.birth_date) {
            const [ano, mes, dia] = paciente.birth_date.split("-");
            dataNasc = `${dia}/${mes}/${ano}`;
        }
        document.getElementById("prontuario-nascimento").textContent = `Data de nascimento: ${dataNasc}`;

        document.getElementById("prontuario-telefone").textContent = paciente.phone || "—";
        document.getElementById("prontuario-email").textContent = paciente.email || "—";
        document.getElementById("prontuario-alergias").textContent = paciente.allergies || "Não informado";
        document.getElementById("prontuario-medicamentos").textContent = paciente.medications || "Não informado";

        const iniciais = (paciente.full_name || "??").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
        document.getElementById("prontuario-avatar").textContent = iniciais;

        // Monta a Timeline (Histórico de atendimentos)
        const timeline = document.getElementById("prontuario-timeline");
        timeline.innerHTML = "";

        if (atendimentos.length === 0) {
            timeline.innerHTML = "<p>Nenhum atendimento registrado para este paciente.</p>";
        } else {
            atendimentos.forEach(atendimento => {
                let dataFmt = "—";
                if (atendimento.appointment_date) {
                    const [a, m, d] = atendimento.appointment_date.split("-");
                    dataFmt = `${d}/${m}/${a}`;
                }
                const horaFmt = atendimento.appointment_time ? ` às ${atendimento.appointment_time.substring(0,5)}` : "";

                const article = document.createElement("article");
                article.className = "timeline-item";
                
                const ehPresencial = atendimento.appointment_type === "presencial";
                const classeTag = ehPresencial ? "tag presencial" : "tag online";
                const textTag = ehPresencial ? "Presencial" : "Online";

                article.innerHTML = `
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <div class="timeline-heading">
                            <h3>${atendimento.diagnosis || "Consulta sem diagnóstico"}</h3>
                            <span class="${classeTag}">${textTag}</span>
                        </div>
                        <p class="timeline-date">${dataFmt}${horaFmt}</p>
                        <p>${atendimento.observations || "Sem observações registradas."}</p>
                        <div class="record-meta">
                            <strong>Prescrição:</strong> ${atendimento.prescription || "Nenhuma"}
                        </div>
                    </div>
                `;
                timeline.appendChild(article);
            });
        }

        if(elLoading) elLoading.style.display = "none";
        if(elContent) elContent.style.display = "block";

        // --- LÓGICA DO BOTÃO NOVO ATENDIMENTO ---
        if (btnNovoAtendimento) {
            // Se veio do médico clicando na agenda (tem atendimento na URL)
            if (atendimentoId) {
                btnNovoAtendimento.textContent = "+ Iniciar Atendimento Agendado";
                // Clona o botão para remover eventos antigos
                const novoBtn = btnNovoAtendimento.cloneNode(true);
                btnNovoAtendimento.parentNode.replaceChild(novoBtn, btnNovoAtendimento);
                
                novoBtn.addEventListener("click", async (e) => {
                    e.preventDefault();
                    // Encontra o atendimento específico
                    const atendimentoClicado = atendimentos.find(a => a.id === atendimentoId);
                    if (atendimentoClicado) {
                        // Chama a função de edição (que preenche o formulário)
                        await editarAtendimento(atendimentoClicado);
                        window.location.hash = "#novo-atendimento";
                    }
                });
            } else {
                // Comportamento normal (atendente clicando no prontuário)
                btnNovoAtendimento.textContent = "+ Novo atendimento";
                btnNovoAtendimento.href = "#novo-atendimento";
                
                const novoBtn = btnNovoAtendimento.cloneNode(true);
                btnNovoAtendimento.parentNode.replaceChild(novoBtn, btnNovoAtendimento);
                novoBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    window.location.hash = "#novo-atendimento";
                    setTimeout(() => {
                        const selectPaciente = document.getElementById("appointment-patient");
                        if (selectPaciente) selectPaciente.value = pacienteId;
                    }, 100);
                });
            }
        }

    } catch (error) {
        console.error("Erro ao carregar ficha:", error);
        if(elLoading) elLoading.innerHTML = "<p>Erro ao carregar os dados do paciente.</p>";
    }
}

// Funções de exclusão e segurança originais mantidas
async function carregarSelectSeguranca() {
    try {
        const [atendimentos, pacientes] = await Promise.all([
            window.MedControl.appointments.list(),
            window.MedControl.patients.list()
        ]);
        const selecao = document.getElementById("prontuario-selecionado");
        if (!selecao) return;

        selecao.innerHTML = '<option value="">Selecione um atendimento</option>';
        atendimentos.forEach(atendimento => {
            const paciente = pacientes.find(p => p.id === atendimento.patient_id);
            const opcao = document.createElement("option");
            opcao.value = atendimento.id;
            opcao.textContent = `${paciente?.full_name || "Paciente"} - ${atendimento.appointment_date} - ${atendimento.diagnosis || "Sem diag."}`;
            selecao.appendChild(opcao);
        });
    } catch (error) {
        console.error("Erro ao carregar select de segurança:", error);
    }
}

async function excluirProntuarioSelecionado() {
    const selecao = document.getElementById("prontuario-selecionado");
    const atendimentoId = selecao.value;

    if (!atendimentoId) {
        alert("Selecione um atendimento para excluir.");
        return;
    }

    const confirmar = confirm("Tem certeza de que deseja excluir este registro clínico?");
    if (!confirmar) return;

    try {
        await window.MedControl.appointments.remove(atendimentoId);
        alert("Registro clínico excluído com sucesso!");
        await carregarSelectSeguranca();
        if (window.location.hash.startsWith("#prontuario")) carregarFichaPaciente();
    } catch (error) {
        console.error("Erro ao excluir prontuário:", error);
        alert("Não foi possível excluir o registro clínico.");
    }
}
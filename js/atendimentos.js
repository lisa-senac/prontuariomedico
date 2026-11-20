let atendimentoEmEdicaoId = null;

async function inicializarAtendimentos() {
    console.log("Módulo de atendimentos inicializado.");

    const formulario = document.getElementById("appointment-form");
    if (formulario) {
        formulario.addEventListener("submit", salvarAtendimento);
        formulario.addEventListener("reset", () => {
            atendimentoEmEdicaoId = null;
            restaurarCamposAgendamento();
        });
    }

    await carregarMedicosSelect();
    await carregarAtendimentos();
}

async function carregarMedicosSelect() {
    try {
        const perfis = await window.MedControl.profiles.listar();
        const medicos = perfis.filter(p => p.role === 'medico' && p.status !== 'suspenso');
        
        const select = document.getElementById("appointment-doctor");
        if (!select) return;

        select.innerHTML = '<option value="">Selecione o médico</option>';
        medicos.forEach(medico => {
            const opcao = document.createElement("option");
            opcao.value = medico.id;
            opcao.textContent = medico.full_name || medico.email;
            select.appendChild(opcao);
        });

        // Se for médico, trava o campo nele mesmo
        if (window.perfilUsuarioLogado?.role === 'medico') {
            select.value = window.perfilUsuarioLogado.id;
            select.disabled = true;
        }
    } catch (error) {
        console.error("Erro ao carregar médicos:", error);
    }
}

async function carregarAtendimentos() {
    try {
        // O FILTRO: se for médico, busca só os atendimentos dele
        const medicoIdParaFiltrar = window.perfilUsuarioLogado?.role === 'medico' ? window.perfilUsuarioLogado.id : null;

        const [atendimentos, pacientes, perfis] = await Promise.all([
            window.MedControl.appointments.list(null, medicoIdParaFiltrar),
            window.MedControl.patients.list(),
            window.MedControl.profiles.listar()
        ]);

        const nomesPacientes = new Map(pacientes.map(p => [p.id, p.full_name]));
        const nomesMedicos = new Map(perfis.map(p => [p.id, p.full_name || p.email]));

        const tabela = document.getElementById("appointments-table-body");
        if (!tabela) return;
        tabela.innerHTML = "";

        if (!atendimentos.length) {
            tabela.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nenhum atendimento registrado.</td></tr>`;
            return;
        }

        atendimentos.forEach((atendimento) => {
            const linha = document.createElement("tr");

            const colunaData = document.createElement("td");
            colunaData.textContent = formatarDataHora(atendimento.appointment_date, atendimento.appointment_time);

            const colunaPaciente = document.createElement("td");
            // Usa o nome do Map ou o nome que veio no join do banco
            colunaPaciente.textContent = nomesPacientes.get(atendimento.patient_id) || atendimento.patients?.full_name || "Paciente não encontrado";

            const colunaModalidade = document.createElement("td");
            const tagModalidade = document.createElement("span");
            const ehPresencial = atendimento.appointment_type === "presencial";
            tagModalidade.className = ehPresencial ? "tag presencial" : "tag online";
            tagModalidade.textContent = ehPresencial ? "Presencial" : "Online";
            colunaModalidade.appendChild(tagModalidade);

            const colunaMedico = document.createElement("td");
            colunaMedico.textContent = nomesMedicos.get(atendimento.doctor_id) || "Não definido";

            const colunaRegistro = document.createElement("td");
            const descricao = document.createElement("span");
            descricao.textContent = atendimento.diagnosis || "Sem diagnóstico";
            
            const tagStatus = document.createElement("span");
            tagStatus.textContent = atendimento.status === 'finalizado' ? "Finalizado" : "Agendado";
            tagStatus.className = atendimento.status === 'finalizado' ? "status completed" : "status";
            tagStatus.style.marginLeft = "10px";
            tagStatus.style.fontSize = "10px";

            const botaoEditar = document.createElement("button");
            botaoEditar.type = "button";
            botaoEditar.className = "text-link";
            botaoEditar.textContent = "Editar";
            botaoEditar.style.marginLeft = "10px";
            botaoEditar.addEventListener("click", () => editarAtendimento(atendimento));

            const botaoExcluir = document.createElement("button");
            botaoExcluir.type = "button";
            botaoExcluir.className = "text-link";
            botaoExcluir.textContent = "Excluir";
            botaoExcluir.style.color = "var(--danger)";
            botaoExcluir.style.marginLeft = "10px";
            botaoExcluir.addEventListener("click", () => excluirAtendimento(atendimento.id));

            colunaRegistro.appendChild(descricao);
            colunaRegistro.appendChild(tagStatus);
            colunaRegistro.appendChild(botaoEditar);
            colunaRegistro.appendChild(botaoExcluir);

            linha.appendChild(colunaData);
            linha.appendChild(colunaPaciente);
            linha.appendChild(colunaModalidade);
            linha.appendChild(colunaMedico);
            linha.appendChild(colunaRegistro);

            tabela.appendChild(linha);
        });

    } catch (error) {
        console.error("Erro ao carregar atendimentos:", error);
    }
}

async function salvarAtendimento(event) {
    event.preventDefault();

    try {
        const tipoSelecionado = document.querySelector('input[name="appointmentType"]:checked');
        if (!tipoSelecionado) {
            alert("Selecione a modalidade do atendimento.");
            return;
        }

        const selectMedico = document.getElementById("appointment-doctor");
        const selectPaciente = document.getElementById("appointment-patient");
        
        const doctorId = window.perfilUsuarioLogado?.role === 'medico' 
            ? window.perfilUsuarioLogado.id 
            : selectMedico.value;
            
        const patientId = selectPaciente.value;
        
        const dataInput = document.getElementById("appointment-date");
        const horaInput = document.getElementById("appointment-time");
        const dataConsulta = dataInput ? dataInput.value : new Date().toISOString().split('T')[0];
        const horaConsulta = horaInput ? horaInput.value : new Date().toTimeString().substring(0,5);

        if (!patientId || !doctorId) {
            alert("Selecione o paciente e o médico.");
            return;
        }

        // ---- VALIDAÇÃO DE CONFLITO ----
        // Se for atendente agendando uma consulta nova, verifica o horário
        if (window.perfilUsuarioLogado?.role !== 'medico' && !atendimentoEmEdicaoId) {
            const atendimentosDoMedico = await window.MedControl.appointments.list(null, doctorId);
            
            const conflito = atendimentosDoMedico.find(a => 
                a.appointment_date === dataConsulta && 
                a.appointment_time === horaConsulta && 
                a.status === 'agendado'
            );

            if (conflito) {
                alert("Este médico já possui um paciente agendado para este mesmo dia e horário. Por favor, escolha outro horário.");
                return; 
            }
        }
        // -------------------------------------------

        const statusAtendimento = window.perfilUsuarioLogado?.role === 'medico' ? 'finalizado' : 'agendado';

        const atendimento = {
            patient_id: patientId,
            doctor_id: doctorId,
            appointment_date: dataConsulta,
            appointment_time: horaConsulta,
            appointment_type: tipoSelecionado.value,
            status: statusAtendimento,
            diagnosis: document.getElementById("diagnosis") ? document.getElementById("diagnosis").value.trim() || null : null,
            prescription: document.getElementById("prescription") ? document.getElementById("prescription").value.trim() || null : null,
            observations: document.getElementById("observations") ? document.getElementById("observations").value.trim() || null : null
        };

        if (atendimentoEmEdicaoId) {
            await window.MedControl.appointments.update(atendimentoEmEdicaoId, atendimento);
            alert("Atendimento finalizado com sucesso!");
        } else {
            await window.MedControl.appointments.create(atendimento);
            alert("Atendimento registrado com sucesso!");
        }

        atendimentoEmEdicaoId = null;
        document.getElementById("appointment-form").reset();
        
        // Restaura os campos se for médico
        if (window.perfilUsuarioLogado?.role === 'medico') {
            const divs = document.querySelectorAll('.form-group');
            divs.forEach(el => el.style.display = "");
        }

        await carregarAtendimentos();
        if (typeof inicializarDashboard === "function") inicializarDashboard();
        if (typeof inicializarAgendaMedico === "function") inicializarAgendaMedico();

        if (window.perfilUsuarioLogado?.role === 'medico') {
            window.location.hash = "#minha-agenda";
        } else {
            window.location.hash = "#atendimentos";
        }

    } catch (error) {
        console.error("Erro ao salvar atendimento:", error);
        if (error.message.includes("idx_unique_appointment") || error.message.includes("duplicate key")) {
            alert("Erro: Este horário já está ocupado para este médico. Por favor, escolha outro.");
        } else {
            alert(error.message || "Não foi possível salvar o atendimento.");
        }
    }
}

async function editarAtendimento(atendimento) {
    atendimentoEmEdicaoId = atendimento.id;

    // 1. Preenche a data e hora
    document.getElementById("appointment-date").value = atendimento.appointment_date || "";
    document.getElementById("appointment-time").value = atendimento.appointment_time || "";
    
    // 2. Trava o médico no próprio nome
    const selectMedico = document.getElementById("appointment-doctor");
    selectMedico.value = atendimento.doctor_id || "";
    if (window.perfilUsuarioLogado?.role === 'medico') {
        selectMedico.disabled = true; 
    }

    // 3. Preenche o paciente (usa o nome que já veio no objeto do atendimento)
    const selectPaciente = document.getElementById("appointment-patient");
    selectPaciente.innerHTML = ""; 
    
    const opt = document.createElement("option");
    opt.value = atendimento.patient_id;
    opt.textContent = atendimento.patients?.full_name || "Paciente da Consulta"; 
    selectPaciente.appendChild(opt);
    selectPaciente.value = atendimento.patient_id;

    // 4. Preenche os campos clínicos
    if(document.getElementById("diagnosis")) document.getElementById("diagnosis").value = atendimento.diagnosis || "";
    if(document.getElementById("prescription")) document.getElementById("prescription").value = atendimento.prescription || "";
    if(document.getElementById("observations")) document.getElementById("observations").value = atendimento.observations || "";

    // 5. Marca a modalidade
    const modalidade = document.querySelector(`input[name="appointmentType"][value="${atendimento.appointment_type}"]`);
    if (modalidade) modalidade.checked = true;

    // 6. Muda o botão e esconde os campos de agendamento se for médico
    const botaoSalvar = document.querySelector('#appointment-form button[type="submit"]');
    if (botaoSalvar) botaoSalvar.textContent = "Finalizar e Salvar Atendimento";

    if (window.perfilUsuarioLogado?.role === 'medico') {
        esconderCamposAgendamento();
        
        // Busca e exibe o histórico do paciente
        const historicoContainer = document.getElementById("historico-medico-container");
        const timelineMedico = document.getElementById("timeline-medico");
        
        if (historicoContainer && timelineMedico) {
            historicoContainer.style.display = "block";
            timelineMedico.innerHTML = "<p>Carregando histórico...</p>";

            try {
                const historico = await window.MedControl.appointments.list(atendimento.patient_id);
                timelineMedico.innerHTML = "";
                
                if (historico.length === 0) {
                    timelineMedico.innerHTML = "<p>Nenhum atendimento anterior registrado.</p>";
                } else {
                    historico.forEach(h => {
                        let dataFmt = "—";
                        if (h.appointment_date) {
                            const [a, m, d] = h.appointment_date.split("-");
                            dataFmt = `${d}/${m}/${a}`;
                        }

                        const article = document.createElement("article");
                        article.className = "timeline-item";
                        article.innerHTML = `
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <div class="timeline-heading">
                                    <h3>${h.diagnosis || "Consulta sem diagnóstico"}</h3>
                                </div>
                                <p class="timeline-date">${dataFmt}</p>
                                <p>${h.observations || "Sem observações."}</p>
                                <div class="record-meta"><strong>Prescrição:</strong> ${h.prescription || "Nenhuma"}</div>
                            </div>
                        `;
                        timelineMedico.appendChild(article);
                    });
                }
            } catch (e) {
                console.error("Erro ao carregar histórico:", e);
                timelineMedico.innerHTML = "<p>Não foi possível carregar o histórico.</p>";
            }
        }
    }

    window.location.hash = "#novo-atendimento";
}

function esconderCamposAgendamento() {
    const divData = document.getElementById("appointment-date")?.closest('.form-group');
    const divHora = document.getElementById("appointment-time")?.closest('.form-group');
    const divModalidade = document.querySelector('.radio-options')?.closest('.form-group');
    const divPaciente = document.getElementById("appointment-patient")?.closest('.form-group');
    const divMedico = document.getElementById("appointment-doctor")?.closest('.form-group');

    if(divData) divData.style.display = "none";
    if(divHora) divHora.style.display = "none";
    if(divModalidade) divModalidade.style.display = "none";
    if(divPaciente) divPaciente.style.display = "none";
    if(divMedico) divMedico.style.display = "none";
}

function restaurarCamposAgendamento() {
    const divs = document.querySelectorAll('.form-group');
    divs.forEach(el => el.style.display = "");
    
    const historicoContainer = document.getElementById("historico-medico-container");
    if (historicoContainer) historicoContainer.style.display = "none";

    const botaoSubmit = document.querySelector('#appointment-form button[type="submit"]');
    if (botaoSubmit) botaoSubmit.textContent = "Agendar atendimento";
}

async function excluirAtendimento(id) {
    if (!confirm("Tem certeza de que deseja excluir este atendimento?")) return;
    try {
        await window.MedControl.appointments.remove(id);
        alert("Atendimento excluído com sucesso!");
        await carregarAtendimentos();
        if (typeof inicializarDashboard === "function") inicializarDashboard();
        if (typeof inicializarAgendaMedico === "function") inicializarAgendaMedico();
    } catch (error) {
        console.error("Erro ao excluir atendimento:", error);
        alert("Não foi possível excluir o atendimento.");
    }
}

function formatarDataHora(data, horario) {
    if (!data) return "—";
    const [ano, mes, dia] = data.split("-");
    const dataFormatada = `${dia}/${mes}/${ano}`;
    return horario ? `${dataFormatada} às ${horario.substring(0, 5)}` : dataFormatada;
}
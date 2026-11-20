let pacienteEmEdicaoId = null;

async function inicializarPacientes() {
    console.log("Módulo de pacientes inicializado.");

    const formulario = document.getElementById("patient-form");

    if (formulario) {
        formulario.addEventListener("submit", cadastrarPaciente);

        formulario.addEventListener("reset", () => {
            pacienteEmEdicaoId = null;
            const botaoSalvar = formulario.querySelector('button[type="submit"]');
            if (botaoSalvar) botaoSalvar.textContent = "Salvar prontuário";
        });
    }

    // 1. Preenche o select de agendamento (isso roda de fundo, sem mostrar a tabela)
    await preencherSelectPacientes();
    
    // 2. Deixa a tabela de pacientes com a mensagem inicial
    const tabela = document.getElementById("patients-table-body");
    if (tabela) {
        tabela.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Digite na busca acima para encontrar um paciente.</td></tr>`;
    }

    // 3. Configura a busca com "debounce" (espera você parar de digitar)
    const campoBusca = document.getElementById("search-patient");
    if (campoBusca) {
        let timerBusca;
        campoBusca.addEventListener("input", (e) => {
            clearTimeout(timerBusca);
            timerBusca = setTimeout(() => {
                buscarPacientes(e.target.value.trim());
            }, 400); // Espera 400ms depois da última tecla
        });
    }
}

// Função separada só para preencher o <select> de agendamento
async function preencherSelectPacientes() {
    try {
        const pacientes = await window.MedControl.patients.list();
        const selecaoPaciente = document.getElementById("appointment-patient");
        if (selecaoPaciente) {
            selecaoPaciente.innerHTML = '<option value="">Selecione o paciente</option>';
            pacientes.forEach(paciente => {
                const opcao = document.createElement("option");
                opcao.value = paciente.id;
                opcao.textContent = paciente.full_name;
                selecaoPaciente.appendChild(opcao);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar lista do select:", error);
    }
}

// Função que faz a busca real no banco
async function buscarPacientes(termo) {
    const tabela = document.getElementById("patients-table-body");
    if (!tabela) return;

    // Se a busca estiver vazia, limpa a tabela e pede para digitar
    if (!termo) {
        tabela.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Digite na busca acima para encontrar um paciente.</td></tr>`;
        return;
    }

    tabela.innerHTML = `<tr><td colspan="5" style="text-align: center;">Buscando...</td></tr>`;

    try {
        // O nosso medcontrol-api.js já suporta passar o termo de busca
        const pacientes = await window.MedControl.patients.list(termo);

        tabela.innerHTML = "";

        if (pacientes.length === 0) {
            tabela.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nenhum paciente encontrado para "${termo}".</td></tr>`;
            return;
        }

        pacientes.forEach(paciente => {
            const linha = document.createElement("tr");

            const campos = [paciente.full_name, paciente.cpf, paciente.phone || "", "—"];
            campos.forEach(valor => {
                const coluna = document.createElement("td");
                coluna.textContent = valor;
                linha.appendChild(coluna);
            });

            const colunaAcoes = document.createElement("td");

            // BOTÃO VISUALIZAR
            const botaoVisualizar = document.createElement("button");
            botaoVisualizar.type = "button";
            botaoVisualizar.className = "text-link";
            botaoVisualizar.textContent = "Visualizar";
            botaoVisualizar.style.marginRight = "10px";
            botaoVisualizar.addEventListener("click", () => {
                window.location.hash = `#prontuario?id=${paciente.id}`;
            });

            // BOTÃO EDITAR
            const botaoEditar = document.createElement("button");
            botaoEditar.type = "button";
            botaoEditar.className = "text-link";
            botaoEditar.textContent = "Editar";
            botaoEditar.style.color = "var(--warning)";
            botaoEditar.style.marginRight = "10px";
            botaoEditar.addEventListener("click", () => {
                editarPaciente(paciente);
            });

            // BOTÃO EXCLUIR
            const botaoExcluir = document.createElement("button");
            botaoExcluir.type = "button";
            botaoExcluir.className = "text-link";
            botaoExcluir.textContent = "Excluir";
            botaoExcluir.style.color = "var(--danger)";
            botaoExcluir.addEventListener("click", () => {
                excluirPaciente(paciente.id);
            });

            colunaAcoes.appendChild(botaoVisualizar);
            colunaAcoes.appendChild(botaoEditar);
            colunaAcoes.appendChild(botaoExcluir);

            linha.appendChild(colunaAcoes);
            tabela.appendChild(linha);
        });

    } catch (error) {
        console.error("Erro ao buscar pacientes:", error);
        tabela.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">Erro ao buscar pacientes.</td></tr>`;
    }
}

async function cadastrarPaciente(event) {
    event.preventDefault();

    try {
        const paciente = {
            full_name: document.getElementById("patient-name").value.trim(),
            cpf: document.getElementById("patient-cpf").value.trim(),
            birth_date: document.getElementById("patient-birth").value,
            gender: document.getElementById("patient-gender").value || null,
            phone: document.getElementById("patient-phone").value.trim(),
            email: document.getElementById("patient-email").value.trim() || null,
            address: document.getElementById("patient-address").value.trim() || null,
            medical_history: document.getElementById("medical-history").value.trim() || null,
            allergies: document.getElementById("allergies").value.trim() || null,
            medications: document.getElementById("medications").value.trim() || null
        };

        if (pacienteEmEdicaoId) {
            await window.MedControl.patients.update(pacienteEmEdicaoId, paciente);
            alert("Paciente atualizado com sucesso!");
        } else {
            await window.MedControl.patients.create(paciente);
            alert("Paciente cadastrado com sucesso!");
        }

        pacienteEmEdicaoId = null;
        document.getElementById("patient-form").reset();
        
        // Atualiza a lista do select e limpa a tabela de busca
        await preencherSelectPacientes();
        const campoBusca = document.getElementById("search-patient");
        if (campoBusca) campoBusca.value = "";
        document.getElementById("patients-table-body").innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Digite na busca acima para encontrar um paciente.</td></tr>`;

        window.location.hash = "#pacientes";

    } catch (error) {
        console.error("Erro ao salvar paciente:", error);
        alert("Não foi possível salvar o paciente. Verifique o Console.");
    }
}

function editarPaciente(paciente) {
    pacienteEmEdicaoId = paciente.id;

    document.getElementById("patient-name").value = paciente.full_name || "";
    document.getElementById("patient-cpf").value = paciente.cpf || "";
    document.getElementById("patient-birth").value = paciente.birth_date || "";
    document.getElementById("patient-gender").value = paciente.gender || "";
    document.getElementById("patient-phone").value = paciente.phone || "";
    document.getElementById("patient-email").value = paciente.email || "";
    document.getElementById("patient-address").value = paciente.address || "";
    document.getElementById("medical-history").value = paciente.medical_history || "";
    document.getElementById("allergies").value = paciente.allergies || "";
    document.getElementById("medications").value = paciente.medications || "";

    const botaoSalvar = document.querySelector('#patient-form button[type="submit"]');
    if (botaoSalvar) botaoSalvar.textContent = "Atualizar paciente";

    window.location.hash = "#cadastro";
}

async function excluirPaciente(id) {
    const confirmar = confirm("Tem certeza de que deseja excluir este paciente?");
    if (!confirmar) return;

    try {
        await window.MedControl.patients.remove(id);
        alert("Paciente excluído com sucesso!");
        
        // Atualiza o select e limpa a busca
        await preencherSelectPacientes();
        const campoBusca = document.getElementById("search-patient");
        if (campoBusca && campoBusca.value) {
            buscarPacientes(campoBusca.value.trim());
        } else {
            document.getElementById("patients-table-body").innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Digite na busca acima para encontrar um paciente.</td></tr>`;
        }
    } catch (error) {
        console.error("Erro ao excluir paciente:", error);
        alert("Não foi possível excluir o paciente.");
    }
}
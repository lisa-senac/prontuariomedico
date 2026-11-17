
let pacienteEmEdicaoId = null;

async function inicializarPacientes() {

    console.log("Módulo de pacientes inicializado.");

    const formulario = document.getElementById("patient-form");

    if (formulario) {
        formulario.addEventListener("submit", cadastrarPaciente);

        formulario.addEventListener("reset", () => {
            pacienteEmEdicaoId = null;

            const botaoSalvar = formulario.querySelector(
                'button[type="submit"]'
            );

            botaoSalvar.textContent = "Salvar prontuário";
        });
    }

    await carregarPacientes();
}

async function carregarPacientes() {

    try {

        const pacientes = await window.MedControl.patients.list();

        // Atualiza a seleção de pacientes nos atendimentos
        const selecaoPaciente = document.getElementById("appointment-patient");

        if (selecaoPaciente) {

            selecaoPaciente.innerHTML =
                '<option value="">Selecione o paciente</option>';

            pacientes.forEach(paciente => {

                const opcao = document.createElement("option");

                opcao.value = paciente.id;
                opcao.textContent = paciente.full_name;

                selecaoPaciente.appendChild(opcao);

            });
        }

        console.log("Pacientes carregados:", pacientes);

        // Atualiza a tabela de pacientes
        const tabela = document.getElementById("patients-table-body");

        if (!tabela) {
            console.error("Tabela de pacientes não encontrada.");
            return;
        }

        tabela.innerHTML = "";

        pacientes.forEach(paciente => {

            const linha = document.createElement("tr");

            const campos = [
                paciente.full_name,
                paciente.cpf,
                paciente.phone || "",
                "—"
            ];

            campos.forEach(valor => {

                const coluna = document.createElement("td");

                coluna.textContent = valor;

                linha.appendChild(coluna);

            });

            // Coluna de ações
            const colunaAcoes = document.createElement("td");

            const botaoEditar = document.createElement("button");

            botaoEditar.type = "button";
            botaoEditar.className = "text-link";
            botaoEditar.textContent = "Editar";

            botaoEditar.addEventListener("click", () => {
                editarPaciente(paciente);
            });

            const botaoExcluir = document.createElement("button");

            botaoExcluir.type = "button";
            botaoExcluir.className = "text-link";
            botaoExcluir.textContent = "Excluir";

            botaoExcluir.style.color = "var(--danger)";
            botaoExcluir.style.marginLeft = "10px";

            botaoExcluir.addEventListener("click", () => {
                excluirPaciente(paciente.id);
            });

            colunaAcoes.appendChild(botaoEditar);
            colunaAcoes.appendChild(botaoExcluir);

            linha.appendChild(colunaAcoes);

            tabela.appendChild(linha);

        });

    } catch (error) {

        console.error("Erro ao carregar pacientes:", error);

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

            await window.MedControl.patients.update(
                pacienteEmEdicaoId,
                paciente
            );

            alert("Paciente atualizado com sucesso!");

        } else {

            await window.MedControl.patients.create(paciente);

            alert("Paciente cadastrado com sucesso!");

        }

        pacienteEmEdicaoId = null;

        document.getElementById("patient-form").reset();

        await carregarPacientes();

    } catch (error) {

        console.error("Erro ao salvar paciente:", error);

        alert("Não foi possível salvar o paciente. Verifique o Console.");

    }

}

// EDITAR PACIENTE
function editarPaciente(paciente) {

    pacienteEmEdicaoId = paciente.id;

    document.getElementById("patient-name").value = paciente.full_name || "";

    document.getElementById("patient-cpf").value = paciente.cpf || "";

    document.getElementById("patient-birth").value = paciente.birth_date || "";

    document.getElementById("patient-gender").value = paciente.gender || "";

    document.getElementById("patient-phone").value = paciente.phone || "";

    document.getElementById("patient-email").value = paciente.email || "";

    document.getElementById("patient-address").value = paciente.address || "";

    document.getElementById("medical-history").value =
        paciente.medical_history || "";

    document.getElementById("allergies").value = paciente.allergies || "";

    document.getElementById("medications").value = paciente.medications || "";

    const botaoSalvar = document.querySelector(
        '#patient-form button[type="submit"]'
    );

    botaoSalvar.textContent = "Atualizar paciente";

    document.getElementById("cadastro").scrollIntoView({
        behavior: "smooth"
    });

}

// EXCLUIR PACIENTE
async function excluirPaciente(id) {

    const confirmar = confirm(
        "Tem certeza de que deseja excluir este paciente?"
    );

    if (!confirmar) {
        return;
    }

    try {

        await window.MedControl.patients.remove(id);

        alert("Paciente excluído com sucesso!");

        await carregarPacientes();

    } catch (error) {

        console.error("Erro ao excluir paciente:", error);

        alert(
            "Não foi possível excluir o paciente. Verifique se existem atendimentos vinculados."
        );

    }

}

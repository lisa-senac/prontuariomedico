
let atendimentoEmEdicaoId = null;

async function inicializarAtendimentos() {
    console.log("Módulo de atendimentos inicializado.");

    const formulario = document.getElementById("appointment-form");

    if (formulario) {
        formulario.addEventListener("submit", salvarAtendimento);

        formulario.addEventListener("reset", () => {
            atendimentoEmEdicaoId = null;

            const botaoSalvar = formulario.querySelector(
                'button[type="submit"]'
            );

            if (botaoSalvar) {
                botaoSalvar.textContent = "Registrar atendimento";
            }
        });
    }

    document.getElementById("appointment-form").reset();

    await carregarAtendimentos();

    document.querySelector('a[href="#atendimentos"]').click();
}

async function carregarAtendimentos() {
    try {
        const [atendimentos, pacientes] = await Promise.all([
            window.MedControl.appointments.list(),
            window.MedControl.patients.list()
        ]);

        const nomesPacientes = new Map(
            pacientes.map(paciente => [
                paciente.id,
                paciente.full_name
            ])
        );

        const tabela = document.getElementById("appointments-table-body");

        if (!tabela) {
            console.error("Tabela de atendimentos não encontrada.");
            return;
        }

        tabela.innerHTML = "";

        atendimentos.forEach(atendimento => {
            const linha = document.createElement("tr");

            const colunaData = document.createElement("td");
            colunaData.textContent = formatarDataHora(
                atendimento.appointment_date,
                atendimento.appointment_time
            );

            const colunaPaciente = document.createElement("td");
            colunaPaciente.textContent =
                nomesPacientes.get(atendimento.patient_id) || "Paciente não encontrado";

            const colunaModalidade = document.createElement("td");
            colunaModalidade.textContent =
                atendimento.appointment_type === "presencial"
                    ? "Presencial"
                    : "Online";

            const colunaProfissional = document.createElement("td");
            colunaProfissional.textContent = "—";

            const colunaRegistro = document.createElement("td");

            const descricao = document.createElement("span");
            descricao.textContent = atendimento.diagnosis || "Sem diagnóstico";

            const botaoEditar = document.createElement("button");
            botaoEditar.type = "button";
            botaoEditar.className = "text-link";
            botaoEditar.textContent = "Editar";
            botaoEditar.style.marginLeft = "10px";
            botaoEditar.addEventListener("click", () => {
                editarAtendimento(atendimento);
            });

            const botaoExcluir = document.createElement("button");
            botaoExcluir.type = "button";
            botaoExcluir.className = "text-link";
            botaoExcluir.textContent = "Excluir";
            botaoExcluir.style.color = "var(--danger)";
            botaoExcluir.style.marginLeft = "10px";
            botaoExcluir.addEventListener("click", () => {
                excluirAtendimento(atendimento.id);
            });

            colunaRegistro.appendChild(descricao);
            colunaRegistro.appendChild(botaoEditar);
            colunaRegistro.appendChild(botaoExcluir);

            linha.appendChild(colunaData);
            linha.appendChild(colunaPaciente);
            linha.appendChild(colunaModalidade);
            linha.appendChild(colunaProfissional);
            linha.appendChild(colunaRegistro);

            tabela.appendChild(linha);
        });

        console.log("Atendimentos carregados:", atendimentos);

    } catch (error) {
        console.error("Erro ao carregar atendimentos:", error);
    }
}

async function salvarAtendimento(event) {
    event.preventDefault();

    try {
        const tipoSelecionado = document.querySelector(
            'input[name="appointmentType"]:checked'
        );

        if (!tipoSelecionado) {
            alert("Selecione a modalidade do atendimento.");
            return;
        }

        const atendimento = {
            patient_id: document.getElementById("appointment-patient").value,
            appointment_date: document.getElementById("appointment-date").value,
            appointment_time: document.getElementById("appointment-time").value,
            appointment_type: tipoSelecionado.value,
            diagnosis: document.getElementById("diagnosis").value.trim() || null,
            prescription: document.getElementById("prescription").value.trim() || null,
            observations: document.getElementById("observations").value.trim() || null
        };

        if (atendimentoEmEdicaoId) {
            await window.MedControl.appointments.update(
                atendimentoEmEdicaoId,
                atendimento
            );

            alert("Atendimento atualizado com sucesso!");
        } else {
            await window.MedControl.appointments.create(atendimento);

            alert("Atendimento registrado com sucesso!");
        }

        atendimentoEmEdicaoId = null;

        document.getElementById("appointment-form").reset();

        await carregarAtendimentos();

    } catch (error) {
        console.error("Erro ao salvar atendimento:", error);
        alert("Não foi possível salvar o atendimento. Verifique o Console.");
    }
}

function editarAtendimento(atendimento) {
    atendimentoEmEdicaoId = atendimento.id;

    document.getElementById("appointment-patient").value =
        atendimento.patient_id || "";

    document.getElementById("appointment-date").value =
        atendimento.appointment_date || "";

    document.getElementById("appointment-time").value =
        atendimento.appointment_time || "";

    document.getElementById("diagnosis").value =
        atendimento.diagnosis || "";

    document.getElementById("prescription").value =
        atendimento.prescription || "";

    document.getElementById("observations").value =
        atendimento.observations || "";

    const modalidade = document.querySelector(
        `input[name="appointmentType"][value="${atendimento.appointment_type}"]`
    );

    if (modalidade) {
        modalidade.checked = true;
    }

    const botaoSalvar = document.querySelector(
        '#appointment-form button[type="submit"]'
    );

    if (botaoSalvar) {
        botaoSalvar.textContent = "Atualizar atendimento";
    }

    document.getElementById("novo-atendimento").scrollIntoView({
        behavior: "smooth"
    });
}

async function excluirAtendimento(id) {
    const confirmar = confirm(
        "Tem certeza de que deseja excluir este atendimento?"
    );

    if (!confirmar) {
        return;
    }

    try {
        await window.MedControl.appointments.remove(id);

        alert("Atendimento excluído com sucesso!");

        await carregarAtendimentos();

    } catch (error) {
        console.error("Erro ao excluir atendimento:", error);
        alert("Não foi possível excluir o atendimento. Verifique o Console.");
    }
}

function formatarDataHora(data, horario) {
    if (!data) {
        return "—";
    }

    const [ano, mes, dia] = data.split("-");
    const dataFormatada = `${dia}/${mes}/${ano}`;

    return horario
        ? `${dataFormatada} às ${horario.substring(0, 5)}`
        : dataFormatada;
}

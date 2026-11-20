let perfilUsuarioLogado = null;

document.addEventListener("DOMContentLoaded", async () => {
    console.log("MedControl iniciado.");
    if (!window.MedControl) return;

    let usuario = null;

    try {
        usuario = await window.MedControl.auth.currentUser();
        if (usuario) {
            perfilUsuarioLogado = await window.MedControl.profiles.getMeuPerfil();
            
            if (!perfilUsuarioLogado) {
                await window.MedControl.profiles.criarPerfilFallback(usuario.id, usuario.email, 'admin');
                perfilUsuarioLogado = { role: 'admin', status: 'ativo', id: usuario.id };
            }

            if (perfilUsuarioLogado.status === 'suspenso') {
                alert("Sua conta está suspensa.");
                await window.MedControl.auth.signOut();
                window.location.href = "login.html";
                return;
            }
        }
    } catch (erro) {
        console.error("Falha ao verificar sessão/perfil:", erro);
    }

    if (!usuario || !perfilUsuarioLogado) {
        window.location.href = "login.html";
        return;
    }

    window.perfilUsuarioLogado = perfilUsuarioLogado;

    preencherUsuarioNaInterface(usuario, perfilUsuarioLogado);
    aplicarPermissoes(perfilUsuarioLogado.role);

    const botaoSair = document.getElementById("btn-logout");
    if (botaoSair) {
        botaoSair.addEventListener("click", async () => {
            if (!confirm("Deseja sair do sistema?")) return;
            await window.MedControl.auth.signOut();
            window.location.href = "login.html";
        });
    }

    if (!window.location.hash) window.location.hash = "#inicio";
    
    const linksMenu = document.querySelectorAll(".nav-link");
    function atualizarMenuAtivo() {
        const hashAtual = window.location.hash || "#inicio";
        linksMenu.forEach((link) => {
            const destino = link.getAttribute("href");
            link.classList.toggle("active", destino === hashAtual);
        });
    }
    window.addEventListener("hashchange", atualizarMenuAtivo);
    atualizarMenuAtivo();

    // Inicializa Módulos
    try {
        if (typeof inicializarDashboard === "function") inicializarDashboard();
        if (typeof inicializarPacientes === "function") inicializarPacientes();
        if (typeof inicializarProntuarios === "function") inicializarProntuarios();
        if (typeof inicializarAtendimentos === "function") inicializarAtendimentos();
        if (typeof inicializarHistorico === "function") inicializarHistorico();
        if (typeof inicializarAgendaMedico === "function") inicializarAgendaMedico(); // <--- AQUI ESTAVA O ERRO
    } catch (erro) {
        console.error("Erro ao inicializar módulos:", erro);
    }
});

function preencherUsuarioNaInterface(usuario, perfil) {
    const email = usuario?.email || "—";
    const nome = perfil.full_name || email.split("@")[0] || "Usuário";
    const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1);
    const iniciais = nome.split(/[.\-_ ]+/).filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "US";

    if (document.getElementById("user-name")) document.getElementById("user-name").textContent = nomeFormatado;
    if (document.getElementById("user-email")) document.getElementById("user-email").textContent = email;
    if (document.getElementById("user-avatar")) document.getElementById("user-avatar").textContent = iniciais;
    
    if (document.getElementById("security-name")) document.getElementById("security-name").textContent = nomeFormatado;
    if (document.getElementById("security-email")) document.getElementById("security-email").textContent = email;
    if (document.getElementById("security-avatar")) document.getElementById("security-avatar").textContent = iniciais;
    if (document.getElementById("security-role")) document.getElementById("security-role").textContent = `Cargo: ${(perfil.role || '—').toUpperCase()}`;
}

function aplicarPermissoes(cargo) {
    console.log("Aplicando permissões para o cargo:", cargo);

    if (cargo === "admin") {
        const btnAdmin = document.getElementById("btn-admin");
        if (btnAdmin) btnAdmin.style.display = "inline-flex";
    }

    // Controle de Links e Seções
    const linksRestritos = document.querySelectorAll(".link-admin, .link-atendente, .link-medico");
    
    linksRestritos.forEach(el => {
        const isLink = el.tagName.toLowerCase() === 'a';
        const displayStyle = isLink ? "flex" : "block";

        if (cargo === "medico") {
            // Médico VÊ o link-medico, mas NÃO VÊ link-admin e link-atendente
            if (el.classList.contains("link-medico")) {
                el.style.display = displayStyle;
            } else {
                el.style.display = "none";
            }
        } else {
            // Admin/Atendente VÊ link-admin e link-atendente, mas NÃO VÊ link-medico
            if (el.classList.contains("link-medico")) {
                el.style.display = "none";
            } else {
                el.style.display = displayStyle;
            }
        }
    });

    // Campos clínicos
    const camposClinicos = document.getElementById("campos-clinicos");
    if (camposClinicos) {
        if (cargo === "medico" || cargo === "admin") {
            camposClinicos.style.display = "block";
        } else {
            camposClinicos.style.display = "none";
        }
    }
    
    // Redireciona o médico para a tela de agenda dele
    if (cargo === "medico" && (window.location.hash === "#inicio" || !window.location.hash)) {
        window.location.hash = "#minha-agenda";
    }
}
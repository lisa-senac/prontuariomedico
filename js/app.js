
document.addEventListener("DOMContentLoaded", () => {
    console.log("MedControl iniciado.");

    if (!window.MedControl) {
        console.warn(
            "Cliente Supabase não inicializado. Verifique a configuração."
        );

        return;
    }

    console.log("Cliente Supabase carregado.");

    inicializarDashboard();
    inicializarPacientes();
    inicializarProntuarios();
    inicializarAtendimentos();
    inicializarHistorico();
});

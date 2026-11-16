function validarCampoObrigatorio(valor) {
    return valor !== null &&
           valor !== undefined &&
           String(valor).trim() !== "";
}

function validarEmail(email) {
    const expressao = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return expressao.test(email);
}

export async function executarRequisicao(requisicao) {
  try {
    return await requisicao();
  } catch (error) {
    console.error("Erro na operação:", error);

    throw new Error(
      error.message || "Não foi possível concluir a operação."
    );
  }
}

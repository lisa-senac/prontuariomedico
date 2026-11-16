import { supabase } from "../config/supabase-config.js";

const TABELA = "patients";

export async function listarPacientes() {
  const { data, error } = await supabase
    .from(TABELA)
    .select("*")
    .order("name");

  if (error) throw error;

  return data;
}

export async function buscarPaciente(id) {
  const { data, error } = await supabase
    .from(TABELA)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function cadastrarPaciente(paciente) {
  const { data, error } = await supabase
    .from(TABELA)
    .insert(paciente)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function atualizarPaciente(id, dados) {
  const { data, error } = await supabase
    .from(TABELA)
    .update(dados)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function excluirPaciente(id) {
  const { error } = await supabase
    .from(TABELA)
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}

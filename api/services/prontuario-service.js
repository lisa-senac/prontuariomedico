import { supabase } from "../config/supabase-config.js";

const TABELA = "appointments";

export async function listarProntuarios() {
  const { data, error } = await supabase
    .from(TABELA)
    .select("*")
    .order("appointment_date", { ascending: false });

  if (error) throw error;

  return data;
}

export async function buscarProntuario(id) {
  const { data, error } = await supabase
    .from(TABELA)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function cadastrarProntuario(prontuario) {
  const { data, error } = await supabase
    .from(TABELA)
    .insert(prontuario)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function atualizarProntuario(id, dados) {
  const { data, error } = await supabase
    .from(TABELA)
    .update(dados)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function excluirProntuario(id) {
  const { error } = await supabase
    .from(TABELA)
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}

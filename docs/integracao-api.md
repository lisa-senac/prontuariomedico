# MedControl - Integração da API

## Objetivo

Centralizar a comunicação entre o protótipo MedControl
e o banco de dados.

## Tecnologias

- JavaScript ES Modules
- Supabase JavaScript Client
- Supabase Auth
- PostgreSQL (gerenciado pelo Supabase)

## Organização

- config: configuração da conexão.
- services: operações de pacientes, prontuários e autenticação.
- utils: tratamento de erros.
- index.js: exportação dos serviços.

## Operações disponíveis

### Pacientes
- Listar pacientes.
- Buscar paciente por ID.
- Cadastrar paciente.
- Atualizar paciente.
- Excluir paciente.

### Prontuários
- Listar prontuários.
- Buscar prontuário por ID.
- Cadastrar prontuário.
- Atualizar prontuário.
- Excluir prontuário.

### Autenticação
- Cadastrar usuário.
- Fazer login.
- Fazer logout.
- Consultar usuário autenticado.

## Configuração

1. Criar o projeto no Supabase.
2. Configurar a URL e a chave pública no arquivo
   supabase-config.js.
3. Criar as tabelas e políticas de acesso no banco.
4. Integrar os serviços às telas do protótipo.
5. Executar os testes de integração.

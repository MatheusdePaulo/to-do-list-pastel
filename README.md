# To Do List Pastel

Aplicação web de lista de tarefas desenvolvida com **HTML**, **CSS** e **JavaScript puro**, com foco em organização de tarefas do dia a dia, interface amigável e persistência local no navegador.

## Acesso ao projeto

A aplicação está disponível em:

**https://matheusdepaulo.github.io/to-do-list-pastel/**

## Sobre o projeto

O projeto consiste em um CRUD estático de tarefas, onde o usuário pode adicionar, visualizar, editar, concluir e remover tarefas.  
As informações ficam armazenadas no **localStorage**, permitindo que as tarefas permaneçam salvas mesmo após atualizar a página.

Além das operações básicas, o sistema também possui regras específicas, como:

- limite máximo de 10 tarefas
- expiração automática das tarefas após 24 horas
- filtro por status
- limpeza de tarefas concluídas
- capitalização automática da primeira letra

## Funcionalidades

- Adicionar tarefas
- Editar tarefas
- Remover tarefas
- Marcar tarefas como concluídas
- Filtrar tarefas por:
    - Todas
    - Pendentes
    - Concluídas
- Limpar tarefas concluídas
- Contador de tarefas
- Validação de entrada
- Limite de 60 caracteres por tarefa
- Limite máximo de 10 tarefas
- Persistência com `localStorage`
- Expiração automática das tarefas após 24 horas
- Interface responsiva

## Requisitos atendidos

### Requisitos Funcionais
- O usuário pode adicionar tarefas por meio de um campo de texto e um botão.
- O usuário pode remover tarefas da lista.
- O usuário pode editar tarefas existentes.
- O usuário pode concluir tarefas.

### Requisitos Não Funcionais
- A interface é responsiva e se adapta a diferentes tamanhos de tela.
- A aplicação possui usabilidade simples e intuitiva.
- O sistema apresenta feedback visual para ações do usuário.

### Requisitos de Domínio
- O sistema valida se o campo de entrada está vazio antes de adicionar uma tarefa.
- As tarefas permanecem salvas usando `localStorage`.
- As tarefas expiram automaticamente após 24 horas.

### Regras de Negócio
- O usuário não pode cadastrar mais de 10 tarefas.
- Cada tarefa possui limite de 60 caracteres.
- A primeira letra da tarefa é convertida automaticamente para maiúscula.
- Tarefas concluídas podem ser removidas em lote pelo botão **Limpar concluídas**.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript

## Estrutura do projeto

```bash
To-Do-List-Pastel/
├── index.html
├── style.css
└── script.js
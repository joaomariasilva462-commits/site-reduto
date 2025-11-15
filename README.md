# Reduto – Cuidando com Amor

Website oficial da ONG Reduto, uma organização dedicada a promover saúde emocional, intelectual, física e espiritual para pessoas em situação de vulnerabilidade socioeconômica.

Este projeto apresenta a estrutura do site institucional da ONG, incluindo páginas de informações, projetos, cadastro de voluntários e contato.

## Sobre a ONG

**Missão:** Promover uma sociedade mais saudável, proporcionando aos pacientes autoconhecimento, desenvolvimento emocional e bem-estar de forma acessível, tendo como pilares o amor, o cuidado e a fé em Jesus Cristo.  

**Propósito:** Oferecer serviços que englobam saúde emocional, intelectual, física e espiritual, garantindo acesso a quem mais precisa.

**Áreas de atuação:**

- Apoio à saúde mental  
- Psicologia  
- Neuropsicopedagogia  
- Fisioterapia  
- Nutrição  
- Projetos sociais e educativos  

## Sobre o Site

O site foi desenvolvido com:

- HTML5  
- CSS3  
- JavaScript  

**Características:**

- Estrutura leve, responsiva e fácil de manter  
- Compatível com desktops e dispositivos móveis  
- Navegação clara e acessível  

### Organização das Páginas

- `index.html` – Página inicial  
- `projetos.html` – Projetos, ações e campanhas  
- `cadastro.html` – Cadastro de voluntários e apoiadores com **funcionalidade dinâmica em JavaScript**  

### Funcionalidade do Cadastro

A página de cadastro foi aprimorada com JavaScript para:  

- Salvar os dados do formulário localmente usando `localStorage`  
- Exibir mensagens de confirmação quando o usuário envia o cadastro  
- Permitir ao administrador ver, exportar e limpar os cadastros salvos  

### Estrutura de Arquivos

- `/css/style.css` – Estilos globais  
- `/js/masks.js` – Máscaras e validações simples de formulário  
- `/js/app.js` – Funcionalidade dinâmica do cadastro (salvamento, visualização, exportação e limpeza de cadastros)  

## Como executar o site localmente

1. Abra a pasta do projeto em um editor de código (ex.: VSCode).  
2. Utilize a extensão **Live Server** ou abra o `index.html` diretamente em seu navegador.  
3. Para testar a funcionalidade de cadastro, acesse `cadastro.html` e preencha os campos.  

## Observações

- O painel de administração do cadastro é **apenas para o responsável**, garantindo que apenas ele possa visualizar ou exportar os cadastros.  
- O site é compatível com os navegadores modernos mais recentes.  
- Para produção, recomenda-se implementar um backend para armazenamento seguro dos cadastros.



  



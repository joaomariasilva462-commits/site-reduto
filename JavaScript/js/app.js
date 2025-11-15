/* js/app.js
   JavaScript avançado para a atividade — manipulação do DOM, eventos,
   localStorage, integração com ViaCEP (preenchimento automático de endereço),
   validações extras, feedback visual, exportação e listagem dinâmica.
   (Colocar em /js/app.js e incluir com <script src="js/app.js" defer></script>)
*/

(function () {
  'use strict';

  const STORAGE_KEY = 'reduto_cadastros_v1';

  // Utilitários
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const asNumber = v => Number(String(v).replace(/\D+/g, '') || 0);

  // Cria elemento com atributos
  function el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else e.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (!c) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  // Mensagens rápidas / toast
  function showToast(msg, type = 'info', timeout = 4000) {
    let container = $('#reduto-toast-container');
    if (!container) {
      container = el('div', { id: 'reduto-toast-container', class: 'reduto-toast-container' });
      Object.assign(container.style, {
        position: 'fixed',
        right: '18px',
        bottom: '18px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '320px'
      });
      document.body.appendChild(container);
    }
    const toast = el('div', { class: `reduto-toast reduto-${type}`, role: 'status', 'aria-live': 'polite' }, [
      el('div', { text: msg })
    ]);
    Object.assign(toast.style, {
      background: '#fff',
      padding: '12px 14px',
      borderRadius: '10px',
      boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
      fontWeight: 600,
      color: '#222'
    });
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity .3s, transform .3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 350);
    }, timeout);
  }

  // Carregar/Salvar no localStorage
  function loadCadastros() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Falha ao carregar cadastros', e);
      return [];
    }
  }
  function saveCadastros(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  // Validação simples de CPF (formato e algoritmo)
  function validarCPF(cpf) {
    if (!cpf) return false;
    const s = cpf.replace(/\D+/g, '');
    if (s.length !== 11) return false;
    // Elimina CPFs óbvios
    if (/^(\d)\1+$/.test(s)) return false;
    const nums = s.split('').map(Number);
    for (let t = 9; t < 11; t++) {
      let d = 0;
      for (let i = 0; i < t; i++) d += nums[i] * ((t + 1) - i);
      d = ((10 * d) % 11) % 10;
      if (d !== nums[t]) return false;
    }
    return true;
  }

  // Máscaras leves (aplica somente se masks.js não tiver feito)
  function applyMasksFallback() {
    const cpf = $('#cpf');
    const tel = $('#telefone');
    const cep = $('#cep');

    if (cpf && !cpf.dataset.maskApplied) {
      cpf.addEventListener('input', () => {
        let v = cpf.value.replace(/\D/g, '').slice(0, 11);
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        cpf.value = v;
      });
      cpf.dataset.maskApplied = '1';
    }

    if (tel && !tel.dataset.maskApplied) {
      tel.addEventListener('input', () => {
        let v = tel.value.replace(/\D/g, '').slice(0, 11);
        v = v.replace(/(\d{2})(\d)/, '($1) $2');
        v = v.replace(/(\d{5})(\d)/, '$1-$2');
        tel.value = v;
      });
      tel.dataset.maskApplied = '1';
    }

    if (cep && !cep.dataset.maskApplied) {
      cep.addEventListener('input', () => {
        let v = cep.value.replace(/\D/g, '').slice(0, 8);
        v = v.replace(/(\d{5})(\d)/, '$1-$2');
        cep.value = v;
      });
      cep.dataset.maskApplied = '1';
    }
  }

  // Integração ViaCEP para preencher endereço
  async function buscarCepPreencher(cepRaw) {
    const cep = String(cepRaw).replace(/\D/g, '');
    if (!cep || cep.length !== 8) return null;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!res.ok) throw new Error('Erro na consulta CEP');
      const data = await res.json();
      if (data.erro) return null;
      return data; // {logradouro, bairro, localidade, uf, ...}
    } catch (e) {
      console.warn('ViaCEP falhou', e);
      return null;
    }
  }

  // Cria painel flutuante de ações (ver cadastros, export, limpar)
  function ensureControlPanel() {
    if ($('#reduto-panel')) return;
    const panel = el('div', { id: 'reduto-panel', class: 'reduto-panel' });
    Object.assign(panel.style, {
      position: 'fixed',
      right: '18px',
      bottom: '100px',
      zIndex: 9998,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    });

    const btnVer = el('button', { type: 'button', class: 'btn btn-secondary', text: 'Ver cadastros' });
    const btnExport = el('button', { type: 'button', class: 'btn btn-secondary', text: 'Exportar JSON' });
    const btnClear = el('button', { type: 'button', class: 'btn btn-secondary', text: 'Limpar cadastros' });

    btnVer.addEventListener('click', () => openListModal());
    btnExport.addEventListener('click', () => exportCadastros());
    btnClear.addEventListener('click', () => {
      if (!confirm('Tem certeza que deseja apagar TODOS os cadastros salvos localmente? Essa ação não pode ser desfeita.')) return;
      saveCadastros([]);
      showToast('Cadastros apagados com sucesso', 'info');
    });

    panel.appendChild(btnVer);
    panel.appendChild(btnExport);
    panel.appendChild(btnClear);
    document.body.appendChild(panel);
  }

  // Exporta cadastros como arquivo JSON
  function exportCadastros() {
    const arr = loadCadastros();
    if (!arr.length) {
      showToast('Nenhum cadastro para exportar.', 'info');
      return;
    }
    const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: `reduto_cadastros_${new Date().toISOString().slice(0,10)}.json` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Exportação iniciada.', 'info');
  }

  // Modal com listagem (criado dinamicamente)
  function openListModal() {
    const existing = $('#reduto-modal');
    if (existing) {
      existing.remove();
    }

    const cadastros = loadCadastros();

    const modal = el('div', { id: 'reduto-modal', class: 'reduto-modal', role: 'dialog', 'aria-modal': 'true' });
    Object.assign(modal.style, {
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.45)',
      zIndex: 99999
    });

    const container = el('div', { class: 'reduto-modal-container' });
    Object.assign(container.style, {
      maxWidth: '900px',
      width: '95%',
      maxHeight: '90vh',
      overflow: 'auto',
      background: 'white',
      padding: '18px',
      borderRadius: '12px'
    });

    const header = el('div', { class: 'modal-header' }, [
      el('h2', { text: `Cadastros (${cadastros.length})` }),
      el('div', {}, [
        el('input', { type: 'search', placeholder: 'Pesquisar por nome, email ou cidade', id: 'reduto-search' })
      ])
    ]);

    const tableWrap = el('div', { class: 'reduto-table-wrap' });
    const table = el('table', { class: 'reduto-table' });
    Object.assign(table.style, { width: '100%', borderCollapse: 'collapse' });

    const thead = el('thead', {}, [
      el('tr', {}, [
        el('th', { text: 'Nome' }),
        el('th', { text: 'E-mail' }),
        el('th', { text: 'CPF' }),
        el('th', { text: 'Telefone' }),
        el('th', { text: 'Cidade/UF' }),
        el('th', { text: 'Data' }),
        el('th', { text: 'Ações' })
      ])
    ]);
    const tbody = el('tbody');

    function renderRows(filter = '') {
      tbody.innerHTML = '';
      const f = String(filter || '').trim().toLowerCase();
      cadastros.forEach((c, idx) => {
        const textSearch = `${c.nome} ${c.email} ${c.cidade}`.toLowerCase();
        if (f && !textSearch.includes(f)) return;
        const tr = el('tr');
        const tdNome = el('td', { text: c.nome || '-' });
        const tdEmail = el('td', { text: c.email || '-' });
        const tdCpf = el('td', { text: c.cpf || '-' });
        const tdTel = el('td', { text: c.telefone || '-' });
        const tdCidade = el('td', { text: (c.cidade ? `${c.cidade}/${c.estado || ''}` : '-') });
        const tdDate = el('td', { text: new Date(c._created).toLocaleString() });
        const tdActions = el('td');
        const btnDel = el('button', { type: 'button', text: 'Excluir' });
        btnDel.addEventListener('click', () => {
          if (!confirm(`Excluir cadastro de "${c.nome}"?`)) return;
          cadastros.splice(idx, 1);
          saveCadastros(cadastros);
          renderRows(document.getElementById('reduto-search').value || '');
          showToast('Cadastro excluído.', 'info');
        });
        tdActions.appendChild(btnDel);
        [tdNome, tdEmail, tdCpf, tdTel, tdCidade, tdDate, tdActions].forEach(td => {
          Object.assign(td.style, { padding: '8px 6px', borderBottom: '1px solid rgba(0,0,0,0.06)' });
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      if (!tbody.children.length) {
        const tr = el('tr');
        const td = el('td', { text: 'Nenhum registro encontrado.', colspan: 7 });
        Object.assign(td.style, { padding: '12px', textAlign: 'center' });
        tr.appendChild(td);
        tbody.appendChild(tr);
      }
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrap.appendChild(table);

    const footer = el('div', { class: 'modal-footer' });
    Object.assign(footer.style, { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' });
    const btnClose = el('button', { type: 'button', text: 'Fechar' });
    btnClose.addEventListener('click', () => modal.remove());
    footer.appendChild(btnClose);

    container.appendChild(header);
    container.appendChild(tableWrap);
    container.appendChild(footer);

    modal.appendChild(container);
    document.body.appendChild(modal);

    // estilos basicos para inputs e botões (isolado)
    const search = $('#reduto-search');
    if (search) {
      Object.assign(search.style, { width: '100%', padding: '8px 10px', margin: '10px 0 14px 0' });
      search.addEventListener('input', e => renderRows(e.target.value));
    }

    renderRows('');
  }

  // Inicializa lógica do formulário de cadastro (se existir)
  function initCadastroForm() {
    const form = $('#formCadastro');
    if (!form) return;

    // Migrate inline script: se houver script inline que atualiza o ano, deixamos como está (não removemos)
    // Aplica máscaras se masks.js não estiver presente
    if (!window.RedutoMasksApplied) applyMasksFallback();

    // criar aria-live region para mensagens
    if (!$('#reduto-live')) {
      const live = el('div', { id: 'reduto-live', 'aria-live': 'polite' });
      Object.assign(live.style, { position: 'absolute', left: '-9999px', top: 0, height: '1px', width: '1px', overflow: 'hidden' });
      document.body.appendChild(live);
    }

    // Ao perder foco do CEP, tenta preencher endereço
    const cepInput = $('#cep');
    if (cepInput) {
      cepInput.addEventListener('blur', async () => {
        const cepRaw = cepInput.value.replace(/\D/g, '');
        if (!cepRaw || cepRaw.length !== 8) return;
        const data = await buscarCepPreencher(cepRaw);
        if (!data) {
          showToast('CEP não encontrado ou inválido.', 'info');
          return;
        }
        // preenche campos se existirem
        if ($('#endereco')) $('#endereco').value = data.logradouro || $('#endereco').value || '';
        if ($('#cidade')) $('#cidade').value = data.localidade || $('#cidade').value || '';
        if ($('#estado')) $('#estado').value = data.uf || $('#estado').value || '';
        showToast('Endereço preenchido automaticamente pelo CEP.', 'info');
      });
    }

    // Submissão avançada
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      // validações extras
      const nome = form.nome.value.trim();
      const email = form.email.value.trim();
      const cpfVal = form.cpf ? form.cpf.value.trim() : '';
      const telefone = form.telefone ? form.telefone.value.trim() : '';

      if (!nome || nome.length < 2) {
        showToast('Nome inválido. Informe pelo menos 2 caracteres.', 'error');
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('E-mail inválido.', 'error');
        return;
      }
      if (cpfVal && !validarCPF(cpfVal)) {
        showToast('CPF inválido.', 'error');
        return;
      }

      // monta objeto
      const record = {
        nome,
        email,
        cpf: cpfVal,
        telefone,
        nascimento: form.nascimento ? form.nascimento.value : '',
        endereco: form.endereco ? form.endereco.value : '',
        cep: form.cep ? form.cep.value : '',
        cidade: form.cidade ? form.cidade.value : '',
        estado: form.estado ? form.estado.value : '',
        mensagem: form.mensagem ? form.mensagem.value : '',
        _created: new Date().toISOString()
      };

      const arr = loadCadastros();
      arr.unshift(record); // adiciona no começo
      saveCadastros(arr);

      // feedback
      showToast('Cadastro salvo localmente com sucesso!', 'success');

      // opcional: limpar formulário (mantive como padrão limpar)
      form.reset();

      // atualizar UI se tiver painel aberto
      const modal = $('#reduto-modal');
      if (modal) {
        modal.remove();
        openListModal();
      }

      // foco no nome para novo cadastro
      if ($('#nome')) $('#nome').focus();
    });
  }

  // Ao carregar: inicializa componentes se estiver em páginas relevantes
  document.addEventListener('DOMContentLoaded', () => {
    initCadastroForm();
    ensureControlPanel();
    // Aplica máscaras caso masks.js defina algo global
    // Se o seu masks.js define window.RedutoMasksApplied = true, não fará fallback.
    // Para compatibilidade, definimos um pequeno timeout para checar.
    setTimeout(() => {
      if (!window.RedutoMasksApplied) applyMasksFallback();
    }, 150);
  });

})();

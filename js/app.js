// === ROTEAMENTO ===
let rotaAtual = 'inicio';

function navegarPara(rota) {
  rotaAtual = rota;
  
  // Esconde todas as telas
  document.querySelectorAll('.tela').forEach(t => t.classList.add('oculta'));
  
  // Mostra a tela correta
  const tela = document.getElementById(`tela-${rota}`);
  if (tela) {
    tela.classList.remove('oculta');
  }
  
  // Atualiza botões do menu
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('ativo', btn.dataset.rota === rota);
  });
  
  // Atualiza título da máquina
  const tituloMaquina = document.getElementById('titulo-maquina');
  if (tituloMaquina) {
    tituloMaquina.textContent = document.getElementById('sel-maquina')?.value || 'HWS-01';
  }
  
  // Carrega dados se necessário
  if (rota === 'lancar') {
    carregarDadosForm();
  } else if (rota === 'registros') {
    carregarRegistros();
  }
}

// Trata mudança de hash
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#/', '') || 'inicio';
  navegarPara(hash);
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Abre tela inicial
  navegarPara('inicio');
  
  // Carrega dias sem acidente
  carregarDiasSemAcidente();
  
  // Registra service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
  
  // Trata clique em links do menu
  document.querySelectorAll('[data-rota]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navegarPara(link.dataset.rota);
      window.location.hash = '/' + link.dataset.rota;
    });
  });
});

// === DIAS SEM ACIDENTES ===
async function carregarDiasSemAcidente() {
  const dias = await dbUtils.obterParametro('dias_sem_acidente', 0);
  document.getElementById('dias-sem-acidente').textContent = dias;
}

async function salvarDiasSemAcidente() {
  const dias = parseInt(document.getElementById('inp-dias-sem-acidente').value, 10) || 0;
  await dbUtils.setParametro('dias_sem_acidente', dias);
  document.getElementById('dias-sem-acidente').textContent = dias;
  utils.mostrarToast(`Dias sem acidente atualizado: ${dias}`, 'sucesso');
}

// === LANÇAR DADOS ===
let linhaAtual = { maquina: 'HWS-01', data: null };

async function carregarDadosForm() {
  const maquina = document.getElementById('sel-maquina').value;
  const data = document.getElementById('inp-data-producao').value;
  
  linhaAtual = { maquina, data: data ? new Date(data) : null };
}

async function adicionarLinhaProducao() {
  const maquina = document.getElementById('sel-maquina').value;
  const dataInput = document.getElementById('inp-data-producao').value;
  
  if (!dataInput) {
    utils.toast('Selecione a data da produção');
    return;
  }
  
  const data = new Date(dataInput);
  const id = `${maquina}-${Date.now()}`;
  
  const novoItem = {
    id,
    maquina,
    data,
    item: '',
    qtdePeças: 0,
    dataFusao: '',
    absenteismo: ''
  };
  
  await dbUtils.salvarProducao(novoItem);
  atualizarTabelaProducao();
  utils.toast('Linha adicionada');
}

async function atualizarLinhaAtual() {
  // Atualiza a linha atual com os novos valores
  if (linhaAtual.id) {
    const dados = obterDadosFormulario();
    await dbUtils.salvarProducao({ ...linhaAtual, ...dados });
  }
}

function obterDadosFormulario() {
  return {
    item: document.getElementById('inp-item').value || '',
    qtdePeças: parseInt(document.getElementById('inp-qtde-pecas').value, 10) || 0,
    dataFusao: document.getElementById('inp-data-fusao').value || '',
    absenteismo: document.getElementById('inp-absenteismo').value || ''
  };
}

async function atualizarTabelaProducao() {
  const maquina = document.getElementById('sel-maquina').value;
  const producao = await dbUtils.buscarProducao(maquina);
  const tbody = document.getElementById('tbody-producao');
  
  tbody.innerHTML = '';
  
  producao.sort((a, b) => a.data - b.data).forEach(linha => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${linha.data ? utils.formatarData(linha.data) : ''}</td>
      <td>${linha.item || ''}</td>
      <td>${linha.qtdePeças || ''}</td>
      <td>${linha.dataFusao || ''}</td>
      <td>${linha.absenteismo || ''}</td>
      <td>
        <button class="btn-acao editar" onclick="editarLinhaProducao('${linha.id}')">✏️</button>
        <button class="btn-acao excluir" onclick="excluirLinhaProducao('${linha.id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function editarLinhaProducao(id) {
  const producao = await dbUtils.buscarProducao();
  const linha = producao.find(r => r.id === id);
  
  if (linha) {
    document.getElementById('inp-item').value = linha.item || '';
    document.getElementById('inp-qtde-pecas').value = linha.qtdePeças || '';
    document.getElementById('inp-data-fusao').value = linha.dataFusao || '';
    document.getElementById('inp-absenteismo').value = linha.absenteismo || '';
    
    utils.toast('Editando linha...');
  }
}

async function excluirLinhaProducao(id) {
  const confirmado = await utils.abrirModalConfirmar(
    'Excluir linha',
    'Tem certeza que deseja excluir esta linha?'
  );
  
  if (confirmado) {
    await dbUtils.excluirProducao(id);
    atualizarTabelaProducao();
    utils.toast('Linha excluída');
  }
}

// === REFUGOS ===
async function adicionarLinhaRefugo() {
  const maquina = document.getElementById('sel-maquina').value;
  const dataInput = document.getElementById('inp-data-producao').value;
  
  if (!dataInput) {
    utils.toast('Selecione a data');
    return;
  }
  
  const data = new Date(dataInput);
  const id = `refugo-${maquina}-${Date.now()}`;
  
  const novoRefugo = {
    id,
    maquina,
    data,
    item: '',
    qtdePeças: 0,
    dataFusao: '',
    motivo: ''
  };
  
  await dbUtils.salvarRefugo(novoRefugo);
  utils.toast('Refugo adicionado');
}

// === PARADAS ===
async function adicionarLinhaParada() {
  const maquina = document.getElementById('sel-maquina').value;
  const id = `parada-${Date.now()}`;
  
  const novoParada = {
    id,
    maquina,
    parada: '',
    tempo: '',
    motivo: ''
  };
  
  await dbUtils.salvarParada(novoParada);
  utils.toast('Parada adicionada');
}

// === REGISTROS ===
let abaAtual = 'producao';

function trocarAbaRegistros(aba) {
  abaAtual = aba;
  
  document.querySelectorAll('.aba-btn').forEach(btn => {
    btn.classList.toggle('ativo', btn.dataset.aba === aba);
  });
  
  // Atualiza cabeçalhos e dados
  renderizarTabelaRegistros();
}

async function renderizarTabelaRegistros() {
  const tbody = document.getElementById('tbody-registros');
  const thead = document.getElementById('thead-registros');
  const filtroMaquina = document.getElementById('filtro-maquina').value;
  const filtroDataIni = document.getElementById('filtro-data-inicio').value;
  const filtroDataFim = document.getElementById('filtro-data-fim').value;
  
  let dados = [];
  
  if (abaAtual === 'producao') {
    const todas = await dbUtils.buscarProducao();
    dados = aplicarFiltros(todas, filtroMaquina, filtroDataIni, filtroDataFim);
  } else if (abaAtual === 'refugo') {
    const todos = await dbUtils.buscarRefugos();
    dados = aplicarFiltros(todos, filtroMaquina, filtroDataIni, filtroDataFim);
  } else if (abaAtual === 'paradas') {
    const todas = await dbUtils.buscarParadas();
    dados = aplicarFiltros(todas, filtroMaquina);
  }
  
  // Atualiza cabeçalho
  const headers = {
    producao: ['Data', 'Item', 'Qtde Peças', 'Data Fusão', 'Absenteísmo'],
    refugos: ['Data', 'Item', 'Qtde Peças', 'Data Fusão', 'Motivo'],
    paradas: ['Parada', 'Tempo', 'Motivo'],
    aramados: ['Quantidade'],
    caixas: ['Quantidade']
  };
  
  thead.innerHTML = '<tr>' + headers[abaAtual].map(h => `<th>${h}</th>`).join('') + '</tr>';
  
  // Atualiza corpo
  tbody.innerHTML = '';
  dados.forEach(linha => {
    const tr = document.createElement('tr');
    if (abaAtual === 'producao' || abaAtual === 'refugo') {
      const cells = [linha.data, linha.item, linha.qtdePeças, linha.dataFusao, linha.motivo || linha.absenteismo || ''];
      tr.innerHTML = cells.map(c => `<td>${c || ''}</td>`).join('');
    } else if (abaAtual === 'paradas') {
      tr.innerHTML = `<td>${linha.parada || ''}</td><td>${linha.tempo || ''}</td><td>${linha.motivo || ''}</td>`;
    }
    tbody.appendChild(tr);
  });
  
  atualizarResumoRegistros(dados);
}

function aplicarFiltros(dados, maquina, dataIni, dataFim) {
  return dados.filter(r => {
    if (maquina && r.maquina !== maquina) return false;
    if (dataIni && r.data) {
      const d = new Date(r.data);
      if (d < new Date(dataIni)) return false;
    }
    if (dataFim && r.data) {
      const d = new Date(r.data);
      if (d > new Date(dataFim)) return false;
    }
    return true;
  });
}

function atualizarResumoRegistros(dados) {
  const resumo = document.getElementById('resumo-registros');
  const totalPeças = dados.reduce((s, r) => s + (r.qtdePeças || 0), 0);
  const totalRefugo = datos.filter(r => r.motivo).length;
  
  resumo.innerHTML = `<p>Total de itens: ${dados.length} | Peças: ${totalPeças}</p>`;
}

async function aplicarFiltros() {
  renderizarTabelaRegistros();
}

// === EXPORTAR ===
async function gerarExcel() {
  return await exportUtils.gerarExcel();
}

async function baixarExcel() {
  exportUtils.baixarExcel();
}

async function compartilharArquivo() {
  // Tenta Web Share ou abre janela de compartilhamento
  if (navigator.share && arquivoExcelBlob) {
    const arquivo = new File([arquivoExcelBlob], 'planilha.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    try {
      await navigator.share({
        title: 'Planilha QMS Quebra',
        text: 'Planilha de produção diária da Quebra de Canais e Jato - 2º Turno',
        files: [arquivo]
      });
    } catch (e) {
      showShareModal();
    }
  } else {
    showShareModal();
  }
}

let arquivoExcelBlob = null;

function showShareModal() {
  if (!arquivoExcelBlob) return;
  
  const janela = window.open('', 'Compartilhar', 'width=500,height=600');
  janela.document.write(`
    <!DOCTYPE html>
    <html>
    <head><title>Compartilhar Planilha</title>
    <style>
      body { font-family: Arial; padding: 20px; text-align: center; }
      .btn { margin: 10px; padding: 15px 30px; background: #06284f; color: white; border: none; cursor: pointer; }
      .btn:hover { background: #044; }
    </style>
    </head>
    <body>
      <h3>Compartilhar Planilha</h3>
      <p>Tamanho: ${Math.round(arquivoExcelBlob.size/1024)} KB</p>
      <button class="btn" onclick="shareEmail()">📧 E-mail</button>
      <button class="btn" onclick="shareWhatsApp()">💬 WhatsApp</button>
      <button class="btn" onclick="window.close()">Fechar</button>
      <script>
        function downloadFile() {
          const url = URL.createObjectURL(${btoa(String.fromCharCode(...new Uint8Array(arquivoExcelBlob)))});
          const a = document.createElement('a');
          a.href = url;
          a.download = 'Itens_Quebra_2026_2º_Turno_PREENCHIDO.xlsx';
          a.click();
          URL.revokeObjectURL(url);
        }
        function shareEmail() {
          downloadFile();
          const subject = encodeURIComponent('Planilha QMS Quebra - Produção Diária');
          const body = encodeURIComponent('Segue a planilha de produção.\\n\\nAcesso via download.');
          window.open('mailto:?' + subject + '&body=' + body, '_blank');
        }
        function shareWhatsApp() {
          const msg = encodeURIComponent('Segue a planilha de produção da Quebra de Canais e Jato.\\nBaixe no anexo.');
          window.open('https://wa.me/?' + msg, '_blank');
        }
      </script>
    </body>
    </html>
  `);
}

// === AJUSTES ===
async function carregarAjustes() {
  const dias = await dbUtils.obterParametro('dias_sem_acidente', 0);
  document.getElementById('inp-dias-sem-acidente').value = dias;
}

// === LIMPAR DADOS ===
async function confirmarLimparTudo() {
  const confirmado = await utils.abrirModalConfirmar(
    'Apagar tudo?',
    'Isso apagará todos os registros do aparelho. Continuar?'
  );
  
  if (confirmado) {
    await dbUtils.zerarDados();
    utils.toast('Todos os dados foram apagados');
    if (rotaAtual === 'lancar') atualizarTabelaProducao();
    if (rotaAtual === 'registros') renderizarTabelaRegistros();
  }
}

// Exportar para uso global
window.app = {
  navegarPara,
  carregarDiasSemAcidente,
  salvarDiasSemAcidente,
  adicionarLinhaProducao,
  atualizarTabelaProducao,
  adicionarLinhaRefugo,
  adicionarLinhaParada,
  renderizarTabelaRegistros,
  aplicarFiltros,
  trocarAbaRegistros,
  gerarExcel,
  baixarExcel,
  compartilharArquivo,
  carregarAjustes,
  confirmarLimparTudo
};
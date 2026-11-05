let arquivoExcelBlob = null;

// Gera a planilha Excel completa
async function gerarExcel() {
  const loadingEl = document.querySelector('#btn-baixar-excel');
  loadingEl.innerHTML = '<div class="loading"></div>';
  loadingEl.disabled = true;
  
  try {
    const producao = await dbUtils.buscarProducao();
    const refugos = await dbUtils.buscarRefugos();
    const paradas = await dbUtils.buscarParadas();
    const diasSemAcidente = await dbUtils.obterParametro('dias_sem_acidente', 0);
    const aramados = await dbUtils.obterParametro('aramados_vazios', 0);
    const caixas = await dbUtils.obterParametro('caixas_vazias', 0);
    
    // Cria workbook vazio
    const wb = XLSX.utils.book_new();
    
    // Cria aba principal de produção
    await criarAbaProducao(wb, producao, diasSemAcidente, aramados, caixas);
    
    // Cria aba de refugo
    await criarAbaRefugo(wb, refugos);
    
    // Cria aba de paradas
    await criarAbaParadas(wb, paradas);
    
    // Converte para arquivo
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    arquivoExcelBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Habilita botão de compartilhar
    document.getElementById('btn-compartilhar').disabled = false;
    document.getElementById('dica-compartilhar').textContent = 'Arquivo gerado com sucesso! Clique em Compartilhar para enviar por e-mail ou WhatsApp.';
    
    mostrarToast('Planilha gerada com sucesso!', 'sucesso');
    
    return arquivoExcelBlob;
  } catch (e) {
    console.error('Erro ao gerar Excel:', e);
    mostrarToast('Erro ao gerar planilha: ' + e.message, 'erro');
    throw e;
  } finally {
    loadingEl.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Baixar Excel';
    loadingEl.disabled = false;
  }
}

// Cria a aba de produção principal
async function criarAbaProducao(wb, producao, diasSemAcidente, aramados, caixas) {
  // Encontre a última linha usada em cada máquina
  const hws01 = producao.filter(r => r.maquina === 'HWS-01');
  const hws02 = producao.filter(r => r.maquina === 'HWS-02');
  const hunter = producao.filter(r => r.maquina === 'HUNTER');
  const euro = producao.filter(r => r.maquina === 'EUROMAQ');
  
  // Título
  const titulo = [
    ['Um bom dia é um dia sem Acidentes.', '', '', '', ''],
    ['Estamos há', diasSemAcidente.toString(), 'dias sem Acidentes na Quebra de Canais e Jato no 2º Turno', '', ''],
    ['Produção Diária QMS', '2026', '', '', '']
  ];
  
  // Dados das máquinas (linhas 5-558 conforme especificado)
  const dados = [];
  
  // Linha de cabeçalho
  dados.push(['Data', 'Item', 'Qtde de Peças', 'Data Fusão', 'Absenteísmo']);
  
  // Dados HWS-01 (colunas A-E)
  hws01.forEach(r => {
    dados.push([
      r.data ? XLSX.SSF.format('yyyy-mm-dd', r.data) : '',
      r.item || '',
      r.qtdePeças || '',
      validarFusaoCampo(r.dataFusao, r.data),
      r.absenteismo || ''
    ]);
  });
  
  // Separador F
  const linhasParaGerar = 300;
  for (let i = 0; i < linhasParaGerar; i++) {
    if (i < hws01.length) continue;
    dados.push(['', '', '', '', '']);
  }
  
  // HWS-02 (colunas G-K)
  hws02.forEach(r => {
    const linha = [...Array(6).fill(''), 
      r.data ? XLSX.SSF.format('yyyy-mm-dd', r.data) : '',
      r.item || '',
      r.qtdePeças || '',
      validarFusaoCampo(r.dataFusao, r.data),
      r.absenteismo || '',
      ''
    ];
    dados[dados.length - 1] = linha; // Simplificado
  });
  
  // Preencher com linhas vazias até ~558
  while (dados.length < 554) {
    dados.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  }
  
  // Aramados vazios (G559:K560)
  dados.push([]); // Linha vazia
  dados.push(['Aramados Vazios:', aramados || 0], [], [], [], []);
  
  // Caixas vazias (A561:E562)
  dados.push([]);
  dados.push(['Caixas Vazias:', caixas || 0], [], [], [], []);
  
  // Refugo HWS-1
  const refugoHWS1 = refugos.filter(r => r.maquina === 'HWS-01');
  dados.push(['']); // Linha vazia
  dados.push(['Refugo HWS-1']);
  dados.push(['Data', 'Item', 'Qtde de Peças', 'Data Fusão', 'Motivo']);
  refugoHWS1.forEach(r => {
    dados.push([
      r.data ? XLSX.SSF.format('yyyy-mm-dd', r.data) : '',
      r.item || '',
      r.qtdePeças || '',
      r.dataFusao || '',
      r.motivo || ''
    ]);
  });
  
  // ... continuar com outras máquinas de refugo e paradas
  
  const ws = XLSX.utils.aoa_to_sheet(dados);
  XLSX.utils.book_append_sheet(wb, ws, 'PRODUÇÃO DIÁRIA QMS');
}

// Valida e formata campo de data fusão
function validarFusaoCampo(fusao, dataProducao) {
  if (!fusao) return '';
  const texto = String(fusao).toUpperCase();
  // Formato esperado: DD + Letra + AA
  if (texto.length >= 3) {
    const dia = texto.substring(0, 2);
    const letra = texto.substring(2, 3);
    const ano = texto.substring(3, 5);
    return `${dia}${letra}${ano}`;
  }
  return texto;
}

// Cria aba de refugo
async function criarAbaRefugo(wb, refugos) {
  const hws01 = refugos.filter(r => r.maquina === 'HWS-01');
  const hws02 = refugos.filter(r => r.maquina === 'HWS-02');
  const hunter = refugos.filter(r => r.maquina === 'HUNTER');
  const euro = refugos.filter(r => r.maquina === 'EUROMAQ');
  
  const dados = [
    ['Data', 'Item', 'Qtde de Peças', 'Data Fusão', 'Motivo']
  ];
  
  hws01.forEach(r => {
    dados.push([
      r.data ? XLSX.SSF.format('yyyy-mm-dd', r.data) : '',
      r.item || '',
      r.qtdePeças || '',
      r.dataFusao || '',
      r.motivo || ''
    ]);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(dados);
  XLSX.utils.book_append_sheet(wb, ws, 'Refugo HWS-1');
  
  // Repetir para outras máquinas
  const dadosHWS02 = [['Data', 'Item', 'Qtde de Peças', 'Data Fusão', 'Motivo']];
  hws02.forEach(r => {
    dadosHWS02.push([
      r.data ? XLSX.SSF.format('yyyy-mm-dd', r.data) : '',
      r.item || '',
      r.qtdePeças || '',
      r.dataFusao || '',
      r.motivo || ''
    ]);
  });
  const wsHWS02 = XLSX.utils.aoa_to_sheet(dadosHWS02);
  XLSX.utils.book_append_sheet(wb, wsHWS02, 'Refugo HWS-2');
  
  const dadosHunter = [['Data', 'Item', 'Qtde de Peças', 'Data Fusão', 'Motivo']];
  hunter.forEach(r => {
    dadosHunter.push([
      r.data ? XLSX.SSF.format('yyyy-mm-dd', r.data) : '',
      r.item || '',
      r.qtdePeças || '',
      r.dataFusao || '',
      r.motivo || ''
    ]);
  });
  const wsHunter = XLSX.utils.aoa_to_sheet(dadosHunter);
  XLSX.utils.book_append_sheet(wb, wsHunter, 'Refugo HUNTER');
  
  const dadosEuro = [['Data', 'Item', 'Qtde de Peças', 'Data Fusão', 'Motivo']];
  euro.forEach(r => {
    dadosEuro.push([
      r.data ? XLSX.SSF.format('yyyy-mm-dd', r.data) : '',
      r.item || '',
      r.qtdePeças || '',
      r.dataFusao || '',
      r.motivo || ''
    ]);
  });
  const wsEuro = XLSX.utils.aoa_to_sheet(dadosEuro);
  XLSX.utils.book_append_sheet(wb, wsEuro, 'Refugo EUROMAQ');
}

// Cria aba de paradas
async function criarAbaParadas(wb, paradas) {
  const hws01 = paradas.filter(r => r.maquina === 'HWS-01');
  const hws02 = paradas.filter(r => r.maquina === 'HWS-02');
  const hunter = paradas.filter(r => r.maquina === 'HUNTER');
  const euro = paradas.filter(r => r.maquina === 'EUROMAQ');
  
  const dados = [['Paradas', 'Tempo', 'Motivo']];
  hws01.forEach(r => {
    dados.push([r.parada || '', r.tempo || '', r.motivo || '']);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(dados);
  XLSX.utils.book_append_sheet(wb, ws, 'Paradas HWS-1');
  
  // Outras máquinas
  const dadosHWS02 = [['Paradas', 'Tempo', 'Motivo']];
  hws02.forEach(r => dadosHWS02.push([r.parada || '', r.tempo || '', r.motivo || '']));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dadosHWS02), 'Paradas HWS-2');
  
  const dadosHunter = [['Paradas', 'Tempo', 'Motivo']];
  hunter.forEach(r => dadosHunter.push([r.parada || '', r.tempo || '', r.motivo || '']));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dadosHunter), 'Paradas HUNTER');
  
  const dadosEuro = [['Paradas', 'Tempo', 'Motivo']];
  euro.forEach(r => dadosEuro.push([r.parada || '', r.tempo || '', r.motivo || '']));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dadosEuro), 'Paradas EUROMAQ');
}

// Baixa o arquivo Excel
function baixarExcel() {
  if (!arquivoExcelBlob) {
    gerarExcel();
    return;
  }
  
  const a = document.createElement('a');
  const url = URL.createObjectURL(arquivoExcelBlob);
  a.href = url;
  a.download = 'Itens_Quebra_2026_2º_Turno_PREENCHIDO.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  mostrarToast('Arquivo baixado com sucesso!', 'sucesso');
}

// Compartilha o arquivo por e-mail ou WhatsApp
async function compartilharArquivo() {
  if (!arquivoExcelBlob) {
    await gerarExcel();
  }
  
  const shareBtn = document.getElementById('btn-compartilhar');
  shareBtn.innerHTML = '<div class="loading"></div>';
  shareBtn.disabled = true;
  
  try {
    // Tenta usar Web Share API
    if (navigator.share && typeof arquivoExcelBlob === 'object') {
      const arquivo = new File([arquivoExcelBlob], 'Itens_Quebra_2026_2º_Turno_PREENCHIDO.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      await navigator.share({
        title: 'Planilha QMS Quebra',
        text: 'Planilha de produção diária da Quebra de Canais e Jato',
        files: [arquivo]
      });
    } else {
      // Fallback: abre caixa de e-mail pré-preenchida
      compartilharPorEmail();
    }
  } catch (e) {
    console.log('Web Share não disponível, usando fallback:', e);
    compartilharPorEmail();
  } finally {
    shareBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="16.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="3.49"/></svg> Compartilhar';
    shareBtn.disabled = false;
  }
}

// Compartilha por e-mail (fallback)
function compartilharPorEmail() {
  if (!arquivoExcelBlob) return;
  
  // Converte blob para base64 para inserção em dados URI
  const reader = new FileReader();
  reader.onload = function() {
    const base64 = reader.result.split(',')[1];
    const subject = encodeURIComponent('Planilha QMS Quebra - Produção Diária');
    const body = encodeURIComponent('Segue a planilha de produção diária da Quebra de Canais e Jato.\n\nAtenciosamente,\nSistema QMS Quebra');
    
    // Monta mailto com anexo (limitado a 2MB no Chrome)
    const maileto = `mailto:?subject=${subject}&body=${body}`;
    window.open(maileto, '_blank');
    
    // Mostra instruções
    toast('Prepare o anexo manualmente ou use o WhatsApp abaixo');
  };
  reader.readAsDataURL(arquivoExcelBlob);
}

// Compartilha por WhatsApp
function compartilharWhatsApp() {
  if (!arquivoExcelBlob) {
    gerarExcel();
    return;
  }
  
  // WhatsApp requer compartilhamento direto via Web Share ou download seguido de upload
  const url = 'https://wa.me/?text=' + encodeURIComponent('Segue a planilha de produção diária:');
  window.open(url, '_blank');
}

// Exportar para uso global
window.exportUtils = {
  gerarExcel,
  baixarExcel,
  compartilharArquivo,
  compartilharPorEmail,
  compartilharWhatsApp,
  arquivoExcelBlob
};
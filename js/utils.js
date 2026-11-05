const MESES_LETRAS = {
  '01': 'A', '02': 'B', '03': 'C', '04': 'D', '05': 'E', '06': 'F',
  '07': 'G', '08': 'H', '09': 'I', '10': 'J', '11': 'K', '12': 'L'
};

const LETRAS_MES = {
  'A': 'Janeiro', 'B': 'Fevereiro', 'C': 'Março', 'D': 'Abril',
  'E': 'Maio', 'F': 'Junho', 'G': 'Julho', 'H': 'Agosto',
  'I': 'Setembro', 'J': 'Outubro', 'K': 'Novembro', 'L': 'Dezembro'
};

// Converte data real para formato DD+Letra+AA
function dataParaFusao(data) {
  if (!data) return '';
  const d = String(data.getDate()).padStart(2, '0');
  const m = MESES_LETRAS[String(date.getMonth() + 1).padStart(2, '0')];
  const a = String(data.getFullYear()).slice(-2);
  return `${d}${m}${a}`;
}

// Converte formato DD+Letra+AA para data real
function fusaoParaData(fusao) {
  if (!fusao || fusao.length < 3) return null;
  
  const dia = fusao.substring(0, 2);
  const letra = fusao.substring(2, 3).toUpperCase();
  const ano = fusao.substring(3, 5);
  
  const mes = Object.keys(LETRAS_MES).find(k => LETRAS_MES[k] === letra);
  if (!mes) return null;
  
  const anoFull = parseInt('20' + ano, 10);
  return new Date(anoFull, parseInt(mes, 10) - 1, parseInt(dia, 10));
}

// Valida e converte data de produção (deve ser 2026)
function validarDataProducao(dataStr) {
  if (!dataStr) return null;
  const data = new Date(dataStr);
  if (data.getFullYear() !== 2026) return null;
  if (isNaN(data.getTime())) return null;
  return data;
}

// Verifica se data de fusão é posterior à data de produção
function isFusaoPoserior(fusao, dataProducao) {
  if (!fusao || !dataProducao) return false;
  const dataFusao = fusaoParaData(fusao);
  if (!dataFusao) return false;
  return dataFusao > dataProducao;
}

// Formata data para exibição
function formatarData(data) {
  if (!data) return '';
  return data.toISOString().split('T')[0];
}

// Formata data para exibição curta
function formatarDataCurta(data) {
  if (!data) return '';
  const d = data.getDate();
  const m = data.getMonth() + 1;
  const a = data.getFullYear();
  return `${d}/${m}/${a}`;
}

// Calcula tempo entre duas datas em minutos
function calcularDiferencaMinutos(data1, data2) {
  return Math.abs(Math.floor((data2 - data1) / (1000 * 60)));
}

// Converte minutos para string legível (h e min)
function minutosParaString(minutos) {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  if (mins === 0) return `${horas} h`;
  return `${horas} h ${mins} min`;
}

// Limpa e valida texto (remove espaços extras)
function limparTexto(texto) {
  if (!texto) return '';
  return texto.trim().replace(/\s+/g, ' ');
}

// Valida item (aceita qualquer valor)
function validarItem(item) {
  return limparTexto(item);
}

// Valida quantidade
function validarQuantidade(qtde) {
  const num = parseInt(qtde, 10);
  return isNaN(num) || num < 0 ? 0 : num;
}

// Valida data de fusão livre
function validarFusaoLivre(fusao) {
  if (!fusao) return '';
  // Aceita qualquer texto no formato
  return limparTexto(fusao).toUpperCase();
}

// Valida absenteísmo
function validarAbsentismo(nomes) {
  if (!nomes) return '';
  const lista = nomes.split(',')
    .map(n => limparTexto(n))
    .filter(n => n.length > 0)
    .join(', ');
  return lista;
}

// Valida motivo
function validarMotivo(motivo) {
  const texto = limparTexto(motivo);
  // Máximo 100 caracteres
  return texto.substring(0, 100);
}

// Formata nome arquivo com data
function gerarNomeArquivo() {
  const hoje = new Date();
  const d = String(hoje.getDate()).padStart(2, '0');
  const m = String(hoje.getMonth() + 1).padStart(2, '0');
  const a = hoje.getFullYear();
  return `Itens_Quebra_${a}_${d}${m}.xlsx`;
}

// Notificação de dados salvos
function mostrarToast(mensagem, tipo = 'sucesso') {
  const toastEl = document.getElementById('toast-mensagem');
  const modal = document.getElementById('modal-toast');
  
  toastEl.textContent = mensagem;
  modal.className = tipo === 'erro' ? 'modal oculta toast-erro' : 'modal oculta toast-sucesso';
  
  setTimeout(() => {
    modal.classList.remove('oculta');
  }, 100);
  
  setTimeout(() => {
    modal.classList.add('oculta');
  }, 3000);
}

// Abre modal de confirmação
function abrirModalConfirmar(titulo, mensagem, onConfirm) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal-confirmar');
    const tituloEl = document.getElementById('modal-titulo');
    const mensagemEl = document.getElementById('modal-mensagem');
    const btnConfirmar = document.getElementById('btn-modal-confirmar');
    
    tituloEl.textContent = titulo;
    mensagemEl.textContent = mensagem;
    modal.classList.remove('oculta');
    
    const fechar = () => {
      modal.classList.add('oculta');
      resolve(false);
    };
    
    btnConfirmar.onclick = async () => {
      modal.classList.add('oculta');
      if (onConfirm) await onConfirm();
      resolve(true);
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) fechar();
    };
  });
}

// Toast para feedback rápido
function toast(mensagem, duracao = 3000) {
  const toastContainer = document.getElementById('toasts');
  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.textContent = mensagem;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, duracao);
}

// Exportar para uso global
window.utils = {
  dataParaFusao,
  fusaoParaData,
  validarDataProducao,
  isFusaoPoserior,
  formatarData,
  formatarDataCurta,
  calcularDiferencaMinutos,
  minutosParaString,
  limparTexto,
  validarItem,
  validarQuantidade,
  validarFusaoLivre,
  validarAbsentismo,
  validarMotivo,
  gerarNomeArquivo,
  mostrarToast,
  abrirModalConfirmar,
  toast,
  MESES_LETRAS,
  LETRAS_MES
};
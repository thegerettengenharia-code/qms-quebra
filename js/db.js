const DB_NAME = 'qms-quebra-db';
const DB_VERSION = 1;
const STORES = {
  PRODUCAO: 'producao',
  REFUGOS: 'refugos',
  PARADAS: 'paradas',
  PARAMETROS: 'parametros'
};

let db;

function abrirBD() {
  return new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(DB_NAME, DB_VERSION);
    
    requisicao.onerror = () => reject(requisicao.error);
    requisicao.onsuccess = () => {
      db = requisicao.result;
      resolve(db);
    };
    
    requisicao.onupgradeneeded = (event) => {
      const bd = event.target.result;
      
      if (!bd.objectStoreNames.contains(STORES.PRODUCAO)) {
        const store = bd.createObjectStore(STORES.PRODUCAO, { keyPath: 'id' });
        store.createIndex('porMaquinaData', 'maquina_data', { unique: true });
        store.createIndex('porMaquina', 'maquina');
        store.createIndex('porData', 'data');
      }
      
      if (!bd.objectStoreNames.contains(STORES.REFUGOS)) {
        const store = bd.createObjectStore(STORES.REFUGOS, { keyPath: 'id' });
        store.createIndex('porMaquinaData', 'maquina_data', { unique: true });
        store.createIndex('porMaquina', 'maquina');
      }
      
      if (!bd.objectStoreNames.contains(STORES.PARADAS)) {
        const store = bd.createObjectStore(STORES.PARADAS, { keyPath: 'id' });
        store.createIndex('porMaquina', 'maquina');
      }
      
      if (!bd.objectStoreNames.contains(STORES.PARAMETROS)) {
        bd.createObjectStore(STORES.PARAMETROS, { keyPath: 'chave' });
      }
    };
  });
}

async function salvarProducao(registro) {
  await abrirBD();
  return new Promise((resolve, reject) => {
    const transacao = db.transaction(STORES.PRODUCAO, 'readwrite');
    const store = transacao.objectStore(STORES.PRODUCAO);
    const requisicao = store.add(registro);
    
    requisicao.onsuccess = () => {
      dispararEventoSalvo();
      resolve(requisicao.result);
    };
    requisicao.onerror = () => reject(requisicao.error);
  });
}

async function buscarProducao(maquina = null, dataIni = null, dataFim = null) {
  await abrirBD();
  return new Promise((resolve, reject) => {
    const transacao = db.transaction(STORES.PRODUCAO, 'readonly');
    const store = transacao.objectStore(STORES.PRODUCAO);
    
    let requisicao;
    if (maquina) {
      requisicao = store.index('porMaquina').getAll(IDBKeyRange.only(maquina));
    } else {
      requisicao = store.getAll();
    }
    
    requisicao.onsuccess = () => {
      let resultados = requisicao.result;
      
      if (dataIni) {
        resultados = resultados.filter(r => r.data && new Date(r.data) >= new Date(dataIni));
      }
      if (dataFim) {
        resultados = resultados.filter(r => r.data && new Date(r.data) <= new Date(dataFim));
      }
      
      resolve(resultados);
    };
    requisicao.onerror = () => reject(requisicao.error);
  });
}

async function excluirProducao(id) {
  await abrirBD();
  return new Promise((resolve, reject) => {
    const transacao = db.transaction(STORES.PRODUCAO, 'readwrite');
    const store = transacao.objectStore(STORES.PRODUCAO);
    const requisicao = store.delete(id);
    
    requisicao.onsuccess = () => {
      dispararEventoSalvo();
      resolve();
    };
    requisicao.onerror = () => reject(requisicao.error);
  });
}

async function salvarRefugo(registro) {
  await abrirBD();
  return new Promise((resolve, reject) => {
    const transacao = db.transaction(STORES.REFUGOS, 'readwrite');
    const store = transacao.objectStore(STORES.REFUGOS);
    const requisicao = store.add(registro);
    
    requisicao.onsuccess = () => {
      dispararEventoSalvo();
      resolve(requisicao.result);
    };
    requisicao.onerror = () => reject(requisicao.error);
  });
}

async function buscarRefugos(maquina = null) {
  await abrirBD();
  return new Promise((resolve, reject) => {
    const transacao = db.transaction(STORES.REFUGOS, 'readonly');
    const store = transacao.objectStore(STORES.REFUGOS);
    
    const requisicao = maquina 
      ? store.index('porMaquina').getAll(IDBKeyRange.only(maquina))
      : store.getAll();
    
    requisicao.onsuccess = () => resolve(requisicao.result);
    requisicao.onerror = () => reject(requisicao.error);
  });
}

async function salvarParada(registro) {
  await abrirBD();
  return new Promise((resolve, reject) => {
    const transacao = db.transaction(STORES.PARADAS, 'readwrite');
    const store = transacao.objectStore(STORES.PARADAS);
    const requisicao = store.add(registro);
    
    requisicao.onsuccess = () => {
      dispararEventoSalvo();
      resolve(requisicao.result);
    };
    requisicao.onerror = () => reject(requisicao.error);
  });
}

async function buscarParadas(maquina = null) {
  await abrirBD();
  return new Promise((resolve, reject) => {
    const transacao = db.transaction(STORES.PARADAS, 'readonly');
    const store = transacao.objectStore(STORES.PARADAS);
    
    const requisicao = maquina
      ? store.index('porMaquina').getAll(IDBKeyRange.only(maquina))
      : store.getAll();
    
    requisicao.onsuccess = () => resolve(requisicao.result);
    requisicao.onerror = () => reject(requisicao.error);
  });
}

async function obterParametro(chave, valorPadrao = null) {
  await abrirBD();
  return new Promise((resolve, reject) => {
    const transacao = db.transaction(STORES.PARAMETROS, 'readonly');
    const store = transacao.objectStore(STORES.PARAMETROS);
    const requisicao = store.get(chave);
    
    requisicao.onsuccess = () => {
      resolve(requisicao.result ? requisicao.result.valor : valorPadrao);
    };
    requisicao.onerror = () => reject(requisicao.error);
  });
}

async function setParametro(chave, valor) {
  await abrirBD();
  return new Promise((resolve, reject) => {
    const transacao = db.transaction(STORES.PARAMETROS, 'readwrite');
    const store = transacao.objectStore(STORES.PARAMETROS);
    const requisicao = store.put({ chave, valor });
    
    requisicao.onsuccess = () => resolve();
    requisicao.onerror = () => reject(requisicao.error);
  });
}

function dispararEventoSalvo() {
  const evento = new CustomEvent('dadosSalvos');
  window.dispatchEvent(evento);
}

async function zerarDados() {
  await abrirBD();
  return new Promise((resolve, reject) => {
    const transacao = db.transaction([STORES.PRODUCAO, STORES.REFUGOS, STORES.PARADAS], 'readwrite');
    
    const store1 = transacao.objectStore(STORES.PRODUCAO);
    const store2 = transacao.objectStore(STORES.REFUGOS);
    const store3 = transacao.objectStore(STORES.PARADAS);
    
    store1.clear();
    store2.clear();
    store3.clear();
    
    transacao.oncomplete = () => resolve();
    transacao.onerror = () => reject(transacao.error);
  });
}

// Exportar para uso global
window.dbUtils = {
  abrirBD,
  salvarProducao,
  buscarProducao,
  excluirProducao,
  salvarRefugo,
  buscarRefugos,
  salvarParada,
  buscarParadas,
  obterParametro,
  setParametro,
  zerarDados
};
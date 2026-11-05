// Compartilhamento por e-mail e WhatsApp
async function compartilharPorEmail() {
  if (!exportUtils.arquivoExcelBlob) {
    await exportUtils.gerarExcel();
  }
  
  const blob = exportUtils.arquivoExcelBlob;
  const reader = new FileReader();
  
  reader.onload = function() {
    const base64 = reader.result.split(',')[1];
    const subject = encodeURIComponent('Planilha QMS Quebra - Produção Diária 2026');
    const body = encodeURIComponent(
      'Prezado(a),\n\nSegue em anexo a planilha de produção diária da Quebra de Canais e Jato - 2º Turno.\n\nAtenciosamente,\nSistema QMS Quebra'
    );
    
    // Cria um formulário temporário para upload
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://formspree.io/f/your-form-id'; // Precisa configurar
    form.target = '_blank';
    
    // Alternativa: usar dados para compartilhamento
    const dados = {
      subject: decodeURIComponent(subject),
      body: decodeURIComponent(body),
      filename: 'Itens_Quebra_2026_2º_Turno_PREENCHIDO.xlsx'
    };
    
    // Abre janela de compartilhamento
    const janela = window.open('', '_blank', 'width=600,height=700');
    
    janela.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Compartilhar Planilha</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; }
          .btn { padding: 10px 20px; margin: 5px; background: #06284f; color: white; border: none; cursor: pointer; }
          .btn:hover { background: #044; }
          .file-info { margin: 10px 0; padding: 10px; background: #f0f0f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Compartilhar Planilha QMS Quebra</h2>
          <p>Planilha gerada com sucesso!</p>
          <div class="file-info">
            <strong>Arquivo:</strong> Itens_Quebra_2026_2º_Turno_PREENCHIDO.xlsx<br>
            <strong>Tamanho:</strong> ${Math.round(blob.size / 1024)} KB
          </div>
          <button class="btn" onclick="compartilharEmail()">Compartilhar por E-mail</button>
          <button class="btn" onclick="compartilharWhatsApp()">Compartilhar por WhatsApp</button>
          <button class="btn" onclick="baixarExcel()">Baixar Novamente</button>
          <button class="btn" onclick="window.close()">Fechar</button>
          <script>
            function baixarExcel() {
              const url = URL.createObjectURL(${btoa(arrayBufferToBase64(blob))});
              const a = document.createElement('a');
              a.href = url;
              a.download = 'Itens_Quebra_2026_2º_Turno_PREENCHIDO.xlsx';
              a.click();
              URL.revokeObjectURL(url);
            }
            
            function compartilharEmail() {
              const subject = decodeURIComponent('${subject}');
              const body = decodeURIComponent('${body}');
              window.open('mailto:?subject=' + encodeURIComponent(subject) + '&body=' + body, '_blank');
            }
            
            function compartilharWhatsApp() {
              const text = encodeURIComponent('Segue a planilha de produção: \\n\\n' + subject);
              window.open('https://wa.me/?text=' + text, '_blank');
            }
            
            function arrayBufferToBase64(buffer) {
              return btoa(String.fromCharCode(...new Uint8Array(buffer)));
            }
          </script>
        </div>
      </body>
      </html>
    `);
  };
  
  reader.readAsArrayBuffer(blob);
}

// Compartilha pelo WhatsApp
function compartilharWhatsApp() {
  if (!exportUtils.arquivoExcelBlob) return;
  
  const mensagem = encodeURIComponent(
    'Segue a planilha de produção diária da Quebra de Canais e Jato - 2º Turno.\n\n' +
    'Baixe e preencha conforme necessário.'
  );
  
  // URL do WhatsApp (sem número específico - usuário escolhe contato)
  const linkWa = `https://wa.me/?text=${mensagem}`;
  window.open(linkWa, '_blank');
}

// Exportar globalmente
window.shareUtils = {
  compartilharPorEmail,
  compartilharWhatsApp
};
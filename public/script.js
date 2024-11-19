// Função para preencher o select com dados da tabela
function preencherSelect(tabela, selectIds) {
    fetch(`/${tabela}`)
        .then(response => response.json())
        .then(data => {
            selectIds.forEach(selectId => {
                const select = document.getElementById(selectId);
                data.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.text = `${item.detalhe}`;
                    select.add(option);
                });
            });
        })
        .catch(error => console.error(`Erro ao buscar dados da tabela ${tabela}:`, error));
}

document.addEventListener('DOMContentLoaded', () => {
    preencherSelect('comprimento', ['comprimento']);
    preencherSelect('largura', ['largura']);
    preencherSelect('borda', ['borda']);
    preencherSelect('front', ['front']);
    preencherSelect('complemento', [
        'complemento1',
        'complemento2',
        'complemento3',
        'complemento4',
        'complemento5',
        'complemento6'
    ]);
});

// Função para obter os preços das tabelas
// Função para obter os preços das tabelas
async function obterPrecos(tabela) {
    try {
        const response = await fetch(`/${tabela}`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar dados da tabela ${tabela}: ${response.statusText}`);
        }
        const data = await response.json();

        // Verificar o formato dos dados recebidos
        console.log(`Dados da tabela ${tabela}:`, data);

        // Converter para um mapa para facilitar a busca pelos IDs
        const precos = new Map();
        data.forEach(item => {
            if (item.id && !isNaN(parseFloat(item.preco))) {
                // Converta o preco para um número decimal
                precos.set(item.id, parseFloat(item.preco));
            } else {
                console.warn(`Dados inválidos encontrados:`, item);
            }
        });

        return precos;
    } catch (error) {
        console.error(`Erro ao obter preços de ${tabela}:`, error);
        return new Map();
    }
}

function calcularTotal() {
    Promise.all([
        obterPrecos('comprimento'),
        obterPrecos('largura'),
        obterPrecos('borda'),
        obterPrecos('front'),
        obterPrecos('complemento')
    ]).then(([comprimentoPrecos, larguraPrecos, bordaPrecos, frontPrecos, complementoPrecos]) => {
        // let total = 0;

        const comprimentoId = document.getElementById('comprimento').value;
        const larguraId = document.getElementById('largura').value;
        const bordaId = document.getElementById('borda').value;
        const frontId = document.getElementById('front').value;
        const complementoIds = [
            document.getElementById('complemento1').value,
            document.getElementById('complemento2').value,
            document.getElementById('complemento3').value,
            document.getElementById('complemento4').value,
            document.getElementById('complemento5').value,
            document.getElementById('complemento6').value
        ];

        const valorBase = parseFloat(document.getElementById('valorBase').value) || 0;

        const comprimentoPreco = comprimentoPrecos.get(parseInt(comprimentoId)) || 0;
        const larguraPreco = larguraPrecos.get(parseInt(larguraId)) || 0;
        const bordaPreco = bordaPrecos.get(parseInt(bordaId)) || 0;
        const frontPreco = frontPrecos.get(parseInt(frontId)) || 0;

        console.log(comprimentoPreco, larguraPreco, bordaPreco, frontPreco);

        const subtotal = (valorBase*comprimentoPreco*larguraPreco)+(valorBase*comprimentoPreco*larguraPreco*bordaPreco)+(valorBase*comprimentoPreco*larguraPreco*frontPreco);
        console.log(subtotal)

        let complementoTotal = 0;
        complementoIds.forEach(id => {
            complementoTotal += complementoPrecos.get(parseInt(id)) || 0;
        });

        valorUnitario = subtotal + complementoTotal;

        console.log(valorUnitario);

        document.getElementById('valorUnitario').textContent = `Total: R$ ${valorUnitario.toFixed(2)}`;
    });
}

function adicionarItem() {
    // Capturar os elementos dos selects
    const comprimento = document.getElementById('comprimento');
    const largura = document.getElementById('largura');
    const borda = document.getElementById('borda');
    const front = document.getElementById('front');
    const complemento1 = document.getElementById('complemento1');
    const quantidade = document.getElementById('quantidade').value;
    const referencia = document.getElementById('referencia').value;


    // Capturar a descrição de cada campo selecionado
    const descricaoComprimento = comprimento.options[comprimento.selectedIndex].text;
    const descricaoLargura = largura.options[largura.selectedIndex].text;
    const descricaoBorda = borda.options[borda.selectedIndex].text;
    const descricaoFront = front.options[front.selectedIndex].text;
    const descricaoComplemento1 = complemento1.options[complemento1.selectedIndex].text;

    // Criar a descrição concatenada
    const descricao = `${descricaoComprimento}${descricaoLargura}${descricaoBorda}${descricaoFront}${descricaoComplemento1}`;

    console.log(valorUnitario)

    const valorTotal = valorUnitario * quantidade;

    console.log(valorUnitario)
    // Adicionar o item à tabela de registros
    const tabela = document.getElementById('registro-tabela');
    const novaLinha = tabela.insertRow();

    novaLinha.innerHTML = `
        <td>${tabela.rows.length}</td>
        <td>${referencia}</td>
        <td>${descricao}</td>
        <td>${quantidade}</td>
        <td>R$ ${valorUnitario.toFixed(2)}</td>
        <td>R$ ${valorTotal.toFixed(2)}</td>
        <td><button class="remove-button" onclick="removerItem(this)">Remover</button></td>
    `;
}


function removerItem(botao) {
    const linha = botao.parentNode.parentNode;
    linha.parentNode.removeChild(linha);
}


// Variáveis globais para armazenar frete e desconto
let freteTotal = 0;
let descontoTotal = 0;
let tipoDesconto = 'real'; // Default para 'real'

function adicionarFrete() {
    // Captura o valor do frete e adiciona à variável global
    freteTotal = parseFloat(document.getElementById('frete').value) || 0;

    // Atualiza a exibição do frete
    document.getElementById('total-frete').textContent = `R$ ${freteTotal.toFixed(2)}`;

    // Atualiza o total
    atualizarTotal();
}

function adicionarDesconto() {
    // Captura o valor do desconto e o tipo de desconto
    descontoTotal = parseFloat(document.getElementById('desconto').value) || 0;
    tipoDesconto = document.getElementById('tipo-desconto').value;

    // Atualiza a exibição do desconto
    atualizarTotal();
}

function atualizarTotal() {
    // Captura a tabela e as linhas
    const tabela = document.getElementById('registro-tabela');
    const linhas = tabela.getElementsByTagName('tr');

    let total = 0;

    // Soma todos os valores de "Valor Total" na tabela
    for (let i = 0; i < linhas.length; i++) {
        const valorTotalCelula = linhas[i].cells[5]; // Ajuste o índice se necessário
        if (valorTotalCelula) {
            const valorTotal = parseFloat(valorTotalCelula.textContent.replace('R$ ', '').replace(',', '.')) || 0;
            total += valorTotal;
        }
    }

    // Aplica o desconto com base no tipo selecionado
    let valorDesconto = 0;
    if (tipoDesconto === 'real') {
        valorDesconto = descontoTotal;
    } else if (tipoDesconto === 'percentual') {
        valorDesconto = total * (descontoTotal / 100);
    }

    // Calcula o total final
    const totalFinal = total + freteTotal - valorDesconto;

    // Atualiza a tabela com frete, desconto e total
    document.getElementById('total-desconto').textContent = `R$ ${valorDesconto.toFixed(2)}`;
    document.getElementById('total-valor').textContent = `R$ ${totalFinal.toFixed(2)}`;
}

        // Função para capturar os dados do orçamento e enviar ao servidor
let idOrcamento;  // Variável para armazenar o id_orcamento

        // Função para salvar o orçamento e gerar o PDF logo em seguida
        function salvarOrcamento() {
            const cliente = document.getElementById('cliente').value;
            const ac = document.getElementById('ac').value;
            const condicoes_comerciais = document.getElementById('condicoes').value;
            const especificacoes = document.getElementById('especificacoes').value;
            const frete = parseFloat(document.getElementById('frete').value) || 0;
            const desconto = parseFloat(document.getElementById('desconto').value) || 0;
            const vendedor = document.getElementById('vendedor').value;
            const total = parseFloat(document.getElementById('total-valor').textContent.replace('R$ ', '').replace(',', '.')) || 0;
        
            // Capturar os itens da tabela
            const tabela = document.getElementById('registro-tabela');
            const linhas = tabela.getElementsByTagName('tr');
        
            let itens = [];
        
            // Adiciona log para verificar se a tabela tem linhas e capturar os dados corretamente
            console.log(`Número de linhas da tabela: ${linhas.length}`);
        
            for (let i = 0; i < linhas.length; i++) {
                // Pular a primeira linha se for o cabeçalho da tabela
                // if (i === 0) continue;
        
                const referencia = linhas[i].cells[1]?.textContent || '';  // Verifica se o conteúdo existe
                const descricao = linhas[i].cells[2]?.textContent || '';   // Verifica se o conteúdo existe
                const quantidade = parseInt(linhas[i].cells[3]?.textContent || '0', 10);  // Garantir conversão
                const valor_unitario = parseFloat(linhas[i].cells[4]?.textContent.replace('R$ ', '').replace(',', '.') || '0');
                const valor_total = parseFloat(linhas[i].cells[5]?.textContent.replace('R$ ', '').replace(',', '.') || '0');
        
                // Verifica se os valores dos itens foram corretamente capturados
                console.log(`Item capturado: ${referencia}, ${descricao}, ${quantidade}, ${valor_unitario}, ${valor_total}`);
        
                // Só adiciona o item se tiver quantidade e descrição
                if (descricao && quantidade > 0) {
                    itens.push({
                        referencia,
                        descricao,
                        qtd: quantidade,
                        valor_unitario,
                        valor_total
                    });
                }
            }
        
            // Adiciona uma verificação para garantir que os itens não estão vazios
            if (itens.length === 0) {
                alert('Nenhum item adicionado à tabela. Verifique os dados.');
                return;
            }
        
            const dadosOrcamento = {
                cliente,
                ac,
                condicoes_comerciais,
                especificacoes,
                frete,
                desconto,
                total,
                vendedor,
                itens
            };
        
            console.log('Enviando dados do orçamento:', dadosOrcamento);
        
            // Envia o orçamento ao servidor
            fetch('/salvarOrcamento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosOrcamento)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao gerar PDF.');
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `orcamento_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(error => {
                console.error('Erro ao enviar dados:', error);
                alert('Erro ao salvar orçamento.');
            });
        }
        
        
        
        // Função para gerar o PDF com o ID_ORCAMENTO
function gerarPDFCabeçalho(idOrcamento) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
        
            // Define o tamanho da fonte
            doc.setFontSize(12);
        
            // Define a margem direita
            const marginRight = 10;  
            const pageWidth = doc.internal.pageSize.getWidth(); // Largura da página
            const textX = pageWidth - marginRight;
        
            // Adiciona o cabeçalho
            doc.text('Tubonox Metalurgica Ltda', textX, 20, { align: 'right' });
            doc.text('Rua Fernandão, 560/B - Fernandão', textX, 30, { align: 'right' });
            doc.text('Paraiba do Sul /RJ - CEP: 25850-000 - Brasil', textX, 40, { align: 'right' });
            doc.text('CNPJ:08.964.307/0001-14 - IE: 78.330.570', textX, 50, { align: 'right' });
            doc.text(`Data: ${document.getElementById('data').value}`, textX, 60, { align: 'right' });
        
            // Adiciona o restante do conteúdo do PDF
            doc.text('De: Tubonox Metalúrgica Ltda', 10, 80);
            doc.text('Contato: Mauricio Garassino', 10, 90);
            doc.text(`Para: ${document.getElementById('cliente').value}`, 10, 100);
            doc.text(`A/C: ${document.getElementById('ac').value}`, 10, 110);
        
            // Adiciona o ID_ORCAMENTO no PDF
            doc.text(`Orçamento ID: ${idOrcamento}`, 10, 120);
        
            doc.setFontSize(14);
            doc.text('                             Proposta Comercial', 10, 140);
        
            doc.setFontSize(12);
            doc.text('Temos a grata satisfação de apresentar nossa proposta comercial para o fornecimento de artigos em aço inox:', 10, 160);
        
            // Salva o PDF com o número do orçamento
            doc.save(`orcamento_${idOrcamento}.pdf`);
        }
        
             

document.getElementById('calcularTotalButton').addEventListener('click', calcularTotal);

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { jsPDF } = require('jspdf');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs'); // Para salvar o PDF no sistema de arquivos temporariamente
require('dotenv').config();
const app = express();
const port = 3000;

// Middlewares
app.use(express.static('public'));
app.use(cors());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});




// Middlewares
app.use(express.static('public'));
app.use(cors());
app.use(express.json()); // Middleware para interpretar JSON

// Middleware para interpretar JSON no corpo da requisição
app.use(express.json());

// Configuração da conexão com o banco de dados MySQL usando pool
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Lista de tabelas permitidas para evitar injeção SQL
const tabelasPermitidas = ['comprimento', 'largura', 'borda', 'front', 'complemento'];

// Rota para salvar o orçamento e seus itens


// Rota para consultar tabelas dinamicamente
app.get('/:tabela', (req, res) => {
  const tabela = req.params.tabela;

  if (!tabelasPermitidas.includes(tabela)) {
    return res.status(400).send('Tabela não permitida.');
  }

  const query = `SELECT * FROM ${tabela}`;
  db.query(query, (err, results) => {
    if (err) {
      console.error(`Erro ao consultar a tabela ${tabela}:`, err);
      res.status(500).send(`Erro ao consultar a tabela ${tabela}.`);
    } else {
      res.json(results);
    }
  });
});


async function loadImage() {
    const imageBytes = fs.readFileSync('logo/logo.png');
    return imageBytes;
}


image = loadImage()

async function gerarPDF(cliente, ac, idOrcamento, itens,especificacoes,condicoes_comerciais,vendedor, data) {
    // Cria um HTML com a estrutura do orçamento usando os dados recebidos
    id_table = 0
    const htmlContent = `
        <html>
        <head>
            <style>
                body {
                    font-family: Helvetica, Arial, sans-serif;
                    margin: 20px;
                }
                body h1{
                    text-align: center;
                    font-size: 12px;
                }
                .header {
                    text-align: right;
                    font-size: 15px;
                }
                .header h1 {
                    font-size: 18px;
                    text-align: center;
                }
                .table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                .table th, .table td {
                    border: 1px solid black;
                    padding: 8px;
                    text-align: left;
                }
                .img{
                }
                .table th {
                    background-color: #f2f2f2;
                }
                .total {
                    margin-top: 20px;
                    font-size: 16px;
                    text-align: right;
                }
            </style>
        </head>
        <body>
            <img src='logo/logo.png' alt="Logo" style="width: auto; height: auto;" />
            <div class="header">  
                <p>Tubonox Metalurgica Ltda</p>
                <p>Rua Fernandó, 560/B - Fernandó</p>
                <p>Paraiba do Sul /RJ - CEP: 25850-000 - Brasil</p>
                <p>CNPJ: 08.964.307/0001-14 - IE: 78.330.570</p>
                <p>Data: ${data}</p>
            </div>
            <p>De: Tubonox Metalurgica Ltda</p>
            <p>Contato:${vendedor}</p>
            <p>Cliente: ${cliente}</p>
            <p>A/C: ${ac}</p>
            <h1>Proposta Comercial N°${idOrcamento}</h1>
            
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Ref.</th>
                        <th>Descrição</th>
                        <th>Qtd.</th>
                        <th>Valor Unitário</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itens.map(item => `
                        <tr>
                            <td>${id_table + 1}</td>
                            <td>${item.referencia}</td>
                            <td>${item.descricao}</td>
                            <td>${item.qtd}</td>
                            <td>R$ ${item.valor_unitario.toFixed(2)}</td>
                            <td>R$ ${item.valor_total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="total">
                <p><strong>Total Geral: R$ ${itens.reduce((acc, item) => acc + item.valor_total, 0).toFixed(2)}</strong></p>
            </div>
            <div class="especificacao" style="width: 550px;">
                <p>Especificação:<p>
                <p>${especificacoes}<p>
                <p>Condiçoes Comerciais<p>
                <p>${condicoes_comerciais}
            </div>
            <div class="atencio" style="text-align: center;">
                    <p>Atenciosamente,</p>
                    <p>${vendedor}</p>
                    <p>Diretor Comercial</p>
                    <p>TubonoxMetalurgica
        </body>
        </html>
    `;

    // Gera o PDF usando Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Carrega o HTML gerado
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // Gera o PDF e salva no diretório temporário
    const pdfPath = path.join(__dirname, `pdfs/orcamento_${idOrcamento}.pdf`);
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true
    });

    await browser.close();

    return pdfPath;
}

module.exports = gerarPDF;





// Rota para salvar o orçamento e gerar o PDF
// Rota para salvar o orçamento e gerar o PDF
app.post('/salvarOrcamento', async (req, res) => {
    const { cliente, ac, condicoes_comerciais, especificacoes, frete, desconto, total, itens,vendedor } = req.body;

    if (!cliente || !itens || itens.length === 0) {
        return res.status(400).send('Dados incompletos.');
    }

    db.getConnection((err, connection) => {
        if (err) {
            return res.status(500).send('Erro ao conectar ao banco de dados.');
        }

        connection.beginTransaction((err) => {
            if (err) {
                connection.release();
                return res.status(500).send('Erro ao iniciar transação.');
            }

            const queryOrcamento = `
                INSERT INTO orcamento (cliente, a_c, condicoes_comerciais, especificacoes, frete, desconto, total)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            connection.query(queryOrcamento, [cliente, ac, condicoes_comerciais, especificacoes, frete, desconto, total], (err, result) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        res.status(500).send('Erro ao inserir orçamento.');
                    });
                }

                const idOrcamento = result.insertId;

                const queryItem = `
                    INSERT INTO itens_orcamento (id_orcamento, referencia, descricao, qtd, valor_unitario, valor_total)
                    VALUES ?
                `;

                const itensValues = itens.map(item => [
                    idOrcamento,
                    item.referencia,
                    item.descricao,
                    item.qtd,
                    item.valor_unitario,
                    item.valor_total
                ]);

                connection.query(queryItem, [itensValues], async (err) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            res.status(500).send('Erro ao inserir itens do orçamento.');
                        });
                    }

                    connection.commit(async (err) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                res.status(500).send('Erro ao confirmar transação.');
                            });
                        }

                        connection.release();

                        try {
                            // Gera o PDF após salvar o orçamento
                            const pdfPath = await gerarPDF(cliente, ac, idOrcamento, itens, especificacoes,condicoes_comerciais,vendedor,new Date().toISOString().split('T')[0]);

                            // Envia o PDF gerado para o cliente
                            res.download(pdfPath, `orcamento_${idOrcamento}.pdf`, (err) => {
                                if (err) {
                                    console.error('Erro ao enviar o PDF:', err);
                                }
                                // Remove o PDF temporário após envio
                                fs.unlink(pdfPath, (err) => {
                                    if (err) {
                                        console.error('Erro ao deletar o PDF temporário:', err);
                                    }
                                });
                            });
                        } catch (pdfError) {
                            console.error('Erro ao gerar o PDF:', pdfError);
                            res.status(500).send('Erro ao gerar o PDF.');
                        }
                    });
                });
            });
        });
    });
});


// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

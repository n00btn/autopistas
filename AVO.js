//AVO
// Plugs y consultas para AVO

const puppeteer = require('puppeteer');
const { Client } = require('pg');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://www.avo.cl/circulaste_sin_tag/consulta');
  
  const inputPatente = await page.$('#patente');
  await inputPatente.type('HDTL88');
  
  const buttonBuscar = await page.$('#btnBuscar');
  await buttonBuscar.click();
  
  await page.waitForSelector('.table');
  
  const consultas = await page.evaluate(() => {
    const rows = document.querySelectorAll('.table tbody tr');
    const consultas = [];
    
    rows.forEach(row => {
      consultas.push({
        fecha: row.querySelector('td:nth-child(1)').innerText,
        monto: row.querySelector('td:nth-child(2)').innerText,
        descripcion: row.querySelector('td:nth-child(3)').innerText
      });
    });
    
    return consultas;
  });
  
  console.log(consultas);
  
  // Conexión a la base de datos
  const client = new Client({
    user: 'usuario',
    host: 'localhost',
    database: 'basedatos',
    password: 'contraseña',
    port: 5432,
  });
  
  await client.connect();
  console.log('Conexión establecida a la base de datos');
  
  // Almacenamiento de las consultas en la base de datos
  const query = 'INSERT INTO consultas(fecha, monto, descripcion) VALUES($1, $2, $3)';
  
  for (const consulta of consultas) {
    const values = [consulta.fecha, consulta.monto, consulta.descripcion];
    await client.query(query, values);
  }
  
  console.log('Consultas almacenadas en la base de datos');
  
  await client.end();
  console.log('Conexión cerrada');
  
  await browser.close();
})();
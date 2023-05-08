//RutaMAaipo
// Plug y consulta RutaMaipo

const puppeteer = require('puppeteer');
const { Client } = require('pg');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://taginterurbano.rutamaipo.cl/pasaste-sin-tag');
  
  const inputPatente = await page.$('#Patente');
  await inputPatente.type('HDTL88');
  
  const buttonConsultar = await page.$('button[type="submit"]');
  await buttonConsultar.click();
  
  await page.waitForSelector('.panel-default');
  
  const consultas = await page.evaluate(() => {
    const rows = document.querySelectorAll('.table tbody tr');
    const consultas = [];
    
    rows.forEach(row => {
      consultas.push({
        fecha: row.querySelector('td:nth-child(1)').innerText,
        hora: row.querySelector('td:nth-child(2)').innerText,
        plaza: row.querySelector('td:nth-child(3)').innerText,
        monto: row.querySelector('td:nth-child(4)').innerText
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
  const query = 'INSERT INTO consultas(fecha, hora, plaza, monto) VALUES($1, $2, $3, $4)';
  
  for (const consulta of consultas) {
    const values = [consulta.fecha, consulta.hora, consulta.plaza, consulta.monto];
    await client.query(query, values);
  }
  
  console.log('Consultas almacenadas en la base de datos');
  
  await client.end();
  console.log('Conexión cerrada');
  
  await browser.close();
})();
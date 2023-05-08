//Autopase

// Plugs y consulta Autopase

const puppeteer = require('puppeteer');
const { Client } = require('pg');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://autopase.cl/');
  
  // Seleccionar la opción "Conoce tus infracciones"
  await page.waitForSelector('#conoce');
  const buttonConoce = await page.$('#conoce');
  await buttonConoce.click();
  
  // Seleccionar la opción "Por patente" y escribir la patente
  await page.waitForSelector('input[name="tipoConsulta"]');
  const inputPatente = await page.$('input[name="tipoConsulta"][value="patente"]');
  await inputPatente.click();
  
  const inputPatenteText = await page.$('#Patente');
  await inputPatenteText.type('HDTL88');
  
  // Resolver el captcha
  await page.waitForSelector('#reCaptcha');
  await page.solveRecaptchas();
  
  // Presionar el botón "Consultar"
  const buttonConsultar = await page.$('#consultar');
  await buttonConsultar.click();
  
  await page.waitForSelector('#resultado table');
  
  const consultas = await page.evaluate(() => {
    const rows = document.querySelectorAll('#resultado table tbody tr');
    const consultas = [];
    
    rows.forEach(row => {
      consultas.push({
        fecha: row.querySelector('td:nth-child(1)').innerText,
        hora: row.querySelector('td:nth-child(2)').innerText,
        patente: row.querySelector('td:nth-child(3)').innerText,
        infraccion: row.querySelector('td:nth-child(4)').innerText,
        monto: row.querySelector('td:nth-child(5)').innerText
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
  const query = 'INSERT INTO consultas_autopase(fecha, hora, patente, infraccion, monto) VALUES($1, $2, $3, $4, $5)';
  
  for (const consulta of consultas) {
    const values = [consulta.fecha, consulta.hora, consulta.patente, consulta.infraccion, consulta.monto];
    await client.query(query, values);
  }
  
  console.log('Consultas almacenadas en la base de datos');
  
  await client.end();
  console.log('Conexión cerrada');
  
  await browser.close();
})();
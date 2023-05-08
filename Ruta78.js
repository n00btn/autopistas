//Ruta78

const puppeteer = require('puppeteer');
const { Pool } = require('pg');

// Configura la conexión a la base de datos
const pool = new Pool({
  user: 'tu_usuario',
  host: 'tu_host',
  database: 'autopistas',
  password: 'tu_contraseña',
  port: 5432,
});

async function scrapeAutopistaDelSol(patente) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://www.autopistadelsol.cl/pago/pago.html');

  // Ingresa la patente
  await page.type('#patente', patente);

  // Haz clic en el botón "Pagar"
  const button = await page.$('input[name="pagar"]');
  await button.click();

  await page.waitForNavigation();

  // Obtén el resultado de la consulta
  const result = await page.evaluate(() => {
    const descripcion = document.querySelector('#descripcion');
    const monto = document.querySelector('#monto');
    if (descripcion && monto) {
      return {
        descripcion: descripcion.textContent.trim(),
        monto: monto.textContent.trim(),
      };
    }
    return null;
  });

  await browser.close();

  // Inserta el resultado en la base de datos
  if (result) {
    const query = {
      text: 'INSERT INTO consultas (patente, descripcion, monto) VALUES ($1, $2, $3)',
      values: [patente, result.descripcion, result.monto],
    };
    try {
      await pool.query(query);
    } catch (error) {
      console.error('Error al insertar la consulta en la base de datos:', error);
    }
  }

  return result;
}

// Ejemplo de uso
scrapeAutopistaDelSol('HDTL88').then((result) => {
  console.log(result);
});
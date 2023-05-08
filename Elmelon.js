//Tunerl El Melón

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

async function scrapeTunelElMelon(patente, fecha) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://unired.tagtotal.cl/consulta-pdu');

  // Selecciona el tipo de patente "Nacional"
  await page.select('#select-tipopatente', 'n');

  // Selecciona la categoría "Liviano"
  await page.select('#select-tipo', 'L');

  // Ingresa la patente
  await page.type('#patente', patente);

  // Ingresa la fecha de circulación
  await page.type('#fechacirculacion', fecha);

  // Haz clic en el botón "Pagar"
  const button = await page.$('input[type="submit"]');
  await button.click();

  await page.waitForNavigation();

  // Obtén el resultado de la consulta
  const result = await page.evaluate(() => {
    const descripcion = document.querySelector('#descItem .itemDesc');
    const monto = document.querySelector('#descItem .itemMonto');
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
scrapeTunelElMelon('AB1234', '2022-05-09').then((result) => {
  console.log(result);
});
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  console.log("Sembrando base de datos...");

  // ==================== ZONAS ====================
  const zonasData = [
    "HAEDO",
    "MORON",
    "PALOMAR",
    "CABA",
    "NORTE",
    "CASTELAR",
    "RAMOS MEJIA",
    "VILLA LELOIR",
    "HURLINGHAM",
    "SAN MARTIN",
    "MERLO",
    "PADUA",
    "VILLA SARMIENTO",
    "VILLA UDAONDO",
    "VILLA LUZURIAGA",
    "ITUZAINGO",
    "PUESTO PALTA",
    "SENSU",
    "OSCAR",
    "LUJAN",
    "SUR",
    "SIN ASIGNAR",
  ];

  const zonas: Record<string, { id: number }> = {};
  for (const nombre of zonasData) {
    const z = await prisma.zona.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
    zonas[nombre] = z;
  }
  console.log(`  ✓ ${zonasData.length} zonas`);

  // ==================== REPARTIDORES ====================
  const repartidoresData = [
    "OSCAR",
    "LAUCHA",
    "BRUNO",
    "ROLDU",
    "MONCHI",
    "CHRI",
    "PIPI",
    "NAVA",
    "TITO 1RA",
    "TITO 2DA",
    "RAFA",
    "GALIA",
    "VANE",
    "GABY",
    "CREMONA",
    "ABEL",
    "JOSE",
    "DINA",
    "CHRISTIAN",
    "LUCIA",
    "NAFTA",
  ];

  const repartidores: Record<string, { id: number }> = {};
  for (const nombre of repartidoresData) {
    const r = await prisma.repartidor.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
    repartidores[nombre] = r;
  }
  console.log(`  ✓ ${repartidoresData.length} repartidores`);

  // ==================== PRODUCTOS ====================
  // precioReferencia en pesos por caja (estimado de los datos del Excel abril 2025)
  const productosData = [
    { nombre: "WHITE", precioReferencia: 62000 },
    { nombre: "PERU", precioReferencia: 66000 },
    { nombre: "PERU 60", precioReferencia: 66000 },
    { nombre: "PERU 84", precioReferencia: 63000 },
    { nombre: "PERU 96", precioReferencia: 70000 },
    { nombre: "PERU 11KG", precioReferencia: 66000 },
    { nombre: "SHAPO", precioReferencia: 60000 },
    { nombre: "AVO", precioReferencia: 65000 },
    { nombre: "BRASIL", precioReferencia: 58000 },
    { nombre: "CAT 1", precioReferencia: 55000 },
    { nombre: "CAT 2", precioReferencia: 55000 },
    { nombre: "CAT 30", precioReferencia: 55000 },
    { nombre: "CAT 50", precioReferencia: 55000 },
    { nombre: "DIAR 84", precioReferencia: 63000 },
    { nombre: "JAGUACY", precioReferencia: 65000 },
    { nombre: "IGUANA", precioReferencia: 60000 },
    { nombre: "GUACA PREMIUM", precioReferencia: 80000 },
  ];

  const productos: Record<string, { id: number }> = {};
  for (const p of productosData) {
    let prod = await prisma.producto.findFirst({ where: { nombre: p.nombre } });
    if (!prod) {
      prod = await prisma.producto.create({ data: p });
    } else {
      prod = await prisma.producto.update({ where: { id: prod.id }, data: { precioReferencia: p.precioReferencia } });
    }
    productos[p.nombre] = prod;
  }
  console.log(`  ✓ ${productosData.length} productos`);

  // ==================== CUENTAS CORRIENTES ====================
  // Grupos de clientes que pagan en conjunto (hoja PAGO SEMANAL del Excel)
  const cuentasData = [
    { nombre: "CUERVO", diaCobranza: "SABADO" },
    { nombre: "CAFÉ BLANCA", diaCobranza: "CADA 2 SEMANAS" },
    { nombre: "SUTEKI SUSHI", diaCobranza: "SABADO" },
    { nombre: "LOCALES SACHA", diaCobranza: "SABADO" },
    { nombre: "SUSHI ROCK", diaCobranza: "SABADO" },
    { nombre: "PANERA ROSA", diaCobranza: "LUNES" },
    { nombre: "COFI JAUS", diaCobranza: "MARTES" },
    { nombre: "LOCALES DE ANGIE", diaCobranza: "MIERCOLES" },
    { nombre: "FABRICS", diaCobranza: null },
    { nombre: "LAPARAPIPON SRL", diaCobranza: null },
    { nombre: "ASUNCION SRL", diaCobranza: null },
    { nombre: "ARROZ DEL SUR", diaCobranza: "LUNES" },
    { nombre: "SENSUS SUSHI", diaCobranza: "MARTES" },
    { nombre: "ERIKA SUSHIS", diaCobranza: "MIERCOLES" },
    { nombre: "SUPERI 1450", diaCobranza: "MIERCOLES" },
    { nombre: "FABRIC SUSHI PUERTO MADERO", diaCobranza: "MARTES" },
    { nombre: "CERRITO 304", diaCobranza: "MIERCOLES" },
    { nombre: "BARRAGAN", diaCobranza: "MARTES" },
    { nombre: "MACHADO 861", diaCobranza: "SABADO" },
    { nombre: "MENDOZA 4496", diaCobranza: "SABADO" },
    { nombre: "LOCALES LE PAIN", diaCobranza: "LUNES" },
    { nombre: "LOCALES GONZALO ITALIA", diaCobranza: "SABADO" },
    { nombre: "DIEGO PALMA LOCALES", diaCobranza: "LUNES" },
    { nombre: "SHELTER LOCALES", diaCobranza: "LUNES" },
    { nombre: "SUSHI POP MUÑIZ", diaCobranza: "LUNES" },
    { nombre: "GARDINER OBLIGADO 6311", diaCobranza: "SABADO" },
    { nombre: "BARRACAS VELEZ", diaCobranza: "CONTRA ENTREGA" },
    { nombre: "CORRIENTES NUEVO PANERA ROSA", diaCobranza: "VIERNES" },
    { nombre: "TAPIA DE CRUZ", diaCobranza: "MARTES" },
    { nombre: "LOS MERCI", diaCobranza: null },
    { nombre: "CRISOL", diaCobranza: null },
  ];

  const cuentas: Record<string, { id: number }> = {};
  for (const cc of cuentasData) {
    const c = await prisma.cuentaCorriente.upsert({
      where: { nombre: cc.nombre },
      update: { diaCobranza: cc.diaCobranza },
      create: { nombre: cc.nombre, diaCobranza: cc.diaCobranza },
    });
    cuentas[cc.nombre] = c;
  }
  console.log(`  ✓ ${cuentasData.length} cuentas corrientes`);

  // ==================== CLIENTES ====================
  // Sub-locales de cada cuenta corriente (de la hoja PAGO SEMANAL)
  const clientesCuentas: Array<{
    nombre: string;
    cuenta: string;
    zona?: string;
  }> = [
    // CUERVO
    { nombre: "COSTA RICA", cuenta: "CUERVO", zona: "CABA" },
    { nombre: "SALVADOR", cuenta: "CUERVO", zona: "CABA" },
    { nombre: "JURAMENTO", cuenta: "CUERVO", zona: "CABA" },
    { nombre: "NEWBERY", cuenta: "CUERVO", zona: "CABA" },
    { nombre: "ARENALES OFF CUERVO", cuenta: "CUERVO", zona: "CABA" },
    // CAFÉ BLANCA
    { nombre: "SOLDADO", cuenta: "CAFÉ BLANCA", zona: "CABA" },
    { nombre: "SINCLAIR 3136", cuenta: "CAFÉ BLANCA", zona: "CABA" },
    { nombre: "TAGLE", cuenta: "CAFÉ BLANCA", zona: "CABA" },
    // SUTEKI SUSHI
    { nombre: "SUTEKI ISA. CATOLICA", cuenta: "SUTEKI SUSHI", zona: "CABA" },
    { nombre: "ARIAS 2926", cuenta: "SUTEKI SUSHI", zona: "CABA" },
    { nombre: "SUTEKI RAMOS NECOCHEA", cuenta: "SUTEKI SUSHI", zona: "RAMOS MEJIA" },
    // LOCALES SACHA
    { nombre: "SACHA NUÑEZ", cuenta: "LOCALES SACHA", zona: "CABA" },
    { nombre: "SACHA MARTINEZ", cuenta: "LOCALES SACHA", zona: "NORTE" },
    { nombre: "SACHA NORDELTA", cuenta: "LOCALES SACHA", zona: "NORTE" },
    // SUSHI ROCK
    { nombre: "SUSHI ROCK AVELLANEDA", cuenta: "SUSHI ROCK", zona: "SUR" },
    // PANERA ROSA
    { nombre: "PANERA ROSA UNICENTER", cuenta: "PANERA ROSA", zona: "NORTE" },
    { nombre: "PANERA ROSA AEROPARQUE", cuenta: "PANERA ROSA", zona: "CABA" },
    { nombre: "PANERA ROSA BAROLO", cuenta: "PANERA ROSA", zona: "CABA" },
    { nombre: "PANERA ROSA SANTA FE 2902", cuenta: "PANERA ROSA", zona: "CABA" },
    { nombre: "PANERA ROSA CHARCAS", cuenta: "PANERA ROSA", zona: "CABA" },
    // COFI JAUS
    { nombre: "COFI PALERMO HUMBOLDT", cuenta: "COFI JAUS", zona: "CABA" },
    { nombre: "COFI BELGRANO MONTAÑESES", cuenta: "COFI JAUS", zona: "CABA" },
    { nombre: "COFI BLANCO ENCALADA URQUIZA", cuenta: "COFI JAUS", zona: "CABA" },
    { nombre: "COFI PALPA COLEGIALES", cuenta: "COFI JAUS", zona: "CABA" },
    { nombre: "COFI AV. MITRE MUNRO", cuenta: "COFI JAUS", zona: "NORTE" },
    { nombre: "COFI QUESADA NUÑEZ", cuenta: "COFI JAUS", zona: "CABA" },
    { nombre: "COFI CUBA", cuenta: "COFI JAUS", zona: "CABA" },
    // LOCALES DE ANGIE
    { nombre: "ANGIE GUATEMALA", cuenta: "LOCALES DE ANGIE", zona: "CABA" },
    { nombre: "MOLDES LUCAS", cuenta: "LOCALES DE ANGIE", zona: "CABA" },
    { nombre: "GARCIA AL RIO AVANTI", cuenta: "LOCALES DE ANGIE", zona: "CABA" },
    // FABRICS
    { nombre: "PEROMPE SRL", cuenta: "FABRICS", zona: "CABA" },
    { nombre: "BEIRO 4527", cuenta: "FABRICS", zona: "CABA" },
    { nombre: "CACHIMAYO", cuenta: "FABRICS", zona: "CABA" },
    { nombre: "DIRECTORIO 1834", cuenta: "FABRICS", zona: "CABA" },
    // LAPARAPIPON SRL
    { nombre: "DOBLAS 220", cuenta: "LAPARAPIPON SRL", zona: "CABA" },
    { nombre: "OLAZABAL 4504", cuenta: "LAPARAPIPON SRL", zona: "CABA" },
    { nombre: "PUEYRREDON 703", cuenta: "LAPARAPIPON SRL", zona: "CABA" },
    { nombre: "FELIPE VALLESE 802", cuenta: "LAPARAPIPON SRL", zona: "CABA" },
    // ASUNCION SRL
    { nombre: "ASUNCION 4054", cuenta: "ASUNCION SRL", zona: "CABA" },
    { nombre: "ARTIGAS 4107", cuenta: "ASUNCION SRL", zona: "CABA" },
    // ARROZ DEL SUR
    { nombre: "ARROZ DEL SUR RAMON FALCON", cuenta: "ARROZ DEL SUR", zona: "CABA" },
    // SENSUS SUSHI
    { nombre: "SENSUS UNICENTER", cuenta: "SENSUS SUSHI", zona: "NORTE" },
    { nombre: "SENSUS TORTUGAS", cuenta: "SENSUS SUSHI", zona: "NORTE" },
    { nombre: "SENSUS NORDELTA", cuenta: "SENSUS SUSHI", zona: "NORTE" },
    { nombre: "SENSUS BULLRICH", cuenta: "SENSUS SUSHI", zona: "CABA" },
    { nombre: "SENSU ABASTO", cuenta: "SENSUS SUSHI", zona: "SENSU" },
    // ERIKA SUSHIS
    { nombre: "ERIKA HONDURAS 5867", cuenta: "ERIKA SUSHIS", zona: "CABA" },
    { nombre: "KANU RAMOS", cuenta: "ERIKA SUSHIS", zona: "RAMOS MEJIA" },
    { nombre: "ERIKA COSTA RICA 5861", cuenta: "ERIKA SUSHIS", zona: "CABA" },
    { nombre: "KANU LIBERTADORES 40", cuenta: "ERIKA SUSHIS", zona: "NORTE" },
    // SUPERI 1450
    { nombre: "SUPERI 1450", cuenta: "SUPERI 1450", zona: "CABA" },
    { nombre: "LIBERTADOR NUEVO", cuenta: "SUPERI 1450", zona: "CABA" },
    // FABRIC SUSHI PUERTO MADERO
    { nombre: "FABRIC PUERTO MADERO", cuenta: "FABRIC SUSHI PUERTO MADERO", zona: "CABA" },
    { nombre: "CASTAÑEDA 1899", cuenta: "FABRIC SUSHI PUERTO MADERO", zona: "CABA" },
    { nombre: "LIBERTADOR 6025", cuenta: "FABRIC SUSHI PUERTO MADERO", zona: "CABA" },
    { nombre: "COMEDOR NARDA LEPES", cuenta: "FABRIC SUSHI PUERTO MADERO", zona: "CABA" },
    // CERRITO 304
    { nombre: "CERRITO 304", cuenta: "CERRITO 304", zona: "CABA" },
    // BARRAGAN
    { nombre: "CABRERA 3697", cuenta: "BARRAGAN", zona: "CABA" },
    { nombre: "NICASIO OROÑO 1195", cuenta: "BARRAGAN", zona: "CABA" },
    { nombre: "ROSETI 177", cuenta: "BARRAGAN", zona: "CABA" },
    { nombre: "SUPERI 4301", cuenta: "BARRAGAN", zona: "CABA" },
    // MACHADO 861 (cuenta de un solo local)
    { nombre: "MACHADO 861", cuenta: "MACHADO 861", zona: "MORON" },
    // MENDOZA 4496
    { nombre: "MENDOZA 4496", cuenta: "MENDOZA 4496", zona: "CABA" },
    // LOCALES LE PAIN
    { nombre: "LE PAIN SALGUERO", cuenta: "LOCALES LE PAIN", zona: "CABA" },
    { nombre: "LE PAIN POSADAS", cuenta: "LOCALES LE PAIN", zona: "CABA" },
    { nombre: "LE PAIN ARMENIA", cuenta: "LOCALES LE PAIN", zona: "CABA" },
    { nombre: "LE PAIN ARCOS", cuenta: "LOCALES LE PAIN", zona: "CABA" },
    { nombre: "LE PAIN RECOLETA MALL", cuenta: "LOCALES LE PAIN", zona: "CABA" },
    // LOCALES GONZALO ITALIA
    { nombre: "ITALIA 4950", cuenta: "LOCALES GONZALO ITALIA", zona: "CABA" },
    { nombre: "SUSHI POP PILAR", cuenta: "LOCALES GONZALO ITALIA", zona: "NORTE" },
    { nombre: "OLAZABAL 1411", cuenta: "LOCALES GONZALO ITALIA", zona: "NORTE" },
    // DIEGO PALMA LOCALES
    { nombre: "DIEGO PALMA 1421", cuenta: "DIEGO PALMA LOCALES", zona: "NORTE" },
    { nombre: "MAIPU 4184", cuenta: "DIEGO PALMA LOCALES", zona: "NORTE" },
    // SHELTER LOCALES
    { nombre: "THE SHELTER LORETO", cuenta: "SHELTER LOCALES", zona: "CABA" },
    { nombre: "THE SHELTER MARTINEZ", cuenta: "SHELTER LOCALES", zona: "NORTE" },
    { nombre: "THE SHELTER RECOLETA", cuenta: "SHELTER LOCALES", zona: "CABA" },
    // SUSHI POP MUÑIZ
    { nombre: "SUSHI POP MUÑIZ", cuenta: "SUSHI POP MUÑIZ", zona: "NORTE" },
    // LOS MERCI
    { nombre: "MERCI SANTELMO", cuenta: "LOS MERCI", zona: "CABA" },
    { nombre: "MERCI MADERO", cuenta: "LOS MERCI", zona: "CABA" },
    { nombre: "MERCI PATRONA", cuenta: "LOS MERCI", zona: "CABA" },
    { nombre: "MERCI CALLAO", cuenta: "LOS MERCI", zona: "CABA" },
    { nombre: "MERCI MALABIA", cuenta: "LOS MERCI", zona: "CABA" },
    { nombre: "MERCI MERCADO", cuenta: "LOS MERCI", zona: "CABA" },
    // CRISOL
    { nombre: "CRISOL BUCARELLI", cuenta: "CRISOL", zona: "CABA" },
    { nombre: "CRISOL SAAVEDRA", cuenta: "CRISOL", zona: "CABA" },
    { nombre: "CRISOL SUCRE", cuenta: "CRISOL", zona: "CABA" },
    { nombre: "CRISOL OLAZABAL", cuenta: "CRISOL", zona: "CABA" },
    { nombre: "CRISOL PALERMO", cuenta: "CRISOL", zona: "CABA" },
    { nombre: "CRISOL URQUIZA", cuenta: "CRISOL", zona: "CABA" },
    // GARDINER OBLIGADO 6311
    { nombre: "GARDINER OBLIGADO 6311", cuenta: "GARDINER OBLIGADO 6311", zona: "NORTE" },
    // BARRACAS VELEZ
    { nombre: "BARRACAS VELEZ", cuenta: "BARRACAS VELEZ", zona: "CABA" },
    // CORRIENTES NUEVO PANERA ROSA
    { nombre: "CORRIENTES NUEVO PANERA ROSA", cuenta: "CORRIENTES NUEVO PANERA ROSA", zona: "CABA" },
    // TAPIA DE CRUZ
    { nombre: "TAPIA DE CRUZ", cuenta: "TAPIA DE CRUZ", zona: "CABA" },
  ];

  for (const c of clientesCuentas) {
    const zona = c.zona ?? "SIN ASIGNAR";
    const idZona = (zonas[zona] ?? zonas["SIN ASIGNAR"]).id;
    const idCuentaCorriente = cuentas[c.cuenta].id;
    const exists = await prisma.cliente.findFirst({ where: { nombre: c.nombre } });
    if (!exists) {
      await prisma.cliente.create({
        data: { nombre: c.nombre, idZona, idCuentaCorriente, formaPagoPref: "PAGO_SEMANAL" },
      });
    }
  }
  console.log(`  ✓ ${clientesCuentas.length} clientes de cuentas corrientes`);

  // Clientes individuales (pago por entrega, de las hojas diarias)
  const clientesIndividuales: Array<{
    nombre: string;
    zona: string;
    formaPago?: "EFECTIVO" | "TRANSFERENCIA";
    requiereFactura?: boolean;
  }> = [
    { nombre: "ROSALES 763", zona: "HAEDO", formaPago: "TRANSFERENCIA" },
    { nombre: "JUAN B JUSTO 550", zona: "HAEDO", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "DRAGO 2548", zona: "CASTELAR", formaPago: "EFECTIVO" },
    { nombre: "MARCONI 6441", zona: "PALOMAR", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "ROSAS 6251", zona: "PALOMAR", formaPago: "TRANSFERENCIA" },
    { nombre: "JOAQUIN V GONZALES 2453", zona: "NORTE", formaPago: "EFECTIVO" },
    { nombre: "PERU 1546", zona: "NORTE", formaPago: "EFECTIVO" },
    { nombre: "SANTA FE 2616", zona: "NORTE", formaPago: "EFECTIVO" },
    { nombre: "AZCUENAGA 1004", zona: "NORTE", formaPago: "EFECTIVO" },
    { nombre: "URQUIZA 2501", zona: "NORTE", formaPago: "EFECTIVO" },
    { nombre: "TDH BALVIN", zona: "CABA", formaPago: "EFECTIVO" },
    { nombre: "AGUERO 976", zona: "MORON", formaPago: "EFECTIVO" },
    { nombre: "BAHIA BLANCA 252", zona: "CABA", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "CONESA 2686", zona: "CABA", formaPago: "EFECTIVO" },
    { nombre: "ZUKA ZAPIOLA", zona: "CABA", formaPago: "EFECTIVO" },
    { nombre: "OLLEROS 1739", zona: "CABA", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "ELCANO 3410", zona: "CABA", formaPago: "EFECTIVO" },
    { nombre: "C DE LA PAZ 2300", zona: "CABA", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "MATIENZO 1680", zona: "CABA", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "NEWBERY 3368", zona: "CABA", formaPago: "EFECTIVO" },
    { nombre: "CLUB DE AMIGOS", zona: "CABA", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "GUATEMALA 4570", zona: "CABA", formaPago: "EFECTIVO" },
    { nombre: "VIAMONTE 2652", zona: "CABA", formaPago: "TRANSFERENCIA" },
    { nombre: "JUNCAL 846", zona: "CABA", formaPago: "EFECTIVO" },
    { nombre: "POSADAS 1284 6B", zona: "CABA", formaPago: "EFECTIVO" },
    { nombre: "PANERA CORRIENTES", zona: "CABA", formaPago: "TRANSFERENCIA" },
    { nombre: "BILLINGHURTS 384", zona: "CABA", formaPago: "TRANSFERENCIA" },
    { nombre: "TDH PRINGLES", zona: "CABA", formaPago: "EFECTIVO" },
    { nombre: "YUMI SUSHI", zona: "CABA", formaPago: "EFECTIVO" },
    { nombre: "FABRIC CASTE", zona: "CASTELAR", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "TACO BOX LELOIR", zona: "VILLA LELOIR", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "SUSHI LOVERS GREGORIO LEMOS", zona: "NORTE", formaPago: "EFECTIVO" },
    { nombre: "ILLIA 3770", zona: "NORTE", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "BAGELS Y BAGELS TOM", zona: "OSCAR", formaPago: "EFECTIVO" },
    { nombre: "MOI LAS PALMAS", zona: "OSCAR", formaPago: "EFECTIVO" },
    { nombre: "LE PAIN ALTO PALERMO", zona: "OSCAR", formaPago: "EFECTIVO" },
    { nombre: "LE PAIN REPUBLICA", zona: "OSCAR", formaPago: "EFECTIVO" },
    { nombre: "LE PAIN LAS PALMAS", zona: "OSCAR", formaPago: "EFECTIVO" },
    { nombre: "SUSHI CLUB RAMOS", zona: "RAMOS MEJIA", formaPago: "TRANSFERENCIA" },
    { nombre: "PUEYRREDON 32", zona: "RAMOS MEJIA", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "SUSHI POP TIGRE", zona: "PUESTO PALTA", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "SUSHI POP SAN ISIDRO", zona: "PUESTO PALTA", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "SUSHI POP MARTINEZ", zona: "PUESTO PALTA", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "SUSHI POP VTE LOPEZ", zona: "PUESTO PALTA", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "TOM CASA", zona: "PUESTO PALTA", formaPago: "TRANSFERENCIA" },
    { nombre: "ROLL ANDO", zona: "PUESTO PALTA", formaPago: "TRANSFERENCIA" },
    { nombre: "AZCUENAGA 1396", zona: "PUESTO PALTA", formaPago: "EFECTIVO" },
    { nombre: "SIBA CAFE", zona: "PUESTO PALTA", formaPago: "TRANSFERENCIA" },
    { nombre: "HERNAN FEDE", zona: "PUESTO PALTA", formaPago: "EFECTIVO" },
    { nombre: "AVELLANEDA 1358", zona: "NORTE", formaPago: "EFECTIVO" },
    { nombre: "DORREGO 2424", zona: "NORTE", formaPago: "EFECTIVO" },
    { nombre: "AV GAONA 1694", zona: "CABA", formaPago: "EFECTIVO" },
    { nombre: "AMBROSETI 361", zona: "CABA", formaPago: "TRANSFERENCIA", requiereFactura: true },
    { nombre: "PERON 4169", zona: "CABA", formaPago: "EFECTIVO", requiereFactura: true },
    { nombre: "BELGRANO 3331", zona: "CABA", formaPago: "TRANSFERENCIA" },
    { nombre: "SENSU ABASTO STAND ALONE", zona: "SENSU", formaPago: "EFECTIVO", requiereFactura: true },
  ];

  for (const c of clientesIndividuales) {
    const idZona = (zonas[c.zona] ?? zonas["SIN ASIGNAR"]).id;
    const exists = await prisma.cliente.findFirst({ where: { nombre: c.nombre } });
    if (!exists) {
      await prisma.cliente.create({
        data: {
          nombre: c.nombre,
          idZona,
          formaPagoPref: c.formaPago ?? "EFECTIVO",
          requiereFactura: c.requiereFactura ?? false,
        },
      });
    }
  }
  console.log(`  ✓ ${clientesIndividuales.length} clientes individuales`);

  console.log("\n¡Seed completado!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

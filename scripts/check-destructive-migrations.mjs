import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Expresiones regulares para buscar patrones destructivos en SQL
const PATRONES_PELIGROSOS = [
  { regex: /DROP\s+COLUMN/i, desc: "Eliminación de columna (DROP COLUMN)" },
  { regex: /DROP\s+TABLE/i, desc: "Eliminación de tabla (DROP TABLE)" },
  { regex: /ALTER\s+TABLE\s+\S+\s+DROP\s+/i, desc: "Alteración de tabla destructiva (DROP)" },
];

function getChangedSqlFiles() {
  const files = new Set();

  // 1. Detectar archivos de migración locales sin commitear (modificados o untracked)
  try {
    const statusOutput = execSync("git status --porcelain -uall", { encoding: "utf-8" });
    statusOutput.split("\n").forEach((line) => {
      if (!line) return;
      // El formato de git status --porcelain es "XY archivo"
      const filePath = line.substring(3).trim();
      if (filePath.endsWith(".sql") && filePath.includes("prisma/migrations")) {
        files.add(filePath);
      }
    });
  } catch (e) {
    console.warn("Advertencia: No se pudo ejecutar 'git status'.");
  }

  // 2. Detectar archivos de migración nuevos en la rama actual
  const comandosDiff = [
    "git diff --name-only origin/main...HEAD",
    "git diff --name-only main...HEAD",
    "git diff --name-only HEAD~1",
  ];

  for (const cmd of comandosDiff) {
    try {
      const diffOutput = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] });
      diffOutput.split("\n").forEach((file) => {
        const trimmed = file.trim();
        if (trimmed.endsWith(".sql") && trimmed.includes("prisma/migrations")) {
          files.add(trimmed);
        }
      });
      break; // Si tiene éxito con uno, no necesitamos los demás
    } catch (e) {
      // Ignorar error de rama no existente e intentar el siguiente comando
    }
  }

  return Array.from(files);
}

function checkMigrations() {
  console.log("=== Linter de Migraciones: Buscando cambios destructivos ===");
  const sqlFiles = getChangedSqlFiles();

  if (sqlFiles.length === 0) {
    console.log("No se encontraron archivos de migración SQL nuevos o modificados.");
    console.log("Validación completada de manera exitosa. ✓\n");
    process.exit(0);
  }

  console.log(`Detectados ${sqlFiles.length} archivos SQL de migración a auditar:`);
  sqlFiles.forEach((f) => console.log(`  - ${f}`));
  console.log("");

  let huboError = false;

  for (const file of sqlFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf-8");

    // Verificar si el archivo tiene el comentario de bypass intencional
    if (content.includes("@allow-destructive")) {
      console.log(`[BYPASS] ${file} contiene la directiva '@allow-destructive'. Se omite la auditoría.`);
      continue;
    }

    const lines = content.split("\n");
    lines.forEach((line, index) => {
      const cleanLine = line.trim();
      // Ignorar comentarios SQL
      if (cleanLine.startsWith("--") || cleanLine.startsWith("/*")) return;

      for (const patron of PATRONES_PELIGROSOS) {
        if (patron.regex.test(cleanLine)) {
          console.error(`\x1b[31m[ERROR DE MIGRACIÓN DESTRUCTORA]\x1b[0m en el archivo: \x1b[36m${file}\x1b[0m (Línea ${index + 1})`);
          console.error(`  -> Patrón detectado: \x1b[33m${patron.desc}\x1b[0m`);
          console.error(`  -> Línea SQL afectada: \x1b[90m"${cleanLine}"\x1b[0m`);
          console.error("");
          huboError = true;
        }
      }
    });
  }

  if (huboError) {
    console.error(`\x1b[41m\x1b[37m MIGRACIÓN DETENIDA PARA EVITAR LA PÉRDIDA DE DATOS EN PRODUCCIÓN \x1b[0m`);
    console.error("");
    console.error("Si estás intentando renombrar una columna de la base de datos:");
    console.error("1. No dejes que Prisma use su comportamiento destructivo (DROP y CREATE).");
    console.error("2. Abre manualmente el archivo .sql de la migración y modifícalo para usar:");
    console.error('   ALTER TABLE "tabla" RENAME COLUMN "columna_vieja" TO "columna_nueva";');
    console.error("");
    console.error("Si esta eliminación de datos es INTENCIONAL y deseas proceder:");
    console.error("1. Añade el siguiente comentario en la primera línea de tu archivo SQL:");
    console.error("   -- @allow-destructive");
    console.error("");
    process.exit(1);
  }

  console.log("Felicidades. No se encontraron cambios destructivos en las migraciones SQL. ✓\n");
  process.exit(0);
}

checkMigrations();

import { execSync } from "child_process";
import * as fs from "fs";

console.log("=== BUSCANDO JDK NO CONTAINER ===");
const commonPaths = [
  "/usr/lib/jvm",
  "/usr/java",
  "/opt/java",
  "/opt/jdk",
  "/usr/local/java",
  "/usr/local/jdk",
  "/android-sdk",
  "/home/user",
];

for (const p of commonPaths) {
  if (fs.existsSync(p)) {
    console.log(`Encontrado: ${p}`);
    try {
      const items = fs.readdirSync(p);
      console.log(`Subpastas/arquivos em ${p}:`, items);
    } catch (e: any) {
      console.log(`Erro ao ler ${p}:`, e.message);
    }
  } else {
    console.log(`Não existe: ${p}`);
  }
}

console.log("Variáveis de ambiente:");
console.log(process.env);

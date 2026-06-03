import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

async function runAsync() {
  const logFile = path.join(process.cwd(), "build-android.log");
  
  // Limpar log anterior
  if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile);
  }

  const out = fs.openSync(logFile, "a");
  const err = fs.openSync(logFile, "a");

  console.log("=== INICIANDO COMPILAÇÃO DETACHED (PLANO DE FUNDO) ===");
  
  const child = spawn("npx", ["tsx", "compile-android.ts"], {
    detached: true,
    stdio: ["ignore", out, err]
  });

  child.unref();
  
  console.log(`Processo iniciado com PID: ${child.pid}`);
  console.log(`Acompanhe o progresso lendo o arquivo: ${logFile}`);
}

runAsync();

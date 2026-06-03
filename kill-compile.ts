import { execSync } from "child_process";

console.log("=== PARANDO PROCESSOS DE COMPILAÇÃO ANTIGOS ===");
try {
  const output = execSync("ps aux | grep compile-android | grep -v grep", { encoding: "utf8" });
  console.log("Processos encontrados:\n", output);
  
  const lines = output.trim().split("\n");
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[1];
    if (pid && pid !== process.pid.toString()) {
      console.log(`Matando PID ${pid}...`);
      try {
        process.kill(parseInt(pid, 10), "SIGKILL");
        console.log(`PID ${pid} morto.`);
      } catch (err: any) {
        console.log(`Erro ao matar PID ${pid}: ${err.message}`);
      }
    }
  }
} catch (e) {
  console.log("Nenhum processo antigo ativo.");
}

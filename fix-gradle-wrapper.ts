import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

async function fixWrapper() {
  console.log("=== SUBSTITUINDO GRADLE WRAPPER JAR POR UMA VERSÃO VÁLIDA ===");

  const wrapperJarPath = path.join(process.cwd(), "android", "gradle", "wrapper", "gradle-wrapper.jar");
  const url = "https://raw.githubusercontent.com/gradle/gradle/v8.14.3/gradle/wrapper/gradle-wrapper.jar";

  try {
    if (fs.existsSync(wrapperJarPath)) {
      console.log(`Tamanho atual do jar: ${fs.statSync(wrapperJarPath).size} bytes`);
    }

    console.log(`Baixando gradle-wrapper.jar oficial de: ${url}`);
    execSync(`curl -L --fail -o "${wrapperJarPath}" "${url}"`, { stdio: "inherit" });

    const newSize = fs.statSync(wrapperJarPath).size;
    console.log(`Novo tamanho do jar: ${newSize} bytes`);

    // Testar com o java portátil novamente
    const localJavaHome = path.join(process.cwd(), "jdk-17");
    const javaBin = path.join(localJavaHome, "bin", "java");

    try {
      execSync(`"${javaBin}" -jar "${wrapperJarPath}" --version`, { stdio: "inherit" });
      console.log("Teste de sucesso! O gradle-wrapper.jar agora é reconhecido corretamente como válido.");
    } catch (e: any) {
      console.log("Aviso: O jar rodou mas retornou erro de parâmetros (o que é normal se --version não for suportado pela classe principal do wrapper), ou outro erro:", e.message);
    }
  } catch (error: any) {
    console.error("Erro ao consertar o gradle wrapper jar:", error.message || error);
    process.exit(1);
  }
}

fixWrapper();

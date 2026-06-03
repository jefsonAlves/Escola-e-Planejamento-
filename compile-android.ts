import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=== INICIANDO PROCESSO DE COMPILAÇÃO ANDROID ===");

  try {
    // 0. Configurar JDK portátil na execução
    const localJavaHome = path.join(process.cwd(), "jdk-17");
    console.log(`Configurando JAVA_HOME para: ${localJavaHome}`);
    process.env.JAVA_HOME = localJavaHome;
    process.env.PATH = `${path.join(localJavaHome, "bin")}:${process.env.PATH}`;

    console.log("Verificando se Java do JDK portátil está ativo...");
    try {
      const javaVersion = execSync("java -version", { encoding: "utf8", stdio: "pipe" });
      console.log("Java detectado:\n", javaVersion);
    } catch (e: any) {
      console.log("Aviso ao obter versão do Java:", e.message);
    }

    // 1. Criar diretórios de saída
    console.log("Criando pastas de destino se não existirem...");
    const pathsToCreate = [
      path.join(process.cwd(), "build-outputs"),
      path.join(process.cwd(), "APK_DOWNLOAD")
    ];
    for (const p of pathsToCreate) {
      if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
        console.log(`Pasta criada: ${p}`);
      } else {
        console.log(`Pasta já existe: ${p}`);
      }
    }

    // 2. Executar compilação Web (Vite build)
    console.log("Executando compilação do frontend web de produção (Vite)...");
    execSync("npm run build", { stdio: "inherit" });
    console.log("Compilação web concluída!");

    // 3. Executar Capacitor Sync para copiar arquivos para o projeto Android
    console.log("Sincronizando assets web com o projeto Android utilizando Capacitor...");
    execSync("npx cap sync android", { stdio: "inherit" });
    console.log("Sincronização do Capacitor concluída!");

    // 4. Modificar permissões do Gradle Wrapper se necessário
    const gradleDir = path.join(process.cwd(), "android");
    const gradlewPath = path.join(gradleDir, "gradlew");
    if (fs.existsSync(gradlewPath)) {
      console.log("Tornando o gradle wrapper executável...");
      try {
        fs.chmodSync(gradlewPath, "755");
        console.log("Permissões de execução aplicadas ao gradlew!");
      } catch (e: any) {
        console.log("Aviso ao dar permissões ao gradlew:", e.message);
      }
    } else {
      throw new Error(`Gradle wrapper não encontrado em: ${gradlewPath}`);
    }

    // 5. Compilar o projeto do Android
    console.log("Executando compilação Gradle (assembleDebug)...");
    // Usamos spawn ou execSync dentro do diretório do Android
    execSync("./gradlew assembleDebug", {
      cwd: gradleDir,
      stdio: "inherit"
    });
    console.log("Compilação Gradle concluída com sucesso!");

    // 6. Localizar e copiar o APK de depuração
    const expectedApkPath = path.join(gradleDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
    console.log(`Buscando APK compilado em: ${expectedApkPath}`);

    if (fs.existsSync(expectedApkPath)) {
      const stats = fs.statSync(expectedApkPath);
      const sizeMB = stats.size / (1024 * 1024);
      console.log(`Arquivo APK encontrado! Tamanho: ${sizeMB.toFixed(2)} MB (${stats.size} bytes)`);

      if (stats.size === 0) {
        throw new Error("Erro: O APK gerado tem 0 bytes!");
      }

      const dest1Path = path.join(process.cwd(), "build-outputs", "app-debug.apk");
      const dest2Path = path.join(process.cwd(), "APK_DOWNLOAD", "app-debug.apk");

      console.log(`Copiando APK para: ${dest1Path}`);
      fs.copyFileSync(expectedApkPath, dest1Path);

      console.log(`Copiando APK para: ${dest2Path}`);
      fs.copyFileSync(expectedApkPath, dest2Path);

      // Dupla verificação dos destinos
      const stats1 = fs.statSync(dest1Path);
      const stats2 = fs.statSync(dest2Path);

      console.log("=== COMPILAÇÃO E CÓPIA SUCEDIDAS! ===");
      console.log(`Pasta build-outputs/app-debug.apk: ${stats1.size} bytes (${(stats1.size / (1024 * 1024)).toFixed(2)} MB)`);
      console.log(`Pasta APK_DOWNLOAD/app-debug.apk: ${stats2.size} bytes (${(stats2.size / (1024 * 1024)).toFixed(2)} MB)`);
    } else {
      throw new Error("Erro: O APK não foi encontrado no caminho esperado do Gradle build!");
    }

  } catch (error: any) {
    console.error("ERRO CRÍTICO NA COMPILAÇÃO ANDROID:", error.message || error);
    process.exit(1);
  }
}

main();

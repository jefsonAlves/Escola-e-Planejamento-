import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

async function downloadAndExtractJDK() {
  console.log("=== INICIANDO CONFIGURAÇÃO DO JDK PORTÁTIL ===");

  const jdkDirName = "jdk-17";
  const jdkDestPath = path.join(process.cwd(), jdkDirName);

  if (fs.existsSync(path.join(jdkDestPath, "bin", "java"))) {
    console.log(`JDK portátil já está instalado em: ${jdkDestPath}`);
    return;
  }

  // URL para download do JDK 17 do Adoptium (Eclipse Temurin) - Linux x64
  const jdkUrl = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_x64_linux_hotspot_17.0.10_7.tar.gz";
  const tempTarGz = path.join(process.cwd(), "jdk.tar.gz");

  try {
    console.log(`Baixando Temurin JDK 17 do GitHub...\nURL: ${jdkUrl}`);
    // Utiliza curl para baixar com -L (seguir redirects) e --fail (falhar em caso de erro HTTP)
    execSync(`curl -L --fail -o "${tempTarGz}" "${jdkUrl}"`, { stdio: "inherit" });
    console.log("Download do JDK concluído com sucesso!");

    console.log("Criando diretório temporário para extração...");
    const tempExtractDir = path.join(process.cwd(), "jdk-temp-extract");
    if (fs.existsSync(tempExtractDir)) {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempExtractDir, { recursive: true });

    console.log("Extraindo tar.gz...");
    execSync(`tar -xzf "${tempTarGz}" -C "${tempExtractDir}"`, { stdio: "inherit" });
    console.log("Extração concluída!");

    // Localizar a pasta interna extraída
    const extractedFolders = fs.readdirSync(tempExtractDir);
    const innerFolder = extractedFolders.find(f => f.startsWith("jdk") || fs.statSync(path.join(tempExtractDir, f)).isDirectory());

    if (!innerFolder) {
      throw new Error("Não foi possível encontrar a pasta do JDK dentro do arquivo extraído!");
    }

    const finalPathInTemp = path.join(tempExtractDir, innerFolder);
    console.log(`Pasta interna do JDK identificada: ${finalPathInTemp}`);

    console.log(`Movendo JDK para destino final em: ${jdkDestPath}`);
    if (fs.existsSync(jdkDestPath)) {
      fs.rmSync(jdkDestPath, { recursive: true, force: true });
    }
    fs.renameSync(finalPathInTemp, jdkDestPath);

    // Limpar arquivos temporários
    console.log("Limpando arquivos temporários...");
    if (fs.existsSync(tempTarGz)) {
      fs.unlinkSync(tempTarGz);
    }
    if (fs.existsSync(tempExtractDir)) {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }

    // Verificar se java está funcionando
    const javaBinPath = path.join(jdkDestPath, "bin", "java");
    if (fs.existsSync(javaBinPath)) {
      fs.chmodSync(javaBinPath, "755");
      const javaVerOutput = execSync(`"${javaBinPath}" -version`, { encoding: "utf8" });
      console.log("JDK Instalado com sucesso e funcionando:\n", javaVerOutput);
    } else {
      throw new Error(`O executável do Java não foi encontrado em: ${javaBinPath}`);
    }

  } catch (error: any) {
    console.error("Erro ao instalar o JDK portátil:", error.message || error);
    process.exit(1);
  }
}

downloadAndExtractJDK();

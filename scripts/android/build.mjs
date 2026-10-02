#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prompts = require('prompts');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..', '..');
const androidDir = path.join(projectRoot, 'android');
const apkOutputsBase = path.join(androidDir, 'app', 'build', 'outputs', 'apk');
const aabOutputsBase = path.join(androidDir, 'app', 'build', 'outputs', 'bundle');
const artifactsDir = path.join(projectRoot, 'artifacts');
const appJsonPath = path.join(projectRoot, 'app.json');

const OBJETIVO = {
  APK_DEBUG: 'APK debug (teste rápido, com Google Maps)',
  APK_RELEASE: 'APK release (instalar no dispositivo)',
  AAB_RELEASE: 'AAB release (Play Store)',
  AMBOS_RELEASE: 'APK release + AAB release',
};

const HELP = `
Assistente de build Android do Mapa da Cidade.

  node scripts/android/build.mjs          abre o assistente interativo
  node scripts/android/build.mjs --help   mostra esta ajuda

Objetivos: APK debug, APK release, AAB release ou ambos.
Requer Android SDK (ANDROID_HOME), JDK 17+ e, para instalar, adb com um
dispositivo conectado.
`;

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(HELP.trim());
  process.exit(0);
}

async function askSelect(message, choices, initial = 0) {
  const { value } = await prompts({
    type: 'select',
    name: 'value',
    message,
    choices,
    initial,
  });
  if (value === undefined) {
    throw new Error('Operação cancelada pelo usuário.');
  }
  return value;
}

async function askToggle(message, initial = true) {
  const { value } = await prompts({
    type: 'toggle',
    name: 'value',
    message,
    initial,
    active: 'sim',
    inactive: 'não',
  });
  if (value === undefined) {
    throw new Error('Operação cancelada pelo usuário.');
  }
  return value;
}

async function askNumber(message, initial) {
  const { value } = await prompts({
    type: 'number',
    name: 'value',
    message,
    initial,
    min: 0,
    float: true,
  });
  if (value === undefined) {
    throw new Error('Operação cancelada pelo usuário.');
  }
  return value;
}

async function askText(message, initial) {
  const { value } = await prompts({
    type: 'text',
    name: 'value',
    message,
    initial,
    validate: (input) => (String(input).trim() ? true : 'Informe um valor.'),
  });
  if (value === undefined) {
    throw new Error('Operação cancelada pelo usuário.');
  }
  return String(value).trim();
}

function showProgress(message, step, total) {
  const percentage = Math.round((step / total) * 100);
  const barLength = 20;
  const filled = Math.round((step / total) * barLength);
  const empty = barLength - filled;
  const bar = `${'='.repeat(filled)}${'-'.repeat(empty)}`;

  process.stdout.write(`\r[${bar}] ${percentage}% ${message}`);
}

function finishProgress(message) {
  process.stdout.write(`\r${message}\n`);
}

function runCommand(command, args, cwd, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: capture ? 'pipe' : 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  const stdout = result.stdout?.toString() || '';
  const stderr = result.stderr?.toString() || '';
  const combinedOutput = `${stdout}${stderr}`.trim();

  if (result.status !== 0) {
    if (capture && combinedOutput) {
      console.error(combinedOutput);
    }
    throw new Error(`Falha ao executar: ${command} ${args.join(' ')}`);
  }

  return { ...result, combinedOutput };
}

function findArtifact(baseDir, extension, variant) {
  if (!fs.existsSync(baseDir)) {
    return null;
  }

  const candidates = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        candidates.push(fullPath);
      }
    }
  }

  walk(baseDir);

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  return (
    candidates.find((file) => file.toLowerCase().includes(variant.toLowerCase())) ||
    candidates[0]
  );
}

function resolveAdbPath() {
  const executable = process.platform === 'win32' ? 'adb.exe' : 'adb';

  const result = spawnSync(executable, ['version'], {
    stdio: 'pipe',
    shell: false,
  });

  if (result.status === 0) {
    return executable;
  }

  throw new Error('ADB não encontrado no PATH. Instale Android Platform Tools.');
}

function ensureDeviceConnected(adbPath) {
  console.log('Verificando dispositivo Android conectado...');

  const result = spawnSync(adbPath, ['devices'], {
    cwd: projectRoot,
    stdio: 'pipe',
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error('Falha ao consultar dispositivos ADB.');
  }

  const output = `${result.stdout || ''}${result.stderr || ''}`;

  const devices = output
    .split('\n')
    .filter((line) => line.includes('\tdevice') || line.includes('\tunauthorized'));

  if (devices.length === 0) {
    throw new Error('Nenhum dispositivo Android encontrado.');
  }

  if (!devices.some((line) => line.includes('\tdevice'))) {
    throw new Error('Dispositivo encontrado, mas não autorizado.');
  }

  return devices.find((line) => line.includes('\tdevice')).split('\t')[0];
}

function getPackageName() {
  if (!fs.existsSync(appJsonPath)) {
    return null;
  }

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  return appJson.expo?.android?.package || null;
}

function readVersionInfo() {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  return {
    versionName: appJson.expo?.version || '1.0.0',
    versionCode: appJson.expo?.android?.versionCode ?? 1,
  };
}

function writeVersionInfo(versionName, versionCode) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  if (versionName) {
    appJson.expo.version = versionName;
  }

  if (versionCode != null) {
    appJson.expo.android = appJson.expo.android || {};
    appJson.expo.android.versionCode = versionCode;
  }

  fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);
}

/** Lê apenas os nomes das chaves, sem imprimir valores, para validar o setup do Google Maps. */
function readEnvKeys() {
  const files = ['.env.local', '.env.development.local', '.env.development', '.env'];
  const keys = new Set();

  for (const file of files) {
    const fullPath = path.join(projectRoot, file);
    if (!fs.existsSync(fullPath)) continue;

    for (const line of fs.readFileSync(fullPath, 'utf8').split('\n')) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (match) keys.add(match[1]);
    }
  }

  return keys;
}

function checkToolchain() {
  if (!fs.existsSync(appJsonPath)) {
    throw new Error('app.json não encontrado. Rode o script a partir do projeto Expo.');
  }

  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!sdk || !fs.existsSync(sdk)) {
    throw new Error(
      'ANDROID_HOME não aponta para um SDK válido. Instale o Android SDK e defina ANDROID_HOME.'
    );
  }

  const java = spawnSync('java', ['-version'], { encoding: 'utf8' });
  if (java.status !== 0) {
    throw new Error('Java não encontrado no PATH. O Gradle do React Native exige JDK 17 ou superior.');
  }

  const versionOutput = `${java.stderr || ''}${java.stdout || ''}`;
  const major = Number(versionOutput.match(/version "(\d+)/)?.[1] ?? 0);
  if (major && major < 17) {
    throw new Error(`JDK ${major} encontrado, mas o React Native 0.86 exige JDK 17 ou superior.`);
  }

  if (!readEnvKeys().has('GOOGLE_MAPS_API_KEY')) {
    console.warn(
      '\n[aviso] GOOGLE_MAPS_API_KEY não encontrada no .env/.env.local.\n' +
        '        O APK vai funcionar, mas o mapa ficará PRETO no Android.\n' +
        '        Crie a chave em https://console.cloud.google.com/apis/credentials\n' +
        '        (Maps SDK for Android, restrita a ' +
        (getPackageName() || 'android.package') +
        ' + SHA-1).\n'
    );
  }
}

async function promptVersion() {
  const { versionName, versionCode } = readVersionInfo();
  const current = `${versionName} (versionCode ${versionCode})`;

  const shouldBump = await askToggle(
    `Deseja alterar a versão antes de buildar? Atual: ${current}`,
    false
  );

  if (!shouldBump) {
    return { changed: false, versionName, versionCode };
  }

  const newName = await askText('Versão (versionName):', versionName);
  const newCode = await askNumber('VersionCode:', Number(versionCode));

  if (Number.isNaN(Number(newCode))) {
    throw new Error('VersionCode precisa ser um número.');
  }

  writeVersionInfo(newName, Number(newCode));

  console.log(`Versão atualizada para ${newName} (versionCode ${newCode}).`);

  return { changed: true, versionName: newName, versionCode: Number(newCode) };
}

async function selectObjetivo() {
  return askSelect(
    'Qual é o objetivo da build?',
    [
      { title: OBJETIVO.APK_DEBUG, value: 'apk-debug' },
      { title: OBJETIVO.APK_RELEASE, value: 'apk-release' },
      { title: OBJETIVO.AAB_RELEASE, value: 'aab-release' },
      { title: OBJETIVO.AMBOS_RELEASE, value: 'ambos-release' },
    ],
    0
  );
}

function runPrebuild(clean = false) {
  console.log('\nExecutando prebuild do Expo para Android...');

  const prebuildCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  const prebuildArgs = ['expo', 'prebuild', '--platform', 'android', '--no-install'];
  if (clean) prebuildArgs.push('--clean');

  runCommand(prebuildCommand, prebuildArgs, projectRoot);

  const gradlewPath = path.join(androidDir, 'gradlew');
  if (process.platform !== 'win32' && fs.existsSync(gradlewPath)) {
    fs.chmodSync(gradlewPath, 0o755);
  }
}

function runGradle(tasks) {
  const gradleWrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

  console.log(`\nExecutando Gradle: ${tasks.join(' ')}...`);

  runCommand(gradleWrapper, tasks, androidDir);
}

function copyToArtifacts(sourcePath, fileName) {
  fs.mkdirSync(artifactsDir, { recursive: true });

  const dest = path.join(artifactsDir, fileName);
  fs.copyFileSync(sourcePath, dest);

  const sizeMb = (fs.statSync(dest).size / (1024 * 1024)).toFixed(1);
  console.log(`Arquivo gerado em: ${dest} (${sizeMb} MB)`);

  return dest;
}

function buildApkVariant(variant, versionName) {
  const isDebug = variant === 'debug';

  const gradleTask = isDebug ? 'assembleDebug' : 'assembleRelease';
  runGradle([gradleTask]);

  const outputDir = isDebug
    ? path.join(apkOutputsBase, 'debug')
    : path.join(apkOutputsBase, 'release');

  const apkPath = findArtifact(outputDir, '.apk', variant);

  if (!apkPath) {
    throw new Error(`APK ${variant} não encontrado em ${outputDir}`);
  }

  const safeName = versionName ? `-${versionName}` : '';

  return copyToArtifacts(apkPath, `app-${variant}${safeName}.apk`);
}

function buildAabRelease(versionName) {
  runGradle(['bundleRelease']);

  const outputDir = path.join(aabOutputsBase, 'release');
  const aabPath = findArtifact(outputDir, '.aab', 'release');

  if (!aabPath) {
    throw new Error(`AAB não encontrado em ${outputDir}`);
  }

  const safeName = versionName ? `-${versionName}` : '';

  return copyToArtifacts(aabPath, `app-release${safeName}.aab`);
}

async function installApk(apkPath, packageName) {
  const adbPath = resolveAdbPath();
  const device = ensureDeviceConnected(adbPath);

  console.log(`Dispositivo conectado: ${device}`);

  const uninstallFirst = await askToggle(
    'Desinstalar a versão anterior antes de instalar?',
    true
  );

  if (uninstallFirst && packageName) {
    console.log(`Removendo instalação anterior do pacote ${packageName}...`);

    const result = spawnSync(adbPath, ['uninstall', packageName], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: false,
    });

    const output = `${result.stdout || ''}${result.stderr || ''}`;
    const notInstalled =
      output.toLowerCase().includes('not installed') ||
      output.toLowerCase().includes('package not found');

    if (result.status !== 0 && !notInstalled) {
      throw new Error(`Falha ao desinstalar aplicativo: ${output.trim()}`);
    }

    if (notInstalled) {
      console.log('Aplicativo anterior não estava instalado.');
    }
  }

  console.log('Instalando APK no dispositivo...');

  const install = runCommand(adbPath, ['install', '-r', '-d', apkPath], projectRoot, {
    capture: true,
  });

  if (/failure|error:/i.test(install.combinedOutput)) {
    throw new Error(`Falha na instalação: ${install.combinedOutput.trim()}`);
  }

  const launch = await askToggle('Deseja abrir o aplicativo após instalar?', false);

  if (launch && packageName) {
    console.log('Abrindo o aplicativo...');
    runCommand(adbPath, ['shell', 'monkey', '-p', packageName, '-c', 'android.intent.category.LAUNCHER', '1'], projectRoot);
  }
}

function printBanner(objetivo, isDebug) {
  const isRelease = !isDebug;
  const tipo = isRelease ? 'RELEASE' : 'DEBUG';

  console.log(`\n=== Build Android em modo ${tipo} ===`);
  console.log(`Objetivo: ${objetivo}\n`);
}

function printDebugKeystoreHint() {
  const keystore = path.join(os.homedir(), '.android', 'debug.keystore');

  console.log('\nPara o Google Maps aceitar o APK debug, a chave precisa do SHA-1 de:');
  console.log(`  ${keystore}`);
  console.log(
    '  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android\n'
  );
}

async function main() {
  console.log('Bem-vindo ao assistente de build Android do Mapa da Cidade.\n');

  checkToolchain();

  const objetivo = await selectObjetivo();

  const isDebug = objetivo === 'apk-debug';
  const precisaApk =
    objetivo === 'apk-debug' ||
    objetivo === 'apk-release' ||
    objetivo === 'ambos-release';

  printBanner(objetivo, isDebug);

  const { versionName } = await promptVersion();

  if (precisaApk) {
    const prebuild = await askToggle('Deseja executar o prebuild do Expo antes?', true);

    if (prebuild) {
      const clean = await askToggle(
        'Limpar e regenerar a pasta android/ (--clean)? Recomendado para aplicar config plugins.',
        true
      );

      runPrebuild(clean);
    } else {
      console.log('Pulando prebuild.');
    }
  } else {
    console.log('Pulando prebuild (AAB build sem alterar native).');
  }

  if (isDebug) {
    printDebugKeystoreHint();
  }

  let apkPath = null;

  showProgress(`Preparando build ${isDebug ? 'DEBUG' : 'RELEASE'}`, 1, 3);

  if (objetivo === 'apk-debug') {
    apkPath = buildApkVariant('debug', versionName);
  } else if (objetivo === 'apk-release') {
    apkPath = buildApkVariant('release', versionName);
  } else if (objetivo === 'ambos-release') {
    apkPath = buildApkVariant('release', versionName);
    buildAabRelease(versionName);
  } else if (objetivo === 'aab-release') {
    buildAabRelease(versionName);
  }

  showProgress('Artefatos gerados', 2, 3);

  if (precisaApk) {
    const instalar = await askToggle(
      'Instalar o APK no dispositivo conectado agora?',
      true
    );

    if (instalar) {
      const packageName = getPackageName();
      await installApk(apkPath, packageName);
    } else {
      console.log(`APK mantido em: ${apkPath}`);
    }
  }

  if (!isDebug) {
    console.log(
      '\nNota: o AAB gerado precisa ser enviado manualmente para a Google Play Console.'
    );
  }

  finishProgress('Processo concluído.');
}

main().catch((error) => {
  console.error(`\nErro: ${error.message}`);
  process.exit(1);
});
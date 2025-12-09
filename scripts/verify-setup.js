#!/usr/bin/env node

/**
 * 0단계 프로젝트 설계 검증 스크립트
 * TDD 원칙에 따라 설정이 올바르게 되어 있는지 검증
 */

const fs = require('fs');
const path = require('path');

let errors = [];
let warnings = [];

function checkNodeVersion() {
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion < 22) {
      errors.push(`❌ Node 버전이 22 이상이어야 합니다. 현재: ${nodeVersion}`);
      return false;
    }
    console.log(`✅ Node 버전 확인: ${nodeVersion} (22 이상)`);
    return true;
  } catch (error) {
    errors.push(`❌ Node 버전 확인 실패: ${error.message}`);
    return false;
  }
}

function checkPackageJson() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      errors.push('❌ package.json 파일이 존재하지 않습니다.');
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // 프로젝트 이름 확인
    if (packageJson.name !== 'ocr-web-monorepo') {
      warnings.push(`⚠️  프로젝트 이름이 'ocr-web-monorepo'가 아닙니다: ${packageJson.name}`);
    } else {
      console.log(`✅ 프로젝트 이름 확인: ${packageJson.name}`);
    }

    // workspaces 확인
    if (!packageJson.workspaces || !Array.isArray(packageJson.workspaces)) {
      errors.push('❌ package.json에 workspaces 설정이 없거나 배열이 아닙니다.');
      return false;
    }

    const hasApps = packageJson.workspaces.some((w) => w.includes('apps/*'));
    const hasPackages = packageJson.workspaces.some((w) => w.includes('packages/*'));

    if (!hasApps) {
      errors.push('❌ workspaces에 "apps/*"가 포함되어 있지 않습니다.');
    } else {
      console.log('✅ workspaces에 "apps/*" 포함 확인');
    }

    if (!hasPackages) {
      errors.push('❌ workspaces에 "packages/*"가 포함되어 있지 않습니다.');
    } else {
      console.log('✅ workspaces에 "packages/*" 포함 확인');
    }

    // Node 엔진 확인
    if (!packageJson.engines || !packageJson.engines.node) {
      warnings.push('⚠️  package.json에 engines.node 설정이 없습니다.');
    } else {
      const nodeRequirement = packageJson.engines.node;
      if (!nodeRequirement.includes('22')) {
        warnings.push(`⚠️  Node 엔진 요구사항이 22를 포함하지 않습니다: ${nodeRequirement}`);
      } else {
        console.log(`✅ Node 엔진 요구사항 확인: ${nodeRequirement}`);
      }
    }

    return hasApps && hasPackages;
  } catch (error) {
    errors.push(`❌ package.json 확인 실패: ${error.message}`);
    return false;
  }
}

function checkDirectoryStructure() {
  const requiredDirs = ['apps/web', 'packages/ocr-core'];

  let allExist = true;
  for (const dir of requiredDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      errors.push(`❌ 필수 디렉토리가 없습니다: ${dir}`);
      allExist = false;
    } else {
      console.log(`✅ 디렉토리 확인: ${dir}`);
    }
  }

  return allExist;
}

function checkTsConfigBase() {
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.base.json');
  if (!fs.existsSync(tsConfigPath)) {
    errors.push('❌ tsconfig.base.json 파일이 존재하지 않습니다.');
    return false;
  }

  try {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));

    // 필수 설정 확인
    const requiredOptions = ['target', 'lib', 'module', 'moduleResolution'];
    for (const option of requiredOptions) {
      if (!tsConfig.compilerOptions || !tsConfig.compilerOptions[option]) {
        warnings.push(`⚠️  tsconfig.base.json에 ${option} 설정이 없습니다.`);
      }
    }

    // ES2022 및 DOM lib 확인
    if (tsConfig.compilerOptions?.lib) {
      const libs = tsConfig.compilerOptions.lib;
      if (!libs.includes('ES2022')) {
        warnings.push('⚠️  tsconfig.base.json의 lib에 ES2022가 포함되어 있지 않습니다.');
      }
      if (!libs.includes('DOM')) {
        warnings.push('⚠️  tsconfig.base.json의 lib에 DOM이 포함되어 있지 않습니다.');
      }
    }

    console.log('✅ tsconfig.base.json 파일 확인');
    return true;
  } catch (error) {
    errors.push(`❌ tsconfig.base.json 파싱 실패: ${error.message}`);
    return false;
  }
}

function checkTurboJson() {
  const turboJsonPath = path.join(process.cwd(), 'turbo.json');
  if (!fs.existsSync(turboJsonPath)) {
    warnings.push('⚠️  turbo.json 파일이 존재하지 않습니다. (1단계에서 생성 예정)');
    return false;
  }

  try {
    const turboJson = JSON.parse(fs.readFileSync(turboJsonPath, 'utf-8'));
    if (!turboJson.pipeline) {
      warnings.push('⚠️  turbo.json에 pipeline 설정이 없습니다.');
    } else {
      console.log('✅ turbo.json 파일 확인');
    }
    return true;
  } catch (error) {
    warnings.push(`⚠️  turbo.json 파싱 실패: ${error.message}`);
    return false;
  }
}

// 메인 실행
console.log('\n🔍 0단계 프로젝트 설계 검증 시작...\n');

checkNodeVersion();
checkPackageJson();
checkDirectoryStructure();
checkTsConfigBase();
checkTurboJson();

console.log('\n' + '='.repeat(50));

if (warnings.length > 0) {
  console.log('\n⚠️  경고:');
  warnings.forEach((w) => console.log(`  ${w}`));
}

if (errors.length > 0) {
  console.log('\n❌ 오류:');
  errors.forEach((e) => console.log(`  ${e}`));
  console.log('\n❌ 검증 실패: 일부 항목이 올바르게 설정되지 않았습니다.\n');
  process.exit(1);
} else {
  console.log('\n✅ 모든 검증 통과! 0단계 설계가 올바르게 완료되었습니다.\n');
  process.exit(0);
}

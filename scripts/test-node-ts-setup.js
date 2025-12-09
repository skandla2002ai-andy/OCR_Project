#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, no-undef, no-console */

/**
 * 1-2 Red: Node 22 & TS 공통 설정 검증 테스트
 */

const fs = require('fs');
const path = require('path');

let errors = [];
let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    const result = fn();
    if (result) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      errors.push(name);
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    errors.push(`${name}: ${error.message}`);
  }
}

console.log('\n🧪 1-2 Red: Node 22 & TS 공통 설정 검증 테스트\n');

// Test 1: Node 버전이 22 이상인지 확인
test('Node 버전이 22 이상', () => {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  return majorVersion >= 22;
});

// Test 2: package.json에 engines.node 설정 확인
test('package.json에 engines.node 설정 (>=22)', () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  if (!packageJson.engines || !packageJson.engines.node) {
    return false;
  }

  const nodeRequirement = packageJson.engines.node;
  return nodeRequirement.includes('22') || nodeRequirement.includes('>=22');
});

// Test 3: tsconfig.base.json 파일 존재 확인
test('tsconfig.base.json 파일 존재', () => {
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.base.json');
  return fs.existsSync(tsConfigPath);
});

// Test 4: tsconfig.base.json에 필수 설정 확인
test('tsconfig.base.json에 target 설정 (ES2022)', () => {
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.base.json');
  const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));
  return tsConfig.compilerOptions && tsConfig.compilerOptions.target === 'ES2022';
});

test('tsconfig.base.json에 lib 설정 (ES2022, DOM)', () => {
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.base.json');
  const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));
  const libs = tsConfig.compilerOptions?.lib || [];
  return libs.includes('ES2022') && libs.includes('DOM');
});

test('tsconfig.base.json에 moduleResolution 설정', () => {
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.base.json');
  const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));
  return tsConfig.compilerOptions && tsConfig.compilerOptions.moduleResolution !== undefined;
});

test('tsconfig.base.json에 strict 모드 설정', () => {
  const tsConfigPath = path.join(process.cwd(), 'tsconfig.base.json');
  const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));
  return tsConfig.compilerOptions && tsConfig.compilerOptions.strict === true;
});

console.log('\n' + '='.repeat(50));
console.log(`\n테스트 결과: ${passed}/${total} 통과`);

if (errors.length > 0) {
  console.log('\n❌ 실패한 테스트:');
  errors.forEach((e) => console.log(`  - ${e}`));
  console.log('\n❌ Red 단계 실패: 일부 테스트가 실패했습니다.\n');
  process.exit(1);
} else {
  console.log('\n✅ 모든 테스트 통과! Green 단계로 진행할 수 있습니다.\n');
  process.exit(0);
}

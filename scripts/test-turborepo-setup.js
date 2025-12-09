#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, no-undef, no-console */

/**
 * 1-1 Red: Turborepo 워크스페이스 초기화 검증 테스트
 * package.json의 workspaces 설정과 turbo.json을 검증
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

console.log('\n🧪 1-1 Red: Turborepo 워크스페이스 초기화 검증 테스트\n');

// Test 1: package.json의 workspaces에 apps/* 포함 확인
test('package.json의 workspaces에 "apps/*" 포함', () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json 파일이 존재하지 않습니다.');
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  if (!packageJson.workspaces || !Array.isArray(packageJson.workspaces)) {
    return false;
  }

  return packageJson.workspaces.some((w) => w === 'apps/*' || w.includes('apps/*'));
});

// Test 2: package.json의 workspaces에 packages/* 포함 확인
test('package.json의 workspaces에 "packages/*" 포함', () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  if (!packageJson.workspaces || !Array.isArray(packageJson.workspaces)) {
    return false;
  }

  return packageJson.workspaces.some((w) => w === 'packages/*' || w.includes('packages/*'));
});

// Test 3: turbo.json 파일 존재 확인
test('turbo.json 파일 존재', () => {
  const turboJsonPath = path.join(process.cwd(), 'turbo.json');
  return fs.existsSync(turboJsonPath);
});

// Test 4: turbo.json에 pipeline 설정 확인
test('turbo.json에 pipeline 설정 존재', () => {
  const turboJsonPath = path.join(process.cwd(), 'turbo.json');
  if (!fs.existsSync(turboJsonPath)) {
    return false;
  }

  const turboJson = JSON.parse(fs.readFileSync(turboJsonPath, 'utf-8'));
  return turboJson.pipeline !== undefined && typeof turboJson.pipeline === 'object';
});

// Test 5: turbo.json에 build, lint, test, dev 파이프라인 확인
test('turbo.json에 build 파이프라인 정의', () => {
  const turboJsonPath = path.join(process.cwd(), 'turbo.json');
  const turboJson = JSON.parse(fs.readFileSync(turboJsonPath, 'utf-8'));
  return turboJson.pipeline && turboJson.pipeline.build !== undefined;
});

test('turbo.json에 lint 파이프라인 정의', () => {
  const turboJsonPath = path.join(process.cwd(), 'turbo.json');
  const turboJson = JSON.parse(fs.readFileSync(turboJsonPath, 'utf-8'));
  return turboJson.pipeline && turboJson.pipeline.lint !== undefined;
});

test('turbo.json에 test 파이프라인 정의', () => {
  const turboJsonPath = path.join(process.cwd(), 'turbo.json');
  const turboJson = JSON.parse(fs.readFileSync(turboJsonPath, 'utf-8'));
  return turboJson.pipeline && turboJson.pipeline.test !== undefined;
});

test('turbo.json에 dev 파이프라인 정의', () => {
  const turboJsonPath = path.join(process.cwd(), 'turbo.json');
  const turboJson = JSON.parse(fs.readFileSync(turboJsonPath, 'utf-8'));
  return turboJson.pipeline && turboJson.pipeline.dev !== undefined;
});

// Test 6: package.json scripts에 turbo 명령어 확인
test('package.json scripts에 dev 명령어 (turbo run dev)', () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return (
    packageJson.scripts && packageJson.scripts.dev && packageJson.scripts.dev.includes('turbo')
  );
});

test('package.json scripts에 build 명령어 (turbo run build)', () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return (
    packageJson.scripts && packageJson.scripts.build && packageJson.scripts.build.includes('turbo')
  );
});

test('package.json scripts에 test 명령어 (turbo run test)', () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return (
    packageJson.scripts && packageJson.scripts.test && packageJson.scripts.test.includes('turbo')
  );
});

test('package.json scripts에 lint 명령어 (turbo run lint)', () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return (
    packageJson.scripts && packageJson.scripts.lint && packageJson.scripts.lint.includes('turbo')
  );
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

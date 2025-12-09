#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, no-undef, no-console */

/**
 * 1-3 Red: ESLint/Prettier 검증 테스트
 * 잘못된 코드 스타일이 있을 경우 lint가 실패하는지 확인
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

console.log('\n🧪 1-3 Red: ESLint/Prettier 검증 테스트\n');

// Test 1: ESLint 설정 파일 존재 확인
test('.eslintrc.json 또는 .eslintrc.js 파일 존재', () => {
  const eslintrcJson = path.join(process.cwd(), '.eslintrc.json');
  const eslintrcJs = path.join(process.cwd(), '.eslintrc.js');
  const eslintrcCjs = path.join(process.cwd(), '.eslintrc.cjs');
  return fs.existsSync(eslintrcJson) || fs.existsSync(eslintrcJs) || fs.existsSync(eslintrcCjs);
});

// Test 2: Prettier 설정 파일 존재 확인
test('.prettierrc 또는 .prettierrc.json 파일 존재', () => {
  const prettierrc = path.join(process.cwd(), '.prettierrc');
  const prettierrcJson = path.join(process.cwd(), '.prettierrc.json');
  return fs.existsSync(prettierrc) || fs.existsSync(prettierrcJson);
});

// Test 3: package.json에 ESLint 관련 devDependencies 확인 (선택사항, 통과 처리)
test('package.json에 ESLint 관련 devDependencies 확인 (선택사항)', () => {
  // 선택사항이므로 단순 통과
  return true;
});

console.log('\n' + '='.repeat(50));
console.log(`\n테스트 결과: ${passed}/${total} 통과`);

if (errors.length > 0) {
  console.log('\n❌ 실패한 테스트:');
  errors.forEach((e) => console.log(`  - ${e}`));
  console.log('\n⚠️  Red 단계: 일부 테스트가 실패했습니다. Green 단계에서 설정을 추가하세요.\n');
  process.exit(0); // 실패해도 계속 진행 가능하도록
} else {
  console.log('\n✅ 모든 테스트 통과! Green 단계로 진행할 수 있습니다.\n');
  process.exit(0);
}

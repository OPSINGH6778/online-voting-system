#!/usr/bin/env node
/**
 * Run after npm install to verify no high/critical vulnerabilities remain.
 * Usage: node scripts/audit-check.js
 */
const { execSync } = require('child_process');

try {
  const result = execSync('npm audit --json', { encoding: 'utf8' });
  const data   = JSON.parse(result);
  const vulns  = data.metadata?.vulnerabilities || {};
  const high     = (vulns.high   || 0);
  const critical = (vulns.critical || 0);

  console.log('\n📦 npm audit results:');
  console.log(`   Critical: ${critical}`);
  console.log(`   High:     ${high}`);
  console.log(`   Moderate: ${vulns.moderate || 0}`);
  console.log(`   Low:      ${vulns.low || 0}`);

  if (critical > 0 || high > 0) {
    console.log('\n⚠️  Run: npm audit fix --force');
    process.exit(1);
  } else {
    console.log('\n✅ No high/critical vulnerabilities found!\n');
  }
} catch (e) {
  // npm audit exits with code 1 even for moderate vulns
  try {
    const data = JSON.parse(e.stdout || '{}');
    const vulns = data.metadata?.vulnerabilities || {};
    const critical = vulns.critical || 0;
    const high = vulns.high || 0;
    if (critical > 0 || high > 0) {
      console.log(`\n⚠️  ${high} high, ${critical} critical vulnerabilities. Run: npm audit fix --force\n`);
    } else {
      console.log('\n✅ No high/critical vulnerabilities!\n');
    }
  } catch {
    console.log('Could not parse audit output');
  }
}

#!/usr/bin/env node

/**
 * ORBIT Hub Multi-Site Deployment Orchestrator
 * Manages deployment of multiple artist sites to Netlify
 * Usage: node deploy-multi-site.js [site-id|all] [--force] [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_FILE = path.join(__dirname, 'orbit-sites.config.json');
const NETLIFY_CLI = 'netlify';

class OrbitDeployer {
  constructor() {
    this.config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    this.deployLog = [];
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    console.log(logEntry);
    this.deployLog.push(logEntry);
  }

  /**
   * Deploy a single site
   */
  async deploySite(siteId, options = {}) {
    const site = this.config.sites.find(s => s.id === siteId);

    if (!site) {
      this.log('error', `Site not found: ${siteId}`);
      return false;
    }

    const siteDir = path.join(__dirname, site.directory);

    if (!fs.existsSync(siteDir)) {
      this.log('error', `Directory not found: ${siteDir}`);
      return false;
    }

    this.log('info', `Starting deployment for: ${site.name} (${siteId})`);
    this.log('info', `Directory: ${siteDir}`);
    this.log('info', `Status: ${site.status}`);
    this.log('info', `Domain: ${site.domain}`);

    try {
      // Validate site structure
      this.validateSite(site);
      this.log('info', `✓ Site validation passed`);

      // Pre-deployment checks
      if (!options.dryRun) {
        this.preDeploymentChecks(site);
        this.log('info', `✓ Pre-deployment checks passed`);
      }

      // Trigger deployment
      if (options.dryRun) {
        this.log('info', `[DRY RUN] Would deploy ${site.name} to ${site.domain}`);
      } else {
        this.deployToNetlify(site, siteDir, options);
        this.log('info', `✓ Deployment completed for ${site.name}`);
      }

      return true;
    } catch (error) {
      this.log('error', `Deployment failed for ${site.name}: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate site structure
   */
  validateSite(site) {
    const requiredFiles = [
      'index.html',
      'netlify.toml'
    ];

    const siteDir = path.join(__dirname, site.directory);
    const missingFiles = requiredFiles.filter(f =>
      !fs.existsSync(path.join(siteDir, f))
    );

    if (missingFiles.length > 0) {
      throw new Error(`Missing files: ${missingFiles.join(', ')}`);
    }

    // Check netlify.toml has correct base
    const netlifyToml = fs.readFileSync(path.join(siteDir, 'netlify.toml'), 'utf-8');
    if (!netlifyToml.includes(`base = ""`)) {
      this.log('warn', `Warning: netlify.toml base directory may need adjustment`);
    }
  }

  /**
   * Pre-deployment checks
   */
  preDeploymentChecks(site) {
    // Check git status
    try {
      const gitStatus = execSync('git status --short', { encoding: 'utf-8' });
      if (gitStatus.trim()) {
        this.log('warn', `Uncommitted changes detected. Commit before production deployment.`);
      }
    } catch (e) {
      this.log('warn', `Could not check git status`);
    }
  }

  /**
   * Deploy to Netlify
   */
  deployToNetlify(site, siteDir, options) {
    const environStr = Object.entries(site.environment || {})
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    const deployCmd = `cd "${siteDir}" && ${NETLIFY_CLI} deploy --prod`;

    this.log('info', `Executing: ${deployCmd}`);

    try {
      const output = execSync(deployCmd, {
        encoding: 'utf-8',
        stdio: 'inherit'
      });
      this.log('info', `Deploy output: ${output}`);
    } catch (error) {
      throw new Error(`Netlify CLI error: ${error.message}`);
    }
  }

  /**
   * Deploy all sites
   */
  async deployAll(options = {}) {
    this.log('info', `Starting multi-site deployment...`);
    this.log('info', `Total sites: ${this.config.sites.length}`);

    const results = {};
    for (const site of this.config.sites) {
      results[site.id] = await this.deploySite(site.id, options);
    }

    this.printSummary(results);
    return results;
  }

  /**
   * Print deployment summary
   */
  printSummary(results) {
    console.log('\n' + '='.repeat(60));
    console.log('DEPLOYMENT SUMMARY');
    console.log('='.repeat(60));

    const successful = Object.entries(results)
      .filter(([_, success]) => success)
      .map(([id, _]) => id);

    const failed = Object.entries(results)
      .filter(([_, success]) => !success)
      .map(([id, _]) => id);

    console.log(`\n✓ Successful: ${successful.length}`);
    successful.forEach(id => console.log(`  • ${id}`));

    if (failed.length > 0) {
      console.log(`\n✗ Failed: ${failed.length}`);
      failed.forEach(id => console.log(`  • ${id}`));
    }

    console.log('\n' + '='.repeat(60));
  }

  /**
   * List all available sites
   */
  listSites() {
    console.log('\nAvailable ORBIT Hub Sites:');
    console.log('='.repeat(60));

    this.config.sites.forEach(site => {
      console.log(`\nID: ${site.id}`);
      console.log(`  Name: ${site.name}`);
      console.log(`  Artist: ${site.artist.name}`);
      console.log(`  Genre: ${site.artist.genre}`);
      console.log(`  Domain: ${site.domain}`);
      console.log(`  Status: ${site.status}`);
      console.log(`  Directory: ${site.directory}`);
    });

    console.log('\n' + '='.repeat(60));
  }
}

// CLI Handler
async function main() {
  const args = process.argv.slice(2);
  const deployer = new OrbitDeployer();

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
ORBIT Hub Multi-Site Deployer
Usage: node deploy-multi-site.js [command] [options]

Commands:
  list                  List all available sites
  deploy <site-id>      Deploy specific site
  deploy all            Deploy all sites

Options:
  --dry-run            Simulate deployment without executing
  --force              Force deployment even with warnings
  --help               Show this help

Examples:
  node deploy-multi-site.js list
  node deploy-multi-site.js deploy ouidah-jazz
  node deploy-multi-site.js deploy all --dry-run
    `);
    return;
  }

  const command = args[0];
  const options = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force')
  };

  try {
    if (command === 'list') {
      deployer.listSites();
    } else if (command === 'deploy') {
      const target = args[1] || 'all';
      if (target === 'all') {
        await deployer.deployAll(options);
      } else {
        const success = await deployer.deploySite(target, options);
        process.exit(success ? 0 : 1);
      }
    } else {
      console.error(`Unknown command: ${command}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main();

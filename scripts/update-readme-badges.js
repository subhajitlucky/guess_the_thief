#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 🕵️ Guess the Thief - README Badge Updater
 * Automatically updates progress badges in README.md
 */

console.log('🔄 Updating README badges...\n');

// Read progress data
let progressData;
try {
  const dataPath = path.join(__dirname, '..', 'progress-data.json');
  progressData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (e) {
  console.log('❌ Error reading progress data. Run `npm run progress` first.');
  process.exit(1);
}

// Read current README
let readmeContent;
try {
  const readmePath = path.join(__dirname, '..', 'README.md');
  readmeContent = fs.readFileSync(readmePath, 'utf8');
} catch (e) {
  console.log('❌ Error reading README.md');
  process.exit(1);
}

// Define badge update mappings
const badgeUpdates = [
  {
    name: 'Progress Badge',
    pattern: /!\[Progress\]\(https:\/\/img\.shields\.io\/badge\/Progress-\d+%25-\w+\?style=for-the-badge&logo=github\)/,
    replacement: () => {
      const progress = progressData.totalProgress;
      const color = progress >= 80 ? 'brightgreen' : 
                   progress >= 60 ? 'green' : 
                   progress >= 40 ? 'yellow' : 
                   progress >= 20 ? 'orange' : 'red';
      return `![Progress](https://img.shields.io/badge/Progress-${progress}%25-${color}?style=for-the-badge&logo=github)`;
    }
  },
  {
    name: 'Dev Metrics Table',
    pattern: /\| 43% +\| \d+ days +\| \d+\/\d+ +\| \d+\/\d+ +\|/,
    replacement: () => {
      return `| ${progressData.totalProgress}% | ${progressData.devStreak} days | ${progressData.completedFeatures}/${progressData.totalFeatures} | 0/12 |`;
    }
  },
  {
    name: 'Overall Progress Bar',
    pattern: /\*\*Overall Completion:\*\* `[█▓░]+` \*\*\d+%\*\*/,
    replacement: () => {
      const progress = progressData.totalProgress;
      const filledBlocks = Math.floor(progress / 5); // 20 total blocks, each represents 5%
      const emptyBlocks = 20 - filledBlocks;
      const progressBar = '█'.repeat(filledBlocks) + '▓'.repeat(Math.min(2, emptyBlocks)) + '░'.repeat(Math.max(0, emptyBlocks - 2));
      return `**Overall Completion:** \`${progressBar}\` **${progress}%**`;
    }
  }
];

let updatedContent = readmeContent;
let updatesCount = 0;

// Apply updates
badgeUpdates.forEach(update => {
  if (update.pattern.test(updatedContent)) {
    updatedContent = updatedContent.replace(update.pattern, update.replacement());
    console.log(`✅ Updated: ${update.name}`);
    updatesCount++;
  } else {
    console.log(`⚠️ Pattern not found: ${update.name}`);
  }
});

// Write updated README
if (updatesCount > 0) {
  try {
    const readmePath = path.join(__dirname, '..', 'README.md');
    fs.writeFileSync(readmePath, updatedContent);
    console.log(`\n🎉 Successfully updated ${updatesCount} badges in README.md`);
  } catch (e) {
    console.log('❌ Error writing README.md');
    process.exit(1);
  }
} else {
  console.log('\n📝 No badges needed updating');
}

// Summary
console.log('\n📊 CURRENT METRICS');
console.log('='.repeat(50));
console.log(`📈 Progress: ${progressData.totalProgress}%`);
console.log(`🎯 Features: ${progressData.completedFeatures}/${progressData.totalFeatures}`);
console.log(`🏗️ Phases: ${progressData.completedPhases}/${progressData.totalPhases}`);
console.log(`🔥 Dev Streak: ${progressData.devStreak} days`);
console.log(`🌐 Socket Events: ${progressData.stats.socketEvents}`);

console.log('\n✨ README badges are now up to date!'); 
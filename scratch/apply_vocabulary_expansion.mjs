import fs from 'node:fs';
import path from 'node:path';

const CATEGORIES = [
  { file: 'greetings.js', varName: 'GREETINGS_VOCABULARY', partFile: 'part1_greetings.mjs', expVar: 'greetingsNew', cat: 'greetings', origCount: 22, addCount: 28 },
  { file: 'everyday.js', varName: 'EVERYDAY_VOCABULARY', partFile: 'part2_everyday.mjs', expVar: 'everydayNew', cat: 'everyday', origCount: 24, addCount: 26 },
  { file: 'numbers.js', varName: 'NUMBERS_VOCABULARY', partFile: 'part3_numbers.mjs', expVar: 'numbersNew', cat: 'numbers', origCount: 24, addCount: 26 },
  { file: 'food.js', varName: 'FOOD_VOCABULARY', partFile: 'part4_food.mjs', expVar: 'foodNew', cat: 'food', origCount: 24, addCount: 26 },
  { file: 'travel.js', varName: 'TRAVEL_VOCABULARY', partFile: 'part5_travel.mjs', expVar: 'EXPANDED_TRAVEL', cat: 'travel', origCount: 24, addCount: 26 },
  { file: 'shopping.js', varName: 'SHOPPING_VOCABULARY', partFile: 'part6_shopping.mjs', expVar: 'EXPANDED_SHOPPING', cat: 'shopping', origCount: 24, addCount: 26 },
  { file: 'questions.js', varName: 'QUESTIONS_VOCABULARY', partFile: 'part7_questions.mjs', expVar: 'EXPANDED_QUESTIONS', cat: 'questions', origCount: 22, addCount: 28 },
  { file: 'sentences.js', varName: 'SENTENCES_VOCABULARY', partFile: 'part8_sentences.mjs', expVar: 'EXPANDED_SENTENCES', cat: 'sentences', origCount: 24, addCount: 26 },
  { file: 'family.js', varName: 'FAMILY_VOCABULARY', partFile: 'part9_family.mjs', expVar: 'EXPANDED_FAMILY', cat: 'family', origCount: 22, addCount: 28 },
  { file: 'time.js', varName: 'TIME_VOCABULARY', partFile: 'part10_time.mjs', expVar: 'EXPANDED_TIME', cat: 'time', origCount: 22, addCount: 28 },
  { file: 'directions.js', varName: 'DIRECTIONS_VOCABULARY', partFile: 'part11_directions.mjs', expVar: 'EXPANDED_DIRECTIONS', cat: 'directions', origCount: 22, addCount: 28 },
  { file: 'verbs.js', varName: 'VERBS_VOCABULARY', partFile: 'part12_verbs.mjs', expVar: 'EXPANDED_VERBS', cat: 'verbs', origCount: 26, addCount: 24 },
  { file: 'home.js', varName: 'HOME_VOCABULARY', partFile: 'part13_home.mjs', expVar: 'EXPANDED_HOME', cat: 'home', origCount: 20, addCount: 30 },
  { file: 'health.js', varName: 'HEALTH_VOCABULARY', partFile: 'part14_health.mjs', expVar: 'EXPANDED_HEALTH', cat: 'health', origCount: 20, addCount: 30 },
  { file: 'work.js', varName: 'WORK_VOCABULARY', partFile: 'part15_work.mjs', expVar: 'EXPANDED_WORK', cat: 'work', origCount: 20, addCount: 30 },
];

const REQUIRED_LANGS = ['Telugu', 'Tamil', 'Hindi', 'Malayalam', 'Marathi', 'Tulu', 'English'];
const FORBIDDEN_LANGS = ['Bengali', 'Urdu'];

async function run() {
  console.log('=== Starting Vocabulary Expansion Validation & Application ===\n');

  const allMergedVocab = [];
  const allIds = new Set();
  const fileUpdates = [];

  for (const info of CATEGORIES) {
    const vocabFilePath = path.resolve('src/data/vocab', info.file);
    const partFilePath = path.resolve('scratch', info.partFile);

    const origMod = await import(`file://${vocabFilePath}?t=${Date.now()}`);
    const origList = origMod[info.varName];

    if (!Array.isArray(origList)) {
      throw new Error(`Original vocabulary array not found in ${info.file}: ${info.varName}`);
    }

    if (origList.length !== info.origCount) {
      throw new Error(`Expected ${info.origCount} original items in ${info.file}, found ${origList.length}`);
    }

    const partMod = await import(`file://${partFilePath}?t=${Date.now()}`);
    const addList = partMod[info.expVar];

    if (!Array.isArray(addList)) {
      throw new Error(`Expansion array not found in ${info.partFile}: ${info.expVar}`);
    }

    if (addList.length !== info.addCount) {
      throw new Error(`Expected ${info.addCount} new items in ${info.partFile}, found ${addList.length}`);
    }

    const expectedCategory = origList[0].category;

    // Ensure all added items have the exact same category as the original items
    for (const item of addList) {
      item.category = expectedCategory;
    }

    // Merge
    const merged = [...origList, ...addList];
    if (merged.length !== 50) {
      throw new Error(`Merged total for ${info.file} is ${merged.length}, expected exactly 50`);
    }

    // Validate every item in the merged list
    const seenCatIds = new Set();
    for (let i = 0; i < merged.length; i++) {
      const item = merged[i];
      const itemDesc = `[${info.cat} item #${i + 1} (${item.id})]`;

      if (!item.id || typeof item.id !== 'string') {
        throw new Error(`${itemDesc} Missing or invalid ID`);
      }
      if (seenCatIds.has(item.id)) {
        throw new Error(`${itemDesc} Duplicate ID within category: ${item.id}`);
      }
      seenCatIds.add(item.id);

      if (allIds.has(item.id)) {
        throw new Error(`${itemDesc} Duplicate ID across vocabulary: ${item.id}`);
      }
      allIds.add(item.id);

      if (item.category !== expectedCategory) {
        throw new Error(`${itemDesc} Category mismatch: expected ${expectedCategory}, got ${item.category}`);
      }

      if (!item.kannada || !item.kannada.trim()) {
        throw new Error(`${itemDesc} Missing kannada text`);
      }
      if (!item.pronunciation || !item.pronunciation.trim()) {
        throw new Error(`${itemDesc} Missing pronunciation text`);
      }
      if (!item.english || !item.english.trim()) {
        throw new Error(`${itemDesc} Missing english text`);
      }

      if (!item.translations || typeof item.translations !== 'object') {
        throw new Error(`${itemDesc} Missing translations object`);
      }
      for (const lang of REQUIRED_LANGS) {
        if (!item.translations[lang] || !item.translations[lang].trim()) {
          throw new Error(`${itemDesc} Missing translation for ${lang}`);
        }
      }
      for (const forbid of FORBIDDEN_LANGS) {
        if (item.translations[forbid]) {
          throw new Error(`${itemDesc} Forbidden unreviewed language in active data: ${forbid}`);
        }
      }

      if (!item.example || typeof item.example !== 'object') {
        throw new Error(`${itemDesc} Missing example object`);
      }
      if (!item.example.kannada || !item.example.kannada.trim()) {
        throw new Error(`${itemDesc} Missing example kannada text`);
      }
      if (!item.example.pronunciation || !item.example.pronunciation.trim()) {
        throw new Error(`${itemDesc} Missing example pronunciation`);
      }
      if (!item.example.english || !item.example.english.trim()) {
        throw new Error(`${itemDesc} Missing example english`);
      }
      if (!item.example.translations || typeof item.example.translations !== 'object') {
        throw new Error(`${itemDesc} Missing example translations object`);
      }
      for (const lang of REQUIRED_LANGS) {
        if (!item.example.translations[lang] || !item.example.translations[lang].trim()) {
          throw new Error(`${itemDesc} Missing example translation for ${lang}`);
        }
      }
      for (const forbid of FORBIDDEN_LANGS) {
        if (item.example.translations[forbid]) {
          throw new Error(`${itemDesc} Forbidden unreviewed language in example: ${forbid}`);
        }
      }
    }

    allMergedVocab.push(...merged);
    fileUpdates.push({
      filePath: vocabFilePath,
      varName: info.varName,
      data: merged,
      catName: info.cat,
      origCount: info.origCount,
      addCount: info.addCount
    });

    console.log(`✓ Category "${info.cat}": ${info.origCount} original + ${info.addCount} added = ${merged.length} total entries.`);
  }

  if (allIds.size !== 750) {
    throw new Error(`Total unique IDs is ${allIds.size}, expected exactly 750!`);
  }
  if (allMergedVocab.length !== 750) {
    throw new Error(`Total vocabulary length is ${allMergedVocab.length}, expected exactly 750!`);
  }

  console.log(`\nAll 15 categories passed schema and uniqueness validation.`);
  console.log(`Total unique IDs: ${allIds.size} / 750.`);

  // Write files
  for (const upd of fileUpdates) {
    const fileContent = `export const ${upd.varName} = ${JSON.stringify(upd.data, null, 2)};\n`;
    fs.writeFileSync(upd.filePath, fileContent, 'utf-8');
    console.log(`Written ${upd.filePath} (${upd.data.length} entries)`);
  }

  console.log('\n=== Application of 750 Vocabulary Entries Completed Successfully! ===');
}

run().catch(err => {
  console.error('\nFAILURE:', err);
  process.exit(1);
});

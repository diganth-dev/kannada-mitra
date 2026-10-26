import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

test('1. Header simplification and single consolidated language control', () => {
  const headerPath = path.join(projectRoot, 'src', 'components', 'Header.jsx');
  const content = fs.readFileSync(headerPath, 'utf8');

  // Verify explanation language selector indicating permanent target Kannada and selected explanation language
  assert.ok(
    content.includes('Explanations') && content.includes('selectedLangObj.nativeName'),
    'Header should display the explanation language indicator'
  );

  // Verify essential navigation links are present
  assert.ok(content.includes("'learn'"), 'Header must include Learn tab');
  assert.ok(content.includes("'quiz'"), 'Header must include Quiz tab');
  assert.ok(content.includes("'tutor'"), 'Header must include AI Tutor tab');
  assert.ok(!content.includes("'progress'"), 'Header must not include Progress tab');

  // Verify redundant duplicate progress indicators are removed from the main header
  assert.ok(
    !content.includes('Learned Words:') && !content.includes('/ {totalWords}'),
    'Header should not have redundant progress bar or label duplicating the Progress tab'
  );
});

test('2. Learn page layout cleanup and category chip simplification', () => {
  const learnPath = path.join(projectRoot, 'src', 'components', 'LearnScreen.jsx');
  const content = fs.readFileSync(learnPath, 'utf8');

  // Verify removal of large personalized learning track banner
  assert.ok(
    !content.includes('Personalized Learning Track') &&
    !content.includes('Master Kannada step-by-step'),
    'Learn screen should not have large decorative learning track banner'
  );

  // Verify category chips do not import decorative icons
  const decorativeIcons = ['Smile', 'MessageSquare', 'Utensils', 'Compass', 'Users', 'Clock', 'Hash', 'Sparkles'];
  for (const icon of decorativeIcons) {
    const importRegex = new RegExp(`\\b${icon}\\b`, 'g');
    assert.ok(
      !importRegex.test(content),
      `LearnScreen should not import decorative category icon ${icon}`
    );
  }

  // Verify clean word count badge in category chips
  assert.ok(
    content.includes('learnedInCat > 0 ? `${learnedInCat}/${countInCat}` : countInCat'),
    'Category chips should display clean word count badges'
  );
});

test('3. Vocabulary card hierarchy and cultural tip toggle', () => {
  const learnPath = path.join(projectRoot, 'src', 'components', 'LearnScreen.jsx');
  const content = fs.readFileSync(learnPath, 'utf8');

  // 1. Category and word position
  assert.ok(
    content.includes('Word {safeIndex + 1} of {filteredWords.length}'),
    'Vocabulary card should show category and word position'
  );

  // 2. Pronunciation and accessible Listen button
  assert.ok(
    content.includes('Volume2') && content.includes('handlePlayAudio'),
    'Vocabulary card should feature Latin pronunciation and Listen button'
  );

  // 3. Cultural tip behind subtle expandable button
  assert.ok(
    content.includes('showCulturalTip') && content.includes('Cultural tip'),
    'Cultural tips should be behind an expandable toggle, not dominating the card'
  );

  // 4. Keyboard navigation listeners preserved
  assert.ok(
    content.includes('ArrowRight') && content.includes('ArrowLeft') && content.includes("'l'"),
    'Keyboard shortcut event listeners must remain active'
  );

  // 5. No visible keyboard shortcut banner
  assert.ok(
    !content.includes('Shortcuts:') && !content.includes('[←] [→] Navigate'),
    'Learn screen should not show prominent shortcut banner below card'
  );
});

test('4. Compact quiz shortcut replacing oversized promotional banner', () => {
  const learnPath = path.join(projectRoot, 'src', 'components', 'LearnScreen.jsx');
  const content = fs.readFileSync(learnPath, 'utf8');

  // Verify compact quiz button exists
  assert.ok(
    content.includes('Test your knowledge on'),
    'Should have a quiet, compact quiz button'
  );

  // Verify large promo card is removed
  assert.ok(
    !content.includes('Ready for a Challenge?') && !content.includes('Test your skills with an interactive quiz'),
    'Large promotional quiz banner should be removed'
  );
});

test('5. Footer simplification and branding preservation', () => {
  const footerPath = path.join(projectRoot, 'src', 'components', 'Footer.jsx');
  const content = fs.readFileSync(footerPath, 'utf8');

  // Verify duplicate navigation links are removed
  assert.ok(!content.includes('Learn Words'), 'Footer should not duplicate Learn link');
  assert.ok(!content.includes('Take Quiz'), 'Footer should not duplicate Quiz link');
  assert.ok(!content.includes('Change Language'), 'Footer should not duplicate Language Select link');

  // Verify redundant tech text removed
  assert.ok(
    !content.includes('100% Client-Side • LocalStorage Progress • No Registration Required'),
    'Footer should not display redundant tech marketing text'
  );

  // Verify brand and hackathon attribution preserved
  assert.ok(content.includes('Kannada Mitra'), 'Footer must keep Kannada Mitra brand');
  assert.ok(content.includes('Learn Kannada. Connect with Karnataka.'), 'Footer must keep tagline');
  assert.ok(content.includes('Kannada Digital Innovation Hackathon 2026'), 'Footer must keep hackathon attribution');
});

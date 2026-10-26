/**
 * Curated vocabulary dataset for Kannada Mitra 💛❤️
 * All words include authentic Kannada script, Romanized pronunciation, English meaning,
 * and verified translations in Telugu, Tamil, Hindi, Malayalam, Marathi, and Tulu.
 *
 * Modular category dataset containing 340 verified items across 15 categories.
 */
import { GREETINGS_VOCABULARY } from './vocab/greetings.js';
import { EVERYDAY_VOCABULARY } from './vocab/everyday.js';
import { NUMBERS_VOCABULARY } from './vocab/numbers.js';
import { FOOD_VOCABULARY } from './vocab/food.js';
import { TRAVEL_VOCABULARY } from './vocab/travel.js';
import { SHOPPING_VOCABULARY } from './vocab/shopping.js';
import { QUESTIONS_VOCABULARY } from './vocab/questions.js';
import { SENTENCES_VOCABULARY } from './vocab/sentences.js';
import { FAMILY_VOCABULARY } from './vocab/family.js';
import { TIME_VOCABULARY } from './vocab/time.js';
import { DIRECTIONS_VOCABULARY } from './vocab/directions.js';
import { VERBS_VOCABULARY } from './vocab/verbs.js';
import { HOME_VOCABULARY } from './vocab/home.js';
import { HEALTH_VOCABULARY } from './vocab/health.js';
import { WORK_VOCABULARY } from './vocab/work.js';

export const VOCABULARY = [
  ...GREETINGS_VOCABULARY,
  ...EVERYDAY_VOCABULARY,
  ...NUMBERS_VOCABULARY,
  ...FOOD_VOCABULARY,
  ...TRAVEL_VOCABULARY,
  ...SHOPPING_VOCABULARY,
  ...QUESTIONS_VOCABULARY,
  ...SENTENCES_VOCABULARY,
  ...FAMILY_VOCABULARY,
  ...TIME_VOCABULARY,
  ...DIRECTIONS_VOCABULARY,
  ...VERBS_VOCABULARY,
  ...HOME_VOCABULARY,
  ...HEALTH_VOCABULARY,
  ...WORK_VOCABULARY,
];

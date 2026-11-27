// このファイルは scripts/gen-enemies.mjs が docs/世界観.md から作る。手で直さない。
// 7エリアの表（世界観.md 3章）。色は 糸の色（1つ目の色）。

import type { EnemyId } from './enemies.ts';

export interface AreaDef {
  no: number;
  name: string;
  /** 糸の色 */
  color: string;
  /** ふつうの敵 12体 */
  normals: EnemyId[];
  rare: EnemyId;
  boss: EnemyId;
}

export const AREAS: readonly AreaDef[] = [
  {
    no: 1,
    name: 'はなあかりの小道',
    color: '#F2A7B8',
    normals: ['amagumo', 'ishikoron', 'happappa', 'tsukushinbo', 'fuwawatage', 'hirachou', 'mitsudango', 'nokitsubame', 'tsuchimoko', 'takenokon', 'bunbunbachi', 'oborozuki'],
    rare: 'donburako',
    boss: 'hanafubuki',
  },
  {
    no: 2,
    name: 'わかばの田んぼ道',
    color: '#3E9A63',
    normals: ['azegaeru', 'dendenmaru', 'ajisaidama', 'otamakko', 'noborigoi', 'terubouzu', 'pichagutsu', 'mizutamari', 'naetaba', 'kamikabuto', 'potsurin', 'amenbou'],
    rare: 'hotarubi',
    boss: 'samidare',
  },
  {
    no: 3,
    name: 'ゆうすずみ商店街',
    color: '#C2410C',
    normals: ['chouchin', 'kintoto', 'fuurinrin', 'kakigoori', 'patauchiwa', 'kayaributa', 'asagaon', 'ramunebin', 'omensan', 'karakorogeta', 'hanabidon', 'akaposuto'],
    rare: 'ooatari',
    boss: 'matsuribayashi',
  },
  {
    no: 4,
    name: 'うみかぜの浜',
    color: '#8FD0F2',
    normals: ['kirisuika', 'himawarin', 'chokigani', 'pakupakugai', 'yurakurage', 'minminzemi', 'mugiwarabou', 'ukiwakka', 'hokakebune', 'pikatoudai', 'zabunami', 'takotsubo'],
    rare: 'tamatebako',
    boss: 'nyuudou',
  },
  {
    no: 5,
    name: 'みのりの里山',
    color: '#FFC53D',
    normals: ['kakashidon', 'kakibee', 'igaguri', 'kinokogasa', 'susukippo', 'akiakane', 'komedawara', 'momijinote', 'buraminomushi', 'koromusubi', 'hokuhokuimo', 'tsububudou'],
    rare: 'juugoya',
    boss: 'ooichou',
  },
  {
    no: 6,
    name: 'ゆきあかりの縁側',
    color: '#1B2240',
    normals: ['yukidaruma', 'nukukotatsu', 'tsumimikan', 'tsuraran', 'yugeyakan', 'yakimochi', 'tebukuron', 'yutanpon', 'yukinohana', 'hoshidaikon', 'ponponbou', 'pettanusu'],
    rare: 'chabashira',
    boss: 'dokayuki',
  },
  {
    no: 7,
    name: 'めぐりの丘',
    color: '#8B6BB8',
    normals: ['kururigoma', 'agedako', 'kendamaru', 'orizuru', 'darumaotoshi', 'karutafuda', 'oibane', 'itodenwa', 'sainome', 'kokeshisan', 'itomakimaki', 'okiagariko'],
    rare: 'manekineko',
    boss: 'motsuredama',
  },
];

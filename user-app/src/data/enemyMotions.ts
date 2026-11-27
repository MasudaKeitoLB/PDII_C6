// 敵100体の 動きの型（docs/設計-アニメーション.md の E）。docs/世界観.md 5章の 姿から 決めた。
// ホームの 次の敵と、成果の画面の 戦闘で 敵が 出たあとに 使う。動きは components/motion.module.css。
// このファイルは 単体テスト（node --test）で そのまま動かすので、React・絵・import.meta.glob を入れない。

import type { EnemyId } from './enemies.ts';

/**
 * float：ふわふわ浮く（雲・虫・鳥・水に うかぶ物）／hop：ぴょんと跳ねる（石・かえる・小さな道具）／
 * sway：ゆらゆら揺れる（葉・花・つるした物）／spin：ゆっくり回る（うず・こま・ころがる物）／
 * glow：ほのかに光る（明かり・あたたかい物・えんぎもの。点滅は しない）／drip：ぽたぽた（しずく・雨・とける物）
 * ボス・裏ボス（大きな体）は ゆらゆら か ほのかに光る だけにする（跳ねたり 回ったりすると 画面が ゆれて 見え、ドット絵も にじむ）
 */
export type EnemyMotion = 'float' | 'hop' | 'sway' | 'spin' | 'glow' | 'drip';

export const ENEMY_MOTION_TYPES: readonly EnemyMotion[] = ['float', 'hop', 'sway', 'spin', 'glow', 'drip'];

/** 動きの型の 名前（画面には 出さない。説明用） */
export const MOTION_LABELS: Record<EnemyMotion, string> = {
  float: 'ふわふわ浮く',
  hop: 'ぴょんと跳ねる',
  sway: 'ゆらゆら揺れる',
  spin: 'ゆっくり回る',
  glow: 'ほのかに光る',
  drip: 'ぽたぽた',
};

export const ENEMY_MOTIONS: Record<EnemyId, EnemyMotion> = {
  // エリア1　はなあかりの小道（春）
  amagumo: 'float', // 雨を つれた 雲
  ishikoron: 'hop', // 足の ある 丸い石
  happappa: 'sway', // 風に のる 葉
  tsukushinbo: 'sway', // 土手から のびる つくし
  fuwawatage: 'float', // ふわふわの わたげ
  hirachou: 'float', // ひらひら とぶ ちょう
  mitsudango: 'hop', // くしの だんご
  nokitsubame: 'float', // とんでいる つばめ
  tsuchimoko: 'hop', // 土から もこっと 出る
  takenokon: 'hop', // ぐんと のびる たけのこ
  bunbunbachi: 'float', // 花から 花へ とぶ はち
  oborozuki: 'glow', // ぼんやり うかぶ 月
  donburako: 'sway', // 川を どんぶらこと 流れる もも
  hanafubuki: 'sway', // 花びらの うずまき（ボスは 回さない）
  // エリア2　わかばの田んぼ道（初夏）
  azegaeru: 'hop', // かえる
  dendenmaru: 'sway', // ゆっくりな かたつむり
  ajisaidama: 'drip', // 雨で 色が かわる あじさい
  otamakko: 'sway', // 水を すいすい
  noborigoi: 'sway', // 風に およぐ こいのぼり
  terubouzu: 'sway', // のきに ぶらり
  pichagutsu: 'hop', // 水たまりに はいりたい 長ぐつ
  mizutamari: 'drip', // 雨あがりの 水たまり
  naetaba: 'sway', // そわそわする 苗
  kamikabuto: 'hop', // 紙の かぶと
  potsurin: 'drip', // 葉の 先の しずく
  amenbou: 'float', // 水の 上を すべる
  hotarubi: 'glow', // おしりが 光る ほたる
  samidare: 'sway', // 雨の すだれが ゆれる
  // エリア3　ゆうすずみ商店街（夏）
  chouchin: 'glow', // ぽっと ともる ちょうちん
  kintoto: 'float', // およぐ 金魚
  fuurinrin: 'sway', // 風で ゆれる ふうりん
  kakigoori: 'drip', // とける かきごおり
  patauchiwa: 'sway', // ぱたぱた うちわ
  kayaributa: 'sway', // けむりを 出す かやりぶた
  asagaon: 'sway', // つるを のばす あさがお
  ramunebin: 'hop', // からんと 鳴る びん
  omensan: 'float', // 夜店の おめん
  karakorogeta: 'hop', // からん ころんと 歩く げた
  hanabidon: 'glow', // 空に ひらく 花火
  akaposuto: 'hop', // かどに 立つ ポスト
  ooatari: 'spin', // ハンドルを 回す 福引き
  matsuribayashi: 'glow', // まつりの 灯りに てらされる たいこ
  // エリア4　うみかぜの浜（盛夏）
  kirisuika: 'hop', // 切った すいか
  himawarin: 'sway', // お日さまを むく ひまわり
  chokigani: 'hop', // 横に 歩く かに
  pakupakugai: 'hop', // ぱくぱく 貝
  yurakurage: 'float', // 波に まかせる くらげ
  minminzemi: 'float', // 木の 上の せみ
  mugiwarabou: 'float', // 風に とぶ ぼうし
  ukiwakka: 'float', // ぷかぷか うきわ
  hokakebune: 'sway', // 波に ゆれる 舟
  pikatoudai: 'glow', // 海を てらす とうだい
  zabunami: 'sway', // よせる 波
  takotsubo: 'sway', // 足を 出す たこ
  tamatebako: 'glow', // 竜宮の おみやげ
  nyuudou: 'sway', // むくむく 立つ 入道雲
  // エリア5　みのりの里山（秋）
  kakashidon: 'sway', // 田んぼの かかし
  kakibee: 'hop', // 柿の 実
  igaguri: 'spin', // ころがる いがぐり
  kinokogasa: 'hop', // きのこ
  susukippo: 'sway', // 風に ゆれる すすき
  akiakane: 'float', // 赤とんぼ
  komedawara: 'drip', // おもくて ずっしり
  momijinote: 'float', // ひらひら おちる もみじ
  buraminomushi: 'sway', // 糸で ぶらり
  koromusubi: 'spin', // ころりん ころがる おむすび
  hokuhokuimo: 'glow', // ほくほくの やきいも
  tsububudou: 'hop', // ぶどうの ふさ
  juugoya: 'hop', // もちつきの うさぎ
  ooichou: 'sway', // 葉を ふらせる 大木
  // エリア6　ゆきあかりの縁側（冬）
  yukidaruma: 'sway', // まっている ゆきだるま
  nukukotatsu: 'glow', // ぬくぬくの こたつ
  tsumimikan: 'hop', // みかんの 山
  tsuraran: 'drip', // ぽたぽた なく つらら
  yugeyakan: 'hop', // しゅんしゅん やかん
  yakimochi: 'drip', // ぷくっと ふくらむ もち
  tebukuron: 'sway', // はぐれた てぶくろ
  yutanpon: 'glow', // あたたかい ゆたんぽ
  yukinohana: 'spin', // 雪の けっしょう
  hoshidaikon: 'sway', // 北風に ふかれる だいこん
  ponponbou: 'sway', // ぼんぼんを ゆらす ぼうし
  pettanusu: 'hop', // ぺったん うす
  chabashira: 'glow', // 茶ばしら（えんぎもの）
  dokayuki: 'glow', // 窓に 明かりの ともる 雪の 家
  // エリア7　めぐりの丘（四季の終章）
  kururigoma: 'spin', // くるくる 回る こま
  agedako: 'float', // 空の たこ
  kendamaru: 'hop', // けんだま
  orizuru: 'float', // おりづる
  darumaotoshi: 'hop', // だるまおとし
  karutafuda: 'sway', // かるたの ふだ
  oibane: 'spin', // くるりと 回る はね
  itodenwa: 'sway', // たるんだ 糸
  sainome: 'hop', // さいころ
  kokeshisan: 'sway', // おじぎを する こけし
  itomakimaki: 'spin', // 糸まき
  okiagariko: 'sway', // 左右に ゆれる おきあがりこぼし
  manekineko: 'glow', // 福を まねく ねこ
  motsuredama: 'sway', // からまって こまっている 糸の 玉
  // エンド　年こしの峠
  oomisoka: 'sway', // 年の おわりの かね
  hatsuhinode: 'glow', // 新しい 年の 朝日
};

/** その敵の 動きの型（表に 無いときは ふわふわ） */
export function enemyMotion(id: EnemyId): EnemyMotion {
  return ENEMY_MOTIONS[id] ?? 'float';
}

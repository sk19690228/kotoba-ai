import kuromoji from 'kuromoji';
import path from 'path';

type Tokenizer = kuromoji.Tokenizer<kuromoji.IpadicFeatures>;

let tokenizerPromise: Promise<Tokenizer> | null = null;

function getTokenizer(): Promise<Tokenizer> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji
        .builder({ dicPath: path.join(process.cwd(), 'node_modules/kuromoji/dict') })
        .build((err, tokenizer) => {
          if (err) reject(err);
          else resolve(tokenizer);
        });
    });
  }
  return tokenizerPromise;
}

function katakanaToHiragana(str: string): string {
  return str.replace(/[ァ-ヶ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );
}

// 文末に寂聴の口調を適度に追加。toggle で交互に適用し過剰にならないようにする。
function addJakuchoStyle(text: string): string {
  let toggle = false;
  const alt = (original: string, styled: string) => {
    toggle = !toggle;
    return toggle ? styled : original;
  };

  return text
    .replace(/ますか[。？]/g, 'ますかね。')
    .replace(/ですか[。？]/g, 'ですかね。')
    .replace(/(?<![よねわ])ます。/g, (m) => alt(m, 'ますよ。'))
    .replace(/(?<![ねよわ])です。/g,  (m) => alt(m, 'ですね。'))
    .replace(/でしょう。/g,            (m) => alt(m, 'でしょうね。'))
    .replace(/ください。/g, 'くださいよ。')
    .replace(/ましょう。/g,            (m) => alt(m, 'ましょうよ。'));
}

export async function toSpeechText(text: string): Promise<string> {
  const styled = addJakuchoStyle(text);
  const t = await getTokenizer();
  const tokens = t.tokenize(styled);
  return tokens
    .map((token) => {
      const reading = token.reading;
      if (!reading || reading === '*') return token.surface_form;
      return katakanaToHiragana(reading);
    })
    .join('');
}

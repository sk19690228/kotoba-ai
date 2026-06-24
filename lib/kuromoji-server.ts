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

export async function toSpeechText(text: string): Promise<string> {
  const t = await getTokenizer();
  const tokens = t.tokenize(text);
  return tokens
    .map((token) => {
      const reading = token.reading;
      if (!reading || reading === '*') return token.surface_form;
      return katakanaToHiragana(reading);
    })
    .join('');
}

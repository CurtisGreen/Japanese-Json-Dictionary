import { promises as fsPromises } from "fs";

async function readFile(fileName) {
  const data = await fsPromises
    .readFile(fileName)
    .catch((err) => console.error("Failed to read file", err));

  return JSON.parse(data.toString());
}

async function writeFile(filename, data) {
  const jsonData = JSON.stringify(data);
  await fsPromises.writeFile(filename, jsonData);
}

const keysToIgnore = ["lang"];

// Iterate over everything and remove anything that's [], ["*"], or null
function cleanupWords(obj) {
  switch (typeof obj) {
    case "object":
      // Array
      if (Array.isArray(obj)) {
        if (obj.length == 0 || (obj.length == 1 && obj[0] == "*")) {
          return null;
        }

        // Go through entries in arr
        const newArr = [];
        for (const val of obj) {
          const newData = cleanupWords(val);
          if (newData != null) {
            newArr.push(newData);
          }
        }
        if (newArr.length == 0) {
          return null;
        } else {
          return newArr;
        }
      }
      // Object
      else {
        // Go through entries in obj
        const newObj = {};
        for (const key in obj) {
          if (!keysToIgnore.includes(key)) {
            const newData = cleanupWords(obj[key]);
            if (newData != null) {
              newObj[key] = newData;
            }
          }
        }

        // If no objects omit this obj
        if (Object.keys(newObj).length == 0) {
          return null;
        } else {
          return newObj;
        }
      }

    default:
      return obj;
  }
}

// Filter by common and remove the field
function filterByCommon(items) {
  const commonItems = items.filter((term) => term.common);
  const simpleItems = commonItems.map((item) => {
    const { common, ...rest } = item;
    return rest;
  });
  return simpleItems;
}

function simplify(word) {
  // if (word.sense.length > 1) {
  //   console.log(word.sense);
  // }

  // word.sense.forEach((sense) => {
  //   for (const key in sense) {
  //     if (
  //       !["partOfSpeech", "languagesSource", "gloss"].includes(key) &&
  //       sense[key].length != 0 &&
  //       !(sense[key].length == 1 && sense[key][0] == "*")
  //     ) {
  //       console.log(key, sense[key], word.kanji[0]?.text);
  //     }
  //   }
  // });
  const output = {};
  if (word.kanji) {
    output.kanji = filterByCommon(word.kanji);
  }
  if (word.kana) {
    output.kana = filterByCommon(word.kana);
  }
  if (word.sense) {
    output.sense = word.sense;

    for (const s of word.sense) {
      for (const g of s.gloss) {
        if (Object.keys(g).length > 1) {
          console.log(g);
        }
      }
    }
  }
  return output;
}

const dict = await readFile("./jmdict-eng-common-3.1.0.json");
console.log(dict.words.length, "words");
const cleanWords = cleanupWords(dict.words.slice(0, 20));
const simpleWords = cleanWords.map(simplify);

await writeFile("SimpleJmdict.json", simpleWords);

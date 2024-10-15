const fs = require("fs");

function mergeNumberedLines(arr) {
  let merged = [];
  let currentLine = "";

  for (let i = 0; i < arr.length; i++) {
    const line = arr[i];

    const firstWord = line?.split(" ")[0]?.trim()?.split(".")[0];

    if (!isNaN(parseInt(firstWord, 10))) {
      // if line starts with number
      if (currentLine !== "") {
        merged.push(currentLine.trim());
        currentLine = "";
      }
      currentLine = line.trim();
    } else {
      currentLine += "\n" + line.trim();
    }
  }

  if (currentLine !== "") {
    merged.push(currentLine.trim());
  }

  return merged;
}
function mergeEndQuoteLines(arr) {
  let merged = [];
  let currentLine = "";

  for (let i = 0; i < arr.length; i++) {
    const line = arr[i];

    if (line.endsWith("||")) {
      currentLine += "\n" + line.trim();
      merged.push(currentLine.trim());
      currentLine = "";
    } else {
      if (currentLine === "") {
        currentLine = line.trim();
      } else {
        currentLine += "\n" + line.trim();
      }
    }
  }

  if (currentLine !== "") {
    merged.push(currentLine.trim());
  }

  return merged;
}

function parseHymn(filePath, { title }) {
  try {
    const data = fs.readFileSync(filePath, "utf8");

    try {
      const hymnData = { title };
      const jsonData = JSON.parse(data);
      // hymnData["title"] = jsonData.title.split(":").pop();

      if (jsonData.contents.length < 2) return;

      // const titleIdx = jsonData.contents.findIndex((v) => v === title);

      // for sanskrit title is different
      const sansTitle = jsonData.title.split(":").slice(1).join("").trim();
      const titleIdx = jsonData.contents.findIndex((v) => v === sansTitle);
      // console.log(titleIdx);

      const lastIdx = jsonData.contents[
        jsonData.contents.length - 1
      ]?.startsWith("Next: ")
        ? jsonData.contents.length - 1
        : jsonData.contents.length;
      const contents = jsonData.contents.slice(titleIdx + 1, lastIdx);
      // hymnData["contents"] = contents;

      // for sanskrit
      const mergedContents = mergeEndQuoteLines(contents);
      // console.log(mergedContents);
      hymnData["contents"] = mergedContents;

      // for english
      // const mergedContents = mergeNumberedLines(contents);
      // console.log(mergedContents);
      // if (contents[0]?.startsWith("1. ") || contents[0]?.startsWith("1 ")) {
      //   hymnData["contents"] = mergedContents;
      // } else hymnData["contents"] = ["not starting with 1", ...mergedContents];

      return hymnData;
    } catch (err) {
      console.error("Error parsing JSON:", err);
    }
  } catch (err) {
    console.error("Error reading file:", filePath);
    return;
  }
}

function parseBook(filePath, { title, visitedPath }) {
  const parentPath = filePath.split("/").slice(0, -1).join("/");
  try {
    const data = fs.readFileSync(filePath, "utf8");

    try {
      const bookData = { title, hymns: [] };
      // Parse JSON data
      const jsonData = JSON.parse(data);

      for (const { title, href } of jsonData.links) {
        const hymnPath = `${parentPath}/${href}.json`;
        if (visitedPath.indexOf(hymnPath) >= 0) continue;
        // console.log(title, hymnPath);
        const parsedHymn = parseHymn(hymnPath, { title });
        visitedPath.push(hymnPath);
        if (parsedHymn) {
          // console.log(parsedHymn);
          bookData.hymns.push(parsedHymn);
        }
      }
      return bookData;
    } catch (err) {
      console.error("Error parsing JSON:", err);
    }
  } catch (err) {
    console.error("Error reading file:", filePath);
    return;
  }
}

function parseIndex(filePath) {
  const parentPath = filePath.split("/").slice(0, -1).join("/");
  const visitedPath = [];
  try {
    const data = fs.readFileSync(filePath, "utf8");

    try {
      // Parse JSON data
      const jsonData = JSON.parse(data);

      for (const { title, href } of jsonData.links) {
        const bookPath = `${parentPath}/${href}.json`;
        // console.log("\n", title, bookPath);
        if (visitedPath.indexOf(bookPath) >= 0) continue;
        const parsedBook = parseBook(bookPath, { title, visitedPath });
        visitedPath.push(bookPath);
        if (parsedBook) {
          // console.log(`\nBook:\n`, parsedBook.hymns);
          const bookTransformedPath = `${parentPath}/${href}.gen.json`;
          // Write the transformed data to book file
          try {
            fs.writeFileSync(
              bookTransformedPath,
              JSON.stringify(parsedBook, null, 4),
              "utf8"
            );
            console.log(`Book generated: ${bookTransformedPath}`);
          } catch (err) {
            console.error("Error writing file:", bookTransformedPath);
          }
        }
      }
    } catch (err) {
      console.error("Error parsing JSON:", err);
    }
  } catch (err) {
    console.error("Error reading file:", filePath);
    return;
  }
}

// Example usage
const filePath = "./data/rigveda_san/index.htm.json";
// const filePath = "./data/rigveda_en/index.htm.json";
parseIndex(filePath);

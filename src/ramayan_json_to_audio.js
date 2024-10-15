const fs = require("fs");
const path = require("path");
const { DateTime } = require("luxon");
const { fileStreamDownload } = require("./utils");

async function processSarga({ header, data, outFilePath, downloadedFiles }) {
  console.log("processing sarga: ", header.sargaIndex, header.sargaTitle);

  const line = [];

  // perpare contents - begin
  let slokamIndex = 0;
  for (const content of data.contents) {
    // if (slokamIndex >= 1) break;
    slokamIndex++;

    if (content.audio) {
      const srcSeg = data.source.split("/");
      srcSeg.pop();
      const src = srcSeg.join("/");
      const audiosrc = content.audio.startsWith("./")
        ? content.audio.replace("./", "/")
        : content.audio;
      const audio = audiosrc.startsWith("http")
        ? audiosrc
        : `${src}${audiosrc}`;

      const audioFileName = `${header.fileNamePrefix}_${String(
        slokamIndex + 1
      ).padStart(3, "0")}`;

      if (downloadedFiles.includes(`${audioFileName}.mp3`)) continue;

      try {
        await fileStreamDownload({
          url: audio,
          ext: "mp3",
          title: audioFileName,
          downloadFolderPath: outFilePath,
          onProgress: (progress) => {
            if (progress % 10 === 0) {
              const progressStr = String(progress).padStart(3, "0");
              console.log(`downloading ${progressStr}% - ${audioFileName}`);
            }
          },
        });
        const str = `${audioFileName}.mp3,${content.audio},${audio}`;
        line.push(str);
      } catch (e) {
        console.log(`failed to download - ${audioFileName}`);
      }
      // console.log(`audio source: ${str}`);
    }
  }
  // perpare contents - end

  return line;
}

async function main({ inFilePath }) {
  const outFilePath = "./data/audio/valmiki_ramayan";
  const fileName = `ramayanam_audio_src.csv`;

  // read titles file
  const jsonStr = fs.readFileSync(
    path.join(inFilePath, "0_sarga_titles_iast.json")
  );
  const jsonKandas = JSON.parse(jsonStr);

  const csvStr = fs.readFileSync(path.join(outFilePath, fileName), {
    encoding: "utf8",
  });
  const downloadedFiles = csvStr.split("\n").map((s) => s.split(",")[0]);
  // console.log(csvList);

  // loop over each Kandas
  for (let kidx = 0; kidx < jsonKandas.length; kidx++) {
    // if (kidx >= 1) break;
    const kanda = jsonKandas[kidx];
    console.log(kidx, kanda.kandam);

    for (let sidx = 0; sidx < kanda.sargaTitles.length; sidx++) {
      // if (sidx >= 1) break;
      const sarga = kanda.sargaTitles[sidx];
      const fileNamePrefixPrev =
        kidx === 0 && sidx === 0
          ? ""
          : [
              `${sidx === 0 ? kidx : kidx + 1}`,
              `_${
                sidx === 0 ? jsonKandas[kidx - 1].kandam : kanda.kandam
              }_kanda`,
              `_sarga_${String(
                sidx === 0 ? jsonKandas[kidx - 1].sargaTitles.length : sidx
              ).padStart(3, "0")}`,
            ].join("");
      const fileNamePrefix = [
        `${kidx + 1}`,
        `_${kanda.kandam}_kanda`,
        `_sarga_${String(sidx + 1).padStart(3, "0")}`,
      ].join("");
      const fileNamePrefixNext =
        kidx === jsonKandas.length - 1 && sidx === kanda.sargaTitles.length - 1
          ? ""
          : [
              `${sidx === kanda.sargaTitles.length - 1 ? kidx + 2 : kidx + 1}`,
              `_${
                sidx === kanda.sargaTitles.length - 1
                  ? jsonKandas[kidx + 1].kandam
                  : kanda.kandam
              }_kanda`,
              `_sarga_${String(
                sidx === kanda.sargaTitles.length - 1 ? 1 : sidx + 2
              ).padStart(3, "0")}`,
            ].join("");

      const header = {
        kandaIndex: kidx + 1,
        kandaName: kanda.kandam,
        kandaTitle: kanda.text,
        kandaSource: kanda.source,
        sargaIndex: sidx + 1,
        sargaTitle: sarga,
        fileNamePrefixPrev,
        fileNamePrefix,
        fileNamePrefixNext,
      };

      const sfile = `${kanda.kandam}_sarga_${header.sargaIndex}.json`;
      const jsonStr = fs.readFileSync(path.join(inFilePath, sfile));
      const jsonSarga = JSON.parse(jsonStr);

      const c = await processSarga({
        header,
        data: jsonSarga,
        outFilePath,
        downloadedFiles,
      });

      // write sarga contents to file

      if (c && c.length) {
        const contents = c?.join(`\n`);
        // console.log(fileName, `\n`, contents);

        fs.appendFileSync(path.join(outFilePath, fileName), contents);
      }
    }
  }
}

main({ inFilePath: "./data/DevHub_Loaders/valmiki_ramayan" });
// const args = process.argv.slice( 2 );
// main( { inFilePath: args[ 0 ] } )

// $> yarn conv-ramayan-to-md "./data/DevHub_Loaders/valmiki_ramayan"

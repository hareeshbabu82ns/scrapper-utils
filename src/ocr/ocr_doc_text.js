const Tesseract = require( 'tesseract.js' )
const { fromPath } = require( 'pdf2pic' )

const fs = require( 'fs' )
const path = require( 'path' )

async function textractFromImg( { image, outPath, langs = [ 'eng' ] } ) {

  const { data: { text } } = await Tesseract.recognize(
    image,
    // 'https://tesseract.projectnaptha.com/img/eng_bw.png',
    langs.join( '+' ),
    { logger: m => console.log( m ) }
  )
  fs.writeFileSync( outPath, text );
  console.log( 'text written to file' )
  return text

  // Tesseract.recognize(
  //   image,
  //   // 'https://tesseract.projectnaptha.com/img/eng_bw.png',
  //   'eng+tel+san',
  //   { logger: m => console.log( m ) }
  // ).then( ( { data: { text } } ) => {
  //   // console.log( text );
  //   fs.writeFileSync( './data/test_out.txt', text );
  // } )
}

async function pdf2pic( { path, pageNumbers = [],
  filePrefix = 'untitled',
  outPath = "./data/images",
  outFormat = "png" } ) {
  const options = {
    quality: 7,
    density: 300,
    saveFilename: filePrefix,
    savePath: outPath,
    format: outFormat,
    // width: 600,
    height: 1200
  };
  const storeAsImage = fromPath( path, options );

  const res = await storeAsImage.bulk( pageNumbers.length === 0 ? -1 : pageNumbers, false )
  console.log( "PDF is now converted as image" );
  return res;
}

async function pdf2text( {
  pdfPath,
  outPath,
  tempDir = "./data/images",
  langs = [ 'eng' ],
  pageNumbers = [],
} ) {

  const pdfPathObj = path.parse( pdfPath )
  const outPathDir = outPath ?? path.dirname( pdfPath )

  // convert pdf to images
  const pics = await pdf2pic( {
    path: pdfPath,
    outPath: tempDir,
    filePrefix: pdfPathObj.name,
    pageNumbers: pageNumbers,
    outFormat: "png"
  } )
  // console.log( pics );

  // extract text from images
  const worker = Tesseract.createWorker( {
    // logger: m => console.log( m )
  } );

  await worker.load();
  await worker.loadLanguage( langs.join( '+' ) );
  await worker.initialize( langs.join( '+' ) );


  for ( const pic of pics ) {
    // console.log( pic )
    // const inFileObj = path.parse(pic.path)
    const name = pic.name.substring( 0, pic.name.length - 4 );
    console.log( 'processing: ', pic.path )

    const { data: { text } } = await worker.recognize( pic.path );

    // write text to file
    fs.writeFileSync( path.join( outPathDir, `${name}.txt` ), text );

    // // extract text from image
    // await textractFromImg( {
    //   image: pic.path,
    //   outPath: `./data/extracted/${name}.txt`,
    //   langs: [
    //     'eng',
    //     // 'tel',
    //     'san',
    //   ]
    // } )
    // delete temporary images
    fs.rmSync( pic.path )
  }

  await worker.terminate();

}


const LANGS = [
  'eng',
  'tel',
  // 'san',
]

pdf2text( {
  langs: LANGS,
  pdfPath: "./data/tel_dict.pdf",
  outPath: "./data/extracted",
  pageNumbers: Array.from( { length: 10 }, ( v, idx ) => 80 + idx ),
  // pageNumbers: [ 80, 81, 82 ],
} );

// // extract text from image
// textractFromImg( {
//   image: './data/images/2015.70512.Telugu-english-Dictionary_0034.jpg',
//   outPath: `./data/extracted/tel_dict.txt`,
//   langs: [
//     'eng',
//     'tel',
//   ]
// } )
//Required package
var pdf = require( "pdf-creator-node" );
var fs = require( "fs" );
const path = require( 'path' )
const { DateTime } = require( "luxon" );
const Sanscript = require( '@indic-transliteration/sanscript' )

const sourceWordLang = 'itrans'
const destWordLang = 'telugu'

const sourceTitlesLang = 'iast'
const sourceSlokaLang = 'devanagari'
const destLang = 'telugu'

async function createPDF( { json } ) {
  // Read HTML Template
  var html = fs.readFileSync( "./src/pdf/template_bhagavathamu.html", "utf8" );

  var options = {
    format: "A3",
    orientation: "portrait",
    border: "10mm",
    header: {
      height: "10mm",
      contents: `<div style="text-align: center;">Pothana Bhagavathamu</div>`
    },
    footer: {
      height: "10mm",
      contents: {
        // first: 'Cover page',
        // 2: 'Second page', // Any page number is working. 1-based index
        default: '<div style="text-align: right;"><span style="color: #444;">{{page}}</span>/<span>{{pages}}</span></div>', // fallback value
        // last: 'Last Page'
      }
    },
    timeout: 3000000,
  };


  var document = {
    html: html,
    data: {
      title: "Pothana Bhagavathamu",
      ghattas: json,
    },
    path: "./data/pothana_bhagavathamu.pdf",
    type: "",
  };

  try {
    var res = await pdf
      .create( document, options )
    console.log( res );
  } catch ( e ) {
    console.error( e );
  }

}


function processGhattam( { header, data } ) {
  console.log( 'processing ghattam: ', header.ghattamIndex, header.ghattamTitle )

  const c = {
    title: header.fileNamePrefix,
    description: `${data.kandaDescription} - ${data.sargaTitle}`,
    tags: `bhagavathamu, pothana, skandam_${header.skandaName}, ghattam_${String( header.ghattamIndex ).padStart( 3, '0' )}`,
    introduction: data.intro,
    source: data.source,
    ghattamTitle: data.ghattamTitle,
    contents: [],
  }

  // perpare contents - begin
  let slokamIndex = 0
  for ( const content of data.contents ) {
    // if ( slokamIndex >= 2 ) break;
    slokamIndex++
    const slokam = {
      indexStr: String( slokamIndex ).padStart( 3, '0' ),
      // content: content.slokam,
      contents: content.slokam.split( '\n' ).filter( s => s.length > 2 ),
    }

    if ( content.audio ) {
      const srcSeg = data.source.split( '/' )
      srcSeg.pop()
      const src = srcSeg.join( '/' )
      const audiosrc = content.audio.startsWith( './' ) ? content.audio.replace( './', '/' ) : content.audio
      const audio = `${src}${audiosrc}`
      // c.push( `<audio controls="controls"> <source type="audio/mp3" src="${content.audio}"> </audio>` )
      slokam[ 'audio' ] = content.audio
    }

    if ( content.prati_pada_artham ) {
      const artham = content.prati_pada_artham.split( ';' )
        .map( e => `${e.trim().replaceAll( `\n`, ' ' )}` )
        .filter( e => e.trim().length > 0 )
        .map( e => {
          const s = e.split( '=' )
          return { word: s[ 0 ], meaning: s[ 1 ] }
        } )
      // c.push( `\n${artham}\n  ` )
      slokam[ 'artham' ] = artham
    }

    if ( content.tatparyam ) {
      const tatparyam = content.tatparyam.replaceAll( `\n`, ' ' )
      // c.push( `\n_${tatparyam}_\n` )
      slokam[ 'tatparyam' ] = tatparyam
    }

    c.contents.push( slokam )
  }
  // perpare contents - end

  return c
}

async function main( { inFilePath } ) {

  const inFilePathObj = path.parse( inFilePath )

  const outFilePath = "./data/md/pothana_bhagavatham"

  const skandas = [
    { skandam: "1", ghattamCount: 41 },
    { skandam: "2", ghattamCount: 36 },
    { skandam: "3", ghattamCount: 57 },
    { skandam: "4", ghattamCount: 28 },
    { skandam: "5.1", ghattamCount: 16 },
    { skandam: "5.2", ghattamCount: 8 },
    { skandam: "6", ghattamCount: 17 },
    { skandam: "7", ghattamCount: 17 },
    { skandam: "8", ghattamCount: 93 },
    { skandam: "9", ghattamCount: 54 },
    { skandam: "10.1", ghattamCount: 198 },
    { skandam: "10.2", ghattamCount: 91 },
    { skandam: "11", ghattamCount: 19 },
    { skandam: "12", ghattamCount: 13 },
  ]

  const skandaContents = []

  // loop over each Skandas
  skandas.forEach( ( skanda, sidx ) => {
    // if ( sidx >= 2 ) return;
    console.log( sidx, skanda.skandam )

    for ( let gidx = 0; gidx < skanda.ghattamCount; gidx++ ) {

      // if ( gidx >= 2 ) break;

      const fileNamePrefix = [
        String( sidx + 1 ).padStart( 2, '0' ),
        `_skandam_${skanda.skandam.replaceAll( '.', '_' )}`,
        `_ghattam_${String( gidx + 1 ).padStart( 3, '0' )}`,
      ].join( '' )

      const header = {
        skandaIndex: sidx + 1,
        skandaName: skanda.skandam,
        // skandaTitle: skanda.text,
        // skandaSource: skanda.source,
        ghattamIndex: gidx + 1,
        // ghattamTitle: ghattam,
        fileNamePrefix,
      }

      const sfile = `skandam_${skanda.skandam}_ghattam_${header.ghattamIndex}.json`
      let jsonStr
      try {
        jsonStr = fs.readFileSync( path.join( inFilePath, sfile ) )
      } catch ( e ) {
        continue;
      }
      const jsonghattam = JSON.parse( jsonStr )

      const c = processGhattam( { header, data: jsonghattam } )

      // write ghattam contents to file
      // const fileName = `${fileNamePrefix}.md`

      // const contents = c.join( '\n' )
      // console.log( fileName, `\n`, contents )

      skandaContents.push( c )

    }
  } )

  // console.dir( skandaContents, { depth: 5 } )
  await createPDF( { json: skandaContents } )
}

main( { inFilePath: "./data/DevHub_Loaders/pothana_bhagavatham" } )
// const args = process.argv.slice( 2 );
// main( { inFilePath: args[ 0 ] } )

// $> yarn conv-bhagavatham-to-pdf "./data/DevHub_Loaders/pothana_bhagavatham"
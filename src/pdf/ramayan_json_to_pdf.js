//Required package
var pdf = require( "pdf-creator-node" );
var fs = require( "fs" );
const path = require( 'path' )
const { DateTime } = require( "luxon" );
const Sanscript = require('@indic-transliteration/sanscript')

const sourceWordLang = 'itrans'
const destWordLang = 'telugu'

const sourceTitlesLang = 'iast'
const sourceSlokaLang = 'devanagari'
const destLang = 'telugu'

async function createPDF( { json } ) {
// Read HTML Template
var html = fs.readFileSync( "./src/pdf/template_ramayanam.html", "utf8" );

var options = {
  format: "A3",
  orientation: "portrait",
  border: "10mm",
  header: {
    height: "10mm",
    contents: `<div style="text-align: center;"> Valmiki Ramayanam</div>`
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
    title: "Valmiki Ramayanam",
    sargas: json,
  },
  path: "./data/valmiki_ramayanam.pdf",
  type: "",
};
// By default a file is created but you could switch between Buffer and Streams by using "buffer" or "stream" respectively.

// pdf
//   .create( document, options )
//   .then( ( res ) => {
//     console.log( res );
//   } )
//   .catch( ( error ) => {
//     console.error( error );
//   } );

try {
  var res = await pdf
  .create( document, options )
  console.log( res );
}catch(e){
  console.error( e );
}

}


  
  function processSarga( { header, data } ) {
    console.log( 'processing sarga: ', header.sargaIndex, header.sargaTitle )
  
    const kandaTitle = data.kandaTitle.replace( /[\s()]/gi, '_' )
    const c = {
      kandaTitle: Sanscript.t(header.kandaTitle, sourceTitlesLang, destLang),
      title: header.fileNamePrefix,
      tags: `ramayanam, valmiki, ${kandaTitle} `,
      description: `${data.kandaDescription ?? '' + data.sargaTitle}`,
      introduction: data.intro?.replace('\n',' ') ,
      source: data.source,
      sargaTitle: Sanscript.t(header.sargaTitle, sourceTitlesLang, destLang),
    }
    const contents = []
  
    // perpare contents - begin
    let slokamIndex = 0
    for ( const content of data.contents ) {
      slokamIndex++
      // if(slokamIndex>=3)break;
      const slokamContent = {
        indexStr : String( slokamIndex ).padStart( 3, '0' ),
        contents: [...content.slokam.split('\n').map(s=>Sanscript.t(s, sourceSlokaLang, destLang))],
      }
  
      if ( content.audio ) {
        const srcSeg = data.source.split( '/' )
        srcSeg.pop()
        const src = srcSeg.join( '/' )
        const audiosrc = content.audio.startsWith( './' ) ? content.audio.replace( './', '/' ) : content.audio
        const audio = `${src}${audiosrc}`
        // c.push( `<audio controls="controls"> <source type="audio/mp3" src="${audio}"> </audio>` )
        slokamContent.audio = audio
      }
  
      if ( content.prati_pada_artham ) {
        const artham = content.prati_pada_artham.split( ';' )
          .map( e => `${e.trim().replaceAll( `\n`, ' ' )}` )
          .filter( e => e.trim().length > 0 ).join( '\n' )
        // c.push( `\n${artham}\n  ` )
        slokamContent.artham = artham.split('\n').map(a=>{
          const split = a.split('=')
          return {
            word: Sanscript.t(split[0], sourceWordLang, destWordLang),
            meaning:split[1]}
        }).filter(a=>a.meaning!==undefined)
      }
  
      if ( content.tatparyam ) {
        const tatparyam = content.tatparyam.replaceAll( `\n`, ' ' )
        // c.push( `\n_${tatparyam}_\n` )
        slokamContent.tatparyam = tatparyam
      }

      contents.push(slokamContent)
    }
    // perpare contents - end
    c.contents = contents
    
    return c
  }
  
  async function main( { inFilePath } ) {
  
    const inFilePathObj = path.parse( inFilePath )
  
    const outFilePath = "./data/md/valmiki_ramayan"
    const outFilePathObj = path.parse( outFilePath )
  
    // read titles file
    const jsonStr = fs.readFileSync( path.join( inFilePath, '0_sarga_titles_iast.json' ) )
    const jsonKandas = JSON.parse( jsonStr )

    const sargaContents = []
  
    // loop over each Kandas
    jsonKandas.forEach( ( kanda, kidx ) => {
      // if ( kidx >= 2 ) return;
      console.log( kidx, kanda.kandam )
  
      kanda.sargaTitles.forEach( ( sarga, sidx ) => {
  
  
        const fileNamePrefix = [
          `${kidx + 1}`,
          `_${kanda.kandam}_kanda`,
          `_sarga_${String( sidx + 1 ).padStart( 3, '0' )}`,
        ].join( '' )
  
        const header = {
          kandaIndex: kidx + 1,
          kandaName: kanda.kandam,
          kandaTitle: kanda.text,
          kandaSource: kanda.source,
          sargaIndex: sidx + 1,
          sargaTitle: sarga,
          fileNamePrefix,
        }
  
        // if ( sidx >= 2 ) return;
        const sfile = `${kanda.kandam}_sarga_${header.sargaIndex}.json`
        const jsonStr = fs.readFileSync( path.join( inFilePath, sfile ) )
        const jsonSarga = JSON.parse( jsonStr )
  
        const c = processSarga( { header, data: jsonSarga } )
  
        // write sarga contents to file
  
        const fileName = `${fileNamePrefix}.pdf`
  
        // const contents = c.join( '\n' )
        // console.dir(  c, {depth:3} )
        sargaContents.push(c)
  
        // fs.writeFileSync( path.join( outFilePath, fileName ), contents )
      } )
    } )

    // console.dir( sargaContents,{depth:5} )

    await createPDF({json:sargaContents})
  }
  
  main( { inFilePath: "./data/DevHub_Loaders/valmiki_ramayan" } )
  // const args = process.argv.slice( 2 );
  // main( { inFilePath: args[ 0 ] } )
  
  // $> yarn conv-ramayan-to-pdf "./data/DevHub_Loaders/valmiki_ramayan"
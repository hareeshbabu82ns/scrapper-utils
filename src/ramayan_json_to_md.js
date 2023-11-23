const fs = require( 'fs' )
const path = require( 'path' )
const { DateTime } = require( "luxon" );

function processSarga( { header, data } ) {
  console.log( 'processing sarga: ', header.sargaIndex, header.sargaTitle )

  const c = []

  // metadata - begin
  c.push( '---' )
  c.push( `title: ${header.fileNamePrefix}` )

  // tags
  const kandaTitle = data.kandaTitle.replace( /[\s()]/gi, '_' )
  c.push( `tags: ramayanam, valmiki, ${kandaTitle} ` )

  c.push( `description: ${data.kandaDescription ?? '' + data.sargaTitle}` )

  c.push( `published: true` )
  c.push( `date: ${DateTime.now().toISO( { includeOffset: false } )}Z` )
  c.push( `dateCreated: ${DateTime.now().toISO( { includeOffset: false } )}Z` )

  c.push( `editor: markdown` )

  c.push( '---' )
  // metadata - end

  // others
  c.push( `* introduction: ${data.intro}` )
  c.push( `* source: ${data.source}` )
  c.push( `* sarga title: ${data.sargaTitle}` )
  c.push( `` )


  const prev = header.fileNamePrefixPrev ? `[Prev](./${header.fileNamePrefixPrev})` : ''
  const next = header.fileNamePrefixNext ? `[Next](./${header.fileNamePrefixNext})` : ''

  c.push( `${prev} - ${next}\n  \n` )

  // perpare contents - begin
  let slokamIndex = 0
  for ( const content of data.contents ) {
    slokamIndex++
    c.push( `### Slokam ${String( slokamIndex ).padStart( 3, '0' )}` )
    c.push( `>\n>${content.slokam}\n` )

    if ( content.audio ) {
      const srcSeg = data.source.split( '/' )
      srcSeg.pop()
      const src = srcSeg.join( '/' )
      const audiosrc = content.audio.startsWith( './' ) ? content.audio.replace( './', '/' ) : content.audio
      const audio = `${src}${audiosrc}`
      c.push( `<audio controls="controls"> <source type="audio/mp3" src="${audio}"> </audio>` )
    }


    if ( content.prati_pada_artham ) {
      const artham = content.prati_pada_artham.split( ';' )
        .map( e => `- ${e.trim().replaceAll( `\n`, ' ' )}` )
        .filter( e => e.trim().length > 0 ).join( '\n' )
      c.push( `\n${artham}\n  ` )
    }

    if ( content.tatparyam ) {
      const tatparyam = content.tatparyam.replaceAll( `\n`, ' ' )
      c.push( `\n_${tatparyam}_\n` )
    }
  }
  // perpare contents - end

  return c
}

async function main( { inFilePath } ) {

  const inFilePathObj = path.parse( inFilePath )

  const outFilePath = "./data/md/valmiki_ramayan"
  const outFilePathObj = path.parse( outFilePath )

  // read titles file
  const jsonStr = fs.readFileSync( path.join( inFilePath, '0_sarga_titles_iast.json' ) )
  const jsonKandas = JSON.parse( jsonStr )

  // loop over each Kandas
  jsonKandas.forEach( ( kanda, kidx ) => {
    // if ( kidx >= 1 ) return;
    console.log( kidx, kanda.kandam )

    kanda.sargaTitles.forEach( ( sarga, sidx ) => {

      // const fileNamePrefix = `${kidx + 1}_${kanda.kandam}_kanda_sarga_${String( sidx + 1 ).padStart( 3, '0' )}`

      const fileNamePrefixPrev = kidx === 0 && sidx === 0 ? '' :
        [
          `${sidx === 0 ? kidx : kidx + 1}`,
          `_${sidx === 0 ? jsonKandas[ kidx - 1 ].kandam : kanda.kandam}_kanda`,
          `_sarga_${String( sidx === 0 ? jsonKandas[ kidx - 1 ].sargaTitles.length : sidx ).padStart( 3, '0' )}`,
        ].join( '' )
      const fileNamePrefix = [
        `${kidx + 1}`,
        `_${kanda.kandam}_kanda`,
        `_sarga_${String( sidx + 1 ).padStart( 3, '0' )}`,
      ].join( '' )
      const fileNamePrefixNext = kidx === jsonKandas.length - 1 && sidx === kanda.sargaTitles.length - 1 ? '' :
        [
          `${sidx === kanda.sargaTitles.length - 1 ? kidx + 2 : kidx + 1}`,
          `_${sidx === kanda.sargaTitles.length - 1 ? jsonKandas[ kidx + 1 ].kandam : kanda.kandam}_kanda`,
          `_sarga_${String( sidx === kanda.sargaTitles.length - 1 ? 1 : sidx + 2 ).padStart( 3, '0' )}`,
        ].join( '' )

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
      }

      // if ( sidx >= 1 ) return;
      const sfile = `${kanda.kandam}_sarga_${header.sargaIndex}.json`
      const jsonStr = fs.readFileSync( path.join( inFilePath, sfile ) )
      const jsonSarga = JSON.parse( jsonStr )

      const c = processSarga( { header, data: jsonSarga } )

      // write sarga contents to file

      const fileName = `${fileNamePrefix}.md`

      const contents = c.join( '\n' )
      // console.log( fileName, `\n`, contents )

      fs.writeFileSync( path.join( outFilePath, fileName ), contents )
    } )
  } )
}

main( { inFilePath: "./data/DevHub_Loaders/valmiki_ramayan" } )
// const args = process.argv.slice( 2 );
// main( { inFilePath: args[ 0 ] } )

// $> yarn conv-ramayan-to-md "./data/DevHub_Loaders/valmiki_ramayan"
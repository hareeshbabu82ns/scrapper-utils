const fs = require( 'fs' )
const path = require( 'path' )
const { DateTime } = require( "luxon" );


function processGhattam( { header, data } ) {
  console.log( 'processing ghattam: ', header.ghattamIndex, header.ghattamTitle )

  const c = []

  // metadata - begin
  c.push( '---' )
  c.push( `title: ${header.fileNamePrefix}` )
  c.push( `description: ${data.kandaDescription} - ${data.sargaTitle}` )

  // tags
  c.push( `tags: bhagavathamu, pothana, skandam_${header.skandaName}, ghattam_${String( header.ghattamIndex ).padStart( 3, '0' )}` )

  c.push( `published: true` )
  c.push( `date: ${DateTime.now().toISO( { includeOffset: false } )}Z` )
  c.push( `dateCreated: ${DateTime.now().toISO( { includeOffset: false } )}Z` )
  c.push( `editor: markdown` )
  c.push( '---\n' )
  // metadata - end

  // others
  // c.push( `* introduction: ${data.intro}` )
  c.push( `* source: ${data.source}  \n  ` )

  const prev = header.fileNamePrefixPrev ? `[Prev](./${header.fileNamePrefixPrev})` : ''
  const next = header.fileNamePrefixNext ? `[Next](./${header.fileNamePrefixNext})` : ''

  c.push( `${prev} - ${next}\n  \n` )

  // c.push( `* ghattam title: ${data.ghattamTitle}` )

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
      c.push( `<audio controls="controls"> <source type="audio/mp3" src="${content.audio}"> </audio>` )
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

  // loop over each Skandas
  skandas.forEach( ( skanda, sidx ) => {
    // if ( sidx >= 1 ) return;
    console.log( sidx, skanda.skandam )
    for ( let gidx = 0; gidx < skanda.ghattamCount; gidx++ ) {

      const fileNamePrefixPrev = sidx === 0 && gidx === 0 ? '' :
        [
          String( gidx === 0 ? sidx : sidx + 1 ).padStart( 2, '0' ),
          `_skandam_${( gidx === 0 ? skandas[ sidx - 1 ] : skanda ).skandam.replaceAll( '.', '_' )}`,
          `_ghattam_${String( gidx === 0 ? skandas[ sidx - 1 ].ghattamCount : gidx ).padStart( 3, '0' )}`,
        ].join( '' )
      const fileNamePrefix = [
        String( sidx + 1 ).padStart( 2, '0' ),
        `_skandam_${skanda.skandam.replaceAll( '.', '_' )}`,
        `_ghattam_${String( gidx + 1 ).padStart( 3, '0' )}`,
      ].join( '' )
      const fileNamePrefixNext = sidx === skandas.length - 1 && gidx === skanda.ghattamCount - 1 ? '' :
        [
          String( gidx === skanda.ghattamCount - 1 ? sidx + 2 : sidx + 1 ).padStart( 2, '0' ),
          `_skandam_${( gidx === skanda.ghattamCount - 1 ? skandas[ sidx + 1 ] : skanda ).skandam.replaceAll( '.', '_' )}`,
          `_ghattam_${String( gidx === skanda.ghattamCount - 1 ? 1 : gidx + 2 ).padStart( 3, '0' )}`,
        ].join( '' )

      const header = {
        skandaIndex: sidx + 1,
        skandaName: skanda.skandam,
        // skandaTitle: skanda.text,
        // skandaSource: skanda.source,
        ghattamIndex: gidx + 1,
        // ghattamTitle: ghattam,
        fileNamePrefixPrev,
        fileNamePrefix,
        fileNamePrefixNext,
      }
      // if ( gidx >= 1 ) return;
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
      const fileName = `${fileNamePrefix}.md`

      const contents = c.join( '\n' )
      // console.log( fileName, `\n`, contents )

      fs.writeFileSync( path.join( outFilePath, fileName ), contents )
    }
  } )
}

main( { inFilePath: "./data/DevHub_Loaders/pothana_bhagavatham" } )
// const args = process.argv.slice( 2 );
// main( { inFilePath: args[ 0 ] } )

// $> yarn conv-bhagavatham-to-md "./data/DevHub_Loaders/pothana_bhagavatham"
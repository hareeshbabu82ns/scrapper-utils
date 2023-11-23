const fs = require( 'fs' )
const path = require( 'path' )

const { WIKI_URL, WIKI_AUTH_KEY, MUTATION_PAGE_CREATE, QUERY_PAGE_BY_PATH, MUTATION_PAGE_DEL_BY_ID, MUTATION_PAGE_UPDATE_BY_ID } = require( './constants' )
const { gqlAPI, upsertPage } = require( './utils' )

function processSarga( { header, data } ) {
  console.log( 'processing sarga: ', header.sargaIndex, header.sargaTitle )

  const wikiData = {
    path: "",
    title: "",
    content: "",
    description: "",
    tags: [],
    editor: "markdown",
    locale: "en",
    isPrivate: false,
    isPublished: true,
    publishedStartDate: "",
    publishedEndDate: "",
    scriptCss: "",
    scriptJs: "",
  }

  const c = []

  // metadata - begin
  // tags
  const kandaTitle = data.kandaTitle.replace( /[\s()]/gi, '_' )
  wikiData.tags.push( 'ramayanam', 'valmiki', kandaTitle )
  // metadata - end

  // others
  wikiData.description = data.kandaDescription ?? '' + data.sargaTitle

  c.push( `* introduction: ${data.intro ?? ''}` )
  c.push( `* source: ${data.source}` )
  // c.push( `* description: ${data.kandaDescription ?? ''}` )
  c.push( `* sarga title: **${data.sargaTitle}**` )
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

  wikiData.content = c.join( `\n` )

  return wikiData
}

async function main( { inFilePath } ) {

  const outFilePath = "aadhyatma/valmiki_ramayan"

  // read titles file
  const jsonStr = fs.readFileSync( path.join( inFilePath, '0_sarga_titles_iast.json' ) )
  const jsonKandas = JSON.parse( jsonStr )

  // loop over each Kandas
  // jsonKandas.forEach( ( kanda, kidx ) => {
  for ( let kidx = 0; kidx < jsonKandas.length; kidx++ ) {
    const kanda = jsonKandas[ kidx ]
    // if ( kidx >= 1 ) return;
    console.log( kidx, kanda.kandam )
    // kanda.sargaTitles.forEach( ( sarga, sidx ) => {
    for ( let sidx = 0; sidx < kanda.sargaTitles.length; sidx++ ) {
      const sarga = kanda.sargaTitles[ sidx ]

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

      const wikiData = processSarga( { header, data: jsonSarga } )

      // write sarga contents to file
      // const fileNamePrefix = `${header.kandaIndex}_${header.kandaName}_kanda_sarga_${String( header.sargaIndex ).padStart( 3, '0' )}`
      const fileName = `${fileNamePrefix}`

      wikiData.title = fileName
      wikiData.path = `${outFilePath}/${fileName}`
      console.log( 'writing to path: ', wikiData.path );
      // const contents = c.join( '\n' )
      // console.log( fileName, `\n`, contents )

      // fs.writeFileSync( path.join( outFilePath, fileName ), contents )

      await upsertPage( {
        // skipFindByID: true, // make this true if fresh upload to save time
        url: WIKI_URL, auth: WIKI_AUTH_KEY,
        pageData: wikiData
      } )

    }
  }
}

main( { inFilePath: "./data/DevHub_Loaders/valmiki_ramayan" } )
// const args = process.argv.slice( 2 );
// main( { inFilePath: args[ 0 ] } )

// $> yarn conv-ramayan-to-wiki "./data/DevHub_Loaders/valmiki_ramayan"
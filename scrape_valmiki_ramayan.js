const { Builder, By, Key, until } = require( 'selenium-webdriver' )
const { WAIT_SMALL, WAIT_MEDIUM } = require( './src/constants' );
const { fetchElementsFromURL } = require( './src/utils' );
const fs = require( 'fs' )

const dotEnv = require( 'dotenv' ).config( {
  // path: path.resolve(process.cwd(), '.env')
} );

( async function main() {

  const driver = await new Builder().forBrowser( 'chrome' ).build()

  const kaandaMap = [
    { code: 'baala', pageCode: 'bala', sargas: 77 },
    { code: 'ayodhya', pageCode: 'ayodhya', sargas: 119 },
    { code: 'aranya', pageCode: 'aranya', sargas: 75 },
    { code: 'kish', pageCode: 'kishkindha', sargas: 67 },
    { code: 'sundara', pageCode: 'sundara', sargas: 68 },
    { code: 'yuddha', pageCode: 'yuddha', sargas: 128 },
  ]

  try {
    for ( const kaanda of kaandaMap ) {
      if ( kaanda.code !== 'sundara' ) continue
      for ( const sarga = 1; sarga <= kaanda.sargas; sarga++ ) {
        await scrapeSarga( driver, {
          kandam: kaanda.code,
          kandamCode: kaanda.pageCode,
          sarga,
        } )
      }
    }
  } finally {
    await driver.quit()
  }


} )()

async function scrapeSarga( driver, { kandam, kandamCode, sarga } ) {

  let textItems

  const url = `http://www.valmikiramayan.net/utf8/${kandam}/sarga${sarga}/${kandamCode}sans${sarga}.htm`

  textItems = await fetchPageContents( driver, { url } )


  if ( textItems.length <= 10 ) {
    // might be because of wrong page
    return
  }

  // enable following line for saving titles
  // const content = JSON.stringify( textItems, null, 2 )
  // fs.writeFileSync( `./data/titles_${kandam}_sarga_${sarga}.json`, content )

  // enable following line for testing parseTextItems
  // textItems = JSON.parse( fs.readFileSync( `./data/titles_${kandam}_sarga_${sarga}.json` ) )

  const res = parseTextItems( { url, textItems } )

  const contentRes = JSON.stringify( res, null, 2 )
  fs.writeFileSync( `./data/${kandam}_sarga_${sarga}.json`, contentRes )

}

async function fetchPageContents( driver, { url } ) {

  let textItems = []

  const pTexts = await fetchElementsFromURL( driver, {
    url,
    byCssSelector: 'p,h3,p>audio>source',
    fetchElementAttributes: [ 'class', 'src' ],
    // checkChildren: [ { tag: 'audio>source', attributes: [ 'src' ] } ],
  } )

  // await driver.sleep( WAIT_SMALL ) // wait before exiting

  textItems = pTexts.filter( t => t.class !== "verloc" )
  // console.log( JSON.stringify( pTexts, null, 2 ) )

  return textItems
}

function parseTextItems( { url, textItems = [] } ) {
  const res = {}

  res.source = url

  const h3s = textItems.filter( t => t.tag === 'h3' )

  // title
  const kanda = h3s[ 0 ].text.split( ':' )[ 1 ].split( '-' ).map( i => i.trim() )
  res.kandaTitle = kanda[ 0 ]
  res.kandaDescription = kanda[ 1 ]

  res.sargaTitle = h3s[ 1 ].text.split( `\n` )[ 0 ].trim()


  //contents
  const ps = textItems.filter( t => t.tag === 'p' )
  res.intro = ps[ 0 ].text

  res.contents = []

  for ( let i = 0; i <= textItems.length; i++ ) {
    const content = {}
    const currP = textItems[ i ]
    const nextP = textItems[ i + 1 ]
    // if ( i === 1 )
    //   console.log( currP, nextP )
    if ( ( currP?.class === 'SanSloka'
      && currP?.text?.length === 0 )
      && ( nextP?.tag === 'source'
        && nextP?.src?.length > 0 ) ) {
      // console.log( currP, nextP )
      //Audio Source
      content.audio = nextP.src
      i = i + 2
    } else if ( currP?.class === 'SanSloka'
      && currP?.text?.length !== 0 ) {
      // slokam directly
    }
    else {
      continue
    }

    if ( textItems[ i ].class === 'SanSloka' )
      content.slokam = textItems[ i ].text
    else
      continue

    i++
    if ( textItems[ i ].class === 'pratipada' )
      content.prati_pada_artham = textItems[ i ].text
    else
      continue

    i++
    if ( textItems[ i ].class === 'tat' )
      content.tatparyam = textItems[ i ].text
    else
      continue

    const comments = []
    while ( textItems[ i + 1 ].class === 'comment' ) {
      i++
      comments.push( textItems[ i ].text )
    }
    content.comments = comments

    res.contents.push( content )
  }

  return res
}
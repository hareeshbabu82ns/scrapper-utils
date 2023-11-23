const { Builder, By, Key, until } = require( 'selenium-webdriver' )
const { WAIT_SMALL, WAIT_MEDIUM } = require( './src/constants' );
const { fetchElementsFromURL } = require( './src/utils' );
const fs = require( 'fs' )

const dotEnv = require( 'dotenv' ).config( {
  // path: path.resolve(process.cwd(), '.env')
} );

async function fetchPageContents( driver, { url } ) {

  const pTexts = await fetchElementsFromURL( driver, {
    url,
    byCssSelector: '.entry-content>p,h1.entry-title',
    // checkChildren: [ { tag: 'audio>source', attributes: [ 'src' ] } ],
  } )

  // await driver.sleep( WAIT_SMALL ) // wait before exiting

  return pTexts
}

function parseTextItems( { url, textItems = [], godName } ) {
  const res = {}

  res.source = url

  res.parent = {
    text: `${godName}`,
    type: "GOD",
    textData: {
      TEL: {
        text: `${godName}`
      },
      SAN: {
        text: `${godName}`
      }
    }
  }

  const h = textItems[ 0 ].split( '–' ).map( h => h.trim() )
  res.entity = {
    text: h[ 0 ],
    type: "STHOTRAM",
    textData: {
      TEL: {
        text: h[ 1 ]
      },
      SAN: {
        text: h[ 1 ]
      },
      IAST: {
        text: h[ 1 ]
      }
    }
  }

  res.contents = {
    type: "SLOKAM",
    TEL: {
      language: "TEL",
      title: h[ 1 ],
      source: url,
      contents: [
        ...textItems
      ]
    }
  }

  return res

}

( async function main() {

  const driver = await new Builder().forBrowser( 'chrome' ).build()
  const url = 'https://stotranidhi.com/agastya-ashtakam-in-telugu/'

  try {

    const pTexts = await fetchElementsFromURL( driver, {
      url,
      byCssSelector: '.entry-content>p,h1.entry-title',
      // checkChildren: [ { tag: 'audio>source', attributes: [ 'src' ] } ],
    } )
    // console.log( JSON.stringify( pTexts, null, 2 ) )

    // const content = JSON.stringify( pTexts, null, 2 )
    // fs.writeFileSync( './titles.txt', content )


    if ( pTexts.length <= 5 ) {
      // might be because of wrong page
      return
    }

    const res = parseTextItems( { url, textItems: pTexts, godName: 'Shiva' } )

    const contentRes = JSON.stringify( res, null, 2 )
    console.log( contentRes )

    await driver.sleep( WAIT_SMALL ) // wait before exiting

  } finally {
    await driver.quit()
  }

} )()


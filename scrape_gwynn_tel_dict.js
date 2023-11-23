
const fs = require( 'fs' )
const path = require( 'path' )

const axios = require( 'axios' )
const cheerio = require( 'cheerio' )

const sqlite3 = require( 'sqlite3' ).verbose();
const db = new sqlite3.Database( './data/dict/gwynn_te.sqlite' );

const BASE_URL = 'https://dsal.uchicago.edu'


const sqlTableCreate = `CREATE TABLE IF NOT EXISTS gwynn_te (
  key VARCHAR(100)  NOT NULL,
  lnum DECIMAL(10,3) ,
  data TEXT NOT NULL
);`

const sqlIndexCreate = `CREATE INDEX IF NOT EXISTS datum on gwynn_te(key);`

const sqlInsert = `INSERT INTO gwynn_te (key,lnum,data) VALUES (?,?,?);`


const dotEnv = require( 'dotenv' ).config( {
  path: path.resolve( process.cwd(), '.env' )
} );

( async function main() {

  createDB()

  const initialPagePath = `/cgi-bin/app/gwynn_query.py?page=1`

  const res = await scrapeDict( { initialPagePath } )


  db.close();

} )()


function createDB() {
  db.serialize( () => {
    db.run( sqlTableCreate );
    db.run( sqlIndexCreate );
  } );
}

function writeToDB( { entryList, pageIndex } ) {
  db.serialize( () => {

    const stmt = db.prepare( sqlInsert );

    entryList.forEach( ( e, idx ) => {
      // const lnum = Number( `${pageIndex}.${idx + 1}` )
      stmt.run( e.word, e.lnum, e.meaning )
    } )
    stmt.finalize();

  } );
}


async function scrapeDict( { initialPagePath } ) {

  let idx = 0
  let nextPath = initialPagePath
  let totalEntries = 0
  while ( nextPath && idx < 5000 ) { // limit number of itirations, to avoid infinite loop
    idx++

    console.log( `processing page: ${nextPath}` )

    const { entryList, nextPagePath } = await scrapePage( { url: BASE_URL + nextPath, pageIndex: idx } )
    nextPath = nextPagePath

    // save page entries
    if ( entryList?.length > 0 ) {

      const contentRes = JSON.stringify( entryList, null, 2 )
      // fs.writeFileSync( `./data/gwynn_${idx}.json`, contentRes )
      writeToDB( { entryList, pageIndex: idx } )
      totalEntries += entryList?.length
    }

    // exit while if next page url not found
    if ( !nextPath ) break

    await sleep( 1000 );
  }

  console.log( `Total entries processed ${totalEntries} from ${idx} pages` )
}

function sleep( ms ) {
  return new Promise( ( resolve ) => {
    setTimeout( resolve, ms );
  } );
}

async function scrapePage( { url, pageIndex } ) {
  const res = await axios.get( url )
  // console.log( "🚀 ~ file: scrape_gwynn_tel_dict.js:15 ~ main ~ res:", res )

  const $ = await cheerio.load( res.data )

  const hwResult = $( 'div.hw_result' )
  const hasNext = $( 'td.turner[align=right]>a' )
  // console.log( hwResult.text(), '\n----------\n', hasNext.text() )

  const nextPagePath = hasNext.attr( 'href' )
  // console.log( nextPagePath )

  const entryDivs = hwResult.children( 'div' )

  // console.log( entryDivs.length )

  const entryList = entryDivs.map( ( idx, e ) => {
    // if ( idx >= 1 ) return null
    const res = {
      lnum: Number( `${pageIndex}.${idx + 1}` ),
      word: '',
      meaning: '',
    }

    const headEl = $( e ).children( 'b' ).first()
    // console.log( headEl.text() )
    res.word = headEl.text()
    // console.log( $(e).html() )
    res.meaning = $( e ).html()
    res.meaning = res.meaning.replaceAll( '&nbsp;', '' ).replaceAll( '<te></te>', '' ).trim()
    // console.log( res.meaning )

    return res
  } ).toArray()

  // console.log( entryList )
  return {
    entryList,
    nextPagePath,
  }
}

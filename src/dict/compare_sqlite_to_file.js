const sqlite3 = require( 'sqlite3' ).verbose();
const db = new sqlite3.Database( './data/dict/eng2tel.sqlite' );

const fs = require( 'fs' );

const data = fs.readFileSync( './data/dict/engtote.txt', 'utf8' )
const lines = data.split( '\n' )
db.serialize( () => {
  lines.forEach( ( l, idx ) => {
    // if ( idx > 150 ) return
    const splits = l.split( '\t' );
    const firstWord = splits[ 0 ]
    // console.log( firstWord );

    db.exec( `select eng_word from eng2te where eng_word = "${firstWord}"`, ( err, row ) => {
      if ( err ) {
        // console.log( err )
        console.log( `${idx} - ${firstWord}` )
      }
    } )

  } )
} )



// db.serialize( () => {
//   // db.run( "CREATE TABLE lorem (info TEXT)" );

//   // const stmt = db.prepare( "INSERT INTO lorem VALUES (?)" );
//   // for ( let i = 0; i < 10; i++ ) {
//   //   stmt.run( "Ipsum " + i );
//   // }
//   // stmt.finalize();

//   db.each( "SELECT eng_word, meaning FROM eng2te", ( err, row ) => {
//     console.log( row.eng_word + ": " + row.meaning );
//   } );

// } );

db.close();
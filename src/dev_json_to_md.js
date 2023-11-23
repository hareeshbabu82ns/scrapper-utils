const fs = require( 'fs' )
const path = require( 'path' )
const { DateTime } = require( "luxon" );


async function main( { inFile } ) {

  const inFilePathObj = path.parse( inFile )

  const outFilePath = "./data/md"


  // read file
  const jsonStr = fs.readFileSync( inFile )
  const json = JSON.parse( jsonStr )

  let fileNamePrefix = ''

  if ( json.entity ) {
    fileNamePrefix = json.entity.text?.replace( /[\s()]/gi, '_' )
  }
  if ( fileNamePrefix.length === 0 ) {
    const inFileObj = path.parse( inFile )
    fileNamePrefix = inFileObj.name.replace( /[\s()]/gi, '_' )
  }

  if ( !json.contents )
    return

  for ( let lang in json.contents ) {

    if ( ![ 'ENG', 'SAN', 'TEL', 'IAST', 'SLP1' ].includes( lang ) ) continue;

    const jsonContent = json.contents[ lang ];

    const fileName = `${fileNamePrefix}_${lang.toLowerCase()}.md`
    const fileMeaningName = `${fileNamePrefix}_meaning_${lang.toLowerCase()}.md`

    const c = []
    const m = []

    // metadata - begin
    c.push( '---' )
    m.push( '---' )

    c.push( `title: ${fileNamePrefix}_${lang.toLowerCase()}` )
    m.push( `title: ${fileNamePrefix}_meaning_${lang.toLowerCase()}` )

    // tags
    const title = jsonContent.title ?? json.entity?.text
    c.push( `tags: ${jsonContent.category}, ${title.replace( /[\s()]/gi, '_' )}` )
    m.push( `tags: ${jsonContent.category}, ${title.replace( /[\s()]/gi, '_' )}, meanings` )

    // others
    c.push( `description: ` )
    m.push( `description: ` )
    c.push( `published: true` )
    m.push( `published: true` )
    c.push( `date: ${DateTime.now().toISO( { includeOffset: false } )}Z` )
    m.push( `date: ${DateTime.now().toISO( { includeOffset: false } )}Z` )
    c.push( `dateCreated: ${DateTime.now().toISO( { includeOffset: false } )}Z` )
    m.push( `dateCreated: ${DateTime.now().toISO( { includeOffset: false } )}Z` )

    c.push( `editor: markdown` )
    m.push( `editor: markdown` )


    c.push( '---' )
    m.push( '---' )
    // metadata - end

    c.push( `source: ${jsonContent.source}` )

    // prepare language links
    let langLinks = ''
    for ( const langName in json.contents ) {
      if ( ![ 'ENG', 'SAN', 'TEL', 'IAST', 'SLP1' ].includes( langName ) ) continue;
      if ( langName === lang ) continue;
      langLinks += `[${langName}](./${fileNamePrefix}_${langName.toLowerCase()}) `
    }
    if ( langLinks.length > 0 )
      c.push( `Document Links: ${langLinks}\n` );

    // prepare meaning links
    let meaningLinks = ''
    for ( const langName in json.contents ) {
      if ( !json.contents[ langName ]?.meanings?.length ) continue;
      if ( ![ 'ENG', 'SAN', 'TEL', 'IAST', 'SLP1' ].includes( langName ) ) continue;
      meaningLinks += `[${langName}](./${fileNamePrefix}_meaning_${langName.toLowerCase()}) `
    }
    if ( meaningLinks.length > 0 )
      c.push( `Meaning Links: ${meaningLinks}\n` );

    // perpare contents - begin

    for ( const content of jsonContent.contents ) {
      c.push( `\`\`\`\n${content}\n\`\`\`\n` )
    }

    // perpare contents - end

    // write contents to file - begin
    const contents = c.join( `\n` )

    const file = path.join( outFilePath, fileName )
    console.log( 'writing to file: ', file );
    // console.log( contents );
    fs.writeFileSync( file, contents )
    // write contents to file - end


    if ( jsonContent.meanings && jsonContent.meanings.length > 0 ) {

      // prepare language links
      let langLinks = ''
      for ( const langName in json.contents ) {
        if ( ![ 'ENG', 'SAN', 'TEL', 'IAST', 'SLP1' ].includes( langName ) ) continue;
        langLinks += `[${langName}](./${fileNamePrefix}_${langName.toLowerCase()}) `
      }
      if ( langLinks.length > 0 )
        m.push( `Document Links: ${langLinks}\n` );

      // perpare meanings - begin
      for ( const content of jsonContent.meanings ) {
        m.push( `>\n>${content}\n\n` )
      }
      // perpare meanings - end

      // write meanings to file - begin
      const meanings = m.join( `\n` )
      const file = path.join( outFilePath, fileMeaningName )
      console.log( 'writing meanings to file: ', file );
      // console.log( meanings );
      fs.writeFileSync( file, meanings )
      // write meanings to file - end    
    }


  } // end json.contents for

}

const FILES = [ "Aditya_Hrudayam_in_Telugu.json",
  "Ardhanarishwara_stotram.json",
  "Bilva_Ashttotara_Shatanama_Stotram.json",
  "Bilvashtakam.json",
  "Dakshinamurthy_ashtakam.json",
  "Dakshinamurthy_stotram.json",
  "Daridrya_Dahana_Shiva_Stotram.json",
  "Dvadasa_Jyothirlingani.json",
  "Hanuman_Chalisa.json",
  "Harivarasanam_(Harihara_Atmaja_Ashtakam).json",
  "Kalabhairava_Ashtakam.json",
  "Kanakadhara_Stotram_(Variation).json",
  "Lingashtakam_in_telugu.json",
  "Nama_Ramayanam_in_Telugu.json",
  "Navagraha_stotram_in_telugu.json",
  "NithyaStrotras.json",
  "Shiva_Tandava_Stotram.json",
  "Sri Bhuvanagiri Lakshmi Nrusimha Dandakam.json",
  "Sri_Adi_Shankaracharya_Ashtottara_Shatanamavali.json",
  "Sri_Anjaneya_Dandakam.json",
  "Sri_Gangadhara_Stotram.json",
  "Sri_Govinda_Namavali_(Namalu).json",
  "Sri_Maha_Vishnu_Stotram_(Garuda_Gamana_Tava).json",
  "Sri_Mrityunjaya_Aksharamala_Stotram.json",
  "Sri_Shiva_Stuti_(Vande_Shambhum_Umapathim).json",
  "Sri_Srinivasa_Smarana_(Manasa_Smarami).json",
  "Sri_Surya_Narayana_dandakam.json",
  "Sri_Venkateshwara_Mangalashasanam.json",
  "Sri_Venkateshwara_Prapatti.json",
  "Sri_Venkateshwara_Stotram.json",
  "Sri_Venkateshwara_Suprabhatam_in_Telugu.json",
  "Sri_Venkateshwara_Vajra_Kavacha_Stotram.json",
  "Sri_Vighneshwara_Shodasha_Nama_Stotram.json",
  "Sri_Vishnu_Sahasranama_Stotram.json",
  "Sri_Vishwanatha_Ashtakam.json",
  "Uma_Maheshwara_Stotram.json",
];

async function mainMulti( { inFolder, inFiles } ) {
  for ( const inFile of inFiles ) {
    // console.log( path.join( inFolder, inFile ) )
    await main( { inFile: path.join( inFolder, inFile ) } )
  }
}

mainMulti( { inFolder: "./data/DevHub_Loaders", inFiles: FILES } )

// // main( { inFile: "./data/DevHub_Loaders/Shiva_Tandava_Stotram.json" } )
// const args = process.argv.slice( 2 );
// main( { inFile: args[ 0 ] } )

// $> yarn conv-to-md "./data/DevHub_Loaders/Shiva_Tandava_Stotram.json"
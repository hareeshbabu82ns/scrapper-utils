//Required package
var pdf = require( "pdf-creator-node" );
var fs = require( "fs" );
const path = require( 'path' )
const { DateTime } = require( "luxon" );

async function createPDF( { file, json } ) {
  // Read HTML Template
  var html = fs.readFileSync( "./src/pdf/template_sthotram_pdf.html", "utf8" );

  var options = {
    format: "A3",
    orientation: "portrait",
    border: "10mm",
    header: {
      height: "10mm",
      contents: `<div style="text-align: center;">${json.title}</div>`
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
    data: json,
    path: file,
    // path: "./data/pothana_bhagavathamu.pdf",
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

async function main( { inFile } ) {

  const inFilePathObj = path.parse( inFile )

  const outFilePath = "./data/pdf"


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

    // if ( ![ 'ENG', 'SAN', 'TEL', 'IAST', 'SLP1' ].includes( lang ) ) continue;
    if ( ![ 'TEL' ].includes( lang ) ) continue;

    const jsonContent = json.contents[ lang ];

    const fileName = `${fileNamePrefix}_${lang.toLowerCase()}.pdf`
    const fileMeaningName = `${fileNamePrefix}_meaning_${lang.toLowerCase()}.pdf`

    const title = jsonContent.title ?? json.entity?.text

    const c = {
      // title: `${fileNamePrefix}_${lang.toLowerCase()}`,
      title,
      description: '',
      source: jsonContent.source,
      tags: `${jsonContent.category}, ${title.replace( /[\s()]/gi, '_' )}`,
      slokas: [],
    }

    // perpare contents - begin

    let mIdx = 0
    for ( const content of jsonContent.contents ) {

      const tatparyam = ( jsonContent.meanings && jsonContent.meanings.length > mIdx ) ? jsonContent.meanings[ mIdx ] : ''

      const slokam = {
        contents: [ ...content.split( '\n' ) ],
        tatparyam,
      }

      c.slokas.push( slokam )
      mIdx++
    }

    // perpare contents - end

    // write contents to file - begin

    const file = path.join( outFilePath, fileName )
    console.log( 'writing to file: ', file );
    // console.dir( c, { depth: 4 } );
    // fs.writeFileSync( file, contents )
    await createPDF( { json: c, file: file } )
    // write contents to file - end


  } // end json.contents for

}

const FILES = [
  "Aditya_Hrudayam_in_Telugu.json",
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

// main( { inFile: "./data/DevHub_Loaders/Hanuman_Chalisa.json" } )
// main( { inFile: "./data/DevHub_Loaders/Shiva_Tandava_Stotram.json" } )

// const args = process.argv.slice( 2 );
// main( { inFile: args[ 0 ] } )

// $> yarn conv-to-pdf "./data/DevHub_Loaders/Shiva_Tandava_Stotram.json"
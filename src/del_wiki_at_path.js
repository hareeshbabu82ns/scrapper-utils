const _ = require( 'lodash' )

const { gqlAPI, findPageAndDelete } = require( './utils' )
const { WIKI_URL, WIKI_AUTH_KEY, QUERY_PAGE_TREE_BY_PATH, MUTATION_PAGE_DEL_BY_ID } = require( './constants' )

async function main( { path } ) {

  const res = await gqlAPI( {
    url: WIKI_URL, auth: WIKI_AUTH_KEY,
    query: QUERY_PAGE_TREE_BY_PATH, variables: { path, locale: "en" },
  } )

  const pageIds = _.get( res, 'data.pages.tree', [] )
    .map( e => e.pageId ).filter( e => e !== null )
  // console.log( pageIds )

  for ( pidx = 0; pidx < pageIds.length; pidx++ ) {
    console.log( `deleting ${pageIds[ pidx ]}` )
    await gqlAPI( {
      url: WIKI_URL, auth: WIKI_AUTH_KEY,
      query: MUTATION_PAGE_DEL_BY_ID,
      variables: { id: pageIds[ pidx ] },
    } )
  }

  console.log( 'pages deleted under given path' )

}

main( { path: "aadhyatma/pothana_bhagavatham/skandam_101_ghattam_170" } )

// $> yarn del-at-wiki
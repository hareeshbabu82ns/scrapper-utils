const WAIT_SMALL = 5 * 100
const WAIT_MEDIUM = 5 * 500
const WAIT_LONG = 5 * 1000
require( 'dotenv' ).config()

const WIKI_URL = "http://192.168.86.10:33000/graphql"
const WIKI_AUTH_KEY = process.env.WIKI_AUTH_KEY


const QUERY_PAGE_TREE_BY_PATH = `
query($path: String, $locale: String!) {
  pages {
    tree(path: $path, mode: ALL, locale: $locale, includeAncestors: false) {
      id
      path
      title
      isFolder
      pageId
      parent
      locale
    }
  }
}
`
const QUERY_PAGE_BY_PATH = `
query ($path: String) {
  pages {
    search(query: "",path: $path) {
      results {
        id
        path
        title
        locale
      }
    }
  }
}
`
const MUTATION_PAGE_DEL_BY_ID = `
mutation ($id: Int!) {
  pages {
    delete(id: $id) {
      responseResult {
        succeeded
        errorCode
        slug
        message
      }
    }
  }
}
`
const MUTATION_PAGE_UPDATE_BY_ID = `
mutation(
  $id: Int!
  $content: String
  $description: String
  $editor: String
  $isPrivate: Boolean
  $isPublished: Boolean
  $locale: String
  $path: String
  $publishEndDate: Date
  $publishStartDate: Date
  $scriptCss: String
  $scriptJs: String
  $tags: [String]
  $title: String
) {
  pages {
    update(
      id: $id
      content: $content
      description: $description
      editor: $editor
      isPrivate: $isPrivate
      isPublished: $isPublished
      locale: $locale
      path: $path
      publishEndDate: $publishEndDate
      publishStartDate: $publishStartDate
      scriptCss: $scriptCss
      scriptJs: $scriptJs
      tags: $tags
      title: $title
    ) {
      responseResult {
        succeeded
        errorCode
        slug
        message
      }
      page {
        updatedAt
      }
    }
  }
}
`
const MUTATION_PAGE_CREATE = `
mutation(
  $content: String!
  $description: String!
  $editor: String!
  $isPrivate: Boolean!
  $isPublished: Boolean!
  $locale: String!
  $path: String!
  $publishEndDate: Date
  $publishStartDate: Date
  $scriptCss: String
  $scriptJs: String
  $tags: [String]!
  $title: String!
) {
  pages {
    create(
      content: $content
      description: $description
      editor: $editor
      isPrivate: $isPrivate
      isPublished: $isPublished
      locale: $locale
      path: $path
      publishEndDate: $publishEndDate
      publishStartDate: $publishStartDate
      scriptCss: $scriptCss
      scriptJs: $scriptJs
      tags: $tags
      title: $title
    ) {
      responseResult {
        succeeded
        errorCode
        slug
        message
      }
      page {
        id
        updatedAt
      }
    }
  }
}
  `

module.exports = {
  WAIT_SMALL, WAIT_MEDIUM, WAIT_LONG,
  WIKI_URL, WIKI_AUTH_KEY,
  QUERY_PAGE_TREE_BY_PATH,
  QUERY_PAGE_BY_PATH,
  MUTATION_PAGE_CREATE,
  MUTATION_PAGE_UPDATE_BY_ID,
  MUTATION_PAGE_DEL_BY_ID,
}
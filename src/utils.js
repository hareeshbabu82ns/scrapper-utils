const { Builder, By, Key, until } = require("selenium-webdriver");
const {
  WAIT_SMALL,
  WAIT_MEDIUM,
  QUERY_PAGE_BY_PATH,
  MUTATION_PAGE_UPDATE_BY_ID,
  MUTATION_PAGE_CREATE,
  MUTATION_PAGE_DEL_BY_ID,
  QUERY_PAGE_TREE_BY_PATH,
} = require("./constants");
const _ = require("lodash");
const { createWriteStream } = require("fs");
const path = require("path");
const { Readable } = require("stream");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function fetchElementsFromURL(
  driver,
  { url, waitForElement, byCssSelector, fetchElementAttributes, checkChildren }
) {
  await driver.get(`${url}`);

  if (waitForElement)
    await driver.wait(until.elementLocated(By.id(waitForElement)));

  const elements = await driver.findElements(By.css(byCssSelector));

  if (fetchElementAttributes) {
    const res = [];
    for (const e of elements) {
      const ele = {};
      ele.tag = await e.getTagName();
      ele.text = await e.getText();
      for (const attr of fetchElementAttributes) {
        const attrVal = await e.getAttribute(attr);
        if (attrVal) ele[attr] = attrVal;
      }
      if (checkChildren) {
        for (const child of checkChildren) {
          const cElements = await e.findElements(By.css(child.tag));
          for (const ce of cElements) {
            for (const attr of child.attributes) {
              const attrVal = await ce.getAttribute(attr);
              if (attrVal) ele[child.tag] = attrVal;
            }
          }
        }
      }
      res.push(ele);
    }
    return res;
  } else return Promise.all(elements.map((e) => e.getText()));
}

async function gqlAPI({ url, auth, query, variables }) {
  const data = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth}`,
    },
    body: JSON.stringify({ query, variables }),
  }).then((response) => response.json());

  return data;
}
async function findPageAndDelete({ url, auth, path }) {
  const res = await gqlAPI({
    url: url,
    auth: auth,
    query: QUERY_PAGE_BY_PATH,
    variables: { path, locale: "en" },
  });
  const pageId = _.get(res, "data.pages.tree[0].pageId");
  if (pageId) {
    await gqlAPI({
      url: url,
      auth: auth,
      query: MUTATION_PAGE_DEL_BY_ID,
      variables: { id: pageId },
    });
  }
}
async function findPageByPath({ url, auth, path }) {
  const res = await gqlAPI({
    url: url,
    auth: auth,
    query: QUERY_PAGE_TREE_BY_PATH,
    variables: { path, locale: "en" },
  });
  const treeRes = _.get(res, "data.pages.tree", []);
  const pageObj = _.find(treeRes, ["path", path]);
  const pageId = _.get(pageObj, "pageId");
  // console.log( pageId )
  return pageId;
}

async function upsertPage({ skipFindByID = false, url, auth, pageData }) {
  // find page
  const pageId = skipFindByID
    ? null
    : await findPageByPath({
        url: url,
        auth: auth,
        path: pageData.path,
      });
  if (pageId) {
    // page exist - update
    await gqlAPI({
      url: url,
      auth: auth,
      query: MUTATION_PAGE_UPDATE_BY_ID,
      variables: { id: pageId, ...pageData },
    });
  } else {
    // page not exist - create
    await gqlAPI({
      url: url,
      auth: auth,
      query: MUTATION_PAGE_CREATE,
      variables: pageData,
    });
  }
}

function adjustTitleToFileName(title) {
  return (
    title
      // .replace(/[^a-zA-Z0-9\s-_\.]/g, '-') // Replace invalid characters with hyphen
      .replace(/[\s-_\.]/g, "-") // Replace invalid characters with hyphen
      .replace(/\s+/g, "-") // Replace spaces with hyphen
      .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
      .toLowerCase()
  );
}

async function fileStreamDownload({
  url,
  title,
  ext,
  onProgress,
  downloadFolderPath = "./data",
}) {
  const filename = adjustTitleToFileName(title) + `.${ext}`;
  const response = await fetch(url);

  if (!response.ok || response?.body === null) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const totalBytes = Number(response.headers.get("content-length"));
  let downloadedBytes = 0;

  const writableStream = createWriteStream(
    path.join(downloadFolderPath, filename)
  );

  // Use readable stream to pipe the response data and track progress
  const readableStream = Readable.from(response.body);
  readableStream.on("data", (chunk) => {
    downloadedBytes += chunk.length;
    const progress = (downloadedBytes / totalBytes) * 100;
    onProgress(progress);
  });

  // Pipe the readable stream into the writable stream
  return new Promise((resolve, reject) => {
    readableStream.pipe(writableStream);

    writableStream.on("finish", resolve);
    writableStream.on("error", reject);
  });
}

module.exports = {
  fileStreamDownload,
  fetchElementsFromURL,
  gqlAPI,
  findPageAndDelete,
  upsertPage,
  findPageByPath,
};

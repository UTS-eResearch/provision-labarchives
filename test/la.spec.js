// Test to access your own notebooks and create a new Node
// in environtment variables add
// key as json string {"akid":"","password":""}
// USERNAME, PASSWORD

const assert = require('assert');
const util = require('util');
const xml2js = require('xml2js');
const parser = new xml2js.Parser({explicitArray: false});
const fs = require('fs-extra');

const la = require('../la');

const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

assert.notEqual(USERNAME, undefined, 'USERNAME missing; add environment variable');
assert.notEqual(PASSWORD, undefined, 'PASSWORD missing; add environment variable');

let key = {};

try {
  let keyString = process.env.KEY;
  if (!keyString) {
    key = fs.readJSONSync(process.cwd() + '/key.json');
  } else {
    key = JSON.parse(keyString);
  }
} catch (error) {
  assert.error(error, 'KEY missing; add environment variable');
  process.exit(error);
}
assert.notEqual(key, {}, 'KEY missing; add environment variable');

let userInfo = {};

describe('Login', function () {
  it('should return access info', function (done) {
    la.accessInfo(key, USERNAME, PASSWORD)
      .then((result) => {
        userInfo = result.users;
        assert(userInfo.email, USERNAME);
        done();
      })
      .catch((error) => {
        console.log(util.inspect(error, {depth: null}));
        done();
      });
  });
  it('should list users notebooks', function (done) {
    const isAuth = true;
    la.userInfoViaId(key, userInfo.id, isAuth)
      .then((result) => {
        const users = result.users;
        assert(users, 'responds with users');
        assert(users.notebooks, 'notebooks object exists');
        assert(Array.isArray(users.notebooks.notebook), 'Notebooks found');
        done();
      })
  })
});

let notebook = {};
describe('Notebook', function () {
  it('should get notebook info', function (done) {
    const dNB = la.getDefaultNoteBook(userInfo.notebooks);
    la
      .getNotebookInfo(key, userInfo.id, dNB.id)
      .then((result) => {
        notebook = result.notebooks.notebook;
        assert(notebook.name, dNB.id);
        // the is-student flag is always false in our PE (Professional Edition)
        done();
      })
      .catch((error) => {
        console.log(util.inspect(error, {depth: null}));
        done();
      });
  });
  let treeNodes = [];
  //In this case a notebook could be represented as a tree node
  it('should get notebook', function (done) {
    const dNB = la.getDefaultNoteBook(userInfo.notebooks);
    la
      .getTree(key, userInfo.id, notebook.id, '0')
      .then((result) => {
        const tree = result['tree-tools'];
        assert(tree);
        assert(tree['level-nodes']);
        treeNodes = tree['level-nodes'];
        done();
      })
      .catch((error) => {
        console.log(util.inspect(error, {depth: null}));
        done();
      });
  });

  let node = {};
  it('should insert node', function (done) {
    const displayText = 'Testing a inserting a node';
    la
      .insertNode(key, userInfo.id, notebook.id, 0, displayText, false)
      .then((result) => {
        const tree = result['tree-tools'];
        node = tree['node'];
        assert(node['display-text'], displayText);
        done();
      })
      .catch((error) => {
        console.log(util.inspect(error, {depth: null}));
      });
  });
  let entry = {};
  it('should add entry into node', function (done) {
    const workspaceId = 'https://google.com?search=WORKSPACES';
    const partType = 'plain text entry';
    la
      .addEntry(key, userInfo.id, notebook.id, node['tree-id'], partType, workspaceId)
      .then((result) => {
        const entries = result['entries'];
        entry = entries['entry'];
        assert(entry['part-type'], partType);
        done();
      })
      .catch((error) => {
        console.log(util.inspect(error, {depth: null}));
      });
  });
});



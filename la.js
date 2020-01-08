const axios = require('axios');
const crypto = require('crypto');
const tags = require('common-tags');
const _ = require('underscore');
const xml2js = require('xml2js');
const parser = new xml2js.Parser({explicitArray: false});

module.exports = {
  callAuthentication: function (key, method) {
    //returns sig and epoch generated by epoch + method + key
    const epoch = (new Date).getTime();
    const salt = key.akid + method + epoch;
    const hash = crypto.createHmac('sha1', key.password);
    hash.update(salt);
    return {sig: encodeURIComponent(hash.digest('base64')), expires: epoch};
  },
  institutionalLoginUrls: function (key, username, password) {
    const base = {
      baseURL: key.baseurl,
      timeout: 10000
    };
    const method = 'institutional_login_urls';
    const callAuth = this.callAuthentication(key, method);
    return axios
      .get(
        tags.oneLineTrim`
        ${key.baseurl}${key.api}/utilities/${method}
        ?login_or_email=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}
        &akid=${key.akid}&expires=${callAuth.expires}&sig=${callAuth.sig}
        `
        , base
      )
      .then((response) => {
        return new Promise(function (resolve, reject) {
          parser.parseString(response.data, function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
      .catch((error) => {
        return Promise.reject(error.message)
      })
  },
  accessInfo: function (key, username, password) {
    const base = {
      baseURL: key.baseurl,
      timeout: 10000
    };
    const method = 'user_access_info';
    const callAuth = this.callAuthentication(key, method);
    let req = `${key.baseurl}${key.api}/users/${method}`;
    req += `?login_or_email=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    req += `&akid=${key.akid}&expires=${callAuth.expires}&sig=${callAuth.sig}`;
    return axios
      .get(req, base)
      .then((response) => {
        return new Promise(function (resolve, reject) {
          parser.parseString(response.data, function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
      .catch((error) => {
        return Promise.reject(error.message)
      })
  },
  userInfoViaId: function (key, uid, isAuth) {
    const base = {
      baseURL: key.baseurl,
      timeout: 10000
    };
    const method = 'user_info_via_id';
    const callAuth = this.callAuthentication(key, method);
    const authenticated = isAuth ? '&=authenticated=true' : '';
    uid = encodeURIComponent(uid);
    const req = `${key.baseurl}${key.api}/users/${method}?uid=${uid}${authenticated}&akid=${key.akid}&expires=${callAuth.expires}&sig=${callAuth.sig}`;
    return axios
      .get(req, base)
      .then((response) => {
        return new Promise(function (resolve, reject) {
          parser.parseString(response.data, function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
      .catch((error) => {
        return Promise.reject(error.message)
      });
  },
  getDefaultNoteBook: function (userNBs) {
    return _.find(userNBs.notebook, (item) => {
      return item['is-default']._ === 'true';
    });
  },
  getNotebookInfo: function (key, uid, nbid) {
    const base = {
      baseURL: key.baseurl,
      timeout: 10000
    };
    const method = 'notebook_info';
    const callAuth = this.callAuthentication(key, method);
    uid = encodeURIComponent(uid);
    return axios
      .get(
        tags.oneLineTrim`
        ${key.baseurl}${key.api}/notebooks/${method}
        ?uid=${uid}&nbid=${nbid}
        &akid=${key.akid}&expires=${callAuth.expires}&sig=${callAuth.sig}
        `
        , base
      )
      .then((response) => {
        return new Promise(function (resolve, reject) {
          parser.parseString(response.data, function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
      .catch((error) => {
        return Promise.reject(error.message)
      })
  },
  getTree: function (key, uid, nbid, parentTreeId) {
    const base = {
      baseURL: key.baseurl,
      timeout: 10000
    };
    const method = 'get_tree_level';
    const callAuth = this.callAuthentication(key, method);
    uid = encodeURIComponent(uid);
    let req = `${key.baseurl}${key.api}/tree_tools/${method}`;
    req += `?uid=${uid}&nbid=${nbid}&parent_tree_id=${parentTreeId}`;
    req += `&akid=${key.akid}&expires=${callAuth.expires}&sig=${callAuth.sig}`;
    return axios
      .get(req, base)
      .then((response) => {
        return new Promise(function (resolve, reject) {
          parser.parseString(response.data, function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
      .catch((error) => {
        return Promise.reject(error.message)
      })
  },
  insertNode: function (key, uid, nbid, parentTreeId, displayText, isFolder) {
    const base = {
      baseURL: key.baseurl,
      timeout: 10000
    };
    const method = 'insert_node';
    const callAuth = this.callAuthentication(key, method);
    uid = encodeURIComponent(uid);
    let req = `${key.baseurl}${key.api}/tree_tools/${method}`;
    req += `?uid=${uid}&nbid=${nbid}&parent_tree_id=${parentTreeId}&display_text=${displayText}&is_folder=${isFolder}`;
    req += `&akid=${key.akid}&expires=${callAuth.expires}&sig=${callAuth.sig}`;
    return axios
      .get(req, base)
      .then((response) => {
        return new Promise(function (resolve, reject) {
          parser.parseString(response.data, function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
      .catch((error) => {
        let data = null;
        if (error && error.response && error.response.data) {
          data = error.response.data;
        }
        parser.parseString(data, function (err, result) {
          if (err) {
            return Promise.reject(err);
          } else {
            return Promise.reject(result);
          }
        });
      });
  },
  addEntry: function (key, uid, nbid, pid, partType, entryData) {
    const base = {
      baseURL: key.baseurl,
      timeout: 10000,
      headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
      responseType: 'blob'
    };
    const method = 'add_entry';
    const callAuth = this.callAuthentication(key, method);
    uid = encodeURIComponent(uid);
    let req = `${key.baseurl}${key.api}/entries/${method}`;
    req += `?uid=${uid}`;
    req += `&akid=${key.akid}&expires=${callAuth.expires}&sig=${callAuth.sig}`;
    return axios
      .post(req,
        `part_type=${partType}&pid=${pid}&nbid=${nbid}&entry_data=${entryData}`
        , base)
      .then((response) => {
        return new Promise(function (resolve, reject) {
          parser.parseString(response.data, function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
      .catch((error) => {
        return Promise.reject(error.message)
      });
  },
  createNotebook: function (key, uid, name, siteNotebookId, initialFolders) {
    const base = {
      baseURL: key.baseurl,
      timeout: 10000
    };
    const method = 'create_notebook';
    const callAuth = this.callAuthentication(key, method);
    uid = encodeURIComponent(uid);
    let req = `${key.baseurl}${key.api}/notebooks/${method}`;
    req += `?uid=${encodeURIComponent(uid)}`;
    req += `&name=${encodeURIComponent(name)}`;
    if (initialFolders) {
      req += `&initial_folders=${encodeURIComponent(initialFolders)}`;
    }
    if (siteNotebookId) {
      req += `&site_notebook_id=${encodeURIComponent(siteNotebookId)}`;
    }
    req += `&akid=${key.akid}&expires=${callAuth.expires}&sig=${callAuth.sig}`;
    return axios
      .get(req, base)
      .then((response) => {
        return new Promise(function (resolve, reject) {
          parser.parseString(response.data, function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
      .catch((error) => {
        let data = null;
        if (error && error.response && error.response.data) {
          data = error.response.data;
        }
        parser.parseString(data, function (err, result) {
          if (err) {
            return Promise.reject(err);
          } else {
            return Promise.reject(result);
          }
        });
      });
  },
  emailHasAccount: function (key, email) {
    const base = {
      baseURL: key.baseurl,
      timeout: 10000
    };
    const method = 'email_has_account';
    const callAuth = this.callAuthentication(key, method);
    let req = `${key.baseurl}${key.api}/users/${method}`;
    req += `?email=${encodeURIComponent(email)}`;
    req += `&akid=${key.akid}&expires=${callAuth.expires}&sig=${callAuth.sig}`;
    return axios
      .get(req, base)
      .then((response) => {
        return new Promise(function (resolve, reject) {
          parser.parseString(response.data, function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
      .catch((error) => {
        let data = null;
        if (error && error.response && error.response.data) {
          data = error.response.data;
        }
        parser.parseString(data, function (err, result) {
          if (err) {
            return Promise.reject(err);
          } else {
            return Promise.reject(result);
          }
        });
      });
  },
  addUserToNotebook: function (key, uid, nbid, email, userRole) {
    const base = {
      baseURL: key.baseurl,
      timeout: 10000
    };
    const method = 'add_user_to_notebook';
    const callAuth = this.callAuthentication(key, method);
    let req = `${key.baseurl}${key.api}/notebooks/${method}`;
    req += `?uid=${encodeURIComponent(uid)}`;
    req += `&nbid=${encodeURIComponent(nbid)}`;
    req += `&email=${encodeURIComponent(email)}`;
    if (userRole) {
      req += `&user_role=${encodeURIComponent(userRole)}`;
    }
    req += `&akid=${key.akid}&expires=${callAuth.expires}&sig=${callAuth.sig}`;
    return axios
      .get(req, base)
      .then((response) => {
        return new Promise(function (resolve, reject) {
          parser.parseString(response.data, function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
      .catch((error) => {
        let data = null;
        if (error && error.response && error.response.data) {
          data = error.response.data;
        }
        parser.parseString(data, function (err, result) {
          if (err) {
            return Promise.reject(err);
          } else {
            return Promise.reject(result);
          }
        });
      });
  },
  createUser: function (key, email, fullName, password) {
    const base = {
      baseURL: key.baseurl,
      timeout: 10000
    };
    const method = 'create_user_account';
    const callAuth = this.callAuthentication(key, method);
    let req = `${key.baseurl}${key.api}/users/${method}`;
    req += `?email=${encodeURIComponent(email)}`;
    if (fullName) {
      req += `&fullname=${encodeURIComponent(fullName)}`;
    }
    if (password) {
      req += `&password=${encodeURIComponent(password)}`;
    }
    req += `&akid=${key.akid}&expires=${callAuth.expires}&sig=${callAuth.sig}`;
    return axios
      .get(req, base)
      .then((response) => {
        return new Promise(function (resolve, reject) {
          parser.parseString(response.data, function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
      .catch((error) => {
        let data = null;
        if (error && error.response && error.response.data) {
          data = error.response.data;
        }
        parser.parseString(data, function (err, result) {
          if (err) {
            return Promise.reject(err);
          } else {
            return Promise.reject(result);
          }
        });
      });
  }
};

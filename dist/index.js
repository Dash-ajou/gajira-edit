require('./sourcemap-register.js');/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 975:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const _ = __nccwpck_require__(179)
const Jira = __nccwpck_require__(27)

module.exports = class {
  constructor ({ githubEvent, argv, config }) {
    this.Jira = new Jira({
      baseUrl: config.baseUrl,
      token: config.token,
      email: config.email,
    })

    this.config = config
    this.argv = argv
    this.githubEvent = githubEvent
  }

  async execute () {
    const { argv } = this

    const projectKey = argv.project
    const issueId = argv.issue

    const issue = await this.Jira.getIssue(issueId)
    if (!issue) {
      console.log(`Issue Not Found`);
      return
    }

    let providedFields = [{
      key: 'project',
      value: {
        key: projectKey,
      },
    }, {
      key: 'summary',
      value: argv.summary,
    }]

    if (argv.description) {
      providedFields.push({
        key: 'description',
        value: argv.description,
      })
    }

    if (argv.fields) {
      providedFields = [...providedFields, ...this.transformFields(argv.fields)]
    }

    const payload = providedFields.reduce((acc, field) => {
      acc.fields[field.key] = field.value

      return acc
    }, {
      fields: {},
    })

    await this.Jira.updateIssue(issueId, payload);

    // console.log(`transitionedIssue:${JSON.stringify(transitionedIssue, null, 4)}`)
    console.log(`Update ${issueId} complete.`)
    console.log(`Link to issue: ${this.config.baseUrl}/browse/${issueId}`)

    return {}
  }
}


/***/ }),

/***/ 27:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const { get } = __nccwpck_require__(179)

const serviceName = 'jira'
const { format } = __nccwpck_require__(16)
const client = __nccwpck_require__(644)(serviceName)

class Jira {
  constructor ({ baseUrl, token, email }) {
    this.baseUrl = baseUrl
    this.token = token
    this.email = email
  }

  async updateIssue (body) {
    return this.fetch('updateIssue',
      { pathname: '/rest/api/2/issue' },
      { method: 'PUT', body })
  }

  async getIssue (issueId, query = {}) {
    const { fields = [], expand = [] } = query

    try {
      return this.fetch('getIssue', {
        pathname: `/rest/api/2/issue/${issueId}`,
        query: {
          fields: fields.join(','),
          expand: expand.join(','),
        },
      })
    } catch (error) {
      if (get(error, 'res.status') === 404) {
        return
      }

      throw error
    }
  }

  async getIssueTransitions (issueId) {
    return this.fetch('getIssueTransitions', {
      pathname: `/rest/api/2/issue/${issueId}/transitions`,
    }, {
      method: 'GET',
    })
  }

  async transitionIssue (issueId, data) {
    return this.fetch('transitionIssue', {
      pathname: `/rest/api/2/issue/${issueId}/transitions`,
    }, {
      method: 'POST',
      body: data,
    })
  }

  async fetch (apiMethodName,
    { host, pathname, query },
    { method, body, headers = {} } = {}) {
    const url = format({
      host: host || this.baseUrl,
      pathname,
      query,
    })

    if (!method) {
      method = 'GET'
    }

    if (headers['Content-Type'] === undefined) {
      headers['Content-Type'] = 'application/json'
    }

    if (headers.Authorization === undefined) {
      headers.Authorization = `Basic ${Buffer.from(`${this.email}:${this.token}`).toString('base64')}`
    }

    // strong check for undefined
    // cause body variable can be 'false' boolean value
    if (body && headers['Content-Type'] === 'application/json') {
      body = JSON.stringify(body)
    }

    const state = {
      req: {
        method,
        headers,
        body,
        url,
      },
    }

    try {
      await client(state, `${serviceName}:${apiMethodName}`)
    } catch (error) {
      const fields = {
        originError: error,
        source: 'jira',
      }

      delete state.req.headers

      throw Object.assign(
        new Error('Jira API error'),
        state,
        fields
      )
    }

    return state.res.body
  }
}

module.exports = Jira


/***/ }),

/***/ 644:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const fetch = __nccwpck_require__(951)
// const moment = require('moment')

module.exports = serviceName => async (state, apiMethod = 'unknown') => {
  // const startTime = moment.now()

  const response = await fetch(state.req.url, state.req)

  state.res = {
    headers: response.headers.raw(),
    status: response.status,
  }

  // const totalTime = moment.now() - startTime
  // const tags = {
  //   api_method: apiMethod,
  //   method: state.req.method || 'GET',
  //   response_code: response.status,
  //   service: serviceName,
  // }

  state.res.body = await response.text()

  const isJSON = (response.headers.get('content-type') || '').includes('application/json')

  if (isJSON && state.res.body) {
    state.res.body = JSON.parse(state.res.body)
  }

  if (!response.ok) {
    throw new Error(response.statusText)
  }

  return state
}


/***/ }),

/***/ 721:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 179:
/***/ ((module) => {

module.exports = eval("require")("lodash");


/***/ }),

/***/ 951:
/***/ ((module) => {

module.exports = eval("require")("node-fetch");


/***/ }),

/***/ 581:
/***/ ((module) => {

module.exports = eval("require")("yaml");


/***/ }),

/***/ 896:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 16:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const fs = __nccwpck_require__(896)
const YAML = __nccwpck_require__(581)
const core = __nccwpck_require__(721)

const configPath = `${process.env.HOME}/jira/config.yml`
const Action = __nccwpck_require__(975)

// eslint-disable-next-line import/no-dynamic-require
const githubEvent = require(process.env.GITHUB_EVENT_PATH)
const config = YAML.parse(fs.readFileSync(configPath, 'utf8'))

async function exec () {
  try {
    const result = await new Action({
      githubEvent,
      argv: parseArgs(),
      config,
    }).execute()

    if (result) {
      const extendedConfig = Object.assign({}, config, result)

      fs.writeFileSync(configPath, YAML.stringify(extendedConfig))

      return
    }

    console.log('Failed to transition issue.')
    process.exit(78)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

function parseArgs () {
  const transition = core.getInput('transition')
  const transitionId = core.getInput('transitionId')

  if (!transition && !transitionId) {
    // Either transition _or_ transitionId _must_ be provided
    throw new Error('Error: please specify either a transition or transitionId')
  }

  return {
    issue: core.getInput('issue'),
    transition,
    transitionId,
  }
}

exec()

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.js.map
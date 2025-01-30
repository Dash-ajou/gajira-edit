const _ = require('lodash')
const Jira = require('./common/net/Jira')

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
    console.log(argv)

    const issueId = argv.issue

    const issue = await this.Jira.getIssue(issueId)
    if (!issue) {
      console.log(`Issue Not Found`);
      return
    }

    let providedFields = [{
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
      console.log(`fields.${field.key}: ${JSON.stringify(field.value)}`);

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

  transformFields (fieldsString) {
    const fields = JSON.parse(fieldsString)

    return Object.keys(fields).map(fieldKey => ({
      key: fieldKey,
      value: fields[fieldKey],
    }))
  }
}

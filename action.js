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

    const issueId = argv.issue

    const issue = await this.Jira.getIssue(issueId)
    if (!issue) {
      console.log(`Issue Not Found`);
      return
    }

    const subtasks = issue.fields?.subtasks
    .map(subtask => ({
      key: subtask.fields.summary,
      value: subtask.key
    }))
    .reduce((acc, {key, value}) => {
      acc[key] = value;
      return acc
    }, {});

    let providedFields = []

    if (argv.summary) {
      providedFields.push({
        key: 'summary',
        value: argv.summary,
      })
    }

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

    if (argv?.description) {
      payload.fields.description = await this.createSubtask(projectKey, issueKey, argv.description, subtasks);
    }
      
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

  async createSubtask(projectKey, issueKey, desc, subtasks) {
    let new_cnt = 0;
    const new_subtask_titles = [ ...desc.matchAll(/(\- \[).{0,}\n/g) ]
      .map(v => {
        const a = {
          origin: v[0],
          summary: v[0].replace(/^\s*-\s*\[(x|\s)?\]\s*/, "").replace(/\n+$/, "").trim(),
          loc: v.index
        };
        a.prefix = a.origin.replace(` ${a.summary}`, "");
        if (subtasks[a.summary]) {
          a.isNew = false;
          a.issueId = subtasks[a.summary];
          console.log(`registered subtask detected: ${a.summary}/${subtasks[a.summary]}`);
        } else {
          a.isNew = true;
          new_cnt++;
          console.log(`new subtask detected: ${a.summary}`);
        }
        return a;
      });

    await Promise.all(
      new_subtask_titles.map(async ({isNew, issueId, prefix, origin, summary}) => {
        if (!isNew) {
          let is_checked = origin.match(/- \[(x| )\]/);
          if (is_checked) {
            is_checked = ["x", "X"].includes(is_checked[1])
          } else is_checked = false;
          const updated_status = is_checked ? "완료" : "해야 할 일";

          const { transitions } = await this.Jira.getIssueTransitions(issueId)

          const transitionToApply = _.find(transitions, 
            (t) => (t.name.toLowerCase() === updated_status)
          );

          if (!transitionToApply) {
            console.log('Please specify transition name or transition id.')
            console.log('Possible transitions:')
            transitions.forEach((t) => {
              console.log(`{ id: ${t.id}, name: ${t.name} } transitions issue to '${t.to.name}' status.`)
            })

            return false;
          }

          console.log(`Selected transition:${JSON.stringify(transitionToApply, null, 4)}`)

          await this.Jira.transitionIssue(issueId, {
            transition: {
              id: transitionToApply.id,
            },
          })

          return true;
        }

        const issue = await this.Jira.createIssue({
          fields: {
            project: {key: projectKey},
            issuetype: {name: "Subtask"},
            summary,
            description: `
              h2. 하위 작업: ${ summary }
              
              h3. 작업이력
              - ${ this.getCurrentDateTime() } : 하위작업 자동생성 by ${ issueKey }

            `,
            parent: {key: issueKey}
          }
        });
        console.log(`subtask created: "${origin}" -> "${origin.replace(/\n+$/, "")} ${issue.key}"`);
        desc = desc.replace(origin, `${origin.replace(/\n+$/, "")} ${issue.key}\n`);
        return true;
      })
    )
    return desc;
  }
  getCurrentDateTime(date) {
    if (!date) {
      date = new Date();
      const utc = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
      const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
      date = new Date(utc + (KR_TIME_DIFF));
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}

# Jira Edit

Update edited issue content to Jira

> ##### Only supports Jira Cloud. Does not support Jira Server (hosted)

## Usage

> ##### Note: this action requires [Jira Login Action](https://github.com/marketplace/actions/jira-login)

Example transition action:

```yaml
  - name: Update Issue
    id: update
    uses: Dash-ajou/gajira-edit@main
    with:
      issue: "JIRA_KEY"
      project: 'DASH'
      issuetype: 'Task'
      summary: "ISSUE_TITLE"
      description: "DESCRIPTION_TEXT" # optional
      fields: #...
```

The `issue` parameter can be an issue id created or retrieved by an upstream action – for example, [`Create`](https://github.com/marketplace/actions/jira-create) or [`Find Issue Key`](https://github.com/marketplace/actions/jira-find). Here is full example workflow:

```yaml
on:
  push

name: Test Transition Issue

jobs:
  test-transition-issue:
    name: Transition Issue
    runs-on: ubuntu-latest
    steps:
    - name: Login
      uses: atlassian/gajira-login@v3
      env:
        JIRA_BASE_URL: ${{ secrets.JIRA_BASE_URL }}
        JIRA_USER_EMAIL: ${{ secrets.JIRA_USER_EMAIL }}
        JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
        
    - name: Create new issue
      id: create
      uses: atlassian/gajira-create@v3

    - name: Transition issue
      uses: atlassian/gajira-transition@v3
      with:
        issue: ${{ steps.create.outputs.issue }}
        transition: "In progress"
```
----
## Action Spec:

### Environment variables
- None

### Inputs
- `issue` (required) - Key of the issue to be transitioned
- `summary` - Issue summary
- `description` - Issue description
- `fields` - Additional fields in JSON format

### Outputs
- None

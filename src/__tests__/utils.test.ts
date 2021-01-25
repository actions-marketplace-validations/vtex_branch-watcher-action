import { getBranchOpenPRs } from '../utils'
import * as github from '@actions/github'

const client = github.getOctokit(process.env['GITHUB_API_TOKEN'] as string)
const repoId = { owner: 'vtex', repo: 'branch-watcher-action' }
const branch = 'test/label-pr'

test('Fetches the given branch PR', async () => {
  const prs = await getBranchOpenPRs({
    repo: repoId.repo,
    owner: repoId.owner,
    branch,
    client,
  })

  expect(prs.length).toEqual(1)
  expect(prs[0].head.ref).toEqual(branch)
})

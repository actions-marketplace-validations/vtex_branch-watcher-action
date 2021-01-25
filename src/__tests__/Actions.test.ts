import * as github from '@actions/github'
import { Actions } from '../Actions'
import { PRHelper } from '../PRHelper'

const client = github.getOctokit(process.env['GITHUB_API_TOKEN'] as string)
const repoId = { owner: 'vtex', repo: 'branch-watcher-action' }
const actionConfig = {
  targetBranch: 'beta',
  mergedLabelName: 'in-beta',
  staleMergedLabelName: 'in-beta-stale',
}

const resetPR = async (prHelper: PRHelper) => {
  const labels = await prHelper.listPRLabels()
  await prHelper.removeLabelIfExists(labels, actionConfig.mergedLabelName)
  await prHelper.removeLabelIfExists(labels, actionConfig.staleMergedLabelName)
}

test('Open PR is labeled with in-beta label when merged into targetBranch', async () => {
  const testBranch = `test/label-pr`
  const prHelper = await PRHelper.createInstanceGivenBranch(repoId, testBranch, client)
  await resetPR(prHelper)

  const actions = new Actions(
    {
      payload: {
        commits: [
          {
            message: `wololo`,
          },
          {
            message: `Merge branch '${testBranch}' into beta`,
          },
        ],
      },
      repo: repoId,
    } as any,
    client,
    actionConfig
  )

  await actions.mergeInTargetBranch()

  const labels = await prHelper.listPRLabels()
  expect(labels.length).toEqual(1)
  expect(labels[0].name).toEqual(actionConfig.mergedLabelName)
}, 20000)

test('Add stale label when PR is modified', async () => {
  const testBranch = 'test/stale-label-pr'
  const prHelper = await PRHelper.createInstanceGivenBranch(repoId, testBranch, client)
  await resetPR(prHelper)
  await prHelper.addLabelToPR(actionConfig.mergedLabelName)
  const actions = new Actions(
    {
      payload: {
        commits: [
          {
            message: `wololo`,
          },
        ],
        ref: `refs/head/${testBranch}`,
      },
      repo: repoId,
    } as any,
    client,
    actionConfig
  )

  await actions.pushOnNonTargetBranch()
  const labels = await prHelper.listPRLabels()
  expect(labels.length).toEqual(2)
  expect(prHelper.hasPRLabel(labels, actionConfig.mergedLabelName)).toBeTruthy()
  expect(prHelper.hasPRLabel(labels, actionConfig.staleMergedLabelName)).toBeTruthy()
}, 20000)

test(`Don't throw when PR is not open`, async () => {
  const testBranch = 'test/no_open_pr'
  const actions = new Actions(
    {
      payload: {
        commits: [
          {
            message: `wololo`,
          },
        ],
        ref: `refs/head/${testBranch}`,
      },
      repo: repoId,
    } as any,
    client,
    actionConfig
  )

  await expect(actions.pushOnNonTargetBranch()).resolves.toBeFalsy()
}, 20000)

/**
 * Planning-only dependency anchors for CodeGraph.
 *
 * This file is not application source. Never import, compile, or execute it as
 * part of the product. Its call edges encode the authorized competition task
 * order so T4 can inspect task impact before merging work.
 */

export function foundationTask(): void {}

export function demoEngineTask(): void {
  foundationTask()
}

export function webDemoTask(): void {
  foundationTask()
}

export function submissionPackageTask(): void {
  foundationTask()
}

export function integrationAndQaTask(): void {
  demoEngineTask()
  webDemoTask()
  submissionPackageTask()
}

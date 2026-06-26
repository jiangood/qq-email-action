# QQ Email Action Redesign

Date: 2026-06-26

## Purpose

Shift the GitHub Action's core functionality from "send files to QQ email" to "send QQ email with optional attachments". Attachments become optional, email body (text/HTML) becomes a first-class feature.

## Input Parameters

| Parameter | Required | Description | Default |
|-----------|----------|-------------|---------|
| `recipient-email` | yes | Recipient email address | — |
| `sender-email` | yes | Sender QQ email address | — |
| `subject` | no | Email subject | `QQ Email` |
| `body` | no | Email body content | — |
| `body-type` | no | Body type: `text` or `html` | `text` |
| `file-path` | no | Attachment file path or glob pattern | — |

## Behavior

- At least one of `body` or `file-path` must be provided, otherwise the action fails.
- If `file-path` is provided and matches multiple files, all matched files are attached to a **single** email.
- If `file-path` matches no files, the action fails.
- SMTP remains fixed to `smtp.qq.com:465` with SSL.
- Authentication via `QQMAIL_AUTH_CODE` environment variable.

## Files to Modify

- `action.yml` — update inputs (add `body`, `body-type`; make `file-path` optional)
- `src/main.js` — rewrite logic: body + optional attachments in single email
- `src/__tests__/main.test.js` — update tests for new behavior
- `README.md` — rewrite docs for new parameter set

## Non-Goals

- No CC/BCC support
- No priority flags
- No reply-to configuration
- No multiple-emails-per-file behavior (removed)

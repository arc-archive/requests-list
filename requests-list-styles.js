import { css } from 'lit-element';

export default css`:host {
  --anypoint-item-icon-width: 72px;
}

.request-list-item {
  font-weight: 400;
  cursor: pointer;
}

http-method-label {
  font-size: 14px;
  height: 52px;
  width: 52px;
  text-align: center;
  padding-top: 14px;
  margin-bottom: 0;
  box-sizing: border-box;
  border-radius: 50%;
  text-overflow: ellipsis;
  overflow: hidden;
}

.selected .request-list-item,
.request-list-item.selected {
  background-color: var(--request-list-item-selected-background-color, #E0E0E0);
}

:host([listtype="comfortable"]) anypoint-item-body,
:host([listtype="compact"]) anypoint-item-body {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
}

:host([listtype="comfortable"]) [secondary],
:host([listtype="compact"]) [secondary] {
  margin-left: 8px;
}

:host([listtype="comfortable"]) http-method-label {
  height: 40px;
  width: 40px;
  padding-top: 8px;
  font-size: 13px;
}

:host([listtype="compact"]) http-method-label {
  height: 28px;
  width: 28px;
  padding-top: 4px;
  font-size: 11px;
}

:host([listtype="comfortable"]) .request-list-item {
  min-height: var(--request-list-item-comfortable-min-height, 52px);
}

:host([listtype="compact"]) .request-list-item {
  min-height: var(--request-list-item-comfortable-compact-height, 36px);
}

:host([listtype="comfortable"]) .list-action-button {
  height: 32px;
}

:host([listtype="compact"]) .list-action-button {
  height: 24px;
}

.history-group-header {
  font-weight: var(--request-list-item-history-group-header-font-weigth, bold);
  color: var(--request-list-item-history-group-header-color, rgba(0, 0, 0, 0.67));
  padding: 24px 16px;
}

:host([listtype="comfortable"]) .history-group-header {
  padding: 16px;
}

:host([listtype="compact"]) .history-group-header {
  padding: 12px;
}

.select-text {
  -webkit-user-select: text;
  user-select: text;
}

.list-main-action {
  height: 36px;
  font-size: 14px;
}

.list-secondary-action {
  color: var(--request-list-item-secondary-action-color, var(--primary-color));
  height: 36px;
  font-size: 14px;
}`;

import { css } from 'lit-element';

export default css`
:host {
  display: flex;
  flex-direction: column;
  position: relative;
}

progress {
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
}

.list {
  flex: 1;
  overflow: auto;
}

.content-actions {
  display: flex;
  align-items: center;
  border-bottom: 1px #E5E5E5 solid;
  background-color: #fff;
  padding: 4px 0;
}

.content-actions anypoint-icon-button {
  margin: 0 2px;
}

.content-actions arc-icon {
  color: #000;
}

.selection-divider {
  height: 24px;
  border: 1px solid #E5E5E5;
  width: 0px;
  margin-left: 12px;
  margin-right: 12px;
}

.search-input {
  margin: 0;
}
`;

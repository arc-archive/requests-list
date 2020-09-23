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

.list-empty,
.search-empty {
  margin: 40px auto;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.delete-container {
  display: flex;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.delete-container, 
.delete-all-overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.delete-all-overlay {
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.72);
}

.delete-all-dialog {
  background-color: #fff;
  padding: 24px;
  position: relative;
  z-index: 11;
  border-radius: 12px;
}

.buttons {
  margin-top: 20px;
  display: flex;
  align-items: center;
}

.right-button {
  margin-left: auto;
}

.dialog h2 {
  margin-top: 0;
  margin-bottom: 28px;
}

.snackbar-button {
  color: #fff;
}

bottom-sheet {
  width: var(--bottom-sheet-width, 100%);
  max-width: var(--bottom-sheet-max-width, 700px);
  right: var(--history-panel-bottom-sheet-right, 40px);
  left: var(--history-panel-bottom-sheet-left, auto);
}
`;
